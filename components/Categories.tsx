import Image from "next/image";
import Link from "next/link";

export type Category = {
  id: string;
  name: string;
  slug: string;
  itemCount: number;
  imageUrl: string;
};

type CategoriesProps = {
  categories?: Category[];
};

export default function Categories({ categories = [] }: CategoriesProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8" aria-labelledby="categories-heading">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="categories-heading" className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
            Shop by category
          </h2>
          <p className="mt-1 text-sm text-gray-500 sm:text-base">
            Browse items across every category
          </p>
        </div>
        <Link href="/categories" className="text-sm font-semibold text-[#2563eb] hover:opacity-80">
          All categories →
        </Link>
      </div>

      {categories.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="group relative overflow-hidden rounded-2xl shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl"
            >
              <div className="relative aspect-[4/3]">
                <Image
                  src={category.imageUrl}
                  alt={category.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <h3 className="text-xl font-bold">{category.name}</h3>
                <p className="text-sm text-white/75">
                  {category.itemCount.toLocaleString()} items
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-16 text-center">
          <p className="text-sm text-gray-500">Categories will appear here.</p>
        </div>
      )}
    </section>
  );
}
