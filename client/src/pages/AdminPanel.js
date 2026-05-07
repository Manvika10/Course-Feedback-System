import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import {
  getFeedback, getAnalytics, deleteFeedback,
  getFeedbackForms, createFeedbackForm, deleteFeedbackForm, triggerFormPrompt,
} from '../services/feedbackService';
import { getCourses, createCourse, deleteCourse } from '../services/courseService';
import { getLessonsByCourse, createLesson, deleteLesson } from '../services/lessonService';
import StarRating from '../components/StarRating';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement, PointElement, LineElement, Filler
);

const CHART_COLORS = {
  primary: 'rgba(99, 102, 241, 0.8)',
  primaryBorder: '#6366f1',
  secondary: 'rgba(236, 72, 153, 0.8)',
  secondaryBorder: '#ec4899',
  success: 'rgba(16, 185, 129, 0.8)',
  warning: 'rgba(245, 158, 11, 0.8)',
  error: 'rgba(239, 68, 68, 0.8)',
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: { labels: { color: '#94a3b8', font: { family: 'Inter' } } },
    tooltip: {
      backgroundColor: '#1a1a2e',
      titleColor: '#f1f5f9',
      bodyColor: '#94a3b8',
      borderColor: 'rgba(99,102,241,0.2)',
      borderWidth: 1,
    },
  },
  scales: {
    x: {
      ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } },
      grid: { color: 'rgba(99,102,241,0.06)' },
    },
    y: {
      ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } },
      grid: { color: 'rgba(99,102,241,0.06)' },
    },
  },
};

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);
  const [filterCourse, setFilterCourse] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deletingId, setDeletingId] = useState(null);

  // Course creation modal state
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseForm, setCourseForm] = useState({
    courseName: '', courseCode: '', facultyName: '', department: '', semester: '', description: '',
  });
  const [creatingCourse, setCreatingCourse] = useState(false);

  // Lesson management state
  const [selectedCourseForLessons, setSelectedCourseForLessons] = useState(null);
  const [lessonsMap, setLessonsMap] = useState({});
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [lessonForm, setLessonForm] = useState({ courseId: '', title: '', description: '' });

  // Feedback forms management state
  const [feedbackForms, setFeedbackForms] = useState([]);
  const [loadingForms, setLoadingForms] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [newFormData, setNewFormData] = useState({
    title: '', description: '', formType: 'macro', triggerType: 'manual',
    courseId: '', questions: [{ questionText: '', questionType: 'star_rating', required: false, options: [] }],
  });

  // Load analytics
  const fetchAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    try {
      const data = await getAnalytics();
      setAnalytics(data);
    } catch (err) {
      toast.error('We could not load analytics right now.');
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  // Load feedbacks
  const fetchFeedbacks = useCallback(async () => {
    setLoadingFeedbacks(true);
    try {
      const params = { page, limit: 10 };
      if (filterCourse) params.courseId = filterCourse;
      const data = await getFeedback(params);
      setFeedbacks(data.feedbacks || []);
      setTotalPages(data.pages || 1);
    } catch (err) {
      toast.error('We could not load feedback records.');
    } finally {
      setLoadingFeedbacks(false);
    }
  }, [page, filterCourse]);

  // Load courses
  const fetchCourses = useCallback(async () => {
    try {
      const data = await getCourses();
      setCourses(data);
    } catch (err) {
      toast.error('We could not load courses.');
    }
  }, []);

  // Fetch feedback forms
  const fetchFeedbackForms = useCallback(async () => {
    setLoadingForms(true);
    try {
      const data = await getFeedbackForms();
      setFeedbackForms(data || []);
    } catch (err) { toast.error('Could not load feedback forms.'); }
    finally { setLoadingForms(false); }
  }, []);

  // Fetch lessons for a course
  const fetchLessonsForCourse = useCallback(async (cId) => {
    setLoadingLessons(true);
    try {
      const data = await getLessonsByCourse(cId);
      setLessonsMap((prev) => ({ ...prev, [cId]: data || [] }));
    } catch (err) { setLessonsMap((prev) => ({ ...prev, [cId]: [] })); }
    finally { setLoadingLessons(false); }
  }, []);

  useEffect(() => { fetchAnalytics(); fetchCourses(); }, [fetchAnalytics, fetchCourses]);
  useEffect(() => { if (activeTab === 'feedbacks') fetchFeedbacks(); }, [fetchFeedbacks, activeTab]);
  useEffect(() => { if (activeTab === 'forms') fetchFeedbackForms(); }, [activeTab, fetchFeedbackForms]);
  useEffect(() => {
    if (selectedCourseForLessons) fetchLessonsForCourse(selectedCourseForLessons);
  }, [selectedCourseForLessons, fetchLessonsForCourse]);

  const handleDeleteFeedback = async (id) => {
    if (!window.confirm('Delete this feedback permanently? This action cannot be undone.')) return;
    setDeletingId(id);
    try {
      await deleteFeedback(id);
      toast.success('Feedback was deleted.');
      fetchFeedbacks();
      fetchAnalytics();
    } catch (err) {
      toast.error('We could not delete this feedback.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteCourse = async (id, name) => {
    if (!window.confirm(`Delete course "${name}"? Students will no longer see it.`)) return;
    try {
      await deleteCourse(id);
      toast.success('Course was deleted.');
      fetchCourses();
      fetchAnalytics();
    } catch (err) {
      toast.error('We could not delete this course.');
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!courseForm.courseName || !courseForm.facultyName) {
      return toast.error('Please enter both course name and faculty name.');
    }
    setCreatingCourse(true);
    try {
      await createCourse(courseForm);
      toast.success('Course created successfully.');
      setCourseForm({ courseName: '', courseCode: '', facultyName: '', department: '', semester: '', description: '' });
      setShowCourseModal(false);
      fetchCourses();
      fetchAnalytics();
    } catch (err) {
      const msg = err.response?.data?.message || 'We could not create this course. Please try again.';
      toast.error(msg);
    } finally {
      setCreatingCourse(false);
    }
  };

  // Lesson handlers
  const handleCreateLesson = async (e) => {
    e.preventDefault();
    if (!lessonForm.title || !lessonForm.courseId) return toast.error('Title and course required.');
    try {
      await createLesson(lessonForm);
      toast.success('Lesson created.');
      setShowLessonModal(false);
      setLessonForm({ courseId: '', title: '', description: '' });
      if (lessonForm.courseId) fetchLessonsForCourse(lessonForm.courseId);
    } catch (err) { toast.error(err.response?.data?.message || 'Error creating lesson.'); }
  };

  const handleDeleteLesson = async (id, courseId) => {
    if (!window.confirm('Delete this lesson?')) return;
    try {
      await deleteLesson(id);
      toast.success('Lesson deleted.');
      fetchLessonsForCourse(courseId);
    } catch (err) { toast.error('Error deleting lesson.'); }
  };

  // Feedback form handlers
  const handleCreateForm = async (e) => {
    e.preventDefault();
    if (!newFormData.title || !newFormData.questions.length) return toast.error('Title and questions required.');
    try {
      await createFeedbackForm({
        ...newFormData,
        courseId: newFormData.courseId || undefined,
        questions: newFormData.questions.filter(q => q.questionText),
      });
      toast.success('Feedback form created.');
      setShowFormModal(false);
      setNewFormData({ title: '', description: '', formType: 'macro', triggerType: 'manual', courseId: '', questions: [{ questionText: '', questionType: 'star_rating', required: false, options: [] }] });
      fetchFeedbackForms();
    } catch (err) { toast.error(err.response?.data?.message || 'Error creating form.'); }
  };

  const handleDeleteForm = async (id) => {
    if (!window.confirm('Delete this feedback form?')) return;
    try { await deleteFeedbackForm(id); toast.success('Form deleted.'); fetchFeedbackForms(); }
    catch (err) { toast.error('Error deleting form.'); }
  };

  const handleTriggerForm = async (id) => {
    try { await triggerFormPrompt(id); toast.success('Form prompt triggered for students!'); }
    catch (err) { toast.error('Error triggering form.'); }
  };

  const addQuestion = () => {
    setNewFormData(prev => ({
      ...prev,
      questions: [...prev.questions, { questionText: '', questionType: 'star_rating', required: false, options: [] }],
    }));
  };

  const updateQuestion = (idx, field, val) => {
    setNewFormData(prev => {
      const qs = [...prev.questions];
      qs[idx] = { ...qs[idx], [field]: val };
      return { ...prev, questions: qs };
    });
  };

  const removeQuestion = (idx) => {
    setNewFormData(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== idx) }));
  };

  // Chart data
  const ratingBarData = analytics ? {
    labels: ['1 ⭐', '2 ⭐⭐', '3 ⭐⭐⭐', '4 ⭐⭐⭐⭐', '5 ⭐⭐⭐⭐⭐'],
    datasets: [{
      label: 'Number of Ratings',
      data: [1, 2, 3, 4, 5].map(
        (r) => analytics.ratingDistribution.find((d) => d._id === r)?.count || 0
      ),
      backgroundColor: [CHART_COLORS.error, CHART_COLORS.warning, CHART_COLORS.success, CHART_COLORS.primary, CHART_COLORS.secondary],
      borderRadius: 8,
    }],
  } : null;

  const courseAvgData = analytics?.courseAnalytics?.length ? {
    labels: analytics.courseAnalytics.slice(0, 8).map((c) => c.courseName.substring(0, 20) + (c.courseName.length > 20 ? '…' : '')),
    datasets: [{
      label: 'Avg Rating',
      data: analytics.courseAnalytics.slice(0, 8).map((c) => c.avgRating),
      backgroundColor: CHART_COLORS.primary,
      borderColor: CHART_COLORS.primaryBorder,
      borderWidth: 2,
      borderRadius: 8,
    }],
  } : null;

  const trendData = analytics?.feedbackTrend?.length ? {
    labels: analytics.feedbackTrend.map((d) => d._id),
    datasets: [{
      label: 'Feedbacks Submitted',
      data: analytics.feedbackTrend.map((d) => d.count),
      borderColor: CHART_COLORS.primaryBorder,
      backgroundColor: 'rgba(99,102,241,0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: CHART_COLORS.primaryBorder,
      pointRadius: 4,
    }],
  } : null;

  const tabs = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'feedbacks', label: '💬 All Feedback' },
    { id: 'courses', label: '📚 Courses & Lessons' },
    { id: 'forms', label: '📋 Feedback Forms' },
  ];

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">🛠️ Admin Panel</h1>
        <p className="page-subtitle">Manage courses, review student feedback, and track rating trends.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              padding: '10px 18px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 600,
              fontFamily: 'inherit',
              color: activeTab === tab.id ? 'var(--primary-light)' : 'var(--text-muted)',
              borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: '-1px',
              transition: 'all 0.2s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== OVERVIEW TAB ===== */}
      {activeTab === 'overview' && (
        <div>
          {loadingAnalytics ? (
            <div className="loading-center"><div className="spinner"></div></div>
          ) : analytics ? (
            <>
              {/* Stats */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.1)' }}>💬</div>
                  <div className="stat-value">{analytics.totalFeedbacks}</div>
                  <div className="stat-label">Total Feedbacks</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(251,191,36,0.1)' }}>⭐</div>
                  <div className="stat-value">{analytics.overallAvgRating}</div>
                  <div className="stat-label">Overall Avg Rating</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)' }}>📚</div>
                  <div className="stat-value">{courses.length}</div>
                  <div className="stat-label">Active Courses</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(236,72,153,0.1)' }}>🏆</div>
                  <div className="stat-value" style={{ fontSize: '1.1rem', lineHeight: '1.3' }}>
                    {analytics.courseAnalytics[0]?.courseName?.substring(0, 16) || '—'}
                  </div>
                  <div className="stat-label">Top Rated Course</div>
                </div>
              </div>

              {/* Charts */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                {ratingBarData && (
                  <div className="chart-container">
                    <h3 className="chart-title">📊 Rating Distribution</h3>
                    <Bar
                      data={ratingBarData}
                      options={{ ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } } }}
                    />
                  </div>
                )}
                {courseAvgData && (
                  <div className="chart-container">
                    <h3 className="chart-title">🏅 Average Rating by Course</h3>
                    <Bar
                      data={courseAvgData}
                      options={{
                        ...chartOptions,
                        indexAxis: 'y',
                        plugins: { ...chartOptions.plugins, legend: { display: false } },
                        scales: {
                          x: { ...chartOptions.scales.x, min: 0, max: 5 },
                          y: { ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } }, grid: { display: false } }
                        },
                      }}
                    />
                  </div>
                )}
              </div>

              {trendData && (
                <div className="chart-container">
                  <h3 className="chart-title">📈 Feedback Trend (Last 30 Days)</h3>
                  <Line data={trendData} options={chartOptions} />
                </div>
              )}

              {/* Course Analytics Table */}
              {analytics.courseAnalytics.length > 0 && (
                <div className="section">
                  <div className="section-title"><span>📋 Course Analytics</span></div>
                  <div className="table-wrapper">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Course</th>
                          <th>Faculty</th>
                          <th>Reviews</th>
                          <th>Avg Rating</th>
                          <th>Teaching</th>
                          <th>Content</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.courseAnalytics.map((c, idx) => (
                          <tr key={idx}>
                            <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{c.courseName}</td>
                            <td>{c.facultyName}</td>
                            <td><span className="badge badge-info">{c.totalFeedbacks}</span></td>
                            <td><StarRating rating={c.avgRating} readOnly size={16} /></td>
                            <td>{c.avgTeachingQuality ? `${c.avgTeachingQuality}/5` : '—'}</td>
                            <td>{c.avgCourseContent ? `${c.avgCourseContent}/5` : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <div className="empty-state-title">No data yet</div>
              <p>Add courses and wait for student submissions</p>
            </div>
          )}
        </div>
      )}

      {/* ===== FEEDBACKS TAB ===== */}
      {activeTab === 'feedbacks' && (
        <div>
          {/* Filter */}
          <div className="filters-bar" style={{ marginBottom: '20px' }}>
            <select
              className="form-select"
              value={filterCourse}
              onChange={(e) => { setFilterCourse(e.target.value); setPage(1); }}
              id="filter-course"
              style={{ maxWidth: '280px' }}
            >
              <option value="">🔍 All Courses</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>{c.courseName}</option>
              ))}
            </select>
            <button className="btn btn-secondary btn-sm" onClick={fetchFeedbacks}>
              🔄 Refresh List
            </button>
          </div>

          {loadingFeedbacks ? (
            <div className="loading-center"><div className="spinner"></div></div>
          ) : feedbacks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💬</div>
              <div className="empty-state-title">No feedback found</div>
              <p>Try selecting a different course filter or check back later.</p>
            </div>
          ) : (
            <>
              {feedbacks.map((fb) => (
                <div key={fb._id} className="feedback-item">
                  <div className="feedback-header">
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
                        {fb.courseId?.courseName || 'Unknown Course'}
                        {fb.anonymous && (
                          <span className="badge badge-warning" style={{ marginLeft: '8px', fontSize: '0.7rem' }}>Anon</span>
                        )}
                      </div>
                      <div className="feedback-meta">
                        👤 {fb.studentId?.name || 'Anonymous'} &nbsp;|&nbsp; 🏛 {fb.courseId?.facultyName}
                        &nbsp;|&nbsp; 📅 {new Date(fb.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <StarRating rating={fb.rating} readOnly size={18} />
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteFeedback(fb._id)}
                        disabled={deletingId === fb._id}
                        id={`del-feedback-${fb._id}`}
                      >
                        {deletingId === fb._id ? '...' : '🗑️'}
                      </button>
                    </div>
                  </div>
                  {fb.comment && (
                    <p className="feedback-comment">"{fb.comment}"</p>
                  )}
                  {(fb.teachingQuality || fb.courseContent || fb.overallSatisfaction) && (
                    <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
                      {fb.teachingQuality && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>🎤 Teaching: {fb.teachingQuality}/5</span>}
                      {fb.courseContent && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>📚 Content: {fb.courseContent}/5</span>}
                      {fb.overallSatisfaction && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>😊 Satisfaction: {fb.overallSatisfaction}/5</span>}
                    </div>
                  )}
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button className="page-btn" onClick={() => setPage(page - 1)} disabled={page === 1}>{'<'}</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                  ))}
                  <button className="page-btn" onClick={() => setPage(page + 1)} disabled={page === totalPages}>{'>'}</button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ===== COURSES TAB ===== */}
      {activeTab === 'courses' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
              📚 Courses ({courses.length})
            </h2>
            <button
              className="btn btn-primary"
              onClick={() => setShowCourseModal(true)}
              id="add-course-btn"
            >
              ＋ Add New Course
            </button>
          </div>

          {/* Course Creation Modal */}
          {showCourseModal && (
            <div
              style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
              }}
              onClick={(e) => e.target === e.currentTarget && setShowCourseModal(false)}
            >
              <div
                style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-xl)', padding: '32px', width: '100%', maxWidth: '520px',
                  boxShadow: 'var(--shadow-lg)',
                }}
                className="fade-in"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    ➕ Add New Course
                  </h3>
                  <button
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }}
                    onClick={() => setShowCourseModal(false)}
                  >✕</button>
                </div>
                <form onSubmit={handleCreateCourse} id="create-course-form">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">Course Name <span style={{ color: 'var(--error)' }}>*</span></label>
                      <input className="form-input" placeholder="e.g. Data Structures" value={courseForm.courseName}
                        onChange={(e) => setCourseForm({ ...courseForm, courseName: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Course Code</label>
                      <input className="form-input" placeholder="CS301" value={courseForm.courseCode}
                        onChange={(e) => setCourseForm({ ...courseForm, courseCode: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Faculty Name <span style={{ color: 'var(--error)' }}>*</span></label>
                      <input className="form-input" placeholder="Dr. Smith" value={courseForm.facultyName}
                        onChange={(e) => setCourseForm({ ...courseForm, facultyName: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Department</label>
                      <input className="form-input" placeholder="Computer Science" value={courseForm.department}
                        onChange={(e) => setCourseForm({ ...courseForm, department: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Semester</label>
                      <input className="form-input" placeholder="5" value={courseForm.semester}
                        onChange={(e) => setCourseForm({ ...courseForm, semester: e.target.value })} />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">Description</label>
                      <textarea className="form-textarea" rows={2} placeholder="Brief course description..." value={courseForm.description}
                        onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <button type="button" className="btn btn-secondary" style={{ flex: 1 }}
                      onClick={() => setShowCourseModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={creatingCourse} id="create-course-submit">
                      {creatingCourse ? <><div className="spinner spinner-sm"></div> Creating...</> : '✓ Create Course'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Courses Table */}
          {courses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <div className="empty-state-title">No courses yet</div>
              <p>Click "Add New Course" to get started</p>
              <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => setShowCourseModal(true)}>
                ＋ Add First Course
              </button>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Code</th>
                    <th>Faculty</th>
                    <th>Department</th>
                    <th>Sem</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((c) => (
                    <tr key={c._id}>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{c.courseName}</td>
                      <td>
                        {c.courseCode
                          ? <span style={{ fontFamily: 'monospace', background: 'rgba(99,102,241,0.1)', padding: '2px 6px', borderRadius: '4px', color: 'var(--primary-light)', fontSize: '0.8rem' }}>{c.courseCode}</span>
                          : '—'}
                      </td>
                      <td>👤 {c.facultyName}</td>
                      <td>{c.department || '—'}</td>
                      <td>{c.semester || '—'}</td>
                      <td>
                        <span className={`badge ${c.isActive ? 'badge-success' : 'badge-error'}`}>
                          {c.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setSelectedCourseForLessons(c._id)}>📖 Lessons</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCourse(c._id, c.courseName)} id={`del-course-${c._id}`}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===== FORMS TAB ===== */}
      {activeTab === 'forms' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 700 }}>📋 Feedback Forms ({feedbackForms.length})</h2>
            <button className="btn btn-primary" onClick={() => setShowFormModal(true)} id="add-form-btn">＋ Create Form</button>
          </div>

          {/* Form Creation Modal */}
          {showFormModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', overflow: 'auto' }}
              onClick={(e) => e.target === e.currentTarget && setShowFormModal(false)}>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '32px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflow: 'auto' }} className="fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>➕ Create Feedback Form</h3>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }} onClick={() => setShowFormModal(false)}>✕</button>
                </div>
                <form onSubmit={handleCreateForm}>
                  <div className="form-group"><label className="form-label">Title *</label>
                    <input className="form-input" value={newFormData.title} onChange={e => setNewFormData(p => ({...p, title: e.target.value}))} required /></div>
                  <div className="form-group"><label className="form-label">Description</label>
                    <textarea className="form-textarea" rows={2} value={newFormData.description} onChange={e => setNewFormData(p => ({...p, description: e.target.value}))} /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div><label className="form-label">Type</label>
                      <select className="form-select" value={newFormData.formType} onChange={e => setNewFormData(p => ({...p, formType: e.target.value}))}>
                        <option value="macro">End-of-Course</option><option value="micro">Per-Lesson</option>
                      </select></div>
                    <div><label className="form-label">Trigger</label>
                      <select className="form-select" value={newFormData.triggerType} onChange={e => setNewFormData(p => ({...p, triggerType: e.target.value}))}>
                        <option value="manual">Manual</option><option value="lesson_complete">Lesson Complete</option>
                        <option value="course_complete">Course Complete</option><option value="time_interval">Time Interval</option>
                        <option value="exit_intent">Exit Intent</option><option value="instructor_prompt">Instructor Prompt</option>
                      </select></div>
                    <div><label className="form-label">Course (optional)</label>
                      <select className="form-select" value={newFormData.courseId} onChange={e => setNewFormData(p => ({...p, courseId: e.target.value}))}>
                        <option value="">All Courses</option>
                        {courses.map(c => <option key={c._id} value={c._id}>{c.courseName}</option>)}
                      </select></div>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <label className="form-label" style={{ margin: 0 }}>Questions</label>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={addQuestion}>＋ Add</button>
                    </div>
                    {newFormData.questions.map((q, idx) => (
                      <div key={idx} style={{ padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                          <input className="form-input" placeholder="Question text" style={{ flex: 1 }} value={q.questionText}
                            onChange={e => updateQuestion(idx, 'questionText', e.target.value)} />
                          <select className="form-select" style={{ width: '160px' }} value={q.questionType}
                            onChange={e => updateQuestion(idx, 'questionType', e.target.value)}>
                            <option value="star_rating">⭐ Star Rating</option><option value="emoji_reaction">😊 Emoji</option>
                            <option value="thumbs_up_down">👍 Thumbs</option><option value="nps">📊 NPS</option>
                            <option value="numeric_slider">📈 Slider</option><option value="likert">📏 Likert</option>
                            <option value="free_text">💬 Free Text</option><option value="multiple_choice">☑️ Multiple Choice</option>
                            <option value="ranking">🔢 Ranking</option><option value="rubric">📋 Rubric</option>
                          </select>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            <input type="checkbox" checked={q.required} onChange={e => updateQuestion(idx, 'required', e.target.checked)} /> Req
                          </label>
                          {newFormData.questions.length > 1 && (
                            <button type="button" className="btn btn-danger btn-sm" onClick={() => removeQuestion(idx)}>✕</button>)}
                        </div>
                        {['multiple_choice','ranking'].includes(q.questionType) && (
                          <div><input className="form-input" placeholder="Options (comma-separated)" style={{ fontSize: '0.8rem' }}
                            value={(q.options||[]).join(', ')} onChange={e => updateQuestion(idx, 'options', e.target.value.split(',').map(s=>s.trim()).filter(Boolean))} /></div>)}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowFormModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>✓ Create Form</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {loadingForms ? <div className="loading-center"><div className="spinner"></div></div> : feedbackForms.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">📋</div><div className="empty-state-title">No feedback forms</div><p>Create a form to collect structured feedback.</p></div>
          ) : (
            <div className="table-wrapper"><table className="table"><thead><tr>
              <th>Title</th><th>Type</th><th>Trigger</th><th>Questions</th><th>Course</th><th>Status</th><th>Actions</th>
            </tr></thead><tbody>
              {feedbackForms.map(f => (
                <tr key={f._id}>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{f.title}</td>
                  <td><span className={`badge ${f.formType==='micro'?'badge-info':'badge-primary'}`}>{f.formType}</span></td>
                  <td><span className="badge badge-warning">{f.triggerType?.replace(/_/g,' ')}</span></td>
                  <td>{f.questions?.length || 0}</td>
                  <td>{f.courseId?.courseName || 'All'}</td>
                  <td><span className={`badge ${f.isActive?'badge-success':'badge-error'}`}>{f.isActive?'Active':'Inactive'}</span></td>
                  <td style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn btn-primary btn-sm" onClick={() => handleTriggerForm(f._id)} title="Send to students">📢</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteForm(f._id)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody></table></div>
          )}
        </div>
      )}

      {/* Lesson Management - shown in courses tab */}
      {activeTab === 'courses' && selectedCourseForLessons && (
        <div className="card" style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ color: 'var(--text-primary)', fontWeight: 700 }}>📖 Lessons for: {courses.find(c=>c._id===selectedCourseForLessons)?.courseName}</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary btn-sm" onClick={() => { setLessonForm(p => ({...p, courseId: selectedCourseForLessons})); setShowLessonModal(true); }}>＋ Add Lesson</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedCourseForLessons(null)}>✕ Close</button>
            </div>
          </div>
          {loadingLessons ? <div className="loading-center"><div className="spinner spinner-sm"></div></div> : (
            (lessonsMap[selectedCourseForLessons]||[]).length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No lessons yet. Add the first lesson.</p>
            ) : (
              <div>{(lessonsMap[selectedCourseForLessons]||[]).map(l => (
                <div key={l._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-input)', borderRadius: '8px', marginBottom: '8px', border: '1px solid var(--border)' }}>
                  <div><span style={{ color: 'var(--primary-light)', fontWeight: 700, marginRight: '8px' }}>#{l.order}</span><span style={{ color: 'var(--text-primary)' }}>{l.title}</span></div>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteLesson(l._id, selectedCourseForLessons)}>🗑️</button>
                </div>
              ))}</div>
            )
          )}

          {showLessonModal && (
            <div style={{ marginTop: '16px', padding: '16px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <form onSubmit={handleCreateLesson} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}><label className="form-label">Lesson Title *</label>
                  <input className="form-input" value={lessonForm.title} onChange={e => setLessonForm(p => ({...p, title: e.target.value}))} required /></div>
                <div style={{ flex: 1 }}><label className="form-label">Description</label>
                  <input className="form-input" value={lessonForm.description} onChange={e => setLessonForm(p => ({...p, description: e.target.value}))} /></div>
                <button type="submit" className="btn btn-success btn-sm">✓ Add</button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowLessonModal(false)}>Cancel</button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
