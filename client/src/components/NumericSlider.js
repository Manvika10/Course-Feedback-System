import React, { useState, useRef, useCallback } from 'react';

const NumericSlider = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  minLabel = '',
  maxLabel = '',
  readOnly = false,
  label = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);

  const percentage = value !== null && value !== undefined
    ? ((value - min) / (max - min)) * 100
    : 50;

  const handleChange = useCallback((e) => {
    if (!readOnly && onChange) {
      onChange(Number(e.target.value));
    }
  }, [readOnly, onChange]);

  return (
    <div className={`slider-container ${isDragging ? 'dragging' : ''}`}>
      {label && <div className="slider-label">{label}</div>}
      <div className="slider-track-wrapper" ref={sliderRef}>
        <input
          type="range"
          className="slider-input"
          min={min}
          max={max}
          step={step}
          value={value !== null && value !== undefined ? value : (min + max) / 2}
          onChange={handleChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          disabled={readOnly}
          style={{
            '--slider-progress': `${percentage}%`,
          }}
        />
        <div
          className="slider-tooltip"
          style={{ left: `${percentage}%` }}
        >
          {value !== null && value !== undefined ? value : '—'}
        </div>
      </div>
      <div className="slider-labels">
        <span>{minLabel || min}</span>
        <span>{maxLabel || max}</span>
      </div>
    </div>
  );
};

export default NumericSlider;
