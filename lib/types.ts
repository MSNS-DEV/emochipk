// User & Auth Types
export type UserRole = 'ADMIN' | 'BRANCH_MANAGER' | 'WAREHOUSE_STAFF' | 'CUSTOMER' | 'GUEST';

export interface User {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  defaultShippingAddressId?: string;
  defaultBillingAddressId?: string;
}

export interface Address {
  id: string;
  userId?: string;
  fullName: string;
  phone: string;
  streetAddress: string;
  apartment?: string;
  city: string;
  province: string;
  postalCode?: string;
  country: string;
  isDefault: boolean;
  label?: string;
}

// Product Types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  children?: Category[];
  isActive: boolean;
  sortOrder: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  shortDescription?: string;
  basePrice: number;
  salePrice?: number;
  categoryId: string;
  category?: Category;
  material?: string;
  gender: 'MENS' | 'WOMENS' | 'UNISEX';
  isActive: boolean;
  isFeatured: boolean;
  isNew: boolean;
  tags: string[];
  images: ProductImage[];
  variants: ProductVariant[];
  reviews?: Review[];
  averageRating?: number;
  reviewCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  altText?: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  size: string;
  color: string;
  colorHex?: string;
  width: 'NARROW' | 'STANDARD' | 'WIDE';
  priceAdjustment: number;
  isActive: boolean;
  inventory: InventoryItem[];
}

export interface InventoryItem {
  id: string;
  variantId: string;
  branchId: string;
  branch?: Branch;
  quantity: number;
  reservedQuantity: number;
  reorderPoint: number;
  lastRestockedAt?: Date;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  phone: string;
  email?: string;
  isActive: boolean;
  isPrimaryWarehouse: boolean;
}

// Cart Types
export interface Cart {
  id: string;
  userId?: string;
  sessionId?: string;
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  taxAmount: number;
  total: number;
  couponCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  id: string;
  cartId: string;
  variantId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  variant?: any; // CatalogVariant from lib/data.ts — typed as any to avoid circular imports
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// Order Types
export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAYMENT_CONFIRMED'
  | 'COD_VERIFICATION_PENDING'
  | 'COD_VERIFIED'
  | 'PROCESSING'
  | 'ASSIGNED_TO_BRANCH'
  | 'PICKING'
  | 'PACKED'
  | 'READY_FOR_DISPATCH'
  | 'DISPATCHED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURN_APPROVED'
  | 'RETURN_RECEIVED'
  | 'REFUNDED'
  | 'EXCHANGE_REQUESTED';

export type PaymentMethod = 'COD' | 'RAAST' | 'JAZZCASH' | 'EASYPAISA' | 'CARD' | 'BANK_TRANSFER';

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  user?: User;
  guestEmail?: string;
  guestPhone?: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: 'PENDING' | 'PAID' | 'PARTIALLY_REFUNDED' | 'REFUNDED' | 'FAILED';
  shippingAddress: Address;
  billingAddress?: Address;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  codFee: number;
  taxAmount: number;
  total: number;
  couponCode?: string;
  notes?: string;
  assignedBranchId?: string;
  assignedBranch?: Branch;
  trackingNumber?: string;
  courierCode?: string;
  estimatedDeliveryDate?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  variantId: string;
  variant?: ProductVariant & { product?: Product };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: 'PENDING' | 'FULFILLED' | 'CANCELLED' | 'RETURNED';
}

// Review Types
export interface Review {
  id: string;
  productId: string;
  userId: string;
  user?: User;
  orderId?: string;
  rating: number;
  title?: string;
  comment?: string;
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  images?: string[];
  helpfulCount: number;
  createdAt: Date;
}

// Wishlist Types
export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  product?: Product;
  variantId?: string;
  variant?: ProductVariant;
  addedAt: Date;
}

// Size Memory Types
export interface SizeMemory {
  id: string;
  userId: string;
  categoryId: string;
  category?: Category;
  size: string;
  width: 'NARROW' | 'STANDARD' | 'WIDE';
  notes?: string;
  updatedAt: Date;
}

// Store Credit Types
export interface StoreCredit {
  id: string;
  userId: string;
  balance: number;
  lifetimeEarned: number;
  lifetimeUsed: number;
}

// Loyalty Types
export interface LoyaltyAccount {
  id: string;
  userId: string;
  points: number;
  lifetimePoints: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  tierExpiresAt?: Date;
}

// Filter & Search Types
export interface ProductFilters {
  categoryId?: string;
  gender?: 'MENS' | 'WOMENS' | 'UNISEX';
  sizes?: string[];
  colors?: string[];
  widths?: ('NARROW' | 'STANDARD' | 'WIDE')[];
  priceMin?: number;
  priceMax?: number;
  materials?: string[];
  isNew?: boolean;
  isFeatured?: boolean;
  onSale?: boolean;
  inStock?: boolean;
  search?: string;
  sortBy?: 'newest' | 'price-asc' | 'price-desc' | 'rating' | 'popularity';
}

// Pagination Types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
