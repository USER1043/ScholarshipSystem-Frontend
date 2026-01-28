import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const OTPVerify = () => {
    const { verifyOtp, resendOtp } = useContext(AuthContext);
    const [otp, setOtp] = useState('');
    const [trustDevice, setTrustDevice] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [timer, setTimer] = useState(30);
    const [canResend, setCanResend] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    
    // Get userId from navigation state
    const { userId, email } = location.state || {};

    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else {
            setCanResend(true);
        }
        return () => clearInterval(interval);
    }, [timer]);

    if (!userId) {
        // Fallback or redirect if accessed directly without state
        return <div className="card"><p>Invalid Session. Please Login again.</p></div>;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        try {
            await verifyOtp(userId, otp, trustDevice);
            // Redirect based on role? Or just to home which will redirect
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'OTP Verification failed');
        }
    };

    const handleResend = async () => {
        setError('');
        setMessage('');
        try {
            await resendOtp(userId);
            setTimer(30);
            setCanResend(false);
            setMessage('New OTP sent to your email.');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend OTP');
        }
    };

    return (
        <div className="card">
            <h2>Multi-Factor Authentication</h2>
            <p>An OTP has been sent to {email}</p>
            {message && <p style={{ color: 'green' }}>{message}</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <input
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                    />
                </div>
                <div style={{ marginBottom: '0.5rem', display: 'flex',justifyContent: 'left'}}>
                    <label style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem' }}>
                        <input 
                            style={{width: '1rem'}}
                            type="checkbox" 
                            checked={trustDevice} 
                            onChange={(e) => setTrustDevice(e.target.checked)} 
                        />
                        Trust this device for 14 days
                    </label>
                </div>
                <button type="submit">Verify OTP</button>
            </form>
            
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <button 
                    onClick={handleResend} 
                    disabled={!canResend}
                    style={{ 
                        backgroundColor: canResend ? 'var(--primary)' : '#ccc',
                        cursor: canResend ? 'pointer' : 'not-allowed'
                    }}
                >
                    {canResend ? 'Resend OTP' : `Resend OTP in ${timer}s`}
                </button>
            </div>
        </div>
    );
};

export default OTPVerify;
