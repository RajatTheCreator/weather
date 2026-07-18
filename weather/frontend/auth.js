"use strict";

/* ===========================================================
   WeatherVerse — Authentication Module
   Local, client-side auth for demo/portfolio purposes.
   NOTE: passwords are stored in localStorage in plain text.
   This is fine for a portfolio demo but should never be used
   for a real production login system — a real app needs a
   backend with hashed passwords (bcrypt/argon2) and sessions.
=========================================================== */

class AuthManager {
  constructor() {
    this.USERS_KEY = "weatherverse-users";
    this.SESSION_KEY = "weatherverse-session";
    this.SESSION_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

    this.cacheElements();
    this.bindEvents();
  }

  cacheElements() {
    this.loginForm = document.getElementById("loginForm");
    this.signupForm = document.getElementById("signupForm");

    this.loginEmail = document.getElementById("loginEmail");
    this.loginPassword = document.getElementById("loginPassword");
    this.rememberMe = document.getElementById("rememberMe");

    this.signupName = document.getElementById("signupName");
    this.signupEmail = document.getElementById("signupEmail");
    this.signupPassword = document.getElementById("signupPassword");
    this.signupConfirmPassword = document.getElementById("signupConfirmPassword");

    this.loginTab = document.getElementById("loginTab");
    this.signupTab = document.getElementById("signupTab");
    this.goSignup = document.getElementById("goSignup");
    this.goLogin = document.getElementById("goLogin");

    this.messageBox = document.querySelector(".auth-message");
  }

  bindEvents() {
    this.loginTab?.addEventListener("click", () => this.showLogin());
    this.signupTab?.addEventListener("click", () => this.showSignup());
    this.goSignup?.addEventListener("click", (e) => { e.preventDefault(); this.showSignup(); });
    this.goLogin?.addEventListener("click", (e) => { e.preventDefault(); this.showLogin(); });

    this.loginForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      this.login();
    });

    this.signupForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      this.signup();
    });

    document.querySelectorAll(".pw-toggle").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = document.getElementById(btn.dataset.target);
        if (!target) return;
        const icon = btn.querySelector("i");
        const isHidden = target.type === "password";
        target.type = isHidden ? "text" : "password";
        icon.classList.toggle("fa-eye", !isHidden);
        icon.classList.toggle("fa-eye-slash", isHidden);
      });
    });
  }

  showSignup() {
    this.loginForm?.classList.add("hidden");
    this.signupForm?.classList.remove("hidden");
    this.loginTab?.classList.remove("active");
    this.signupTab?.classList.add("active");
  }

  showLogin() {
    this.signupForm?.classList.add("hidden");
    this.loginForm?.classList.remove("hidden");
    this.signupTab?.classList.remove("active");
    this.loginTab?.classList.add("active");
  }

  getUsers() {
    try {
      return JSON.parse(localStorage.getItem(this.USERS_KEY)) || [];
    } catch {
      return [];
    }
  }

  saveUsers(users) {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }

  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  validatePassword(password) {
    return password.length >= 8;
  }

  signup() {
    const name = this.signupName?.value.trim();
    const email = this.signupEmail?.value.trim().toLowerCase();
    const password = this.signupPassword?.value.trim();
    const confirmPassword = this.signupConfirmPassword?.value.trim();

    if (!name || !email || !password || !confirmPassword) {
      return this.showMessage("Please fill all fields", "error");
    }
    if (!this.validateEmail(email)) {
      return this.showMessage("Enter a valid email address", "error");
    }
    if (!this.validatePassword(password)) {
      return this.showMessage("Password must be at least 8 characters", "error");
    }
    if (password !== confirmPassword) {
      return this.showMessage("Passwords do not match", "error");
    }

    const users = this.getUsers();
    if (users.some((u) => u.email === email)) {
      return this.showMessage("An account with this email already exists", "error");
    }

    const newUser = {
      id: Date.now(),
      name,
      email,
      password,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    this.saveUsers(users);
    this.createSession({ id: newUser.id, name: newUser.name, email: newUser.email });

    this.showMessage("Account created — welcome aboard 🎉", "success");
    this.proceedAfterAuth();
  }

  login() {
    const email = this.loginEmail?.value.trim().toLowerCase();
    const password = this.loginPassword?.value.trim();

    if (!email || !password) {
      return this.showMessage("Enter email and password", "error");
    }

    const users = this.getUsers();
    const user = users.find((u) => u.email === email && u.password === password);

    if (!user) {
      return this.showMessage("Invalid email or password", "error");
    }

    if (this.rememberMe?.checked) {
      localStorage.setItem("weatherverse-remember", email);
    } else {
      localStorage.removeItem("weatherverse-remember");
    }

    this.createSession({ id: user.id, name: user.name, email: user.email });
    this.showMessage(`Welcome back, ${user.name.split(" ")[0]} 🌤`, "success");
    this.proceedAfterAuth();
  }

  proceedAfterAuth() {
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent("weatherverse:authenticated"));
    }, 900);
  }

  createSession(user) {
    const session = { user, created: Date.now(), expires: Date.now() + this.SESSION_TTL };
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    window.AppState.authenticated = true;
    window.AppState.currentUser = user;
  }

  checkSession() {
    const raw = localStorage.getItem(this.SESSION_KEY);
    if (!raw) return false;

    try {
      const session = JSON.parse(raw);
      if (!session.expires || Date.now() > session.expires) {
        localStorage.removeItem(this.SESSION_KEY);
        return false;
      }
      window.AppState.currentUser = session.user;
      window.AppState.authenticated = true;
      return true;
    } catch {
      localStorage.removeItem(this.SESSION_KEY);
      return false;
    }
  }

  loadRememberedUser() {
    const email = localStorage.getItem("weatherverse-remember");
    if (email && this.loginEmail) {
      this.loginEmail.value = email;
      if (this.rememberMe) this.rememberMe.checked = true;
    }
  }

  logout() {
    localStorage.removeItem(this.SESSION_KEY);
    window.AppState.authenticated = false;
    window.AppState.currentUser = null;
    location.reload();
  }

  setupLogout() {
    document.getElementById("logoutBtn")?.addEventListener("click", () => this.logout());
  }

  showMessage(message, type = "success") {
    if (!this.messageBox) return;
    this.messageBox.textContent = message;
    this.messageBox.className = `auth-message ${type}`;
    clearTimeout(this._msgTimer);
    this._msgTimer = setTimeout(() => {
      this.messageBox.textContent = "";
      this.messageBox.className = "auth-message";
    }, 3000);
  }
}

window.AuthManager = AuthManager;