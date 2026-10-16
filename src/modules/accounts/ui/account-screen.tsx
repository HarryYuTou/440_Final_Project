import { Breadcrumbs } from "@/components/breadcrumbs";
import { FeaturePlaceholder } from "@/components/feature-placeholder";
import { BookmarkIcon, CupIcon } from "@/components/icons";

type AccountView = "login" | "signup" | "account" | "saved" | "upgrade" | "checkout-result";

const content: Record<AccountView, { breadcrumb: string; label: string; title: string; description: string }> = {
  login: {
    breadcrumb: "Sign in",
    label: "Your coffee atlas",
    title: "Good to see you here.",
    description: "Sign-in is not available yet. Account access will let you return to your preferences and saved coffee discoveries.",
  },
  signup: {
    breadcrumb: "Create an account",
    label: "Your coffee atlas",
    title: "Make room for a little discovery.",
    description: "Registration is not available yet. Once accounts are ready, you’ll be able to keep your preferences and discoveries together.",
  },
  account: {
    breadcrumb: "Account",
    label: "A taste of your own",
    title: "Your journey, all in one place.",
    description: "Account details and saved preferences are not available yet. No personal information is collected on this preview page.",
  },
  saved: {
    breadcrumb: "Saved",
    label: "Keep your curiosity close",
    title: "A collection worth coming back to.",
    description: "Saved collections are not available yet. This will be the place to return to the beans and drinks you want to try.",
  },
  upgrade: {
    breadcrumb: "Plans",
    label: "More to explore",
    title: "A little more is on the way.",
    description: "Plans and checkout are not available yet. Paid features and pricing will appear here once they have been defined.",
  },
  "checkout-result": {
    breadcrumb: "Checkout status",
    label: "Checkout status",
    title: "No payment has been confirmed.",
    description: "Checkout is not connected in this preview. This page does not confirm a payment or change your account access.",
  },
};

export function AccountScreen({ view }: { view: AccountView }) {
  const selected = content[view];
  return (
    <div className="content-width interior-page">
      <Breadcrumbs items={[{ label: selected.breadcrumb }]} />
      <FeaturePlaceholder
        label={selected.label}
        title={selected.title}
        description={selected.description}
        icon={view === "saved" ? <BookmarkIcon width={36} height={36} /> : <CupIcon width={36} height={36} />}
        primaryAction={{ href: "/explore", label: "Explore the atlas" }}
        secondaryAction={view === "login" ? { href: "/signup", label: "About creating an account" } : { href: "/", label: "Back to home" }}
      />
    </div>
  );
}
