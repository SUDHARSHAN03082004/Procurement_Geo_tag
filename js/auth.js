// ============================================================
// AUTH.JS — Login, logout, session management, password change
//           Credentials are validated locally first.
//           When CONFIG.SCRIPT_URL is set, server validates too.
// ============================================================

const AUTH_LS_KEY  = 'vd_session';
const CREDS_LS_KEY = 'vd_creds'; // { [id]: { hash, forceChange } }

// ── Session ──────────────────────────────────────────────────

function saveSession(user) {
    const session = {
        id: user.id,
        name: user.name,
        role: user.role,
        token: generateToken(),
        expiry: Date.now() + CONFIG.SESSION_HOURS * 3600 * 1000,
    };
    localStorage.setItem(AUTH_LS_KEY, JSON.stringify(session));
    STATE.currentUser = { id: user.id, name: user.name, role: user.role };
    STATE.sessionToken = session.token;
}

function loadSession() {
    try {
        const raw = localStorage.getItem(AUTH_LS_KEY);
        if (!raw) return false;
        const session = JSON.parse(raw);
        if (Date.now() > session.expiry) {
            localStorage.removeItem(AUTH_LS_KEY);
            return false;
        }
        STATE.currentUser = { id: session.id, name: session.name, role: session.role };
        STATE.sessionToken = session.token;
        return true;
    } catch (e) {
        return false;
    }
}

function clearSession() {
    localStorage.removeItem(AUTH_LS_KEY);
    STATE.currentUser = null;
    STATE.sessionToken = null;
}

// ── Password storage ─────────────────────────────────────────

function getStoredCreds() {
    try {
        return JSON.parse(localStorage.getItem(CREDS_LS_KEY) || '{}');
    } catch (e) { return {}; }
}

function setStoredCred(id, password, forceChange = false) {
    const creds = getStoredCreds();
    creds[id] = { hash: simpleHash(password), forceChange };
    localStorage.setItem(CREDS_LS_KEY, JSON.stringify(creds));
}

function isFirstLogin(id) {
    const creds = getStoredCreds();
    return !creds[id]; // never set a password locally = first login
}

function verifyPassword(id, password) {
    const creds = getStoredCreds();
    if (creds[id]) {
        return creds[id].hash === simpleHash(password);
    }
    // Default password = their ID (first login)
    return password === id;
}

function needsForceChange(id) {
    if (isFirstLogin(id)) return true;
    const creds = getStoredCreds();
    return creds[id]?.forceChange === true;
}

// ── Login flow ────────────────────────────────────────────────

function doLogin() {
    const idInput = document.getElementById('loginId');
    const pwInput = document.getElementById('loginPw');
    const errEl   = document.getElementById('loginError');

    const id = idInput.value.trim();
    const pw = pwInput.value;

    errEl.classList.remove('active');

    if (!id || !pw) {
        errEl.textContent = '❌ Please enter your ID and password.';
        errEl.classList.add('active');
        return;
    }

    const employee = CONFIG.EMPLOYEES.find(e => e.id === id);
    if (!employee) {
        errEl.textContent = '❌ Employee ID not found.';
        errEl.classList.add('active');
        return;
    }

    if (!verifyPassword(id, pw)) {
        errEl.textContent = '❌ Incorrect password.';
        errEl.classList.add('active');
        return;
    }

    // Correct credentials
    saveSession(employee);
    idInput.value = '';
    pwInput.value = '';

    if (needsForceChange(id)) {
        showPage('page-change-pw');
        return;
    }

    goToRolePage();
}

function doChangePassword() {
    const newPw     = document.getElementById('newPassword').value;
    const confirmPw = document.getElementById('confirmPassword').value;
    const errEl     = document.getElementById('changePwError');

    errEl.classList.remove('active');

    if (newPw.length < 4) {
        errEl.textContent = '❌ Password must be at least 4 characters.';
        errEl.classList.add('active');
        return;
    }

    if (newPw !== confirmPw) {
        errEl.textContent = '❌ Passwords do not match.';
        errEl.classList.add('active');
        return;
    }

    if (newPw === STATE.currentUser.id) {
        errEl.textContent = '❌ New password cannot be same as your ID.';
        errEl.classList.add('active');
        return;
    }

    setStoredCred(STATE.currentUser.id, newPw, false);
    showMessage('✓ Password changed successfully!', 'success');

    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';

    goToRolePage();
}

function doLogout() {
    clearSession();
    showPage('page-login');
}

function goToRolePage() {
    if (!STATE.currentUser) return;

    // Update header name displays
    const supHeader = document.getElementById('headerUser');
    if (supHeader) supHeader.textContent = STATE.currentUser.name + ' · ID ' + STATE.currentUser.id;
    const admHeader = document.getElementById('adminHeaderUser');
    if (admHeader) admHeader.textContent = STATE.currentUser.name;

    if (STATE.currentUser.role === 'admin') {
        showPage('page-admin');
        initAdminDashboard();
    } else {
        showPage('page-supervisor');
        startCamera();
        updateAttendanceUI();
    }
}
