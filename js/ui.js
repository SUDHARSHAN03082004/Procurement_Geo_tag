// ============================================================
// UI.JS — Toast messages, modal helpers, install button
// ============================================================

function showMessage(text, type = 'success') {
    const msg = document.createElement('div');
    msg.className = `toast-message ${type}`;
    msg.textContent = text;
    document.body.appendChild(msg);

    setTimeout(() => {
        msg.style.animation = 'slideUp 0.3s ease reverse';
        setTimeout(() => msg.remove(), 300);
    }, 3000);
}

// ── PWA install button ────────────────────────────────────────

function setupInstallButton() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        STATE.installPrompt = e;
        const btn = document.getElementById('installBtn');
        if (btn) btn.style.display = 'inline-block';
    });

    const btn = document.getElementById('installBtn');
    if (btn) {
        btn.addEventListener('click', async () => {
            if (STATE.installPrompt) {
                STATE.installPrompt.prompt();
                const { outcome } = await STATE.installPrompt.userChoice;
                if (outcome === 'accepted') showMessage('✅ App installing...', 'success');
                STATE.installPrompt = null;
            }
        });
    }

    window.addEventListener('appinstalled', () => {
        showMessage('✅ App installed successfully!', 'success');
        const btn = document.getElementById('installBtn');
        if (btn) btn.style.display = 'none';
    });
}
