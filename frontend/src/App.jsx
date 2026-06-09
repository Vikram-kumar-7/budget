import { useState, useEffect, useCallback } from "react"
import { AuthProvider, useAuth } from "./context/AuthContext"
import LoginScreen from "./screens/LoginScreen"
import OnboardingScreen from "./screens/OnboardingScreen"
import SettingsScreen from "./screens/SettingsScreen"
import { api } from "./services/api"

// ── Utilities ──────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9)
const fmt = n => Math.abs(Math.round(Number(n) || 0)).toLocaleString('en-IN')
const pct = (a, b) => b > 0 ? Math.min(100, Math.round((Number(a) / Number(b)) * 100)) : 0
const daysLeft = d => { if (!d) return null; return Math.ceil((new Date(d) - new Date()) / 86400000) }
const isOverdue = d => d && new Date(d) < new Date()

const CATS = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Health', 'Bills', 'Education', 'Salary', 'Freelance', 'Investment', 'Transfer', 'Other']
const ACC_COLORS = ['#4C9AFF', '#10E8A0', '#A78BFA', '#FFB020', '#FF5A6A', '#14B8A6', '#F97316', '#EC4899']
const ACC_ICONS = ['🏦', '💵', '💳', '👛', '📈', '🏧', '💰', '🪙']
const GOAL_ICONS = ['💻', '✈️', '🏠', '🚗', '📱', '🎓', '🏋️', '💍', '🎮', '⌚', '🎸', '🌍']

const getbal = (acc, txs) => {
  const at = txs.filter(t => t.accId === acc._id || t.accId === acc.id)
  return (acc.ob || 0)
    + at.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
    - at.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
}

// ── Design Tokens ──────────────────────────────────────────────────
const C = { bg: '#0A0E19', surf: '#111827', surf2: '#1A2235', bdr: 'rgba(255,255,255,0.07)', text: '#E8F0FE', muted: '#5A6A88', green: '#10E8A0', blue: '#4C9AFF', violet: '#A78BFA', gold: '#FFB020', red: '#FF5A6A' }
const inp = { width: '100%', padding: '11px 13px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 11, color: C.text, fontFamily: 'Outfit,sans-serif', fontSize: 14, outline: 'none', marginBottom: 10, boxSizing: 'border-box' }
const gbtn = (c, fill = true, mb = 8) => ({ width: '100%', padding: '13px', background: fill ? c : `${c}18`, border: `1px solid ${fill ? c : `${c}30`}`, borderRadius: 13, color: fill ? '#0A0E19' : c, fontSize: 14, fontWeight: 600, fontFamily: 'Outfit,sans-serif', cursor: 'pointer', marginBottom: mb, display: 'block' })

// ── Global CSS ─────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');
*, *::before, *::after { box-sizing: border-box; }
html, body, #root { margin: 0; padding: 0; width: 100%; min-height: 100vh; }
@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
@keyframes fadeUp { from { opacity:0;transform:translateY(12px) } to { opacity:1;transform:translateY(0) } }
@keyframes prgFill { from { width: 0 } }
@keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
@keyframes scaleIn { from { opacity:0;transform:scale(0.93) } to { opacity:1;transform:scale(1) } }
@keyframes slideUp { from { opacity:0;transform:translateY(40px) } to { opacity:1;transform:translateY(0) } }
.bm-fu { animation: fadeUp 0.35s ease both }
.bm-prg { animation: prgFill 0.9s ease both }
.bm-spin { animation: spin 3s linear infinite; transform-origin: 34px 8px }
::-webkit-scrollbar { display:none }
input, select, textarea { color: #E8F0FE !important; }
input::placeholder, textarea::placeholder { color: #5A6A88 !important; }
option { background: #111827; }
input[type=range] { accent-color: #10E8A0; }

/* Auth/Onboarding screens */
.bm-screen { min-height: 100vh; width: 100%; background: linear-gradient(160deg,#0D1824,#0A0E19 55%,#0A1A10); display: flex; align-items: center; justify-content: center; padding: 24px 16px; font-family: Outfit,sans-serif; }
.bm-auth-card { width: 100%; max-width: 420px; background: #111827; border-radius: 24px; border: 1px solid rgba(255,255,255,0.07); padding: 32px 28px; }
.bm-auth-logo { display: flex; flex-direction: column; align-items: center; gap: 10px; margin-bottom: 28px; }
.bm-auth-title { font-size: 26px; font-weight: 700; color: #E8F0FE; margin: 0; text-align: center; }
.bm-auth-subtitle { font-size: 13px; color: #5A6A88; margin: 0; text-align: center; }
.bm-auth-footer { text-align: center; margin-top: 20px; font-size: 13px; font-family: Outfit,sans-serif; }
.bm-form-group { margin-bottom: 14px; }
.bm-label { display: block; font-size: 12px; color: #5A6A88; margin-bottom: 6px; padding-left: 2px; font-family: Outfit,sans-serif; }
.bm-error-msg { font-size: 12px; color: #FF5A6A; margin-bottom: 10px; padding: 8px 12px; background: rgba(255,90,106,0.08); border-radius: 8px; border: 1px solid rgba(255,90,106,0.2); }
.bm-success-msg { font-size: 12px; color: #10E8A0; margin-bottom: 10px; padding: 8px 12px; background: rgba(16,232,160,0.08); border-radius: 8px; border: 1px solid rgba(16,232,160,0.2); }
.bm-btn-primary { width: 100%; padding: 14px; background: #10E8A0; border: none; border-radius: 13px; color: #0A0E19; font-size: 15px; font-weight: 700; font-family: Outfit,sans-serif; cursor: pointer; margin-bottom: 10px; transition: opacity 0.2s, transform 0.1s; }
.bm-btn-primary:hover { opacity: 0.9; }
.bm-btn-primary:active { transform: scale(0.98); }
.bm-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.bm-btn-ghost { width: 100%; padding: 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 13px; color: #5A6A88; font-size: 14px; font-weight: 600; font-family: Outfit,sans-serif; cursor: pointer; margin-bottom: 8px; transition: background 0.2s; }
.bm-btn-ghost:hover { background: rgba(255,255,255,0.07); }
.bm-btn-danger { width: 100%; padding: 14px; background: rgba(255,90,106,0.12); border: 1px solid rgba(255,90,106,0.3); border-radius: 13px; color: #FF5A6A; font-size: 15px; font-weight: 700; font-family: Outfit,sans-serif; cursor: pointer; transition: background 0.2s; }
.bm-btn-danger:hover { background: rgba(255,90,106,0.2); }
.bm-link-btn { background: none; border: none; color: #10E8A0; font-size: 13px; font-weight: 600; cursor: pointer; font-family: Outfit,sans-serif; padding: 0; }

/* Onboarding specifics */
.bm-onboard-progress { height: 4px; background: rgba(255,255,255,0.07); border-radius: 4px; margin-bottom: 6px; overflow: hidden; }
.bm-onboard-progress-fill { height: 100%; background: linear-gradient(90deg,#10E8A0,#4C9AFF); border-radius: 4px; transition: width 0.4s ease; }
.bm-onboard-step-label { font-size: 11px; color: #5A6A88; text-align: right; margin-bottom: 20px; font-family: Outfit,sans-serif; }
.bm-step-title { font-size: 20px; font-weight: 700; color: #E8F0FE; margin: 0 0 6px; font-family: Outfit,sans-serif; }
.bm-step-desc { font-size: 13px; color: #5A6A88; margin: 0 0 20px; font-family: Outfit,sans-serif; }
.bm-otp-grid { display: flex; gap: 10px; justify-content: center; margin-bottom: 20px; }
.bm-otp-box { width: 46px; height: 56px; border-radius: 12px; background: rgba(255,255,255,0.05); border: 2px solid rgba(255,255,255,0.12); color: #E8F0FE; font-size: 22px; font-weight: 700; text-align: center; font-family: Outfit,sans-serif; outline: none; transition: border-color 0.2s; }
.bm-otp-box:focus { border-color: #10E8A0; }
.bm-avatar-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 20px; }
.bm-avatar-btn { position: relative; width: 100%; aspect-ratio: 1; border-radius: 16px; background: rgba(255,255,255,0.04); border: 2px solid rgba(255,255,255,0.08); font-size: 28px; cursor: pointer; transition: all 0.18s; display: flex; align-items: center; justify-content: center; }
.bm-avatar-btn.selected { background: rgba(16,232,160,0.12); border-color: #10E8A0; }
.bm-avatar-check { position: absolute; top: 4px; right: 4px; font-size: 11px; color: #10E8A0; font-weight: 700; }

/* Settings Screen */
.bm-settings-screen { min-height: 100vh; width: 100%; background: #0A0E19; font-family: Outfit,sans-serif; color: #E8F0FE; overflow-y: auto; }
.bm-settings-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); position: sticky; top: 0; background: rgba(10,14,25,0.95); backdrop-filter: blur(12px); z-index: 10; }
.bm-settings-title { font-size: 18px; font-weight: 700; }
.bm-back-btn { background: none; border: none; cursor: pointer; padding: 6px; display: flex; align-items: center; border-radius: 8px; }
.bm-settings-section { padding: 0 16px; margin-top: 20px; }
.bm-settings-section-title { font-size: 11px; font-weight: 600; color: #5A6A88; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; padding-left: 4px; }
.bm-settings-card { background: #111827; border-radius: 16px; border: 1px solid rgba(255,255,255,0.07); padding: 16px; }
.bm-profile-card { display: flex; align-items: center; gap: 14px; }
.bm-profile-avatar { font-size: 42px; width: 60px; height: 60px; border-radius: 18px; background: rgba(16,232,160,0.1); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.bm-profile-name { font-size: 17px; font-weight: 700; margin-bottom: 2px; }
.bm-profile-email { font-size: 12px; color: #5A6A88; margin-bottom: 2px; }
.bm-profile-income { font-size: 12px; color: #10E8A0; font-weight: 600; }
.bm-settings-toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 4px 0; }
.bm-settings-toggle-label { font-size: 14px; font-weight: 500; }
.bm-toggle { width: 48px; height: 28px; border-radius: 14px; background: rgba(255,255,255,0.1); border: none; cursor: pointer; position: relative; transition: background 0.2s; padding: 0; }
.bm-toggle.on { background: #10E8A0; }
.bm-toggle-knob { position: absolute; top: 4px; left: 4px; width: 20px; height: 20px; border-radius: 50%; background: white; transition: transform 0.2s; display: block; }
.bm-toggle.on .bm-toggle-knob { transform: translateX(20px); }
.bm-settings-about-row { display: flex; justify-content: space-between; font-size: 14px; padding: 4px 0; color: #E8F0FE; }
.bm-settings-about-row span:first-child { color: #5A6A88; }

/* Account guard modal */
.bm-guard-overlay { position: fixed; inset: 0; background: rgba(10,14,25,0.88); display: flex; align-items: center; justify-content: center; z-index: 400; padding: 24px; }
.bm-guard-modal { background: #111827; border-radius: 22px; border: 1px solid rgba(255,255,255,0.08); padding: 28px 24px; width: 100%; max-width: 360px; animation: scaleIn 0.22s ease; text-align: center; }
.bm-guard-icon { font-size: 40px; margin-bottom: 14px; }
.bm-guard-title { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
.bm-guard-body { font-size: 13px; color: #5A6A88; line-height: 1.6; margin-bottom: 20px; }

/* Empty states */
.bm-empty { text-align: center; padding: 48px 16px; }
.bm-empty-icon { font-size: 42px; margin-bottom: 12px; }
.bm-empty-msg { font-size: 15px; font-weight: 600; color: #E8F0FE; margin-bottom: 6px; }
.bm-empty-sub { font-size: 13px; color: #5A6A88; margin-bottom: 20px; }

@media (max-width: 768px) {
  .bm-screen { padding: 16px 12px; align-items: flex-start; padding-top: 32px; }
  .bm-auth-card { padding: 24px 18px; border-radius: 20px; }
  .bm-avatar-grid { grid-template-columns: repeat(4,1fr); gap: 8px; }
}
`

// ── Logo ──────────────────────────────────────────────────────────
function Logo({ sz = 32, spin = false }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bmg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#10E8A0" /><stop offset="100%" stopColor="#4C9AFF" />
        </linearGradient>
      </defs>
      <rect x="5" y="5" width="6" height="30" rx="3" fill="url(#bmg)" />
      <rect x="8" y="5" width="13" height="4" rx="2" fill="url(#bmg)" />
      <rect x="8" y="17" width="13" height="4" rx="2" fill="url(#bmg)" />
      <rect x="8" y="31" width="13" height="4" rx="2" fill="url(#bmg)" />
      <rect x="19" y="5" width="5" height="16" rx="2.5" fill="url(#bmg)" />
      <rect x="19" y="17" width="7" height="18" rx="3.5" fill="url(#bmg)" />
      <rect x="27" y="26" width="3.5" height="9" rx="1.75" fill="#10E8A0" opacity=".9" />
      <rect x="32" y="19" width="3.5" height="16" rx="1.75" fill="#4C9AFF" opacity=".85" />
      <g className={spin ? 'bm-spin' : ''}>
        <circle cx="34" cy="8" r="5" fill="#FFB020" />
        <text x="34" y="11.5" textAnchor="middle" fontSize="7" fontWeight="700" fontFamily="Outfit,sans-serif" fill="#0A0E19">₹</text>
      </g>
    </svg>
  )
}

// ── Modal ──────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,14,25,0.88)', display: 'flex', alignItems: 'flex-end', zIndex: 300, fontFamily: 'Outfit,sans-serif' }}>
      <div style={{ width: '100%', background: C.surf, borderRadius: '22px 22px 0 0', padding: '20px 20px 36px', maxHeight: '90vh', overflowY: 'auto', animation: 'scaleIn 0.25s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: C.text }}>{title}</span>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: '50%', width: 34, height: 34, color: C.text, fontSize: 22, cursor: 'pointer', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Account Guard Modal ────────────────────────────────────────────
function AccountGuardModal({ onAddAccount, onClose }) {
  return (
    <div className="bm-guard-overlay">
      <div className="bm-guard-modal">
        <div className="bm-guard-icon">⚠️</div>
        <div className="bm-guard-title">No Account Linked</div>
        <div className="bm-guard-body">Please add a bank or cash account before making any transactions.</div>
        <button id="guard-add-account" className="bm-btn-primary" onClick={onAddAccount}>Add Account</button>
        <button id="guard-cancel" className="bm-btn-ghost" onClick={onClose}>Cancel</button>
      </div>
    </div>
  )
}

function Lbl({ t }) { return <div style={{ fontSize: 12, color: C.muted, marginBottom: 5, paddingLeft: 2 }}>{t}</div> }

// ── Card & Section Header ──────────────────────────────────────────
function Card({ children, style = {} }) {
  return <div style={{ background: C.surf, borderRadius: 18, border: `1px solid ${C.bdr}`, padding: '15px 16px', ...style }}>{children}</div>
}

function SHead({ title, action, onAction }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
      <span style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{title}</span>
      {action && <button onClick={onAction} style={{ background: 'none', border: 'none', color: C.green, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit,sans-serif' }}>{action}</button>}
    </div>
  )
}

// ── Progress Bar ───────────────────────────────────────────────────
function ProgBar({ pct: p, color = C.green, h = 5 }) {
  return (
    <div style={{ height: h, background: 'rgba(255,255,255,0.07)', borderRadius: h / 2, overflow: 'hidden' }}>
      <div className="bm-prg" style={{ height: '100%', width: `${Math.min(100, p)}%`, background: color, borderRadius: h / 2 }} />
    </div>
  )
}

// ── Empty State ────────────────────────────────────────────────────
function EmptyState({ icon, message, sub, btnLabel, onBtn }) {
  return (
    <div className="bm-empty">
      <div className="bm-empty-icon">{icon}</div>
      <div className="bm-empty-msg">{message}</div>
      {sub && <div className="bm-empty-sub">{sub}</div>}
      {btnLabel && <button className="bm-btn-primary" style={{ width: 'auto', padding: '12px 28px' }} onClick={onBtn}>{btnLabel}</button>}
    </div>
  )
}

// ── Spinner ────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
      <Logo sz={48} spin />
      <div style={{ fontSize: 13, color: C.muted }}>Loading…</div>
    </div>
  )
}

// ── Dashboard ──────────────────────────────────────────────────────
function Dashboard({ data, setTab, setModal, setEditing, onAddTxClick }) {
  const { user } = useAuth()
  const txs = data.txs || []
  const accounts = data.accounts || []
  const goals = data.goals || []
  const debts = data.debts || []
  const budgets = data.budgets || []

  // Daily limit state (persisted in localStorage)
  const [dailyLimit, setDailyLimit] = useState(() => {
    const saved = localStorage.getItem('bm_daily_limit')
    return saved ? Number(saved) : null
  })
  const [editingLimit, setEditingLimit] = useState(false)
  const [limitInput, setLimitInput] = useState('')
  const mTxs = txs.filter(t => t.date >= new Date().toISOString().slice(0, 7) + '-01')
  const income = mTxs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const expense = mTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const balance = income - expense
  const netWorth = accounts.reduce((s, a) => s + getbal(a, txs), 0)

  const daysInM = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
  const dayNum = new Date().getDate()
  const dLeft = daysInM - dayNum
  const burnRate = dLeft > 0 ? Math.round(balance / dLeft) : 0
  const burnPct = Math.round((dLeft / daysInM) * 100)
  const burnColor = burnRate < 0 ? C.red : burnRate < 200 ? C.gold : C.green

  // ── FIX 2: Time-based greeting ────────────────────────────────────
  const hr = new Date().getHours()
  const greetWord = hr >= 5 && hr < 12 ? 'Good Morning' : hr < 17 ? 'Good Afternoon' : hr < 21 ? 'Good Evening' : 'Good Night'
  const greetEmoji = hr >= 5 && hr < 12 ? '☀️' : hr < 17 ? '🌤️' : hr < 21 ? '🌙' : '🌃'
  const firstName = user?.name?.split(' ')[0] || 'there'
  const greeting = `${greetWord}, ${firstName} ${greetEmoji}`

  const catSpend = cat => mTxs.filter(t => t.type === 'expense' && t.cat === cat).reduce((s, t) => s + Number(t.amount), 0)
  const recent = [...txs].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 5)
  const overdue = debts.filter(d => !d.paid && !d.isPaid && isOverdue(d.due))

  return (
    <div style={{ overflowY: 'auto', paddingBottom: 8 }}>
      {/* Header */}
      <div className="bm-dash-header bm-fu" style={{ padding: '16px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo sz={30} />
          <div>
            <div style={{ fontSize: 11, color: C.muted }}>{greeting}</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>BudgetMaster</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            id="dashboard-add-tx"
            onClick={onAddTxClick}
            style={{ width: 36, height: 36, borderRadius: '50%', background: `${C.green}18`, border: `1px solid ${C.green}30`, color: C.green, fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 300 }}
          >+</button>
          <button
            id="dashboard-settings"
            onClick={() => setTab('settings')}
            style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: C.muted, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Settings"
          >⚙️</button>
        </div>
      </div>

      {/* Hero + Burn Rate — 2-column grid on desktop */}
      <div className="bm-dash-top-grid" style={{ margin: '14px 16px 0' }}>
        {/* Hero balance card */}
        <div className="bm-fu" style={{ padding: '20px', background: 'linear-gradient(135deg,#152535,#0E1D2E 50%,#0A1520)', borderRadius: 22, border: `1px solid rgba(16,232,160,0.12)`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, background: 'radial-gradient(circle,rgba(16,232,160,0.07) 0%,transparent 65%)', pointerEvents: 'none' }} />
          <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>
            {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} · Net Worth ₹{fmt(netWorth)}
          </div>
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -1, marginBottom: 16 }}>₹{fmt(balance)}</div>
          <div style={{ display: 'flex', borderTop: `1px solid rgba(255,255,255,0.07)`, paddingTop: 14 }}>
            <div style={{ flex: 1, borderRight: `1px solid rgba(255,255,255,0.07)`, paddingRight: 16 }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>Income ↑</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.green }}>₹{fmt(income)}</div>
            </div>
            <div style={{ flex: 1, paddingLeft: 16 }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>Spent ↓</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.red }}>₹{fmt(expense)}</div>
            </div>
          </div>
        </div>

        {/* Burn rate / Daily limit card */}
        <div className="bm-fu">
          <Card style={{ height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Daily Budget Left</div>
                  <button
                    id="edit-daily-limit-btn"
                    onClick={() => { setLimitInput(dailyLimit != null ? String(dailyLimit) : String(Math.max(0, burnRate))); setEditingLimit(true); }}
                    title="Edit daily limit"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', borderRadius: 5, color: C.muted, fontSize: 13, lineHeight: 1, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.color = C.green}
                    onMouseLeave={e => e.currentTarget.style.color = C.muted}
                  >
                    ✏️
                  </button>
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: burnColor }}>₹{fmt(burnRate)}<span style={{ fontSize: 13, fontWeight: 400, color: C.muted }}>/day</span></div>
                {dailyLimit != null && (
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>
                    Limit: <span style={{ color: burnRate > dailyLimit ? C.red : C.green, fontWeight: 600 }}>₹{fmt(dailyLimit)}/day</span>
                    <button
                      onClick={() => { setDailyLimit(null); localStorage.removeItem('bm_daily_limit'); }}
                      style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 10, marginLeft: 4, padding: '1px 4px', borderRadius: 4, fontFamily: 'Outfit,sans-serif' }}
                      title="Remove limit"
                    >✕</button>
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right', minWidth: 110 }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>{burnPct}% of month left</div>
                <div style={{ width: 110 }}>
                  <ProgBar
                    pct={dailyLimit != null ? Math.min(100, Math.round((burnRate / dailyLimit) * 100)) : burnPct}
                    color={dailyLimit != null ? (burnRate > dailyLimit ? C.red : burnRate > dailyLimit * 0.8 ? C.gold : C.green) : burnColor}
                    h={6}
                  />
                </div>
                <div style={{ fontSize: 11, color: burnColor, marginTop: 4, fontWeight: 600 }}>
                  {dailyLimit != null
                    ? burnRate > dailyLimit ? 'Over limit ⚠️' : burnRate > dailyLimit * 0.8 ? 'Near limit 🟡' : 'Within limit 🎯'
                    : burnRate < 0 ? 'Over budget ⚠️' : burnRate < 200 ? 'Careful 🟡' : 'On track 🎯'
                  }
                </div>
              </div>
            </div>

            {/* Inline edit modal for daily limit */}
            {editingLimit && (
              <div style={{ marginTop: 14, padding: '12px', background: 'rgba(16,232,160,0.05)', borderRadius: 12, border: `1px solid rgba(16,232,160,0.15)`, animation: 'fadeUp 0.2s ease' }}>
                <div style={{ fontSize: 12, color: C.green, fontWeight: 600, marginBottom: 8 }}>✏️ Set Daily Spending Limit</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: C.muted }}>₹</span>
                    <input
                      id="daily-limit-input"
                      autoFocus
                      type="number"
                      min="0"
                      value={limitInput}
                      onChange={e => setLimitInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          const val = Number(limitInput);
                          if (val > 0) { setDailyLimit(val); localStorage.setItem('bm_daily_limit', String(val)); }
                          setEditingLimit(false);
                        }
                        if (e.key === 'Escape') setEditingLimit(false);
                      }}
                      placeholder="e.g. 500"
                      style={{ width: '100%', padding: '9px 10px 9px 26px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(16,232,160,0.25)', borderRadius: 9, color: C.text, fontFamily: 'Outfit,sans-serif', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <button
                    id="daily-limit-save"
                    onClick={() => {
                      const val = Number(limitInput);
                      if (val > 0) { setDailyLimit(val); localStorage.setItem('bm_daily_limit', String(val)); }
                      setEditingLimit(false);
                    }}
                    style={{ padding: '9px 14px', background: C.green, border: 'none', borderRadius: 9, color: '#0A0E19', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Outfit,sans-serif', whiteSpace: 'nowrap' }}
                  >Save</button>
                  <button
                    onClick={() => setEditingLimit(false)}
                    style={{ padding: '9px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, color: C.muted, fontSize: 13, cursor: 'pointer', fontFamily: 'Outfit,sans-serif' }}
                  >✕</button>
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>Current burn rate: <span style={{ color: burnColor }}>₹{fmt(burnRate)}/day</span> · Press Enter or Save</div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Budgets */}
      {budgets.length > 0 && (
        <div className="bm-dash-section bm-fu" style={{ margin: '12px 16px 0' }}>
          <Card>
            <SHead title="Budgets" action="View Transactions" onAction={() => setTab('transactions')} />
            {budgets.slice(0, 3).map(b => {
              const spent = catSpend(b.cat)
              const p = pct(spent, b.limit)
              const bc = p >= 90 ? C.red : p >= 70 ? C.gold : C.green
              return (
                <div key={b._id || b.id} style={{ marginBottom: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{b.cat}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 11, color: C.muted }}>₹{fmt(spent)}/₹{fmt(b.limit)}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: `${bc}18`, color: bc }}>{p}%</span>
                    </div>
                  </div>
                  <ProgBar pct={p} color={bc} />
                </div>
              )
            })}
            <button onClick={() => { setModal('addBudget'); setEditing(null) }} style={{ ...gbtn(C.blue, false, 0), padding: '9px', fontSize: 12, marginTop: 4 }}>+ Add Budget Category</button>
          </Card>
        </div>
      )}

      {/* Goals snapshot */}
      {goals.length > 0 && (
        <div className="bm-dash-section bm-fu" style={{ margin: '12px 16px 0' }}>
          <Card>
            <SHead title="Goals 🎯" action="See all" onAction={() => setTab('goals')} />
            {goals.slice(0, 2).map(g => {
              const p = pct(g.saved || g.savedAmount || 0, g.target)
              return (
                <div key={g._id || g.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: `${g.color || C.green}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>{g.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{g.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: g.color || C.green }}>{p}%</span>
                    </div>
                    <ProgBar pct={p} color={g.color || C.green} />
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>₹{fmt(g.saved || g.savedAmount || 0)} of ₹{fmt(g.target)}</div>
                  </div>
                </div>
              )
            })}
          </Card>
        </div>
      )}

      {/* Overdue debt alert */}
      {overdue.length > 0 && (
        <div onClick={() => setTab('debts')} className="bm-dash-section bm-fu" style={{ margin: '12px 16px 0', padding: '13px 16px', background: `${C.red}0d`, border: `1px solid ${C.red}28`, borderRadius: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>⚠️  {overdue.length} debt{overdue.length > 1 ? 's' : ''} overdue</span>
          <span style={{ fontSize: 12, color: C.red }}>View →</span>
        </div>
      )}

      {/* Recent transactions */}
      <div className="bm-dash-section bm-fu" style={{ margin: '12px 16px 0' }}>
        <Card>
          <SHead title="Recent Transactions" action="View all" onAction={() => setTab('transactions')} />
          {recent.length === 0
            ? <div style={{ fontSize: 13, color: C.muted, textAlign: 'center', padding: '16px 0' }}>💸 No transactions yet. Tap + to add one.</div>
            : recent.map(t => (
              <div key={t._id || t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                <div style={{ width: 36, height: 36, borderRadius: 12, background: t.type === 'income' ? `${C.green}12` : `${C.blue}0d`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>
                  {t.type === 'income' ? '💰' : '💸'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.desc}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{t.cat} · {t.date}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: t.type === 'income' ? C.green : C.text, flexShrink: 0 }}>
                  {t.type === 'income' ? '+' : '-'}₹{fmt(t.amount)}
                </div>
              </div>
            ))
          }
        </Card>
      </div>
    </div>
  )
}

// ── Transactions Screen ────────────────────────────────────────────
function Transactions({ data, deleteItem, setModal, setEditing, onAddClick }) {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const txs = data.txs || []
  const accounts = data.accounts || []

  const sorted = [...txs]
    .filter(t => filter === 'all' || t.type === filter)
    .filter(t => !search || t.desc?.toLowerCase().includes(search.toLowerCase()) || t.cat?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))

  const acc = id => accounts.find(a => (a._id || a.id) === id)

  return (
    <div className="bm-screen-wrapper" style={{ padding: '16px 16px 0', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Transactions</div>
        <button id="tx-add-btn" onClick={onAddClick} style={{ ...gbtn(C.green, true, 0), width: 'auto', padding: '8px 16px', fontSize: 13 }}>+ Add</button>
      </div>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transactions…" style={{ ...inp }} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {['all', 'income', 'expense'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: `1px solid ${filter === f ? C.green : 'rgba(255,255,255,0.09)'}`, background: filter === f ? `${C.green}18` : 'transparent', color: filter === f ? C.green : C.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit,sans-serif', textTransform: 'capitalize' }}
          >{f}</button>
        ))}
      </div>
      {sorted.length === 0 && (
        <EmptyState icon="💸" message="No transactions yet" sub="Add your first income or expense to get started." btnLabel="+ Add Transaction" onBtn={onAddClick} />
      )}
      <div className="bm-tx-list">
      {sorted.map(t => {
        const a = acc(t.accId)
        return (
          <div key={t._id || t.id} className="bm-fu" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: C.surf, borderRadius: 14, border: `1px solid ${C.bdr}`, marginBottom: 8 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: t.type === 'income' ? `${C.green}14` : `${C.blue}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
              {t.type === 'income' ? '💰' : '💸'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.desc}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{t.cat}{a ? ` · ${a.icon || ''}${a.name}` : ''} · {t.date}</div>
              {t.note && <div style={{ fontSize: 11, color: C.muted, fontStyle: 'italic' }}>{t.note}</div>}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: t.type === 'income' ? C.green : C.text }}>
                {t.type === 'income' ? '+' : '-'}₹{fmt(t.amount)}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 4, justifyContent: 'flex-end' }}>
                <button onClick={() => { setEditing(t); setModal('addTx') }} style={{ background: 'none', border: 'none', color: C.blue, fontSize: 11, cursor: 'pointer', fontFamily: 'Outfit,sans-serif' }}>Edit</button>
                <button onClick={() => deleteItem('txs', t._id || t.id)} style={{ background: 'none', border: 'none', color: C.red, fontSize: 11, cursor: 'pointer', fontFamily: 'Outfit,sans-serif' }}>Delete</button>
              </div>
            </div>
          </div>
        )
      })}
      </div>
      <div style={{ height: 12 }} />
    </div>
  )
}

// ── Accounts Screen ────────────────────────────────────────────────
function Accounts({ data, deleteItem, setModal, setEditing }) {
  const accounts = data.accounts || []
  const txs = data.txs || []
  const netWorth = accounts.reduce((s, a) => s + getbal(a, txs), 0)

  return (
    <div className="bm-screen-wrapper" style={{ padding: '16px 16px 0', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Accounts</div>
        <button id="acc-add-btn" onClick={() => { setEditing(null); setModal('addAcc') }} style={{ ...gbtn(C.green, true, 0), width: 'auto', padding: '8px 16px', fontSize: 13 }}>+ Add</button>
      </div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>Net Worth: <span style={{ color: netWorth >= 0 ? C.green : C.red, fontWeight: 700 }}>₹{fmt(netWorth)}</span></div>
      {accounts.length === 0
        ? <EmptyState icon="🏦" message="No accounts yet" sub="Add a bank or cash account to start tracking." btnLabel="+ Add Account" onBtn={() => { setEditing(null); setModal('addAcc') }} />
        : <div className="bm-acc-list">{accounts.map(a => {
          const bal = getbal(a, txs)
          const atxs = txs.filter(t => t.accId === (a._id || a.id))
          return (
            <div key={a._id || a.id} className="bm-fu" style={{ background: C.surf, borderRadius: 18, border: `1px solid ${(a.color || C.green)}22`, padding: '16px', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: `${a.color || C.green}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{a.icon || '🏦'}</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{a.type} · {atxs.length} transactions</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: bal < 0 ? C.red : (a.color || C.green) }}>
                    {bal < 0 ? '-' : ''}₹{fmt(bal)}
                  </div>
                  <div style={{ fontSize: 10, color: C.muted }}>Opening: ₹{fmt(a.ob)}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setEditing(a); setModal('addAcc') }}
                  style={{ flex: 1, padding: '8px', background: `${a.color || C.green}12`, border: `1px solid ${a.color || C.green}28`, borderRadius: 10, color: a.color || C.green, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit,sans-serif' }}>Edit</button>
                <button onClick={() => deleteItem('accounts', a._id || a.id)}
                  style={{ flex: 1, padding: '8px', background: `${C.red}0d`, border: `1px solid ${C.red}22`, borderRadius: 10, color: C.red, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit,sans-serif' }}>Delete</button>
              </div>
            </div>
          )
        })}
        </div>
      }
      <div style={{ height: 12 }} />
    </div>
  )
}

// ── Goals Screen ───────────────────────────────────────────────────
function Goals({ data, deleteItem, setModal, setEditing }) {
  const goals = data.goals || []
  const totalSaved = goals.reduce((s, g) => s + Number(g.saved || g.savedAmount || 0), 0)
  const totalTarget = goals.reduce((s, g) => s + Number(g.target), 0)
  const overallPct = pct(totalSaved, totalTarget)

  return (
    <div style={{ padding: '16px 16px 0', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Goals 🎯</div>
        <button id="goals-add-btn" onClick={() => { setEditing(null); setModal('addGoal') }} style={{ ...gbtn(C.green, true, 0), width: 'auto', padding: '8px 16px', fontSize: 13 }}>+ New Goal</button>
      </div>
      {goals.length === 0
        ? <EmptyState icon="🎯" message="No goals set yet" sub="Set a savings goal and start tracking your progress." btnLabel="+ Set a Goal" onBtn={() => { setEditing(null); setModal('addGoal') }} />
        : <>
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: C.muted }}>₹{fmt(totalSaved)} saved of ₹{fmt(totalTarget)}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.green }}>{overallPct}%</span>
            </div>
            <ProgBar pct={overallPct} color={`linear-gradient(90deg,${C.green},${C.blue},${C.violet})`} h={7} />
          </div>
          <div className="bm-goals-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {goals.map(g => {
              const savedAmt = g.saved || g.savedAmount || 0
              const p = pct(savedAmt, g.target)
              const dl = daysLeft(g.deadline)
              return (
                <div key={g._id || g.id} className="bm-fu" style={{ background: C.surf, borderRadius: 18, border: `1px solid ${C.bdr}`, padding: '14px 13px' }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{g.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>₹{fmt(savedAmt)} / ₹{fmt(g.target)}</div>
                  <ProgBar pct={p} color={g.color || C.green} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, marginBottom: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: g.color || C.green }}>{p}%</span>
                    {dl !== null && <span style={{ fontSize: 10, color: dl < 14 ? C.red : C.muted }}>🔥 {dl}d left</span>}
                    {dl === null && <span style={{ fontSize: 10, color: C.muted }}>No deadline</span>}
                    {p >= 100 && <span style={{ fontSize: 10, color: C.green }}>✅ Done!</span>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button onClick={() => { setEditing(g); setModal('addMoney') }}
                      style={{ width: '100%', padding: '8px', background: `${g.color || C.green}14`, border: `1px solid ${g.color || C.green}28`, borderRadius: 10, color: g.color || C.green, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit,sans-serif' }}>+ Add Money</button>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button onClick={() => { setEditing(g); setModal('addGoal') }}
                        style={{ flex: 1, padding: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, color: C.muted, fontSize: 11, cursor: 'pointer', fontFamily: 'Outfit,sans-serif' }}>Edit</button>
                      <button onClick={() => deleteItem('goals', g._id || g.id)}
                        style={{ flex: 1, padding: '6px', background: `${C.red}0a`, border: `1px solid ${C.red}20`, borderRadius: 9, color: C.red, fontSize: 11, cursor: 'pointer', fontFamily: 'Outfit,sans-serif' }}>Delete</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      }
      <div style={{ height: 12 }} />
    </div>
  )
}

// ── Debts Screen ───────────────────────────────────────────────────
function Debts({ data, deleteItem, updateItem, debtTab, setDebtTab, setModal, setEditing }) {
  const debts = data.debts || []
  const list = debts.filter(d => d.type === debtTab && !d.paid && !d.isPaid)
  const settled = debts.filter(d => d.paid || d.isPaid)
  const oweMe = debts.filter(d => d.type === 'owe_me' && !d.paid && !d.isPaid).reduce((s, d) => s + Number(d.remaining || d.amount), 0)
  const iOwe = debts.filter(d => d.type === 'i_owe' && !d.paid && !d.isPaid).reduce((s, d) => s + Number(d.remaining || d.amount), 0)
  const col = debtTab === 'owe_me' ? C.green : C.red

  return (
    <div style={{ padding: '16px 16px 0', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Debts 💳</div>
        <button id="debt-add-btn" onClick={() => { setEditing(null); setModal('addDebt') }} style={{ ...gbtn(C.green, true, 0), width: 'auto', padding: '8px 16px', fontSize: 13 }}>+ Add</button>
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1, padding: '12px', background: `${C.green}0d`, borderRadius: 14, border: `1px solid ${C.green}20`, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>Owe Me</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: C.green }}>₹{fmt(oweMe)}</div>
        </div>
        <div style={{ flex: 1, padding: '12px', background: `${C.red}0d`, borderRadius: 14, border: `1px solid ${C.red}20`, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>I Owe</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: C.red }}>₹{fmt(iOwe)}</div>
        </div>
        <div style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 14, border: `1px solid rgba(255,255,255,0.07)`, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>Net</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: oweMe - iOwe >= 0 ? C.green : C.red }}>₹{fmt(Math.abs(oweMe - iOwe))}</div>
        </div>
      </div>
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 13, padding: 3, border: `1px solid ${C.bdr}`, marginBottom: 14 }}>
        {[['owe_me', '🟢 Owe Me'], ['i_owe', '🔴 I Owe']].map(([k, l]) => (
          <button key={k} onClick={() => setDebtTab(k)}
            style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', fontFamily: 'Outfit,sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: debtTab === k ? (k === 'owe_me' ? C.green : C.red) : 'transparent', color: debtTab === k ? (k === 'owe_me' ? '#0A0E19' : '#fff') : C.muted, transition: 'all 0.2s' }}
          >{l}</button>
        ))}
      </div>
      {list.length === 0 && debts.length === 0
        ? <EmptyState icon="🏦" message="No loans added" sub="Track money you owe or are owed." btnLabel="+ Add Loan" onBtn={() => { setEditing(null); setModal('addDebt') }} />
        : list.length === 0
          ? <div style={{ textAlign: 'center', color: C.muted, fontSize: 13, padding: '24px 0' }}>No {debtTab === 'owe_me' ? '"owe me"' : '"I owe"'} entries.</div>
          : list.map(d => {
            const over = isOverdue(d.due)
            return (
              <div key={d._id || d.id} className="bm-fu" style={{ background: C.surf, borderRadius: 18, border: `1px solid ${over ? `${C.red}35` : C.bdr}`, padding: '15px', marginBottom: 11, position: 'relative' }}>
                {over && <div style={{ position: 'absolute', top: 13, right: 13, fontSize: 10, fontWeight: 700, padding: '3px 8px', background: `${C.red}18`, color: C.red, borderRadius: 6, letterSpacing: '0.5px' }}>OVERDUE</div>}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, marginBottom: 8 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${col}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: col, flexShrink: 0 }}>{d.person?.charAt(0).toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{d.person}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>Due {d.due || 'No date'}</div>
                    {d.note && <div style={{ fontSize: 12, color: C.muted, fontStyle: 'italic', marginTop: 2 }}>"{d.note}"</div>}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 19, fontWeight: 700, color: col }}>₹{fmt(d.remaining || d.amount)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 7 }}>
                  <button onClick={() => updateItem('debts', d._id || d.id, { paid: true, isPaid: true, remaining: 0 })}
                    style={{ flex: 1, padding: '8px', background: `${col}14`, border: `1px solid ${col}28`, borderRadius: 9, color: col, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit,sans-serif' }}>✓ Mark Paid</button>
                  <button onClick={() => deleteItem('debts', d._id || d.id)}
                    style={{ flex: 1, padding: '8px', background: `${C.red}0a`, border: `1px solid ${C.red}20`, borderRadius: 9, color: C.red, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit,sans-serif' }}>Delete</button>
                </div>
              </div>
            )
          })
      }
      <div style={{ height: 12 }} />
    </div>
  )
}

// ── Add Transaction Modal ──────────────────────────────────────────
function AddTxModal({ data, onSave, editing, onClose }) {
  const accounts = data.accounts || []
  const [form, setForm] = useState({
    desc: editing?.desc || '', amount: editing?.amount || '',
    type: editing?.type || 'expense', cat: editing?.cat || 'Food',
    accId: editing?.accId || (accounts[0]?._id || accounts[0]?.id || ''),
    date: editing?.date || new Date().toISOString().slice(0, 10), note: editing?.note || ''
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const save = () => {
    if (!form.desc.trim() || !form.amount || !form.accId) return
    onSave({ ...form, amount: Number(form.amount) }, editing?._id || editing?.id)
    onClose()
  }
  return (
    <Modal title={editing ? 'Edit Transaction' : 'Add Transaction'} onClose={onClose}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        {['expense', 'income'].map(t => (
          <button key={t} onClick={() => set('type', t)}
            style={{ flex: 1, padding: '11px', borderRadius: 11, border: `1px solid ${form.type === t ? (t === 'income' ? C.green : C.red) : 'rgba(255,255,255,0.1)'}`, background: form.type === t ? (t === 'income' ? `${C.green}18` : `${C.red}18`) : 'transparent', color: form.type === t ? (t === 'income' ? C.green : C.red) : C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit,sans-serif', textTransform: 'capitalize' }}
          >{t}</button>
        ))}
      </div>
      <Lbl t="Description" /><input style={inp} value={form.desc} onChange={e => set('desc', e.target.value)} placeholder="e.g. Swiggy Order" autoFocus />
      <Lbl t="Amount (₹)" /><input style={inp} type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0" min="0" />
      <Lbl t="Category" /><select style={{ ...inp }} value={form.cat} onChange={e => set('cat', e.target.value)}>{CATS.map(c => <option key={c} value={c}>{c}</option>)}</select>
      <Lbl t="Account" /><select style={{ ...inp }} value={form.accId} onChange={e => set('accId', e.target.value)}>
        {accounts.map(a => <option key={a._id || a.id} value={a._id || a.id}>{a.icon || ''} {a.name}</option>)}
      </select>
      <Lbl t="Date" /><input style={inp} type="date" value={form.date} onChange={e => set('date', e.target.value)} />
      <Lbl t="Note (optional)" /><input style={inp} value={form.note} onChange={e => set('note', e.target.value)} placeholder="Optional note" />
      <button style={gbtn(C.green)} onClick={save}>{editing ? 'Save Changes' : 'Add Transaction'}</button>
    </Modal>
  )
}

// ── Add Account Modal ──────────────────────────────────────────────
function AddAccModal({ data, onSave, editing, onClose }) {
  const [form, setForm] = useState({
    name: editing?.name || '', type: editing?.type || 'Bank',
    ob: editing?.ob || '', icon: editing?.icon || '🏦', color: editing?.color || C.blue
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const save = () => {
    if (!form.name.trim()) return
    onSave({ ...form, ob: Number(form.ob) || 0 }, editing?._id || editing?.id)
    onClose()
  }
  return (
    <Modal title={editing ? 'Edit Account' : 'Add Account'} onClose={onClose}>
      <Lbl t="Account Name" /><input style={inp} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. HDFC Savings" autoFocus />
      <Lbl t="Type" /><select style={{ ...inp }} value={form.type} onChange={e => set('type', e.target.value)}>
        {['Bank', 'Cash', 'Credit', 'Wallet', 'Investment'].map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <Lbl t="Opening Balance (₹)" /><input style={inp} type="number" value={form.ob} onChange={e => set('ob', e.target.value)} placeholder="0" min="0" />
      <Lbl t="Icon" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {ACC_ICONS.map(ic => (
          <button key={ic} onClick={() => set('icon', ic)}
            style={{ width: 42, height: 42, borderRadius: 12, background: form.icon === ic ? `${form.color}28` : 'rgba(255,255,255,0.05)', border: `1px solid ${form.icon === ic ? form.color : 'rgba(255,255,255,0.1)'}`, fontSize: 20, cursor: 'pointer' }}>{ic}</button>
        ))}
      </div>
      <Lbl t="Color" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {ACC_COLORS.map(c => (
          <button key={c} onClick={() => set('color', c)}
            style={{ width: 30, height: 30, borderRadius: '50%', background: c, border: form.color === c ? '3px solid white' : '3px solid transparent', cursor: 'pointer', transition: 'border 0.15s' }} />
        ))}
      </div>
      <button style={gbtn(C.green)} onClick={save}>{editing ? 'Save Changes' : 'Create Account'}</button>
    </Modal>
  )
}

// ── Add Goal Modal ─────────────────────────────────────────────────
function AddGoalModal({ data, onSave, editing, onClose }) {
  const [form, setForm] = useState({
    name: editing?.name || '', target: editing?.target || '',
    icon: editing?.icon || '💻', color: editing?.color || C.blue,
    deadline: editing?.deadline || ''
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const save = () => {
    if (!form.name.trim() || !form.target) return
    onSave({ ...form, target: Number(form.target) }, editing?._id || editing?.id)
    onClose()
  }
  return (
    <Modal title={editing ? 'Edit Goal' : 'New Goal'} onClose={onClose}>
      <Lbl t="Goal Name" /><input style={inp} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. New Laptop" autoFocus />
      <Lbl t="Target Amount (₹)" /><input style={inp} type="number" value={form.target} onChange={e => set('target', e.target.value)} placeholder="50000" min="0" />
      <Lbl t="Deadline (optional)" /><input style={inp} type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} />
      <Lbl t="Icon" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {GOAL_ICONS.map(ic => (
          <button key={ic} onClick={() => set('icon', ic)}
            style={{ width: 42, height: 42, borderRadius: 12, background: form.icon === ic ? `${form.color}28` : 'rgba(255,255,255,0.05)', border: `1px solid ${form.icon === ic ? form.color : 'rgba(255,255,255,0.1)'}`, fontSize: 20, cursor: 'pointer' }}>{ic}</button>
        ))}
      </div>
      <Lbl t="Color" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {ACC_COLORS.map(c => (
          <button key={c} onClick={() => set('color', c)}
            style={{ width: 30, height: 30, borderRadius: '50%', background: c, border: form.color === c ? '3px solid white' : '3px solid transparent', cursor: 'pointer' }} />
        ))}
      </div>
      <button style={gbtn(C.green)} onClick={save}>{editing ? 'Save Changes' : 'Create Goal'}</button>
    </Modal>
  )
}

// ── Add Money to Goal ──────────────────────────────────────────────
function AddMoneyModal({ data, updateItem, goal, onClose }) {
  const [amount, setAmount] = useState('')
  const save = () => {
    if (!amount || Number(amount) <= 0) return
    const newSaved = Number(goal.saved || goal.savedAmount || 0) + Number(amount)
    updateItem('goals', goal._id || goal.id, { saved: newSaved, savedAmount: newSaved })
    onClose()
  }
  const p = pct(Number(goal.saved || goal.savedAmount || 0) + Number(amount || 0), goal.target)
  return (
    <Modal title={`Add Money — ${goal.name}`} onClose={onClose}>
      <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
        <div style={{ fontSize: 28, marginBottom: 6 }}>{goal.icon}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: goal.color || C.green }}>{p}%</div>
        <div style={{ fontSize: 12, color: C.muted }}>₹{fmt(Number(goal.saved || goal.savedAmount || 0) + Number(amount || 0))} of ₹{fmt(goal.target)}</div>
        <div style={{ marginTop: 10, marginBottom: 4 }}><ProgBar pct={p} color={goal.color || C.green} h={8} /></div>
      </div>
      <Lbl t="Amount to Add (₹)" />
      <input style={inp} type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 5000" autoFocus min="0" />
      <button style={gbtn(goal.color || C.green)} onClick={save}>Add ₹{fmt(amount || 0)} to Goal</button>
    </Modal>
  )
}

// ── Add Debt Modal ─────────────────────────────────────────────────
function AddDebtModal({ data, onSave, editing, onClose }) {
  const [form, setForm] = useState({
    person: editing?.person || '', amount: editing?.amount || '',
    type: editing?.type || 'owe_me', due: editing?.due || '', note: editing?.note || ''
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const save = () => {
    if (!form.person.trim() || !form.amount) return
    onSave({ ...form, amount: Number(form.amount), remaining: Number(form.amount), paid: false, isPaid: false }, editing?._id || editing?.id)
    onClose()
  }
  return (
    <Modal title={editing ? 'Edit Debt' : 'Add Debt'} onClose={onClose}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        {[['owe_me', '🟢 Owe Me'], ['i_owe', '🔴 I Owe']].map(([k, l]) => (
          <button key={k} onClick={() => set('type', k)}
            style={{ flex: 1, padding: '11px', borderRadius: 11, border: `1px solid ${form.type === k ? (k === 'owe_me' ? C.green : C.red) : 'rgba(255,255,255,0.1)'}`, background: form.type === k ? (k === 'owe_me' ? `${C.green}18` : `${C.red}18`) : 'transparent', color: form.type === k ? (k === 'owe_me' ? C.green : C.red) : C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit,sans-serif' }}>{l}</button>
        ))}
      </div>
      <Lbl t="Person Name" /><input style={inp} value={form.person} onChange={e => set('person', e.target.value)} placeholder="e.g. Rahul" />
      <Lbl t="Amount (₹)" /><input style={inp} type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0" min="0" />
      <Lbl t="Due Date (optional)" /><input style={inp} type="date" value={form.due} onChange={e => set('due', e.target.value)} />
      <Lbl t="Note (optional)" /><input style={inp} value={form.note} onChange={e => set('note', e.target.value)} placeholder="What's it for?" />
      <button style={gbtn(C.green)} onClick={save}>{editing ? 'Save Changes' : 'Add Debt'}</button>
    </Modal>
  )
}

// ── Add Budget Modal ───────────────────────────────────────────────
function AddBudgetModal({ data, onSave, editing, onClose }) {
  const [cat, setCat] = useState(editing?.cat || 'Food')
  const [limit, setLimit] = useState(editing?.limit || '')
  const save = () => {
    if (!limit) return
    onSave({ cat, limit: Number(limit) }, editing?._id || editing?.id)
    onClose()
  }
  return (
    <Modal title={editing ? 'Edit Budget' : 'Add Budget'} onClose={onClose}>
      <Lbl t="Category" />
      <select style={{ ...inp }} value={cat} onChange={e => setCat(e.target.value)}>
        {CATS.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <Lbl t="Monthly Limit (₹)" />
      <input style={inp} type="number" value={limit} onChange={e => setLimit(e.target.value)} placeholder="e.g. 5000" min="0" />
      <button style={gbtn(C.green)} onClick={save}>{editing ? 'Save Changes' : 'Add Budget'}</button>
    </Modal>
  )
}

// ── Bottom Nav ─────────────────────────────────────────────────────
const NAV = [
  { id: 'dashboard', label: 'Home', icon: (a) => <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="1.5" y="1.5" width="8.5" height="8.5" rx="2.5" stroke={a ? C.green : C.muted} strokeWidth="1.7" /><rect x="12" y="1.5" width="8.5" height="8.5" rx="2.5" stroke={a ? C.green : C.muted} strokeWidth="1.7" fill={a ? `${C.green}20` : 'none'} /><rect x="1.5" y="12" width="8.5" height="8.5" rx="2.5" stroke={a ? C.green : C.muted} strokeWidth="1.7" /><rect x="12" y="12" width="8.5" height="8.5" rx="2.5" stroke={a ? C.green : C.muted} strokeWidth="1.7" /></svg> },
  { id: 'transactions', label: 'Txns', icon: (a) => <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 6h16M3 11h10M3 16h13" stroke={a ? C.green : C.muted} strokeWidth="1.7" strokeLinecap="round" /><path d="M17 14l3 3-3 3" stroke={a ? C.green : C.muted} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg> },
  { id: 'accounts', label: 'Accounts', icon: (a) => <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="1.5" y="4.5" width="19" height="13" rx="2.5" stroke={a ? C.green : C.muted} strokeWidth="1.7" /><path d="M1.5 8.5h19" stroke={a ? C.green : C.muted} strokeWidth="1.7" /><circle cx="6" cy="13" r="1.5" fill={a ? C.green : C.muted} /></svg> },
  { id: 'goals', label: 'Goals', icon: (a) => <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="9" stroke={a ? C.green : C.muted} strokeWidth="1.7" /><circle cx="11" cy="11" r="5" stroke={a ? C.green : C.muted} strokeWidth="1.7" /><circle cx="11" cy="11" r="2" fill={a ? C.green : C.muted} /></svg> },
  { id: 'debts', label: 'Debts', icon: (a) => <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 2v18M6 6.5h7a3 3 0 010 6H7.5a3 3 0 000 6H15" stroke={a ? C.green : C.muted} strokeWidth="1.7" strokeLinecap="round" /></svg> },
]

function BottomNav({ tab, setTab }) {
  return (
    <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, height: 72, background: `rgba(15,21,37,0.96)`, backdropFilter: 'blur(20px)', borderTop: `1px solid rgba(255,255,255,0.06)`, display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 6px 10px', zIndex: 100 }}>
      {NAV.map(({ id, label, icon }) => {
        const active = tab === id
        return (
          <button key={id} onClick={() => setTab(id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 12, transition: 'all 0.18s' }}>
            {icon(active)}
            <span style={{ fontSize: 10, fontWeight: 600, color: active ? C.green : C.muted, fontFamily: 'Outfit,sans-serif' }}>{label}</span>
          </button>
        )
      })}
    </div>
  )
}

// ── Sidebar Nav (desktop) ────────────────────────────────────────
function SidebarNav({ tab, setTab, onAddTx }) {
  return (
    <>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, paddingLeft: 4 }}>
        <Logo sz={30} />
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>BudgetMaster</div>
          <div style={{ fontSize: 11, color: C.muted }}>Personal Finance</div>
        </div>
      </div>

      {/* Add Transaction CTA button */}
      <button
        id="sidebar-add-tx"
        onClick={onAddTx}
        style={{ width: '100%', padding: '12px 14px', marginBottom: 20, background: `linear-gradient(135deg,${C.green},#0BC78A)`, border: 'none', borderRadius: 13, color: '#0A0E19', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Outfit,sans-serif', boxShadow: `0 4px 20px ${C.green}28`, transition: 'transform 0.15s, box-shadow 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 6px 24px ${C.green}44` }}
        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `0 4px 20px ${C.green}28` }}
      >
        <span style={{ fontSize: 20, lineHeight: 1, fontWeight: 300 }}>+</span>
        Add Transaction
      </button>

      {/* Nav items */}
      <nav style={{ flex: 1 }}>
        {NAV.map(({ id, label, icon }) => {
          const active = tab === id
          return (
            <button key={id} onClick={() => setTab(id)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 13px', marginBottom: 3, borderRadius: 12, background: active ? `${C.green}12` : 'transparent', border: `1px solid ${active ? `${C.green}22` : 'transparent'}`, color: active ? C.green : C.muted, cursor: 'pointer', fontSize: 14, fontWeight: active ? 600 : 400, fontFamily: 'Outfit,sans-serif', transition: 'all 0.15s', textAlign: 'left' }}
            >
              {icon(active)}
              <span style={{ marginLeft: 2 }}>{label}</span>
            </button>
          )
        })}
      </nav>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '12px 0' }} />

      {/* Settings */}
      <button
        onClick={() => setTab('settings')}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 13px', borderRadius: 12, background: tab === 'settings' ? `${C.blue}12` : 'transparent', border: `1px solid ${tab === 'settings' ? `${C.blue}22` : 'transparent'}`, color: tab === 'settings' ? C.blue : C.muted, cursor: 'pointer', fontSize: 14, fontWeight: tab === 'settings' ? 600 : 400, fontFamily: 'Outfit,sans-serif', transition: 'all 0.15s', textAlign: 'left' }}
      >
        <span style={{ fontSize: 18 }}>⚙️</span>
        <span style={{ marginLeft: 2 }}>Settings</span>
      </button>
    </>
  )
}

// ── Main App (inner — needs AuthContext) ───────────────────────────
function AppInner() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const [authScreen, setAuthScreen] = useState('login') // 'login' | 'register'

  const [data, setData] = useState({ accounts: [], txs: [], goals: [], debts: [], budgets: [] })
  const [dataLoading, setDataLoading] = useState(false)
  const [tab, setTab] = useState('dashboard')
  const [modal, setModal] = useState(null)
  const [editing, setEditing] = useState(null)
  const [debtTab, setDebtTab] = useState('owe_me')
  const [showGuard, setShowGuard] = useState(false)

  // Load all user data from API when authenticated
  useEffect(() => {
    if (!isAuthenticated) return
    setDataLoading(true)
    Promise.all([
      api.get('/accounts').catch(() => []),
      api.get('/transactions').catch(() => []),
      api.get('/goals').catch(() => []),
      api.get('/debts').catch(() => []),
      api.get('/budgets').catch(() => []),
    ]).then(([accounts, txs, goals, debts, budgets]) => {
      setData({ accounts, txs, goals, debts, budgets })
    }).finally(() => setDataLoading(false))
  }, [isAuthenticated])

  // ── API-backed CRUD helpers ────────────────────────────────────
  const addItem = useCallback(async (key, endpoint, payload) => {
    const item = await api.post(endpoint, payload)
    setData(prev => ({ ...prev, [key]: [...(prev[key] || []), item] }))
  }, [])

  const updateItem = useCallback(async (key, endpoint, id, payload) => {
    const item = await api.put(`${endpoint}/${id}`, payload)
    setData(prev => ({ ...prev, [key]: (prev[key] || []).map(x => (x._id || x.id) === id ? item : x) }))
  }, [])

  const deleteItem = useCallback(async (key, endpoint, id) => {
    await api.delete(`${endpoint}/${id}`)
    setData(prev => ({ ...prev, [key]: (prev[key] || []).filter(x => (x._id || x.id) !== id) }))
  }, [])

  // Modal save handlers
  const handleSaveTx = async (payload, editId) => {
    if (editId) { await updateItem('txs', '/transactions', editId, payload) }
    else { await addItem('txs', '/transactions', payload) }
  }
  const handleSaveAcc = async (payload, editId) => {
    if (editId) { await updateItem('accounts', '/accounts', editId, payload) }
    else {
      const item = await api.post('/accounts', payload)
      setData(prev => ({ ...prev, accounts: [...prev.accounts, item] }))
    }
  }
  const handleSaveGoal = async (payload, editId) => {
    if (editId) { await updateItem('goals', '/goals', editId, payload) }
    else { await addItem('goals', '/goals', payload) }
  }
  const handleSaveDebt = async (payload, editId) => {
    if (editId) { await updateItem('debts', '/debts', editId, payload) }
    else { await addItem('debts', '/debts', payload) }
  }
  const handleSaveBudget = async (payload, editId) => {
    if (editId) { await updateItem('budgets', '/budgets', editId, payload) }
    else { await addItem('budgets', '/budgets', payload) }
  }

  // Delete wrappers with endpoint
  const handleDelete = useCallback((key, id) => {
    const endpoints = { txs: '/transactions', accounts: '/accounts', goals: '/goals', debts: '/debts', budgets: '/budgets' }
    deleteItem(key, endpoints[key], id)
  }, [deleteItem])

  // Update wrapper
  const handleUpdate = useCallback(async (key, id, payload) => {
    const endpoints = { txs: '/transactions', accounts: '/accounts', goals: '/goals', debts: '/debts', budgets: '/budgets' }
    const item = await api.put(`${endpoints[key]}/${id}`, payload)
    setData(prev => ({ ...prev, [key]: (prev[key] || []).map(x => (x._id || x.id) === id ? { ...x, ...item } : x) }))
  }, [])

  // FIX 4: Account guard on Add Transaction
  const handleAddTxClick = () => {
    const hasAccounts = (data.accounts || []).length > 0
    if (!hasAccounts) { setShowGuard(true); return }
    setEditing(null); setModal('addTx')
  }

  const closeModal = () => { setModal(null); setEditing(null) }

  // ── Loading splash ─────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ fontFamily: 'Outfit,sans-serif', color: C.text, background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{CSS}</style>
        <Spinner />
      </div>
    )
  }

  // ── Not authenticated → show Login / Register ──────────────────
  if (!isAuthenticated) {
    return (
      <>
        <style>{CSS}</style>
        {authScreen === 'login'
          ? <LoginScreen onGoToRegister={() => setAuthScreen('register')} />
          : <OnboardingScreen onGoToLogin={() => setAuthScreen('login')} />
        }
      </>
    )
  }

  // ── Settings screen ────────────────────────────────────────────
  if (tab === 'settings') {
    return (
      <div className="bm-app-shell" style={{ fontFamily: 'Outfit,sans-serif', color: C.text }}>
        <style>{CSS}</style>
        <aside className="bm-sidebar">
          <SidebarNav tab={tab} setTab={setTab} onAddTx={() => {}} />
        </aside>
        <main className="bm-main-content" style={{ paddingBottom: 0 }}>
          <SettingsScreen onBack={() => setTab('dashboard')} />
        </main>
      </div>
    )
  }

  // ── Main App ───────────────────────────────────────────────────
  return (
    <div className="bm-app-shell" style={{ fontFamily: 'Outfit,sans-serif', color: C.text }}>
      <style>{CSS}</style>

      {/* Sidebar — desktop only, hidden on mobile via CSS */}
      <aside className="bm-sidebar">
        <SidebarNav tab={tab} setTab={setTab} onAddTx={handleAddTxClick} />
      </aside>

      {/* Main scrollable content area */}
      <main className="bm-main-content">
        {dataLoading
          ? <Spinner />
          : (
            <>
              {tab === 'dashboard' && <Dashboard data={data} setTab={setTab} setModal={setModal} setEditing={setEditing} onAddTxClick={handleAddTxClick} />}
              {tab === 'transactions' && <Transactions data={data} deleteItem={handleDelete} setModal={setModal} setEditing={setEditing} onAddClick={handleAddTxClick} />}
              {tab === 'accounts' && <Accounts data={data} deleteItem={handleDelete} setModal={setModal} setEditing={setEditing} />}
              {tab === 'goals' && <Goals data={data} deleteItem={handleDelete} setModal={setModal} setEditing={setEditing} />}
              {tab === 'debts' && <Debts data={data} deleteItem={handleDelete} updateItem={handleUpdate} debtTab={debtTab} setDebtTab={setDebtTab} setModal={setModal} setEditing={setEditing} />}
            </>
          )
        }
      </main>

      {/* Bottom Nav — mobile only, hidden on desktop via CSS */}
      <div className="bm-bottom-nav-wrapper">
        <BottomNav tab={tab} setTab={setTab} />
      </div>

      {/* Modals */}
      {modal === 'addTx' && <AddTxModal data={data} onSave={handleSaveTx} editing={editing} onClose={closeModal} />}
      {modal === 'addAcc' && <AddAccModal data={data} onSave={handleSaveAcc} editing={editing} onClose={closeModal} />}
      {modal === 'addGoal' && <AddGoalModal data={data} onSave={handleSaveGoal} editing={editing} onClose={closeModal} />}
      {modal === 'addMoney' && editing && <AddMoneyModal data={data} updateItem={handleUpdate} goal={editing} onClose={closeModal} />}
      {modal === 'addDebt' && <AddDebtModal data={data} onSave={handleSaveDebt} editing={editing} onClose={closeModal} />}
      {modal === 'addBudget' && <AddBudgetModal data={data} onSave={handleSaveBudget} editing={editing} onClose={closeModal} />}

      {/* Account guard modal */}
      {showGuard && (
        <AccountGuardModal
          onAddAccount={() => { setShowGuard(false); setEditing(null); setTab('accounts'); setModal('addAcc') }}
          onClose={() => setShowGuard(false)}
        />
      )}
    </div>
  )
}

// ── Root App — wraps everything in AuthProvider ────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
