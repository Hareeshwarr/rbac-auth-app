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

export const verifyOtp = (email, otp) =>
  api.post("/auth/verify-otp", { email, otp });

export const resetPassword = (email, otp, newPassword) =>
  api.post("/auth/reset-password", { email, otp, newPassword });
