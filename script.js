document.addEventListener("DOMContentLoaded", () => {
    
    /**********************************************************
     * 1. CORE VARIABLES & SETUP
     **********************************************************/
    const isMobile = window.innerWidth < 768;
    
    // Select elements INSIDE the listener to ensure they exist
    const sphere = document.getElementById("sphere");
    const photos = document.querySelectorAll(".photo"); // Now this will find them!
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
    const hudHints = document.querySelectorAll(".hud-hint");
    const mobileGallery = document.getElementById('mobile-gallery');

    /**********************************************************
     * 2. LOGIC SWITCHER (MOBILE VS DESKTOP)
     **********************************************************/
    if (isMobile) {
        console.log("📱 Mobile Mode Active");

        // --- A. POPULATE MOBILE GALLERY ---
        if (mobileGallery && photos.length > 0) {
            mobileGallery.innerHTML = ''; // Clean start

            photos.forEach(photoDiv => {
                const originalImg = photoDiv.querySelector('img');
                if (originalImg) {
                    // Create wrapper
                    const wrapper = document.createElement('div');
                    wrapper.className = 'gallery-item';
                    
                    // Clone Image
                    const newImg = originalImg.cloneNode(true);
                    newImg.removeAttribute('id');
                    
                    // Add Click for Overlay
                    newImg.addEventListener('click', () => {
                        openOverlay(newImg.src);
                    });

                    wrapper.appendChild(newImg);
                    mobileGallery.appendChild(wrapper);
                }
            });
        }

        // --- B. MOBILE HINTS ---
        if (hudHints.length >= 3) {
            hudHints[0].textContent = "Scroll to view";
            hudHints[1].textContent = "Tap to enlarge";
            hudHints[2].textContent = "Menu at bottom";
        }

    } else {
        console.log("💻 Desktop Mode Active");
        
        // Initialize Desktop Sphere
        computePositions();
        animateSphere();
        
        // Add click listeners to original sphere photos
        photos.forEach(photo => {
            const img = photo.querySelector("img");
            if (img) {
                photo.addEventListener("click", () => openOverlay(img.src));
            }
            // Prevent default drag
            photo.ondragstart = e => e.preventDefault();
        });
        
        window.addEventListener("resize", computePositions);
        
        // Desktop Mouse Events
        window.addEventListener("mousedown", e => { isDragging = true; lastX = e.clientX; lastY = e.clientY; });
        window.addEventListener("mouseup", () => isDragging = false);
        window.addEventListener("mouseleave", () => isDragging = false);
        window.addEventListener("mousemove", e => {
            if (!isDragging) return;
            targetRotY -= (e.clientX - lastX) * 0.3;
            targetRotX += (e.clientY - lastY) * 0.3;
            lastX = e.clientX;
            lastY = e.clientY;
        });
    }

    /**********************************************************
     * 3. SHARED FUNCTIONS (Menu, Overlay, Pages)
     **********************************************************/
    
    // --- SPHERE MATH (Desktop Only) ---
    const sphereRadius = 2200;
    const positions = [];
    let rotX = 0, rotY = 0;
    let targetRotX = 0, targetRotY = 0;
    let isDragging = false;
    let lastX = 0, lastY = 0;
    let textOrbit = 0;
    const TEXT_RING_DISTANCE = 95;

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

    function animateSphere() {
        if (isMobile) return; 

        if (!isDragging) targetRotY += 0.02;
        rotX += (targetRotX - rotX) * 0.1;
        rotY += (targetRotY - rotY) * 0.1;

        if(sphere) sphere.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;

        // Animate Text Ring
        textOrbit += 0.01;
        if (textRing) textRing.style.transform = `translate(-50%, -50%)`;
        if (textRingSvg) textRingSvg.style.transform = `translateZ(${TEXT_RING_DISTANCE}px) rotateZ(${textOrbit}deg)`;

        photos.forEach((photo, i) => {
            const pos = positions[i];
            if (!pos) return;
            photo.style.transform = `translate(-50%, -50%) translate3d(${pos.x}px, ${pos.y}px, ${pos.z}px) rotateY(${-rotY}deg) rotateX(${-rotX}deg)`;
            
            // Apply Orientation
            const img = photo.querySelector("img");
            if(img) photo.classList.toggle("portrait", img.naturalHeight > img.naturalWidth);
        });

        requestAnimationFrame(animateSphere);
    }

    // --- OVERLAY LOGIC ---
    function openOverlay(src) {
        if(overlay && overlayImg) {
            overlayImg.src = src;
            overlay.style.display = "flex";
            overlay.style.pointerEvents = "auto";
            setTimeout(() => overlay.style.opacity = "1", 10);
        }
    }

    if(overlayClose) {
        overlayClose.addEventListener("click", () => {
            overlay.style.opacity = "0";
            overlay.style.pointerEvents = "none";
            setTimeout(() => { overlay.style.display = "none"; }, 300);
        });
    }

    // --- MENU LOGIC ---
    if (centerSphere) {
        centerSphere.addEventListener("click", (e) => {
            e.stopPropagation();
            dropdownMenu.classList.add("active");
            dropdownMenu.style.display = "flex"; 
        });
    }

    if (closeMenuBtn) {
        closeMenuBtn.addEventListener("click", () => {
            dropdownMenu.classList.remove("active");
            setTimeout(() => { dropdownMenu.style.display = "none"; }, 300);
        });
    }
    
    // Page Navigation
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            if (page === 'home') {
                contentOverlay.classList.remove("active");
            } else {
                contentContainer.innerHTML = getPageContent(page);
                contentOverlay.classList.add("active");
            }
            dropdownMenu.classList.remove("active");
        });
    });

    if(backButton) {
        backButton.addEventListener("click", () => {
            contentOverlay.classList.remove("active");
        });
    }

    // --- START SCREEN ---
    if (startContainer) {
        startContainer.addEventListener("click", () => {
            if(textRing) textRing.style.opacity = "0";
            if(scene) scene.style.opacity = "1";
            
            // Show HUD Hints
            let index = 0;
            function showNextHint() {
                if (index >= hudHints.length) return;
                if (index > 0) hudHints[index - 1].classList.remove("active");
                hudHints[index].classList.add("active");
                setTimeout(() => {
                    hudHints[index].classList.remove("active");
                    index++;
                    setTimeout(showNextHint, 500);
                }, 4000);
            }
            setTimeout(showNextHint, 1000);
        });
    }
});

// --- HELPER: PAGE CONTENT ---
function getPageContent(page) {
    const contents = {
        about: `<h1>About Peter Kopp</h1><p>Welcome to my portfolio.</p>`,
        contact: `<h1>Contact Me</h1><p>Email: peter@example.com</p>`
    };
    return contents[page] || '<h1>Page Not Found</h1>';
}