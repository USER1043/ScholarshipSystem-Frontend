import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { ROLES } from '../../utils/roleHelper';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;

    return (
        <nav>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <img src="../../ScholarshipTracker.png" alt="Logo" style={{ width: '3rem', height: '3rem', marginRight: '1rem', borderRadius: '50%', objectFit: 'cover', border: '1px solid #ccc' }} />
                <Link to="/" style={{ fontSize: '1.2rem', fontWeight: 'bold', marginLeft: 0 }}>Scholarship System</Link>
            </div>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {user.role === ROLES.STUDENT && (
                    <>
                        <Link to="/student/apply">Apply</Link>
                        <Link to="/student/status">My Status</Link>
                    </>
                )}
                {user.role === ROLES.VERIFIER && (
                    <Link to="/verifier/dashboard">Verify Applications</Link>
                )}
                {user.role === ROLES.ADMIN && (
                    <Link to="/admin/dashboard">Admin Dashboard</Link>
                )}
                <span style={{ marginLeft: '1rem', color: '#aaa' }}>{user.username} ({user.role})</span>
                <button onClick={handleLogout} style={{ marginLeft: '1rem', padding: '0.4rem 0.8rem', width: 'auto', fontSize: '0.9rem' }}> Logout</button>
            </div>
        </nav>
    );
};

export default Navbar;
