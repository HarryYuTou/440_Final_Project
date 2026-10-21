"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookmarkIcon } from "@/components/icons";
import type { ApiResult, ItemReference, SavedItem } from "@/contracts";
import styles from "./save-action.module.css";

type Message =
  | { kind: "saved" }
  | { kind: "removed" }
  | { kind: "unavailable" }
  | { kind: "sign-in" }
  | { kind: "failed" };

async function readEnvelope<T>(response: Response): Promise<ApiResult<T> | null> {
  try {
    const body: unknown = await response.json();
    return body && typeof body === "object" && "ok" in body ? (body as ApiResult<T>) : null;
  } catch {
    return null;
  }
}

/**
 * One GET /api/saved per page, shared by every save action on it. Resolves to
 * the saved keys, or null when the list cannot be read (signed out,
 * unavailable, offline), in which case the button makes no claim either way.
 */
let savedKeys: Promise<Set<string> | null> | null = null;
const keyOf = ({ itemType, itemId }: ItemReference) => `${itemType}:${itemId}`;

function loadSavedKeys(): Promise<Set<string> | null> {
  savedKeys ??= fetch("/api/saved", { cache: "no-store", credentials: "same-origin" })
    .then(async (response) => {
      const envelope = await readEnvelope<SavedItem[]>(response);
      return response.status === 200 && envelope?.ok ? new Set(envelope.data.map(keyOf)) : null;
    })
    .catch(() => null);
  return savedKeys;
}

/**
 * The shared save action for beans and drinks (map detail pages and AI
 * results). It stores only the stable catalog reference through
 * `/api/saved`, and reports success only when the service answers 200 with
 * `ok: true`.
 */
export function SaveAction({ itemType, itemId, itemName }: ItemReference & { itemName: string }) {
  // null: unknown until the saved list loads (or if it cannot be read).
  const [saved, setSaved] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  useEffect(() => {
    let active = true;
    void loadSavedKeys().then((keys) => {
      if (active && keys) setSaved(keys.has(keyOf({ itemType, itemId })));
    });
    return () => { active = false; };
  }, [itemType, itemId]);

  async function toggle() {
    if (pending) return;
    const method = saved ? "DELETE" : "POST";
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/saved", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemType, itemId } satisfies ItemReference),
        cache: "no-store",
        credentials: "same-origin",
      });
      const envelope = await readEnvelope<unknown>(response);
      if (response.status === 200 && envelope?.ok === true) {
        savedKeys = null;
        setSaved(method === "POST");
        setMessage({ kind: method === "POST" ? "saved" : "removed" });
      } else if (response.status === 503) {
        setMessage({ kind: "unavailable" });
      } else if (response.status === 401) {
        setMessage({ kind: "sign-in" });
      } else {
        setMessage({ kind: "failed" });
      }
    } catch {
      setMessage({ kind: "failed" });
    } finally {
      setPending(false);
    }
  }

  const noun = itemType === "bean" ? "bean" : "drink";
  const label = pending ? (saved ? "Removing…" : "Saving…") : saved ? "Saved" : "Save";
  const signInHref = typeof window === "undefined" ? "/login" : `/login?next=${encodeURIComponent(window.location.pathname)}`;

  return (
    <div className={styles.root}>
      <button
        type="button"
        className={`button ${styles.button}`}
        data-saved={saved === true ? "true" : undefined}
        aria-describedby={message ? `save-status-${itemId}` : undefined}
        aria-label={saved ? `Saved: ${itemName}. Remove from saved` : `Save ${itemName}`}
        aria-pressed={saved ?? undefined}
        onClick={toggle}
        disabled={pending}
      >
        <BookmarkIcon width={18} height={18} className={styles.icon} />
        {label}
      </button>
      <p id={`save-status-${itemId}`} className={styles.status} role="status" data-kind={message?.kind}>
        {message?.kind === "saved" ? (
          <>
            Saved to your list.{" "}
            <Link className={styles.statusLink} href="/saved">
              View saved
            </Link>
          </>
        ) : null}
        {message?.kind === "removed" ? `Removed this ${noun} from your saved list.` : null}
        {message?.kind === "unavailable" ? "Saving isn’t available right now." : null}
        {message?.kind === "sign-in" ? (
          <>
            Sign in to save this {noun}.{" "}
            <Link className={styles.statusLink} href={signInHref}>
              Sign in
            </Link>
          </>
        ) : null}
        {message?.kind === "failed" ? `We couldn’t ${saved ? "update" : "save"} this ${noun} right now. Please try again.` : null}
      </p>
    </div>
  );
}
