import React, { memo } from 'react';
import { getBorderRadius, sanitizeString, formatSolAmount } from '../../utils';
import type { ProductListProps } from '../../types';

export const ProductList = memo<ProductListProps>(({ products, theme, showDetails }) => {
  if (!showDetails || !products.length) return null;

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      {products.map(product => (
        <div
          key={product.id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75rem',
            backgroundColor: theme.backgroundColor === '#ffffff' ? '#f9fafb' : `${theme.backgroundColor}20`,
            borderRadius: getBorderRadius('sm'),
            marginBottom: '0.5rem'
          }}
        >
          <div>
            <div style={{ fontWeight: '600', color: theme.textColor }}>
              {sanitizeString(product.name)}
            </div>
            {product.description && (
              <div style={{ fontSize: '0.875rem', color: `${theme.textColor}70` }}>
                {sanitizeString(product.description)}
              </div>
            )}
          </div>
          <div style={{ fontWeight: '600', color: theme.primaryColor }}>
            {formatSolAmount(product.price)} SOL
          </div>
        </div>
      ))}
    </div>
  );
});

ProductList.displayName = 'ProductList';