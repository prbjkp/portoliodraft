/**********************************************************
 * 1. CORE VARIABLES & CONFIG
 **********************************************************/
const isMobile = window.innerWidth < 768; // Define this first!

const sphere = document.getElementById("sphere");
const photos = document.querySelectorAll(".photo");
const scene = document.getElementById("scene");
const textRing = document.getElementById("start-text-ring");
const textRingSvg = document.getElementById("text-ring-svg");
const centerSphere = document.getElementById("center-sphere");
const overlay = document.getElementById("overlay");
const overlayImg = document.getElementById("overlay-img");
const overlayClose = document.getElementById("overlay-close");
const dropdownMenu = document.getElementById("dropdown-menu");
const closeMenuBtn = document.getElementById("close-menu");
const contentOverlay = document.getElementById("content-overlay");
const contentContainer = document.getElementById("content-container");
const backButton = document.getElementById("back-button");
const startContainer = document.getElementById("start-container");

// Mobile Scroll Variables
let mobileContainer = null;
let isAutoScrolling = true;
const scrollSpeed = 1.0; 

/**********************************************************
 * 2. SPHERE LOGIC (Math & layout for 3D view)
 **********************************************************/
const TEXT_RING_DISTANCE = 95;
let textOrbit = 0;
let rotX = 0, rotY = 0;
let targetRotX = 0, targetRotY = 0;
let isDragging = false;
let lastX = 0, lastY = 0;
const autoRotateSpeed = 0.02;
const sphereRadius = 2200;
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




document.addEventListener("DOMContentLoaded", () => {
  const galleryContainer = document.getElementById('mobile-gallery');
  const sphereImages = document.querySelectorAll('#sphere .photo img');

  // If no images found, stop.
  if (sphereImages.length === 0) return;

  sphereImages.forEach(img => {
    // Clone the image
    const clone = img.cloneNode(true);
    
    // Make sure the clone doesn't have ID conflicts (optional but safe)
    clone.removeAttribute('id'); 
    
    // Add click event for full screen (re-using your overlay logic)
    clone.addEventListener('click', () => {
       const overlay = document.getElementById('overlay');
       const overlayImg = document.getElementById('overlay-img');
       // Only if overlay elements exist
       if(overlay && overlayImg) {
         overlayImg.src = clone.src;
         overlay.style.display = 'flex';
       }
    });

    galleryContainer.appendChild(clone);
  });
});

/**********************************************************
 * 3. IMAGE HANDLING (Orientation & Dragging)
 **********************************************************/
photos.forEach(photo => {
  const img = photo.querySelector("img");
  if (img.complete) applyOrientation(photo, img);
  else img.addEventListener("load", () => applyOrientation(photo, img));
  // Prevent default drag
  photo.ondragstart = e => e.preventDefault();
});
document.body.style.userSelect = "none";

function applyOrientation(photo, img) {
  photo.classList.toggle("portrait", img.naturalHeight > img.naturalWidth);
}

/**********************************************************
 * 4. ANIMATION LOOP (Only runs fully on Desktop)
 **********************************************************/
function animateSphere() {
  // If we are on mobile, we STOP the heavy 3D calculations to save battery
  if (isMobile) return; 

  if (!isDragging) targetRotY += autoRotateSpeed;
  rotX += (targetRotX - rotX) * 0.1;
  rotY += (targetRotY - rotY) * 0.1;

  sphere.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;

  textOrbit += 0.01;
  textRing.style.transform = `translate(-50%, -50%)`;
  if (typeof textRingSvg !== 'undefined') {
      textRingSvg.style.transform = `translateZ(${TEXT_RING_DISTANCE}px) rotateZ(${textOrbit}deg)`;
  }

  photos.forEach((photo, i) => {
    const pos = positions[i];
    if (!pos) return;
    photo.style.transform = `
      translate(-50%, -50%)
      translate3d(${pos.x}px, ${pos.y}px, ${pos.z}px)
      rotateY(${-rotY}deg)
      rotateX(${-rotX}deg)
    `;
  });

  requestAnimationFrame(animateSphere);
}

/**********************************************************
 * 5. DESKTOP INPUTS (Mouse Drag)
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
 * 6. START SCREEN & HUD
 **********************************************************/
function playHudHintsOnce() {
  if (!window.hudHintsPlayed) {
    playHudHints();
    window.hudHintsPlayed = true;
  }
}

if (startContainer) {
  startContainer.addEventListener("click", () => {
    // Hide text ring
    textRing.style.opacity = "0";
    textRing.style.pointerEvents = "none";
    
    // Show scene
    scene.style.opacity = "1";
    scene.style.pointerEvents = "auto";

    // If on Mobile, ensure the gallery is visible
    if(isMobile) {
        const mg = document.getElementById('mobile-gallery');
        if(mg) mg.style.opacity = "1";
    }

    setTimeout(playHudHintsOnce, 1000);
  });
}

const hudHints = document.querySelectorAll(".hud-hint");
function playHudHints() {
  let index = 0;
  function showNextHint() {
    if (index >= hudHints.length) return;
    if (index > 0) hudHints[index - 1].classList.remove("active");
    const hint = hudHints[index];
    hint.classList.add("active");
    setTimeout(() => {
      hint.classList.remove("active");
      index++;
      setTimeout(showNextHint, 500);
    }, 4000);
  }
  showNextHint();
}

/**********************************************************
 * 7. MENU SYSTEM (Works on both Mobile & Desktop)
 **********************************************************/
// Open Menu
if (centerSphere) {
    centerSphere.addEventListener("click", (e) => {
        e.stopPropagation(); // CRITICAL: Stop click from passing through
        e.preventDefault();
        dropdownMenu.classList.add("active");
        dropdownMenu.style.display = "flex"; // Force flex
    });
}

// Close Menu
if (closeMenuBtn) {
    closeMenuBtn.addEventListener("click", () => {
        dropdownMenu.classList.remove("active");
        setTimeout(() => { dropdownMenu.style.display = "none"; }, 300);
    });
}

// Click outside to close
window.addEventListener("click", (e) => {
  if (!e.target.closest('#dropdown-menu') && !e.target.closest('#center-sphere')) {
    dropdownMenu.classList.remove("active");
  }
});

// Menu Items
document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('click', () => {
    const page = item.dataset.page;
    loadPage(page);
    dropdownMenu.classList.remove("active");
  });
});

// Back Button
if(backButton) {
    backButton.addEventListener("click", () => {
      contentOverlay.classList.remove("active");
      updateActiveMenuItem();
    });
}

function loadPage(page) {
  if (page === 'home') {
    contentOverlay.classList.remove("active");
    return;
  }
  const content = getPageContent(page);
  contentContainer.innerHTML = content;
  contentOverlay.classList.add("active");
}

function updateActiveMenuItem() {
  // Optional active state logic
}

function getPageContent(page) {
    const contents = {
        about: `<h1>About Peter Kopp Photography</h1><p>Welcome to my portfolio...</p>`,
        contact: `<h1>Contact Me</h1><p>I'd love to hear from you!</p>
        <form id="contact-form" action="https://formspree.io/f/mgvkgkny" method="POST">
            <label>Name:</label><input type="text" name="name" required style="width:100%; margin-bottom:10px;">
            <label>Email:</label><input type="email" name="email" required style="width:100%; margin-bottom:10px;">
            <label>Message:</label><textarea name="message" required rows="5" style="width:100%; margin-bottom:10px;"></textarea>
            <button type="submit" style="padding:10px 20px;">Send Message</button>
            <p id="my-form-status"></p>
        </form>`
    };
    return contents[page] || '<h1>Page Not Found</h1>';
}

/**********************************************************
 * 8. POPUP / OVERLAY LOGIC (Shared)
 **********************************************************/
function openOverlay(src) {
    overlayImg.src = src;
    overlay.style.display = "flex";
    overlay.style.pointerEvents = "auto";
    requestAnimationFrame(() => overlay.style.opacity = "1");
}

function closeOverlay() {
  overlay.style.opacity = "0";
  overlay.style.pointerEvents = "none";
  setTimeout(() => { overlay.style.display = "none"; }, 300);
}

if(overlayClose) overlayClose.addEventListener("click", closeOverlay);
if(overlay) overlay.addEventListener("click", (e) => {
    if(e.target === overlay) closeOverlay();
});

/**********************************************************
 * 9. FORM HANDLING
 **********************************************************/
document.addEventListener('submit', (e) => {
  if (e.target.id === 'contact-form') {
    e.preventDefault();
    const form = e.target;
    const status = document.getElementById("my-form-status");
    const data = new FormData(form);
    status.innerHTML = "Sending...";
    fetch(form.action, {
      method: form.method,
      body: data,
      headers: { 'Accept': 'application/json' }
    }).then(response => {
      if (response.ok) {
        status.innerHTML = "Thanks for your submission!";
        form.reset();
      } else {
        status.innerHTML = "Oops! There was a problem.";
      }
    }).catch(error => {
      status.innerHTML = "Error submitting form.";
    });
  }
});

/* ==================================================
   10. THE MASTER LOGIC SWITCHER (Mobile vs Desktop)
================================================== */

if (isMobile) {
    /* --- MOBILE MODE --- */
    console.log("📱 Mobile Mode Detected");

    // 1. Setup Gallery
    const gallery = document.getElementById('mobile-gallery');
    
    if (gallery) {
        console.log("✅ Gallery Container Found");
        gallery.innerHTML = ''; // Clean start
        
        // 2. Clone Photos
        photos.forEach(photoDiv => {
            const originalImg = photoDiv.querySelector('img');
            if (originalImg) {
                const newImg = originalImg.cloneNode(true);
                newImg.loading = "eager"; // Load immediately
                
                // Add Click Listener to new image (Opens Overlay)
                newImg.addEventListener('click', (e) => {
                    e.stopPropagation();
                    isAutoScrolling = false; 
                    openOverlay(newImg.src);
                });

                gallery.appendChild(newImg);
            }
        });

        // 3. Define the Engine
        let scrollSpeed = 1.5; // Slightly faster to be obvious
        let animationFrameId;

        const runScrollLoop = function() {
            if (!isAutoScrolling) {
                // If stopped, check again in 100ms (Polling)
                // This keeps the loop alive even if paused
                animationFrameId = requestAnimationFrame(runScrollLoop);
                return;
            }

            // Move scrollbar
            gallery.scrollTop += scrollSpeed;

            // Infinite Loop Logic
            if (gallery.scrollTop + gallery.clientHeight >= gallery.scrollHeight - 5) {
                gallery.scrollTop = 0; // Jump to top
            }
            
            animationFrameId = requestAnimationFrame(runScrollLoop);
        };

        // 4. Start the Engine immediately
        console.log("🚀 Starting Scroll Engine...");
        cancelAnimationFrame(animationFrameId);
        runScrollLoop();

        // 5. Interaction Logic (Pause on Touch, Resume on Release)
        let touchTimeout;
        
        const pauseScroll = function() {
            isAutoScrolling = false;
            // Update Text
            if (hudHints.length > 0) hudHints[0].textContent = "Paused";
            clearTimeout(touchTimeout);
        };

        const resumeScroll = function() {
            // Wait 2 seconds after letting go, then resume
            touchTimeout = setTimeout(() => {
                isAutoScrolling = true;
                if (hudHints.length > 0) hudHints[0].textContent = "Auto-scrolling...";
            }, 2000);
        };

        gallery.addEventListener("touchstart", pauseScroll, { passive: true });
        gallery.addEventListener("touchend", resumeScroll, { passive: true });
        gallery.addEventListener("mousedown", pauseScroll);
        gallery.addEventListener("mouseup", resumeScroll);
        
        // 6. Set Hints
        if (hudHints.length >= 3) {
            hudHints[0].textContent = "Auto-scrolling...";
            hudHints[1].textContent = "Tap to Pause";
            hudHints[2].textContent = "Menu at bottom";
        }
    } else {
        console.error("❌ Error: #mobile-gallery element missing in HTML");
    }

} else {
    /* --- DESKTOP MODE --- */
    console.log("💻 Desktop Mode Detected");
    
    // Add Click Listeners to original sphere photos
    photos.forEach(photo => {
      photo.addEventListener("click", () => {
        const img = photo.querySelector("img");
        if(img) openOverlay(img.src);
      });
    });

    // Start 3D Loop
    animateSphere();
}

document.addEventListener("DOMContentLoaded", () => {
  // 1. Select the empty gallery container
  const galleryContainer = document.getElementById('mobile-gallery');
  
  // 2. Select all images currently inside the sphere
  // We use .photo img to grab the actual image tags
  const sphereImages = document.querySelectorAll('#sphere .photo img');

  // 3. Loop through them and clone them into the gallery
  sphereImages.forEach(img => {
    const clone = img.cloneNode(true); // Create a copy
    
    // Optional: Add a click event to the clone if you want the zoom overlay to work
    clone.addEventListener('click', () => {
        // Trigger your existing overlay logic here
        // For example:
        const overlay = document.getElementById('overlay');
        const overlayImg = document.getElementById('overlay-img');
        overlayImg.src = clone.src;
        overlay.style.display = 'flex';
    });

    galleryContainer.appendChild(clone); // Add to the background layer
  });
});