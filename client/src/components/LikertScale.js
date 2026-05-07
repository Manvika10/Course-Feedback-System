import React from 'react';

const DEFAULT_LABELS = [
  'Strongly Disagree',
  'Disagree',
  'Neutral',
  'Agree',
  'Strongly Agree',
];

const LikertScale = ({
  value,
  onChange,
  min = 1,
  max = 5,
  minLabel = 'Strongly Disagree',
  maxLabel = 'Strongly Agree',
  readOnly = false,
}) => {
  const points = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  // Generate labels for each point
  const getLabel = (point) => {
    const idx = point - min;
    const total = max - min;
    if (total === 4) {
      return DEFAULT_LABELS[idx] || `${point}`;
    }
    if (idx === 0) return minLabel;
    if (idx === total) return maxLabel;
    return `${point}`;
  };

  return (
    <div className="likert-container">
      <div className="likert-scale">
        {points.map((point) => {
          const isSelected = value === point;
          return (
            <button
              key={point}
              type="button"
              className={`likert-option ${isSelected ? 'selected' : ''}`}
              onClick={() => !readOnly && onChange && onChange(isSelected ? null : point)}
              disabled={readOnly}
              aria-label={getLabel(point)}
            >
              <div className={`likert-radio ${isSelected ? 'active' : ''}`}>
                {isSelected && <div className="likert-radio-dot" />}
              </div>
              <span className="likert-option-label">{getLabel(point)}</span>
            </button>
          );
        })}
      </div>
      <div className="likert-endpoints">
        <span className="likert-endpoint">{minLabel}</span>
        <span className="likert-endpoint">{maxLabel}</span>
      </div>
    </div>
  );
};

export default LikertScale;
