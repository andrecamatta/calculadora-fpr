/**
 * Componentes UI Reutilizáveis (DRY)
 * Componentes básicos de interface sem lógica de negócio
 */

import React from "react";
import { Tooltip, TooltipConfig } from "./Tooltip";

export { Tooltip };
export type { TooltipConfig };

interface SectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({ title, subtitle, children }) => (
  <section className="mb-4">
    <h2 className="text-xl font-semibold mb-1">{title}</h2>
    {subtitle && <p className="text-sm text-neutral-500 mb-2">{subtitle}</p>}
    <div className="grid gap-2">{children}</div>
  </section>
);

export const Row: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="grid md:grid-cols-3 gap-2">{children}</div>
);

interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ title, subtitle, children, className = "" }) => (
  <div className={`rounded-2xl border p-2 shadow-sm bg-white/5 ${className}`}>
    {title && <h3 className="font-medium mb-0.5">{title}</h3>}
    {subtitle && <p className="text-sm text-neutral-500 mb-1">{subtitle}</p>}
    {children}
  </div>
);

interface LabelProps {
  children: React.ReactNode;
  tooltip?: TooltipConfig;
}

export const Label: React.FC<LabelProps> = ({ children, tooltip }) => (
  <label className="text-sm font-medium block mb-1 flex items-center">
    <span>{children}</span>
    {tooltip && <Tooltip config={tooltip} />}
  </label>
);

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({ value, onChange, children, className = "" }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`w-full rounded-xl border px-3 py-2 bg-transparent ${className}`}
  >
    {children}
  </select>
);

interface InputProps {
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  className?: string;
}

export const Input: React.FC<InputProps> = ({
  value,
  onChange,
  type = "text",
  placeholder,
  className = "",
}) => (
  <input
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className={`w-full rounded-xl border px-3 py-2 bg-transparent ${className}`}
  />
);

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export const Switch: React.FC<SwitchProps> = ({ checked, onChange, label }) => (
  <div className="flex items-center gap-2">
    <button
      onClick={() => onChange(!checked)}
      className={`h-6 w-11 rounded-full transition-colors ${
        checked ? "bg-emerald-500" : "bg-neutral-400"
      }`}
      aria-pressed={checked}
      type="button"
    >
      <span
        className={`block h-5 w-5 bg-white rounded-full transform transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
    {label && <span className="text-sm">{label}</span>}
  </div>
);

export const Helper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-xs text-neutral-500 leading-relaxed mt-1">{children}</p>
);

interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  onClick,
  children,
  variant = "secondary",
  className = "",
}) => {
  const baseClasses = "rounded-xl px-4 py-2 transition-colors";
  const variantClasses = {
    primary: "bg-emerald-500 text-white hover:bg-emerald-600",
    secondary: "border hover:bg-white/5",
  };

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      type="button"
    >
      {children}
    </button>
  );
};

interface FieldGroupProps {
  label: string;
  helper?: string;
  children: React.ReactNode;
  tooltip?: TooltipConfig;
}

export const FieldGroup: React.FC<FieldGroupProps> = ({ label, helper, children, tooltip }) => (
  <div>
    <Label tooltip={tooltip}>{label}</Label>
    {children}
    {helper && <Helper>{helper}</Helper>}
  </div>
);
