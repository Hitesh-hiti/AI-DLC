/**
 * Currency Amount Component
 * Displays formatted money with currency
 */

import React from 'react';
import type { Money } from '../../api/types/common';
import { formatMoney } from '../../utils/currency';

export interface CurrencyAmountProps {
  money: Money;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  highlight?: boolean;
  negative?: boolean;
}

export const CurrencyAmount: React.FC<CurrencyAmountProps> = ({
  money,
  className = '',
  size = 'md',
  highlight = false,
  negative = false,
}) => {
  const sizeClass = `currency-${size}`;
  const highlightClass = highlight ? 'currency-highlight' : '';
  const negativeClass = negative ? 'negative' : '';

  return (
    <span className={`currency-amount ${sizeClass} ${highlightClass} ${negativeClass} ${className}`}>
      {formatMoney(money)}
    </span>
  );
};

CurrencyAmount.displayName = 'CurrencyAmount';
