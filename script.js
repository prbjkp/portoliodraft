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

/**********************************************************
 * 10. THE MASTER LOGIC SWITCHER (Mobile vs Desktop)
 **********************************************************/

if (isMobile) {
    /* --- MOBILE MODE --- */
    console.log("Starting Mobile Mode");

    // 1. Setup Gallery
    const gallery = document.getElementById('mobile-gallery');
    
    if (gallery) {
        gallery.innerHTML = ''; // Clean start
        
        // 2. Clone Photos
        photos.forEach(photoDiv => {
            const originalImg = photoDiv.querySelector('img');
            if (originalImg) {
                const newImg = originalImg.cloneNode(true);
                newImg.loading = "lazy";
                
                // Add Click Listener to new image
                newImg.addEventListener('click', (e) => {
                    e.stopPropagation();
                    isAutoScrolling = false; // Stop scroll on click
                    openOverlay(newImg.src);
                });

                gallery.appendChild(newImg);
            }
        });

        // 3. Start Auto-Scroll Engine
        const runScrollLoop = function() {
            if (!isAutoScrolling) return; // User stopped it?

            // Move scrollbar
            gallery.scrollTop += scrollSpeed;

            // Loop back to top if at bottom
            if (gallery.scrollTop + gallery.clientHeight >= gallery.scrollHeight - 2) {
                gallery.scrollTop = 0;
            }
            
            requestAnimationFrame(runScrollLoop);
        };

        // Start scrolling after 1 second
        setTimeout(runScrollLoop, 1000);

        // 4. Stop Auto-Scroll on User Interaction
        const stopTheScroll = function() {
            if (isAutoScrolling) {
                isAutoScrolling = false;
                console.log("User took control");
                // Update Hints
                if (hudHints.length > 0) hudHints[0].textContent = "Scroll to explore";
            }
        };

        gallery.addEventListener("touchstart", stopTheScroll, { passive: true });
        gallery.addEventListener("wheel", stopTheScroll, { passive: true });
        gallery.addEventListener("mousedown", stopTheScroll);
        
        // 5. Update Hints Text for Mobile
        if (hudHints.length >= 3) {
            hudHints[0].textContent = "Auto-scrolling...";
            hudHints[1].textContent = "Touch to control";
            hudHints[2].textContent = "Menu at bottom";
        }
    }

} else {
    /* --- DESKTOP MODE --- */
    console.log("Starting Desktop Mode");
    
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

console.log("Script loaded completely. Mode:", isMobile ? "Mobile" : "Desktop");