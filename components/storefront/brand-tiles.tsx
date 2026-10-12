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
    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
      {brands.map((brand) => (
        <Link
          key={brand.id}
          href={`/brand/${brand.slug}`}
          className="group flex flex-col items-center gap-2 p-4 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors"
        >
          {brand.logo_path ? (
            <div className="w-16 h-16 flex items-center justify-center">
              <Image
                src={brand.logo_path}
                alt={brand.name}
                width={64}
                height={64}
                className="object-contain max-h-16"
              />
            </div>
          ) : (
            <div className="w-16 h-16 flex items-center justify-center bg-muted rounded-full">
              <span className="text-xs font-medium text-muted-foreground">
                {brand.name.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
          <span className="text-sm font-medium group-hover:text-primary transition-colors">
            {brand.name}
          </span>
        </Link>
      ))}
    </div>
  );
}
