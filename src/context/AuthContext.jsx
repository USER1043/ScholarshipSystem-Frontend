import React, { createContext, useState, useEffect } from "react";
import api from "../api/api";
import { jwtDecode } from "jwt-decode";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Check expiry
        if (decoded.exp * 1000 < Date.now()) {
          logout();
        } else {
          setUser(decoded); // or fetch user profile
          // We can also store role in localStorage or decode from token
          const storedUser = JSON.parse(localStorage.getItem("user"));
          if (storedUser) setUser(storedUser);
        }
      } catch (error) {
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password, deviceId) => {
    // First step of login: Send credentials, get OTP or Token?
    // Our backend: Login -> Returns "message: OTP sent" and userId/email.
    // OR if trusted device: Returns token directly.
    const res = await api.post("/auth/login", { email, password, deviceId });

    if (res.data.token) {
      const { token, ...userData } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
    }

    return res.data; // Returns { userId, email, message } or { token, user... }
  };

  const verifyOtp = async (userId, otp, trustDevice) => {
    const res = await api.post("/auth/verify-otp", {
      userId,
      otp,
      trustDevice,
    });
    const { token, deviceId, ...userData } = res.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    if (deviceId) {
      localStorage.setItem("deviceId", deviceId);
    }
    setUser(userData);
    return userData;
  };

  const register = async (userData) => {
    const res = await api.post("/auth/register", userData);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const resendOtp = async (userId) => {
    const res = await api.post("/auth/resend-otp", { userId });
    return res.data;
  };

  const getOtpStatus = async (userId) => {
    try {
      const res = await api.post("/auth/otp-status", { userId });
      return res.data; // { remainingTime: number }
    } catch (err) {
      console.error("Failed to fetch OTP status", err);
      return { remainingTime: 0 };
    }
  };

  const verifyTotp = async (userId, token, trustDevice) => {
    const res = await api.post("/auth/verify-totp", {
      userId,
      token,
      trustDevice,
    });
    const { token: jwtToken, deviceId, ...userData } = res.data;

    localStorage.setItem("token", jwtToken);
    localStorage.setItem("user", JSON.stringify(userData));
    if (deviceId) {
      localStorage.setItem("deviceId", deviceId);
    }
    setUser(userData);
    return userData;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        verifyOtp,
        resendOtp,
        verifyTotp,
        register,
        logout,
        loading,
        getOtpStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
