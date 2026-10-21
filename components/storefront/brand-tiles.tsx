/**
 * Brand Tiles
 * Grid of brand logos with links to brand pages.
 */
import Link from 'next/link';
import Image from 'next/image';

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

export function BrandTiles({ brands }: BrandTilesProps) {
  if (!brands || brands.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No brands available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
      {brands.map((brand) => (
        <Link
          key={brand.id}
          href={`/brand/${brand.slug}`}
          className="group flex flex-col items-center gap-3 p-5 rounded-card-md bg-brand-white border border-brand-silver/50 shadow-card hover:border-brand-navy/40 hover:shadow-card-hover transition-all"
        >
          {brand.logo_path ? (
            <div className="w-16 h-16 flex items-center justify-center p-2">
              <Image
                src={brand.logo_path}
                alt={brand.name}
                width={64}
                height={64}
                className="object-contain max-h-14 transition-transform duration-300 group-hover:scale-110"
              />
            </div>
          ) : (
            <div className="w-14 h-14 flex items-center justify-center bg-brand-cream border border-brand-silver/40 rounded-full shadow-inner">
              <span className="text-xs font-display font-bold text-brand-navy tracking-wider">
                {brand.name.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
          <span className="text-xs sm:text-sm font-display font-medium text-brand-charcoal group-hover:text-brand-navy transition-colors tracking-display text-center">
            {brand.name}
          </span>
        </Link>
      ))}
    </div>
  );
}
