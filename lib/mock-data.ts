import type {
  User,
  Category,
  Product,
  ProductVariant,
  Branch,
  Order,
  Review,
  Address,
} from './types';

// Branches
export const branches: Branch[] = [
  {
    id: 'branch-1',
    name: 'Executive Mochi Pasrur',
    code: 'PSR',
    address: 'Main Bazaar, Near Clock Tower',
    city: 'Pasrur',
    phone: '+92 300 1234567',
    email: 'pasrur@executivemochi.pk',
    isActive: true,
    isPrimaryWarehouse: true,
  },
  {
    id: 'branch-2',
    name: 'Executive Mochi Daska',
    code: 'DSK',
    address: 'GT Road, Opposite City Park',
    city: 'Daska',
    phone: '+92 300 7654321',
    email: 'daska@executivemochi.pk',
    isActive: true,
    isPrimaryWarehouse: false,
  },
];

// Categories
export const categories: Category[] = [
  {
    id: 'cat-1',
    name: 'Formal Shoes',
    slug: 'formal-shoes',
    description: 'Premium leather formal shoes for the distinguished gentleman',
    imageUrl: '/images/categories/formal.jpg',
    isActive: true,
    sortOrder: 1,
    children: [
      {
        id: 'cat-1-1',
        name: 'Oxford',
        slug: 'oxford',
        parentId: 'cat-1',
        isActive: true,
        sortOrder: 1,
      },
      {
        id: 'cat-1-2',
        name: 'Derby',
        slug: 'derby',
        parentId: 'cat-1',
        isActive: true,
        sortOrder: 2,
      },
      {
        id: 'cat-1-3',
        name: 'Monk Strap',
        slug: 'monk-strap',
        parentId: 'cat-1',
        isActive: true,
        sortOrder: 3,
      },
    ],
  },
  {
    id: 'cat-2',
    name: 'Casual Shoes',
    slug: 'casual-shoes',
    description: 'Comfortable and stylish casual footwear',
    imageUrl: '/images/categories/casual.jpg',
    isActive: true,
    sortOrder: 2,
    children: [
      {
        id: 'cat-2-1',
        name: 'Loafers',
        slug: 'loafers',
        parentId: 'cat-2',
        isActive: true,
        sortOrder: 1,
      },
      {
        id: 'cat-2-2',
        name: 'Boat Shoes',
        slug: 'boat-shoes',
        parentId: 'cat-2',
        isActive: true,
        sortOrder: 2,
      },
    ],
  },
  {
    id: 'cat-3',
    name: 'Boots',
    slug: 'boots',
    description: 'Rugged and refined boots for every occasion',
    imageUrl: '/images/categories/boots.jpg',
    isActive: true,
    sortOrder: 3,
    children: [
      {
        id: 'cat-3-1',
        name: 'Chelsea Boots',
        slug: 'chelsea-boots',
        parentId: 'cat-3',
        isActive: true,
        sortOrder: 1,
      },
      {
        id: 'cat-3-2',
        name: 'Chukka Boots',
        slug: 'chukka-boots',
        parentId: 'cat-3',
        isActive: true,
        sortOrder: 2,
      },
    ],
  },
  {
    id: 'cat-4',
    name: 'Sandals',
    slug: 'sandals',
    description: 'Traditional and modern sandals',
    imageUrl: '/images/categories/sandals.jpg',
    isActive: true,
    sortOrder: 4,
  },
  {
    id: 'cat-5',
    name: 'Khussas',
    slug: 'khussas',
    description: 'Traditional Pakistani handcrafted khussas',
    imageUrl: '/images/categories/khussas.jpg',
    isActive: true,
    sortOrder: 5,
  },
];

// Available sizes and colors
export const availableSizes = ['6', '7', '8', '9', '10', '11', '12'];
export const availableColors = [
  { name: 'Black', hex: '#1a1a1a' },
  { name: 'Brown', hex: '#8B4513' },
  { name: 'Tan', hex: '#D2B48C' },
  { name: 'Burgundy', hex: '#722F37' },
  { name: 'Navy', hex: '#1a1a3e' },
  { name: 'Cognac', hex: '#9A463D' },
];

// Generate variants for a product
function generateVariants(productId: string, basePrice: number): ProductVariant[] {
  const variants: ProductVariant[] = [];
  const colors = availableColors.slice(0, 3); // Each product has 3 color options
  
  colors.forEach((color, colorIndex) => {
    availableSizes.forEach((size, sizeIndex) => {
      const variantId = `${productId}-${color.name.toLowerCase()}-${size}`;
      variants.push({
        id: variantId,
        productId,
        sku: `EM-${productId.split('-')[1]}-${color.name.substring(0, 3).toUpperCase()}-${size}`,
        size,
        color: color.name,
        colorHex: color.hex,
        width: 'STANDARD',
        priceAdjustment: 0,
        isActive: true,
        inventory: [
          {
            id: `inv-${variantId}-1`,
            variantId,
            branchId: 'branch-1',
            quantity: Math.floor(Math.random() * 15) + 2,
            reservedQuantity: 0,
            reorderPoint: 3,
          },
          {
            id: `inv-${variantId}-2`,
            variantId,
            branchId: 'branch-2',
            quantity: Math.floor(Math.random() * 10) + 1,
            reservedQuantity: 0,
            reorderPoint: 3,
          },
        ],
      });
    });
  });
  
  return variants;
}

// Products
export const products: Product[] = [
  {
    id: 'prod-001',
    name: 'Classic Oxford',
    slug: 'classic-oxford',
    sku: 'EM-001',
    description: 'The epitome of timeless elegance, our Classic Oxford features premium full-grain leather, hand-stitched construction, and a sleek silhouette that transitions effortlessly from boardroom to black-tie events. Each pair is crafted by master artisans with decades of experience.',
    shortDescription: 'Timeless elegance in premium full-grain leather',
    basePrice: 12500,
    categoryId: 'cat-1-1',
    material: 'Full-Grain Leather',
    gender: 'MENS',
    isActive: true,
    isFeatured: true,
    isNew: false,
    tags: ['formal', 'wedding', 'office', 'premium'],
    images: [
      { id: 'img-001-1', productId: 'prod-001', url: '/images/products/oxford-black-1.jpg', altText: 'Classic Oxford in Black', isPrimary: true, sortOrder: 1 },
      { id: 'img-001-2', productId: 'prod-001', url: '/images/products/oxford-black-2.jpg', altText: 'Classic Oxford side view', isPrimary: false, sortOrder: 2 },
    ],
    variants: generateVariants('prod-001', 12500),
    averageRating: 4.8,
    reviewCount: 124,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-12-01'),
  },
  {
    id: 'prod-002',
    name: 'Executive Derby',
    slug: 'executive-derby',
    sku: 'EM-002',
    description: 'Our Executive Derby combines sophisticated style with all-day comfort. Featuring an open lacing system for a comfortable fit and premium calfskin leather that develops a beautiful patina over time.',
    shortDescription: 'Sophisticated style meets all-day comfort',
    basePrice: 11000,
    salePrice: 9500,
    categoryId: 'cat-1-2',
    material: 'Calfskin Leather',
    gender: 'MENS',
    isActive: true,
    isFeatured: true,
    isNew: false,
    tags: ['formal', 'office', 'sale'],
    images: [
      { id: 'img-002-1', productId: 'prod-002', url: '/images/products/derby-brown-1.jpg', altText: 'Executive Derby in Brown', isPrimary: true, sortOrder: 1 },
    ],
    variants: generateVariants('prod-002', 11000),
    averageRating: 4.6,
    reviewCount: 89,
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-11-15'),
  },
  {
    id: 'prod-003',
    name: 'Double Monk Strap',
    slug: 'double-monk-strap',
    sku: 'EM-003',
    description: 'Make a statement with our Double Monk Strap. This distinctive style features two adjustable straps with brushed brass buckles, offering both visual interest and a secure fit. Perfect for the gentleman who appreciates unique details.',
    shortDescription: 'Distinctive style with brushed brass buckles',
    basePrice: 14500,
    categoryId: 'cat-1-3',
    material: 'Premium Leather',
    gender: 'MENS',
    isActive: true,
    isFeatured: true,
    isNew: true,
    tags: ['formal', 'wedding', 'statement', 'new'],
    images: [
      { id: 'img-003-1', productId: 'prod-003', url: '/images/products/monk-cognac-1.jpg', altText: 'Double Monk Strap in Cognac', isPrimary: true, sortOrder: 1 },
    ],
    variants: generateVariants('prod-003', 14500),
    averageRating: 4.9,
    reviewCount: 56,
    createdAt: new Date('2024-10-01'),
    updatedAt: new Date('2024-12-10'),
  },
  {
    id: 'prod-004',
    name: 'Penny Loafer',
    slug: 'penny-loafer',
    sku: 'EM-004',
    description: 'The quintessential slip-on shoe, our Penny Loafer embodies casual elegance. Handcrafted with supple leather and featuring the classic penny strap detail, these loafers are perfect for relaxed office environments or weekend outings.',
    shortDescription: 'Casual elegance for the modern gentleman',
    basePrice: 9500,
    categoryId: 'cat-2-1',
    material: 'Soft Grain Leather',
    gender: 'MENS',
    isActive: true,
    isFeatured: false,
    isNew: false,
    tags: ['casual', 'office', 'weekend'],
    images: [
      { id: 'img-004-1', productId: 'prod-004', url: '/images/products/loafer-tan-1.jpg', altText: 'Penny Loafer in Tan', isPrimary: true, sortOrder: 1 },
    ],
    variants: generateVariants('prod-004', 9500),
    averageRating: 4.5,
    reviewCount: 203,
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-11-20'),
  },
  {
    id: 'prod-005',
    name: 'Chelsea Boot',
    slug: 'chelsea-boot',
    sku: 'EM-005',
    description: 'Our Chelsea Boot is a versatile wardrobe essential. Featuring elastic side panels for easy on/off, a sleek silhouette, and durable construction, these boots complement both casual and semi-formal attire with equal aplomb.',
    shortDescription: 'Versatile elegance for any occasion',
    basePrice: 15500,
    salePrice: 13500,
    categoryId: 'cat-3-1',
    material: 'Full-Grain Leather',
    gender: 'MENS',
    isActive: true,
    isFeatured: true,
    isNew: false,
    tags: ['boots', 'versatile', 'sale'],
    images: [
      { id: 'img-005-1', productId: 'prod-005', url: '/images/products/chelsea-black-1.jpg', altText: 'Chelsea Boot in Black', isPrimary: true, sortOrder: 1 },
    ],
    variants: generateVariants('prod-005', 15500),
    averageRating: 4.7,
    reviewCount: 167,
    createdAt: new Date('2024-04-05'),
    updatedAt: new Date('2024-12-01'),
  },
  {
    id: 'prod-006',
    name: 'Traditional Khussa',
    slug: 'traditional-khussa',
    sku: 'EM-006',
    description: 'Embrace heritage with our Traditional Khussa. Handcrafted by skilled artisans using time-honored techniques, these khussas feature intricate embroidery and premium leather. Perfect for weddings, Eid celebrations, and cultural events.',
    shortDescription: 'Handcrafted heritage with intricate embroidery',
    basePrice: 4500,
    categoryId: 'cat-5',
    material: 'Genuine Leather with Embroidery',
    gender: 'MENS',
    isActive: true,
    isFeatured: true,
    isNew: true,
    tags: ['traditional', 'wedding', 'eid', 'cultural', 'new'],
    images: [
      { id: 'img-006-1', productId: 'prod-006', url: '/images/products/khussa-gold-1.jpg', altText: 'Traditional Khussa with gold embroidery', isPrimary: true, sortOrder: 1 },
    ],
    variants: generateVariants('prod-006', 4500),
    averageRating: 4.8,
    reviewCount: 312,
    createdAt: new Date('2024-09-15'),
    updatedAt: new Date('2024-12-05'),
  },
  {
    id: 'prod-007',
    name: 'Brogue Oxford',
    slug: 'brogue-oxford',
    sku: 'EM-007',
    description: 'Our Brogue Oxford showcases intricate perforated detailing that speaks to traditional craftsmanship. The decorative broguing adds visual interest while maintaining the refined elegance expected of a premium dress shoe.',
    shortDescription: 'Traditional craftsmanship with intricate detailing',
    basePrice: 13500,
    categoryId: 'cat-1-1',
    material: 'Full-Grain Leather',
    gender: 'MENS',
    isActive: true,
    isFeatured: false,
    isNew: false,
    tags: ['formal', 'brogue', 'classic'],
    images: [
      { id: 'img-007-1', productId: 'prod-007', url: '/images/products/brogue-burgundy-1.jpg', altText: 'Brogue Oxford in Burgundy', isPrimary: true, sortOrder: 1 },
    ],
    variants: generateVariants('prod-007', 13500),
    averageRating: 4.6,
    reviewCount: 78,
    createdAt: new Date('2024-05-20'),
    updatedAt: new Date('2024-11-10'),
  },
  {
    id: 'prod-008',
    name: 'Chukka Boot',
    slug: 'chukka-boot',
    sku: 'EM-008',
    description: 'The Chukka Boot offers a perfect balance of casual style and refined aesthetics. With its ankle-high design, two or three eyelet lacing, and cushioned insole, it is ideal for daily wear throughout the cooler months.',
    shortDescription: 'Casual refinement for cooler months',
    basePrice: 12000,
    categoryId: 'cat-3-2',
    material: 'Suede Leather',
    gender: 'MENS',
    isActive: true,
    isFeatured: false,
    isNew: true,
    tags: ['boots', 'casual', 'winter', 'new'],
    images: [
      { id: 'img-008-1', productId: 'prod-008', url: '/images/products/chukka-tan-1.jpg', altText: 'Chukka Boot in Tan Suede', isPrimary: true, sortOrder: 1 },
    ],
    variants: generateVariants('prod-008', 12000),
    averageRating: 4.4,
    reviewCount: 45,
    createdAt: new Date('2024-10-20'),
    updatedAt: new Date('2024-12-08'),
  },
];

// Sample Reviews
export const reviews: Review[] = [
  {
    id: 'rev-001',
    productId: 'prod-001',
    userId: 'user-001',
    rating: 5,
    title: 'Exceptional Quality',
    comment: 'These oxfords exceeded my expectations. The leather quality is superb and the fit is perfect. Worth every rupee!',
    isVerifiedPurchase: true,
    isApproved: true,
    helpfulCount: 23,
    createdAt: new Date('2024-11-15'),
  },
  {
    id: 'rev-002',
    productId: 'prod-001',
    userId: 'user-002',
    rating: 5,
    title: 'Perfect for my wedding',
    comment: 'Bought these for my wedding and received countless compliments. The craftsmanship is evident in every detail.',
    isVerifiedPurchase: true,
    isApproved: true,
    helpfulCount: 18,
    createdAt: new Date('2024-11-20'),
  },
  {
    id: 'rev-003',
    productId: 'prod-006',
    userId: 'user-003',
    rating: 5,
    title: 'Beautiful traditional design',
    comment: 'The embroidery work is stunning. These khussas are comfortable and look amazing with my sherwani.',
    isVerifiedPurchase: true,
    isApproved: true,
    helpfulCount: 31,
    createdAt: new Date('2024-12-01'),
  },
];

// Sample Users for testing
export const sampleUsers: User[] = [
  {
    id: 'user-001',
    email: 'admin@executivemochi.pk',
    phone: '+923001234567',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN',
    isActive: true,
    isPhoneVerified: true,
    isEmailVerified: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-12-01'),
  },
  {
    id: 'user-002',
    email: 'manager.pasrur@executivemochi.pk',
    phone: '+923002345678',
    firstName: 'Ahmed',
    lastName: 'Khan',
    role: 'BRANCH_MANAGER',
    isActive: true,
    isPhoneVerified: true,
    isEmailVerified: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-11-20'),
  },
  {
    id: 'user-003',
    email: 'customer@example.com',
    phone: '+923003456789',
    firstName: 'Ali',
    lastName: 'Hassan',
    role: 'CUSTOMER',
    isActive: true,
    isPhoneVerified: true,
    isEmailVerified: true,
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2024-12-05'),
  },
];

// Sample Addresses
export const sampleAddresses: Address[] = [
  {
    id: 'addr-001',
    userId: 'user-003',
    fullName: 'Ali Hassan',
    phone: '+923003456789',
    streetAddress: 'House 45, Street 12, Gulberg III',
    city: 'Lahore',
    province: 'Punjab',
    postalCode: '54000',
    country: 'Pakistan',
    isDefault: true,
    label: 'Home',
  },
  {
    id: 'addr-002',
    userId: 'user-003',
    fullName: 'Ali Hassan',
    phone: '+923003456789',
    streetAddress: 'Office 301, Ali Tower, MM Alam Road',
    city: 'Lahore',
    province: 'Punjab',
    postalCode: '54000',
    country: 'Pakistan',
    isDefault: false,
    label: 'Office',
  },
];

// Mock Orders
export const mockOrders: Order[] = [
  {
    id: 'order-001',
    orderNumber: 'EM-2024-001234',
    userId: 'user-003',
    status: 'DELIVERED',
    paymentMethod: 'COD',
    paymentStatus: 'PAID',
    shippingAddress: sampleAddresses[0],
    items: [
      {
        id: 'oi-001',
        orderId: 'order-001',
        variantId: 'prod-001-black-9',
        quantity: 1,
        unitPrice: 12500,
        totalPrice: 12500,
        status: 'FULFILLED',
      },
    ],
    subtotal: 12500,
    discountAmount: 0,
    shippingAmount: 0,
    codFee: 50,
    taxAmount: 0,
    total: 12550,
    trackingNumber: 'LP123456789PK',
    courierCode: 'LEOPARDS',
    deliveredAt: new Date('2024-11-20'),
    createdAt: new Date('2024-11-15'),
    updatedAt: new Date('2024-11-20'),
  },
  {
    id: 'order-002',
    orderNumber: 'EM-2024-001235',
    userId: 'user-003',
    status: 'IN_TRANSIT',
    paymentMethod: 'JAZZCASH',
    paymentStatus: 'PAID',
    shippingAddress: sampleAddresses[1],
    items: [
      {
        id: 'oi-002',
        orderId: 'order-002',
        variantId: 'prod-006-black-8',
        quantity: 2,
        unitPrice: 4500,
        totalPrice: 9000,
        status: 'PENDING',
      },
      {
        id: 'oi-003',
        orderId: 'order-002',
        variantId: 'prod-004-tan-9',
        quantity: 1,
        unitPrice: 9500,
        totalPrice: 9500,
        status: 'PENDING',
      },
    ],
    subtotal: 18500,
    discountAmount: 1850,
    shippingAmount: 0,
    codFee: 0,
    taxAmount: 0,
    total: 16650,
    couponCode: 'WELCOME10',
    trackingNumber: 'TX987654321PK',
    courierCode: 'TRAX',
    estimatedDeliveryDate: new Date('2024-12-18'),
    createdAt: new Date('2024-12-10'),
    updatedAt: new Date('2024-12-12'),
  },
  {
    id: 'order-003',
    orderNumber: 'EM-2024-001236',
    userId: 'user-003',
    status: 'PROCESSING',
    paymentMethod: 'EASYPAISA',
    paymentStatus: 'PAID',
    shippingAddress: sampleAddresses[0],
    items: [
      {
        id: 'oi-004',
        orderId: 'order-003',
        variantId: 'prod-003-cognac-10',
        quantity: 1,
        unitPrice: 14500,
        totalPrice: 14500,
        status: 'PENDING',
      },
    ],
    subtotal: 14500,
    discountAmount: 0,
    shippingAmount: 0,
    codFee: 0,
    taxAmount: 0,
    total: 14500,
    estimatedDeliveryDate: new Date('2024-12-20'),
    createdAt: new Date('2024-12-12'),
    updatedAt: new Date('2024-12-12'),
  },
];

// Mock Store Credits
export const mockStoreCredits = {
  userId: 'user-003',
  balance: 500,
  lifetimeEarned: 1500,
  lifetimeUsed: 1000,
  transactions: [
    { id: 'sc-001', type: 'EARNED', amount: 500, description: 'Return refund - Order #EM-2024-001200', date: new Date('2024-10-15') },
    { id: 'sc-002', type: 'USED', amount: 500, description: 'Applied to Order #EM-2024-001220', date: new Date('2024-11-01') },
    { id: 'sc-003', type: 'EARNED', amount: 1000, description: 'Promotional credit - Eid Special', date: new Date('2024-04-10') },
    { id: 'sc-004', type: 'USED', amount: 500, description: 'Applied to Order #EM-2024-001180', date: new Date('2024-09-20') },
  ],
};

// Mock Loyalty Account
export const mockLoyaltyAccount = {
  userId: 'user-003',
  points: 1250,
  lifetimePoints: 3500,
  tier: 'SILVER' as const,
  tierExpiresAt: new Date('2025-12-31'),
  pointsToNextTier: 1750,
  nextTier: 'GOLD' as const,
  transactions: [
    { id: 'lp-001', type: 'EARNED', points: 125, description: 'Purchase - Order #EM-2024-001234', date: new Date('2024-11-15') },
    { id: 'lp-002', type: 'EARNED', points: 185, description: 'Purchase - Order #EM-2024-001235', date: new Date('2024-12-10') },
    { id: 'lp-003', type: 'REDEEMED', points: 500, description: 'Redeemed for PKR 250 discount', date: new Date('2024-10-01') },
    { id: 'lp-004', type: 'BONUS', points: 500, description: 'Birthday bonus', date: new Date('2024-08-15') },
  ],
};

// Mock Size Memory
export const mockSizeMemory = [
  { id: 'sm-001', userId: 'user-003', categoryId: 'cat-1', categoryName: 'Formal Shoes', size: '9', width: 'STANDARD' as const, notes: 'Perfect fit' },
  { id: 'sm-002', userId: 'user-003', categoryId: 'cat-2', categoryName: 'Casual Shoes', size: '9', width: 'WIDE' as const, notes: 'Prefer slightly roomier' },
  { id: 'sm-003', userId: 'user-003', categoryId: 'cat-3', categoryName: 'Boots', size: '9.5', width: 'STANDARD' as const, notes: 'Size up for boots' },
];

// Helper functions
export function getProductBySlug(slug: string): Product | undefined {
  return products.find(p => p.slug === slug);
}

export function getProductById(id: string): Product | undefined {
  return products.find(p => p.id === id);
}

export function getProductsByCategory(categorySlug: string): Product[] {
  const category = categories.find(c => c.slug === categorySlug);
  if (!category) return [];
  
  // Get products from this category and its children
  const categoryIds = [category.id, ...(category.children?.map(c => c.id) || [])];
  return products.filter(p => categoryIds.includes(p.categoryId));
}

export function getFeaturedProducts(): Product[] {
  return products.filter(p => p.isFeatured && p.isActive);
}

export function getNewArrivals(): Product[] {
  return products.filter(p => p.isNew && p.isActive);
}

export function getOnSaleProducts(): Product[] {
  return products.filter(p => p.salePrice && p.isActive);
}

export function searchProducts(query: string): Product[] {
  const lowercaseQuery = query.toLowerCase();
  return products.filter(p => 
    p.name.toLowerCase().includes(lowercaseQuery) ||
    p.description.toLowerCase().includes(lowercaseQuery) ||
    p.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function getTotalStock(variants: ProductVariant[]): number {
  return variants.reduce((total, variant) => {
    const variantStock = variant.inventory.reduce((sum, inv) => sum + inv.quantity - inv.reservedQuantity, 0);
    return total + variantStock;
  }, 0);
}

export function isInStock(variant: ProductVariant): boolean {
  return variant.inventory.some(inv => inv.quantity - inv.reservedQuantity > 0);
}
