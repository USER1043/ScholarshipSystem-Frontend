import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
    return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h1 style={{ fontSize: '4rem', color: '#e74c3c' }}>403</h1>
            <h2>Access Denied</h2>
            <p>You do not have sufficient privileges to access this resource.</p>
            <div style={{ fontSize: '3rem', margin: '20px' }}>🔒</div>
            <Link to="/" style={{ 
                display: 'inline-block', 
                marginTop: '20px', 
                padding: '10px 20px', 
                backgroundColor: '#1A5F7A', 
                color: 'white', 
                textDecoration: 'none', 
                borderRadius: '5px' 
            }}>
                Return to Home
            </Link>
        </div>
    );
};

export default Unauthorized;
