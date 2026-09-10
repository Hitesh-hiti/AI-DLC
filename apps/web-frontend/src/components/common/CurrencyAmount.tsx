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
}

export const CurrencyAmount: React.FC<CurrencyAmountProps> = ({
  money,
  className = '',
  size = 'md',
  highlight = false,
}) => {
  const sizeClass = `currency-${size}`;
  const highlightClass = highlight ? 'currency-highlight' : '';

  return (
    <span className={`currency-amount ${sizeClass} ${highlightClass} ${className}`}>
      {formatMoney(money)}
    </span>
  );
};

CurrencyAmount.displayName = 'CurrencyAmount';
