const cleanImg = document.getElementById("treeClean");
const rustImg  = document.getElementById("treeRust");

let rustAmount   = 0;    // 0 = נקי, 1 = חלוד לגמרי
let zoomCenterX  = 0.5;  // איפה העכבר בציר X (0–1)
let zoomCenterY  = 0.5;  // איפה העכבר בציר Y (0–1)

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

function updateView() {
  // כמה חלודה
  rustImg.style.opacity = rustAmount;

  // כמה זום — כאן חיזקתי כדי שיהיה "יותר זום אין"
  const scale = 1 + rustAmount * 0.6;  // אפשר להגדיל עוד אם תרצי

  // זום לפי מיקום העכבר / האצבע
  const cx = zoomCenterX - 0.5; // יחסי למרכז (-0.5 עד 0.5)
  const cy = zoomCenterY - 0.5;

  const move = rustAmount * 140; // כמה להזיז בפיקסלים כשמאוד קרוב
  const dx = -cx * move;
  const dy = -cy * move;

  const transform =
    `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${scale})`;

  cleanImg.style.transform = transform;
  rustImg.style.transform  = transform;
}

/* ----- מחשב: גלגלת + מיקום עכבר ----- */

// גלילה – מוסיפה/מורידה חלודה + זום
window.addEventListener("wheel", (e) => {
  e.preventDefault();

  if (e.deltaY < 0) {
    rustAmount += 0.06; // יותר מהיר
  } else {
    rustAmount -= 0.06;
  }

  rustAmount = clamp01(rustAmount);
  updateView();
}, { passive: false });

// תזוזת עכבר – משנה את נקודת הזום
window.addEventListener("mousemove", (e) => {
  zoomCenterX = e.clientX / window.innerWidth;
  zoomCenterY = e.clientY / window.innerHeight;
});

/* ----- נייד: גרירה למעלה/למטה (אצבע אחת) ----- */

let lastTouchY = null;

window.addEventListener("touchstart", (e) => {
  if (e.touches.length === 1) {
    lastTouchY = e.touches[0].clientY;
  }
}, { passive: false });

window.addEventListener("touchmove", (e) => {
  if (e.touches.length === 1 && lastTouchY !== null) {
    e.preventDefault();
    const currentY = e.touches[0].clientY;
    const dy = lastTouchY - currentY;   // גרירה למעלה = חיובי

    const sensitivity = 0.003;          // כמה מהר משתנה החלודה
    rustAmount += dy * sensitivity;
    rustAmount = clamp01(rustAmount);

    // גם במובייל – מרכז זום לפי אצבע
    zoomCenterX = e.touches[0].clientX / window.innerWidth;
    zoomCenterY = e.touches[0].clientY / window.innerHeight;

    lastTouchY = currentY;
    updateView();
  }
}, { passive: false });

window.addEventListener("touchend", () => {
  lastTouchY = null;
});

updateView();
window.addEventListener("mousemove", (e) => {
  const bounds = wrapper.getBoundingClientRect();
  const mouseX = ((e.clientX - bounds.left) / bounds.width) * 100;
  const mouseY = ((e.clientY - bounds.top) / bounds.height) * 100;

  wrapper.style.transformOrigin = `${mouseX}% ${mouseY}%`;
});
window.addEventListener("touchmove", (e) => {
  const touch = e.touches[0];
  const bounds = wrapper.getBoundingClientRect();
  const x = ((touch.clientX - bounds.left) / bounds.width) * 100;
  const y = ((touch.clientY - bounds.top) / bounds.height) * 100;

  wrapper.style.transformOrigin = `${x}% ${y}%`;
});
