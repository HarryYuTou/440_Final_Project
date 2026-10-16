import type { ApiResult, ItemReference } from "./common";
import type { Bean, CatalogFilter, CatalogSnapshot, Drink } from "./catalog";
import type { CheckoutInput, CheckoutSession, PaidAccess, Preferences, SavedItem, SessionState } from "./accounts";
import type { RecommendationRequest, RecommendationResponse } from "./recommendations";

export interface CatalogService {
  list(filter: CatalogFilter): Promise<ApiResult<CatalogSnapshot>>;
  getBean(id: string): Promise<ApiResult<Bean>>;
  getDrink(id: string): Promise<ApiResult<Drink>>;
}

/** Implementations derive identity from verified server-side session state in the request. */
export interface AccountsService {
  getSession(request: Request): Promise<SessionState>;
  getPreferences(request: Request): Promise<ApiResult<Preferences | null>>;
  savePreferences(request: Request, input: Preferences): Promise<ApiResult<Preferences>>;
  listSaved(request: Request): Promise<ApiResult<SavedItem[]>>;
  saveItem(request: Request, input: ItemReference): Promise<ApiResult<SavedItem>>;
  removeSaved(request: Request, input: ItemReference): Promise<ApiResult<{ removed: boolean }>>;
  getAccess(request: Request): Promise<PaidAccess>;
  createCheckout(request: Request, input: CheckoutInput): Promise<ApiResult<CheckoutSession>>;
}

export interface RecommendationService {
  /** If this feature becomes paid, enforce AccountsService.getAccess on the server here. */
  recommend(request: Request, input: RecommendationRequest): Promise<ApiResult<RecommendationResponse>>;
}
