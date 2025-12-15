/**********************************************************
 * CORE ELEMENTS
 **********************************************************/
const sphere = document.getElementById("sphere");
const photos = Array.from(document.querySelectorAll(".photo"));
const startContainer = document.getElementById("start-container");
const scene = document.getElementById("scene");
const textRing = document.getElementById("start-text-ring");
const letters = textRing.querySelectorAll("span");
const overlay = document.getElementById("overlay");
const overlayImg = document.getElementById("overlay-img");
const overlayClose = document.getElementById("overlay-close");
const centerSphere = document.getElementById("center-sphere");

/**********************************************************
 * ROTATION STATE
 **********************************************************/
let rotX = 0, rotY = 0;
let targetRotX = 0, targetRotY = 0;
let isDragging = false;
let lastX = 0, lastY = 0;
const autoRotateSpeed = 0.03;

/**********************************************************
 * SPHERE LAYOUT
 **********************************************************/
const sphereRadius = 2400;
const positions = [];

function computePositions() {
  positions.length = 0;
  const total = photos.length;
  photos.forEach((_, i) => {
    const phi = Math.acos(1 - 2 * (i + 0.5) / total);
    const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
    const x = sphereRadius * Math.sin(phi) * Math.cos(theta);
    const y = sphereRadius * Math.cos(phi);
    const z = sphereRadius * Math.sin(phi) * Math.sin(theta);
    positions.push({ x, y, z: -z });
  });
}

window.addEventListener("resize", computePositions);

/**********************************************************
 * START TEXT RING
 **********************************************************/
const textRadius = 110;
letters.forEach((letter, i) => {
  const angle = (360 / letters.length) * i;
  letter.style.transform = `rotateY(${angle}deg) translateZ(${textRadius}px)`;
});

/**********************************************************
 * IMAGE LOADING AND ORIENTATION
 **********************************************************/
let imagesLoaded = 0;

photos.forEach(photo => {
  const img = photo.querySelector("img");
  if (img.complete) handleLoaded(photo, img);
  else img.addEventListener("load", () => handleLoaded(photo, img));
});

function handleLoaded(photo, img) {
  const isPortrait = img.naturalHeight > img.naturalWidth;

  // Assign container type based on orientation
  photo.classList.toggle("portrait", isPortrait);
  photo.classList.toggle("landscape", !isPortrait);
  photo.dataset.portrait = isPortrait;

  imagesLoaded++;
  if (imagesLoaded === photos.length) {
    computePositions();
    animateSphere(); // start animation once all images loaded
  }
}

/**********************************************************
 * ANIMATION LOOP
 **********************************************************/
function animateSphere() {
  if (!isDragging) targetRotY += autoRotateSpeed;

  rotX += (targetRotX - rotX) * 0.1;
  rotY += (targetRotY - rotY) * 0.1;

  // Rotate entire sphere
  sphere.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;

  // Keep center sphere visually locked
  if (centerSphere) {
    centerSphere.style.transform = `translate(-50%, -50%) rotateY(${-rotY}deg) rotateX(${-rotX}deg)`;
  }

  // Position and rotate each photo
  photos.forEach((photo, i) => {
    const pos = positions[i];
    const rotateZ = photo.dataset.portrait === "true" ? 90 : 0;

    photo.style.transform = `
      translate(-50%, -50%)
      translate3d(${pos.x}px, ${pos.y}px, ${pos.z}px)
      rotateY(${-rotY}deg)
      rotateX(${-rotX}deg)
      rotateZ(${rotateZ}deg)
    `;
  });

  requestAnimationFrame(animateSphere);
}

/**********************************************************
 * DRAG CONTROLS
 **********************************************************/
window.addEventListener("mousedown", e => {
  isDragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
});
window.addEventListener("mouseup", () => isDragging = false);
window.addEventListener("mouseleave", () => isDragging = false);
window.addEventListener("mousemove", e => {
  if (!isDragging) return;
  const dx = e.clientX - lastX;
  const dy = e.clientY - lastY;
  targetRotY -= dx * 0.3;
  targetRotX += dy * 0.3;
  lastX = e.clientX;
  lastY = e.clientY;
});

/**********************************************************
 * PREVENT IMAGE DRAGGING
 **********************************************************/
photos.forEach(p => p.ondragstart = e => e.preventDefault());
document.body.style.userSelect = "none";

/**********************************************************
 * START SCREEN
 **********************************************************/
startContainer.addEventListener("click", () => {
  textRing.style.opacity = "0";
  textRing.style.pointerEvents = "none";
  scene.style.opacity = "1";
  scene.style.pointerEvents = "auto";
});

/**********************************************************
 * IMAGE ZOOM OVERLAY
 **********************************************************/
photos.forEach(photo => {
  photo.addEventListener("click", () => {
    overlayImg.src = photo.querySelector("img").src;
    overlay.style.display = "flex";
    overlay.style.pointerEvents = "auto";
    requestAnimationFrame(() => overlay.style.opacity = "1");
  });
});

overlayClose.addEventListener("click", closeOverlay);
window.addEventListener("keydown", e => { if (e.key === "Escape") closeOverlay(); });

function closeOverlay() {
  overlay.style.opacity = "0";
  overlay.style.pointerEvents = "none";
}
