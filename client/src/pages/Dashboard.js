import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getCourses } from '../services/courseService';
import { getFeedback } from '../services/feedbackService';
import { getLessonsByCourse } from '../services/lessonService';
import StarRating from '../components/StarRating';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [courses, setCourses] = useState([]);
  const [myFeedbacks, setMyFeedbacks] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittedCourseIds, setSubmittedCourseIds] = useState(new Set());
  const [expandedCourseId, setExpandedCourseId] = useState(null);
  const [courseLessons, setCourseLessons] = useState({});
  const [loadingLessons, setLoadingLessons] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [coursesData, feedbackData] = await Promise.all([
        getCourses({ search }),
        isAdmin ? Promise.resolve({ feedbacks: [] }) : getFeedback(),
      ]);
      setCourses(coursesData);
      if (!isAdmin) {
        setMyFeedbacks(feedbackData.feedbacks || []);
        setSubmittedCourseIds(new Set((feedbackData.feedbacks || []).filter(f => f.feedbackType !== 'micro').map((f) => f.courseId?._id)));
      }
    } catch (err) {
      toast.error('We could not load your dashboard right now.');
    } finally {
      setLoading(false);
    }
  }, [search, isAdmin]);

  useEffect(() => {
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const toggleLessons = async (courseId) => {
    if (expandedCourseId === courseId) {
      setExpandedCourseId(null);
      return;
    }

    setExpandedCourseId(courseId);

    if (!courseLessons[courseId]) {
      setLoadingLessons(courseId);
      try {
        const lessons = await getLessonsByCourse(courseId);
        setCourseLessons((prev) => ({ ...prev, [courseId]: lessons }));
      } catch (err) {
        // Lessons might not exist for this course
        setCourseLessons((prev) => ({ ...prev, [courseId]: [] }));
      } finally {
        setLoadingLessons(null);
      }
    }
  };

  const getMicroFeedbackForLesson = (lessonId) => {
    return myFeedbacks.find(
      (f) => f.feedbackType === 'micro' && f.lessonId?._id === lessonId
    );
  };

  const stats = {
    totalCourses: courses.length,
    feedbackGiven: myFeedbacks.filter(f => f.feedbackType !== 'micro').length,
    microFeedbacks: myFeedbacks.filter(f => f.feedbackType === 'micro').length,
    pending: courses.length - myFeedbacks.filter(f => f.feedbackType !== 'micro').length,
    avgRating: myFeedbacks.length
      ? (myFeedbacks.reduce((sum, f) => sum + f.rating, 0) / myFeedbacks.length).toFixed(1)
      : '—',
  };

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">
          {isAdmin ? '🛠️ Admin Dashboard' : `👋 Welcome, ${user?.name?.split(' ')[0]}!`}
        </h1>
        <p className="page-subtitle">
          {isAdmin
            ? 'Monitor courses, feedback activity, and platform performance in one place.'
            : 'Explore your courses and share feedback that helps improve learning.'}
        </p>
      </div>

      {/* Stats */}
      {!isAdmin && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.1)' }}>📚</div>
            <div className="stat-value">{stats.totalCourses}</div>
            <div className="stat-label">Total Courses</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)' }}>✅</div>
            <div className="stat-value">{stats.feedbackGiven}</div>
            <div className="stat-label">Course Reviews</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)' }}>📝</div>
            <div className="stat-value">{stats.microFeedbacks}</div>
            <div className="stat-label">Lesson Reviews</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)' }}>⏳</div>
            <div className="stat-value">{Math.max(0, stats.pending)}</div>
            <div className="stat-label">Left to Review</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(251,191,36,0.1)' }}>⭐</div>
            <div className="stat-value" style={{ fontSize: '1.75rem' }}>{stats.avgRating}</div>
            <div className="stat-label">Your Average Rating</div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="filters-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            id="course-search"
            className="form-input search-input"
            placeholder="Search by course name or faculty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {isAdmin && (
          <Link to="/admin" className="btn btn-primary">
            📊 Open Analytics
          </Link>
        )}
      </div>

      {/* Courses Grid */}
      <div className="section">
        <div className="section-title">
          <span>📋 Available Courses</span>
        </div>

        {loading ? (
          <div className="loading-center">
            <div className="spinner"></div>
          </div>
        ) : courses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-title">No courses found</div>
            <p style={{ fontSize: '0.875rem' }}>
              {search ? 'Try a different keyword or clear your search.' : 'Courses will appear here as soon as they are added.'}
            </p>
          </div>
        ) : (
          <div className="courses-grid">
            {courses.map((course) => {
              const submitted = submittedCourseIds.has(course._id);
              const myFb = myFeedbacks.find((f) => f.courseId?._id === course._id && f.feedbackType !== 'micro');
              const isExpanded = expandedCourseId === course._id;
              const lessons = courseLessons[course._id] || [];

              return (
                <div key={course._id} className="course-card">
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 className="course-name">{course.courseName}</h3>
                        {course.courseCode && (
                          <span
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--primary-light)',
                              fontWeight: 600,
                              fontFamily: 'monospace',
                              background: 'rgba(99,102,241,0.1)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                            }}
                          >
                            {course.courseCode}
                          </span>
                        )}
                      </div>
                      {submitted && (
                        <span className="badge badge-success" style={{ flexShrink: 0 }}>Reviewed</span>
                      )}
                    </div>
                  </div>

                  <p className="course-faculty">👤 {course.facultyName}</p>

                  <div className="course-meta">
                    {course.department && (
                      <span className="badge badge-info">{course.department}</span>
                    )}
                    {course.semester && (
                      <span className="badge badge-primary">Sem {course.semester}</span>
                    )}
                  </div>

                  {course.description && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '10px', lineHeight: '1.5' }}>
                      {course.description}
                    </p>
                  )}

                  {/* My Rating Preview */}
                  {myFb && (
                    <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(99,102,241,0.05)', borderRadius: '8px' }}>
                      <StarRating rating={myFb.rating} readOnly size={18} />
                      {myFb.comment && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          "{myFb.comment}"
                        </p>
                      )}
                      {myFb.emojiReaction && (
                        <span style={{ fontSize: '1.2rem', marginTop: '4px', display: 'inline-block' }}>
                          {myFb.emojiReaction === 'angry' && '😡'}
                          {myFb.emojiReaction === 'sad' && '😕'}
                          {myFb.emojiReaction === 'neutral' && '😐'}
                          {myFb.emojiReaction === 'happy' && '🙂'}
                          {myFb.emojiReaction === 'love' && '🤩'}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Lessons Expandable Section */}
                  {!isAdmin && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm btn-full"
                      style={{ marginTop: '12px' }}
                      onClick={() => toggleLessons(course._id)}
                    >
                      {isExpanded ? '▲ Hide Lessons' : '▼ View Lessons'}
                    </button>
                  )}

                  {isExpanded && (
                    <div className="lessons-panel fade-in" style={{ marginTop: '12px' }}>
                      {loadingLessons === course._id ? (
                        <div style={{ textAlign: 'center', padding: '12px' }}>
                          <div className="spinner spinner-sm"></div>
                        </div>
                      ) : lessons.length === 0 ? (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px' }}>
                          No lessons available for this course yet.
                        </p>
                      ) : (
                        <div className="lessons-list">
                          {lessons.map((lesson) => {
                            const microFb = getMicroFeedbackForLesson(lesson._id);
                            return (
                              <div key={lesson._id} className="lesson-item">
                                <div className="lesson-info">
                                  <span className="lesson-order">{lesson.order}</span>
                                  <div>
                                    <span className="lesson-title">{lesson.title}</span>
                                    {lesson.description && (
                                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                                        {lesson.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="lesson-action">
                                  {microFb ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <StarRating rating={microFb.rating} readOnly size={14} />
                                      <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Done</span>
                                    </div>
                                  ) : (
                                    <Link
                                      to={`/submit-feedback/${course._id}/lesson/${lesson._id}`}
                                      className="btn btn-primary btn-sm"
                                      style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                                    >
                                      ⭐ Rate
                                    </Link>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Button */}
                  {!isAdmin && (
                    <div style={{ marginTop: '12px' }}>
                      {submitted ? (
                        <button className="btn btn-secondary btn-sm btn-full" disabled>
                          Feedback Submitted
                        </button>
                      ) : (
                        <Link
                          to={`/submit-feedback/${course._id}`}
                          className="btn btn-primary btn-sm btn-full"
                          id={`feedback-btn-${course._id}`}
                        >
                          ⭐ Share Feedback
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
