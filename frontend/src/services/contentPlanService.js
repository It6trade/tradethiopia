import axiosInstance from './axiosInstance';

const unwrap = (response) => response?.data ?? response;

export const fetchContentPlans = (params) =>
  axiosInstance
    .get('/content-plans', { params })
    .then((response) => unwrap(response));

export const createContentPlan = (payload) =>
  axiosInstance
    .post('/content-plans', payload)
    .then((response) => unwrap(response));

export const updateContentPlan = (id, payload) =>
  axiosInstance
    .put(`/content-plans/${id}`, payload)
    .then((response) => unwrap(response));

export const deleteContentPlan = (id) =>
  axiosInstance
    .delete(`/content-plans/${id}`)
    .then((response) => unwrap(response));
