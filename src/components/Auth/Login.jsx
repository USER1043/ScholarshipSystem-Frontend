import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const { login } = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const deviceId = localStorage.getItem('deviceId');
            const data = await login(email, password, deviceId);
            
            // If token is present, login was successful (trusted device)
            if (data.token) {
                navigate('/');
            } else if (data.mfaType === 'totp_setup' || data.mfaType === 'totp_app') {
                navigate('/verify-totp', { state: { ...data } });
            } else if (data.userId) {
                navigate('/verify-otp', { state: { userId: data.userId, email: data.email } });
            }
        } catch (err) {
            if (!err.response) {
                setError('Unable to connect to server. Please try again later.');
            } else {
                setError(err.response.data?.message || 'Login failed');
            }
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <h2>Login</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="input-group">
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
            </form>
            <Link to="/register" className="link">Don't have an account? Register</Link>
        </div>
    );
};

export default Login;
