// ============================================================
// ADMIN.JS — Admin dashboard: attendance tab, reports tab,
//            clickable map links, export CSV, clear data.
//            Fetches from Google Sheets when SCRIPT_URL is set;
//            falls back to local device data only.
// ============================================================

// ── Init ──────────────────────────────────────────────────────

function initAdminDashboard() {
    // Populate supervisor filter dropdown (run only once)
    const sel = document.getElementById('attFilterSup');
    if (sel && sel.options.length === 1) {
        CONFIG.EMPLOYEES.filter(e => e.role === 'supervisor').forEach(emp => {
            const opt       = document.createElement('option');
            opt.value       = emp.id;
            opt.textContent = emp.name + ' (' + emp.id + ')';
            sel.appendChild(opt);
        });
    }

    // Default date = today
    const dateEl = document.getElementById('attFilterDate');
    if (dateEl && !dateEl.value) {
        dateEl.value = formatDate(new Date());
    }

    switchAdminTab('attendance');
    loadAdminAttendance();
}

function switchAdminTab(tab) {
    STATE.adminTab = tab;
    document.querySelectorAll('.admin-tab-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.tab === tab);
    });
    document.querySelectorAll('.admin-tab-panel').forEach(p => {
        p.classList.toggle('active', p.id === 'tab-' + tab);
    });
    // Load reports on first switch to that tab
    if (tab === 'reports') loadAdminReports();
    if (tab === 'supervisors') loadSupervisorsList();
}

// ── Loading state helper ──────────────────────────────────────

function tableLoading(tbodyId, colspan, msg) {
    const el = document.getElementById(tbodyId);
    if (el) el.innerHTML = `<tr><td colspan="${colspan}" class="no-records">${msg}</td></tr>`;
}

// ── Attendance tab ────────────────────────────────────────────

async function loadAdminAttendance() {
    const dateEl  = document.getElementById('attFilterDate');
    const supEl   = document.getElementById('attFilterSup');
    const date    = dateEl?.value || formatDate(new Date());
    const supId   = supEl?.value  || '';

    tableLoading('attTableBody', 3, '⏳ Loading attendance...');

    // Try Google Sheets (all devices' data)
    const res = await apiFetchAttendance(date, supId);
    if (res.ok && Array.isArray(res.data?.rows)) {
        renderAttendanceTable(res.data.rows);
        return;
    }

    // Fallback: local storage (only THIS device's punches)
    console.warn('Attendance API failed or returned invalid data:', res);
    renderAttendanceFallback(date, supId);
}

function renderAttendanceFallback(date, supId) {
    const all  = JSON.parse(localStorage.getItem('vd_attendance') || '{}');
    const rows = CONFIG.EMPLOYEES
        .filter(e => e.role === 'supervisor')
        .filter(emp => !supId || emp.id === supId)
        .map(emp => {
            const key = `${emp.id}_${date}`;
            const att = all[key] || {};
            return {
                name:          emp.name,
                id:            emp.id,
                morningTime:   att.morning?.time   || '--',
                morningStatus: att.morning?.status || '--',
                morningLat:    att.morning?.lat     || null,
                morningLon:    att.morning?.lon     || null,
                eveningTime:   att.evening?.time   || '--',
                eveningStatus: att.evening?.status || '--',
                eveningLat:    att.evening?.lat     || null,
                eveningLon:    att.evening?.lon     || null,
            };
        });

    renderAttendanceTable(rows);
}

function renderAttendanceTable(rows) {
    const tbody = document.getElementById('attTableBody');
    if (!tbody) return;

    if (!rows || rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="no-records">No attendance data for this date</td></tr>';
        return;
    }

    tbody.innerHTML = rows.map(r => {
        const morLoc  = (r.morningLat && r.morningLon)
            ? `<a href="${mapsLink(r.morningLat, r.morningLon)}" target="_blank" class="map-link">📍</a>`
            : '';
        const eveLoc  = (r.eveningLat && r.eveningLon)
            ? `<a href="${mapsLink(r.eveningLat, r.eveningLon)}" target="_blank" class="map-link">📍</a>`
            : '';
        const morClass = r.morningStatus === 'On-Time' ? 'badge-green'
                       : r.morningStatus === '--'       ? ''
                       : 'badge-red';
        const eveClass = r.eveningStatus === 'On-Time' ? 'badge-green'
                       : r.eveningStatus === '--'       ? ''
                       : 'badge-red';

        return `<tr>
            <td>${r.name}<br><small style="color:#888">${r.id}</small></td>
            <td>${r.morningTime} ${morLoc}<br><span class="badge ${morClass}">${r.morningStatus}</span></td>
            <td>${r.eveningTime} ${eveLoc}<br><span class="badge ${eveClass}">${r.eveningStatus}</span></td>
        </tr>`;
    }).join('');
}

function exportAttendanceCSV() {
    const date  = document.getElementById('attFilterDate')?.value || formatDate(new Date());
    const all   = JSON.parse(localStorage.getItem('vd_attendance') || '{}');

    const headers = ['Supervisor', 'ID', 'Morning Time', 'Morning Status', 'Evening Time', 'Evening Status'];
    const rows    = CONFIG.EMPLOYEES
        .filter(e => e.role === 'supervisor')
        .map(emp => {
            const att = all[`${emp.id}_${date}`] || {};
            return [
                emp.name, emp.id,
                att.morning?.time   || '',
                att.morning?.status || '',
                att.evening?.time   || '',
                att.evening?.status || '',
            ];
        });

    exportToCSV(headers, rows, `attendance_${date}.csv`);
    showMessage('✅ Attendance CSV exported', 'success');
}

// ── Reports tab ───────────────────────────────────────────────

async function loadAdminReports() {
    tableLoading('reportTableBody', 5, '⏳ Loading reports...');

    // Try Google Sheets (ALL supervisors' reports from all devices)
    const res = await apiFetchReports();
    if (res.ok && Array.isArray(res.data?.rows)) {
        STATE.allRecords = res.data.rows;
        renderReports();
        return;
    }

    // Fallback: local IndexedDB (only records entered on this device)
    console.warn('Reports API failed or returned invalid data:', res);
    await loadAllRecords();
    renderReports();
}

function renderReports() {
    const tbody = document.getElementById('reportTableBody');
    if (!tbody) return;

    if (STATE.allRecords.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="no-records">No reports found</td></tr>';
        updateAdminStats();
        return;
    }

    const query = (document.getElementById('reportSearch')?.value || '').toLowerCase();
    const list  = query
        ? STATE.allRecords.filter(r =>
              r.vendorName?.toLowerCase().includes(query)       ||
              r.dairyName?.toLowerCase().includes(query)        ||
              r.routeName?.toLowerCase().includes(query)        ||
              r.location?.toLowerCase().includes(query)         ||
              r.supervisorName?.toLowerCase().includes(query))
        : STATE.allRecords;

    tbody.innerHTML = list.map(r => {
        const loc = (r.lat && r.lon)
            ? `<a href="${mapsLink(r.lat, r.lon)}" target="_blank" class="map-link">${r.location || '📍 View'}</a>`
            : (r.location || '--');

        return `<tr onclick="viewReport('${r.id}')">
            <td>${r.timestamp?.replace('T', ' ').slice(0, 16) || '--'}</td>
            <td>${r.supervisorName || '--'}<br><small>${r.supervisorId || ''}</small></td>
            <td>${loc}</td>
            <td>${r.vendorName || '--'}</td>
            <td>${r.shift || '--'}</td>
        </tr>`;
    }).join('');

    updateAdminStats();
}

function updateAdminStats() {
    const today     = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().slice(0, 7);

    setVal('totalStats', STATE.allRecords.length);
    setVal('todayStats', STATE.allRecords.filter(r => r.timestamp?.startsWith(today)).length);
    setVal('monthStats', STATE.allRecords.filter(r => r.timestamp?.startsWith(thisMonth)).length);
}

function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

// ── Report detail modal ───────────────────────────────────────

function viewReport(id) {
    const r = STATE.allRecords.find(x => x.id === id);
    if (!r) return;

    const mLink = (r.lat && r.lon)
        ? `<a href="${mapsLink(r.lat, r.lon)}" target="_blank" class="map-link">📍 Open in Google Maps</a>`
        : '--';

    document.getElementById('modalTimestamp').textContent  = r.timestamp    || '--';
    document.getElementById('modalShift').textContent      = r.shift        || '--';
    document.getElementById('modalLocation').innerHTML     = mLink;
    document.getElementById('modalGPS').textContent        = (r.lat && r.lon)
        ? `${Number(r.lat).toFixed(6)}, ${Number(r.lon).toFixed(6)}`
        : '--';
    document.getElementById('modalAccuracy').textContent   = r.accuracy ? `±${Number(r.accuracy).toFixed(1)} m` : '--';
    document.getElementById('modalVendor').textContent     = r.vendorName      || '--';
    document.getElementById('modalRoute').textContent      = r.routeName       || '--';
    document.getElementById('modalDairy').textContent      = r.dairyName       || '--';
    document.getElementById('modalContact').textContent    = r.contactNo       || '--';
    document.getElementById('modalMilk').textContent       = r.milkLtrs        || '--';
    document.getElementById('modalFatSnf').textContent     = r.fatSnf          || '--';
    document.getElementById('modalRate').textContent       = r.avgRate         || '--';
    document.getElementById('modalAdditional').textContent = r.additionalRate  || '--';
    document.getElementById('modalSalary').textContent     = r.vlccSalary      || '--';
    document.getElementById('modalDiscussion').textContent = r.discussionPoint || '--';
    document.getElementById('modalRemarks').textContent    = r.noteField       || '--';

    const photoEl = document.getElementById('modalPhotoNote');
    if (photoEl) photoEl.textContent = 'Photos shared via Telegram only — not stored in this system.';

    document.getElementById('recordModal').classList.add('active');
}

function closeModal() {
    document.getElementById('recordModal').classList.remove('active');
}

// ── CSV export ────────────────────────────────────────────────

function exportReportsCSV() {
    if (STATE.allRecords.length === 0) {
        showMessage('No reports to export', 'error');
        return;
    }
    const headers = [
        'Timestamp', 'Date', 'Time', 'Shift', 'Supervisor', 'ID',
        'Location', 'Latitude', 'Longitude', 'Accuracy',
        'Vendor/VLCC', 'Route', 'Dairy', 'Contact', 'Milk(L)', 'Fat&SNF',
        'Avg Rate', 'Additional Incentive', 'VLCC Salary', 'Discussion', 'Remarks'
    ];
    const rows = STATE.allRecords.map(r => [
        r.timestamp, r.date, r.time, r.shift,
        r.supervisorName, r.supervisorId,
        r.location, r.lat, r.lon, r.accuracy,
        r.vendorName, r.routeName, r.dairyName, r.contactNo,
        r.milkLtrs, r.fatSnf, r.avgRate, r.additionalRate, r.vlccSalary,
        r.discussionPoint, r.noteField
    ]);
    exportToCSV(headers, rows, `reports_${formatDate(new Date())}.csv`);
    showMessage('✅ Reports CSV exported', 'success');
}

// ── Clear local data ──────────────────────────────────────────

async function clearAllDataConfirm() {
    if (confirm('⚠️ This will delete all LOCAL records on this device.\n\nGoogle Sheets data is not affected.\n\nContinue?')) {
        await clearAllData();
        STATE.allRecords = [];
        renderReports();
        showMessage('✅ Local data cleared', 'success');
    }
}

// ── Supervisors tab ───────────────────────────────────────────

async function loadSupervisorsList() {
    const tbody = document.getElementById('supervisorTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;">⏳ Loading supervisors...</td></tr>';

    const res = await apiListSupervisors();
    if (res.ok && Array.isArray(res.data?.rows)) {
        renderSupervisorsList(res.data.rows);
    } else {
        console.warn('Failed to load supervisors:', res);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;color:#d32f2f;">⚠️ Failed to load supervisors</td></tr>';
    }
}

function renderSupervisorsList(supervisors) {
    const tbody = document.getElementById('supervisorTableBody');
    if (!tbody || !supervisors || supervisors.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;">No supervisors found</td></tr>';
        return;
    }

    tbody.innerHTML = supervisors.map(s => `<tr>
        <td>${s.id}</td>
        <td>${s.name}</td>
        <td>${s.lastReset || '--'}</td>
        <td style="text-align:center;">
            <button class="btn btn-primary btn-small" onclick="resetSupervisorPassword('${s.id}', '${s.name}')">🔑 Reset</button>
        </td>
    </tr>`).join('');
}

async function resetSupervisorPassword(supId, supName) {
    if (!confirm(`Reset password for ${supName} (${supId})?`)) return;

    const btn = event.target;
    btn.disabled = true;
    btn.textContent = '⏳ Resetting...';

    const res = await apiResetPassword(supId);

    btn.disabled = false;
    btn.textContent = '🔑 Reset';

    if (res.ok && res.data?.tempPassword) {
        showPasswordModal(supName, supId, res.data.tempPassword);
        loadSupervisorsList();
    } else {
        showMessage('❌ Failed to reset password', 'error');
    }
}

function showPasswordModal(supName, supId, tempPassword) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:400px;">
            <button class="modal-close" onclick="this.closest('.modal').remove()">✕</button>
            <div class="modal-title">🔑 Temporary Password</div>
            <p style="font-size:13px;color:var(--text-secondary);margin:12px 0;">
                Password reset for <strong>${supName} (${supId})</strong>
            </p>
            <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:12px 0;">
                <div style="font-size:12px;color:#888;margin-bottom:4px;">Temporary Password:</div>
                <div style="font-size:16px;font-weight:bold;color:#1a7a3c;font-family:monospace;word-break:break-all;">
                    ${tempPassword}
                </div>
            </div>
            <div style="background:#fff3cd;border:1px solid #ffc107;padding:12px;border-radius:6px;margin:12px 0;font-size:12px;color:#333;">
                ⚠️ Share this with the supervisor. They will be prompted to change it on next login.
            </div>
            <button class="btn btn-primary" style="width:100%;" onclick="
                navigator.clipboard.writeText('${tempPassword}').then(() => {
                    showMessage('✅ Password copied to clipboard', 'success');
                });
            ">📋 Copy to Clipboard</button>
        </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}
