import type { Metadata } from "next";
import { AccountScreen } from "@/modules/accounts/ui/account-screen";

export const metadata: Metadata = { title: "Checkout status" };

export default function CheckoutResultPage() {
  return <AccountScreen view="checkout-result" />;
}
