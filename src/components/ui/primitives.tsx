import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, Ref } from "react";
import { Icon, type IconName } from "./icon";

type ButtonVariant = "primary" | "secondary" | "ghost" | "accent";
export function Button({ variant = "primary", className = "", type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; ref?: Ref<HTMLButtonElement> }) {
  return <button type={type} className={`button button-${variant} ${className}`} {...props}/>;
}
export function ButtonLink({ href, children, variant = "primary", icon, className = "" }: { href: string; children: ReactNode; variant?: ButtonVariant; icon?: IconName; className?: string }) {
  return <Link href={href} className={`button button-${variant} ${className}`}>{children}{icon && <Icon name={icon} size={16}/>}</Link>;
}
export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "blue" | "orange" | "success" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) { return <div className={`card ${className}`}>{children}</div>; }
export function PageHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="page-heading"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>;
}
export function TextInput({ id, label, hint, error, ...props }: InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; hint?: string; error?: string }) {
  const descriptionId = `${id}-description`;
  return <div className="field"><label htmlFor={id}>{label}</label><input id={id} className="input" aria-invalid={error ? true : undefined} aria-describedby={hint || error ? descriptionId : undefined} {...props}/>{(hint || error) && <p id={descriptionId} className={error ? "field-error" : "field-hint"}>{error || hint}</p>}</div>;
}
export function EmptyState({ icon = "jobs", title, description, action }: { icon?: IconName; title: string; description: string; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-icon"><Icon name={icon} size={28}/></div><h2>{title}</h2><p>{description}</p>{action}</div>;
}
export function Feedback({ title, children, tone = "info", live = false }: { title: string; children?: ReactNode; tone?: "info" | "error" | "success"; live?: boolean }) {
  return <div className={`feedback feedback-${tone}`} role={live ? tone === "error" ? "alert" : "status" : undefined}><Icon name={tone === "success" ? "check" : "info"} size={18}/><div><strong>{title}</strong>{children && <p>{children}</p>}</div></div>;
}
export function LoadingState({ label = "Loading your workspace…" }: { label?: string }) { return <div className="loading-state" role="status"><span className="spinner" aria-hidden="true"/>{label}</div>; }
export function PreviewNote({ marketplace = false }: { marketplace?: boolean }) { return <p className="preview-note"><Icon name="info" size={14}/><span>{marketplace ? "Local prototype · Records stay in this browser. No authenticated accounts, live bookings or provider communications." : "Design preview · Marketplace services are not available yet. No account or activity data is connected."}</span></p>; }
