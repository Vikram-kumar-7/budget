import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const C = {
    bg: '#0A0E19', surf: '#111827', surf2: '#1A2235',
    bdr: 'rgba(255,255,255,0.07)', text: '#E8F0FE', muted: '#5A6A88',
    green: '#10E8A0', blue: '#4C9AFF', red: '#FF5A6A'
};

const AVATARS = ['🧑‍💻', '👩‍💼', '🧔', '👩‍🎓', '🧑‍🎨', '👨‍🚀', '👩‍🔬', '🦸'];
const AVATAR_IDS = ['avatar_1', 'avatar_2', 'avatar_3', 'avatar_4', 'avatar_5', 'avatar_6', 'avatar_7', 'avatar_8'];

const getAvatarEmoji = (avatarId) => {
    const idx = AVATAR_IDS.indexOf(avatarId);
    return idx >= 0 ? AVATARS[idx] : '🧑‍💻';
};

const inp = {
    width: '100%', padding: '13px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: `1px solid rgba(255,255,255,0.1)`,
    borderRadius: 12, color: '#E8F0FE',
    fontFamily: 'Outfit,sans-serif', fontSize: 15,
    outline: 'none', boxSizing: 'border-box',
    marginBottom: 0
};

function Section({ title, children }) {
    return (
        <div className="bm-settings-section">
            <div className="bm-settings-section-title">{title}</div>
            <div className="bm-settings-card">{children}</div>
        </div>
    );
}

function Toggle({ id, label, checked, onChange }) {
    return (
        <div className="bm-settings-toggle-row">
            <span className="bm-settings-toggle-label">{label}</span>
            <button
                id={id}
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`bm-toggle${checked ? ' on' : ''}`}
            >
                <span className="bm-toggle-knob" />
            </button>
        </div>
    );
}

export default function SettingsScreen({ onBack }) {
    const { user, logout, updateUser } = useAuth();

    // Change Name
    const [newName, setNewName] = useState(user?.name || '');
    const [nameMsg, setNameMsg] = useState('');
    const [nameLoading, setNameLoading] = useState(false);

    // Change Password
    const [currentPw, setCurrentPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmNewPw, setConfirmNewPw] = useState('');
    const [pwMsg, setPwMsg] = useState('');
    const [pwError, setPwError] = useState('');
    const [pwLoading, setPwLoading] = useState(false);

    // Preferences (localStorage only)
    const [notifications, setNotifications] = useState(() => localStorage.getItem('bm_notifications') === 'true');
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('bm_darkmode') !== 'false');

    const handleSaveName = async () => {
        if (!newName.trim()) { setNameMsg('error:Name cannot be empty'); return; }
        setNameLoading(true);
        setNameMsg('');
        try {
            const res = await api.request('/auth/update-profile', { method: 'PATCH', body: JSON.stringify({ name: newName.trim() }) });
            updateUser({ name: res.user.name });
            setNameMsg('success:Name updated successfully!');
        } catch (err) {
            setNameMsg(`error:${err.message}`);
        } finally {
            setNameLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPwMsg(''); setPwError('');
        if (!currentPw || !newPw || !confirmNewPw) { setPwError('Please fill in all fields'); return; }
        if (newPw.length < 6) { setPwError('New password must be at least 6 characters'); return; }
        if (newPw !== confirmNewPw) { setPwError('New passwords do not match'); return; }
        setPwLoading(true);
        try {
            await api.post('/auth/change-password', { currentPassword: currentPw, newPassword: newPw });
            setPwMsg('Password updated successfully!');
            setCurrentPw(''); setNewPw(''); setConfirmNewPw('');
        } catch (err) {
            setPwError(err.message || 'Failed to update password');
        } finally {
            setPwLoading(false);
        }
    };

    const handleToggleNotifications = (val) => {
        setNotifications(val);
        localStorage.setItem('bm_notifications', val);
    };

    const handleToggleDarkMode = (val) => {
        setDarkMode(val);
        localStorage.setItem('bm_darkmode', val);
    };

    const nameMsgIsError = nameMsg.startsWith('error:');
    const nameMsgText = nameMsg.replace(/^(error:|success:)/, '');

    return (
        <div className="bm-settings-screen" style={{ paddingBottom: 100 }}>
            {/* Header */}
            <div className="bm-settings-header">
                <button id="settings-back-btn" onClick={onBack} className="bm-back-btn">
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                        <path d="M14 5l-6 6 6 6" stroke={C.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <span className="bm-settings-title">Settings</span>
                <span style={{ width: 36 }} />
            </div>

            {/* Profile Card */}
            <Section title="Profile">
                <div className="bm-profile-card">
                    <div className="bm-profile-avatar">{getAvatarEmoji(user?.avatar)}</div>
                    <div>
                        <div className="bm-profile-name">{user?.name}</div>
                        <div className="bm-profile-email">{user?.email}</div>
                        {user?.monthlyIncome > 0 && (
                            <div className="bm-profile-income">Monthly Income: ₹{Number(user.monthlyIncome).toLocaleString('en-IN')}</div>
                        )}
                    </div>
                </div>
            </Section>

            {/* Change Username */}
            <Section title="Change Name">
                <div className="bm-form-group">
                    <label className="bm-label">New Name</label>
                    <input
                        id="settings-name-input"
                        style={inp}
                        type="text"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder="Enter new name"
                    />
                </div>
                {nameMsgText && (
                    <div className={nameMsgIsError ? 'bm-error-msg' : 'bm-success-msg'} style={{ marginTop: 8 }}>
                        {nameMsgText}
                    </div>
                )}
                <button id="settings-save-name" className="bm-btn-primary" onClick={handleSaveName} disabled={nameLoading} style={{ marginTop: 14 }}>
                    {nameLoading ? 'Saving…' : 'Save Name'}
                </button>
            </Section>

            {/* Change Password */}
            <Section title="Change Password">
                <form onSubmit={handleChangePassword} noValidate>
                    <div className="bm-form-group">
                        <label className="bm-label">Current Password</label>
                        <input id="settings-current-pw" style={inp} type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="Enter current password" />
                    </div>
                    <div className="bm-form-group" style={{ marginTop: 12 }}>
                        <label className="bm-label">New Password</label>
                        <input id="settings-new-pw" style={inp} type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min. 6 characters" />
                    </div>
                    <div className="bm-form-group" style={{ marginTop: 12 }}>
                        <label className="bm-label">Confirm New Password</label>
                        <input id="settings-confirm-pw" style={inp} type="password" value={confirmNewPw} onChange={e => setConfirmNewPw(e.target.value)} placeholder="Re-enter new password" />
                    </div>
                    {pwError && <div className="bm-error-msg" style={{ marginTop: 8 }}>{pwError}</div>}
                    {pwMsg && <div className="bm-success-msg" style={{ marginTop: 8 }}>{pwMsg}</div>}
                    <button id="settings-update-pw" type="submit" className="bm-btn-primary" disabled={pwLoading} style={{ marginTop: 14 }}>
                        {pwLoading ? 'Updating…' : 'Update Password'}
                    </button>
                </form>
            </Section>

            {/* Preferences */}
            <Section title="Preferences">
                <Toggle id="pref-notifications" label="Enable Notifications" checked={notifications} onChange={handleToggleNotifications} />
                <div style={{ height: 1, background: C.bdr, margin: '8px 0' }} />
                <Toggle id="pref-darkmode" label="Dark Mode" checked={darkMode} onChange={handleToggleDarkMode} />
            </Section>

            {/* About */}
            <Section title="About">
                <div className="bm-settings-about-row">
                    <span>App Name</span><span>BudgetMaster</span>
                </div>
                <div style={{ height: 1, background: C.bdr, margin: '8px 0' }} />
                <div className="bm-settings-about-row">
                    <span>Version</span><span style={{ color: C.green }}>2.0.0</span>
                </div>
                <div style={{ height: 1, background: C.bdr, margin: '8px 0' }} />
                <div className="bm-settings-about-row">
                    <span>Stack</span><span>React 19 · Express · MongoDB</span>
                </div>
            </Section>

            {/* Logout */}
            <Section title="Account">
                <button id="settings-logout-btn" className="bm-btn-danger" onClick={logout}>
                    Sign Out
                </button>
            </Section>
        </div>
    );
}
