"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowIcon } from "@/components/icons";
import { type CheckoutSession, PAID_CAPABILITY, type RecommendationAllowance } from "@/contracts";
import { callApi, dataOf, messageOf } from "./client";
import styles from "./accounts.module.css";

type State =
  | { kind: "loading" }
  | { kind: "sign-in" }
  | { kind: "unavailable" }
  | { kind: "ready"; allowance: RecommendationAllowance };

export function UpgradePanel() {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [pending, setPending] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void callApi<RecommendationAllowance>("/api/usage").then((reply) => {
      if (!active) return;
      const allowance = dataOf(reply);
      if (allowance) setState({ kind: "ready", allowance });
      else setState(reply.status === 401 ? { kind: "sign-in" } : { kind: "unavailable" });
    });
    return () => { active = false; };
  }, []);

  async function startCheckout() {
    setPending(true);
    setProblem(null);
    const reply = await callApi<CheckoutSession>("/api/checkout", { method: "POST", body: { capability: PAID_CAPABILITY } });
    const session = dataOf(reply);
    if (session) {
      window.location.assign(session.url);
      return;
    }
    setPending(false);
    setProblem(messageOf(reply, "We couldn’t start checkout. Check your connection and try again."));
  }

  return (
    <div className={styles.stack}>
      <section className={styles.card} aria-labelledby="plan-free">
        <h2 id="plan-free">Free</h2>
        <p>Explore every country, bean and drink, save what you like, and get 3 AI recommendations matched to your taste.</p>
      </section>
      <section className={styles.card} aria-labelledby="plan-unlimited">
        <span className={styles.badge}>One-time unlock</span>
        <h2 id="plan-unlimited">Unlimited recommendations</h2>
        <p>A single payment unlocks unlimited AI recommendations on your account, for good. No subscription.</p>
        <p className={styles.muted}>
          This project uses Stripe’s test mode: use the test card 4242 4242 4242 4242 with any future date and CVC. No real money moves.
        </p>
        {state.kind === "loading" ? <p className={styles.muted} role="status">Checking your account…</p> : null}
        {state.kind === "sign-in" ? (
          <div className={styles.row}>
            <Link className="button button-primary" href="/login?next=/upgrade">Sign in to unlock<ArrowIcon /></Link>
          </div>
        ) : null}
        {state.kind === "unavailable" ? <p className={styles.muted}>Checkout isn’t available right now. Please try again later.</p> : null}
        {state.kind === "ready" && state.allowance.paid ? (
          <p className={styles.message} data-kind="success">Unlimited recommendations are already unlocked on your account.</p>
        ) : null}
        {state.kind === "ready" && !state.allowance.paid ? (
          <>
            <p>{state.allowance.freeRemaining} of {state.allowance.freeLimit} free recommendations left.</p>
            <div className={styles.row}>
              <button type="button" className="button button-primary" onClick={startCheckout} disabled={pending}>
                {pending ? "Opening checkout…" : "Unlock with Stripe"}<ArrowIcon />
              </button>
            </div>
          </>
        ) : null}
        {problem ? <p className={styles.message} data-kind="error" role="alert">{problem}</p> : null}
      </section>
    </div>
  );
}
