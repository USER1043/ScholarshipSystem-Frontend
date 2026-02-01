import React, { useState, useContext, useEffect } from "react";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import {
  getPublicKey,
  generateAESKey,
  encryptWithAES,
  encryptAESKeyWithRSA,
} from "../../utils/encryptionUtils";

const ApplyScholarship = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    bankDetails: "",
    idNumber: "",
    incomeDetails: "",
    instituteName: "",
    currentGPA: "",
    examType: "JEE",
    examScore: "",
  });
  const [serverPublicKey, setServerPublicKey] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [files, setFiles] = useState({});

  useEffect(() => {
    // Fetch Server Public Key on Mount
    const fetchKey = async () => {
      try {
        const key = await getPublicKey();
        setServerPublicKey(key);
      } catch (err) {
        setError("Secure connection failed. Unable to initialize encryption.");
      }
    };
    fetchKey();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFiles({ ...files, [e.target.name]: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!serverPublicKey) {
      setError("Encryption key missing. Please refresh the page.");
      return;
    }

    try {
      // 1. Generate Client-Side AES Key
      const aesKey = generateAESKey();

      // 2. Encrypt Sensitive Data
      const encryptedBankDetails = encryptWithAES(formData.bankDetails, aesKey);
      const encryptedIdNumber = encryptWithAES(formData.idNumber, aesKey);
      const encryptedIncomeDetails = encryptWithAES(
        formData.incomeDetails,
        aesKey,
      );

      // Encrypt Academic Details (Grouped)
      const academicData = JSON.stringify({
        currentGPA: formData.currentGPA,
        examScore: formData.examScore,
      });
      const encryptedAcademicDetails = encryptWithAES(academicData, aesKey);

      // 3. Encrypt AES Key with Server Public Key
      const encryptedAesKey = encryptAESKeyWithRSA(aesKey, serverPublicKey);

      const data = new FormData();

      // Append Encrypted Fields (as JSON strings because FormData handles text or files)
      data.append("encryptedBankDetails", JSON.stringify(encryptedBankDetails));
      data.append("encryptedIdNumber", JSON.stringify(encryptedIdNumber));
      data.append(
        "encryptedIncomeDetails",
        JSON.stringify(encryptedIncomeDetails),
      );
      data.append(
        "encryptedAcademicDetails",
        JSON.stringify(encryptedAcademicDetails),
      );
      data.append("encryptedAesKey", encryptedAesKey);

      // Append Non-Sensitive Data
      data.append("instituteName", formData.instituteName);
      data.append("examType", formData.examType);

      // Append files
      if (files.incomeProof) data.append("incomeProof", files.incomeProof);
      if (files.marksheet) data.append("marksheet", files.marksheet);
      if (files.studentCertificate)
        data.append("studentCertificate", files.studentCertificate);

      await api.post("/applications", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage("Application Submitted Successfully (Encrypted)!");
      setTimeout(() => navigate("/student/status"), 2000);
    } catch (err) {
      console.error(err);
      if (!err.response) {
        setError("Unable to connect to server.");
      } else if (err.response.data.errors) {
        const errorUnique = err.response.data.errors
          .map((e) => e.msg)
          .join(", ");
        setError(errorUnique);
      } else {
        setError(err.response.data?.message || "Submission failed");
      }
    }
  };

  return (
    <div className="card" style={{ maxWidth: "600px" }}>
      <h1>Apply for Scholarship</h1>
      <form onSubmit={handleSubmit}>
        {/* Unchanged UI ... */}
        <div className="input-group">
          <label>Full Name</label>
          <input
            type="text"
            value={user?.username || ""}
            disabled
            style={{
              backgroundColor: "rgba(0,0,0,0.1)",
              cursor: "not-allowed",
            }}
          />
        </div>
        <div className="input-group">
          <label>Bank Account Number</label>
          <input
            type="text"
            name="bankDetails"
            value={formData.bankDetails}
            onChange={handleChange}
            required
          />
        </div>
        <div className="input-group">
          <label>Aadhar ID</label>
          <input
            type="text"
            name="idNumber"
            value={formData.idNumber}
            onChange={handleChange}
            required
          />
        </div>
        <div className="input-group">
          <label>Annual Family Income</label>
          <input
            type="number"
            name="incomeDetails"
            value={formData.incomeDetails}
            onChange={handleChange}
            required
          />
        </div>

        {/* File Uploads Section */}
        <hr style={{ margin: "20px 0", border: "1px solid #eee" }} />
        <h3>Upload Documents</h3>
        <p style={{ fontSize: "0.8rem", color: "#666", marginBottom: "15px" }}>
          PDF or Image files only (Max 5MB)
        </p>

        <div className="input-group">
          <label>Income Proof</label>
          <input
            type="file"
            name="incomeProof"
            onChange={handleFileChange}
            accept=".pdf,image/*"
          />
        </div>
        <div className="input-group">
          <label>Marksheet</label>
          <input
            type="file"
            name="marksheet"
            onChange={handleFileChange}
            accept=".pdf,image/*"
          />
        </div>
        <div className="input-group">
          <label>Student Certificate</label>
          <input
            type="file"
            name="studentCertificate"
            onChange={handleFileChange}
            accept=".pdf,image/*"
          />
        </div>

        <hr style={{ margin: "20px 0", border: "1px solid #eee" }} />
        <h3>Academic Details (Merit)</h3>
        <div className="input-group">
          <label>Institute Name</label>
          <input
            type="text"
            name="instituteName"
            value={formData.instituteName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="input-group">
          <label>Current GPA (0-10)</label>
          <input
            type="number"
            name="currentGPA"
            min="0"
            max="10"
            step="0.1"
            value={formData.currentGPA}
            onChange={handleChange}
            required
          />
        </div>
        <div className="input-group">
          <label>Standardized Test</label>
          <select
            name="examType"
            value={formData.examType}
            onChange={handleChange}
            style={{ width: "100%", padding: "8px" }}
          >
            <option value="JEE">JEE</option>
            <option value="NEET">NEET</option>
            <option value="GATE">GATE</option>
          </select>
        </div>
        <div className="input-group">
          <label>Test Score (0-100% )</label>
          <input
            type="number"
            name="examScore"
            min="0"
            max="100"
            step="0.01"
            value={formData.examScore}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" disabled={!serverPublicKey}>
          {serverPublicKey ? "Submit Application" : "Initializing Security..."}
        </button>
        {message && (
          <p style={{ color: "green", marginTop: "1rem" }}>{message}</p>
        )}
        {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}
      </form>
    </div>
  );
};

export default ApplyScholarship;
