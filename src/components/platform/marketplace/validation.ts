import { z } from 'zod';

// Vendor Registration Schema
export const vendorRegistrationSchema = z.object({
  businessName: z.string().min(2, 'Business name is required'),
  businessNameAr: z.string().optional(),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  contactName: z.string().min(2, 'Contact name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(9, 'Valid phone number is required'),
  whatsappNumber: z.string().optional(),
  city: z.string().default('Port Sudan'),
  address: z.string().optional(),
  taxId: z.string().optional(),
  linkToAccount: z.boolean().optional().default(false),
});

export type VendorRegistrationData = z.infer<typeof vendorRegistrationSchema>;

// Vendor Approval Schema (admin only)
export const vendorApprovalSchema = z.object({
  vendorId: z.string().cuid(),
  action: z.enum(['approve', 'reject', 'suspend']),
  reason: z.string().optional(),
});

export type VendorApprovalData = z.infer<typeof vendorApprovalSchema>;

// Service Listing Schema
export const serviceListingSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  titleAr: z.string().optional(),
  description: z.string().min(10, 'Description is required'),
  descriptionAr: z.string().optional(),
  details: z.string().optional(),
  detailsAr: z.string().optional(),
  categoryId: z.string().cuid('Category is required'),
  priceMin: z.number().positive('Price must be positive'),
  priceMax: z.number().positive().optional(),
  currency: z.enum(['SDG', 'USD']).default('SDG'),
  priceNote: z.string().optional(),
  priceNoteAr: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
  serviceArea: z.string().default('Port Sudan'),
  capacity: z.string().optional(),
  specifications: z.record(z.string(), z.unknown()).optional(),
}).refine(
  (data) => {
    if (data.priceMax && data.priceMax < data.priceMin) {
      return false;
    }
    return true;
  },
  { message: 'Max price must be greater than min price', path: ['priceMax'] }
);

export type ServiceListingData = z.infer<typeof serviceListingSchema>;

// Service Request Schema
export const serviceRequestSchema = z.object({
  serviceId: z.string().cuid('Service is required'),
  requesterName: z.string().min(2, 'Name is required'),
  requesterPhone: z.string().min(9, 'Phone number is required'),
  requesterEmail: z.string().email().optional().or(z.literal('')),
  requesterWhatsApp: z.string().optional(),
  message: z.string().optional(),
  quantity: z.number().int().positive().default(1),
  preferredDate: z.date().optional(),
});

export type ServiceRequestData = z.infer<typeof serviceRequestSchema>;

// Contact View Schema (tracking)
export const contactViewSchema = z.object({
  requestId: z.string().cuid(),
  contactMethod: z.enum(['whatsapp', 'phone', 'email']),
});

export type ContactViewData = z.infer<typeof contactViewSchema>;

// Filter schemas for queries
export const vendorFilterSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED']).optional(),
  city: z.string().optional(),
  search: z.string().optional(),
});

export const serviceFilterSchema = z.object({
  categoryType: z.enum(['TRUCK', 'FORKLIFT', 'MANPOWER', 'TOOLS']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  priceMin: z.number().optional(),
  priceMax: z.number().optional(),
  serviceArea: z.string().optional(),
  vendorId: z.string().cuid().optional(),
  search: z.string().optional(),
});

export const requestFilterSchema = z.object({
  status: z.enum(['PENDING', 'CONTACTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  vendorId: z.string().cuid().optional(),
  serviceId: z.string().cuid().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
});
