import React from 'react';

const RubricScoring = ({ criteria = [], value = [], onChange, readOnly = false }) => {
  const handleScoreChange = (criterionIdx, score) => {
    if (readOnly || !onChange) return;

    const criterion = criteria[criterionIdx];
    const newValue = [...value];
    const existingIdx = newValue.findIndex(
      (v) => v.criterion === criterion.criterion
    );

    if (existingIdx >= 0) {
      newValue[existingIdx] = { criterion: criterion.criterion, score };
    } else {
      newValue.push({ criterion: criterion.criterion, score });
    }

    onChange(newValue);
  };

  const getScoreForCriterion = (criterion) => {
    const entry = value.find((v) => v.criterion === criterion.criterion);
    return entry ? entry.score : null;
  };

  return (
    <div className="rubric-container">
      <div className="rubric-grid">
        {/* Header */}
        <div className="rubric-header-row">
          <div className="rubric-criterion-header">Criterion</div>
          <div className="rubric-levels-header">Performance Levels</div>
        </div>

        {/* Criteria rows */}
        {criteria.map((criterion, cIdx) => {
          const selectedScore = getScoreForCriterion(criterion);
          return (
            <div key={cIdx} className="rubric-row">
              <div className="rubric-criterion-cell">
                <span className="rubric-criterion-name">{criterion.criterion}</span>
              </div>
              <div className="rubric-levels-cell">
                {criterion.levels.map((level, lIdx) => {
                  const isSelected = selectedScore === level.score;
                  return (
                    <button
                      key={lIdx}
                      type="button"
                      className={`rubric-level-btn ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleScoreChange(cIdx, level.score)}
                      disabled={readOnly}
                    >
                      <span className="rubric-level-label">{level.label}</span>
                      <span className="rubric-level-score">({level.score})</span>
                      {level.description && (
                        <span className="rubric-level-desc">{level.description}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Score summary */}
      {value.length > 0 && (
        <div className="rubric-summary">
          Total Score: {value.reduce((s, v) => s + v.score, 0)} / {criteria.reduce((s, c) => s + Math.max(...c.levels.map((l) => l.score)), 0)}
        </div>
      )}
    </div>
  );
};

export default RubricScoring;
