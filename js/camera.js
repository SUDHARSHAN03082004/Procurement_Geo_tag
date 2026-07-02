// ============================================================
// CAMERA.JS — Camera start, flip, capture, photo overlay
// ============================================================

async function startCamera() {
    try {
        const constraints = {
            video: {
                facingMode: { ideal: STATE.cameraFacingMode },
                width: { ideal: 1280 },
                height: { ideal: 960 },
            },
            audio: false,
        };
        STATE.videoStream = await navigator.mediaDevices.getUserMedia(constraints);
        document.getElementById('videoFeed').srcObject = STATE.videoStream;
    } catch (e) {
        console.warn('Camera error:', e);
        showMessage('📷 Camera not available', 'error');
    }
}

async function flipCamera() {
    if (STATE.videoStream) {
        STATE.videoStream.getTracks().forEach(t => t.stop());
    }
    const original = STATE.cameraFacingMode;
    STATE.cameraFacingMode = (STATE.cameraFacingMode === 'environment') ? 'user' : 'environment';
    try {
        await startCamera();
    } catch (e) {
        // Revert if new mode fails
        STATE.cameraFacingMode = original;
        await startCamera();
        showMessage('⚠️ Front camera not available. Using back camera.', 'error');
    }
}

function capturePhoto() {
    const video  = document.getElementById('videoFeed');
    const canvas = document.createElement('canvas');
    canvas.width  = video.videoWidth  || 1280;
    canvas.height = video.videoHeight || 960;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    addPhotoOverlay(ctx, canvas.width, canvas.height);

    STATE.capturedPhoto = canvas.toDataURL('image/jpeg', 0.85);

    document.getElementById('previewImg').src = STATE.capturedPhoto;
    document.getElementById('photoPreview').classList.add('active');
    document.getElementById('photoActions').classList.add('active');
}

function addPhotoOverlay(ctx, w, h) {
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, h - 140, w, 140);

    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';

    const user = STATE.currentUser ? `ID: ${STATE.currentUser.id} — ${STATE.currentUser.name}` : '';
    const gps  = STATE.currentPosition
        ? `GPS: ${STATE.currentPosition.latitude.toFixed(4)}, ${STATE.currentPosition.longitude.toFixed(4)}`
        : 'GPS unavailable';
    const loc  = STATE.currentLocationName || 'Location detecting...';
    const ts   = new Date().toLocaleString('en-IN');

    // User info (20px bold)
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(user, 14, h - 110);

    // Location (24px bold - most prominent)
    ctx.font = 'bold 26px sans-serif';
    ctx.fillStyle = '#ffeb3b';
    ctx.fillText(loc, 14, h - 75);

    // GPS (16px)
    ctx.font = '16px sans-serif';
    ctx.fillStyle = 'white';
    ctx.fillText(gps, 14, h - 50);

    // Timestamp (16px, right-aligned)
    ctx.textAlign = 'right';
    ctx.fillText(ts, w - 14, h - 50);
}

function confirmPhoto() {
    document.getElementById('photoPreview').classList.remove('active');
    document.getElementById('photoActions').classList.remove('active');
    document.getElementById('formSection').classList.add('active');
}

function retakePhoto() {
    STATE.capturedPhoto = null;
    STATE.punchAction = null;
    document.getElementById('previewImg').src = '';
    document.getElementById('photoPreview').classList.remove('active');
    document.getElementById('photoActions').classList.remove('active');
    document.getElementById('formSection').classList.remove('active');
    document.getElementById('punchStatus').textContent = '';
}

function handlePunchAction(action) {
    STATE.punchAction = action;
    const actionLabel = action === 'morning' ? '🟢 Punch In' : '🔴 Punch Out';
    document.getElementById('punchStatus').textContent = `${actionLabel} selected ✓`;
}
