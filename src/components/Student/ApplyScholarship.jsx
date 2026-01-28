import React, { useState, useContext } from "react";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

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
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      await api.post("/applications", formData);
      setMessage("Application Submitted Successfully!");
      // Redirect to status page after short delay
      setTimeout(() => navigate("/student/status"), 2000);
    } catch (err) {
      if (!err.response) {
        setError("Unable to connect to server.");
      } else if (err.response.data.errors) {
        // Handle express-validator array
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
      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
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

        <hr style={{ margin: "20px 0", border: "1px solid #eee" }} />
        <h3>Academic Details (Merit)</h3>
        <p style={{ fontSize: "0.8rem", color: "#666", marginBottom: "15px" }}>
          Academic data is used to assess merit eligibility.
        </p>

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
        <button type="submit">Submit Application</button>
      </form>
    </div>
  );
};

export default ApplyScholarship;
