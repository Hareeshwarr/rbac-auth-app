import { createContext, useEffect, useState } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [faceVerified, setFaceVerified] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    const storedFaceVerified = sessionStorage.getItem("faceVerified");

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }

    if (storedFaceVerified === "true") {
      setFaceVerified(true);
    }

    setLoading(false);
  }, []);

  const loginUser = (data) => {
    const userData = {
      username: data.username,
      roles: data.roles,
    };

    localStorage.setItem("token", data.accessToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("faceVerified");
    setUser(null);
    setFaceVerified(false);
  };

  const verifyFace = () => {
    sessionStorage.setItem("faceVerified", "true");
    setFaceVerified(true);
  };

  return (
    <AuthContext.Provider value={{ user, loginUser, logout, loading, faceVerified, verifyFace }}>
      {children}
    </AuthContext.Provider>
  );
}
