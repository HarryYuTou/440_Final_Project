import { Breadcrumbs } from "@/components/breadcrumbs";
import { FeaturePlaceholder } from "@/components/feature-placeholder";
import { BeanIcon, CupIcon } from "@/components/icons";

export function DetailScreen({ kind }: { kind: "bean" | "drink" }) {
  const isBean = kind === "bean";
  return (
    <div className="content-width interior-page">
      <Breadcrumbs items={[{ label: "Explore", href: "/explore" }, { label: isBean ? "Coffee bean" : "Regional drink" }]} />
      <FeaturePlaceholder
        label={isBean ? "Coffee origins" : "Coffee culture"}
        title={isBean ? "This bean’s story is still to come." : "This cup’s story is still to come."}
        description={isBean ? "Bean profiles will bring together origin, growing conditions, processing, and flavor. This profile is not available yet." : "Drink guides will explore ingredients, preparation, and regional traditions. This guide is not available yet."}
        icon={isBean ? <BeanIcon width={38} height={38} /> : <CupIcon width={38} height={38} />}
        primaryAction={{ href: "/explore", label: "Back to exploring" }}
        secondaryAction={{ href: "/recommendations", label: "Explore by taste" }}
      />
    </div>
  );
}
