import api from './api';

export const submitFeedback = async (data) => {
  const res = await api.post('/feedback', data);
  return res.data;
};

export const getFeedback = async (params = {}) => {
  const res = await api.get('/feedback', { params });
  return res.data;
};

export const getAnalytics = async () => {
  const res = await api.get('/feedback/analytics');
  return res.data;
};

export const checkFeedbackSubmitted = async (courseId, params = {}) => {
  const res = await api.get(`/feedback/check/${courseId}`, { params });
  return res.data;
};

export const deleteFeedback = async (id) => {
  const res = await api.delete(`/feedback/${id}`);
  return res.data;
};

// ===== Feedback Forms =====
export const getFeedbackForms = async (params = {}) => {
  const res = await api.get('/feedback-forms', { params });
  return res.data;
};

export const getFeedbackFormById = async (id) => {
  const res = await api.get(`/feedback-forms/${id}`);
  return res.data;
};

export const getActiveFormsForCourse = async (courseId, params = {}) => {
  const res = await api.get(`/feedback-forms/active/${courseId}`, { params });
  return res.data;
};

export const createFeedbackForm = async (data) => {
  const res = await api.post('/feedback-forms', data);
  return res.data;
};

export const updateFeedbackForm = async (id, data) => {
  const res = await api.put(`/feedback-forms/${id}`, data);
  return res.data;
};

export const deleteFeedbackForm = async (id) => {
  const res = await api.delete(`/feedback-forms/${id}`);
  return res.data;
};

export const triggerFormPrompt = async (id) => {
  const res = await api.post(`/feedback-forms/${id}/trigger`);
  return res.data;
};

// ===== Feedback Responses =====
export const submitFeedbackResponse = async (data) => {
  const res = await api.post('/feedback-responses', data);
  return res.data;
};

export const getFeedbackResponses = async (params = {}) => {
  const res = await api.get('/feedback-responses', { params });
  return res.data;
};

export const getResponseAnalytics = async (formId) => {
  const res = await api.get(`/feedback-responses/analytics/${formId}`);
  return res.data;
};
