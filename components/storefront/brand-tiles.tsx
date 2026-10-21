/**
 * Brand Tiles
 * Grid of brand logos with links to brand pages.
 */
import Link from 'next/link';
import Image from 'next/image';
import { BrandLogoRenderer } from '@/components/ui/brand-icons';

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_path: string | null;
  sort_order: number;
}

interface BrandTilesProps {
  brands: Brand[];
}

const DEFAULT_BRANDS: Brand[] = [
  { id: '20000000-0000-0000-0000-000000000001', name: 'Apple', slug: 'apple', logo_path: null, sort_order: 1 },
  { id: '20000000-0000-0000-0000-000000000002', name: 'Samsung', slug: 'samsung', logo_path: null, sort_order: 2 },
  { id: '20000000-0000-0000-0000-000000000003', name: 'Google', slug: 'google', logo_path: null, sort_order: 3 },
  { id: '20000000-0000-0000-0000-000000000004', name: 'OnePlus', slug: 'oneplus', logo_path: null, sort_order: 4 },
  { id: '20000000-0000-0000-0000-000000000005', name: 'Xiaomi', slug: 'xiaomi', logo_path: null, sort_order: 5 },
  { id: '20000000-0000-0000-0000-000000000006', name: 'Infinix', slug: 'infinix', logo_path: null, sort_order: 6 },
];

export function BrandTiles({ brands }: BrandTilesProps) {
  const displayBrands = brands && brands.length > 0 ? brands : DEFAULT_BRANDS;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
      {displayBrands.map((brand) => (
        <Link
          key={brand.id}
          href={`/brand/${brand.slug}`}
          className="group flex flex-col items-center justify-between gap-3 p-5 rounded-card-md bg-brand-white border border-brand-silver/50 shadow-card hover:border-brand-navy/40 hover:shadow-card-hover transition-all min-h-[140px]"
        >
          <div className="w-16 h-16 flex items-center justify-center p-2 text-brand-charcoal group-hover:text-brand-navy transition-colors">
            {brand.logo_path ? (
              <Image
                src={brand.logo_path}
                alt={brand.name}
                width={64}
                height={64}
                className="object-contain max-h-14 transition-transform duration-300 group-hover:scale-110"
              />
            ) : (
              <div className="w-14 h-14 flex items-center justify-center bg-brand-cream border border-brand-silver/40 rounded-full shadow-inner transition-transform duration-300 group-hover:scale-110">
                <BrandLogoRenderer name={brand.name} slug={brand.slug} size={30} />
              </div>
            )}
          </div>
          <span className="text-xs sm:text-sm font-display font-medium text-brand-charcoal group-hover:text-brand-navy transition-colors tracking-display text-center">
            {brand.name}
          </span>
        </Link>
      ))}
    </div>
  );
}
