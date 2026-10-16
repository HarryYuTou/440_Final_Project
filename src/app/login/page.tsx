import type { Metadata } from "next";
import { AccountScreen } from "@/modules/accounts/ui/account-screen";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return <AccountScreen view="login" />;
}
