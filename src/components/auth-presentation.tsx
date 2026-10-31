"use client";
import Link from "next/link";
import { useState } from "react";
import { Badge, Button, Feedback, TextInput } from "@/components/ui/primitives";

export function RoleSelection() {
  const [role, setRole] = useState("customer");
  return <fieldset className="role-picker"><legend>I’m here to…</legend><div className="role-options"><label className="role-option"><input type="radio" name="preview-role" value="customer" checked={role === "customer"} onChange={() => setRole("customer")}/>Find a professional</label><label className="role-option"><input type="radio" name="preview-role" value="provider" checked={role === "provider"} onChange={() => setRole("provider")}/>Offer my services</label></div><p className="field-hint mt-3">Presentation only. This selection does not create an account or assign permissions.</p></fieldset>;
}
export function AuthPresentation({ mode }: { mode: "sign-in" | "sign-up" }) {
  const registration = mode === "sign-up";
  return <><Badge tone="blue">Authentication preview</Badge><h1>{registration ? "Your next connection starts here." : "Good to see you here."}</h1><p>{registration ? "One place to find help or share your skills." : "A simpler home for your jobs and conversations."}</p>{registration && <RoleSelection/>}<Feedback title="Sign-in is not available yet.">Authentication and account recovery will be introduced in a later stage.</Feedback>{registration && <TextInput id="preview-name" label="Your name" placeholder="Full name" autoComplete="off" disabled/>}<TextInput id="preview-email" label="Email address" placeholder="you@example.com" autoComplete="off" type="email" hint="Visual placeholder. No information is collected." disabled/><Button disabled>{registration ? "Create account — coming later" : "Continue — coming later"}</Button><p className="auth-alternate">{registration ? "Already have an account? " : "New to Servify? "}<Link className="text-link" href={registration ? "/auth/sign-in" : "/auth/sign-up"}>{registration ? "Sign in" : "Create an account"}</Link></p></>;
}
