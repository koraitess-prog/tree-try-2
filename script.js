// -------------------------
// הגדרות בסיס
// -------------------------
const stage = document.getElementById("stage");

const cleanImg = document.getElementById("treeClean");
const rust1   = document.getElementById("treeRust1");
const rust2   = document.getElementById("treeRust2");
const rustFull = document.getElementById("treeRustFull");

const layers = [cleanImg, rust1, rust2, rustFull];

let zoom = 1;
const MIN_ZOOM = 1;
const MAX_ZOOM = 10;

// נקודת הזום – תזוז לפי העכבר / אצבע
let originX = window.innerWidth / 2;
let originY = window.innerHeight / 2;

// מרכזים שונים לכל שכבת חלודה – כדי שהתפשטות תבוא מכיוונים שונים
const centers = {
  rust1: { x: 15, y: 40 },  // שמאל
  rust2: { x: 80, y: 20 },  // ימין-למעלה
  rustFull: { x: 50, y: 80 } // מלמטה
};

// פונקציות עזר
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function smoothstep(edge0, edge1, x) {
  // מעבר עדין יותר – לא ליניארי
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

// עדכון הזום והחלודה
function updateScene() {
  // מעדכנים את ה-transform וה-origin לכל השכבות
  const originStr = `${originX}px ${originY}px`;

  layers.forEach(img => {
    img.style.transformOrigin = originStr;
    img.style.transform = `translate(-50%, -50%) scale(${zoom})`;
  });

  // התקדמות הזום בין 0 ל־1
  const progress = (zoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM);
  const p = clamp(progress, 0, 1);

  // --- שלב 1 – חלודה מתחילה לאט ---
  const p1 = smoothstep(0.08, 0.4, p); // תתחיל יחסית מוקדם ותתפשט לאט
  if (p1 > 0) {
    const r = 5 + p1 * 120; // רדיוס מעגל
    rust1.style.opacity = 0.8;
    rust1.style.clipPath = `circle(${r}% at ${centers.rust1.x}% ${centers.rust1.y}%)`;
    rust1.style.webkitClipPath = `circle(${r}% at ${centers.rust1.x}% ${centers.rust1.y}%)`;
  } else {
    rust1.style.opacity = 0;
    rust1.style.clipPath = `circle(0% at ${centers.rust1.x}% ${centers.rust1.y}%)`;
    rust1.style.webkitClipPath = `circle(0% at ${centers.rust1.x}% ${centers.rust1.y}%)`;
  }

  // --- שלב 2 – שכבת חלודה נוספת מכיוון אחר ---
  const p2 = smoothstep(0.35, 0.75, p);
  if (p2 > 0) {
    const r = 5 + p2 * 130;
    rust2.style.opacity = 0.85;
    rust2.style.clipPath = `circle(${r}% at ${centers.rust2.x}% ${centers.rust2.y}%)`;
    rust2.style.webkitClipPath = `circle(${r}% at ${centers.rust2.x}% ${centers.rust2.y}%)`;
  } else {
    rust2.style.opacity = 0;
    rust2.style.clipPath = `circle(0% at ${centers.rust2.x}% ${centers.rust2.y}%)`;
    rust2.style.webkitClipPath = `circle(0% at ${centers.rust2.x}% ${centers.rust2.y}%)`;
  }

  // --- שלב 3 – שכבת חלודה מלאה שסוגרת את הכל לאט ---
  const p3 = smoothstep(0.7, 1.0, p);
  if (p3 > 0) {
    const r = 40 + p3 * 120;
    rustFull.style.opacity = 0.9 * p3; // שתופיע לאט
    rustFull.style.clipPath = `circle(${r}% at ${centers.rustFull.x}% ${centers.rustFull.y}%)`;
    rustFull.style.webkitClipPath = `circle(${r}% at ${centers.rustFull.x}% ${centers.rustFull.y}%)`;
  } else {
    rustFull.style.opacity = 0;
    rustFull.style.clipPath = `circle(0% at ${centers.rustFull.x}% ${centers.rustFull.y}%)`;
    rustFull.style.webkitClipPath = `circle(0% at ${centers.rustFull.x}% ${centers.rustFull.y}%)`;
  }
}

// משנה זום בצורה בטוחה + קורא לעדכון
function setZoom(newZoom) {
  zoom = clamp(newZoom, MIN_ZOOM, MAX_ZOOM);
  updateScene();
}

// -------------------------
// שליטה בעזרת עכבר – זום עם גלילה
// -------------------------
stage.addEventListener("mousemove", (e) => {
  // נשמור את מיקום העכבר כדי שהזום יהיה סביבו
  const rect = stage.getBoundingClientRect();
  originX = e.clientX - rect.left;
  originY = e.clientY - rect.top;
});

stage.addEventListener("wheel", (e) => {
  e.preventDefault();

  const rect = stage.getBoundingClientRect();
  originX = e.clientX - rect.left;
  originY = e.clientY - rect.top;

  const zoomStep = 0.12; // זום איטי
  if (e.deltaY < 0) {
    setZoom(zoom * (1 + zoomStep));
  } else {
    setZoom(zoom * (1 - zoomStep));
  }
}, { passive: false });

// -------------------------
// תמיכה בסלולרי – pinch zoom
// -------------------------
let touchStartDistance = null;
let touchStartZoom = null;

function getTouchDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function getTouchCenter(touches) {
  return {
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2
  };
}

stage.addEventListener("touchstart", (e) => {
  if (e.touches.length === 2) {
    touchStartDistance = getTouchDistance(e.touches);
    touchStartZoom = zoom;

    const rect = stage.getBoundingClientRect();
    const center = getTouchCenter(e.touches);
    originX = center.x - rect.left;
    originY = center.y - rect.top;
  }
}, { passive: true });

stage.addEventListener("touchmove", (e) => {
  if (e.touches.length === 2 && touchStartDistance) {
    e.preventDefault();
    const currentDistance = getTouchDistance(e.touches);
    const scaleFactor = currentDistance / touchStartDistance;
    setZoom(touchStartZoom * scaleFactor);

    const rect = stage.getBoundingClientRect();
    const center = getTouchCenter(e.touches);
    originX = center.x - rect.left;
    originY = center.y - rect.top;
  }
}, { passive: false });

stage.addEventListener("touchend", () => {
  if (event.touches && event.touches.length < 2) {
    touchStartDistance = null;
    touchStartZoom = null;
  }
});

// הרצת עדכון ראשון
updateScene();
