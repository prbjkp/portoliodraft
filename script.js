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
const textRingSvg = document.getElementById("text-ring-svg");
let textOrbit = 0;


/**********************************************************
 * ROTATION STATE
 **********************************************************/
let rotX = 0, rotY = 0;
let targetRotX = 0, targetRotY = 0;
let isDragging = false;
let lastX = 0, lastY = 0;

const autoRotateSpeed = 0.03;
const toRad = Math.PI / 180;

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
 * TEXT RING BILLBOARDING
 **********************************************************/
const textOrbitSpeed = 0.2;

letters.forEach(letter => {
  const baseAngle = Number(letter.dataset.angle);
  const angle = baseAngle + rotY * textOrbitSpeed;

  letter.style.transform = `
    rotateY(${angle}deg)
    translateZ(${textRadius}px)
    rotateY(${-angle - rotY}deg)
    rotateX(${-rotX}deg)
  `;
});


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
const faceStrength = 1; // 1 = full billboard | 0.5 = hybrid | 0 = world-locked

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
  /**********************************************************
 * CURVED TEXT RING (UNIVERSAL STYLE)
 **********************************************************/
textOrbit += 0.15;

textRingSvg.style.transform = `
  translateZ(180px)
  rotateY(${textOrbit}deg)
  rotateX(${-rotX}deg)
  rotateY(${-rotY}deg)
`;

/**********************************************************
 * TEXT WRAPPED ON SPHERE SURFACE
 **********************************************************/
const textBand = document.querySelector(".text-band");
const textSegments = document.querySelectorAll(".text-segment");

const bandRadius = 90;          // slightly larger than sphere radius
const bandY = 0;                // equator
const segmentCount = textSegments.length;

textSegments.forEach((seg, i) => {
  const angle = (360 / segmentCount) * i;

  seg.dataset.angle = angle;

  seg.style.transform = `
    rotateY(${angle}deg)
    translateZ(${bandRadius}px)
  `;
});

let textRotation = 0;

/**********************************************************
 * SPHERE-WRAPPED TEXT ROTATION
 **********************************************************/
textRotation += 0.05;

textBand.style.transform = `
  translate(-50%, -50%)
  rotateY(${textRotation}deg)
`;
textBand.style.transform = `
  translate(-50%, -50%)
  rotateY(${textRotation - rotY}deg)
  rotateX(${-rotX * 0.1}deg)
`;


photos.forEach((photo, i) => {
  const pos = positions[i];
  const isPortrait = photo.classList.contains("portrait");

  const depth = Number(photo.dataset.depth || 0);
  const portraitFix = isPortrait ? -90 : 0;

  photo.style.transform = `
    translate(-50%, -50%)
    translate3d(
      ${pos.x}px,
      ${pos.y}px,
      ${pos.z + depth}px
    )
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
startContainer.addEventListener("click", () => {
  textRing.style.opacity = "0";
  textRing.style.pointerEvents = "none";
  scene.style.opacity = "1";
  scene.style.pointerEvents = "auto";
});

/**********************************************************
 * IMAGE ZOOM OVERLAY
 **********************************************************/
const overlayImg = document.getElementById("overlay-img");
const overlayClose = document.getElementById("overlay-close");

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

function closeOverlay() {
  overlay.style.opacity = "0";
  overlay.style.pointerEvents = "none";
}

window.addEventListener("keydown", e => {
  if (e.key === "Escape") closeOverlay();
});
