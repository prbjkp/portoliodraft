document.addEventListener("DOMContentLoaded", () => {

  /* ===== ORBIT LAYOUT ===== */
  const items = document.querySelectorAll(".item");
  const radius = 350;
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  items.forEach((item, index) => {
    const angle = (index / items.length) * Math.PI * 2;
    const x = centerX + radius * Math.cos(angle) - item.offsetWidth / 2;
    const y = centerY + radius * Math.sin(angle) - item.offsetHeight / 2;
    item.style.left = `${x}px`;
    item.style.top = `${y}px`;
  });

  /* ===== SHARED ELEMENT ZOOM ===== */
  const overlay = document.getElementById("overlay");
  const closeBtn = document.getElementById("overlay-close");

  let activeClone = null;
  let originRect = null;

  document.querySelectorAll(".item img").forEach(img => {
    img.addEventListener("click", () => openImage(img));
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
    activeClone.getBoundingClientRect(); // force reflow

    const maxW = window.innerWidth * 0.85;
    const maxH = window.innerHeight * 0.85;
    const aspect = originRect.width / originRect.height;

    let finalW = maxW;
    let finalH = maxW / aspect;

    if (finalH > maxH) {
      finalH = maxH;
      finalW = maxH * aspect;
    }

    activeClone.style.top = `${(window.innerHeight - finalH) / 2}px`;
    activeClone.style.left = `${(window.innerWidth - finalW) / 2}px`;
    activeClone.style.width = `${finalW}px`;
    activeClone.style.height = `${finalH}px`;

    overlay.classList.add("show");
  }

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
  overlay.addEventListener("click", e => {
    if (e.target === overlay) closeImage();
  });

});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && activeClone) {
    closeImage();
  }
});

const photos = document.querySelectorAll(".photo");
const radius = 250;

photos.forEach((photo, i) => {
  const phi = Math.acos(-1 + (2 * i) / photos.length);
  const theta = Math.sqrt(photos.length * Math.PI) * phi;

  const x = radius * Math.cos(theta) * Math.sin(phi);
  const y = radius * Math.sin(theta) * Math.sin(phi);
  const z = radius * Math.cos(phi);

  photo.style.transform = `translate3d(${x}px, ${y}px, ${z}px)`;
});

let isDragging = false;
let lastX = 0;
let lastY = 0;
let rotX = 0;
let rotY = 0;

const sphere = document.getElementById("sphere");

sphere.addEventListener("mousedown", (e) => {
  isDragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
});

window.addEventListener("mouseup", () => {
  isDragging = false;
});

window.addEventListener("mousemove", (e) => {
  if (!isDragging) return;

  const dx = e.clientX - lastX;
  const dy = e.clientY - lastY;

  rotY += dx * 0.3;
  rotX -= dy * 0.3;

  sphere.style.transform = `
    translate(-50%, -50%)
    rotateX(${rotX}deg)
    rotateY(${rotY}deg)
  `;

  lastX = e.clientX;
  lastY = e.clientY;
});
