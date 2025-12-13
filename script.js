/* ===============================
   3D SPHERE SETUP
================================ */
const sphere = document.getElementById("sphere");
const photos = document.querySelectorAll(".photo");

const radius = 600;
const rows = 6;
const cols = 10;

let index = 0;

for (let y = 0; y < rows; y++) {
  const v = y / (rows - 1);
  const phi = (v - 0.5) * Math.PI; // latitude

  for (let x = 0; x < cols; x++) {
    if (!photos[index]) return;

    const u = x / cols;
    const theta = u * Math.PI * 2; // longitude

    const px = radius * Math.cos(phi) * Math.sin(theta);
    const py = radius * Math.sin(phi);
    const pz = radius * Math.cos(phi) * Math.cos(theta);

    photos[index].style.transform = `
      translate3d(${px}px, ${py}px, ${pz}px)
      rotateY(${theta * 180 / Math.PI + 180}deg)
      rotateX(${-phi * 180 / Math.PI}deg)
    `;

    index++;
  }
}

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


let rotX = 0;
let rotY = 0;

window.addEventListener("mousemove", (e) => {
  const x = (e.clientX / window.innerWidth - 0.5) * 180;
  const y = (e.clientY / window.innerHeight - 0.5) * 180;

  rotY = x * 0.4;
  rotX = -y * 0.4;

  sphere.style.transform = `
    rotateX(${rotX}deg)
    rotateY(${rotY}deg)
  `;
});
