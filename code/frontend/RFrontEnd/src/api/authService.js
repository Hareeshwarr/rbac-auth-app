import api from "./axiosconfig";

export const login = (username, password) =>
  api.post("/auth/signin", { username, password });

export const register = (username, email, password, role, phoneNumber) =>
  api.post("/auth/signup", {
    username,
    email,
    password,
    role,
    phoneNumber: phoneNumber || undefined,
  });

export const forgotPassword = (email) =>
  api.post("/auth/forgot-password", { email });

export const verifyOtp = (email, otp) =>
  api.post("/auth/verify-otp", { email, otp });

export const resetPassword = (email, otp, newPassword) =>
  api.post("/auth/reset-password", { email, otp, newPassword });

export const firebaseLogin = (idToken, authProvider, email, displayName, phoneNumber, uid) =>
  api.post("/auth/firebase-login", {
    idToken,
    authProvider,
    email,
    displayName,
    phoneNumber,
    uid,
  });

export const phoneResetPassword = (phoneNumber, newPassword, idToken) =>
  api.post("/auth/phone-reset-password", {
    phoneNumber,
    newPassword,
    idToken,
  });
