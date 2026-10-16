import { Breadcrumbs } from "@/components/breadcrumbs";
import { FeaturePlaceholder } from "@/components/feature-placeholder";
import { CompassIcon } from "@/components/icons";

export function RecommendationScreen({ context }: { context?: { label: string; value: string }[] }) {
  return (
    <div className="content-width interior-page">
      <Breadcrumbs items={[{ label: "Find your coffee" }]} />
      <FeaturePlaceholder
        label="Let your taste lead the way"
        title="Your next cup starts with you."
        description="Personalized recommendations are not available yet. This experience will connect your taste, drinking habits, and curiosity with beans and regional drinks from the atlas."
        icon={<CompassIcon width={38} height={38} />}
        primaryAction={{ href: "/explore", label: "Explore the atlas" }}
        secondaryAction={{ href: "/", label: "Back to home" }}
      >
        {context && context.length > 0 && (
          <div className="context-summary">
            <p className="eyebrow">Your exploration context</p>
            <dl>{context.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl>
            <p className="small-note">These selections have not been matched to catalog content yet.</p>
          </div>
        )}
      </FeaturePlaceholder>
    </div>
  );
}
