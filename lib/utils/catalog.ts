/**
 * Catalog display utilities — moved from lib/data.ts
 * Non-data helpers for formatting and category labels.
 * These are UI constants and don't belong in the database.
 */

export function formatPrice(amount: number): string {
  return `PKR ${Math.round(amount).toLocaleString('en-PK')}`;
}

export const styleCategories = [
  { id: 'PESHAWARI', label: 'Peshawari / Khussa', emoji: '🥿' },
  { id: 'OXFORD', label: 'Oxford / Formal', emoji: '👞' },
  { id: 'LOAFERS', label: 'Loafers', emoji: '🥾' },
  { id: 'MOCCASINS', label: 'Moccasins', emoji: '🪖' },
  { id: 'SANDALS', label: 'Sandals / Chappals', emoji: '🩴' },
  { id: 'SNEAKERS', label: 'Sneakers / Sports', emoji: '👟' },
] as const;

export const genderCategories = [
  { id: 'MEN', label: "Men's Collection", imageUrl: '/images/category-men.jpg' },
  { id: 'WOMEN', label: "Women's Collection", imageUrl: '/images/category-women.jpg' },
  { id: 'KIDS', label: "Kids' Collection", imageUrl: '/images/category-kids.jpg' },
] as const;

/** All known brands from the stocktaking catalogue (April 2026) */
export const knownBrands = [
  'SIL',
  'SSC',
  'Bata',
  'Xarasoft',
  'Starlet',
  'Borjan',
  'X-Way',
  'Vince Born',
  'Delux',
  'Hush Puppies',
  'Urban Sole',
  'WEJ',
  'Imported',
  'Others',
  'Executive',
] as const;

export type KnownBrand = typeof knownBrands[number];

export const pakistanProvinces = [
  'Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan',
  'Azad Kashmir', 'Gilgit-Baltistan', 'Islamabad Capital Territory',
] as const;

export const occasionLabels: Record<string, string> = {
  ETHNIC: 'Ethnic Wear', WEDDING: 'Wedding', SPORTS: 'Sports',
  FORMAL: 'Formal', CASUAL: 'Casual',
};
