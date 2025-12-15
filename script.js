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
 * PROXIMITY EFFECTS
 **********************************************************/


function updateProximityEffects() {
  const cosX = Math.cos(rotX * Math.PI / 180);
  const sinX = Math.sin(rotX * Math.PI / 180);
  const cosY = Math.cos(rotY * Math.PI / 180);
  const sinY = Math.sin(rotY * Math.PI / 180);

  let anyClose = false;

  photos.forEach((photo, i) => {
    const pos = positions[i];
    if (!pos) return;

    // Rotate position with sphere rotation
    let x = pos.x, y = pos.y, z = pos.z;
    let y1 = y * cosX - z * sinX;
    let z1 = y * sinX + z * cosX;
    y = y1; z = z1;

    let x1 = x * cosY + z * sinY;
    let z2 = -x * sinY + z * cosY;
    x = x1; z = z2;

    const distance = Math.sqrt(x*x + y*y + z*z);

    // Dimming photos
    if(distance < DIM_RADIUS) photo.classList.add('dimmed');
    else photo.classList.remove('dimmed');

    if(distance < BRIGHT_RADIUS) anyClose = true;
  });

  // Brighten center sphere text if any photo is close
  if(anyClose) centerSphere.classList.add('bright-text');
  else centerSphere.classList.remove('bright-text');

  requestAnimationFrame(updateProximityEffects);
}

updateProximityEffects();


/**********************************************************
 * TEXT RING CONSTANTS
 **********************************************************/
const TEXT_RING_DISTANCE = 95;
let textOrbit = 0;

/**********************************************************
 * ROTATION STATE
 **********************************************************/
let rotX = 0, rotY = 0;
let targetRotX = 0, targetRotY = 0;
let isDragging = false;
let lastX = 0, lastY = 0;
const autoRotateSpeed = 0.05;

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

    positions.push({
      x: sphereRadius * Math.sin(phi) * Math.cos(theta),
      y: sphereRadius * Math.cos(phi),
      z: -sphereRadius * Math.sin(phi) * Math.sin(theta)
    });
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
  photo.classList.toggle("portrait", img.naturalHeight > img.naturalWidth);
}

/**********************************************************
 * PROXIMITY CONSTANTS
 **********************************************************/
const DIM_RADIUS = 250;    // pixels: images within this distance are dimmed
const BRIGHT_RADIUS = 250; // pixels: center sphere brightens when images within this radius

/**********************************************************
 * ANIMATION LOOP
 **********************************************************/
function animateSphere() {
  // Auto-rotate
  if (!isDragging) targetRotY += autoRotateSpeed;

  rotX += (targetRotX - rotX) * 0.1;
  rotY += (targetRotY - rotY) * 0.1;

  // Rotate photo sphere
  sphere.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;

  // Lock center sphere to camera
  centerSphere.style.transform =
    `translate(-50%, -50%) rotateY(${-rotY}deg) rotateX(${-rotX}deg)`;

  // Text ring self-rotation
  textOrbit += 0.01;
  textRing.style.transform = `translate(-50%, -50%)`;
  textRingSvg.style.transform = `
    translateZ(${TEXT_RING_DISTANCE}px)
    rotateZ(${textOrbit}deg)
  `;

  // Calculate cosine/sine once for rotation math
  const cosX = Math.cos(rotX * Math.PI / 180);
  const sinX = Math.sin(rotX * Math.PI / 180);
  const cosY = Math.cos(rotY * Math.PI / 180);
  const sinY = Math.sin(rotY * Math.PI / 180);

  let anyClose = false; // for center sphere text brightening

  // Position photos and apply proximity effects
  photos.forEach((photo, i) => {
    const pos = positions[i];
    if (!pos) return;

    // Rotation fix for portrait images
    const portraitFix = photo.classList.contains("portrait") ? -90 : 0;

    // Apply rotation to photo positions
    let x = pos.x;
    let y = pos.y;
    let z = pos.z;

    // Rotate around X axis
    let y1 = y * cosX - z * sinX;
    let z1 = y * sinX + z * cosX;
    y = y1; z = z1;

    // Rotate around Y axis
    let x1 = x * cosY + z * sinY;
    let z2 = -x * sinY + z * cosY;
    x = x1; z = z2;

    // Distance from camera center
    const distance = Math.sqrt(x*x + y*y + z*z);

    // Apply dimming effect
    const brightness = distance < DIM_RADIUS ? 0.35 : 1;
    photo.style.filter = `brightness(${brightness})`;

    if (distance < BRIGHT_RADIUS) anyClose = true;

    // Set 3D position
    photo.style.transform = `
      translate(-50%, -50%)
      translate3d(${pos.x}px, ${pos.y}px, ${pos.z}px)
      rotateY(${-rotY}deg)
      rotateX(${-rotX}deg)
      rotateZ(${portraitFix}deg)
    `;
  });

  // Brighten center sphere text if any photo is close
  if (anyClose) centerSphere.classList.add('bright-text');
  else centerSphere.classList.remove('bright-text');

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

["mouseup", "mouseleave"].forEach(evt =>
  window.addEventListener(evt, () => isDragging = false)
);

window.addEventListener("mousemove", e => {
  if (!isDragging) return;

  targetRotY -= (e.clientX - lastX) * 0.3;
  targetRotX += (e.clientY - lastY) * 0.3;

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

    // Auto-fire HUD hints 2s after start
    setTimeout(playHudHints, 2000);
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
    requestAnimationFrame(() => overlay.style.opacity = "1");
  });
});

overlayClose.addEventListener("click", closeOverlay);
window.addEventListener("keydown", e => e.key === "Escape" && closeOverlay());

function closeOverlay() {
  overlay.style.opacity = "0";
  overlay.style.pointerEvents = "none";
}

/**********************************************************
 * HUD HINT SEQUENCE
 **********************************************************/
const hudHints = document.querySelectorAll(".hud-hint");
const HINT_START_DELAY = 2000;
const HINT_DURATION = 4000;
const HINT_GAP = 500;

function playHudHints() {
  let index = 0;

  function showNextHint() {
    if (index >= hudHints.length) return; // stop after last

    if (index > 0) hudHints[index - 1].classList.remove("active");
    hudHints[index].classList.add("active");

    setTimeout(() => {
      hudHints[index].classList.remove("active");
      index++;
      setTimeout(showNextHint, HINT_GAP);
    }, HINT_DURATION);
  }

  showNextHint();
}

// Auto-fire 2s after page load
window.addEventListener("load", () => {
  setTimeout(playHudHints, HINT_START_DELAY);
});

