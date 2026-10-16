import type { Metadata } from "next";
import { AccountScreen } from "@/modules/accounts/ui/account-screen";

export const metadata: Metadata = { title: "Plans" };

export default function UpgradePage() {
  return <AccountScreen view="upgrade" />;
}
