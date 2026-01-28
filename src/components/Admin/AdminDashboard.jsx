import React, { useEffect, useState } from "react";
import api from "../../api/api";

const AdminDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [approvalData, setApprovalData] = useState(null); // To show QR code after approval

  const fetchApplications = async () => {
    try {
      const res = await api.get("/admin/applications");
      setApplications(res.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch applications");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleApprove = async (id) => {
    try {
      const res = await api.post(`/admin/approve/${id}`);
      setApprovalData(res.data);
      fetchApplications(); // Refresh list
    } catch (err) {
      alert(err.response?.data?.message || "Approval failed");
    }
  };

  const [onboardData, setOnboardData] = useState({
    username: "",
    email: "",
    role: "verifier",
  });
  const [onboardStatus, setOnboardStatus] = useState({
    loading: false,
    message: "",
    error: "",
  });

  const handleOnboardChange = (e) => {
    setOnboardData({ ...onboardData, [e.target.name]: e.target.value });
  };

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    setOnboardStatus({ loading: true, message: "", error: "" });
    try {
      await api.post("/auth/onboard", onboardData);
      setOnboardStatus({
        loading: false,
        message: `Invitation sent to ${onboardData.email}!`,
        error: "",
      });
      setOnboardData({ username: "", email: "", role: "verifier" });
    } catch (err) {
      setOnboardStatus({
        loading: false,
        message: "",
        error: err.response?.data?.message || "Onboarding failed",
      });
    }
  };

  const [activeTab, setActiveTab] = useState("approvals");

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      <h1>Admin Dashboard</h1>

      {/* Tabs Navigation */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "2rem",
          borderBottom: "2px solid #eee",
        }}
      >
        <button
          onClick={() => setActiveTab("approvals")}
          style={{
            background: "none",
            border: "none",
            borderBottom:
              activeTab === "approvals"
                ? "3px solid #646cff"
                : "3px solid transparent",
            color: activeTab === "approvals" ? "#646cff" : "#666",
            borderRadius: "0",
            padding: "10px 20px",
            cursor: "pointer",
            fontWeight: activeTab === "approvals" ? "bold" : "normal",
          }}
        >
          Review Applications
        </button>
        <button
          onClick={() => setActiveTab("manage-team")}
          style={{
            background: "none",
            border: "none",
            borderBottom:
              activeTab === "manage-team"
                ? "3px solid #646cff"
                : "3px solid transparent",
            color: activeTab === "manage-team" ? "#646cff" : "#666",
            borderRadius: "0",
            padding: "10px 20px",
            cursor: "pointer",
            fontWeight: activeTab === "manage-team" ? "bold" : "normal",
          }}
        >
          Manage Team
        </button>
      </div>

      {/* Tab Content: Manage Team (Onboarding) */}
      {activeTab === "manage-team" && (
        <div
          className="card"
          style={{ marginBottom: "2rem", borderLeft: "4px solid #646cff" }}
        >
          <h2>Inviting New Employee</h2>
          <form
            onSubmit={handleOnboardSubmit}
            style={{
              display: "grid",
              gap: "1rem",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              alignItems: "end",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <label>Employee Name</label>
              <input
                name="username"
                value={onboardData.username}
                onChange={handleOnboardChange}
                placeholder="John Doe"
                required
                style={{ padding: "8px" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <label>Email Address</label>
              <input
                name="email"
                type="email"
                value={onboardData.email}
                onChange={handleOnboardChange}
                placeholder="john@example.com"
                required
                style={{ padding: "8px" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <label>Role</label>
              <select
                name="role"
                value={onboardData.role}
                onChange={handleOnboardChange}
                style={{ padding: "8px" }}
              >
                <option value="verifier">
                  Verifier (Scholarship Reviewer)
                </option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={onboardStatus.loading}
              style={{ height: "40px" }}
            >
              {onboardStatus.loading ? "Sending Invite..." : "Send Invite"}
            </button>
          </form>
          {onboardStatus.message && (
            <p style={{ color: "green", marginTop: "10px" }}>
              {onboardStatus.message}
            </p>
          )}
          {onboardStatus.error && (
            <p style={{ color: "red", marginTop: "10px" }}>
              {onboardStatus.error}
            </p>
          )}
        </div>
      )}

      {/* Tab Content: Approvals */}
      {activeTab === "approvals" && (
        <>
          {/* Show Approval Modal if active */}
          {approvalData && (
            <div
              className="card"
              style={{ borderColor: "#4CAF50", marginBottom: "2rem" }}
            >
              <h2 style={{ color: "#4CAF50" }}>{approvalData.message}</h2>
              <p>
                <strong>Digital Signature:</strong>
              </p>
              <textarea
                readOnly
                value={approvalData.signature}
                style={{ width: "100%", height: "100px", fontSize: "0.8rem" }}
              />
              <div
                style={{
                  marginTop: "1rem",
                  background: "white",
                  padding: "10px",
                  display: "inline-block",
                }}
              >
                <img src={approvalData.qrCode} alt="Application QR Code" />
              </div>
              <button
                onClick={() => setApprovalData(null)}
                style={{ marginTop: "1rem", backgroundColor: "#555" }}
              >
                Close
              </button>
            </div>
          )}

          <div
            style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
          >
            {/* Section 1: Ready for Approval */}
            <div>
              <h2 style={{ color: "#646cff" }}>Ready for Approval</h2>
              {applications.filter(
                (app) =>
                  app.verificationStatus === "verified" &&
                  app.status !== "approved",
              ).length === 0 ? (
                <p style={{ fontStyle: "italic", color: "#666" }}>
                  No applications currently waiting for approval.
                </p>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: "1rem",
                  }}
                >
                  {applications
                    .filter(
                      (app) =>
                        app.verificationStatus === "verified" &&
                        app.status !== "approved",
                    )
                    .map((app) => (
                      <ApplicationCard
                        key={app._id}
                        app={app}
                        handleApprove={handleApprove}
                      />
                    ))}
                </div>
              )}
            </div>

            <hr style={{ opacity: 0.1 }} />

            {/* Section 2: Approved History & Others */}
            <div>
              <h2>Application History & Status</h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: "1rem",
                }}
              >
                {applications
                  .filter(
                    (app) =>
                      !(
                        app.verificationStatus === "verified" &&
                        app.status !== "approved"
                      ),
                  )
                  .map((app) => (
                    <ApplicationCard
                      key={app._id}
                      app={app}
                      handleApprove={handleApprove}
                    />
                  ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Helper Component to reduce duplication
const ApplicationCard = ({ app, handleApprove }) => (
  <div
    className="card"
    style={{
      maxWidth: "100%",
      opacity: app.status === "approved" ? 0.7 : 1,
      borderLeft:
        app.verificationStatus === "verified"
          ? "5px solid #646cff"
          : "1px solid #ccc",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <h3>Student: {app.student?.username || "Unknown"}</h3>
      <span
        style={{
          padding: "4px 8px",
          borderRadius: "4px",
          fontSize: "0.8rem",
          backgroundColor: app.status === "approved" ? "#d4edda" : "#f8f9fa",
          color: app.status === "approved" ? "#155724" : "#333",
        }}
      >
        {app.status.toUpperCase()}
      </span>
    </div>

    <p>
      <strong>Verification:</strong> {app.verificationStatus}
    </p>
    {app.verifierComments && (
      <p>
        <strong>Verifier Comments:</strong> {app.verifierComments}
      </p>
    )}

    <hr style={{ margin: "10px 0" }} />

    <p>
      <strong>Full Name:</strong> {app.fullName}
    </p>
    <p>
      <strong>Income:</strong> {app.incomeDetails}
    </p>

    <div
      style={{
        marginTop: "10px",
        padding: "10px",
        background: "#f5f5f5",
        borderRadius: "4px",
      }}
    >
      <h4 style={{ margin: "0 0 5px 0" }}>Academic Details</h4>
      <p>
        <strong>Institute:</strong> {app.instituteName}
      </p>
      {app.academicDetails && (
        <>
          <p>
            <strong>GPA:</strong> {app.academicDetails.currentGPA}/10
          </p>
          <p>
            <strong>Exam:</strong> {app.examType}
          </p>
          <p>
            <strong>Score:</strong> {app.academicDetails.examScore}
          </p>
        </>
      )}
    </div>

    {app.verificationStatus === "verified" && app.status !== "approved" && (
      <button
        onClick={() => handleApprove(app._id)}
        style={{ backgroundColor: "#646cff", marginTop: "1rem", width: "100%" }}
      >
        Approve & Digitally Sign
      </button>
    )}
  </div>
);

export default AdminDashboard;
