import React, { useState, useContext, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../api/api";
import { AuthContext } from "../../context/AuthContext.jsx";

const SetupAccount = () => {
  const { logout } = useContext(AuthContext);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState({
    loading: false,
    error: "",
    success: "",
  });

  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get("token");

  // Logout any existing user when opening the setup page
  useEffect(() => {
    logout();
  }, [logout]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setStatus({ ...status, error: "Passwords do not match" });
      return;
    }

    setStatus({ loading: true, error: "", success: "" });

    try {
      await api.post("/auth/complete-invite", { token, password });
      setStatus({
        loading: false,
        error: "",
        success: "Account set up! Redirecting to login...",
      });
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setStatus({
        loading: false,
        error:
          err.response?.data?.message || "Setup failed. Link may be expired.",
        success: "",
      });
    }
  };

  if (!token)
    return (
      <div style={{ color: "red", textAlign: "center", marginTop: "50px" }}>
        Invalid Invite Link
      </div>
    );

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "50px auto",
        padding: "20px",
        border: "1px solid #ddd",
        borderRadius: "8px",
      }}
    >
      <h2>Setup Your Account</h2>
      <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "20px" }}>
        Please create a secure password for your new account.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "15px" }}
      >
        <div>
          <label>New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </div>
        <div>
          <label>Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </div>

        <div
          style={{
            fontSize: "0.8rem",
            color: "#555",
            background: "#f9f9f9",
            padding: "10px",
            borderRadius: "4px",
          }}
        >
          <strong>Requirements:</strong>
          <ul style={{ paddingLeft: "20px", margin: "5px 0" }}>
            <li>At least 8 characters</li>
            <li>Include uppercase & lowercase</li>
            <li>Include a number & symbol</li>
          </ul>
        </div>

        <button
          type="submit"
          disabled={status.loading}
          style={{
            padding: "10px",
            background: "#646cff",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          {status.loading ? "Setting up..." : "Set Password & Activate"}
        </button>
      </form>

      {status.error && (
        <p style={{ color: "red", marginTop: "15px" }}>{status.error}</p>
      )}
      {status.success && (
        <p style={{ color: "green", marginTop: "15px" }}>{status.success}</p>
      )}
    </div>
  );
};

export default SetupAccount;
