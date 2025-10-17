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
  <section className="mb-3">
    <h2 className="text-xl font-semibold mb-0.5">{title}</h2>
    {subtitle && <p className="text-sm text-neutral-500 mb-1.5">{subtitle}</p>}
    <div className="grid gap-3">{children}</div>
  </section>
);

export const Row: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="grid md:grid-cols-3 gap-2 items-start auto-rows-min">{children}</div>
);

interface CardProps {
  title?: string;
  subtitle?: string;
  titleTooltip?: TooltipConfig;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ title, subtitle, titleTooltip, children, className = "" }) => {
  const [isTooltipVisible, setIsTooltipVisible] = React.useState(false);

  return (
    <div className={`rounded-2xl border p-1.5 shadow-sm bg-white self-start ${className}`}>
      {title && (
        <div className="relative">
          <h3
            className={`font-medium text-sm mb-0.5 ${titleTooltip ? 'cursor-help' : ''}`}
            onMouseEnter={() => titleTooltip && setIsTooltipVisible(true)}
            onMouseLeave={() => setIsTooltipVisible(false)}
          >
            {title}
          </h3>

          {/* Tooltip content para o título */}
          {titleTooltip && isTooltipVisible && (
            <div
              className="absolute z-50 left-0 bottom-full mb-2 w-80 p-3 rounded-lg shadow-lg border bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-sm"
              role="tooltip"
            >
              {/* Seta do tooltip */}
              <div className="absolute left-2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-neutral-200 dark:border-t-neutral-700" />
              <div className="absolute left-2 top-full -mt-px w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white dark:border-t-neutral-800" />

              {/* Descrição */}
              <p className="text-neutral-700 dark:text-neutral-200 mb-2 leading-relaxed">
                {titleTooltip.description}
              </p>

              {/* Referências normativas */}
              <div className="text-xs space-y-1 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                <div className="flex items-start">
                  <span className="text-neutral-500 dark:text-neutral-400 mr-2">📖</span>
                  <span className="text-neutral-600 dark:text-neutral-300 font-mono">
                    {titleTooltip.article}
                  </span>
                </div>
                <div className="flex items-start">
                  <span className="text-neutral-500 dark:text-neutral-400 mr-2">📜</span>
                  <span className="text-neutral-600 dark:text-neutral-300 font-medium">
                    {titleTooltip.regulation}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {subtitle && <p className="text-xs text-neutral-500 mb-1.5">{subtitle}</p>}
      {children}
    </div>
  );
};

interface LabelProps {
  children: React.ReactNode;
  tooltip?: TooltipConfig;
}

export const Label: React.FC<LabelProps> = ({ children, tooltip }) => {
  const [isVisible, setIsVisible] = React.useState(false);

  return (
    <div className="relative">
      <label
        className="text-xs font-medium block mb-1 cursor-help"
        onMouseEnter={() => tooltip && setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </label>

      {/* Tooltip content */}
      {tooltip && isVisible && (
        <div
          className="absolute z-50 left-0 bottom-full mb-2 w-80 p-3 rounded-lg shadow-lg border bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-sm"
          role="tooltip"
        >
          {/* Seta do tooltip */}
          <div className="absolute left-2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-neutral-200 dark:border-t-neutral-700" />
          <div className="absolute left-2 top-full -mt-px w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white dark:border-t-neutral-800" />

          {/* Descrição */}
          <p className="text-neutral-700 dark:text-neutral-200 mb-2 leading-relaxed">
            {tooltip.description}
          </p>

          {/* Referências normativas */}
          <div className="text-xs space-y-1 pt-2 border-t border-neutral-200 dark:border-neutral-700">
            <div className="flex items-start">
              <span className="text-neutral-500 dark:text-neutral-400 mr-2">📖</span>
              <span className="text-neutral-600 dark:text-neutral-300 font-mono">
                {tooltip.article}
              </span>
            </div>
            <div className="flex items-start">
              <span className="text-neutral-500 dark:text-neutral-400 mr-2">📜</span>
              <span className="text-neutral-600 dark:text-neutral-300 font-medium">
                {tooltip.regulation}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

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
    className={`w-full rounded-xl border px-3 py-0.5 h-7 text-xs bg-transparent ${className}`}
  >
    {children}
  </select>
);

interface InputProps {
  value: string | number;
  onChange?: (value: string) => void;
  type?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const Input: React.FC<InputProps> = ({
  value,
  onChange,
  type = "text",
  placeholder,
  className = "",
  disabled = false,
}) => (
  <input
    type={type}
    value={value}
    onChange={onChange ? (e) => onChange(e.target.value) : undefined}
    placeholder={placeholder}
    disabled={disabled}
    className={`w-full rounded-xl border px-3 py-0.5 h-7 text-xs bg-transparent ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
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
  <p className="text-xs text-neutral-500 leading-relaxed">{children}</p>
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
  const baseClasses = "rounded-xl px-3 py-1 text-xs transition-colors";
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
  <div className="space-y-1">
    <Label tooltip={tooltip}>{label}</Label>
    {children}
    {helper && <Helper>{helper}</Helper>}
  </div>
);

interface AccordionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export const Accordion: React.FC<AccordionProps> = ({
  title,
  subtitle,
  children,
  defaultOpen = false
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className="rounded-2xl border shadow-sm bg-white self-start">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-1.5 flex items-center justify-between hover:bg-neutral-50 rounded-t-2xl transition-colors"
        type="button"
      >
        <div className="text-left">
          <h3 className="font-medium text-sm">{title}</h3>
          {subtitle && <p className="text-xs text-neutral-500">{subtitle}</p>}
        </div>
        <svg
          className={`w-5 h-5 text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="p-1.5 pt-0">
          {children}
        </div>
      )}
    </div>
  );
};
