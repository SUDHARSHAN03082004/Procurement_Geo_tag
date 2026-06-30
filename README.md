# VD GeoTag - Vijay Dairy Field Supervisor App

A Progressive Web App (PWA) for Vijay Dairy field supervisors to capture geo-tagged photos and meeting details.

## Features

✅ **Field Data Capture**
- Real-time GPS tracking (latitude, longitude, altitude, accuracy)
- Compass heading with cardinal directions
- Camera capture with GPS/timestamp/heading overlay
- Form for vendor meeting details (11 fields)

✅ **Offline Support**
- Works completely offline with Service Worker
- Installable on mobile/desktop as PWA
- Data syncs automatically when online

✅ **Admin Dashboard**
- Login with credentials (admin / VD@)
- View all submitted records
- Real-time search by vendor, dairy, route, location
- View detailed records in modal with photos
- Export data as CSV
- Download all photos
- Clear all data option

✅ **Data Storage**
- Primary: IndexedDB (fast, offline-ready)
- Fallback: LocalStorage (if IndexedDB unavailable)
- Each record includes GPS, compass, photo, form data

## Installation

### On Desktop/Web Browser
1. Download `VD-GeoTag.html`
2. Open in any modern browser
3. Grant GPS and Camera permissions

### On Mobile (PWA)
1. Open `VD-GeoTag.html` in Chrome/Safari/Firefox
2. Tap menu → "Add to Home Screen" or "Install"
3. Access from home screen like native app
4. Works offline automatically

## Usage

### Field Supervisor Mode
1. Allow GPS and Camera access
2. Wait for GPS lock and compass calibration
3. Capture photo (GPS/timestamp/compass added automatically)
4. Confirm photo
5. Fill vendor meeting form
6. Choose: **Share to Telegram** or **Submit Record**

### Admin Mode
1. Click "🔐 Admin Login" button
2. Username: `admin`
3. Password: `VD@`
4. View statistics, search, export data

## Credentials

- **Username:** admin
- **Password:** VD@

## Technical Details

- **Single HTML File** - No external dependencies
- **Vanilla JavaScript** - No frameworks or libraries
- **Mobile-First Design** - Responsive 480px+
- **Offline-First PWA** - Service Worker enabled
- **Installable** - Add to home screen on mobile
- **Color Scheme** - Vijay Dairy green (#1a7a3c)

## Browser Compatibility

✅ Chrome/Edge 60+
✅ Safari 12+
✅ Firefox 55+
✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Data Format

Each record contains:
```
{
  id: timestamp,
  date: "DD-MM-YYYY",
  time: "HH:MM:SS",
  timestamp: ISO8601,
  shift: "Morning|Evening|Other",
  lat: latitude,
  lon: longitude,
  altitude: meters,
  accuracy: meters,
  compass: degrees,
  photo: "base64 JPEG",
  vendorName: string,
  routeName: string,
  dairyName: string,
  contactNo: string,
  milkLtrs: string,
  fatSnf: string,
  additionalRate: string,
  discussionPoint: string,
  procurement: string,
  noteField: string,
  shareAttempted: boolean
}
```

## Export Format

### CSV Export
All records exported with headers:
- Timestamp, Date, Time, Shift
- GPS (Latitude, Longitude, Altitude, Accuracy, Heading)
- Form Fields (Vendor, Route, Dairy, Contact, Milk, Fat&SNF, etc.)

### Photo Download
All captured photos available as individual JPEG files

## Development

Single-file app structure:
- **HTML** - Page layouts (3 pages)
- **CSS** - Responsive styling (inline)
- **JavaScript** - All functionality (inline)
  - GPS tracking
  - Compass handling
  - Camera control
  - Storage (IndexedDB/localStorage)
  - Admin dashboard
  - Export functions
  - Service Worker registration

## License

© 2026 Vijay Dairy. All rights reserved.

## Support

For issues or feature requests, contact: operations.analyst@vijaymilk.in

---

**Version:** 1.0.0
**Last Updated:** June 2026
