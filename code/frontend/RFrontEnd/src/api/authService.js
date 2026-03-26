import api from "./axiosconfig";

export const login = (username, password) =>
  api.post("/auth/signin", { username, password });

export const register = (username, email, password, role) =>
  api.post("/auth/signup", {
    username,
    email,
    password,
    role
  });

export const forgotPassword = (email) =>
  api.post("/auth/forgot-password", { email });

export const resetPassword = (token, newPassword) =>
  api.post("/auth/reset-password", { token, newPassword });
