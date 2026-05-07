import React, { useState, useCallback } from 'react';

const RankingQuestion = ({ items = [], value = [], onChange, readOnly = false }) => {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Initialize order from value or items
  const currentOrder = value.length > 0 ? value : items;

  const handleDragStart = useCallback((e, index) => {
    if (readOnly) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  }, [readOnly]);

  const handleDragOver = useCallback((e, index) => {
    e.preventDefault();
    if (readOnly || index === draggedIndex) return;
    setDragOverIndex(index);
  }, [readOnly, draggedIndex]);

  const handleDrop = useCallback((e, dropIndex) => {
    e.preventDefault();
    if (readOnly || draggedIndex === null) return;

    const newOrder = [...currentOrder];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, removed);

    setDraggedIndex(null);
    setDragOverIndex(null);
    onChange && onChange(newOrder);
  }, [readOnly, draggedIndex, currentOrder, onChange]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  const moveItem = useCallback((fromIndex, direction) => {
    if (readOnly) return;
    const toIndex = fromIndex + direction;
    if (toIndex < 0 || toIndex >= currentOrder.length) return;

    const newOrder = [...currentOrder];
    [newOrder[fromIndex], newOrder[toIndex]] = [newOrder[toIndex], newOrder[fromIndex]];
    onChange && onChange(newOrder);
  }, [readOnly, currentOrder, onChange]);

  return (
    <div className="ranking-container">
      <div className="ranking-hint">Drag items to reorder, or use arrows</div>
      <div className="ranking-list">
        {currentOrder.map((item, index) => (
          <div
            key={`${item}-${index}`}
            className={`ranking-item ${draggedIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
            draggable={!readOnly}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
          >
            <span className="ranking-number">{index + 1}</span>
            <span className="ranking-text">{item}</span>
            {!readOnly && (
              <div className="ranking-arrows">
                <button
                  type="button"
                  className="ranking-arrow-btn"
                  onClick={() => moveItem(index, -1)}
                  disabled={index === 0}
                  aria-label="Move up"
                >
                  ▲
                </button>
                <button
                  type="button"
                  className="ranking-arrow-btn"
                  onClick={() => moveItem(index, 1)}
                  disabled={index === currentOrder.length - 1}
                  aria-label="Move down"
                >
                  ▼
                </button>
              </div>
            )}
            {!readOnly && (
              <span className="ranking-drag-handle">⠿</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RankingQuestion;
