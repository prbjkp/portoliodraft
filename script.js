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
const TEXT_RING_DISTANCE = 95;
let textOrbit = 0;

/**********************************************************
 * ROTATION STATE
 **********************************************************/
let rotX = 0, rotY = 0;
let targetRotX = 0, targetRotY = 0;
let isDragging = false;
let lastX = 0, lastY = 0;

const autoRotateSpeed = 0.02;

/**********************************************************
 * SPHERE LAYOUT (PHOTO DISTRIBUTION)
 **********************************************************/
const sphereRadius = 1800;
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
 * ANIMATION LOOP
 **********************************************************/
function animateSphere() {
  if (!isDragging) targetRotY += autoRotateSpeed;

  rotX += (targetRotX - rotX) * 0.1;
  rotY += (targetRotY - rotY) * 0.1;

  // Rotate photo sphere
  sphere.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  
  // DEBUG: Log once
  if (!window.debugLogged) {
    console.log("rotX:", rotX, "rotY:", rotY);
    console.log("First photo element:", photos[0]);
    window.debugLogged = true;
  }

  // Lock center sphere to camera
  centerSphere.style.transform =
    `translate(-50%, -50%) rotateY(${-rotY}deg) rotateX(${-rotX}deg)`;

  // Camera-locked text ring (self-rotating only)
  textOrbit += 0.01;
  textRing.style.transform = `translate(-50%, -50%)`;
  textRingSvg.style.transform = `
    translateZ(${TEXT_RING_DISTANCE}px)
    rotateZ(${textOrbit}deg)
  `;

  // Position photos
photos.forEach((photo, i) => {
  const pos = positions[i];
  if (!pos) return;

  const portraitFix = photo.classList.contains("portrait") ? 90 : 0;  // Changed from -90 to 90

  photo.style.transform = `
    translate(-50%, -50%)
    translate3d(${pos.x}px, ${pos.y}px, ${pos.z}px)
    rotateY(${-rotY}deg)
    rotateX(${-rotX}deg)
    rotateZ(${portraitFix}deg)
  `;
});
    
    // DEBUG: Log first photo's transform once
    if (i === 0 && !window.firstPhotoLogged) {
      console.log("First photo transform:", photo.style.transform);
      window.firstPhotoLogged = true;
    }
  };

  requestAnimationFrame(animateSphere);


  // Position photos
  photos.forEach((photo, i) => {
    const pos = positions[i];
    if (!pos) return;

    const portraitFix = photo.classList.contains("portrait") ? -90 : 0;

    photo.style.transform = `
      translate(-50%, -50%)
      translate3d(${pos.x}px, ${pos.y}px, ${pos.z}px)
      rotateY(${-rotY}deg)
      rotateX(${-rotX}deg)
      rotateZ(${portraitFix}deg)
    `;
  });

  requestAnimationFrame(animateSphere);


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

    // Auto-fire HUD hints 2 seconds after START click
    setTimeout(playHudHintsOnce, 2000);
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
 * HUD HINT SEQUENCE (TEXT ONLY)
 **********************************************************/
const hudHints = document.querySelectorAll(".hud-hint");
const HINT_START_DELAY = 2000; // 2s after page load
const HINT_DURATION = 4000;    // visible time per hint
const HINT_GAP = 500;          // short gap between hints

function playHudHints() {
  let index = 0;

  function showNextHint() {
    if (index >= hudHints.length) return; // stop when done

    // hide previous hint
    if (index > 0) hudHints[index - 1].classList.remove("active");

    // show current hint
    const hint = hudHints[index];
    hint.classList.add("active");

    // hide after duration then schedule next hint
    setTimeout(() => {
      hint.classList.remove("active");
      index++;
      setTimeout(showNextHint, HINT_GAP);
    }, HINT_DURATION);
  }

  showNextHint();
}

// auto-fire 2 seconds after page load
window.addEventListener("load", () => {
  setTimeout(playHudHints, HINT_START_DELAY);
});
console.log("Script is running!");
console.log("newest update applied");
console.log("Number of photos:", photos.length);
console.log("Sphere radius:", sphereRadius);