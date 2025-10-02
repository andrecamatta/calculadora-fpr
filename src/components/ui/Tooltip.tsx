/**
 * Componente Tooltip com Referências Normativas
 * Mostra informações detalhadas sobre campos do formulário
 */

import React, { useState } from "react";

export interface TooltipConfig {
  description: string;
  article: string;
  regulation: string;
}

interface TooltipProps {
  config: TooltipConfig;
}

export const Tooltip: React.FC<TooltipProps> = ({ config }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block ml-1">
      {/* Ícone de informação */}
      <button
        type="button"
        className="inline-flex items-center justify-center w-4 h-4 text-xs rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors cursor-help"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        aria-label="Mais informações"
      >
        <span className="font-semibold">i</span>
      </button>

      {/* Tooltip content */}
      {isVisible && (
        <div
          className="absolute z-50 left-0 bottom-full mb-2 w-80 p-3 rounded-lg shadow-lg border bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-sm"
          role="tooltip"
        >
          {/* Seta do tooltip */}
          <div className="absolute left-2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-neutral-200 dark:border-t-neutral-700" />
          <div className="absolute left-2 top-full -mt-px w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white dark:border-t-neutral-800" />

          {/* Descrição */}
          <p className="text-neutral-700 dark:text-neutral-200 mb-2 leading-relaxed">
            {config.description}
          </p>

          {/* Referências normativas */}
          <div className="text-xs space-y-1 pt-2 border-t border-neutral-200 dark:border-neutral-700">
            <div className="flex items-start">
              <span className="text-neutral-500 dark:text-neutral-400 mr-2">📖</span>
              <span className="text-neutral-600 dark:text-neutral-300 font-mono">
                {config.article}
              </span>
            </div>
            <div className="flex items-start">
              <span className="text-neutral-500 dark:text-neutral-400 mr-2">📜</span>
              <span className="text-neutral-600 dark:text-neutral-300 font-medium">
                {config.regulation}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
