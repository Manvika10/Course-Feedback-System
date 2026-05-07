import React, { useState } from 'react';

const NPSRating = ({ value, onChange, readOnly = false }) => {
  const [hovered, setHovered] = useState(null);

  const getColor = (score) => {
    if (score <= 6) return 'var(--error)';
    if (score <= 8) return 'var(--warning)';
    return 'var(--success)';
  };

  const getCategory = (score) => {
    if (score === null || score === undefined) return '';
    if (score <= 6) return 'Detractor';
    if (score <= 8) return 'Passive';
    return 'Promoter';
  };

  const displayValue = hovered !== null ? hovered : value;

  return (
    <div className="nps-container">
      <div className="nps-labels-row">
        <span className="nps-label-text" style={{ color: 'var(--error)' }}>Not at all likely</span>
        <span className="nps-label-text" style={{ color: 'var(--success)' }}>Extremely likely</span>
      </div>
      <div className="nps-scale">
        {Array.from({ length: 11 }, (_, i) => {
          const isSelected = value === i;
          const isHov = hovered === i;
          return (
            <button
              key={i}
              type="button"
              className={`nps-btn ${isSelected ? 'selected' : ''} ${isHov ? 'hovered' : ''}`}
              style={{
                '--nps-color': getColor(i),
                background: isSelected ? getColor(i) : isHov ? `${getColor(i)}33` : 'var(--bg-input)',
                color: isSelected ? 'white' : 'var(--text-secondary)',
                borderColor: isSelected || isHov ? getColor(i) : 'var(--border)',
              }}
              onClick={() => !readOnly && onChange && onChange(isSelected ? null : i)}
              onMouseEnter={() => !readOnly && setHovered(i)}
              onMouseLeave={() => !readOnly && setHovered(null)}
              disabled={readOnly}
              aria-label={`Rate ${i} out of 10`}
            >
              {i}
            </button>
          );
        })}
      </div>
      <div className="nps-category-row">
        <div className="nps-category-bar">
          <span className="nps-cat nps-detractor">Detractor (0–6)</span>
          <span className="nps-cat nps-passive">Passive (7–8)</span>
          <span className="nps-cat nps-promoter">Promoter (9–10)</span>
        </div>
      </div>
      {displayValue !== null && displayValue !== undefined && (
        <div className="nps-selected-info" style={{ color: getColor(displayValue) }}>
          Score: {displayValue} — {getCategory(displayValue)}
        </div>
      )}
    </div>
  );
};

export default NPSRating;
