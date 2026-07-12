import { CanonicalSection, CanonicalSectionCard } from "@/components/ui/canonical";
import { HelpTextCard } from "@/features/help/components/HelpCentreCanonicalSection";
import { getHelpHubQuickTiles } from "@/lib/mobile-ui/hubs";

export { HelpTextCard } from "@/features/help/components/HelpCentreCanonicalSection";

export function HelpQuickLinks() {
  return (
    <CanonicalSection title="Support hubs">
      <CanonicalSectionCard>
        {getHelpHubQuickTiles().map((tile) => (
          <HelpTextCard
            key={tile.href + tile.label}
            href={tile.href}
            title={tile.label}
            description={tile.subtitle}
          />
        ))}
      </CanonicalSectionCard>
    </CanonicalSection>
  );
}
