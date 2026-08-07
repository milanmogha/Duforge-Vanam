// src/pages/Signup.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { sendOtp as apiSendOtp, verifyOtp as apiVerifyOtp } from '../api/authApi';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import '../css/Login.css';
import BRAND from '../config/brand';

const Signup = () => {
  const [step, setStep] = useState(1);
  // Default to +91 for India
  const [form, setForm] = useState({ name: '', email: '', phone: '+91' });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Prevent Google indexing of signup page
  useEffect(() => {
    // Add noindex meta tag
    const metaRobots = document.createElement('meta');
    metaRobots.name = 'robots';
    metaRobots.content = 'noindex, nofollow';
    document.head.appendChild(metaRobots);

    // Update page title
    const originalTitle = document.title;
    document.title = 'Sign Up - Vanam';

    return () => {
      // Cleanup on unmount
      document.head.removeChild(metaRobots);
      document.title = originalTitle;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setError('');

    if (name === 'phone') {
      // 1. Remove non-numeric characters
      let digits = value.replace(/\D/g, '');
      
      // 2. If user tries to type 91 manually at start, strip it (so we don't get +9191...)
      if (digits.startsWith('91')) {
        digits = digits.slice(2);
      }
      
      // 3. Limit to 10 digits (Standard Indian Mobile Number)
      digits = digits.slice(0, 10);
      
      // 4. Always prepend +91
      setForm(f => ({ ...f, phone: '+91' + digits }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  // Step 1: Send OTP
  const sendOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');

    if (form.phone.length < 13) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);
    try {
      // Send full signup details so backend can persist the name/email
      const response = await apiSendOtp(form);
      const data = response.data || {};
      if (data.success) {
        setStep(2); // Move to OTP verification step
      } else {
        setError(data.message || 'Failed to send OTP.');
      }
    } catch (err) {
      setError('Error sending OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const verifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Verify OTP with centralized authApi and receive JWT
      const { data } = await apiVerifyOtp(form.phone, otp);
      if (data && data.token) {
        // Persist and notify AuthContext
        localStorage.setItem('token', data.token);
        if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
        try {
          if (typeof login === 'function') login(data.token, data.user);
        } catch (e) {
          // ignore
        }
        navigate('/', { replace: true });
      } else {
        setError(data.message || 'Invalid OTP.');
      }
    } catch (err) {
      console.error("Verify Error:", err);
      setError(err.response?.data?.message || 'Invalid OTP. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setOtp('');
    await sendOtp();
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <aside className="brand-panel">
          <div className="brand-logo">{BRAND.name}</div>
          <p className="brand-sub">Beautiful furniture. Delivered.</p>
        </aside>

        <main className="form-panel">
          <h2 className="title">Create your account</h2>
          <p className="subtitle">Sign up quickly using your phone number</p>

          {error && <div className="error">{error}</div>}

          {/* OTP will be sent via SMS — server-side rate limiting applies */}

          {step === 1 && (
            <form className="login-form" onSubmit={sendOtp}>
              <label className="input-label" htmlFor="name">Full name</label>
              <input id="name" name="name" className="input" placeholder="Full Name" value={form.name} onChange={handleChange} required />

              <label className="input-label" htmlFor="email">Email address</label>
              <input id="email" name="email" type="email" className="input" placeholder="Email Address" value={form.email} onChange={handleChange} required />

              <label className="input-label" htmlFor="phone">Phone number</label>
              <div className="phone-row">
                <input 
                    id="phone" 
                    name="phone" 
                    type="tel" 
                    className="input" 
                    placeholder="+91 99999 99999" 
                    value={form.phone} 
                    onChange={handleChange} 
                    maxLength={13} // +91 (3) + 10 digits = 13
                    required 
                />
              </div>

              <div className="form-actions">
                <button className="btn primary" type="submit" disabled={loading}>
                    {loading ? 'Sending OTP...' : 'Send OTP & Sign Up'}
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form className="login-form" onSubmit={verifyOtp}>
              <label className="input-label" htmlFor="otp">Enter OTP</label>
              <input id="otp" type="text" name="otp" className="input" placeholder="6-digit code" value={otp} onChange={e => setOtp(e.target.value)} required maxLength={6} />

              <div className="form-actions">
                <button className="btn primary" type="submit" disabled={loading}>
                    {loading ? 'Verifying...' : 'Verify OTP & Complete Signup'}
                </button>
              </div>

              <div style={{ display: 'flex', marginTop: '0.6rem' }}>
                <button type="button" className="btn ghost" onClick={() => { setStep(1); setOtp(''); }}>Edit details</button>
                <button className="link" type="button" onClick={resendOtp}>Resend OTP</button>
              </div>
            </form>
          )}

          {step === 1 && (
            <p style={{ marginTop: '1rem' }}>
              Already have an account? <Link to="/login">Login here</Link>
            </p>
          )}
        </main>
      </div>
    </div>
  );
};

export default Signup;