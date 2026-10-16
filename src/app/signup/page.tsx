import type { Metadata } from "next";
import { AccountScreen } from "@/modules/accounts/ui/account-screen";

export const metadata: Metadata = { title: "Create an account" };

export default function SignupPage() {
  return <AccountScreen view="signup" />;
}
