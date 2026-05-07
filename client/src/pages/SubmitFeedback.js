import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getCourseById } from '../services/courseService';
import {
  submitFeedback,
  checkFeedbackSubmitted,
  getActiveFormsForCourse,
  submitFeedbackResponse,
} from '../services/feedbackService';
import { getLessonsByCourse } from '../services/lessonService';
import StarRating from '../components/StarRating';
import EmojiReaction from '../components/EmojiReaction';
import ThumbsRating from '../components/ThumbsRating';
import NPSRating from '../components/NPSRating';
import NumericSlider from '../components/NumericSlider';
import IdentityModeSelector from '../components/IdentityModeSelector';
import DynamicFeedbackForm from '../components/DynamicFeedbackForm';
import ExitIntentDetector from '../components/ExitIntentDetector';

const SubmitFeedback = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState('standard'); // 'standard' or 'dynamic'
  const [dynamicForms, setDynamicForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [showExitPrompt, setShowExitPrompt] = useState(false);
  const [exitHandled, setExitHandled] = useState(false);

  const feedbackType = lessonId ? 'micro' : 'macro';
  const currentLesson = lessons.find((l) => l._id === lessonId);

  const [form, setForm] = useState({
    rating: 0,
    comment: '',
    identityMode: 'identified',
    teachingQuality: 0,
    courseContent: 0,
    overallSatisfaction: 0,
    emojiReaction: null,
    thumbsUpDown: null,
    npsScore: null,
    sliderRatings: {},
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const promises = [
          getCourseById(courseId),
          checkFeedbackSubmitted(courseId, {
            lessonId: lessonId || undefined,
            feedbackType,
          }),
          getLessonsByCourse(courseId).catch(() => []),
          getActiveFormsForCourse(courseId, {
            type: feedbackType,
          }).catch(() => []),
        ];

        const [courseData, checkData, lessonsData, formsData] = await Promise.all(promises);
        setCourse(courseData);
        setLessons(lessonsData || []);
        setDynamicForms(formsData || []);

        if (formsData && formsData.length > 0) {
          setSelectedForm(formsData[0]);
        }

        if (checkData.submitted) {
          setAlreadySubmitted(true);
          toast('You already shared feedback.', { icon: 'ℹ️' });
        }
      } catch (err) {
        toast.error('We could not load the course details.');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [courseId, lessonId, feedbackType, navigate]);

  const validate = () => {
    const errs = {};
    if (!form.rating) errs.rating = 'Please select an overall rating';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return toast.error('Please choose an overall rating before submitting.');
    }

    setSubmitting(true);
    try {
      await submitFeedback({
        courseId,
        lessonId: lessonId || undefined,
        feedbackType,
        rating: form.rating,
        comment: form.comment,
        identityMode: form.identityMode,
        teachingQuality: form.teachingQuality || undefined,
        courseContent: form.courseContent || undefined,
        overallSatisfaction: form.overallSatisfaction || undefined,
        emojiReaction: form.emojiReaction || undefined,
        thumbsUpDown: form.thumbsUpDown || undefined,
        npsScore: form.npsScore !== null ? form.npsScore : undefined,
        sliderRatings: Object.keys(form.sliderRatings).length > 0 ? form.sliderRatings : undefined,
      });
      toast.success('Thank you. Your feedback has been submitted.');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'We could not submit your feedback. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDynamicFormSubmit = async ({ answers, identityMode }) => {
    if (!selectedForm) return;
    setSubmitting(true);
    try {
      await submitFeedbackResponse({
        formId: selectedForm._id,
        courseId,
        lessonId: lessonId || undefined,
        answers,
        identityMode,
        triggerSource: 'manual',
      });
      toast.success('Thank you. Your response has been submitted.');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'We could not submit your response. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExitIntent = () => {
    if (!exitHandled && !alreadySubmitted) {
      setShowExitPrompt(true);
    }
  };

  if (loading) {
    return (
      <div className="loading-center" style={{ minHeight: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (alreadySubmitted) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto' }} className="fade-in">
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Feedback Already Submitted</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
            You have already shared feedback for <strong style={{ color: 'var(--text-secondary)' }}>{course?.courseName}</strong>
            {currentLesson && <> — Lesson: <strong>{currentLesson.title}</strong></>}.
          </p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            ← Return to Courses
          </button>
        </div>
      </div>
    );
  }

  const RatingSection = ({ label, field, description }) => (
    <div style={{ marginBottom: '20px' }}>
      <label className="form-label">{label}
        {description && <span style={{ fontWeight: 400, marginLeft: '6px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>({description})</span>}
      </label>
      <StarRating
        rating={form[field]}
        onChange={(val) => {
          setForm((prev) => ({ ...prev, [field]: val }));
          if (field === 'rating' && errors.rating) setErrors((prev) => ({ ...prev, rating: '' }));
        }}
        size={28}
      />
      {field === 'rating' && errors.rating && (
        <p className="form-error" style={{ marginTop: '6px' }}>⚠ {errors.rating}</p>
      )}
    </div>
  );

  const tabs = [
    { id: 'standard', label: '⭐ Standard Feedback' },
  ];
  if (dynamicForms.length > 0) {
    tabs.push({ id: 'dynamic', label: '📋 Survey Form' });
  }

  return (
    <ExitIntentDetector onExitIntent={handleExitIntent} enabled={!alreadySubmitted && !exitHandled}>
      <div style={{ maxWidth: '740px', margin: '0 auto' }} className="fade-in">
        {/* Exit Intent Modal */}
        {showExitPrompt && (
          <div className="exit-intent-overlay" onClick={(e) => e.target === e.currentTarget && setShowExitPrompt(false)}>
            <div className="exit-intent-modal fade-in">
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🤔</div>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Wait! Before you go...</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '0.9rem' }}>
                We'd love to hear your feedback on <strong>{course?.courseName}</strong>. It only takes a minute!
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setShowExitPrompt(false); setExitHandled(true); }}>
                  Maybe Later
                </button>
                <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => { setShowExitPrompt(false); setExitHandled(true); }}>
                  ⭐ Give Feedback
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Back Button */}
        <button onClick={() => navigate('/')} className="btn btn-secondary btn-sm" style={{ marginBottom: '20px' }}>
          ← Back to Courses
        </button>

        {/* Course Info Header */}
        <div className="card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(236,72,153,0.05))' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
            {course?.courseName}
          </h1>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', color: 'var(--text-muted)', fontSize: '0.875rem', alignItems: 'center' }}>
            <span>👤 {course?.facultyName}</span>
            {course?.department && <span>🏛️ {course?.department}</span>}
            {course?.semester && <span>📅 Semester {course?.semester}</span>}
            <span className={`badge ${feedbackType === 'micro' ? 'badge-info' : 'badge-primary'}`}>
              {feedbackType === 'micro' ? '📝 Lesson Feedback' : '📋 Course Feedback'}
            </span>
          </div>
          {currentLesson && (
            <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(59,130,246,0.1)', borderRadius: '8px', fontSize: '0.875rem' }}>
              📖 Lesson {currentLesson.order}: <strong>{currentLesson.title}</strong>
            </div>
          )}
        </div>

        {/* Tab Selector (if dynamic forms exist) */}
        {tabs.length > 1 && (
          <div className="feedback-tab-bar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`feedback-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Standard Feedback Form */}
        {activeTab === 'standard' && (
          <div className="card">
            <h2 className="section-title" style={{ marginBottom: '24px' }}>
              <span>⭐ Share Your Feedback</span>
            </h2>

            <form onSubmit={handleSubmit} id="feedback-form">
              {/* Overall Rating - Required */}
              <div style={{ marginBottom: '28px', padding: '20px', background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: 'var(--radius-md)' }}>
                <label className="form-label" style={{ marginBottom: '12px', fontSize: '0.95rem', fontWeight: 700 }}>
                  Overall Rating <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <StarRating
                  rating={form.rating}
                  onChange={(val) => {
                    setForm((prev) => ({ ...prev, rating: val }));
                    setErrors((prev) => ({ ...prev, rating: '' }));
                  }}
                  size={36}
                />
                {errors.rating && <p className="form-error" style={{ marginTop: '8px' }}>⚠ {errors.rating}</p>}
              </div>

              {/* Detailed Ratings */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Detailed Ratings <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div style={{ padding: '14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    <RatingSection label="🎤 Teaching Quality" field="teachingQuality" />
                  </div>
                  <div style={{ padding: '14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    <RatingSection label="📚 Course Content" field="courseContent" />
                  </div>
                  <div style={{ padding: '14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    <RatingSection label="😊 Satisfaction" field="overallSatisfaction" />
                  </div>
                </div>
              </div>

              {/* Additional Rating Mechanisms */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Quick Reactions <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
                </h3>

                {/* Emoji Reaction */}
                <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <label className="form-label">😊 How do you feel about this {feedbackType === 'micro' ? 'lesson' : 'course'}?</label>
                  <EmojiReaction
                    value={form.emojiReaction}
                    onChange={(val) => setForm((prev) => ({ ...prev, emojiReaction: val }))}
                  />
                </div>

                {/* Thumbs Up/Down */}
                <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <label className="form-label">👍 Would you recommend this {feedbackType === 'micro' ? 'lesson' : 'course'}?</label>
                  <ThumbsRating
                    value={form.thumbsUpDown}
                    onChange={(val) => setForm((prev) => ({ ...prev, thumbsUpDown: val }))}
                  />
                </div>

                {/* NPS */}
                <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <label className="form-label">📊 How likely are you to recommend this to a friend?</label>
                  <NPSRating
                    value={form.npsScore}
                    onChange={(val) => setForm((prev) => ({ ...prev, npsScore: val }))}
                  />
                </div>

                {/* Numeric Slider */}
                <div style={{ padding: '16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <label className="form-label">📈 Rate difficulty level</label>
                  <NumericSlider
                    value={form.sliderRatings.difficulty}
                    onChange={(val) => setForm((prev) => ({
                      ...prev,
                      sliderRatings: { ...prev.sliderRatings, difficulty: val },
                    }))}
                    min={1}
                    max={10}
                    step={1}
                    minLabel="Very Easy"
                    maxLabel="Very Hard"
                  />
                </div>
              </div>

              {/* Comment */}
              <div className="form-group">
                <label className="form-label" htmlFor="feedback-comment">
                  💬 Additional Comments <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
                </label>
                <textarea
                  id="feedback-comment"
                  className="form-textarea"
                  placeholder="Share your experience — what did you love? What could be improved?"
                  value={form.comment}
                  onChange={(e) => setForm((prev) => ({ ...prev, comment: e.target.value }))}
                  rows={4}
                  maxLength={500}
                />
                <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {form.comment.length}/500
                </div>
              </div>

              {/* Identity Mode Selector */}
              <div style={{ marginBottom: '24px' }}>
                <label className="form-label" style={{ marginBottom: '12px', fontSize: '0.95rem', fontWeight: 700 }}>
                  🔒 Privacy Settings
                </label>
                <IdentityModeSelector
                  value={form.identityMode}
                  onChange={(val) => setForm((prev) => ({ ...prev, identityMode: val }))}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                id="submit-feedback-btn"
                className="btn btn-success btn-full btn-lg"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <div className="spinner spinner-sm"></div>
                    Submitting...
                  </>
                ) : (
                  'Submit Feedback'
                )}
              </button>
            </form>
          </div>
        )}

        {/* Dynamic Form Tab */}
        {activeTab === 'dynamic' && selectedForm && (
          <div className="card">
            {dynamicForms.length > 1 && (
              <div style={{ marginBottom: '20px' }}>
                <label className="form-label">Select Form</label>
                <select
                  className="form-select"
                  value={selectedForm._id}
                  onChange={(e) => {
                    const f = dynamicForms.find((df) => df._id === e.target.value);
                    setSelectedForm(f);
                  }}
                >
                  {dynamicForms.map((df) => (
                    <option key={df._id} value={df._id}>{df.title}</option>
                  ))}
                </select>
              </div>
            )}
            <DynamicFeedbackForm
              form={selectedForm}
              onSubmit={handleDynamicFormSubmit}
              submitting={submitting}
              initialIdentityMode="identified"
            />
          </div>
        )}
      </div>
    </ExitIntentDetector>
  );
};

export default SubmitFeedback;
