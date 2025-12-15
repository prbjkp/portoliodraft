/**********************************************************
 * CORE ELEMENTS
 **********************************************************/
const sphere = document.getElementById("sphere");
const photos = document.querySelectorAll(".photo");
const startContainer = document.getElementById("start-container");
const scene = document.getElementById("scene");
const textRing = document.getElementById("start-text-ring");
const letters = textRing.querySelectorAll("span");
const overlay = document.getElementById("overlay");
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
let sphereRadius = 2400;
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

computePositions();
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
 * IMAGE ORIENTATION (portrait detection)
 **********************************************************/
photos.forEach(photo => {
  const img = photo.querySelector("img");
  if (img.complete) applyOrientation(photo, img);
  else img.addEventListener("load", () => applyOrientation(photo, img));
});

function applyOrientation(photo, img) {
  const isPortrait = img.naturalHeight > img.naturalWidth;
  photo.classList.toggle("portrait", isPortrait);
}

/**********************************************************
 * ATTRIBUTE HELPERS
 **********************************************************/
function getFaceStrength(photo) {
  switch (photo.dataset.face) {
    case "none": return 0;
    case "half": return 0.5;
    default: return 1; // full
  }
}

function getTilt(photo) {
  return parseFloat(photo.dataset.tilt || 0);
}

function getDepth(photo) {
  return parseFloat(photo.dataset.depth || 0);
}

/**********************************************************
 * ANIMATION LOOP
 **********************************************************/
function animateSphere() {
  if (!isDragging) targetRotY += autoRotateSpeed;

  rotX += (targetRotX - rotX) * 0.1;
  rotY += (targetRotY - rotY) * 0.1;

  // Rotate outer shell
  sphere.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;

  // Lock center sphere visually
  if (centerSphere) {
    centerSphere.style.transform =
      `translate(-50%, -50%) rotateY(${-rotY}deg) rotateX(${-rotX}deg)`;
  }

  // Position & orient photos
  photos.forEach((photo, i) => {
    const pos = positions[i];
    const faceStrength = getFaceStrength(photo);
    const tilt = getTilt(photo);
    const depth = getDepth(photo);
    const portraitDepth = photo.classList.contains("portrait") ? -120 : 0;

    photo.style.transform = `
      translate(-50%, -50%)
      translate3d(
        ${pos.x}px,
        ${pos.y}px,
        ${pos.z + depth + portraitDepth}px
      )
      rotateY(${-rotY * faceStrength}deg)
      rotateX(${-rotX * faceStrength}deg)
      rotateZ(${tilt}deg)
    `;
  });

  requestAnimationFrame(animateSphere);
}

animateSphere();

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
    const imgSrc = photo.querySelector("img").src;
    overlay.innerHTML =
      `<button id="overlay-close">✕</button><img src="${imgSrc}">`;
    overlay.style.display = "flex";
    requestAnimationFrame(() => overlay.style.opacity = "1");

    document.getElementById("overlay-close")
      .addEventListener("click", closeOverlay);
  });
});

function closeOverlay() {
  overlay.style.opacity = "0";
  overlay.style.pointerEvents = "none";
}

window.addEventListener("keydown", e => {
  if (e.key === "Escape") closeOverlay();
});
