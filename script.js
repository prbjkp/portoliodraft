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
const sphereRadius = 2200;
const positions = [];

function computePositions() {
  positions.length = 0;
  const total = photos.length;

  photos.forEach((_, i) => {
    // Fibonacci Sphere layout algorithm
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
  // Check if image is already loaded or wait for load event
  if (img.complete) applyOrientation(photo, img);
  else img.addEventListener("load", () => applyOrientation(photo, img));
});

function applyOrientation(photo, img) {
  // If height > width, add portrait class
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

    // *** FINAL FIX: Set rotation to 0 ***
    // Your CSS now handles the vertical shape. 
    // Any rotation here will knock the tall image onto its side.
    const portraitFix = 0;

    photo.style.transform = `
      translate(-50%, -50%)
      translate3d(${pos.x}px, ${pos.y}px, ${pos.z}px)
      rotateY(${-rotY}deg)
      rotateX(${-rotX}deg)
      rotateZ(${portraitFix}deg)
    `;

    // DEBUG: Log first photo's transform once
    if (i === 0 && !window.firstPhotoLogged) {
      console.log("First photo transform (Fix: 0 deg):", photo.style.transform);
      window.firstPhotoLogged = true;
    }
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
function playHudHintsOnce() {
  if (!window.hudHintsPlayed) {
    playHudHints();
    window.hudHintsPlayed = true;
  }
}

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

// Start the animation loop
animateSphere();

// Final console logs
console.log("Script is running!");
console.log("16x9 aspect ratio");
console.log("Number of photos:", photos.length);
console.log("Sphere radius:", sphereRadius);

/**********************************************************
 * MENU SYSTEM
 **********************************************************/
let currentPage = 'home';

// Open menu when center sphere is clicked
centerSphere.addEventListener("click", (e) => {
  e.stopPropagation();
  dropdownMenu.classList.add("active");
});

// Close menu
closeMenuBtn.addEventListener("click", () => {
  dropdownMenu.classList.remove("active");
});

// Click outside to close
window.addEventListener("click", (e) => {
  if (!e.target.closest('#dropdown-menu') && !e.target.closest('#center-sphere')) {
    dropdownMenu.classList.remove("active");
  }
});

// Menu item clicks
document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('click', () => {
    const page = item.dataset.page;
    loadPage(page);
    dropdownMenu.classList.remove("active");
  });
});

// Back button
backButton.addEventListener("click", () => {
  contentOverlay.classList.remove("active");
  currentPage = 'home';
  updateActiveMenuItem();
});

function loadPage(page) {
  currentPage = page;
  updateActiveMenuItem();
  
  if (page === 'home') {
    contentOverlay.classList.remove("active");
    return;
  }
  
  // Load page content
  const content = getPageContent(page);
  contentContainer.innerHTML = content;
  contentOverlay.classList.add("active");
}

function updateActiveMenuItem() {
  document.querySelectorAll('.menu-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === currentPage);
  });
}

function getPageContent(page) {
  const contents = {
    about: `
      <h1>About Peter Kopp Photography</h1>
      <p>Welcome to my photography portfolio. I specialize in capturing moments that tell stories through the lens.</p>
      <h2>My Journey</h2>
      <p>Photography has been my passion for over a decade. From landscapes to wildlife, portraits to abstract art, I explore various genres to express creativity and emotion.</p>
      <h2>Philosophy</h2>
      <p>Every photograph should evoke emotion and tell a story. I believe in capturing authentic moments that resonate with viewers.</p>
    `,
    contact: `
      <h1>Contact Me</h1>
      <p>I'd love to hear from you! Whether you're interested in prints, collaborations, or just want to say hello, feel free to reach out.</p>
      <form id="contact-form" style="margin-top: 30px;">
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 500;">Name:</label>
          <input type="text" name="name" required style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 500;">Email:</label>
          <input type="email" name="email" required style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 500;">Message:</label>
          <textarea name="message" required rows="6" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; resize: vertical;"></textarea>
        </div>
        <button type="submit" style="padding: 12px 30px; background: #333; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem;">Send Message</button>
      </form>
    `
  };
  
  return contents[page] || '<h1>Page Not Found</h1>';
}

// Form submission handler (for contact page)
document.addEventListener('submit', (e) => {
  if (e.target.id === 'contact-form') {
    e.preventDefault();
    alert('Thank you for your message! (This is a demo - form not actually submitted)');
    e.target.reset();
  }
});