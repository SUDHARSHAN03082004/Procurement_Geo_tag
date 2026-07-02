// ============================================================
// ATTENDANCE.JS — Morning/Evening punch logic with time-window
//                validation and on-time status calculation.
//                Data saved locally + synced to Google Sheets.
// ============================================================

const ATT_LS_KEY = 'vd_attendance';

// ── Persistence ───────────────────────────────────────────────

function loadAttendanceToday() {
    try {
        const all  = JSON.parse(localStorage.getItem(ATT_LS_KEY) || '{}');
        const uid  = STATE.currentUser?.id;
        const date = formatDate(new Date());
        const key  = `${uid}_${date}`;
        STATE.attendanceToday = all[key] || { morning: null, evening: null };
    } catch (e) {
        STATE.attendanceToday = { morning: null, evening: null };
    }
}

function saveAttendanceToday() {
    try {
        const all  = JSON.parse(localStorage.getItem(ATT_LS_KEY) || '{}');
        const uid  = STATE.currentUser?.id;
        const date = formatDate(new Date());
        all[`${uid}_${date}`] = STATE.attendanceToday;
        localStorage.setItem(ATT_LS_KEY, JSON.stringify(all));
    } catch (e) { console.warn('Attendance save error', e); }
}

// ── Time-window validation ────────────────────────────────────

function getShiftForPunch() {
    const cur = nowMinutes();

    const morStart = toMinutes(CONFIG.MORNING_START.h,  CONFIG.MORNING_START.m);
    const morEnd   = toMinutes(CONFIG.MORNING_END.h,    CONFIG.MORNING_END.m);
    const eveStart = toMinutes(CONFIG.EVENING_START.h,  CONFIG.EVENING_START.m);
    const eveEnd   = toMinutes(CONFIG.EVENING_END.h,    CONFIG.EVENING_END.m);

    if (cur >= morStart && cur < morEnd)   return 'morning';
    if (cur >= eveStart && cur <= eveEnd)  return 'evening';
    return null; // outside any valid window
}

function calcPunchStatus(shift) {
    const cur = nowMinutes();

    if (shift === 'morning') {
        const deadline = toMinutes(CONFIG.MORNING_ONTIME.h, CONFIG.MORNING_ONTIME.m);
        if (cur <= deadline) return 'On-Time';
        const late = cur - deadline;
        return `Late ${late} min`;
    }

    if (shift === 'evening') {
        const deadline = toMinutes(CONFIG.EVENING_ONTIME.h, CONFIG.EVENING_ONTIME.m);
        if (cur <= deadline) return 'On-Time';
        const late = cur - deadline;
        return `Late ${late} min`;
    }

    return 'Unknown';
}

// ── Main punch handler ────────────────────────────────────────

async function handlePunch() {
    const shift = getShiftForPunch();

    if (!shift) {
        showMessage('⏰ Outside punch window. Morning: 5 AM–12 PM | Evening: 4 PM–10:30 PM', 'error');
        return;
    }

    if (shift === 'morning' && STATE.attendanceToday.morning) {
        showMessage('✅ Morning punch already recorded for today.', 'error');
        return;
    }

    if (shift === 'evening' && STATE.attendanceToday.evening) {
        showMessage('✅ Evening punch already recorded for today.', 'error');
        return;
    }

    if (!STATE.currentPosition) {
        showMessage('📍 GPS not ready. Wait for location fix, then try again.', 'error');
        return;
    }

    const now    = new Date();
    const status = calcPunchStatus(shift);

    const punchData = {
        time:    formatTimeHM(now),
        status,
        lat:     STATE.currentPosition.latitude,
        lon:     STATE.currentPosition.longitude,
        village: STATE.currentLocationName || 'Unknown',
        date:    formatDate(now),
    };

    STATE.attendanceToday[shift] = punchData;
    saveAttendanceToday();
    updateAttendanceUI();

    // Sync to Google Sheets (non-blocking)
    apiPunchIn(shift, punchData).then(res => {
        if (res.ok) console.log('Punch synced to Sheets');
    });

    const label  = shift === 'morning' ? '🌅 Morning' : '🌆 Evening';
    const emoji  = status === 'On-Time' ? '✅' : '⚠️';
    showMessage(`${emoji} ${label} punch recorded — ${status} at ${punchData.time}`, 'success');
}

// ── UI update ─────────────────────────────────────────────────

function updateAttendanceUI() {
    loadAttendanceToday();

    const mor = STATE.attendanceToday.morning;
    const eve = STATE.attendanceToday.evening;

    const morBtn = document.getElementById('morningPunchBtn');
    const eveBtn = document.getElementById('eveningPunchBtn');
    const morStat = document.getElementById('morningStatus');
    const eveStat = document.getElementById('eveningStatus');

    if (morBtn) {
        if (mor) {
            morBtn.disabled = true;
            morBtn.textContent = '✅ Morning Punched';
            morBtn.classList.add('punched');
        } else {
            morBtn.disabled = false;
            morBtn.textContent = '🌅 Morning Punch-In';
            morBtn.classList.remove('punched');
        }
    }

    if (eveBtn) {
        if (eve) {
            eveBtn.disabled = true;
            eveBtn.textContent = '✅ Evening Punched';
            eveBtn.classList.add('punched');
        } else {
            eveBtn.disabled = false;
            eveBtn.textContent = '🌆 Evening Punch-In';
            eveBtn.classList.remove('punched');
        }
    }

    if (morStat) {
        morStat.textContent = mor
            ? `${mor.time} — ${mor.status}`
            : 'Not punched yet';
        morStat.className = 'punch-status ' + (mor
            ? (mor.status === 'On-Time' ? 'on-time' : 'late')
            : 'pending');
    }

    if (eveStat) {
        eveStat.textContent = eve
            ? `${eve.time} — ${eve.status}`
            : 'Not punched yet';
        eveStat.className = 'punch-status ' + (eve
            ? (eve.status === 'On-Time' ? 'on-time' : 'late')
            : 'pending');
    }

    // Show/hide punch card based on time window
    highlightActiveWindow();
}

function highlightActiveWindow() {
    const shift = getShiftForPunch();
    const morCard = document.getElementById('morningPunchCard');
    const eveCard = document.getElementById('eveningPunchCard');

    if (morCard) morCard.classList.toggle('active-window', shift === 'morning');
    if (eveCard) eveCard.classList.toggle('active-window', shift === 'evening');
}
