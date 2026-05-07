import api from './api';

export const getLessonsByCourse = async (courseId) => {
  const res = await api.get(`/lessons/${courseId}`);
  return res.data;
};

export const createLesson = async (data) => {
  const res = await api.post('/lessons', data);
  return res.data;
};

export const updateLesson = async (id, data) => {
  const res = await api.put(`/lessons/${id}`, data);
  return res.data;
};

export const deleteLesson = async (id) => {
  const res = await api.delete(`/lessons/${id}`);
  return res.data;
};
