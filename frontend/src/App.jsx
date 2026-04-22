import { useState, useEffect, useCallback } from "react"

// ── storage key & helpers ─────────────────────────────────────────
const SK = 'budgetmaster_v1'
const uid = () => Math.random().toString(36).slice(2, 9)
const todayStr = () => new Date().toISOString().slice(0, 10)
const fmt = n => Math.abs(Math.round(Number(n) || 0)).toLocaleString('en-IN')
const pct = (a, b) => b > 0 ? Math.min(100, Math.round((Number(a) / Number(b)) * 100)) : 0
const daysLeft = d => { if (!d) return null; const diff = Math.ceil((new Date(d) - new Date()) / 86400000); return diff }
const isOverdue = d => d && new Date(d) < new Date()

const A1 = 'acc_1', A2 = 'acc_2'
const seed = () => ({
  pin: null, pinSet: false,
  accounts: [
    { id: A1, name: 'HDFC Savings', type: 'Bank', ob: 38500, icon: '🏦', color: '#4C9AFF' },
    { id: A2, name: 'Cash Wallet', type: 'Cash', ob: 3200, icon: '💵', color: '#10E8A0' },
  ],
  txs: [
    { id: 't1', desc: 'Salary Credit', amount: 82000, type: 'income', cat: 'Salary', accId: A1, date: '2025-04-01', note: '' },
    { id: 't2', desc: 'Swiggy Order', amount: 320, type: 'expense', cat: 'Food', accId: A1, date: '2025-04-22', note: '' },
    { id: 't3', desc: 'Uber Ride', amount: 180, type: 'expense', cat: 'Transport', accId: A2, date: '2025-04-22', note: '' },
    { id: 't4', desc: 'Netflix', amount: 649, type: 'expense', cat: 'Entertainment', accId: A1, date: '2025-04-21', note: 'Monthly sub' },
    { id: 't5', desc: 'Grocery Store', amount: 1400, type: 'expense', cat: 'Food', accId: A1, date: '2025-04-19', note: '' },
  ],
  goals: [
    { id: 'g1', name: 'New Laptop', target: 50000, saved: 39000, icon: '💻', color: '#4C9AFF', deadline: '2025-06-30' },
    { id: 'g2', name: 'Goa Trip', target: 30000, saved: 10500, icon: '✈️', color: '#10E8A0', deadline: '' },
  ],
  debts: [
    { id: 'd1', person: 'Rahul', amount: 1500, remaining: 1500, type: 'owe_me', due: '2025-06-15', note: 'Split dinner at Smoke House', paid: false },
    { id: 'd2', person: 'Priya', amount: 3200, remaining: 3200, type: 'owe_me', due: '2025-05-01', note: 'Flight tickets to Goa', paid: false },
    { id: 'd3', person: 'Arjun', amount: 800, remaining: 800, type: 'i_owe', due: '2025-06-20', note: 'Movie + dinner', paid: false },
  ],
  budgets: [
    { id: 'b1', cat: 'Food', limit: 5000 },
    { id: 'b2', cat: 'Transport', limit: 2000 },
    { id: 'b3', cat: 'Entertainment', limit: 1000 },
  ],
})

const CATS = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Health', 'Bills', 'Education', 'Salary', 'Freelance', 'Investment', 'Transfer', 'Other']
const ACC_COLORS = ['#4C9AFF', '#10E8A0', '#A78BFA', '#FFB020', '#FF5A6A', '#14B8A6', '#F97316', '#EC4899']
const ACC_ICONS = ['🏦', '💵', '💳', '👛', '📈', '🏧', '💰', '🪙']
const GOAL_ICONS = ['💻', '✈️', '🏠', '🚗', '📱', '🎓', '🏋️', '💍', '🎮', '⌚', '🎸', '🌍']

// computed account balance = opening balance + all income txs - all expense txs
const getbal = (acc, txs) => {
  const at = txs.filter(t => t.accId === acc.id)
  return (acc.ob || 0)
    + at.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
    - at.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
}

// ── design tokens ────────────────────────────────────────────────
const C = { bg: '#0A0E19', surf: '#111827', surf2: '#1A2235', bdr: 'rgba(255,255,255,0.07)', text: '#E8F0FE', muted: '#5A6A88', green: '#10E8A0', blue: '#4C9AFF', violet: '#A78BFA', gold: '#FFB020', red: '#FF5A6A' }
const inp = { width: '100%', padding: '11px 13px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 11, color: C.text, fontFamily: 'Outfit,sans-serif', fontSize: 14, outline: 'none', marginBottom: 10, boxSizing: 'border-box' }
const gbtn = (c, fill = true, mb = 8) => ({ width: '100%', padding: '13px', background: fill ? c : `${c}18`, border: `1px solid ${fill ? c : `${c}30`}`, borderRadius: 13, color: fill ? '#0A0E19' : c, fontSize: 14, fontWeight: 600, fontFamily: 'Outfit,sans-serif', cursor: 'pointer', marginBottom: mb, display: 'block' })

// ── CSS injected once ────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');
* { box-sizing: border-box; }
@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
@keyframes fadeUp { from { opacity:0;transform:translateY(10px) } to { opacity:1;transform:translateY(0) } }
@keyframes prgFill { from { width: 0 } }
@keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
@keyframes scaleIn { from { opacity:0;transform:scale(0.93) } to { opacity:1;transform:scale(1) } }
.bm-fu { animation: fadeUp 0.35s ease both }
.bm-prg { animation: prgFill 0.9s ease both }
.bm-spin { animation: spin 3s linear infinite; transform-origin: 34px 8px }
::-webkit-scrollbar { display:none }
input, select, textarea { color: #E8F0FE !important; }
input::placeholder, textarea::placeholder { color: #5A6A88 !important; }
option { background: #111827; }
input[type=range] { accent-color: #10E8A0; }
`

// ── Logo ─────────────────────────────────────────────────────────
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

// ── Modal ────────────────────────────────────────────────────────
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

function Lbl({ t }) { return <div style={{ fontSize: 12, color: C.muted, marginBottom: 5, paddingLeft: 2 }}>{t}</div> }

// ── PIN numpad ──────────────────────────────────────────────────
function Numpad({ onTap }) {
  const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫']
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 72px)', gap: 12, justifyContent: 'center' }}>
      {keys.map((k, i) => (
        <button key={i} onClick={() => k !== '' && onTap(String(k))}
          style={{ width: 72, height: 72, borderRadius: '50%', background: k === '' ? 'transparent' : 'rgba(255,255,255,0.06)', border: k === '' ? 'none' : '1px solid rgba(255,255,255,0.09)', color: C.text, fontSize: k === '⌫' ? 20 : 22, fontWeight: 500, cursor: k === '' ? 'default' : 'pointer', fontFamily: 'Outfit,sans-serif', pointerEvents: k === '' ? 'none' : 'auto', transition: 'all 0.12s' }}>
          {k}
        </button>
      ))}
    </div>
  )
}

function PinDots({ count, err, color = C.green }) {
  return (
    <div style={{ display: 'flex', gap: 18, justifyContent: 'center', animation: err ? 'shake 0.4s' : '', marginBottom: 6 }}>
      {[0, 1, 2, 3].map(i => {
        const f = i < count
        const ec = err ? C.red : color
        return <div key={i} style={{ width: 14, height: 14, borderRadius: '50%', background: f ? ec : 'rgba(255,255,255,0.14)', border: `2px solid ${f ? ec : 'rgba(255,255,255,0.2)'}`, transition: 'all 0.15s', transform: err ? 'scale(1.15)' : 'scale(1)' }} />
      })}
    </div>
  )
}

// ── PIN Setup Screen ─────────────────────────────────────────────
function PinSetup({ onDone, onSkip }) {
  const [step, setStep] = useState(1)
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [err, setErr] = useState('')
  const cur = step === 1 ? p1 : p2
  const setCur = step === 1 ? setP1 : setP2
  const tap = k => {
    if (k === '⌫') { setCur(p => p.slice(0, -1)); setErr(''); return }
    if (cur.length >= 4) return
    const np = cur + k; setCur(np)
    if (np.length === 4) {
      if (step === 1) { setTimeout(() => setStep(2), 250) }
      else {
        if (np !== p1) { setErr('PINs do not match'); setTimeout(() => { setP2(''); setErr('') }, 900) }
        else { onDone(np) }
      }
    }
  }
  return (
    <div style={{ background: C.bg, minHeight: 580, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '44px 24px 32px', fontFamily: 'Outfit,sans-serif', color: C.text }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div style={{ transform: 'scale(1.9)', marginBottom: 10 }}><Logo sz={40} spin /></div>
        <div style={{ fontSize: 26, fontWeight: 700, marginTop: 22 }}>BudgetMaster</div>
        <div style={{ fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 1.5 }}>
          {step === 1 ? 'Create a 4-digit PIN to protect your finances' : 'Confirm your PIN'}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>Step {step} of 2</div>
      </div>
      <div style={{ width: '100%' }}>
        <PinDots count={step === 1 ? p1.length : p2.length} err={!!err} />
        {err && <div style={{ textAlign: 'center', fontSize: 12, color: C.red, marginBottom: 6 }}>{err}</div>}
        <div style={{ height: 16 }} />
        <Numpad onTap={tap} />
        <button onClick={onSkip} style={{ ...gbtn(C.muted, false, 0), marginTop: 20, opacity: 0.6 }}>Skip PIN (not recommended)</button>
      </div>
    </div>
  )
}

// ── Lock Screen ──────────────────────────────────────────────────
function LockScreen({ data, storedPin, onUnlock, onReset }) {
  const [pin, setPin] = useState('')
  const [err, setErr] = useState(false)
  const [forgot, setForgot] = useState(false)
  const [ans, setAns] = useState('')

  const hasTxs = data.txs && data.txs.length > 0
  const qType = hasTxs ? 'tx' : 'acc'
  
  const handleAns = () => {
    let correct = false;
    if (qType === 'tx') {
      const latest = [...data.txs].sort((a,b) => b.date.localeCompare(a.date))[0]
      if (ans.trim() === String(latest.amount)) correct = true;
    } else {
      const a = data.accounts[0]
      if (a && ans.trim().toLowerCase() === a.name.toLowerCase()) correct = true;
      else if (!a) correct = true; // No accounts, just let them in
    }
    
    if (correct) onReset()
    else { setErr(true); setTimeout(() => setErr(false), 1500) }
  }

  const tap = k => {
    if (k === '⌫') { setPin(p => p.slice(0, -1)); setErr(false); return }
    if (pin.length >= 4) return
    const np = pin + k; setPin(np)
    if (np.length === 4) {
      if (np === storedPin) { onUnlock() }
      else { setErr(true); setTimeout(() => { setPin(''); setErr(false) }, 800) }
    }
  }

  if (forgot) {
    return (
      <div style={{ background: `linear-gradient(160deg,#0D1824,#0A0E19 55%,#0A1A10)`, minHeight: 580, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', fontFamily: 'Outfit,sans-serif', color: C.text }}>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Security Verification</div>
        <div style={{ fontSize: 13, color: C.muted, textAlign: 'center', marginBottom: 24, lineHeight: 1.5 }}>
          {qType === 'tx' ? "To reset your PIN, please enter the exact amount of your most recent transaction." : "To reset your PIN, please enter the exact name of your first account."}
        </div>
        <input style={{ ...inp, textAlign: 'center', fontSize: 18 }} value={ans} onChange={e=>setAns(e.target.value)} placeholder="Type answer here" autoFocus />
        {err && <div style={{ color: C.red, fontSize: 12, marginBottom: 12 }}>Incorrect answer. Try again.</div>}
        <button style={{ ...gbtn(C.green), marginTop: 8 }} onClick={handleAns}>Verify & Reset</button>
        <button style={gbtn(C.muted, false)} onClick={() => { setForgot(false); setAns(''); setErr(false) }}>Cancel</button>
      </div>
    )
  }

  return (
    <div style={{ background: `linear-gradient(160deg,#0D1824,#0A0E19 55%,#0A1A10)`, minHeight: 580, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '48px 24px 32px', fontFamily: 'Outfit,sans-serif', color: C.text }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div style={{ transform: 'scale(2.1)', marginBottom: 12 }}><Logo sz={40} spin /></div>
        <div style={{ fontSize: 26, fontWeight: 700, marginTop: 24 }}>BudgetMaster</div>
        <div style={{ fontSize: 14, color: C.muted }}>Enter PIN to continue</div>
      </div>
      <div style={{ width: '100%' }}>
        <PinDots count={pin.length} err={err} />
        {err && <div style={{ textAlign: 'center', fontSize: 12, color: C.red, marginBottom: 4 }}>Incorrect PIN. Try again.</div>}
        <div style={{ height: 18 }} />
        <Numpad onTap={tap} />
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button onClick={() => setForgot(true)} style={{ background: 'none', border: 'none', color: C.green, fontSize: 13, cursor: 'pointer', fontFamily: 'Outfit,sans-serif' }}>Forgot PIN?</button>
        </div>
      </div>
    </div>
  )
}

// ── Card wrapper ─────────────────────────────────────────────────
function Card({ children, style = {} }) {
  return <div style={{ background: C.surf, borderRadius: 18, border: `1px solid ${C.bdr}`, padding: '15px 16px', ...style }}>{children}</div>
}

// ── Section header ───────────────────────────────────────────────
function SHead({ title, action, onAction }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
      <span style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{title}</span>
      {action && <button onClick={onAction} style={{ background: 'none', border: 'none', color: C.green, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit,sans-serif' }}>{action}</button>}
    </div>
  )
}

// ── Progress bar ─────────────────────────────────────────────────
function ProgBar({ pct: p, color = C.green, h = 5 }) {
  return (
    <div style={{ height: h, background: 'rgba(255,255,255,0.07)', borderRadius: h / 2, overflow: 'hidden' }}>
      <div className="bm-prg" style={{ height: '100%', width: `${Math.min(100, p)}%`, background: color, borderRadius: h / 2 }} />
    </div>
  )
}

// ── Dashboard ────────────────────────────────────────────────────
function Dashboard({ data, update, setTab, setModal, setEditing }) {
  const mTxs = data.txs.filter(t => t.date >= new Date().toISOString().slice(0, 7) + '-01')
  const income = mTxs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const expense = mTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const balance = income - expense
  const netWorth = data.accounts.reduce((s, a) => s + getbal(a, data.txs), 0)
  const daysInM = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
  const dayNum = new Date().getDate()
  const dLeft = daysInM - dayNum
  const burnRate = dLeft > 0 ? Math.round(balance / dLeft) : 0
  const burnPct = Math.round((dLeft / daysInM) * 100)
  const burnColor = burnRate < 0 ? C.red : burnRate < 200 ? C.gold : C.green
  const hr = new Date().getHours()
  const greet = hr < 12 ? 'Good morning ☀️' : hr < 17 ? 'Good afternoon 🌤️' : 'Good evening 🌙'
  const catSpend = cat => mTxs.filter(t => t.type === 'expense' && t.cat === cat).reduce((s, t) => s + Number(t.amount), 0)
  const recent = [...data.txs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)
  const overdue = data.debts.filter(d => !d.paid && isOverdue(d.due))

  return (
    <div style={{ overflowY: 'auto', paddingBottom: 8 }}>
      {/* Header */}
      <div className="bm-fu" style={{ padding: '16px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo sz={30} />
          <div>
            <div style={{ fontSize: 11, color: C.muted }}>{greet}</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>BudgetMaster</div>
          </div>
        </div>
        <button onClick={() => { setModal('addTx'); setEditing(null) }}
          style={{ width: 36, height: 36, borderRadius: '50%', background: `${C.green}18`, border: `1px solid ${C.green}30`, color: C.green, fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 300 }}>+</button>
      </div>

      {/* Hero balance card */}
      <div className="bm-fu" style={{ margin: '14px 16px 0', padding: '20px', background: 'linear-gradient(135deg,#152535,#0E1D2E 50%,#0A1520)', borderRadius: 22, border: `1px solid rgba(16,232,160,0.12)`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, background: 'radial-gradient(circle,rgba(16,232,160,0.07) 0%,transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>
          {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} · Net Worth ₹{fmt(netWorth)}
        </div>
        <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -1, marginBottom: 16 }}>₹{fmt(balance)}</div>
        <div style={{ display: 'flex', borderTop: `1px solid rgba(255,255,255,0.07)`, paddingTop: 14, gap: 0 }}>
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

      {/* Burn rate */}
      <div className="bm-fu" style={{ margin: '12px 16px 0' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>Daily Budget Left</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: burnColor }}>₹{fmt(burnRate)}<span style={{ fontSize: 13, fontWeight: 400, color: C.muted }}>/day</span></div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>{burnPct}% of month left</div>
              <div style={{ width: 110 }}><ProgBar pct={burnPct} color={burnColor} h={6} /></div>
              <div style={{ fontSize: 11, color: burnColor, marginTop: 4, fontWeight: 600 }}>{burnRate < 0 ? 'Over budget ⚠️' : burnRate < 200 ? 'Careful 🟡' : 'On track 🎯'}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Budgets */}
      {data.budgets.length > 0 && (
        <div className="bm-fu" style={{ margin: '12px 16px 0' }}>
          <Card>
            <SHead title="Budgets" action="View Transactions" onAction={() => setTab('transactions')} />
            {data.budgets.slice(0, 3).map(b => {
              const spent = catSpend(b.cat)
              const p = pct(spent, b.limit)
              const bc = p >= 90 ? C.red : p >= 70 ? C.gold : C.green
              return (
                <div key={b.id} style={{ marginBottom: 13 }}>
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
            <button onClick={() => { setModal('addBudget'); setEditing(null) }}
              style={{ ...gbtn(C.blue, false, 0), padding: '9px', fontSize: 12, marginTop: 4 }}>+ Add Budget Category</button>
          </Card>
        </div>
      )}

      {/* Goals snapshot */}
      {data.goals.length > 0 && (
        <div className="bm-fu" style={{ margin: '12px 16px 0' }}>
          <Card>
            <SHead title="Goals 🎯" action="See all" onAction={() => setTab('goals')} />
            {data.goals.slice(0, 2).map(g => {
              const p = pct(g.saved, g.target)
              return (
                <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: `${g.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>{g.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{g.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: g.color }}>{p}%</span>
                    </div>
                    <ProgBar pct={p} color={g.color} />
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>₹{fmt(g.saved)} of ₹{fmt(g.target)}</div>
                  </div>
                </div>
              )
            })}
          </Card>
        </div>
      )}

      {/* Overdue debt alert */}
      {overdue.length > 0 && (
        <div onClick={() => setTab('debts')} className="bm-fu" style={{ margin: '12px 16px 0', padding: '13px 16px', background: `${C.red}0d`, border: `1px solid ${C.red}28`, borderRadius: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>⚠️  {overdue.length} debt{overdue.length > 1 ? 's' : ''} overdue</span>
          <span style={{ fontSize: 12, color: C.red }}>View →</span>
        </div>
      )}

      {/* Recent transactions */}
      <div className="bm-fu" style={{ margin: '12px 16px 0' }}>
        <Card>
          <SHead title="Recent Transactions" action="View all" onAction={() => setTab('transactions')} />
          {recent.length === 0 && <div style={{ fontSize: 13, color: C.muted, textAlign: 'center', padding: '16px 0' }}>No transactions yet. Tap + to add one.</div>}
          {recent.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
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
          ))}
        </Card>
      </div>
    </div>
  )
}

// ── Transactions Screen ──────────────────────────────────────────
function Transactions({ data, update, setModal, setEditing }) {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const sorted = [...data.txs]
    .filter(t => filter === 'all' || t.type === filter)
    .filter(t => !search || t.desc.toLowerCase().includes(search.toLowerCase()) || t.cat.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date))
  const del = id => update({ txs: data.txs.filter(t => t.id !== id) })
  const acc = id => data.accounts.find(a => a.id === id)

  return (
    <div style={{ padding: '16px 16px 0', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Transactions</div>
        <button onClick={() => { setEditing(null); setModal('addTx') }} style={{ ...gbtn(C.green, true, 0), width: 'auto', padding: '8px 16px', fontSize: 13 }}>+ Add</button>
      </div>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transactions..." style={{ ...inp }} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {['all', 'income', 'expense'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: `1px solid ${filter === f ? C.green : 'rgba(255,255,255,0.09)'}`, background: filter === f ? `${C.green}18` : 'transparent', color: filter === f ? C.green : C.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit,sans-serif', textTransform: 'capitalize' }}
          >{f}</button>
        ))}
      </div>
      {sorted.length === 0 && <div style={{ textAlign: 'center', color: C.muted, fontSize: 13, padding: '32px 0' }}>No transactions found.</div>}
      {sorted.map(t => {
        const a = acc(t.accId)
        return (
          <div key={t.id} className="bm-fu" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: C.surf, borderRadius: 14, border: `1px solid ${C.bdr}`, marginBottom: 8 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: t.type === 'income' ? `${C.green}14` : `${C.blue}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
              {t.type === 'income' ? '💰' : '💸'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.desc}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{t.cat}{a ? ` · ${a.icon}${a.name}` : ''} · {t.date}</div>
              {t.note && <div style={{ fontSize: 11, color: C.muted, fontStyle: 'italic' }}>{t.note}</div>}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: t.type === 'income' ? C.green : C.text }}>
                {t.type === 'income' ? '+' : '-'}₹{fmt(t.amount)}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 4, justifyContent: 'flex-end' }}>
                <button onClick={() => { setEditing(t); setModal('addTx') }}
                  style={{ background: 'none', border: 'none', color: C.blue, fontSize: 11, cursor: 'pointer', fontFamily: 'Outfit,sans-serif' }}>Edit</button>
                <button onClick={() => del(t.id)}
                  style={{ background: 'none', border: 'none', color: C.red, fontSize: 11, cursor: 'pointer', fontFamily: 'Outfit,sans-serif' }}>Delete</button>
              </div>
            </div>
          </div>
        )
      })}
      <div style={{ height: 12 }} />
    </div>
  )
}

// ── Accounts Screen ──────────────────────────────────────────────
function Accounts({ data, update, setModal, setEditing }) {
  const netWorth = data.accounts.reduce((s, a) => s + getbal(a, data.txs), 0)
  const del = id => {
    if (data.txs.some(t => t.accId === id)) { alert('Cannot delete account with transactions. Delete transactions first.'); return }
    update({ accounts: data.accounts.filter(a => a.id !== id) })
  }

  return (
    <div style={{ padding: '16px 16px 0', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Accounts</div>
        <button onClick={() => { setEditing(null); setModal('addAcc') }} style={{ ...gbtn(C.green, true, 0), width: 'auto', padding: '8px 16px', fontSize: 13 }}>+ Add</button>
      </div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>Net Worth: <span style={{ color: netWorth >= 0 ? C.green : C.red, fontWeight: 700 }}>₹{fmt(netWorth)}</span></div>
      {data.accounts.map(a => {
        const bal = getbal(a, data.txs)
        const atxs = data.txs.filter(t => t.accId === a.id)
        return (
          <div key={a.id} className="bm-fu" style={{ background: C.surf, borderRadius: 18, border: `1px solid ${a.color}22`, padding: '16px', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: `${a.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{a.icon}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{a.type} · {atxs.length} transactions</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: bal < 0 ? C.red : a.color }}>
                  {bal < 0 ? '-' : ''}₹{fmt(bal)}
                </div>
                <div style={{ fontSize: 10, color: C.muted }}>Opening: ₹{fmt(a.ob)}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setEditing(a); setModal('addAcc') }}
                style={{ flex: 1, padding: '8px', background: `${a.color}12`, border: `1px solid ${a.color}28`, borderRadius: 10, color: a.color, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit,sans-serif' }}>Edit</button>
              <button onClick={() => del(a.id)}
                style={{ flex: 1, padding: '8px', background: `${C.red}0d`, border: `1px solid ${C.red}22`, borderRadius: 10, color: C.red, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit,sans-serif' }}>Delete</button>
            </div>
          </div>
        )
      })}
      {data.accounts.length === 0 && <div style={{ textAlign: 'center', color: C.muted, fontSize: 13, padding: '32px 0' }}>No accounts yet. Add one to get started.</div>}
      <div style={{ height: 12 }} />
    </div>
  )
}

// ── Goals Screen ─────────────────────────────────────────────────
function Goals({ data, update, setModal, setEditing }) {
  const totalSaved = data.goals.reduce((s, g) => s + Number(g.saved), 0)
  const totalTarget = data.goals.reduce((s, g) => s + Number(g.target), 0)
  const overallPct = pct(totalSaved, totalTarget)
  const del = id => update({ goals: data.goals.filter(g => g.id !== id) })

  return (
    <div style={{ padding: '16px 16px 0', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Goals 🎯</div>
        <button onClick={() => { setEditing(null); setModal('addGoal') }} style={{ ...gbtn(C.green, true, 0), width: 'auto', padding: '8px 16px', fontSize: 13 }}>+ New Goal</button>
      </div>
      {data.goals.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: C.muted }}>₹{fmt(totalSaved)} saved of ₹{fmt(totalTarget)}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.green }}>{overallPct}%</span>
          </div>
          <ProgBar pct={overallPct} color={`linear-gradient(90deg,${C.green},${C.blue},${C.violet})`} h={7} />
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {data.goals.map(g => {
          const p = pct(g.saved, g.target)
          const dl = daysLeft(g.deadline)
          return (
            <div key={g.id} className="bm-fu" style={{ background: C.surf, borderRadius: 18, border: `1px solid ${C.bdr}`, padding: '14px 13px' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{g.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>₹{fmt(g.saved)} / ₹{fmt(g.target)}</div>
              <ProgBar pct={p} color={g.color} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, marginBottom: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: g.color }}>{p}%</span>
                {dl !== null && <span style={{ fontSize: 10, color: dl < 14 ? C.red : C.muted }}>🔥 {dl}d left</span>}
                {dl === null && <span style={{ fontSize: 10, color: C.muted }}>No deadline</span>}
                {p >= 100 && <span style={{ fontSize: 10, color: C.green }}>✅ Done!</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button onClick={() => { setEditing(g); setModal('addMoney') }}
                  style={{ width: '100%', padding: '8px', background: `${g.color}14`, border: `1px solid ${g.color}28`, borderRadius: 10, color: g.color, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit,sans-serif' }}>+ Add Money</button>
                <div style={{ display: 'flex', gap: 5 }}>
                  <button onClick={() => { setEditing(g); setModal('addGoal') }}
                    style={{ flex: 1, padding: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, color: C.muted, fontSize: 11, cursor: 'pointer', fontFamily: 'Outfit,sans-serif' }}>Edit</button>
                  <button onClick={() => del(g.id)}
                    style={{ flex: 1, padding: '6px', background: `${C.red}0a`, border: `1px solid ${C.red}20`, borderRadius: 9, color: C.red, fontSize: 11, cursor: 'pointer', fontFamily: 'Outfit,sans-serif' }}>Delete</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {data.goals.length === 0 && <div style={{ textAlign: 'center', color: C.muted, fontSize: 13, padding: '32px 0' }}>No goals yet. Create one to start saving!</div>}
      <div style={{ height: 12 }} />
    </div>
  )
}

// ── Debts Screen ─────────────────────────────────────────────────
function Debts({ data, update, debtTab, setDebtTab, setModal, setEditing }) {
  const list = data.debts.filter(d => d.type === debtTab && !d.paid)
  const settled = data.debts.filter(d => d.paid)
  const oweMe = data.debts.filter(d => d.type === 'owe_me' && !d.paid).reduce((s, d) => s + Number(d.remaining), 0)
  const iOwe = data.debts.filter(d => d.type === 'i_owe' && !d.paid).reduce((s, d) => s + Number(d.remaining), 0)
  const markPaid = id => update({ debts: data.debts.map(d => d.id === id ? { ...d, paid: true, remaining: 0 } : d) })
  const del = id => update({ debts: data.debts.filter(d => d.id !== id) })
  const col = debtTab === 'owe_me' ? C.green : C.red

  return (
    <div style={{ padding: '16px 16px 0', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Debts 💳</div>
        <button onClick={() => { setEditing(null); setModal('addDebt') }} style={{ ...gbtn(C.green, true, 0), width: 'auto', padding: '8px 16px', fontSize: 13 }}>+ Add</button>
      </div>

      {/* Summary bar */}
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

      {/* Tab toggle */}
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 13, padding: 3, border: `1px solid ${C.bdr}`, marginBottom: 14 }}>
        {[['owe_me', '🟢 Owe Me'], ['i_owe', '🔴 I Owe']].map(([k, l]) => (
          <button key={k} onClick={() => setDebtTab(k)}
            style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', fontFamily: 'Outfit,sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: debtTab === k ? (k === 'owe_me' ? C.green : C.red) : 'transparent', color: debtTab === k ? (k === 'owe_me' ? '#0A0E19' : '#fff') : C.muted, transition: 'all 0.2s' }}>
            {l}
          </button>
        ))}
      </div>

      {list.length === 0 && <div style={{ textAlign: 'center', color: C.muted, fontSize: 13, padding: '24px 0' }}>No {debtTab === 'owe_me' ? '"owe me"' : '"I owe"'} debts. Tap + to add one.</div>}
      {list.map(d => {
        const over = isOverdue(d.due)
        return (
          <div key={d.id} className="bm-fu" style={{ background: C.surf, borderRadius: 18, border: `1px solid ${over ? `${C.red}35` : C.bdr}`, padding: '15px', marginBottom: 11, position: 'relative' }}>
            {over && <div style={{ position: 'absolute', top: 13, right: 13, fontSize: 10, fontWeight: 700, padding: '3px 8px', background: `${C.red}18`, color: C.red, borderRadius: 6, letterSpacing: '0.5px' }}>OVERDUE</div>}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, marginBottom: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${col}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: col, flexShrink: 0 }}>{d.person.charAt(0).toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{d.person}</div>
                <div style={{ fontSize: 11, color: C.muted }}>Due {d.due || 'No date'}</div>
                {d.note && <div style={{ fontSize: 12, color: C.muted, fontStyle: 'italic', marginTop: 2 }}>"{d.note}"</div>}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 19, fontWeight: 700, color: col }}>₹{fmt(d.remaining)}</div>
                {d.remaining < d.amount && <div style={{ fontSize: 10, color: C.muted }}>of ₹{fmt(d.amount)}</div>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 7 }}>
              <button onClick={() => { setEditing(d); setModal('partPay') }}
                style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, color: C.muted, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit,sans-serif' }}>Part Pay</button>
              <button onClick={() => markPaid(d.id)}
                style={{ flex: 1, padding: '8px', background: `${col}14`, border: `1px solid ${col}28`, borderRadius: 9, color: col, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit,sans-serif' }}>✓ Mark Paid</button>
              <button onClick={() => del(d.id)}
                style={{ flex: 1, padding: '8px', background: `${C.red}0a`, border: `1px solid ${C.red}20`, borderRadius: 9, color: C.red, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit,sans-serif' }}>Delete</button>
            </div>
          </div>
        )
      })}
      {settled.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>✅ Settled ({settled.length})</div>
          {settled.map(d => (
            <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, marginBottom: 6, opacity: 0.6 }}>
              <div><span style={{ fontSize: 13, fontWeight: 500 }}>{d.person}</span><span style={{ fontSize: 11, color: C.muted, marginLeft: 8 }}>{d.note}</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, textDecoration: 'line-through', color: C.muted }}>₹{fmt(d.amount)}</span>
                <button onClick={() => del(d.id)} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 11, cursor: 'pointer', fontFamily: 'Outfit,sans-serif' }}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{ height: 12 }} />
    </div>
  )
}

// ── Add Transaction Modal ────────────────────────────────────────
function AddTxModal({ data, update, editing, onClose }) {
  const [form, setForm] = useState({
    desc: editing?.desc || '', amount: editing?.amount || '', type: editing?.type || 'expense',
    cat: editing?.cat || 'Food', accId: editing?.accId || data.accounts[0]?.id || '',
    date: editing?.date || todayStr(), note: editing?.note || ''
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const save = () => {
    if (!form.desc.trim() || !form.amount || !form.accId) return
    const tx = { id: editing?.id || uid(), ...form, amount: Number(form.amount) }
    const txs = editing ? data.txs.map(t => t.id === editing.id ? tx : t) : [...data.txs, tx]
    update({ txs }); onClose()
  }
  return (
    <Modal title={editing ? 'Edit Transaction' : 'Add Transaction'} onClose={onClose}>
      <Lbl t="Description" /><input style={inp} value={form.desc} onChange={e => set('desc', e.target.value)} placeholder="e.g. Swiggy order" />
      <Lbl t="Amount (₹)" /><input style={inp} type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0" min="0" />
      <Lbl t="Type" />
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        {['expense', 'income'].map(t => (
          <button key={t} onClick={() => set('type', t)}
            style={{ flex: 1, padding: '11px', borderRadius: 11, border: `1px solid ${form.type === t ? (t === 'income' ? C.green : C.red) : 'rgba(255,255,255,0.1)'}`, background: form.type === t ? (t === 'income' ? `${C.green}18` : `${C.red}18`) : 'transparent', color: form.type === t ? (t === 'income' ? C.green : C.red) : C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit,sans-serif', textTransform: 'capitalize' }}>
            {t === 'income' ? '↑ Income' : '↓ Expense'}
          </button>
        ))}
      </div>
      <Lbl t="Category" />
      <select style={{ ...inp }} value={form.cat} onChange={e => set('cat', e.target.value)}>
        {CATS.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <Lbl t="Account" />
      <select style={{ ...inp }} value={form.accId} onChange={e => set('accId', e.target.value)}>
        {data.accounts.map(a => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
      </select>
      <Lbl t="Date" /><input style={inp} type="date" value={form.date} onChange={e => set('date', e.target.value)} />
      <Lbl t="Note (optional)" /><input style={inp} value={form.note} onChange={e => set('note', e.target.value)} placeholder="Optional note" />
      <button style={gbtn(C.green)} onClick={save}>{editing ? 'Save Changes' : 'Add Transaction'}</button>
    </Modal>
  )
}

// ── Add Account Modal ─────────────────────────────────────────────
function AddAccModal({ data, update, editing, onClose }) {
  const [form, setForm] = useState({
    name: editing?.name || '', type: editing?.type || 'Bank',
    ob: editing?.ob || 0, icon: editing?.icon || '🏦', color: editing?.color || ACC_COLORS[0]
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const save = () => {
    if (!form.name.trim()) return
    const acc = { id: editing?.id || uid(), ...form, ob: Number(form.ob) }
    const accounts = editing ? data.accounts.map(a => a.id === editing.id ? acc : a) : [...data.accounts, acc]
    update({ accounts }); onClose()
  }
  return (
    <Modal title={editing ? 'Edit Account' : 'Add Account'} onClose={onClose}>
      <Lbl t="Account Name" /><input style={inp} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. HDFC Savings" />
      <Lbl t="Type" />
      <select style={{ ...inp }} value={form.type} onChange={e => set('type', e.target.value)}>
        {['Cash', 'Bank', 'Credit Card', 'Wallet', 'Investment'].map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <Lbl t="Opening Balance (₹)" /><input style={inp} type="number" value={form.ob} onChange={e => set('ob', e.target.value)} placeholder="0" />
      <Lbl t="Icon" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        {ACC_ICONS.map(ic => (
          <button key={ic} onClick={() => set('icon', ic)}
            style={{ width: 42, height: 42, borderRadius: 12, background: form.icon === ic ? `${form.color}28` : 'rgba(255,255,255,0.05)', border: `1px solid ${form.icon === ic ? form.color : 'rgba(255,255,255,0.1)'}`, fontSize: 20, cursor: 'pointer' }}>{ic}</button>
        ))}
      </div>
      <Lbl t="Color" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {ACC_COLORS.map(c => (
          <button key={c} onClick={() => set('color', c)}
            style={{ width: 30, height: 30, borderRadius: '50%', background: c, border: form.color === c ? `3px solid white` : '3px solid transparent', cursor: 'pointer', transition: 'border 0.15s' }} />
        ))}
      </div>
      <button style={gbtn(C.green)} onClick={save}>{editing ? 'Save Changes' : 'Add Account'}</button>
    </Modal>
  )
}

// ── Add Goal Modal ───────────────────────────────────────────────
function AddGoalModal({ data, update, editing, onClose }) {
  const [form, setForm] = useState({
    name: editing?.name || '', target: editing?.target || '', saved: editing?.saved || 0,
    icon: editing?.icon || '🎯', color: editing?.color || C.blue, deadline: editing?.deadline || ''
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const save = () => {
    if (!form.name.trim() || !form.target) return
    const g = { id: editing?.id || uid(), ...form, target: Number(form.target), saved: Number(form.saved) }
    const goals = editing ? data.goals.map(x => x.id === editing.id ? g : x) : [...data.goals, g]
    update({ goals }); onClose()
  }
  return (
    <Modal title={editing ? 'Edit Goal' : 'New Goal'} onClose={onClose}>
      <Lbl t="Goal Name" /><input style={inp} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. New Laptop" />
      <Lbl t="Target Amount (₹)" /><input style={inp} type="number" value={form.target} onChange={e => set('target', e.target.value)} placeholder="50000" min="0" />
      <Lbl t="Already Saved (₹)" /><input style={inp} type="number" value={form.saved} onChange={e => set('saved', e.target.value)} placeholder="0" min="0" />
      <Lbl t="Deadline (optional)" /><input style={inp} type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} />
      <Lbl t="Icon" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        {GOAL_ICONS.map(ic => (
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
      <button style={gbtn(C.green)} onClick={save}>{editing ? 'Save Changes' : 'Create Goal'}</button>
    </Modal>
  )
}

// ── Add Money to Goal Modal ──────────────────────────────────────
function AddMoneyModal({ data, update, goal, onClose }) {
  const [amount, setAmount] = useState('')
  const save = () => {
    if (!amount || Number(amount) <= 0) return
    const goals = data.goals.map(g => g.id === goal.id ? { ...g, saved: Number(g.saved) + Number(amount) } : g)
    update({ goals }); onClose()
  }
  const p = pct(Number(goal.saved) + Number(amount || 0), goal.target)
  return (
    <Modal title={`Add Money — ${goal.name}`} onClose={onClose}>
      <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
        <div style={{ fontSize: 28, marginBottom: 6 }}>{goal.icon}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: goal.color }}>{p}%</div>
        <div style={{ fontSize: 12, color: C.muted }}>₹{fmt(Number(goal.saved) + Number(amount || 0))} of ₹{fmt(goal.target)}</div>
        <div style={{ marginTop: 10, marginBottom: 4 }}><ProgBar pct={p} color={goal.color} h={8} /></div>
      </div>
      <Lbl t="Amount to Add (₹)" />
      <input style={inp} type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 5000" autoFocus min="0" />
      <button style={gbtn(goal.color)} onClick={save}>Add ₹{fmt(amount || 0)} to Goal</button>
    </Modal>
  )
}

// ── Add Debt Modal ───────────────────────────────────────────────
function AddDebtModal({ data, update, editing, onClose }) {
  const [form, setForm] = useState({
    person: editing?.person || '', amount: editing?.amount || '', type: editing?.type || 'owe_me',
    due: editing?.due || '', note: editing?.note || ''
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const save = () => {
    if (!form.person.trim() || !form.amount) return
    const d = { id: editing?.id || uid(), ...form, amount: Number(form.amount), remaining: editing?.remaining ?? Number(form.amount), paid: editing?.paid || false }
    const debts = editing ? data.debts.map(x => x.id === editing.id ? d : x) : [...data.debts, d]
    update({ debts }); onClose()
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

// ── Part Pay Modal ───────────────────────────────────────────────
function PartPayModal({ data, update, debt, onClose }) {
  const [amount, setAmount] = useState('')
  const save = () => {
    if (!amount || Number(amount) <= 0) return
    const paid = Number(amount) >= Number(debt.remaining)
    const debts = data.debts.map(d => d.id === debt.id ? { ...d, remaining: Math.max(0, Number(d.remaining) - Number(amount)), paid } : d)
    update({ debts }); onClose()
  }
  return (
    <Modal title={`Partial Payment — ${debt.person}`} onClose={onClose}>
      <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>Remaining</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: debt.type === 'owe_me' ? C.green : C.red }}>₹{fmt(debt.remaining)}</div>
      </div>
      <Lbl t="Payment Amount (₹)" />
      <input style={inp} type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder={`Max ₹${fmt(debt.remaining)}`} max={debt.remaining} min="0" autoFocus />
      {amount && Number(amount) >= Number(debt.remaining) && (
        <div style={{ fontSize: 12, color: C.green, marginBottom: 8, marginTop: -4 }}>✅ This will fully settle the debt.</div>
      )}
      <button style={gbtn(C.green)} onClick={save}>Record Payment of ₹{fmt(amount || 0)}</button>
    </Modal>
  )
}

// ── Budget Modal ─────────────────────────────────────────────────
function AddBudgetModal({ data, update, editing, onClose }) {
  const [cat, setCat] = useState(editing?.cat || 'Food')
  const [limit, setLimit] = useState(editing?.limit || '')
  const save = () => {
    if (!limit) return
    const b = { id: editing?.id || uid(), cat, limit: Number(limit) }
    const budgets = editing ? data.budgets.map(x => x.id === editing.id ? b : x) : [...data.budgets, b]
    update({ budgets }); onClose()
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

// ── Bottom Nav ───────────────────────────────────────────────────
const NAV = [
  { id: 'dashboard', label: 'Home', icon: (a) => <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="1.5" y="1.5" width="8.5" height="8.5" rx="2.5" stroke={a ? C.green : C.muted} strokeWidth="1.7" /><rect x="12" y="1.5" width="8.5" height="8.5" rx="2.5" stroke={a ? C.green : C.muted} strokeWidth="1.7" fill={a ? `${C.green}20` : 'none'} /><rect x="1.5" y="12" width="8.5" height="8.5" rx="2.5" stroke={a ? C.green : C.muted} strokeWidth="1.7" /><rect x="12" y="12" width="8.5" height="8.5" rx="2.5" stroke={a ? C.green : C.muted} strokeWidth="1.7" /></svg> },
  { id: 'transactions', label: 'Transactions', icon: (a) => <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 6h16M3 11h10M3 16h13" stroke={a ? C.green : C.muted} strokeWidth="1.7" strokeLinecap="round" /><path d="M17 14l3 3-3 3" stroke={a ? C.green : C.muted} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg> },
  { id: 'accounts', label: 'Accounts', icon: (a) => <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="1.5" y="4.5" width="19" height="13" rx="2.5" stroke={a ? C.green : C.muted} strokeWidth="1.7" /><path d="M1.5 8.5h19" stroke={a ? C.green : C.muted} strokeWidth="1.7" /><circle cx="6" cy="13" r="1.5" fill={a ? C.green : C.muted} /><rect x="10" y="12" width="4" height="2.5" rx="1.25" fill={a ? `${C.green}70` : `${C.muted}70`} /></svg> },
  { id: 'goals', label: 'Goals', icon: (a) => <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="9" stroke={a ? C.green : C.muted} strokeWidth="1.7" /><circle cx="11" cy="11" r="5" stroke={a ? C.green : C.muted} strokeWidth="1.7" /><circle cx="11" cy="11" r="2" fill={a ? C.green : C.muted} /></svg> },
  { id: 'debts', label: 'Debts', icon: (a) => <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 2v18M6 6.5h7a3 3 0 010 6H7.5a3 3 0 000 6H15" stroke={a ? C.green : C.muted} strokeWidth="1.7" strokeLinecap="round" /></svg> },
]

function BottomNav({ tab, setTab }) {
  return (
    <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, height: 72, background: `rgba(15,21,37,0.96)`, backdropFilter: 'blur(20px)', borderTop: `1px solid rgba(255,255,255,0.06)`, display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 6px 10px', zIndex: 100 }}>
      {NAV.map(({ id, label, icon }) => {
        const active = tab === id
        return (
          <button key={id} onClick={() => setTab(id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 10px', borderRadius: 12, transition: 'all 0.18s' }}>
            {icon(active)}
            <span style={{ fontSize: 10, fontWeight: 600, color: active ? C.green : C.muted, fontFamily: 'Outfit,sans-serif', transition: 'color 0.18s' }}>{label}</span>
          </button>
        )
      })}
    </div>
  )
}

// ── Main App ─────────────────────────────────────────────────────
export default function BudgetMaster() {
  const [data, setData] = useState(null)
  const [screen, setScreen] = useState('loading')
  const [tab, setTab] = useState('dashboard')
  const [modal, setModal] = useState(null)
  const [editing, setEditing] = useState(null)
  const [debtTab, setDebtTab] = useState('owe_me')

  useEffect(() => {
    const load = async () => {
      try {
        const res = localStorage.getItem(SK)
        if (!res) throw new Error('no data')
        const d = JSON.parse(res)
        setData(d)
        setScreen(d.pinSet ? 'lock' : 'setup')
      } catch {
        const d = seed()
        setData(d)
        setScreen('setup')
      }
    }
    load()
  }, [])

  const persist = useCallback((d) => {
    try { localStorage.setItem(SK, JSON.stringify(d)) } catch { }
  }, [])

  const update = useCallback((patch) => {
    setData(prev => {
      const next = { ...prev, ...patch }
      persist(next)
      return next
    })
  }, [persist])

  const handlePinDone = (p) => {
    const next = { ...data, pin: p, pinSet: true }
    setData(next); persist(next); setScreen('app')
  }
  const handleSkipPin = () => {
    const next = { ...data, pin: null, pinSet: true }
    setData(next); persist(next); setScreen('app')
  }
  const openModal = (m, e = null) => { setEditing(e); setModal(m) }
  const closeModal = () => { setModal(null); setEditing(null) }

  if (!data || screen === 'loading') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, background: C.bg, fontFamily: 'Outfit,sans-serif', color: C.muted, fontSize: 13, gap: 16 }}>
        <style>{CSS}</style>
        <Logo sz={48} spin /><div>Loading BudgetMaster…</div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'Outfit,sans-serif', color: C.text, background: C.bg, maxWidth: 430, margin: '0 auto', minHeight: 500, position: 'relative' }}>
      <style>{CSS}</style>

      {screen === 'setup' && <PinSetup onDone={handlePinDone} onSkip={handleSkipPin} />}
      {screen === 'lock' && <LockScreen data={data} storedPin={data.pin} onUnlock={() => setScreen('app')} onReset={() => setScreen('setup')} />}

      {screen === 'app' && <>
        <div style={{ paddingBottom: 80 }}>
          {tab === 'dashboard' && <Dashboard data={data} update={update} setTab={setTab} setModal={m => setModal(m)} setEditing={setEditing} />}
          {tab === 'transactions' && <Transactions data={data} update={update} setModal={setModal} setEditing={setEditing} />}
          {tab === 'accounts' && <Accounts data={data} update={update} setModal={setModal} setEditing={setEditing} />}
          {tab === 'goals' && <Goals data={data} update={update} setModal={setModal} setEditing={setEditing} />}
          {tab === 'debts' && <Debts data={data} update={update} debtTab={debtTab} setDebtTab={setDebtTab} setModal={setModal} setEditing={setEditing} />}
        </div>
        <BottomNav tab={tab} setTab={setTab} />

        {modal === 'addTx' && <AddTxModal data={data} update={update} editing={editing} onClose={closeModal} />}
        {modal === 'addAcc' && <AddAccModal data={data} update={update} editing={editing} onClose={closeModal} />}
        {modal === 'addGoal' && <AddGoalModal data={data} update={update} editing={editing} onClose={closeModal} />}
        {modal === 'addMoney' && editing && <AddMoneyModal data={data} update={update} goal={editing} onClose={closeModal} />}
        {modal === 'addDebt' && <AddDebtModal data={data} update={update} editing={editing} onClose={closeModal} />}
        {modal === 'partPay' && editing && <PartPayModal data={data} update={update} debt={editing} onClose={closeModal} />}
        {modal === 'addBudget' && <AddBudgetModal data={data} update={update} editing={editing} onClose={closeModal} />}
      </>}
    </div>
  )
}
