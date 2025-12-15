/**********************************************************
 * CORE ELEMENTS
 **********************************************************/
const sphere = document.getElementById("sphere");
const photos = document.querySelectorAll(".photo");
const startContainer = document.getElementById("start-container");
const scene = document.getElementById("scene");
const textRing = document.getElementById("start-text-ring");
const textRingSvg = document.getElementById("text-ring-svg");
const centerSphere = document.getElementById("center-sphere");
const overlay = document.getElementById("overlay");
const overlayImg = document.getElementById("overlay-img");
const overlayClose = document.getElementById("overlay-close");

/**********************************************************
 * TEXT RING CONSTANTS
 **********************************************************/
const TEXT_RING_DISTANCE = 95; // just above sphere surface
let textOrbit = 0;

/**********************************************************
 * ROTATION STATE
 **********************************************************/
let rotX = 0, rotY = 0;
let targetRotX = 0, targetRotY = 0;
let isDragging = false;
let lastX = 0, lastY = 0;

const autoRotateSpeed = 0.03;

/**********************************************************
 * SPHERE LAYOUT (PHOTO DISTRIBUTION)
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

computePositions();
window.addEventListener("resize", computePositions);

/**********************************************************
 * IMAGE ORIENTATION DETECTION
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
 * ANIMATION LOOP
 **********************************************************/
function animateSphere() {
  if (!isDragging) targetRotY += autoRotateSpeed;

  rotX += (targetRotX - rotX) * 0.1;
  rotY += (targetRotY - rotY) * 0.1;

  /* ROTATE PHOTO SPHERE */
  sphere.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;

  /* LOCK CENTER SPHERE TO CAMERA */
  centerSphere.style.transform =
    `translate(-50%, -50%) rotateY(${-rotY}deg) rotateX(${-rotX}deg)`;

  /* CAMERA-LOCKED TEXT RING */
  textOrbit += 0.15;

/**********************************************************
 * CAMERA-LOCKED TEXT RING (DOES NOT FOLLOW SPHERE)
 **********************************************************/
textOrbit += 0.01;

/* World-locked ring (never affected by rotX / rotY) */
textRing.style.transform = `
  translate(-50%, -50%)
`;

/* Only self-rotation */
textRingSvg.style.transform = `
  translateZ(${TEXT_RING_DISTANCE}px)
  rotateZ(${textOrbit}deg)
`;


  /* POSITION PHOTOS */
  photos.forEach((photo, i) => {
    const pos = positions[i];
    if (!pos) return;

    const isPortrait = photo.classList.contains("portrait");
    const portraitFix = isPortrait ? -90 : 0;

    photo.style.transform = `
      translate(-50%, -50%)
      translate3d(${pos.x}px, ${pos.y}px, ${pos.z}px)
      rotateY(${-rotY}deg)
      rotateX(${-rotX}deg)
      rotateZ(${portraitFix}deg)
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
if (startContainer) {
  startContainer.addEventListener("click", () => {
    textRing.style.opacity = "0";
    textRing.style.pointerEvents = "none";
    scene.style.opacity = "1";
    scene.style.pointerEvents = "auto";
  });
}

/**********************************************************
 * IMAGE ZOOM OVERLAY
 **********************************************************/
photos.forEach(photo => {
  photo.addEventListener("click", () => {
    overlayImg.src = photo.querySelector("img").src;
    overlay.style.display = "flex";
    overlay.style.pointerEvents = "auto";

    requestAnimationFrame(() => {
      overlay.style.opacity = "1";
    });
  });
});

overlayClose.addEventListener("click", closeOverlay);
window.addEventListener("keydown", e => {
  if (e.key === "Escape") closeOverlay();
});

function closeOverlay() {
  overlay.style.opacity = "0";
  overlay.style.pointerEvents = "none";
}
