import axiosInstance from "./axiosInstance";

const unwrap = (response) => response.data?.data || response.data || [];
const requestConfig = { timeout: 15000 };

export const getStudentRegistrations = async () => {
  const response = await axiosInstance.get("/student-registrations", requestConfig);
  return unwrap(response);
};

export const createStudentRegistration = async (payload) => {
  const response = await axiosInstance.post("/student-registrations", payload, requestConfig);
  return unwrap(response);
};

export const updateStudentRegistration = async (id, payload) => {
  const response = await axiosInstance.put(`/student-registrations/${id}`, payload, requestConfig);
  return unwrap(response);
};

export const deleteStudentRegistration = async (id) => {
  const response = await axiosInstance.delete(`/student-registrations/${id}`, requestConfig);
  return unwrap(response);
};
