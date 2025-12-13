/* ===============================
   3D SPHERE SETUP
================================ */

const sphere = document.getElementById("sphere");
const photos = document.querySelectorAll(".photo img");

let rotationY = 0;
let rotationX = 0;
let isDragging = false;
let lastX = 0;
let lastY = 0;
let idleTimer = null;

/* Arrange photos in a sphere */
const radius = 320;
const count = photos.length;

photos.forEach((img, i) => {
  const phi = Math.acos(-1 + (2 * i) / count);
  const theta = Math.sqrt(count * Math.PI) * phi;

  const x = radius * Math.cos(theta) * Math.sin(phi);
  const y = radius * Math.sin(theta) * Math.sin(phi);
  const z = radius * Math.cos(phi);

  img.parentElement.style.transform =
    `translate3d(${x}px, ${y}px, ${z}px)`;
});

/* ===============================
   AUTO ROTATION
================================ */

function autoRotate() {
  if (!isDragging) {
    rotationY += 0.05;
    sphere.style.transform =
      `rotateX(${rotationX}deg) rotateY(${rotationY}deg)`;
  }
  requestAnimationFrame(autoRotate);
}

autoRotate();

/* ===============================
   MOUSE + TOUCH ROTATION
================================ */

function startDrag(x, y) {
  isDragging = true;
  lastX = x;
  lastY = y;
  clearTimeout(idleTimer);
}

function dragMove(x, y) {
  if (!isDragging) return;

  const dx = x - lastX;
  const dy = y - lastY;

  rotationY += dx * 0.3;
  rotationX -= dy * 0.3;

  rotationX = Math.max(-90, Math.min(90, rotationX));

  sphere.style.transform =
    `rotateX(${rotationX}deg) rotateY(${rotationY}deg)`;

  lastX = x;
  lastY = y;
}

function endDrag() {
  isDragging = false;
}

/* Mouse */
window.addEventListener("mousedown", e => startDrag(e.clientX, e.clientY));
window.addEventListener("mousemove", e => dragMove(e.clientX, e.clientY));
window.addEventListener("mouseup", endDrag);

/* Touch */
window.addEventListener("touchstart", e => {
  const t = e.touches[0];
  startDrag(t.clientX, t.clientY);
});

window.addEventListener("touchmove", e => {
  const t = e.touches[0];
  dragMove(t.clientX, t.clientY);
});

window.addEventListener("touchend", endDrag);

/* ===============================
   CLICK → ZOOM ANIMATION
================================ */

const overlay = document.getElementById("overlay");
const closeBtn = document.getElementById("overlay-close");

let activeClone = null;
let originRect = null;

photos.forEach(img => {
  img.addEventListener("click", e => {
    e.stopPropagation();
    openImage(img);
  });
});

function openImage(img) {
  originRect = img.getBoundingClientRect();

  activeClone = img.cloneNode(true);
  activeClone.classList.add("zoom-clone");

  activeClone.style.top = `${originRect.top}px`;
  activeClone.style.left = `${originRect.left}px`;
  activeClone.style.width = `${originRect.width}px`;
  activeClone.style.height = `${originRect.height}px`;

  document.body.appendChild(activeClone);
  activeClone.getBoundingClientRect();

  const maxW = window.innerWidth * 0.9;
  const maxH = window.innerHeight * 0.9;
  const aspect = originRect.width / originRect.height;

  let finalW = maxW;
  let finalH = finalW / aspect;

  if (finalH > maxH) {
    finalH = maxH;
    finalW = finalH * aspect;
  }

  activeClone.style.top = `${(window.innerHeight - finalH) / 2}px`;
  activeClone.style.left = `${(window.innerWidth - finalW) / 2}px`;
  activeClone.style.width = `${finalW}px`;
  activeClone.style.height = `${finalH}px`;

  overlay.classList.add("show");
}

/* Close logic */
function closeImage() {
  if (!activeClone) return;

  activeClone.style.top = `${originRect.top}px`;
  activeClone.style.left = `${originRect.left}px`;
  activeClone.style.width = `${originRect.width}px`;
  activeClone.style.height = `${originRect.height}px`;

  overlay.classList.remove("show");

  activeClone.addEventListener("transitionend", () => {
    activeClone.remove();
    activeClone = null;
  }, { once: true });
}

closeBtn.addEventListener("click", closeImage);
overlay.addEventListener("click", closeImage);

/* ESC KEY */
window.addEventListener("keydown", e => {
  if (e.key === "Escape") closeImage();
});
