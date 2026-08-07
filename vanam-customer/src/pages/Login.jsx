import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { sendOtp, verifyOtp, getDevLoginAvailability, devLogin } from "../api/authApi";
import { useAuth } from "./AuthContext";
import "../css/Login.css";
import BRAND from "../config/brand";

export default function Login() {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("+91");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [devRoles, setDevRoles] = useState([]); // populated only in dev mode

  const navigate = useNavigate();
  const { login } = useAuth();

  // Ask the backend whether dev-login is enabled (it 404s in production).
  useEffect(() => {
    let active = true;
    getDevLoginAvailability().then((info) => {
      if (active && info?.enabled) setDevRoles(info.roles || []);
    });
    return () => { active = false; };
  }, []);

  const handleDevLogin = async (role) => {
    setError(""); setLoading(true);
    try {
      const data = await devLogin(role);
      login(data.token, data.user);
      navigate("/", { replace: true });
    } catch {
      setError("Demo login failed. Have you run `npm run seed`?");
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (e) => {
    let digits = e.target.value.replace(/\D/g, "");
    if (digits.startsWith("91")) digits = digits.slice(2);
    digits = digits.slice(0, 10);
    setPhone("+91" + digits);
  };

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    const prevTitle = document.title;
    document.title = 'Login - Vanam';
    return () => {
      document.head.removeChild(meta);
      document.title = prevTitle;
    };
  }, []);

  const sendOtpHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await sendOtp(phone);
      setStep(2);
    } catch {
      setError("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await verifyOtp(phone, otp);
      login(data.token, data.user);
      navigate("/", { replace: true });
    } catch {
      setError("Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setError("");
    setLoading(true);
    try {
      await sendOtp(phone);
    } catch {
      setError('Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const editNumber = () => {
    setStep(1);
    setOtp('');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="brand-panel">
          <div className="brand-logo">{BRAND.name}</div>
          <div className="brand-sub">Login to continue</div>
        </div>

        <div className="form-panel">
          <h2 className="title">Sign in to your account</h2>
          <p className="subtitle">Fast, secure login with phone OTP</p>

          {error && <div className="error">{error}</div>}

          <div id="recaptcha-container" />

          {step === 1 && (
            <form className="login-form" onSubmit={sendOtpHandler}>
              <label className="input-label" htmlFor="phone">Phone number</label>
              <div className="phone-row">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="input"
                  placeholder="+91XXXXXXXXXX"
                  value={phone}
                  onChange={handlePhoneChange}
                  required
                />
              </div>

              <div className="form-actions">
                <button className="btn primary" type="submit" disabled={loading}>
                  {loading ? 'Sending...' : 'Send OTP'}
                </button>
              </div>

              <p style={{ marginTop: '1rem' }}>
                Don't have an account? <Link to="/signup">Sign up here</Link>
              </p>

              {devRoles.length > 0 && (
                <div className="vn-demo-login">
                  <span className="vn-demo-login__label">Development demo access</span>
                  <div className="vn-demo-login__buttons">
                    {devRoles.map((role) => (
                      <button
                        key={role}
                        type="button"
                        className="vn-btn vn-btn--ghost"
                        disabled={loading}
                        onClick={() => handleDevLogin(role)}
                      >
                        Use Demo {role.charAt(0).toUpperCase() + role.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>
          )}

          {step === 2 && (
            <form className="login-form" onSubmit={verifyOtpHandler}>
              <label className="input-label" htmlFor="otp">Enter OTP</label>
              <input
                id="otp"
                type="text"
                name="otp"
                className="input"
                placeholder="6-digit code"
                value={otp}
                onChange={(e) => { setOtp(e.target.value); setError(''); }}
                required
                maxLength={6}
              />

              <div className="form-actions">
                <button className="btn primary" type="submit" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>

              <div style={{ display: 'flex', marginTop: '0.6rem' }}>
                <button type="button" className="btn ghost" onClick={editNumber}>
                  Edit number
                </button>
                <button className="link" type="button" onClick={resendOtp}>Resend OTP</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
