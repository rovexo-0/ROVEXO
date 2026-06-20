import Header from "@/components/Header";
import { HomeContent } from "@/components/home/HomeContent";
import { HomePageShell } from "@/components/home/HomePageShell";
import { BottomNavigation } from "@/components/ui/BottomNavigation";
import { fetchProducts } from "@/lib/products/queries";

export default async function HomePage() {
  const [trending, newToday, recommended] = await Promise.all([
    fetchProducts("trending", 1),
    fetchProducts("new", 1),
    fetchProducts("recommended", 1),
  ]);

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <HomePageShell
        header={<Header />}
        bottomNav={<BottomNavigation active="home" />}
      >
        <HomeContent
          trending={trending.items}
          newToday={newToday.items}
          recommended={recommended.items}
          recommendedHasMore={recommended.hasMore}
        />
      </HomePageShell>
    </div>
  );
}
