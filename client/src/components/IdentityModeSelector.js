import React from 'react';

const MODES = [
  {
    key: 'identified',
    icon: '👤',
    label: 'Identified',
    description: 'Your name and email will be visible to instructors and admins.',
    color: 'var(--info)',
  },
  {
    key: 'pseudonymous',
    icon: '🎭',
    label: 'Pseudonymous',
    description: 'A random display name will be used instead of your real identity.',
    color: 'var(--warning)',
  },
  {
    key: 'anonymous',
    icon: '👻',
    label: 'Anonymous',
    description: 'Your identity will be completely hidden. No one can trace this feedback to you.',
    color: 'var(--success)',
  },
];

const IdentityModeSelector = ({ value = 'identified', onChange, readOnly = false }) => {
  return (
    <div className="identity-selector">
      {MODES.map((mode) => {
        const isSelected = value === mode.key;
        return (
          <button
            key={mode.key}
            type="button"
            className={`identity-option ${isSelected ? 'selected' : ''}`}
            onClick={() => !readOnly && onChange && onChange(mode.key)}
            disabled={readOnly}
            style={{
              '--identity-color': mode.color,
              borderColor: isSelected ? mode.color : 'var(--border)',
              background: isSelected ? `${mode.color}15` : 'var(--bg-input)',
            }}
          >
            <div className="identity-icon">{mode.icon}</div>
            <div className="identity-info">
              <span className="identity-label" style={{ color: isSelected ? mode.color : 'var(--text-primary)' }}>
                {mode.label}
              </span>
              <span className="identity-desc">{mode.description}</span>
            </div>
            <div className={`identity-radio ${isSelected ? 'active' : ''}`} style={{ borderColor: isSelected ? mode.color : 'var(--border)' }}>
              {isSelected && <div className="identity-radio-dot" style={{ background: mode.color }} />}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default IdentityModeSelector;
