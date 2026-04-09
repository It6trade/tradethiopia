import axiosInstance from './axiosInstance';

// Fetch all assets
export const fetchAssets = () => axiosInstance.get('/assets').then(response => response.data);

// Fetch categories
export const fetchCategories = () => axiosInstance.get('/categories').then(response => response.data);

// Fetch users
export const fetchUsers = () =>
  axiosInstance
    .get("/users")
    .then((response) => response.data?.data || response.data);

// Fetch user counts
export const fetchUserCounts = () => axiosInstance.get('/users/count').then(response => response.data);

// Add a new asset
export const createAsset = (asset) => axiosInstance.post('/assets', asset).then(response => response.data);

// Update an asset
export const updateAsset = (id, asset) => axiosInstance.put(`/assets/${id}`, asset).then(response => response.data);

// Delete an asset
export const deleteAsset = (id) => axiosInstance.delete(`/assets/${id}`).then(response => response.data);

// Training follow-ups
export const fetchTrainingFollowups = (params) =>
  axiosInstance.get('/training-followups', { params }).then(response => response.data);

export const createTrainingFollowup = (data) =>
  axiosInstance.post('/training-followups', data).then(response => response.data);

export const updateTrainingFollowup = (id, data) =>
  axiosInstance.put(`/training-followups/${id}`, data).then(response => response.data);

export const deleteTrainingFollowup = (id) =>
  axiosInstance.delete(`/training-followups/${id}`).then(response => response.data);

// ENSRA follow-ups
export const fetchEnsraFollowups = (params) =>
  axiosInstance.get('/ensra-followups', { params }).then(response => response.data);

export const createEnsraFollowup = (data) =>
  axiosInstance.post('/ensra-followups', data).then(response => response.data);

export const updateEnsraFollowup = (id, data) =>
  axiosInstance.put(`/ensra-followups/${id}`, data).then(response => response.data);

export const deleteEnsraFollowup = (id) =>
  axiosInstance.delete(`/ensra-followups/${id}`).then(response => response.data);

// Consultancy
export const fetchConsultancies = (params) =>
  axiosInstance.get('/consultancies', { params }).then((response) => response.data);

export const createConsultancy = (data) =>
  axiosInstance.post('/consultancies', data).then((response) => response.data);

export const updateConsultancy = (id, data) =>
  axiosInstance.put(`/consultancies/${id}`, data).then((response) => response.data);

export const deleteConsultancy = (id) =>
  axiosInstance.delete(`/consultancies/${id}`).then((response) => response.data);

// Courses
export const fetchCourses = () =>
  axiosInstance.get('/courses').then(response => response.data);

export const fetchExternalCourses = () =>
  axiosInstance.get('/external-courses').then(response => response.data);

export const fetchInternalCourses = () =>
  axiosInstance.get('/internal-courses').then(response => response.data);

export const createExternalCourse = (data) =>
  axiosInstance.post('/external-courses', data).then(response => response.data);

export const updateExternalCourse = (id, data) =>
  axiosInstance.put(`/external-courses/${id}`, data).then(response => response.data);

export const deleteExternalCourse = (id) =>
  axiosInstance.delete(`/external-courses/${id}`).then(response => response.data);

export const createCourse = (data) =>
  axiosInstance.post('/courses', data).then(response => response.data);

export const updateCourse = (id, data) =>
  axiosInstance.put(`/courses/${id}`, data).then(response => response.data);

export const deleteCourse = (id) =>
  axiosInstance.delete(`/courses/${id}`).then(response => response.data);

export const addCourseSlide = (courseId, formData) =>
  axiosInstance.post(`/courses/${courseId}/slides`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }).then(response => response.data);

export const updateCourseSlide = (courseId, slideId, data) =>
  axiosInstance.put(`/courses/${courseId}/slides/${slideId}`, data).then(response => response.data);

export const addCourseQuestion = (courseId, data) =>
  axiosInstance.post(`/courses/${courseId}/questions`, data).then(response => response.data);

export const updateCourseQuestion = (courseId, questionId, data) =>
  axiosInstance.put(`/courses/${courseId}/questions/${questionId}`, data).then(response => response.data);

export const deleteCourseQuestion = (courseId, questionId) =>
  axiosInstance.delete(`/courses/${courseId}/questions/${questionId}`).then(response => response.data);

export const uploadCourseSlideImage = (formData) =>
  axiosInstance.post('/courses/slide-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }).then(response => response.data);
