import { notFound, permanentRedirect } from 'next/navigation';

/**
 * Mapping of known legacy categories and URL aliases to canonical query parameters.
 * Using permanentRedirect (HTTP 308) permanently resolves Google Search Console
 * "Page with redirect" (690 URLs) and migrates ranking signals to the main catalog.
 */
const CATEGORY_MAP: Record<string, string> = {
  men: 'MEN',
  gents: 'MEN',
  women: 'WOMEN',
  ladies: 'WOMEN',
  kids: 'KIDS',
  children: 'KIDS',
  youth: 'KIDS',
  accessories: 'ACCESSORIES',
};

const STYLE_MAP: Record<string, string> = {
  loafers: 'LOAFERS',
  oxford: 'OXFORD',
  moccasins: 'MOCCASINS',
  peshawari: 'PESHAWARI',
  sandals: 'SANDALS',
  sneakers: 'SNEAKERS',
  school: 'SCHOOL',
  'formal-shoes': 'OXFORD',
  'casual-shoes': 'MOCCASINS',
  boots: 'OXFORD',
  khussas: 'PESHAWARI',
  chappal: 'PESHAWARI',
  sports: 'SNEAKERS',
};

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const raw = decodeURIComponent(category || '').toLowerCase().trim();

  // 1. Direct Category Match
  if (CATEGORY_MAP[raw]) {
    permanentRedirect(`/shop?category=${CATEGORY_MAP[raw]}`);
  }

  // 2. Direct Style Match
  if (STYLE_MAP[raw]) {
    permanentRedirect(`/shop?style=${STYLE_MAP[raw]}`);
  }

  // 3. Unrecognized category or garbage URL -> Proper 404 (prevents Soft 404)
  notFound();
}
