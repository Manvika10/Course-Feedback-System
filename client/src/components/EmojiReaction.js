import React, { useState } from 'react';

const EMOJIS = [
  { key: 'angry', emoji: '😡', label: 'Terrible' },
  { key: 'sad', emoji: '😕', label: 'Poor' },
  { key: 'neutral', emoji: '😐', label: 'Okay' },
  { key: 'happy', emoji: '🙂', label: 'Good' },
  { key: 'love', emoji: '🤩', label: 'Amazing' },
];

const EmojiReaction = ({ value, onChange, readOnly = false, size = 36 }) => {
  const [hovered, setHovered] = useState(null);

  return (
    <div className="emoji-reaction-container">
      <div className="emoji-reaction-row">
        {EMOJIS.map((item) => {
          const isSelected = value === item.key;
          const isHovered = hovered === item.key;
          return (
            <button
              key={item.key}
              type="button"
              className={`emoji-btn ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
              onClick={() => !readOnly && onChange && onChange(isSelected ? null : item.key)}
              onMouseEnter={() => !readOnly && setHovered(item.key)}
              onMouseLeave={() => !readOnly && setHovered(null)}
              disabled={readOnly}
              aria-label={item.label}
              style={{ fontSize: `${size}px` }}
            >
              <span className="emoji-face">{item.emoji}</span>
              <span className="emoji-label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default EmojiReaction;
