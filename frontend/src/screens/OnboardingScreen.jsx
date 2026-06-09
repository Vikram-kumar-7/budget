import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const C = {
    bg: '#0A0E19', surf: '#111827', surf2: '#1A2235',
    bdr: 'rgba(255,255,255,0.07)', text: '#E8F0FE', muted: '#5A6A88',
    green: '#10E8A0', blue: '#4C9AFF', violet: '#A78BFA',
    gold: '#FFB020', red: '#FF5A6A'
};

const AVATARS = ['🧑‍💻', '👩‍💼', '🧔', '👩‍🎓', '🧑‍🎨', '👨‍🚀', '👩‍🔬', '🦸'];
const AVATAR_IDS = ['avatar_1', 'avatar_2', 'avatar_3', 'avatar_4', 'avatar_5', 'avatar_6', 'avatar_7', 'avatar_8'];

function Logo({ sz = 32 }) {
    return (
        <svg width={sz} height={sz} viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="bmg-o" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#10E8A0" /><stop offset="100%" stopColor="#4C9AFF" />
                </linearGradient>
            </defs>
            <rect x="5" y="5" width="6" height="30" rx="3" fill="url(#bmg-o)" />
            <rect x="8" y="5" width="13" height="4" rx="2" fill="url(#bmg-o)" />
            <rect x="8" y="17" width="13" height="4" rx="2" fill="url(#bmg-o)" />
            <rect x="8" y="31" width="13" height="4" rx="2" fill="url(#bmg-o)" />
            <rect x="19" y="5" width="5" height="16" rx="2.5" fill="url(#bmg-o)" />
            <rect x="19" y="17" width="7" height="18" rx="3.5" fill="url(#bmg-o)" />
            <rect x="27" y="26" width="3.5" height="9" rx="1.75" fill="#10E8A0" opacity=".9" />
            <rect x="32" y="19" width="3.5" height="16" rx="1.75" fill="#4C9AFF" opacity=".85" />
            <circle cx="34" cy="8" r="5" fill="#FFB020" />
            <text x="34" y="11.5" textAnchor="middle" fontSize="7" fontWeight="700" fontFamily="Outfit,sans-serif" fill="#0A0E19">₹</text>
        </svg>
    );
}

const inp = {
    width: '100%', padding: '14px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: `1px solid rgba(255,255,255,0.1)`,
    borderRadius: 12, color: '#E8F0FE',
    fontFamily: 'Outfit,sans-serif', fontSize: 15,
    outline: 'none', boxSizing: 'border-box'
};

export default function OnboardingScreen({ onGoToLogin }) {
    const { login } = useAuth();
    const [step, setStep] = useState(1);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Step 1 — Personal Info
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [income, setIncome] = useState('');

    // Step 2 — Email
    const [email, setEmail] = useState('');
    const [otpSent, setOtpSent] = useState(false);

    // Step 3 — OTP
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [devOtp, setDevOtp] = useState('');
    const otpRefs = useRef([]);

    // Step 4 — Avatar
    const [avatar, setAvatar] = useState('avatar_1');

    // Step 5 — Password
    const [password, setPassword] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [showPw, setShowPw] = useState(false);

    const clearError = () => setError('');

    // ── Step 1: Validate and advance ──────────────────────────────
    const handleStep1 = () => {
        clearError();
        if (!name.trim()) { setError('Please enter your full name'); return; }
        if (!age || Number(age) < 10 || Number(age) > 120) { setError('Please enter a valid age'); return; }
        if (!income || Number(income) < 0) { setError('Please enter your monthly income'); return; }
        setStep(2);
    };

    // ── Step 2: Send OTP ───────────────────────────────────────────
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const handleSendOtp = async () => {
        clearError();
        if (!emailRegex.test(email)) { setError('Please enter a valid email address'); return; }
        setLoading(true);
        try {
            const res = await api.post('/auth/send-otp', { email });
            setOtpSent(true);
            setStep(3);
            if (res.otp) {
                setOtp(res.otp.split(''));
                setDevOtp(res.otp);
            } else {
                setDevOtp('');
            }
        } catch (err) {
            setError(err.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    // ── Step 3: OTP input handling ─────────────────────────────────
    const handleOtpChange = (idx, val) => {
        if (!/^\d?$/.test(val)) return;
        const next = [...otp];
        next[idx] = val;
        setOtp(next);
        if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
    };

    const handleOtpKeyDown = (idx, e) => {
        if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
    };

    const handleVerifyOtp = async () => {
        clearError();
        const code = otp.join('');
        if (code.length < 6) { setError('Please enter the complete 6-digit OTP'); return; }
        setLoading(true);
        try {
            const res = await api.post('/auth/verify-otp', { email, otp: code });
            if (res.success) setStep(4);
            else setError(res.message || 'Invalid OTP');
        } catch (err) {
            setError(err.message || 'OTP verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        clearError();
        setLoading(true);
        try {
            const res = await api.post('/auth/send-otp', { email });
            if (res.otp) {
                setOtp(res.otp.split(''));
                setDevOtp(res.otp);
            } else {
                setOtp(['', '', '', '', '', '']);
                setDevOtp('');
            }
            otpRefs.current[0]?.focus();
        } catch (err) {
            setError('Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    // ── Step 4: Avatar ─────────────────────────────────────────────
    const handleStep4 = () => {
        setStep(5);
    };

    // ── Step 5: Create Account ─────────────────────────────────────
    const handleRegister = async (e) => {
        e.preventDefault();
        clearError();
        if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
        if (password !== confirmPw) { setError('Passwords do not match'); return; }
        setLoading(true);
        try {
            const data = await api.post('/auth/register', {
                name: name.trim(),
                age: Number(age),
                monthlyIncome: Number(income),
                email: email.trim(),
                password,
                avatar,
            });
            login(data.token, data.user);
        } catch (err) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const TOTAL_STEPS = 5;
    const progress = (step / TOTAL_STEPS) * 100;

    return (
        <div className="bm-screen">
            <div className="bm-auth-card bm-fu">
                {/* Header */}
                <div className="bm-auth-logo" style={{ marginBottom: 8 }}>
                    <Logo sz={40} />
                    <h1 className="bm-auth-title" style={{ fontSize: 22, marginTop: 8 }}>Create Account</h1>
                </div>

                {/* Progress bar */}
                <div className="bm-onboard-progress">
                    <div className="bm-onboard-progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <div className="bm-onboard-step-label">Step {step} of {TOTAL_STEPS}</div>

                {/* ── Step 1: Personal Info ── */}
                {step === 1 && (
                    <div className="bm-fu">
                        <h2 className="bm-step-title">Tell us about yourself</h2>
                        <div className="bm-form-group">
                            <label className="bm-label">Full Name</label>
                            <input id="ob-name" style={inp} type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Vikram Kumar" autoFocus />
                        </div>
                        <div className="bm-form-group">
                            <label className="bm-label">Age</label>
                            <input id="ob-age" style={inp} type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 24" min="10" max="120" />
                        </div>
                        <div className="bm-form-group">
                            <label className="bm-label">Monthly Income (₹)</label>
                            <input id="ob-income" style={{ ...inp, paddingLeft: '36px' }} type="number" value={income} onChange={e => setIncome(e.target.value)} placeholder="e.g. 50000" min="0" />
                        </div>
                        {error && <div className="bm-error-msg">{error}</div>}
                        <button id="ob-step1-next" className="bm-btn-primary" onClick={handleStep1}>Continue →</button>
                    </div>
                )}

                {/* ── Step 2: Email ── */}
                {step === 2 && (
                    <div className="bm-fu">
                        <h2 className="bm-step-title">Enter your email</h2>
                        <p className="bm-step-desc">We'll send you a verification code</p>
                        <div className="bm-form-group">
                            <label className="bm-label">Gmail / Email Address</label>
                            <input id="ob-email" style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@gmail.com" autoFocus />
                        </div>
                        {error && <div className="bm-error-msg">{error}</div>}
                        <button id="ob-send-otp" className="bm-btn-primary" onClick={handleSendOtp} disabled={loading}>
                            {loading ? 'Sending…' : 'Send OTP'}
                        </button>
                        <button className="bm-btn-ghost" onClick={() => { clearError(); setStep(1); }}>← Back</button>
                    </div>
                )}

                {/* ── Step 3: OTP ── */}
                {step === 3 && (
                    <div className="bm-fu">
                        <h2 className="bm-step-title">Verify your email</h2>
                        <p className="bm-step-desc">Enter the 6-digit code sent to <strong style={{ color: C.green }}>{email}</strong></p>
                        {devOtp && (
                            <div style={{
                                fontSize: 13,
                                color: C.gold,
                                background: 'rgba(255,176,32,0.1)',
                                border: '1px solid rgba(255,176,32,0.2)',
                                padding: '10px 14px',
                                borderRadius: 12,
                                marginBottom: 16,
                                textAlign: 'center',
                                lineHeight: '1.4'
                            }}>
                                🛠️ <strong>Dev Mode:</strong> OTP auto-filled from response.
                            </div>
                        )}
                        <div className="bm-otp-grid">
                            {otp.map((d, i) => (
                                <input
                                    key={i}
                                    ref={el => otpRefs.current[i] = el}
                                    id={`otp-box-${i}`}
                                    className="bm-otp-box"
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={d}
                                    onChange={e => handleOtpChange(i, e.target.value)}
                                    onKeyDown={e => handleOtpKeyDown(i, e)}
                                    autoFocus={i === 0}
                                />
                            ))}
                        </div>
                        {error && <div className="bm-error-msg">{error}</div>}
                        <button id="ob-verify-otp" className="bm-btn-primary" onClick={handleVerifyOtp} disabled={loading}>
                            {loading ? 'Verifying…' : 'Verify OTP'}
                        </button>
                        <button className="bm-btn-ghost" onClick={handleResendOtp} disabled={loading}>Resend OTP</button>
                        <button className="bm-btn-ghost" onClick={() => { clearError(); setStep(2); }}>← Back</button>
                    </div>
                )}

                {/* ── Step 4: Avatar ── */}
                {step === 4 && (
                    <div className="bm-fu">
                        <h2 className="bm-step-title">Choose your avatar</h2>
                        <p className="bm-step-desc">Pick one that represents you</p>
                        <div className="bm-avatar-grid">
                            {AVATARS.map((em, i) => (
                                <button
                                    key={i}
                                    id={`avatar-${i}`}
                                    className={`bm-avatar-btn${avatar === AVATAR_IDS[i] ? ' selected' : ''}`}
                                    onClick={() => setAvatar(AVATAR_IDS[i])}
                                >
                                    {em}
                                    {avatar === AVATAR_IDS[i] && <span className="bm-avatar-check">✓</span>}
                                </button>
                            ))}
                        </div>
                        <button id="ob-step4-next" className="bm-btn-primary" onClick={handleStep4}>Continue →</button>
                    </div>
                )}

                {/* ── Step 5: Password ── */}
                {step === 5 && (
                    <div className="bm-fu">
                        <h2 className="bm-step-title">Create a password</h2>
                        <form onSubmit={handleRegister} noValidate>
                            <div className="bm-form-group">
                                <label className="bm-label">Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        id="ob-password"
                                        style={{ ...inp, paddingRight: 50 }}
                                        type={showPw ? 'text' : 'password'}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="Min. 6 characters"
                                        autoFocus
                                    />
                                    <button type="button" onClick={() => setShowPw(p => !p)}
                                        style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 18 }}>
                                        {showPw ? '🙈' : '👁️'}
                                    </button>
                                </div>
                            </div>
                            <div className="bm-form-group">
                                <label className="bm-label">Confirm Password</label>
                                <input
                                    id="ob-confirm-password"
                                    style={{ ...inp, borderColor: confirmPw && confirmPw !== password ? C.red : undefined }}
                                    type={showPw ? 'text' : 'password'}
                                    value={confirmPw}
                                    onChange={e => setConfirmPw(e.target.value)}
                                    placeholder="Re-enter password"
                                />
                            </div>
                            {error && <div className="bm-error-msg">{error}</div>}
                            <button id="ob-create-account" type="submit" className="bm-btn-primary" disabled={loading}>
                                {loading ? 'Creating account…' : '🎉 Create Account'}
                            </button>
                            <button type="button" className="bm-btn-ghost" onClick={() => { clearError(); setStep(4); }}>← Back</button>
                        </form>
                    </div>
                )}

                {/* Footer link */}
                {step === 1 && (
                    <div className="bm-auth-footer">
                        <span style={{ color: C.muted }}>Already have an account? </span>
                        <button onClick={onGoToLogin} className="bm-link-btn">Sign In</button>
                    </div>
                )}
            </div>
        </div>
    );
}
