// Executive Mochi - Color Management Utilities
// Supports dynamic color palette, RGB & HEX conversions, luminance contrast checks,
// nearest neighbor color naming, and localStorage persistence.

export interface ColorOption {
  name: string;
  hex: string;
  bgClass?: string;
  isCustom?: boolean;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export const COLOR_STORAGE_KEY = 'emochi_admin_product_colors_v1';

export const DEFAULT_PRODUCT_COLORS: ColorOption[] = [
  { name: 'Black', hex: '#1a1a1a', bgClass: 'bg-[#1a1a1a]' },
  { name: 'Brown', hex: '#8B4513', bgClass: 'bg-[#8B4513]' },
  { name: 'Tan', hex: '#D2B48C', bgClass: 'bg-[#D2B48C]' },
  { name: 'White', hex: '#FFFFFF', bgClass: 'bg-[#FFFFFF]' },
  { name: 'Grey', hex: '#808080', bgClass: 'bg-[#808080]' },
  { name: 'Navy', hex: '#1a1a3e', bgClass: 'bg-[#1a1a3e]' },
  { name: 'Gold', hex: '#CFB53B', bgClass: 'bg-[#CFB53B]' },
  { name: 'Beige', hex: '#F5F0E8', bgClass: 'bg-[#F5F0E8]' },
  { name: 'Cognac', hex: '#9A463D', bgClass: 'bg-[#9A463D]' },
  { name: 'Olive', hex: '#808000', bgClass: 'bg-[#808000]' },
];

export const PRESET_LUXURY_COLORS: ColorOption[] = [
  { name: 'Oxblood', hex: '#4A0E17' },
  { name: 'Burgundy', hex: '#800020' },
  { name: 'Espresso', hex: '#362B28' },
  { name: 'Camel', hex: '#C19A6B' },
  { name: 'Tan Suede', hex: '#B38B59' },
  { name: 'Sand', hex: '#D8C4A5' },
  { name: 'Off-White', hex: '#FAF9F6' },
  { name: 'Charcoal', hex: '#333333' },
  { name: 'Forest Green', hex: '#1E4620' },
  { name: 'Midnight Blue', hex: '#0B1B3D' },
  { name: 'Plum', hex: '#58111A' },
  { name: 'Brick Red', hex: '#9C413D' },
  { name: 'Mustard', hex: '#DCAE1D' },
  { name: 'Rust', hex: '#A55233' },
  { name: 'Taupe', hex: '#87796F' },
  { name: 'Champagne', hex: '#F7E7CE' },
];

// Color name reference database for nearest-color naming
const COLOR_NAME_DICTIONARY: Array<{ name: string; hex: string }> = [
  { name: 'Black', hex: '#000000' },
  { name: 'Jet Black', hex: '#1A1A1A' },
  { name: 'Charcoal', hex: '#333333' },
  { name: 'Dark Slate', hex: '#2F4F4F' },
  { name: 'Slate Grey', hex: '#708090' },
  { name: 'Grey', hex: '#808080' },
  { name: 'Silver', hex: '#C0C0C0' },
  { name: 'Light Grey', hex: '#D3D3D3' },
  { name: 'Off-White', hex: '#FAF9F6' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Cream', hex: '#FFFDD0' },
  { name: 'Ivory', hex: '#FFFFF0' },
  { name: 'Beige', hex: '#F5F0E8' },
  { name: 'Sand', hex: '#D8C4A5' },
  { name: 'Khaki', hex: '#C3B091' },
  { name: 'Taupe', hex: '#87796F' },
  { name: 'Camel', hex: '#C19A6B' },
  { name: 'Tan', hex: '#D2B48C' },
  { name: 'Tan Suede', hex: '#B38B59' },
  { name: 'Caramel', hex: '#AF6E4D' },
  { name: 'Cognac', hex: '#9A463D' },
  { name: 'Brown', hex: '#8B4513' },
  { name: 'Chestnut', hex: '#954535' },
  { name: 'Walnut', hex: '#773F1A' },
  { name: 'Espresso', hex: '#362B28' },
  { name: 'Chocolate', hex: '#7B3F00' },
  { name: 'Saddle Brown', hex: '#8B4513' },
  { name: 'Rust', hex: '#A55233' },
  { name: 'Terracotta', hex: '#E2725B' },
  { name: 'Brick Red', hex: '#9C413D' },
  { name: 'Maroon', hex: '#800000' },
  { name: 'Burgundy', hex: '#800020' },
  { name: 'Oxblood', hex: '#4A0E17' },
  { name: 'Plum', hex: '#58111A' },
  { name: 'Cherry', hex: '#990000' },
  { name: 'Ruby', hex: '#9B111E' },
  { name: 'Crimson', hex: '#DC143C' },
  { name: 'Red', hex: '#FF0000' },
  { name: 'Coral', hex: '#FF7F50' },
  { name: 'Peach', hex: '#FFDAB9' },
  { name: 'Blush Pink', hex: '#FFD1DC' },
  { name: 'Rose Gold', hex: '#B76E79' },
  { name: 'Pink', hex: '#FFC0CB' },
  { name: 'Hot Pink', hex: '#FF69B4' },
  { name: 'Magenta', hex: '#FF00FF' },
  { name: 'Purple', hex: '#800080' },
  { name: 'Violet', hex: '#8F00FF' },
  { name: 'Indigo', hex: '#4B0082' },
  { name: 'Lavender', hex: '#E6E6FA' },
  { name: 'Navy', hex: '#1A1A3E' },
  { name: 'Midnight Blue', hex: '#0B1B3D' },
  { name: 'Royal Blue', hex: '#4169E1' },
  { name: 'Cobalt', hex: '#0047AB' },
  { name: 'Sapphire', hex: '#0F52BA' },
  { name: 'Blue', hex: '#0000FF' },
  { name: 'Steel Blue', hex: '#4682B4' },
  { name: 'Sky Blue', hex: '#87CEEB' },
  { name: 'Cyan', hex: '#00FFFF' },
  { name: 'Teal', hex: '#008080' },
  { name: 'Sea Green', hex: '#2E8B57' },
  { name: 'Emerald', hex: '#046307' },
  { name: 'Forest Green', hex: '#1E4620' },
  { name: 'Green', hex: '#008000' },
  { name: 'Dark Olive', hex: '#556B2F' },
  { name: 'Olive', hex: '#808000' },
  { name: 'Army Green', hex: '#4B5320' },
  { name: 'Sage', hex: '#9CAF88' },
  { name: 'Mint', hex: '#98FF98' },
  { name: 'Mustard', hex: '#DCAE1D' },
  { name: 'Gold', hex: '#CFB53B' },
  { name: 'Dark Goldenrod', hex: '#B8860B' },
  { name: 'Amber', hex: '#FFBF00' },
  { name: 'Yellow', hex: '#FFFF00' },
  { name: 'Champagne', hex: '#F7E7CE' },
];

/** Check if string is a valid 3- or 6-character hex code */
export function isValidHex(hex: string): boolean {
  if (!hex) return false;
  return /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex.trim());
}

/** Standardize hex string into #RRGGBB uppercase format */
export function normalizeHex(hex: string): string {
  if (!isValidHex(hex)) return '#000000';
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  return `#${clean.toUpperCase()}`;
}

/** Convert HEX string to RGB object */
export function hexToRgb(hex: string): RGB {
  if (!isValidHex(hex)) {
    return { r: 0, g: 0, b: 0 };
  }
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/** Convert R, G, B numeric values to #RRGGBB hex string */
export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(Number(v) || 0)));
  const toHex = (v: number) => clamp(v).toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Calculate perceived luminance (0 = pure black, 1 = pure white) */
export function getLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/** Check if color is light to decide dark vs light text/icons */
export function isLightColor(hex: string): boolean {
  return getLuminance(hex) > 0.65;
}

/** Find closest named color using Euclidean distance in RGB color space */
export function suggestColorName(hex: string): string {
  if (!isValidHex(hex)) return 'Custom Color';
  const target = hexToRgb(hex);

  let closestName = 'Custom Color';
  let minDistance = Infinity;

  for (const item of COLOR_NAME_DICTIONARY) {
    const itemRgb = hexToRgb(item.hex);
    // Weighted Euclidean distance for better perceptual accuracy
    const dr = target.r - itemRgb.r;
    const dg = target.g - itemRgb.g;
    const db = target.b - itemRgb.b;
    const distance = Math.sqrt(2 * dr * dr + 4 * dg * dg + 3 * db * db);

    if (distance < minDistance) {
      minDistance = distance;
      closestName = item.name;
    }
  }

  return closestName;
}

/** Load custom/saved colors from localStorage safely */
export function loadStoredColors(): ColorOption[] {
  if (typeof window === 'undefined') return DEFAULT_PRODUCT_COLORS;
  try {
    const raw = localStorage.getItem(COLOR_STORAGE_KEY);
    if (!raw) return DEFAULT_PRODUCT_COLORS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const valid = parsed.filter(
        (c) => typeof c?.name === 'string' && typeof c?.hex === 'string' && isValidHex(c.hex)
      );
      if (valid.length > 0) {
        return valid.map((c) => ({
          name: c.name.trim(),
          hex: normalizeHex(c.hex),
          bgClass: c.bgClass || `bg-[${normalizeHex(c.hex)}]`,
          isCustom: c.isCustom ?? true,
        }));
      }
    }
  } catch (err) {
    console.error('Failed to load stored colors:', err);
  }
  return DEFAULT_PRODUCT_COLORS;
}

/** Save custom colors to localStorage safely */
export function saveStoredColors(colors: ColorOption[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(COLOR_STORAGE_KEY, JSON.stringify(colors));
  } catch (err) {
    console.error('Failed to save colors to localStorage:', err);
  }
}
