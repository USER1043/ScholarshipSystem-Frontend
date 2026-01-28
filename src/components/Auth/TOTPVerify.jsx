import React, { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

const TOTPVerify = () => {
  const { verifyTotp } = useContext(AuthContext);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [trustDevice, setTrustDevice] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // { userId, mfaType, qrCode } passed from Login
  const { userId, mfaType, qrCode } = location.state || {};

  if (!userId) {
    return (
      <div className="card">
        <p>Invalid Session. Please Login again.</p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await verifyTotp(userId, token, trustDevice);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Verification Failed");
    }
  };

  return (
    <div className="card" style={{ maxWidth: "450px" }}>
      <h2>Authenticator Verification</h2>

      {mfaType === "totp_setup" && (
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <p style={{ marginBottom: "1rem", color: "#2d3748" }}>
            <strong>Setup Required:</strong> Scan this QR Code with your
            Authenticator App (Google/Microsoft Auth).
          </p>
          <img
            src={qrCode}
            alt="TOTP QR Code"
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "10px",
            }}
          />
        </div>
      )}

      <p style={{ textAlign: "center", marginBottom: "1rem" }}>
        Enter the 6-digit code from your Authenticator App.
      </p>

      {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <input
            type="text"
            placeholder="000 000"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            maxLength="6"
            style={{
              textAlign: "center",
              letterSpacing: "0.2rem",
              fontSize: "1.2rem",
            }}
            required
          />
        </div>

        <div
          style={{
            marginBottom: "1rem",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.9rem",
            }}
          >
            <input
              style={{ width: "1rem" }}
              type="checkbox"
              checked={trustDevice}
              onChange={(e) => setTrustDevice(e.target.checked)}
            />
            Trust this device for 14 days
          </label>
        </div>

        <button type="submit">Verify Code</button>
      </form>
    </div>
  );
};

export default TOTPVerify;
