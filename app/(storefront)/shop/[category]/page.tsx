import { redirect } from 'next/navigation';

/**
 * /shop/[category] is deprecated — all filtering is now handled by
 * the main /shop page via query parameters (?style=OXFORD, ?category=MEN, etc.)
 * This page redirects to maintain backward compatibility.
 */
export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  redirect(`/shop?category=${category.toUpperCase()}`);
}
