// ============================================================
// CLOCK.JS — Live clock display + shift auto-detect
// ============================================================

function startClock() {
    updateClock();
    setInterval(updateClock, 1000);
}

function updateClock() {
    const el = document.getElementById('clockDisplay');
    if (!el) return;
    el.textContent = new Date().toLocaleString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: true,
    });
}

// Sets the date/shift read-only field on the report form
function initDateShiftField() {
    const el = document.getElementById('fieldDateShift');
    if (!el) return;
    const now   = new Date();
    const date  = formatDate(now);
    const shift = detectShiftLabel();
    el.value = `${date}, ${shift}`;
}
