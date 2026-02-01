import React, { useEffect, useState } from "react";
import api from "../../api/api";
import { decryptWithAES } from "../../utils/encryptionUtils";

const ApplicationStatus = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [verificationResults, setVerificationResults] = useState({});

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await api.get("/applications/my");

        // Client-Side Decryption of Sensitive Data
        const decryptedApps = res.data.map((app) => {
          if (app.decryptedAesKey) {
            try {
              const key = app.decryptedAesKey;

              // Decrypt Individual Fields
              const bankDetails = decryptWithAES(
                app.encryptedBankDetails.content,
                app.encryptedBankDetails.iv,
                key,
              );
              const idNumber = decryptWithAES(
                app.encryptedIdNumber.content,
                app.encryptedIdNumber.iv,
                key,
              );
              const incomeDetails = decryptWithAES(
                app.encryptedIncomeDetails.content,
                app.encryptedIncomeDetails.iv,
                key,
              );

              // Decrypt Academic Details (Stored as JSON)
              const academicJson = decryptWithAES(
                app.encryptedAcademicDetails.content,
                app.encryptedAcademicDetails.iv,
                key,
              );
              const academicDetails = JSON.parse(academicJson);

              // Map back to flat structure for UI
              return {
                ...app,
                bankDetails,
                idNumber,
                incomeDetails,
                currentGPA: academicDetails.currentGPA,
                examScore: academicDetails.examScore,
              };
            } catch (decryptionErr) {
              console.error(
                "Decryption failed for app",
                app._id,
                decryptionErr,
              );
              return {
                ...app,
                error: "Failed to decrypt data locally",
                bankDetails: "Error",
                idNumber: "Error",
                incomeDetails: "Error",
              };
            }
          }
          return app;
        });

        setApplications(decryptedApps);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch applications");
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const verifyIntegrity = async (appId) => {
    try {
      const res = await api.get(`/applications/verify-signature/${appId}`);
      setVerificationResults((prev) => ({
        ...prev,
        [appId]: res.data,
      }));
    } catch (err) {
      setVerificationResults((prev) => ({
        ...prev,
        [appId]: {
          status: "error",
          message:
            "Verification failed: " +
            (err.response?.data?.message || err.message),
        },
      }));
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1rem" }}>
      <h1>My Applications</h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "2rem",
        }}
      >
        {applications.length === 0 ? (
          <div
            style={{
              gridColumn: "1 / -1",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "50vh",
              flexDirection: "column",
            }}
          >
            <p style={{ fontSize: "1.2rem", color: "#666" }}>
              No applications submitted yet.
            </p>
          </div>
        ) : (
          applications.map((app) => (
            <div
              key={app._id}
              className="card"
              style={{ marginBottom: "1rem", maxWidth: "100%" }}
            >
              <h3>Application ID: {app._id}</h3>
              <p>
                <strong>Status:</strong>{" "}
                <span
                  style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    backgroundColor:
                      app.status === "Approved"
                        ? "#d4edda"
                        : app.status === "Rejected"
                          ? "#f8d7da"
                          : app.status === "Verified"
                            ? "#cce5ff"
                            : "#f8f9fa",
                    color:
                      app.status === "Approved"
                        ? "#155724"
                        : app.status === "Rejected"
                          ? "#721c24"
                          : app.status === "Verified"
                            ? "#004085"
                            : "#333",
                    fontWeight: "bold",
                  }}
                >
                  {app.status ? app.status.toUpperCase() : "SUBMITTED"}
                </span>
              </p>

              {app.status === "Rejected" && (
                <div
                  style={{
                    marginTop: "10px",
                    padding: "10px",
                    background: "#f8d7da",
                    border: "1px solid #f5c6cb",
                    color: "#721c24",
                    borderRadius: "4px",
                  }}
                >
                  <strong>❌ Application Rejected</strong>
                  <p style={{ margin: "5px 0 0 0" }}>
                    Reason: {app.rejectionReason}
                  </p>
                </div>
              )}

              <p>
                <strong>Verification Status:</strong>{" "}
                {app.verificationStatus || "N/A"}
              </p>
              {app.verifierComments && (
                <p>
                  <strong>Verifier Comments:</strong> {app.verifierComments}
                </p>
              )}
              <h4>Details:</h4>
              <ul>
                <li>
                  <strong>Full Name:</strong> {app.fullName}
                </li>
                <li>
                  <strong>Institute:</strong> {app.instituteName}
                </li>
                <li>
                  <strong>GPA:</strong> {app.currentGPA}
                </li>
                <li>
                  <strong>Exam:</strong> {app.examType} ({app.examScore})
                </li>
                <li>
                  <strong>Bank Details:</strong> {app.bankDetails}
                </li>
                <li>
                  <strong>Aadhar ID:</strong> {app.idNumber}
                </li>
                <li>
                  <strong>Income:</strong> {app.incomeDetails}
                </li>
              </ul>

              {/* Digital Signature Visibility */}
              {app.status === "Approved" && (
                <div
                  style={{
                    marginTop: "1rem",
                    borderTop: "1px solid #ccc",
                    paddingTop: "1rem",
                  }}
                >
                  <h4 style={{ color: "#1A5F7A" }}>
                    ✔ Digitally Signed by Admin
                  </h4>
                  <button
                    onClick={() => verifyIntegrity(app._id)}
                    style={{
                      padding: "0.5rem 1rem",
                      cursor: "pointer",
                      background: "#2E8B57",
                    }}
                  >
                    Verify Application Integrity
                  </button>

                  {verificationResults[app._id] && (
                    <div
                      style={{
                        marginTop: "10px",
                        padding: "10px",
                        borderRadius: "4px",
                        backgroundColor:
                          verificationResults[app._id].status === "valid"
                            ? "#d4edda"
                            : "#f8d7da",
                        color:
                          verificationResults[app._id].status === "valid"
                            ? "#155724"
                            : "#721c24",
                        border: `1px solid ${verificationResults[app._id].status === "valid" ? "#c3e6cb" : "#f5c6cb"}`,
                      }}
                    >
                      <p>
                        <strong>Integrity Status:</strong>{" "}
                        {verificationResults[app._id].status === "valid"
                          ? "Verified"
                          : "Tampered"}
                      </p>
                      <p>{verificationResults[app._id].message}</p>
                      {verificationResults[app._id].status === "valid" && (
                        <>
                          <p>
                            <small>
                              Signature ID:{" "}
                              {verificationResults[app._id].signatureId}
                            </small>
                          </p>
                          {app.signedBy && (
                            <p>
                              <strong>Signed By:</strong>{" "}
                              {app.signedBy.username} ({app.signedBy.email})
                            </p>
                          )}
                          <p>
                            <small>
                              Signed At:{" "}
                              {new Date(
                                verificationResults[app._id].signedAt,
                              ).toLocaleString()}
                            </small>
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* QR Code Visibility */}
              {app.qrCode && (
                <div
                  style={{
                    marginTop: "1rem",
                    borderTop: "1px solid #ccc",
                    paddingTop: "1rem",
                    textAlign: "center",
                  }}
                >
                  <h4 style={{ color: "#1A5F7A" }}>
                    Scan to verify application (Encoding Demo)
                  </h4>
                  <img
                    src={app.qrCode}
                    alt="Verification QR Code"
                    style={{ width: "150px", height: "150px" }}
                  />
                  <p style={{ fontSize: "0.8rem", color: "#666" }}>
                    Scan this QR code to access public verification details.
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ApplicationStatus;
