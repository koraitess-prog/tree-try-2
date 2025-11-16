// אלמנטים
const root = document.documentElement;
const scene = document.getElementById("scene");

const clean = document.getElementById("treeClean");
const rust1 = document.getElementById("treeRust1");
const rust2 = document.getElementById("treeRust2");
const rustFull = document.getElementById("treeRustFull");

// זום
const MIN_ZOOM = 1;
const MAX_ZOOM = 10;

let currentZoom = 1;
let targetZoom = 1;

// חלודה (0 = נקי, 1 = אכול לגמרי)
let rustProgress = 0;
let targetRust = 0;

// נקודת הזום (באחוזים מהמסך)
let originX = 50;
let originY = 50;

// פונקציות עזר
function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t); // עקומה לא ליניארית
}

function setOriginFromClientPos(clientX, clientY) {
  const rect = scene.getBoundingClientRect();
  originX = ((clientX - rect.left) / rect.width) * 100;
  originY = ((clientY - rect.top) / rect.height) * 100;
}

function updateTargetRustFromZoom() {
  const t = (targetZoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM);
  targetRust = clamp(t, 0, 1);
}

// -------------------- זום עם עכבר --------------------
scene.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();

    // גלילה למעלה = זום אין, למטה = זום אאוט
    const delta = -e.deltaY;
    const step = delta > 0 ? 0.4 : -0.4;

    targetZoom = clamp(targetZoom + step, MIN_ZOOM, MAX_ZOOM);

    // מוקד הזום לפי מיקום העכבר
    setOriginFromClientPos(e.clientX, e.clientY);

    updateTargetRustFromZoom();
  },
  { passive: false }
);

// -------------------- זום עם פִינְץ' בנייד --------------------
let pinchStartDistance = null;
let pinchStartZoom = 1;

scene.addEventListener(
  "touchstart",
  (e) => {
    if (e.touches.length === 2) {
      pinchStartDistance = getDistance(e.touches[0], e.touches[1]);
      pinchStartZoom = targetZoom;
      setOriginFromTouchCenter(e);
    }
  },
  { passive: false }
);

scene.addEventListener(
  "touchmove",
  (e) => {
    if (e.touches.length === 2 && pinchStartDistance) {
      e.preventDefault();

      const newDist = getDistance(e.touches[0], e.touches[1]);
      const factor = newDist / pinchStartDistance;

      targetZoom = clamp(pinchStartZoom * factor, MIN_ZOOM, MAX_ZOOM);
      setOriginFromTouchCenter(e);
      updateTargetRustFromZoom();
    }
  },
  { passive: false }
);

scene.addEventListener(
  "touchend",
  (e) => {
    if (e.touches.length < 2) {
      pinchStartDistance = null;
    }
  },
  { passive: false }
);

function getDistance(t1, t2) {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.hypot(dx, dy);
}

function setOriginFromTouchCenter(e) {
  const rect = scene.getBoundingClientRect();
  const x = (e.touches[0].clientX + e.touches[1].clientX) / 2;
  const y = (e.touches[0].clientY + e.touches[1].clientY) / 2;

  originX = ((x - rect.left) / rect.width) * 100;
  originY = ((y - rect.top) / rect.height) * 100;
}

// -------------------- לולאת אנימציה --------------------
function animate() {
  // זום מתקרב בהדרגה ליעד (תנועה חלקה)
  currentZoom += (targetZoom - currentZoom) * 0.12;

  root.style.setProperty("--scale", currentZoom.toString());
  root.style.setProperty("--originX", originX + "%");
  root.style.setProperty("--originY", originY + "%");

  // חלודה – גם מתקרבת לאט ליעד
  rustProgress += (targetRust - rustProgress) * 0.08;

  const r = rustProgress;

  // כל שכבה נדלקת בטווח אחר של "חלודה"
  const o1 = smoothstep(0.05, 0.4, r); // שכבה 1
  const o2 = smoothstep(0.25, 0.7, r); // שכבה 2
  const o3 = smoothstep(0.6, 1.0, r); // חלודה מלאה

  // קצת "חיים" רכים באמצעות סינוס – לא לגמרי סטטי
  const time = performance.now() / 1000;

  rust1.style.opacity = clamp(o1 + Math.sin(time * 1.3) * 0.05, 0, 1);
  rust2.style.opacity = clamp(o2 + Math.sin(time * 1.7 + 1) * 0.05, 0, 1);
  rustFull.style.opacity = clamp(o3 + Math.sin(time * 2.1 + 2) * 0.05, 0, 1);

  requestAnimationFrame(animate);
}

animate();
