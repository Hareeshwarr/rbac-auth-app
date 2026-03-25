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
