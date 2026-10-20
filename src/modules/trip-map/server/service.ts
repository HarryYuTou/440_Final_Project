import "server-only";
import {
  type AccountsService,
  type ApiFailure,
  type ApiResult,
  type Preferences,
  type SavedItem,
  type SessionState,
  success,
  type TripItinerary,
  type TripResponse,
  type TripService,
} from "@/contracts";
import { type AiFailure, type GenerateStructured, generateStructured } from "@/lib/server/ai-client";
import { accountsService } from "@/modules/accounts/server/service";
import { hasUsablePreferences } from "@/modules/recommendations/lib/candidates";
import { loadRecommendationCatalog, type RecommendationCatalog } from "@/modules/recommendations/server/catalog-source";
import { buildDestinations, resolveSaved } from "@/modules/trip-map/lib/destinations";
import { tripModelOutputSchema, validateTripOutput } from "@/modules/trip-map/lib/model-output";
import { buildTripPrompt, TRIP_SYSTEM } from "@/modules/trip-map/lib/prompt";

const fail = (code: ApiFailure["error"]["code"], message: string, retryable: boolean): ApiFailure =>
  ({ ok: false, error: { code, message, retryable } });

function aiFailure(failure: AiFailure): ApiFailure {
  switch (failure.kind) {
    case "not-configured":
      return fail("SERVICE_UNAVAILABLE", "The AI trip planner isn’t configured on this server yet.", false);
    case "provider":
      return failure.retryable
        ? fail("SERVICE_UNAVAILABLE", "The trip planner is busy or unreachable. Please try again in a moment.", true)
        : fail("SERVICE_UNAVAILABLE", "The trip planner can’t be used right now.", false);
    case "refused":
      return fail("INTERNAL_ERROR", "We couldn’t plan a trip for this request. Try rewording your notes.", false);
    case "invalid-output":
      return fail("INTERNAL_ERROR", "The AI’s route couldn’t be checked against the atlas. Please try again.", true);
  }
}

/** One retry when the plan fails validation; then an error, never an unchecked route. */
const MAX_ATTEMPTS = 2;

/** Off until the team picks the trip map as the paid benefit (TEAM_BRANCH_PLAN.md §6.8). */
export const tripRequiresAccess = () => process.env.TRIP_REQUIRES_ACCESS?.trim() === "true";

type AccountReads = Pick<AccountsService, "getSession" | "getPreferences" | "listSaved" | "getAccess">;

async function safeSession(accounts: AccountReads, request: Request): Promise<SessionState> {
  try {
    return await accounts.getSession(request);
  } catch {
    return { status: "unavailable", user: null };
  }
}

/** Account preferences and saved items, read only for a verified signed-in session. */
async function readAccount(accounts: AccountReads, request: Request, session: SessionState, wantSaved: boolean) {
  let preferences: Preferences | null = null;
  let saved: SavedItem[] = [];
  if (session.status !== "signed-in") return { preferences, saved };
  try {
    const result = await accounts.getPreferences(request);
    if (result.ok) preferences = result.data;
  } catch {
    // Treated as no saved preferences; the form can still send them.
  }
  if (wantSaved) {
    try {
      const result = await accounts.listSaved(request);
      if (result.ok) saved = result.data;
    } catch {
      // Treated as no saved items.
    }
  }
  return { preferences, saved };
}

export function createTripService(deps: {
  loadCatalog: () => Promise<RecommendationCatalog>;
  generate: GenerateStructured;
  accounts: AccountReads;
  requiresAccess: () => boolean;
}): TripService {
  return {
    async plan(request, input): Promise<ApiResult<TripResponse>> {
      if (deps.requiresAccess()) {
        const access = await deps.accounts.getAccess(request).catch(() => null);
        if (!access || access.status === "unavailable") {
          return fail("SERVICE_UNAVAILABLE", "We can’t check your plan right now, so the trip planner is unavailable.", true);
        }
        if (!access.allowed) return fail("FORBIDDEN", "The AI trip map is part of the paid plan. Upgrade to plan a trip.", false);
      }

      const catalog = await deps.loadCatalog();
      if (catalog.status === "unavailable") return fail("SERVICE_UNAVAILABLE", "The coffee catalog isn’t connected yet.", false);
      if (catalog.status === "error") return fail("INTERNAL_ERROR", "We couldn’t load the coffee catalog right now.", true);

      const session = await safeSession(deps.accounts, request);
      const account = await readAccount(deps.accounts, request, session, input.useSavedItems);
      const preferences = input.preferences ?? account.preferences;
      const usablePreferences = preferences && hasUsablePreferences(preferences) ? preferences : null;
      const saved = input.useSavedItems ? resolveSaved(catalog.snapshot, account.saved) : [];

      if (!usablePreferences && saved.length === 0) {
        const suggestions = ["Pick a flavor you enjoy, such as chocolate or fruity.", "Describe your usual coffee in the notes."];
        if (session.status === "signed-out") suggestions.push("Sign in to plan around the beans and drinks you saved.");
        if (session.status === "signed-in") suggestions.push("Save a few beans or drinks from the map, then plan again.");
        return success({ status: "no-trip", reason: "We need a preference or a saved item to plan a trip for you.", suggestions });
      }

      const destinations = buildDestinations(catalog.snapshot, saved);
      if (destinations.length < 2) {
        return success({
          status: "no-trip",
          reason: "The atlas doesn’t cover enough places yet to plan a trip.",
          suggestions: ["Explore the places the atlas already covers.", "Try again once more countries are added."],
        });
      }

      const basis: TripItinerary["basis"] = {
        preferences: usablePreferences ? (input.preferences ? "request" : "account") : "none",
        savedItems: saved.length,
      };
      const stopCount = Math.min(input.stopCount, destinations.length);

      let retryProblem: string | undefined;
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        const answer = await deps.generate({
          system: TRIP_SYSTEM,
          prompt: buildTripPrompt({ preferences: usablePreferences, destinations, stopCount, retryProblem }),
          schema: tripModelOutputSchema,
        });
        if (!answer.ok) {
          if (answer.failure.kind === "invalid-output") continue;
          return aiFailure(answer.failure);
        }
        const checked = validateTripOutput(answer.data, { destinations, stopCount, basis });
        if (checked.ok) return success(checked.response);
        retryProblem = checked.problem;
      }
      return aiFailure({ kind: "invalid-output" });
    },
  };
}

export const tripService: TripService = createTripService({
  loadCatalog: loadRecommendationCatalog,
  generate: generateStructured,
  accounts: accountsService,
  requiresAccess: tripRequiresAccess,
});
