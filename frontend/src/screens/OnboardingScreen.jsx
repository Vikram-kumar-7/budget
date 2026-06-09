import { useState } from 'react';
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

    // Step 3 — Avatar
    const [avatar, setAvatar] = useState('avatar_1');

    // Step 4 — Password
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

    // ── Step 2: Validate email and advance ─────────────────────────
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const handleStep2 = () => {
        clearError();
        if (!emailRegex.test(email)) { setError('Please enter a valid email address'); return; }
        setStep(3);
    };

    // ── Step 3: Avatar ─────────────────────────────────────────────
    const handleStep3 = () => {
        setStep(4);
    };

    // ── Step 4: Create Account ─────────────────────────────────────
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

    const TOTAL_STEPS = 4;
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
                        <p className="bm-step-desc">Your email will be used to sign in</p>
                        <div className="bm-form-group">
                            <label className="bm-label">Email Address</label>
                            <input id="ob-email" style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@gmail.com" autoFocus />
                        </div>
                        {error && <div className="bm-error-msg">{error}</div>}
                        <button id="ob-step2-next" className="bm-btn-primary" onClick={handleStep2}>
                            Continue →
                        </button>
                        <button className="bm-btn-ghost" onClick={() => { clearError(); setStep(1); }}>← Back</button>
                    </div>
                )}

                {/* ── Step 3: Avatar ── */}
                {step === 3 && (
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
                        <button id="ob-step3-next" className="bm-btn-primary" onClick={handleStep3}>Continue →</button>
                        <button className="bm-btn-ghost" onClick={() => { clearError(); setStep(2); }}>← Back</button>
                    </div>
                )}

                {/* ── Step 4: Password ── */}
                {step === 4 && (
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
                            <button type="button" className="bm-btn-ghost" onClick={() => { clearError(); setStep(3); }}>← Back</button>
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
