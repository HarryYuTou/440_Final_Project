import "server-only";
import { unavailable, type CatalogService } from "@/contracts";

/** Member 3 replaces this adapter with real catalog reads. No automatic fixture fallback. */
export const catalogService: CatalogService = {
  async list() { return unavailable("Catalog"); },
  async getBean() { return unavailable("Catalog"); },
  async getDrink() { return unavailable("Catalog"); },
};
