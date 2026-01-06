'use server';

import { revalidatePath } from 'next/cache';
import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import type { VendorStatus, ServiceRequestStatus } from '@prisma/client';
import {
  vendorRegistrationSchema,
  vendorApprovalSchema,
  serviceListingSchema,
  serviceRequestSchema,
  contactViewSchema,
  type VendorRegistrationData,
  type VendorApprovalData,
  type ServiceListingData,
  type ServiceRequestData,
  type ContactViewData,
} from './validation';
import type { ServiceFilters, VendorFilters, RequestFilters } from './types';

// ============================================
// PAGINATION DEFAULTS
// ============================================
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

// ============================================
// HELPER: Generate unique request number (atomic)
// Uses timestamp + random suffix to avoid race conditions
// ============================================
function generateRequestNumber(): string {
  const prefix = 'SR';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}${random}`;
}

// ============================================
// HELPER: Normalize phone number for WhatsApp
// ============================================
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters except leading +
  const cleaned = phone.replace(/[^\d+]/g, '');
  // If starts with 0, assume Sudan country code
  if (cleaned.startsWith('0')) {
    return '249' + cleaned.substring(1);
  }
  // Remove leading + if present
  return cleaned.replace(/^\+/, '');
}

// ============================================
// SERVICE CATEGORY ACTIONS (cached for 1 hour)
// ============================================

const getCachedCategories = unstable_cache(
  async () => {
    return db.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { services: { where: { isActive: true, vendor: { status: 'APPROVED' } } } },
        },
      },
    });
  },
  ['service-categories'],
  { revalidate: 3600, tags: ['marketplace-categories'] }
);

export async function getServiceCategories() {
  try {
    const categories = await getCachedCategories();
    return { success: true, categories };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return { success: false, error: 'Failed to fetch categories' };
  }
}

// ============================================
// VENDOR ACTIONS
// ============================================

export async function registerVendor(data: VendorRegistrationData) {
  try {
    const validated = vendorRegistrationSchema.parse(data);

    // Check for existing vendor with same email (use generic error to prevent enumeration)
    const existing = await db.vendor.findUnique({
      where: { email: validated.email },
    });

    if (existing) {
      // Generic error message to prevent email enumeration attacks
      return { success: false, error: 'Registration failed. Please try again or contact support.' };
    }

    // If user is authenticated and wants to link account
    let userId: string | undefined;
    if (validated.linkToAccount) {
      const session = await auth();
      if (session?.user?.id) {
        const existingVendorLink = await db.vendor.findUnique({
          where: { userId: session.user.id },
        });
        if (existingVendorLink) {
          return { success: false, error: 'Your account is already linked to a vendor profile' };
        }
        userId = session.user.id;
      }
    }

    const vendor = await db.vendor.create({
      data: {
        businessName: validated.businessName,
        businessNameAr: validated.businessNameAr,
        description: validated.description,
        descriptionAr: validated.descriptionAr,
        contactName: validated.contactName,
        email: validated.email,
        phone: validated.phone,
        whatsappNumber: validated.whatsappNumber,
        city: validated.city,
        address: validated.address,
        taxId: validated.taxId,
        userId,
        status: 'PENDING',
      },
    });

    revalidatePath('/marketplace');

    return { success: true, vendor };
  } catch (error) {
    console.error('Error registering vendor:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to register vendor',
    };
  }
}

export async function getVendor(id: string) {
  try {
    const vendor = await db.vendor.findUnique({
      where: { id },
      include: {
        services: {
          where: { isActive: true },
          include: { category: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!vendor) {
      return { success: false, error: 'Vendor not found' };
    }

    return { success: true, vendor };
  } catch (error) {
    console.error('Error fetching vendor:', error);
    return { success: false, error: 'Failed to fetch vendor' };
  }
}

export async function getVendors(filters?: VendorFilters) {
  try {
    const session = await auth();
    const isAdmin = session?.user?.role === 'ADMIN';

    const where: Record<string, unknown> = {};

    // Non-admins can only see approved vendors
    if (!isAdmin) {
      where.status = 'APPROVED';
    } else if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.city) {
      where.city = filters.city;
    }

    if (filters?.search) {
      where.OR = [
        { businessName: { contains: filters.search, mode: 'insensitive' } },
        { businessNameAr: { contains: filters.search } },
        { contactName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const vendors = await db.vendor.findMany({
      where,
      include: {
        services: {
          where: { isActive: true },
          select: { id: true, categoryId: true },
        },
        _count: {
          select: { services: true, requests: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, vendors };
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return { success: false, error: 'Failed to fetch vendors' };
  }
}

export async function updateVendorStatus(data: VendorApprovalData) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' };
    }

    const validated = vendorApprovalSchema.parse(data);

    const statusMap: Record<string, VendorStatus> = {
      approve: 'APPROVED',
      reject: 'REJECTED',
      suspend: 'SUSPENDED',
    };

    const vendor = await db.vendor.update({
      where: { id: validated.vendorId },
      data: {
        status: statusMap[validated.action],
        approvedAt: validated.action === 'approve' ? new Date() : undefined,
        approvedBy: validated.action === 'approve' ? session.user.id : undefined,
        rejectionReason: validated.action === 'reject' ? validated.reason : undefined,
      },
    });

    revalidatePath('/marketplace');

    return { success: true, vendor };
  } catch (error) {
    console.error('Error updating vendor status:', error);
    return { success: false, error: 'Failed to update vendor status' };
  }
}

export async function getMyVendorProfile() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    const vendor = await db.vendor.findUnique({
      where: { userId: session.user.id },
      include: {
        services: {
          include: { category: true },
          orderBy: { createdAt: 'desc' },
        },
        requests: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { service: true },
        },
      },
    });

    return { success: true, vendor };
  } catch (error) {
    console.error('Error fetching vendor profile:', error);
    return { success: false, error: 'Failed to fetch vendor profile' };
  }
}

// ============================================
// SERVICE LISTING ACTIONS
// ============================================

export async function createServiceListing(data: ServiceListingData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    const vendor = await db.vendor.findUnique({
      where: { userId: session.user.id },
    });

    if (!vendor) {
      return { success: false, error: 'You must have a vendor profile to create listings' };
    }

    if (vendor.status !== 'APPROVED') {
      return { success: false, error: 'Your vendor account must be approved to create listings' };
    }

    const validated = serviceListingSchema.parse(data);

    const listing = await db.serviceListing.create({
      data: {
        title: validated.title,
        titleAr: validated.titleAr,
        description: validated.description,
        descriptionAr: validated.descriptionAr,
        details: validated.details,
        detailsAr: validated.detailsAr,
        priceMin: validated.priceMin,
        priceMax: validated.priceMax,
        currency: validated.currency,
        priceNote: validated.priceNote,
        priceNoteAr: validated.priceNoteAr,
        imageUrl: validated.imageUrl || null,
        isActive: validated.isActive,
        serviceArea: validated.serviceArea,
        capacity: validated.capacity,
        specifications: validated.specifications,
        vendorId: vendor.id,
        categoryId: validated.categoryId,
      },
      include: { category: true },
    });

    revalidatePath('/marketplace');

    return { success: true, listing };
  } catch (error) {
    console.error('Error creating listing:', error);
    return { success: false, error: 'Failed to create listing' };
  }
}

export async function updateServiceListing(id: string, data: Partial<ServiceListingData>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    const existing = await db.serviceListing.findUnique({
      where: { id },
      include: { vendor: true },
    });

    if (!existing) {
      return { success: false, error: 'Listing not found' };
    }

    if (existing.vendor.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return { success: false, error: 'Not authorized to update this listing' };
    }

    const listing = await db.serviceListing.update({
      where: { id },
      data,
      include: { category: true },
    });

    revalidatePath('/marketplace');
    revalidatePath(`/marketplace/${id}`);

    return { success: true, listing };
  } catch (error) {
    console.error('Error updating listing:', error);
    return { success: false, error: 'Failed to update listing' };
  }
}

export async function toggleListingStatus(id: string, isActive: boolean) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    const existing = await db.serviceListing.findUnique({
      where: { id },
      include: { vendor: true },
    });

    if (!existing) {
      return { success: false, error: 'Listing not found' };
    }

    if (existing.vendor.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return { success: false, error: 'Not authorized' };
    }

    const listing = await db.serviceListing.update({
      where: { id },
      data: { isActive },
    });

    revalidatePath('/marketplace');

    return { success: true, listing };
  } catch (error) {
    console.error('Error toggling listing status:', error);
    return { success: false, error: 'Failed to update listing status' };
  }
}

export async function getServices(
  filters?: ServiceFilters,
  pagination?: { page?: number; pageSize?: number }
) {
  try {
    const page = Math.max(1, pagination?.page || 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, pagination?.pageSize || DEFAULT_PAGE_SIZE));
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {
      isActive: true,
      vendor: { status: 'APPROVED' },
    };

    if (filters?.category && filters.category !== 'ALL') {
      where.category = { type: filters.category };
    }

    if (filters?.serviceArea) {
      where.serviceArea = filters.serviceArea;
    }

    if (filters?.vendorId) {
      where.vendorId = filters.vendorId;
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { titleAr: { contains: filters.search } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [listings, total] = await Promise.all([
      db.serviceListing.findMany({
        where,
        include: {
          vendor: {
            select: {
              id: true,
              businessName: true,
              businessNameAr: true,
              whatsappNumber: true,
              phone: true,
              email: true,
              logoUrl: true,
              city: true,
            },
          },
          category: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      db.serviceListing.count({ where }),
    ]);

    return {
      success: true,
      listings,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasMore: skip + listings.length < total,
      },
    };
  } catch (error) {
    console.error('Error fetching listings:', error);
    return { success: false, error: 'Failed to fetch listings' };
  }
}

export async function getService(id: string) {
  try {
    const listing = await db.serviceListing.findUnique({
      where: { id },
      include: {
        vendor: true,
        category: true,
      },
    });

    if (!listing) {
      return { success: false, error: 'Service not found' };
    }

    // Verify vendor is approved and listing is active for public access
    if (!listing.isActive || listing.vendor.status !== 'APPROVED') {
      return { success: false, error: 'Service not available' };
    }

    return { success: true, listing };
  } catch (error) {
    console.error('Error fetching listing:', error);
    return { success: false, error: 'Failed to fetch listing' };
  }
}

// ============================================
// SERVICE REQUEST ACTIONS
// ============================================

export async function createServiceRequest(data: ServiceRequestData) {
  try {
    const validated = serviceRequestSchema.parse(data);

    // Validate quantity is positive
    if (validated.quantity && validated.quantity < 1) {
      return { success: false, error: 'Invalid quantity' };
    }

    const service = await db.serviceListing.findUnique({
      where: { id: validated.serviceId },
      include: { vendor: true },
    });

    // Check service exists, is active, and vendor is approved
    if (!service || !service.isActive || service.vendor.status !== 'APPROVED') {
      return { success: false, error: 'Service not available' };
    }

    const session = await auth();
    const requesterId = session?.user?.id;

    const requestNumber = generateRequestNumber();

    const request = await db.serviceRequest.create({
      data: {
        requestNumber,
        serviceId: service.id,
        vendorId: service.vendorId,
        requesterId,
        requesterName: validated.requesterName,
        requesterPhone: validated.requesterPhone,
        requesterEmail: validated.requesterEmail || null,
        requesterWhatsApp: validated.requesterWhatsApp,
        message: validated.message,
        quantity: validated.quantity,
        preferredDate: validated.preferredDate,
        status: 'PENDING',
      },
      include: {
        service: { include: { category: true } },
        vendor: {
          select: {
            businessName: true,
            businessNameAr: true,
            whatsappNumber: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    revalidatePath('/marketplace');

    return { success: true, request };
  } catch (error) {
    console.error('Error creating request:', error);
    return { success: false, error: 'Failed to create request' };
  }
}

export async function recordContactView(data: ContactViewData) {
  try {
    const validated = contactViewSchema.parse(data);

    const request = await db.serviceRequest.update({
      where: { id: validated.requestId },
      data: {
        contactViewedAt: new Date(),
        contactMethod: validated.contactMethod,
        status: 'CONTACTED',
      },
    });

    return { success: true, request };
  } catch (error) {
    console.error('Error recording contact view:', error);
    return { success: false, error: 'Failed to record contact view' };
  }
}

export async function updateRequestStatus(
  requestId: string,
  status: ServiceRequestStatus,
  notes?: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    const existing = await db.serviceRequest.findUnique({
      where: { id: requestId },
      include: { vendor: true },
    });

    if (!existing) {
      return { success: false, error: 'Request not found' };
    }

    if (existing.vendor.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return { success: false, error: 'Not authorized' };
    }

    const request = await db.serviceRequest.update({
      where: { id: requestId },
      data: {
        status,
        vendorNotes: notes,
        completedAt: status === 'COMPLETED' ? new Date() : undefined,
      },
    });

    revalidatePath('/marketplace');

    return { success: true, request };
  } catch (error) {
    console.error('Error updating request status:', error);
    return { success: false, error: 'Failed to update request' };
  }
}

export async function getVendorRequests(filters?: RequestFilters) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    const vendor = await db.vendor.findUnique({
      where: { userId: session.user.id },
    });

    if (!vendor) {
      return { success: false, error: 'No vendor profile found' };
    }

    const where: Record<string, unknown> = {
      vendorId: vendor.id,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.serviceId) {
      where.serviceId = filters.serviceId;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        (where.createdAt as Record<string, unknown>).gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        (where.createdAt as Record<string, unknown>).lte = filters.dateTo;
      }
    }

    const requests = await db.serviceRequest.findMany({
      where,
      include: {
        service: { include: { category: true } },
        requester: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, requests };
  } catch (error) {
    console.error('Error fetching vendor requests:', error);
    return { success: false, error: 'Failed to fetch requests' };
  }
}

export async function getMyRequests() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    const requests = await db.serviceRequest.findMany({
      where: { requesterId: session.user.id },
      include: {
        service: { include: { category: true } },
        vendor: {
          select: {
            id: true,
            businessName: true,
            businessNameAr: true,
            whatsappNumber: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, requests };
  } catch (error) {
    console.error('Error fetching user requests:', error);
    return { success: false, error: 'Failed to fetch requests' };
  }
}
