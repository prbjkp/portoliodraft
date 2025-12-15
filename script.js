/**********************************************************
* VARIABLES
**********************************************************/
const sphere = document.getElementById("sphere");
const photos = document.querySelectorAll(".photo");
const startContainer = document.getElementById("start-container");
const scene = document.getElementById("scene");
const textRing = document.getElementById("start-text-ring");
const letters = textRing.querySelectorAll("span");
const overlay = document.getElementById("overlay");
const centerSphere = document.getElementById("center-sphere");

let rotX = 0, rotY = 0;
let targetRotX = 0, targetRotY = 0;
let isDragging = false;
let lastX = 0, lastY = 0;

const autoRotateSpeed = 0.03;
const toRad = Math.PI / 180;

let sphereRadius = 360;
const positions = [];

/**********************************************************
* IMAGE ORIENTATION DETECTION
**********************************************************/
photos.forEach(photo => {
  const img = photo.querySelector("img");
  if (!img) return;

  if (img.complete) {
    applyOrientation(photo, img);
  } else {
    img.addEventListener("load", () => applyOrientation(photo, img));
  }
});

function applyOrientation(photo, img) {
  const isPortrait = img.naturalHeight > img.naturalWidth;
  photo.classList.toggle("portrait", isPortrait);
}

/**********************************************************
* COMPUTE SPHERE POSITIONS
**********************************************************/
function computePositions() {
  const centerRadius = centerSphere ? centerSphere.offsetWidth / 2 : 110;
  const photoHalf = photos[0]
    ? Math.max(photos[0].offsetWidth, photos[0].offsetHeight) / 2
    : 90;

  const baseRadius = centerRadius + photoHalf + 600;
  const spreadScale = 2.2;
  const minOuterRadius = 3200;

  sphereRadius = Math.max(baseRadius * spreadScale, minOuterRadius);

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
* ANIMATION LOOP (WORLD-LOCKED)
**********************************************************/
function animateSphere() {
  if (!isDragging) targetRotY += autoRotateSpeed;

  rotX += (targetRotX - rotX) * 0.1;
  rotY += (targetRotY - rotY) * 0.1;

  // Rotate entire sphere
  sphere.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;

  // Keep center sphere visually stable
  if (centerSphere) {
    centerSphere.style.transform =
      `translate(-50%, -50%) rotateX(${-rotX}deg) rotateY(${-rotY}deg)`;
  }

  // World-locked images (NO counter-rotation)
  photos.forEach((photo, i) => {
    const pos = positions[i];
    const depthOffset = photo.classList.contains("portrait") ? -120 : 0;

    photo.style.transform =
      `translate(-50%,-50%)
       translate3d(${pos.x}px, ${pos.y}px, ${pos.z + depthOffset}px)`;
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
    const src = photo.querySelector("img").src;
    overlay.innerHTML =
      `<button id="overlay-close">✕</button><img src="${src}">`;
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

/**********************************************************
* MISC
**********************************************************/
photos.forEach(p => p.ondragstart = e => e.preventDefault());
document.body.style.userSelect = "none";
