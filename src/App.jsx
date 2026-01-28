import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Common/Navbar';
import ProtectedRoute from './components/Common/ProtectedRoute';
import { ROLES } from './utils/roleHelper';

// Auth Components
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import OTPVerify from './components/Auth/OTPVerify';
import TOTPVerify from './components/Auth/TOTPVerify';
import SetupAccount from './components/Auth/SetupAccount';

// Role Components
import ApplyScholarship from './components/Student/ApplyScholarship';
import ApplicationStatus from './components/Student/ApplicationStatus';
import VerifyApplications from './components/Verifier/VerifyApplications';
import AdminDashboard from './components/Admin/AdminDashboard';
import HomeRedirect from './components/Common/HomeRedirect';
import Unauthorized from './components/Common/Unauthorized';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<OTPVerify />} />
          <Route path="/verify-totp" element={<TOTPVerify />} />
          <Route path="/setup-account" element={<SetupAccount />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Routes - Student */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.STUDENT]} />}>
            <Route path="/student/apply" element={<ApplyScholarship />} />
            <Route path="/student/status" element={<ApplicationStatus />} />
          </Route>

          {/* Protected Routes - Verifier */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.VERIFIER]} />}>
            <Route path="/verifier/dashboard" element={<VerifyApplications />} />
          </Route>

          {/* Protected Routes - Admin */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Route>

          {/* Protected Routes - Admin */}

// ... inside App component return ...

          {/* Default Route */}
          <Route path="/" element={<HomeRedirect />} />
          <Route path="*" element={<div className="card"><h1>404 Not Found</h1></div>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
