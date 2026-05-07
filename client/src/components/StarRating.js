import React, { useState } from 'react';

const StarRating = ({ rating, onChange, readOnly = false, size = 32 }) => {
  const [hovered, setHovered] = useState(0);

  const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= (hovered || rating);
          return (
            <svg
              key={star}
              className={`star ${filled ? 'active' : ''}`}
              width={size}
              height={size}
              viewBox="0 0 24 24"
              fill={filled ? '#fbbf24' : 'none'}
              stroke={filled ? '#fbbf24' : 'var(--text-muted)'}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                cursor: readOnly ? 'default' : 'pointer',
                transition: 'all 0.15s ease',
                transform: filled ? 'scale(1.1)' : 'scale(1)',
              }}
              onClick={() => !readOnly && onChange && onChange(star)}
              onMouseEnter={() => !readOnly && setHovered(star)}
              onMouseLeave={() => !readOnly && setHovered(0)}
              aria-label={`Rate ${star} out of 5`}
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          );
        })}
        {!readOnly && (
          <span
            style={{
              marginLeft: '8px',
              fontSize: '0.85rem',
              color: hovered || rating ? '#fbbf24' : 'var(--text-muted)',
              fontWeight: 600,
              transition: 'all 0.15s ease',
              minWidth: '70px',
            }}
          >
            {labels[hovered || rating] || 'Select...'}
          </span>
        )}
        {readOnly && rating > 0 && (
          <span
            style={{
              marginLeft: '8px',
              fontSize: '0.85rem',
              color: '#fbbf24',
              fontWeight: 700,
            }}
          >
            {rating}.0
          </span>
        )}
      </div>
    </div>
  );
};

export default StarRating;
