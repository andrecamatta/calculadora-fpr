/**
 * Utilitários de Formatação (DRY)
 * Funções reutilizáveis para formatação de dados
 */

/**
 * Limita um valor entre mínimo e máximo
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Formata um número como percentual
 */
export const formatPercent = (value: number | null | undefined): string => {
  if (value == null || Number.isNaN(value)) return "–";
  return `${value.toFixed(1)}%`;
};

/**
 * Formata um valor monetário
 */
export const formatCurrency = (
  value: number | null | undefined,
  decimals: number = 2
): string => {
  if (value == null || Number.isNaN(value)) return "–";
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Formata um valor numérico genérico
 */
export const formatNumber = (
  value: number | null | undefined,
  decimals: number = 2
): string => {
  if (value == null || Number.isNaN(value)) return "–";
  return value.toFixed(decimals);
};

/**
 * Verifica se um valor é numérico válido
 */
export const isValidNumber = (value: any): value is number => {
  return typeof value === "number" && !Number.isNaN(value) && isFinite(value);
};

/**
 * Converte para número ou retorna default
 */
export const toNumber = (value: any, defaultValue: number = 0): number => {
  const num = Number(value);
  return isValidNumber(num) ? num : defaultValue;
};
