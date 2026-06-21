let noteId = null;
let locked = false;
let rotation = 0;

const card = document.getElementById('card');
const img = document.getElementById('img');
const lockBtn = document.getElementById('lockBtn');
const dupBtn = document.getElementById('dupBtn');
const downloadBtn = document.getElementById('downloadBtn');
const closeBtn = document.getElementById('closeBtn');
const resizeHandle = document.getElementById('resize-handle');

window.stickyShots.onInit((data) => {
  noteId = data.id;
  locked = !!data.locked;
  rotation = data.rotation || 0;
  applyLockVisual();
  applyRotation();

  // dataUrl is already a full data:image/... URL, no need to prepend file://
  img.onload = () => {
    if (data.isNew && img.naturalWidth && img.naturalHeight) {
      window.stickyShots.fitToImage(noteId, {
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
      });
    }
  };
  img.src = data.dataUrl;
});

// ---------------------------------------------------------------
// DRAG
// ---------------------------------------------------------------
let isPointerDown = false;
let dragStarted = false;
let pickupTimer = null;

card.style.webkitAppRegion = 'drag';

card.addEventListener('mousedown', (e) => {
  if (locked) return;
  if (e.target.closest('#toolbar') || e.target.closest('#resize-handle')) return;
  isPointerDown = true;
  dragStarted = false;

  pickupTimer = setTimeout(() => {
    dragStarted = true;
    card.classList.add('dragging');
    rotation = (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 3);
    applyRotation();
  }, 80);
});

window.addEventListener('mouseup', () => {
  if (pickupTimer) clearTimeout(pickupTimer);
  isPointerDown = false;
  if (dragStarted) {
    card.classList.remove('dragging');
    rotation = 0;
    applyRotation();
    window.stickyShots.rotate(noteId, rotation);
  }
  dragStarted = false;
});

function applyRotation() {
  card.style.transform = `rotate(${rotation}deg)`;
}

// ---------------------------------------------------------------
// LOCK toggle
// ---------------------------------------------------------------
function applyLockVisual() {
  card.classList.toggle('locked', locked);
  card.style.webkitAppRegion = locked ? 'no-drag' : 'drag';
  lockBtn.classList.toggle('locked', locked);
  lockBtn.title = locked ? 'Unlock' : 'Lock position';
}

lockBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  locked = !locked;
  applyLockVisual();
  window.stickyShots.toggleLock(noteId, locked);
});

// ---------------------------------------------------------------
// DUPLICATE / DOWNLOAD / CLOSE
// ---------------------------------------------------------------
dupBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  window.stickyShots.duplicate(noteId);
});

downloadBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  window.stickyShots.download(noteId);
});

closeBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  window.stickyShots.close(noteId);
});

// ---------------------------------------------------------------
// RESIZE via corner handle
// ---------------------------------------------------------------
let resizing = false;
let resizeStart = { x: 0, y: 0, w: 0, h: 0 };

resizeHandle.addEventListener('mousedown', (e) => {
  e.stopPropagation();
  resizing = true;
  resizeStart = {
    x: e.screenX,
    y: e.screenY,
    w: window.innerWidth,
    h: window.innerHeight,
  };
});

window.addEventListener('mousemove', (e) => {
  if (!resizing) return;
  const dx = e.screenX - resizeStart.x;
  const dy = e.screenY - resizeStart.y;
  const newW = Math.max(120, resizeStart.w + dx);
  const newH = Math.max(120, resizeStart.h + dy);
  window.stickyShots.resize(noteId, { width: newW, height: newH });
});

window.addEventListener('mouseup', () => {
  resizing = false;
});

// double-click to reset rotation
img.addEventListener('dblclick', () => {
  rotation = 0;
  applyRotation();
  window.stickyShots.rotate(noteId, rotation);
});
