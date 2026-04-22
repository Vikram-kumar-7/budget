import { api } from '../services/api';

export class Auth {
  constructor(container, onLogin) {
    this.container = container;
    this.onLogin = onLogin;
    this.mode = 'login'; // 'login' or 'register'
  }

  render() {
    this.container.innerHTML = `
      <div class="auth-container">
        <div class="auth-card">
          <div style="text-align: center; margin-bottom: 30px;">
            <i class="ph-duotone ph-wallet" style="font-size: 3rem; color: var(--primary);"></i>
            <h1 style="margin-top: 15px;">${this.mode === 'login' ? 'Welcome Back' : 'Create Account'}</h1>
            <p style="color: var(--text-sub)">${this.mode === 'login' ? 'Manage your wealth with ease' : 'Start your journey to financial freedom'}</p>
          </div>
          <form id="authForm">
            ${this.mode === 'register' ? '<input type="text" id="username" placeholder="Username" required>' : ''}
            <input type="email" id="email" placeholder="Email Address" required>
            <input type="password" id="password" placeholder="Password" required>
            <button class="btn btn-primary" style="width: 100%; margin-top: 10px;">${this.mode === 'login' ? 'Login' : 'Sign Up'}</button>
          </form>
          <p style="text-align: center; margin-top: 25px; color: var(--text-sub)">
            ${this.mode === 'login' ? "Don't have an account?" : "Already have an account?"}
            <span id="toggleMode" style="color: var(--primary); cursor: pointer; font-weight: 600;">
              ${this.mode === 'login' ? 'Sign Up' : 'Login'}
            </span>
          </p>
        </div>
      </div>
    `;

    document.getElementById('authForm').addEventListener('submit', (e) => this.handleSubmit(e));
    document.getElementById('toggleMode').addEventListener('click', () => {
      this.mode = this.mode === 'login' ? 'register' : 'login';
      this.render();
    });
  }

  async handleSubmit(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.disabled = true;
    btn.innerText = 'Please wait...';

    const formData = {
      email: e.target.email.value,
      password: e.target.password.value,
    };
    if (this.mode === 'register') formData.username = e.target.username.value;

    try {
      const endpoint = this.mode === 'login' ? '/auth/login' : '/auth/register';
      const data = await api.post(endpoint, formData);
      api.setToken(data.token);
      this.onLogin(data.user);
    } catch (err) {
      alert(err.message);
      btn.disabled = false;
      btn.innerText = this.mode === 'login' ? 'Login' : 'Sign Up';
    }
  }
}
