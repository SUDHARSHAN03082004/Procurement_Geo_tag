// ============================================================
// APP.JS — Bootstrap: called once when DOM is ready.
//          Initializes all modules in the correct order.
// ============================================================

async function initializeApp() {
    // Register service worker (offline support)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .catch(e => console.warn('SW registration failed:', e));
    }

    // Local storage setup
    await initDB();

    // UI
    setupInstallButton();
    setupEventListeners();
    startClock();

    // Route based on saved session
    routeOnLoad();

    // GPS runs in background regardless of page (needed for attendance punch too)
    startGPS();
}

// Entry point
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
