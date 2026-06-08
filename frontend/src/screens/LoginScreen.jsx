import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const C = {
    bg: '#0A0E19', surf: '#111827', surf2: '#1A2235',
    bdr: 'rgba(255,255,255,0.07)', text: '#E8F0FE', muted: '#5A6A88',
    green: '#10E8A0', blue: '#4C9AFF', violet: '#A78BFA',
    gold: '#FFB020', red: '#FF5A6A'
};

function Logo({ sz = 32 }) {
    return (
        <svg width={sz} height={sz} viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="bmg-l" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#10E8A0" /><stop offset="100%" stopColor="#4C9AFF" />
                </linearGradient>
            </defs>
            <rect x="5" y="5" width="6" height="30" rx="3" fill="url(#bmg-l)" />
            <rect x="8" y="5" width="13" height="4" rx="2" fill="url(#bmg-l)" />
            <rect x="8" y="17" width="13" height="4" rx="2" fill="url(#bmg-l)" />
            <rect x="8" y="31" width="13" height="4" rx="2" fill="url(#bmg-l)" />
            <rect x="19" y="5" width="5" height="16" rx="2.5" fill="url(#bmg-l)" />
            <rect x="19" y="17" width="7" height="18" rx="3.5" fill="url(#bmg-l)" />
            <rect x="27" y="26" width="3.5" height="9" rx="1.75" fill="#10E8A0" opacity=".9" />
            <rect x="32" y="19" width="3.5" height="16" rx="1.75" fill="#4C9AFF" opacity=".85" />
            <circle cx="34" cy="8" r="5" fill="#FFB020" />
            <text x="34" y="11.5" textAnchor="middle" fontSize="7" fontWeight="700" fontFamily="Outfit,sans-serif" fill="#0A0E19">₹</text>
        </svg>
    );
}

export default function LoginScreen({ onGoToRegister }) {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const inp = {
        width: '100%', padding: '14px 16px',
        background: 'rgba(255,255,255,0.05)',
        border: `1px solid rgba(255,255,255,0.1)`,
        borderRadius: 12, color: C.text,
        fontFamily: 'Outfit,sans-serif', fontSize: 15,
        outline: 'none', boxSizing: 'border-box',
        transition: 'border-color 0.2s'
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        if (!email.trim() || !password) { setError('Please fill in all fields'); return; }
        setLoading(true);
        try {
            const data = await api.post('/auth/login', { email: email.trim(), password });
            login(data.token, data.user);
        } catch (err) {
            setError(err.message || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bm-screen">
            <div className="bm-auth-card bm-fu">
                <div className="bm-auth-logo">
                    <Logo sz={52} />
                    <h1 className="bm-auth-title">BudgetMaster</h1>
                    <p className="bm-auth-subtitle">Your personal finance companion</p>
                </div>

                <form onSubmit={handleLogin} noValidate>
                    <div className="bm-form-group">
                        <label className="bm-label">Email Address</label>
                        <input
                            id="login-email"
                            style={inp}
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            autoComplete="email"
                            autoFocus
                        />
                    </div>
                    <div className="bm-form-group">
                        <label className="bm-label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                id="login-password"
                                style={{ ...inp, paddingRight: 50 }}
                                type={showPw ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPw(p => !p)}
                                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 18, lineHeight: 1 }}
                            >
                                {showPw ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    {error && <div className="bm-error-msg">{error}</div>}

                    <button id="login-btn" type="submit" className="bm-btn-primary" disabled={loading}>
                        {loading ? 'Signing in…' : 'Sign In'}
                    </button>
                </form>

                <div className="bm-auth-footer">
                    <span style={{ color: C.muted }}>Don't have an account? </span>
                    <button onClick={onGoToRegister} className="bm-link-btn">Create Account</button>
                </div>
            </div>
        </div>
    );
}
