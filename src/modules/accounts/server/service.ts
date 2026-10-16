import "server-only";
import { PAID_CAPABILITY, unavailable, type AccountsService } from "@/contracts";

/** Member 4 replaces this adapter. Never infer identity or payment from browser input. */
export const accountsService: AccountsService = {
  async getSession() { return { status: "unavailable", user: null }; },
  async getPreferences() { return unavailable("Preferences"); },
  async savePreferences() { return unavailable("Preferences"); },
  async listSaved() { return unavailable("Saved items"); },
  async saveItem() { return unavailable("Saved items"); },
  async removeSaved() { return unavailable("Saved items"); },
  async getAccess() {
    return { capability: PAID_CAPABILITY, status: "unavailable", allowed: false };
  },
  async createCheckout() { return unavailable("Checkout"); },
};
