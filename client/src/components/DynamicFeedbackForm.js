import React, { useState, useCallback, useMemo } from 'react';
import StarRating from './StarRating';
import EmojiReaction from './EmojiReaction';
import ThumbsRating from './ThumbsRating';
import NPSRating from './NPSRating';
import NumericSlider from './NumericSlider';
import LikertScale from './LikertScale';
import RankingQuestion from './RankingQuestion';
import RubricScoring from './RubricScoring';
import IdentityModeSelector from './IdentityModeSelector';

const DynamicFeedbackForm = ({
  form,
  onSubmit,
  submitting = false,
  initialIdentityMode = 'identified',
}) => {
  const [answers, setAnswers] = useState({});
  const [identityMode, setIdentityMode] = useState(initialIdentityMode);
  const [errors, setErrors] = useState({});

  // Evaluate conditional logic to determine visible questions
  const visibleQuestions = useMemo(() => {
    if (!form?.questions) return [];
    return form.questions.map((q, idx) => {
      if (!q.conditionalLogic) return { ...q, _index: idx, _visible: true };

      const { dependsOnQuestion, operator, value } = q.conditionalLogic;
      const depAnswer = answers[dependsOnQuestion];

      let visible = false;
      if (depAnswer === undefined || depAnswer === null) {
        visible = false;
      } else {
        switch (operator) {
          case 'equals':
            visible = String(depAnswer) === String(value);
            break;
          case 'not_equals':
            visible = String(depAnswer) !== String(value);
            break;
          case 'less_than':
            visible = Number(depAnswer) < Number(value);
            break;
          case 'greater_than':
            visible = Number(depAnswer) > Number(value);
            break;
          case 'contains':
            visible = String(depAnswer).toLowerCase().includes(String(value).toLowerCase());
            break;
          default:
            visible = true;
        }
      }

      return { ...q, _index: idx, _visible: visible };
    });
  }, [form, answers]);

  const updateAnswer = useCallback((questionIndex, value) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: value }));
    setErrors((prev) => ({ ...prev, [questionIndex]: '' }));
  }, []);

  const validate = useCallback(() => {
    const errs = {};
    visibleQuestions.forEach((q) => {
      if (q._visible && q.required) {
        const ans = answers[q._index];
        if (ans === undefined || ans === null || ans === '') {
          errs[q._index] = `This question is required`;
        }
      }
    });
    return errs;
  }, [visibleQuestions, answers]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    // Build answers array
    const formattedAnswers = visibleQuestions
      .filter((q) => q._visible && answers[q._index] !== undefined)
      .map((q) => ({
        questionIndex: q._index,
        questionType: q.questionType,
        answer: answers[q._index],
      }));

    onSubmit && onSubmit({
      answers: formattedAnswers,
      identityMode,
    });
  }, [validate, visibleQuestions, answers, identityMode, onSubmit]);

  const renderQuestion = (question) => {
    const idx = question._index;
    const currentValue = answers[idx];

    switch (question.questionType) {
      case 'free_text':
        return (
          <textarea
            className="form-textarea"
            placeholder="Type your response here..."
            value={currentValue || ''}
            onChange={(e) => updateAnswer(idx, e.target.value)}
            rows={3}
            maxLength={1000}
          />
        );

      case 'multiple_choice':
        return (
          <div className="mc-options">
            {(question.options || []).map((opt, oIdx) => (
              <button
                key={oIdx}
                type="button"
                className={`mc-option ${currentValue === opt ? 'selected' : ''}`}
                onClick={() => updateAnswer(idx, currentValue === opt ? null : opt)}
              >
                <div className={`mc-radio ${currentValue === opt ? 'active' : ''}`}>
                  {currentValue === opt && <div className="mc-radio-dot" />}
                </div>
                <span>{opt}</span>
              </button>
            ))}
          </div>
        );

      case 'ranking':
        return (
          <RankingQuestion
            items={question.options || []}
            value={currentValue || []}
            onChange={(val) => updateAnswer(idx, val)}
          />
        );

      case 'likert':
        return (
          <LikertScale
            value={currentValue}
            onChange={(val) => updateAnswer(idx, val)}
            min={question.likertConfig?.min || 1}
            max={question.likertConfig?.max || 5}
            minLabel={question.likertConfig?.minLabel || 'Strongly Disagree'}
            maxLabel={question.likertConfig?.maxLabel || 'Strongly Agree'}
          />
        );

      case 'rubric':
        return (
          <RubricScoring
            criteria={question.rubricCriteria || []}
            value={currentValue || []}
            onChange={(val) => updateAnswer(idx, val)}
          />
        );

      case 'star_rating':
        return (
          <StarRating
            rating={currentValue || 0}
            onChange={(val) => updateAnswer(idx, val)}
            size={32}
          />
        );

      case 'emoji_reaction':
        return (
          <EmojiReaction
            value={currentValue}
            onChange={(val) => updateAnswer(idx, val)}
          />
        );

      case 'thumbs_up_down':
        return (
          <ThumbsRating
            value={currentValue}
            onChange={(val) => updateAnswer(idx, val)}
          />
        );

      case 'nps':
        return (
          <NPSRating
            value={currentValue}
            onChange={(val) => updateAnswer(idx, val)}
          />
        );

      case 'numeric_slider':
        return (
          <NumericSlider
            value={currentValue}
            onChange={(val) => updateAnswer(idx, val)}
            min={question.sliderConfig?.min || 0}
            max={question.sliderConfig?.max || 100}
            step={question.sliderConfig?.step || 1}
            minLabel={question.sliderConfig?.minLabel || ''}
            maxLabel={question.sliderConfig?.maxLabel || ''}
          />
        );

      default:
        return <p style={{ color: 'var(--text-muted)' }}>Unsupported question type</p>;
    }
  };

  if (!form) return null;

  return (
    <form onSubmit={handleSubmit} className="dynamic-form">
      {/* Form Header */}
      <div className="dynamic-form-header">
        <h2 className="dynamic-form-title">{form.title}</h2>
        {form.description && (
          <p className="dynamic-form-desc">{form.description}</p>
        )}
        <div className="dynamic-form-meta">
          {form.formType && (
            <span className={`badge ${form.formType === 'micro' ? 'badge-info' : 'badge-primary'}`}>
              {form.formType === 'micro' ? '📝 Per-Lesson' : '📋 End-of-Course'}
            </span>
          )}
        </div>
      </div>

      {/* Questions */}
      <div className="dynamic-form-questions">
        {visibleQuestions.map((question, idx) => {
          if (!question._visible) return null;
          return (
            <div key={question._index} className="dynamic-question" style={{ animationDelay: `${idx * 0.05}s` }}>
              <div className="dynamic-question-header">
                <span className="dynamic-question-number">Q{question._index + 1}</span>
                <label className="dynamic-question-text">
                  {question.questionText}
                  {question.required && <span style={{ color: 'var(--error)', marginLeft: '4px' }}>*</span>}
                </label>
              </div>
              <div className="dynamic-question-body">
                {renderQuestion(question)}
              </div>
              {errors[question._index] && (
                <p className="form-error" style={{ marginTop: '8px' }}>⚠ {errors[question._index]}</p>
              )}
              {question.conditionalLogic && (
                <div className="conditional-indicator">
                  <span className="conditional-badge">↳ Conditional</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Identity Mode */}
      <div className="dynamic-form-section">
        <h3 className="dynamic-section-title">🔒 Privacy Settings</h3>
        <IdentityModeSelector
          value={identityMode}
          onChange={setIdentityMode}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="btn btn-success btn-full btn-lg"
        disabled={submitting}
        id="submit-dynamic-form-btn"
      >
        {submitting ? (
          <>
            <div className="spinner spinner-sm"></div>
            Submitting...
          </>
        ) : (
          '✓ Submit Response'
        )}
      </button>
    </form>
  );
};

export default DynamicFeedbackForm;
