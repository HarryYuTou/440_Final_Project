import Link from "next/link";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CoffeeGlobe } from "@/components/coffee-globe";
import { ArrowIcon, BeanIcon, CupIcon } from "@/components/icons";

export function ExploreScreen({ level = "world" }: { level?: "world" | "country" | "region" }) {
  const nested = level !== "world";
  return (
    <div className="content-width interior-page">
      <Breadcrumbs items={nested ? [{ label: "Explore", href: "/explore" }, { label: level === "country" ? "Country" : "Region" }] : [{ label: "Explore" }]} />
      <div className="page-introduction">
        <p className="eyebrow">The coffee atlas</p>
        <h1>{nested ? "There’s more to discover here." : "A good cup starts somewhere."}</h1>
        <p>{nested ? "Coffee guides for this location are not available yet. Return to the world view to continue exploring the preview." : "Explore the places where coffee grows and the many ways people make it their own."}</p>
      </div>
      <div className="explore-layout">
        <section className="map-preview" aria-label="Map preview">
          <div className="map-preview-topline"><span className="eyebrow">World / Coffee & culture</span><span className="preview-label"><span aria-hidden="true" />In preparation</span></div>
          <CoffeeGlobe compact />
          <div className="map-preview-caption"><p>The map is taking shape.</p><span>Interactive locations are not available yet.</span></div>
        </section>
        <aside className="explore-sidebar" aria-labelledby="location-heading">
          <p className="eyebrow">Explore a little deeper</p>
          <h2 id="location-heading">Places, beans,<br />and ways to drink.</h2>
          <div className="explore-detail"><BeanIcon /><div><h3>Where it grows</h3><p>Bean origins and growing environments, with information from a curated catalog.</p></div></div>
          <div className="explore-detail"><CupIcon /><div><h3>How it’s enjoyed</h3><p>Regional drinks and preparations, connected to the cultures that enjoy them.</p></div></div>
          <p className="small-note">No locations have been published in this preview.</p>
          <Link href={nested ? "/explore" : "/recommendations"} className="text-link">{nested ? "Back to the world view" : "Explore by taste"}<ArrowIcon /></Link>
        </aside>
      </div>
    </div>
  );
}
