import type {
  ServiceCategoryType,
  VendorStatus,
  ServiceRequestStatus,
} from '@prisma/client';

export interface Vendor {
  id: string;
  businessName: string;
  businessNameAr: string | null;
  description: string | null;
  descriptionAr: string | null;
  contactName: string;
  email: string;
  phone: string;
  whatsappNumber: string | null;
  city: string;
  address: string | null;
  taxId: string | null;
  status: VendorStatus;
  appliedAt: Date;
  approvedAt: Date | null;
  logoUrl: string | null;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceCategory {
  id: string;
  type: ServiceCategoryType;
  name: string;
  nameAr: string;
  description: string | null;
  descriptionAr: string | null;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface ServiceListing {
  id: string;
  title: string;
  titleAr: string | null;
  description: string;
  descriptionAr: string | null;
  details: string | null;
  detailsAr: string | null;
  priceMin: number;
  priceMax: number | null;
  currency: string;
  priceNote: string | null;
  priceNoteAr: string | null;
  imageUrl: string | null;
  isActive: boolean;
  serviceArea: string;
  capacity: string | null;
  specifications: Record<string, unknown> | null;
  vendorId: string;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceListingWithRelations extends ServiceListing {
  vendor: Vendor;
  category: ServiceCategory;
}

export interface ServiceRequest {
  id: string;
  requestNumber: string;
  status: ServiceRequestStatus;
  requesterName: string;
  requesterPhone: string;
  requesterEmail: string | null;
  requesterWhatsApp: string | null;
  message: string | null;
  quantity: number;
  preferredDate: Date | null;
  contactViewedAt: Date | null;
  contactMethod: string | null;
  vendorNotes: string | null;
  adminNotes: string | null;
  serviceId: string;
  vendorId: string;
  requesterId: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

export interface ServiceRequestWithRelations extends ServiceRequest {
  service: ServiceListingWithRelations;
  vendor: Vendor;
}

export type ServiceCategoryFilter = ServiceCategoryType | 'ALL';

export interface ServiceFilters {
  category?: ServiceCategoryFilter;
  search?: string;
  serviceArea?: string;
  vendorId?: string;
}

export interface VendorFilters {
  status?: VendorStatus;
  city?: string;
  search?: string;
}

export interface RequestFilters {
  status?: ServiceRequestStatus;
  vendorId?: string;
  serviceId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  error?: string;
  listings?: T[];
  pagination?: PaginationInfo;
}
