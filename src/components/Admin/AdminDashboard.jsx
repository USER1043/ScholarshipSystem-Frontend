import React, { useEffect, useState } from "react";
import api from "../../api/api";

const AdminDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [approvalData, setApprovalData] = useState(null); // To show QR code after approval

  // Rejection Modal State
  const [rejectionModal, setRejectionModal] = useState({
    isOpen: false,
    appId: null,
    reason: "",
  });
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("approvals");

  const fetchUsers = async () => {
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  const handleRemoveUser = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to remove this user? This action cannot be undone.",
      )
    )
      return;
    try {
      await api.delete(`/admin/staff/${id}`); // Route is practically same
      await fetchUsers(); // Refresh list
      await fetchApplications(); // Refresh applications as they might be deleted
    } catch (err) {
      alert(err.response?.data?.message || "Failed to remove user");
    }
  };

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
    fetchUsers();
  }, []);

  // Poll user list when tab is active
  useEffect(() => {
    if (activeTab === "manage-users") {
      fetchUsers();
    } else if (activeTab === "approvals") {
      fetchApplications();
    }
  }, [activeTab]);

  const handleApprove = async (id) => {
    try {
      const res = await api.post(`/admin/approve/${id}`);
      setApprovalData(res.data);
      fetchApplications(); // Refresh list
    } catch (err) {
      alert(err.response?.data?.message || "Approval failed");
    }
  };

  const handleRejectClick = (id) => {
    setRejectionModal({ isOpen: true, appId: id, reason: "" });
  };

  const handleRejectSubmit = async () => {
    try {
      await api.post(`/admin/reject/${rejectionModal.appId}`, {
        reason: rejectionModal.reason,
      });
      alert("Application Rejected");
      setRejectionModal({ isOpen: false, appId: null, reason: "" });
      fetchApplications();
    } catch (err) {
      alert(err.response?.data?.message || "Rejection failed");
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      <h1>Admin Dashboard</h1>

      {/* Rejection Modal */}
      {rejectionModal.isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "8px",
              minWidth: "400px",
            }}
          >
            <h3>Reject Application</h3>
            <textarea
              value={rejectionModal.reason}
              onChange={(e) =>
                setRejectionModal({ ...rejectionModal, reason: e.target.value })
              }
              placeholder="Reason for rejection..."
              style={{
                width: "100%",
                height: "100px",
                marginBottom: "10px",
                padding: "10px",
              }}
            />
            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() =>
                  setRejectionModal({ isOpen: false, appId: null, reason: "" })
                }
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                style={{ backgroundColor: "red", color: "white" }}
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

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
          onClick={() => setActiveTab("manage-users")}
          style={{
            background: "none",
            border: "none",
            borderBottom:
              activeTab === "manage-users"
                ? "3px solid #646cff"
                : "3px solid transparent",
            color: activeTab === "manage-users" ? "#646cff" : "#666",
            borderRadius: "0",
            padding: "10px 20px",
            cursor: "pointer",
            fontWeight: activeTab === "manage-users" ? "bold" : "normal",
          }}
        >
          Manage Users
        </button>
      </div>

      {/* Tab Content: Manage Users (Onboarding + List) */}
      {activeTab === "manage-users" && (
        <>
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

          {/* User List */}
          <div className="card" style={{ maxWidth: "100%" }}>
            <h2>All Users (Staff & Students)</h2>
            {console.log("User Data:", users)}
            {users.length === 0 ? (
              <p>No users found.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid #ddd",
                      textAlign: "left",
                    }}
                  >
                    <th style={{ padding: "10px" }}>Name</th>
                    <th style={{ padding: "10px" }}>Email</th>
                    <th style={{ padding: "10px" }}>Role</th>
                    <th style={{ padding: "10px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((member) => (
                    <tr
                      key={member._id}
                      style={{ borderBottom: "1px solid #eee" }}
                    >
                      <td style={{ padding: "10px" }}>{member.username}</td>
                      <td style={{ padding: "10px" }}>{member.email}</td>
                      <td style={{ padding: "10px" }}>
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            backgroundColor:
                              member.role === "admin"
                                ? "#e3f2fd"
                                : member.role === "student"
                                  ? "#fff3e0"
                                  : "#f3e5f5",
                            color:
                              member.role === "admin"
                                ? "#1565c0"
                                : member.role === "student"
                                  ? "#e65100"
                                  : "#7b1fa2",
                            fontSize: "0.8rem",
                            fontWeight: "bold",
                          }}
                        >
                          {member.role.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: "10px" }}>
                        {!member.isSuperAdmin && (
                          <button
                            onClick={() => handleRemoveUser(member._id)}
                            style={{
                              backgroundColor: "#ff5252",
                              color: "white",
                              padding: "5px 10px",
                              fontSize: "0.8rem",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
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
            {/* Section 1: Ready for Review (Verified or Submitted AND Verified Account) */}
            <div>
              <h2 style={{ color: "#646cff" }}>Ready for Review</h2>
              {applications.filter(
                (app) =>
                  app.status !== "Approved" &&
                  app.status !== "Rejected" &&
                  app.student?.accountStatus !== "pending_verification", // Exclude unverified
              ).length === 0 ? (
                <p style={{ fontStyle: "italic", color: "#666" }}>
                  No applications currently waiting for review.
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
                        app.status !== "Approved" &&
                        app.status !== "Rejected" &&
                        app.student?.accountStatus !== "pending_verification",
                    )
                    .map((app) => (
                      <ApplicationCard
                        key={app._id}
                        app={app}
                        handleApprove={handleApprove}
                        handleRejectClick={handleRejectClick}
                      />
                    ))}
                </div>
              )}
            </div>

            <hr style={{ opacity: 0.1 }} />

            {/* Section 2: History (Approved/Rejected/Pending Verification) */}
            <div>
              <h2>Application History & Status</h2>
              {applications.length === 0 ? (
                <p
                  style={{
                    fontStyle: "italic",
                    color: "#666",
                    textAlign: "center",
                  }}
                >
                  No applications currently waiting for review.
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
                        app.status === "Approved" ||
                        app.status === "Rejected" ||
                        app.student?.accountStatus === "pending_verification", // Include unverified here
                    )
                    .map((app) => (
                      <ApplicationCard
                        key={app._id}
                        app={app}
                        handleApprove={handleApprove}
                        handleRejectClick={handleRejectClick}
                      />
                    ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Helper Component to reduce duplication
const ApplicationCard = ({ app, handleApprove, handleRejectClick }) => {
  let statusColor = "#f8f9fa";
  let statusTextColor = "#333";

  if (app.status === "Approved") {
    statusColor = "#d4edda";
    statusTextColor = "#155724";
  } else if (app.status === "Rejected") {
    statusColor = "#f8d7da";
    statusTextColor = "#721c24";
  } else if (app.status === "Verified") {
    statusColor = "#cce5ff";
    statusTextColor = "#004085";
  }

  return (
    <div
      className="card"
      style={{
        maxWidth: "100%",
        opacity:
          app.status === "Approved" || app.status === "Rejected" ? 0.7 : 1,
        borderLeft:
          app.status === "Verified"
            ? "5px solid #646cff"
            : app.status === "Rejected"
              ? "5px solid red"
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
            backgroundColor: statusColor,
            color: statusTextColor,
            fontWeight: "bold",
          }}
        >
          {app.status.toUpperCase()}
        </span>
      </div>

      {app.verifierComments && (
        <p>
          <strong>Verifier Comments:</strong> {app.verifierComments}
        </p>
      )}

      {app.rejectionReason && (
        <p style={{ color: "red" }}>
          <strong>Rejection Reason:</strong> {app.rejectionReason}
        </p>
      )}

      {/* Show Verification Warning - Only for pending applications */}
      {app.student?.accountStatus === "pending_verification" &&
        app.status !== "Approved" &&
        app.status !== "Rejected" && (
          <div
            style={{
              backgroundColor: "#fff3cd",
              color: "#856404",
              padding: "10px",
              borderRadius: "4px",
              marginBottom: "10px",
              border: "1px solid #ffeeba",
            }}
          >
            <strong>⚠️ Unverified Applicant:</strong> This student has not
            verified their email address.
          </div>
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

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "10px", marginTop: "1rem" }}>
        {app.status === "Verified" && (
          <button
            onClick={() => handleApprove(app._id)}
            style={{ backgroundColor: "#646cff", flex: 1 }}
          >
            Approve
          </button>
        )}

        {/* Admin can reject if not already approved/rejected AND not pending verification */}
        {app.status !== "Approved" &&
          app.status !== "Rejected" &&
          app.student?.accountStatus !== "pending_verification" && (
            <button
              onClick={() => handleRejectClick(app._id)}
              style={{ backgroundColor: "red", flex: 1 }}
            >
              Reject
            </button>
          )}
      </div>
    </div>
  );
};

export default AdminDashboard;
