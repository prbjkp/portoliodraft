document.addEventListener("DOMContentLoaded", () => {
  const isMobile = window.innerWidth < 768;

  // --- 1. MOBILE GALLERY LOADER ---
  const galleryContainer = document.getElementById('mobile-gallery');
  const sphereImages = document.querySelectorAll('#sphere img');

  if (galleryContainer && sphereImages.length > 0) {
    sphereImages.forEach(img => {
      // Create a clean wrapper for the grid
      const wrapper = document.createElement('div');
      wrapper.classList.add('gallery-item');

      // Clone the image
      const clone = img.cloneNode(true);
      clone.removeAttribute('id'); // Remove duplicate IDs
      
      // Add Click Listener for Overlay
      clone.addEventListener('click', () => {
         openOverlay(clone.src);
      });

      wrapper.appendChild(clone);
      galleryContainer.appendChild(wrapper);
    });
  }

  // --- 2. DESKTOP SPHERE LOGIC ---
  if (!isMobile) {
      initSphere();
      animateSphere();
  }
});

// --- HELPER FUNCTIONS ---

function openOverlay(src) {
    const overlay = document.getElementById('overlay');
    const overlayImg = document.getElementById('overlay-img');
    if(overlay && overlayImg) {
        overlayImg.src = src;
        overlay.style.display = 'flex';
    }
}

// Close Overlay
document.getElementById('overlay-close')?.addEventListener('click', () => {
    document.getElementById('overlay').style.display = 'none';
});


// --- MENU LOGIC ---
const menuBtn = document.getElementById('menu-icon');
const closeMenuBtn = document.getElementById('close-menu');
const dropdownMenu = document.getElementById('dropdown-menu');

if (menuBtn) {
    menuBtn.addEventListener('click', () => {
        dropdownMenu.classList.add('active');
    });
}

if (closeMenuBtn) {
    closeMenuBtn.addEventListener('click', () => {
        dropdownMenu.classList.remove('active');
    });
}


// --- 3D SPHERE MATH (Desktop Only) ---
const sphere = document.getElementById("sphere");
const photos = document.querySelectorAll(".photo");
let rotX = 0, rotY = 0;
let targetRotX = 0, targetRotY = 0;
let isDragging = false;
let lastX = 0, lastY = 0;

function initSphere() {
  const sphereRadius = 1800; // Increased radius to spread them out
  const total = photos.length;
  
  photos.forEach((photo, i) => {
    const phi = Math.acos(1 - 2 * (i + 0.5) / total);
    const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
    
    const x = sphereRadius * Math.sin(phi) * Math.cos(theta);
    const y = sphereRadius * Math.cos(phi);
    const z = sphereRadius * Math.sin(phi) * Math.sin(theta);

    photo.dataset.x = x;
    photo.dataset.y = y;
    photo.dataset.z = z;
    
    // Add click to original sphere images too
    photo.addEventListener('click', () => {
        const img = photo.querySelector('img');
        if(img) openOverlay(img.src);
    });
  });
}

function animateSphere() {
  if (!isDragging) {
      targetRotY += 0.05; // Auto rotate slow
  }
  
  // Smooth easing
  rotX += (targetRotX - rotX) * 0.1;
  rotY += (targetRotY - rotY) * 0.1;

  if(sphere) {
      // Move the whole sphere container
      sphere.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
      
      // Counter-rotate images so they face front
      photos.forEach(photo => {
         const x = parseFloat(photo.dataset.x);
         const y = parseFloat(photo.dataset.y);
         const z = parseFloat(photo.dataset.z);
         
         photo.style.transform = `
            translate3d(${x}px, ${y}px, ${z}px) 
            rotateY(${-rotY}deg) 
            rotateX(${-rotX}deg)
         `;
      });
  }
  
  requestAnimationFrame(animateSphere);
}

// Mouse Events for Dragging
window.addEventListener("mousedown", e => { isDragging = true; lastX = e.clientX; lastY = e.clientY; });
window.addEventListener("mouseup", () => isDragging = false);
window.addEventListener("mousemove", e => {
  if (!isDragging) return;
  targetRotY -= (e.clientX - lastX) * 0.2;
  targetRotX += (e.clientY - lastY) * 0.2;
  lastX = e.clientX;
  lastY = e.clientY;
});