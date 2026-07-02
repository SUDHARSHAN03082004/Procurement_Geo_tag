// ============================================================
// STATE.JS — All global mutable state in one place
// ============================================================

const STATE = {
    // Auth
    currentUser: null,       // { id, name, role }
    sessionToken: null,
    forceChangePassword: false,  // temporary password requires change on next login

    // GPS
    currentPosition: null,
    currentLocationName: null,
    gpsWatchId: null,
    gpsErrorCount: 0,
    lastGeocodeTime: 0,
    lastGeocodeLat: null,
    lastGeocodeLon: null,

    // Camera
    videoStream: null,
    cameraFacingMode: 'user', // front camera default
    capturedPhoto: null,
    punchAction: null,        // 'morning' (punch in) or 'evening' (punch out)

    // Storage
    db: null,
    allRecords: [],
    filteredRecords: [],

    // Attendance (today's status per device)
    attendanceToday: {
        morning: null,   // { time, status, lat, lon, village } once punched
        evening: null,
    },

    // Admin dashboard
    adminTab: 'attendance',  // 'attendance' | 'reports'
    adminAttendance: [],     // loaded from Google Sheets
    adminReports: [],        // loaded from Google Sheets

    // PWA install prompt
    installPrompt: null,
};
