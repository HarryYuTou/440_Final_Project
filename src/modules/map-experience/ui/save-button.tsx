"use client";

import Link from "next/link";
import { useState } from "react";
import { BookmarkIcon } from "@/components/icons";
import type { ApiResult, ItemReference } from "@/contracts";
import styles from "./save-button.module.css";

type Message =
  | { kind: "saved" }
  | { kind: "removed" }
  | { kind: "unavailable" }
  | { kind: "sign-in" }
  | { kind: "failed" };

async function readEnvelope(response: Response): Promise<ApiResult<unknown> | null> {
  try {
    const body: unknown = await response.json();
    return body && typeof body === "object" && "ok" in body ? (body as ApiResult<unknown>) : null;
  } catch {
    return null;
  }
}

/**
 * Stand-in save action until Member 3's shared save action lands. When it
 * does, swap the two usages (bean-detail.tsx, drink-detail.tsx) and delete
 * this file and save-button.module.css.
 *
 * It calls the shared `/api/saved` contract (POST/DELETE with an
 * ItemReference; no second store) and only reports success when the service
 * answers 200 with `ok: true`. Known gap: it does not GET /api/saved for the
 * initial state, so it never claims an item is already saved.
 */
export function SaveButton({ itemType, itemId, itemName }: ItemReference & { itemName: string }) {
  // null: unknown. The page does not know whether this item is in the user's list.
  const [saved, setSaved] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

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
      const envelope = await readEnvelope(response);
      if (response.status === 200 && envelope?.ok === true) {
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

  return (
    <div className={styles.root}>
      <button
        type="button"
        className={`button ${styles.button}`}
        data-saved={saved === true ? "true" : undefined}
        aria-describedby={message ? `save-status-${itemId}` : undefined}
        aria-label={saved ? `Saved: ${itemName}. Remove from saved` : `Save ${itemName}`}
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
        {message?.kind === "unavailable" ? "Saving isn’t available yet." : null}
        {message?.kind === "sign-in" ? (
          <>
            Sign in to save this {noun}.{" "}
            <Link className={styles.statusLink} href="/login">
              Sign in
            </Link>
          </>
        ) : null}
        {message?.kind === "failed" ? `We couldn’t ${saved ? "update" : "save"} this ${noun} right now. Please try again.` : null}
      </p>
    </div>
  );
}
