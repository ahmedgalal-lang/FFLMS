import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "brand" | "success" | "warning" | "critical" | "accent";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-surface-3 text-ink-2",
    brand: "bg-brand-soft text-brand-strong",
    success: "bg-[color:var(--success)]/15 text-[color:var(--success)]",
    warning: "bg-[color:var(--warning)]/15 text-[color:var(--warning)]",
    critical: "bg-[color:var(--critical)]/15 text-[color:var(--critical)]",
    accent: "bg-[color:var(--accent)]/15 text-[color:var(--accent)]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

type ButtonBase = {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
};

const btnClasses = ({ variant = "primary", size = "md" }: ButtonBase) => {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold border transition-colors disabled:opacity-60 disabled:pointer-events-none";
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2 text-sm" };
  const variants = {
    primary:
      "bg-brand text-brand-ink border-transparent hover:bg-brand-strong",
    secondary:
      "bg-surface text-ink border-line hover:border-ink-3 shadow-sm",
    ghost: "bg-transparent text-ink-2 border-transparent hover:bg-surface-2",
  };
  return `${base} ${sizes[size]} ${variants[variant]}`;
};

export function Button({
  variant,
  size,
  ...props
}: ButtonBase & ComponentProps<"button">) {
  return <button className={btnClasses({ variant, size })} {...props} />;
}

export function ButtonLink({
  variant,
  size,
  ...props
}: ButtonBase & ComponentProps<typeof Link>) {
  return <Link className={btnClasses({ variant, size })} {...props} />;
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-line bg-surface shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function Field({
  label,
  name,
  error,
  ...props
}: { label: string; error?: string } & ComponentProps<"input">) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-3">
        {label}
      </span>
      <input
        name={name}
        className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand"
        {...props}
      />
      {error ? (
        <span className="mt-1 block text-xs text-[color:var(--critical)]">
          {error}
        </span>
      ) : null}
    </label>
  );
}

export function ProgressBar({ percent }: { percent: number }) {
  const p = Math.max(0, Math.min(100, percent));
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-surface-3"
      role="progressbar"
      aria-valuenow={p}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-brand"
        style={{ width: `${p}%` }}
      />
    </div>
  );
}
