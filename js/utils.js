// ============================================================
// UTILS.JS — Pure helper functions, no side effects
// ============================================================

function padTwo(n) {
    return String(n).padStart(2, '0');
}

function formatDate(date) {
    return padTwo(date.getDate()) + '-' +
           padTwo(date.getMonth() + 1) + '-' +
           date.getFullYear();
}

function formatTime(date) {
    return padTwo(date.getHours()) + ':' +
           padTwo(date.getMinutes()) + ':' +
           padTwo(date.getSeconds());
}

function formatTimeHM(date) {
    return padTwo(date.getHours()) + ':' + padTwo(date.getMinutes());
}

function toMinutes(h, m) {
    return h * 60 + m;
}

// Returns current time as total minutes since midnight
function nowMinutes() {
    const d = new Date();
    return toMinutes(d.getHours(), d.getMinutes());
}

// Simple non-cryptographic hash for local password storage
// (Real hashing is done server-side in Google Apps Script)
function simpleHash(str) {
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return 'vd_' + hash.toString(16);
}

// Generate a random session token
function generateToken() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Download a blob as a file
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// Build a Google Maps link from coordinates
function mapsLink(lat, lon) {
    return `https://maps.google.com/maps?q=${lat},${lon}`;
}

// Detect current shift label (for form auto-fill)
function detectShiftLabel() {
    const h = new Date().getHours();
    if (h >= 5  && h < 12) return 'Morning';
    if (h >= 12 && h < 16) return 'Afternoon';
    if (h >= 16 && h < 22) return 'Evening';
    return 'Other';
}

// Escape CSV cell content
function csvCell(val) {
    return '"' + String(val || '').replace(/"/g, '""') + '"';
}

// Build and download a CSV from headers + rows
function exportToCSV(headers, rows, filename) {
    const content = [
        headers.map(csvCell).join(','),
        ...rows.map(row => row.map(csvCell).join(','))
    ].join('\n');
    downloadBlob(new Blob([content], { type: 'text/csv;charset=utf-8;' }), filename);
}
