import React, { useEffect, useState } from "react";
import api from "../../api/api";

const VerifyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comments, setComments] = useState({});

  const fetchApplications = async () => {
    try {
      const res = await api.get("/verifier/applications");
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

  const handleViewDocument = async (filename) => {
    try {
      const response = await api.get(`/applications/documents/${filename}`, {
        responseType: "blob",
      });
      // Create a temporary URL with correct MIME type
      const contentType = response.headers["content-type"] || "application/pdf";
      const fileURL = window.URL.createObjectURL(
        new Blob([response.data], { type: contentType }),
      );
      window.open(fileURL, "_blank");
    } catch (err) {
      alert("Failed to load document. You may not be authorized.");
    }
  };

  const handleVerify = async (id, status) => {
    try {
      const comment = comments[id] || "";
      await api.put(`/verifier/applications/${id}`, {
        status,
        comments: comment,
      });
      alert(`Application ${status}`);
      setComments((prev) => ({ ...prev, [id]: "" })); // Reset specific comment
      fetchApplications(); // Refresh list
    } catch (err) {
      alert("Operation failed");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      <h1>Verifier Dashboard</h1>
      {applications.length === 0 ? <p>No applications to verify.</p> : null}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "1rem",
        }}
      >
        {applications.map((app) => (
          <div key={app._id} className="card" style={{ maxWidth: "100%" }}>
            <h3>Student: {app.student?.username || "Unknown"}</h3>
            <p>
              <strong>Status:</strong> {app.status}
            </p>
            <p>
              <strong>Verification:</strong>{" "}
              {app.status === "Submitted"
                ? "Pending Review"
                : app.status === "Verified"
                  ? "Verified by Staff"
                  : app.status === "Approved"
                    ? "Approved by Admin"
                    : app.status === "Rejected"
                      ? "Rejected"
                      : "Unknown"}
            </p>
            {app.verifierComments && (
              <p>
                <strong>Comments:</strong> {app.verifierComments}
              </p>
            )}
            <hr />
            <p>
              <strong>Full Name:</strong> {app.fullName}
            </p>
            <p>
              <strong>Income:</strong> {app.incomeDetails}
            </p>
            <p>
              <strong>ID Number:</strong> {app.idNumber}
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
              {/* Documents Section */}
              <div
                style={{
                  marginTop: "10px",
                  padding: "10px",
                  background: "#e9ecef",
                  borderRadius: "4px",
                }}
              >
                <h4 style={{ margin: "0 0 5px 0" }}>Uploaded Documents</h4>
                {app.documents ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "5px",
                    }}
                  >
                    {app.documents.incomeProof ? (
                      <button
                        onClick={() =>
                          handleViewDocument(app.documents.incomeProof)
                        }
                        style={{
                          background: "none",
                          border: "none",
                          color: "#007bff",
                          textDecoration: "underline",
                          cursor: "pointer",
                          padding: 0,
                          textAlign: "left",
                        }}
                      >
                        View Income Proof
                      </button>
                    ) : (
                      <span>Income Proof: Not Uploaded</span>
                    )}

                    {app.documents.marksheet ? (
                      <button
                        onClick={() =>
                          handleViewDocument(app.documents.marksheet)
                        }
                        style={{
                          background: "none",
                          border: "none",
                          color: "#007bff",
                          textDecoration: "underline",
                          cursor: "pointer",
                          padding: 0,
                          textAlign: "left",
                        }}
                      >
                        View Marksheet
                      </button>
                    ) : (
                      <span>Marksheet: Not Uploaded</span>
                    )}

                    {app.documents.studentCertificate ? (
                      <button
                        onClick={() =>
                          handleViewDocument(app.documents.studentCertificate)
                        }
                        style={{
                          background: "none",
                          border: "none",
                          color: "#007bff",
                          textDecoration: "underline",
                          cursor: "pointer",
                          padding: 0,
                          textAlign: "left",
                        }}
                      >
                        View Student Certificate
                      </button>
                    ) : (
                      <span>Certificate: Not Uploaded</span>
                    )}
                  </div>
                ) : (
                  <p style={{ fontStyle: "italic", fontSize: "0.8rem" }}>
                    No documents attached (Legacy Application)
                  </p>
                )}
              </div>
            </div>

            {app.status === "Submitted" && (
              <div style={{ marginTop: "1rem" }}>
                <input
                  type="text"
                  placeholder="Verifier Comments"
                  value={comments[app._id] || ""}
                  onChange={(e) =>
                    setComments({ ...comments, [app._id]: e.target.value })
                  }
                  style={{ marginBottom: "0.5rem" }}
                />
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => handleVerify(app._id, "Verified")}
                    style={{ backgroundColor: "#007bff" }}
                  >
                    Mark as Verified
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VerifyApplications;
