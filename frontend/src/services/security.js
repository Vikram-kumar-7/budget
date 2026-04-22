export class SecurityManager {
  constructor() {
    this.locked = false;
    this.lockTimeout = null;
    this.lastActiveTime = Date.now();
    this.setupListeners();
    this.checkInitialState();
  }

  async hashPin(pin) {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + "BudgetMasterSalt!");
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async setPin(pin) {
    const hash = await this.hashPin(pin);
    localStorage.setItem('bm_pin_hash', hash);
  }

  hasPin() {
    return !!localStorage.getItem('bm_pin_hash');
  }

  async verifyPin(pin) {
    const hash = await this.hashPin(pin);
    return hash === localStorage.getItem('bm_pin_hash');
  }

  removePin() {
    localStorage.removeItem('bm_pin_hash');
    this.disableLock();
  }

  getAutoLockSetting() {
    return localStorage.getItem('bm_auto_lock') || 'immediate'; // immediate, 1min, 5min, 15min, 30min
  }

  setAutoLockSetting(val) {
    localStorage.setItem('bm_auto_lock', val);
    this.resetTimer();
  }

  getLockOnTabSwitch() {
    return localStorage.getItem('bm_lock_tab') === 'true';
  }

  setLockOnTabSwitch(val) {
    localStorage.setItem('bm_lock_tab', val);
  }

  setupListeners() {
    const reset = () => this.resetTimer();
    document.addEventListener('mousemove', reset);
    document.addEventListener('keydown', reset);
    document.addEventListener('touchstart', reset);
    document.addEventListener('click', reset);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.getLockOnTabSwitch() && this.hasPin()) {
        this.lockApp();
      }
    });

    window.addEventListener('focus', () => {
      this.checkTimer();
    });
  }

  resetTimer() {
    if (this.locked) return;
    this.lastActiveTime = Date.now();
    sessionStorage.setItem('bm_last_active', this.lastActiveTime);
    this.startTimer();
  }

  startTimer() {
    if (this.lockTimeout) clearTimeout(this.lockTimeout);
    if (!this.hasPin()) return;

    const setting = this.getAutoLockSetting();
    if (setting === 'immediate') return; // Handled by visibility/focus if needed, or always lock on refresh

    const limits = { '1min': 60, '5min': 300, '15min': 900, '30min': 1800 };
    const seconds = limits[setting];
    if (seconds) {
      this.lockTimeout = setTimeout(() => {
        this.lockApp();
      }, seconds * 1000);
    }
  }

  checkTimer() {
    if (!this.hasPin()) return;
    const stored = sessionStorage.getItem('bm_last_active');
    if (!stored) {
      this.lockApp();
      return;
    }
    const setting = this.getAutoLockSetting();
    if (setting === 'immediate') {
      this.lockApp();
      return;
    }
    
    const limits = { '1min': 60, '5min': 300, '15min': 900, '30min': 1800 };
    const limit = limits[setting] * 1000;
    if (Date.now() - parseInt(stored) > limit) {
      this.lockApp();
    } else {
      this.startTimer();
    }
  }

  checkInitialState() {
    if (!this.hasPin()) return;
    const stored = sessionStorage.getItem('bm_last_active');
    if (!stored) {
      // First load of the session
      this.lockApp();
    } else {
      this.checkTimer();
    }
  }

  disableLock() {
    this.locked = false;
    if (this.lockTimeout) clearTimeout(this.lockTimeout);
    const lockScreen = document.getElementById('bm-lock-screen');
    if (lockScreen) lockScreen.remove();
  }

  lockApp() {
    if (!this.hasPin() || this.locked) return;
    this.locked = true;
    
    // Create Lock Screen UI
    const lockOverlay = document.createElement('div');
    lockOverlay.id = 'bm-lock-screen';
    lockOverlay.style.cssText = `
      position: fixed; inset: 0; z-index: 9999;
      background: var(--bg-main); backdrop-filter: blur(20px);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
    `;
    
    import('../ui/BudgetMasterLogo.js').then(({ getAnimatedLogo }) => {
      lockOverlay.innerHTML = `
        <div style="margin-bottom: 30px;">
          ${getAnimatedLogo(120, true)}
        </div>
        <h2 style="margin-bottom: 30px;">Welcome back 👋</h2>
        <div class="pin-display" style="display: flex; gap: 15px; margin-bottom: 40px;">
          <div class="pin-dot"></div><div class="pin-dot"></div><div class="pin-dot"></div><div class="pin-dot"></div>
        </div>
        <div class="pin-pad" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
          ${[1,2,3,4,5,6,7,8,9].map(n => `<button class="pin-btn">${n}</button>`).join('')}
          <button class="pin-btn" style="visibility: hidden;"></button>
          <button class="pin-btn">0</button>
          <button class="pin-btn" id="pin-clear"><i class="ph-bold ph-backspace"></i></button>
        </div>
        <button id="resetAppBtn" class="btn btn-outline" style="margin-top: 50px; color: var(--danger); border-color: var(--danger);">Reset App</button>
      `;
      
      document.body.appendChild(lockOverlay);
      
      const dots = lockOverlay.querySelectorAll('.pin-dot');
      let currentPin = '';
      
      lockOverlay.querySelectorAll('.pin-btn:not(#pin-clear)').forEach(btn => {
        btn.onclick = async () => {
          if (currentPin.length < 4) {
            currentPin += btn.innerText;
            this.updateDots(dots, currentPin.length);
            if (currentPin.length === 4) {
              const valid = await this.verifyPin(currentPin);
              if (valid) {
                this.disableLock();
                this.resetTimer();
              } else {
                currentPin = '';
                this.updateDots(dots, 0);
                // Shake animation
                const display = lockOverlay.querySelector('.pin-display');
                display.style.animation = 'shake 0.4s';
                setTimeout(() => display.style.animation = '', 400);
              }
            }
          }
        };
      });
      
      lockOverlay.querySelector('#pin-clear').onclick = () => {
        currentPin = currentPin.slice(0, -1);
        this.updateDots(dots, currentPin.length);
      };

      lockOverlay.querySelector('#resetAppBtn').onclick = () => {
        if(confirm('Warning: This will clear all local app data and log you out. Proceed?')) {
          localStorage.clear();
          sessionStorage.clear();
          location.reload();
        }
      };
    });
  }

  updateDots(dots, len) {
    dots.forEach((d, i) => {
      d.style.background = i < len ? 'var(--primary)' : 'rgba(255,255,255,0.1)';
    });
  }

  getLockCountdown() {
    if (!this.hasPin() || this.getAutoLockSetting() === 'immediate') return null;
    const limits = { '1min': 60, '5min': 300, '15min': 900, '30min': 1800 };
    const limitSec = limits[this.getAutoLockSetting()];
    if (!limitSec) return null;
    
    const elapsed = (Date.now() - this.lastActiveTime) / 1000;
    const remaining = Math.max(0, limitSec - elapsed);
    
    const m = Math.floor(remaining / 60);
    const s = Math.floor(remaining % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }
}

export const securityManager = new SecurityManager();
