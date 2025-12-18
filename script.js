document.addEventListener("DOMContentLoaded", () => {
    
    /**********************************************************
     * 1. CORE VARIABLES & DOM ELEMENTS
     **********************************************************/
    const isMobile = window.innerWidth < 768;
    
    console.log("🔍 Debug Info:");
    console.log("Is Mobile:", isMobile);
    console.log("Window Width:", window.innerWidth);
    
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
    const hudHints = document.querySelectorAll(".hud-hint");
    const mobileGallery = document.getElementById('mobile-gallery');
    
    console.log("Center Sphere Element:", centerSphere);
    if (centerSphere) {
        console.log("Center Sphere computed style:", window.getComputedStyle(centerSphere).display);
        console.log("Center Sphere position:", window.getComputedStyle(centerSphere).position);
        console.log("Center Sphere z-index:", window.getComputedStyle(centerSphere).zIndex);
    }

    /**********************************************************
     * 2. SPHERE MATH VARIABLES
     **********************************************************/
    const sphereRadius = 2200; // Spread out images more (back to original spread)
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

    /**********************************************************
     * 3. HUD HINTS - AUTO SHOW ON LOAD
     **********************************************************/
    function showHints() {
        let index = 0;
        function showNextHint() {
            if (index >= hudHints.length) {
                return;
            }
            if (index > 0) hudHints[index - 1].classList.remove("active");
            
            hudHints[index].classList.add("active");
            
            setTimeout(() => {
                hudHints[index].classList.remove("active");
                index++;
                setTimeout(showNextHint, 500);
            }, 3000);
        }
        setTimeout(showNextHint, 2000); // Start 2 seconds after load
    }

    /**********************************************************
     * 4. LOGIC SWITCHER (MOBILE VS DESKTOP)
     **********************************************************/
    if (isMobile) {
        console.log("📱 Mobile Mode Active");

        // --- A. POPULATE MOBILE GALLERY ---
        if (mobileGallery && photos.length > 0) {
            mobileGallery.innerHTML = ''; // Clean start

            // Create array of images to duplicate
            const imageArray = [];
            
            photos.forEach(photoDiv => {
                const originalImg = photoDiv.querySelector('img');
                if (originalImg && originalImg.src) {
                    imageArray.push(originalImg.src);
                }
            });

            // Duplicate images 3 times for infinite scroll effect
            const duplicateCount = 3;
            for (let i = 0; i < duplicateCount; i++) {
                imageArray.forEach(src => {
                    const newImg = document.createElement('img');
                    newImg.src = src;
                    newImg.alt = 'Gallery image';
                    
                    newImg.addEventListener('click', () => {
                        openOverlay(newImg.src);
                    });

                    mobileGallery.appendChild(newImg);
                });
            }

            console.log(`✅ Added ${mobileGallery.children.length} images to mobile gallery (with duplicates)`);
            
            // --- INFINITE AUTO-SCROLL FUNCTION ---
            let autoScrollInterval;
            let isUserScrolling = false;
            let scrollTimeout;
            
            // Calculate when to reset scroll position (1/3 through since we have 3 copies)
            const resetPoint = mobileGallery.scrollHeight / duplicateCount;
            
            // Detect user scrolling
            mobileGallery.addEventListener('scroll', () => {
                // Check if we need to loop manually when user scrolls
                handleInfiniteScroll();
            });
            
            // Detect when user is actively touching/scrolling
            mobileGallery.addEventListener('touchstart', () => {
                isUserScrolling = true;
                clearInterval(autoScrollInterval);
            });
            
            mobileGallery.addEventListener('touchend', () => {
                isUserScrolling = false;
                startAutoScroll();
            });
            
            // Handle infinite scroll loop
            function handleInfiniteScroll() {
                const scrollPos = mobileGallery.scrollTop;
                const maxScroll = mobileGallery.scrollHeight - mobileGallery.clientHeight;
                
                // If scrolled to bottom, jump back to middle section
                if (scrollPos >= maxScroll - 10) {
                    mobileGallery.scrollTop = resetPoint;
                }
                
                // If scrolled to top, jump to middle section
                if (scrollPos <= 10) {
                    mobileGallery.scrollTop = resetPoint;
                }
            }
            
            // Auto-scroll function
            function startAutoScroll() {
                autoScrollInterval = setInterval(() => {
                    if (!isUserScrolling && !overlay.style.pointerEvents.includes('auto')) {
                        mobileGallery.scrollBy({
                            top: 1.5, // Slowed down from 4 to 1.5 for gentler scroll
                            behavior: 'auto'
                        });
                        
                        // Handle infinite loop for auto-scroll
                        handleInfiniteScroll();
                    }
                }, 16);
            }
            
            // Start at middle section for seamless looping
            mobileGallery.scrollTop = resetPoint;
            
            // Start auto-scroll immediately
            startAutoScroll();
        }

        // --- B. MOBILE HINTS ---
        if (hudHints.length >= 3) {
            hudHints[0].textContent = "Scroll to view all photos";
            hudHints[1].textContent = "Tap any photo to enlarge";
            hudHints[2].textContent = "Menu button below";
        }

        // Show hints on mobile too
        showHints();

        // Animate text ring on mobile
        function animateMobileTextRing() {
            if (textRingSvg) {
                textOrbit += 0.002; // Slowed down from 0.01 to 0.002 (5x slower)
                textRingSvg.style.transform = `rotateZ(${textOrbit * 57.2958}deg)`;
            }
            requestAnimationFrame(animateMobileTextRing);
        }
        animateMobileTextRing();

    } else {
        console.log("💻 Desktop Mode Active");
        
        computePositions();
        animateSphere();
        showHints(); // Start HUD hints on desktop
        
        // Desktop Photo Listeners
        photos.forEach(photo => {
            const img = photo.querySelector("img");
            if (img) {
                photo.addEventListener("click", () => openOverlay(img.src));
            }
            photo.ondragstart = e => e.preventDefault();
        });
        
        window.addEventListener("resize", computePositions);
        
        // Mouse Drag Logic
        window.addEventListener("mousedown", e => { 
            isDragging = true; 
            lastX = e.clientX; 
            lastY = e.clientY; 
        });
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
     * 5. SHARED FUNCTIONS
     **********************************************************/

    function animateSphere() {
        if (isMobile) return; 

        if (!isDragging) targetRotY += 0.02; // Restored to original speed
        rotX += (targetRotX - rotX) * 0.1;
        rotY += (targetRotY - rotY) * 0.1;

        if(sphere) sphere.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;

        textOrbit += 0.002; // Text ring still slow (5x slower than original)
        if (textRing) textRing.style.transform = `translate(-50%, -50%)`;
        if (textRingSvg) textRingSvg.style.transform = `translateZ(${TEXT_RING_DISTANCE}px) rotateZ(${textOrbit}deg)`;

        photos.forEach((photo, i) => {
            const pos = positions[i];
            if (!pos) return;
            photo.style.transform = `translate(-50%, -50%) translate3d(${pos.x}px, ${pos.y}px, ${pos.z}px) rotateY(${-rotY}deg) rotateX(${-rotX}deg)`;
            
            const img = photo.querySelector("img");
            if(img) photo.classList.toggle("portrait", img.naturalHeight > img.naturalWidth);
        });

        requestAnimationFrame(animateSphere);
    }

   // OVERLAY LOGIC
function openOverlay(src) {
    if (!overlay || !overlayImg) return;
    overlayImg.src = src;
    overlay.style.display = "flex";
    overlay.style.pointerEvents = "auto";
    setTimeout(() => overlay.style.opacity = "1", 10);

    if (centerSphere) centerSphere.style.display = "none"; // hide sphere while overlay open
    if (textRing) textRing.style.display = "none";
}

function closeOverlay() {
    if (!overlay) return;
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
    setTimeout(() => {
        overlay.style.display = "none";
        if (centerSphere) centerSphere.style.display = "block"; // show sphere again
        if (textRing) textRing.style.display = "block";
    }, 300);
}




if (overlayClose) overlayClose.addEventListener("click", closeOverlay);

    
    if (closeMenuBtn) {
        closeMenuBtn.addEventListener("click", () => {
            dropdownMenu.classList.remove("active");
            setTimeout(() => { 
                dropdownMenu.style.display = "none";
                // Show sphere and text ring again when menu closes
                if (centerSphere) centerSphere.style.display = "block";
                if (textRing) textRing.style.display = "block";
            }, 300);
        });
    }
           // Keep sphere and text ring hidden when viewing content
            
        });
    ;

    if(backButton) {
        backButton.addEventListener("click", () => {
            contentOverlay.classList.remove("active");
            // Show sphere and text ring when going back
            if (centerSphere) centerSphere.style.display = "block";
            if (textRing) textRing.style.display = "block";
        });
    }
;

// --- HELPER: PAGE CONTENT ---
function getPageContent(page) {
    const contents = {
        about: `<h1>About Peter Kopp</h1><p>Welcome to my photography portfolio. I specialize in nature, wildlife, and landscape photography.</p>`,
        contact: `<form id="my-form" action="https://formspree.io/f/mgvkgkny" method="POST">
   <label>Your Email:
   <br>
     <input type="email" name="email">
   </label>
   <br>
<br>
   <label>Your Message:
   <br>
   <br>
     <textarea name="message"></textarea>
   </label>
<br>
<br>
   <button type="submit">Send</button>
</form>`
    };
    return contents[page] || '<h1>Page Not Found</h1>';
}

 /**********************************************************
 * 6. FORMSPREE CONTACT FORM HANDLER
 **********************************************************/
const form = document.getElementById("my-form");

if (form) {
    form.addEventListener("submit", async function handleSubmit(event) {
        event.preventDefault();

        const status = document.getElementById("my-form-status");
        const data = new FormData(event.target);

        fetch(event.target.action, {
            method: form.method,
            body: data,
            headers: {
                'Accept': 'application/json'
            }
        }).then(response => {
            if (response.ok) {
                status.innerHTML = "Thanks for your submission!";
                form.reset();
            } else {
                response.json().then(data => {
                    if (Object.hasOwn(data, 'errors')) {
                        status.innerHTML = data["errors"].map(error => error["message"]).join(", ");
                    } else {
                        status.innerHTML = "Oops! There was a problem submitting your form";
                    }
                });
            }
        }).catch(error => {
            status.innerHTML = "Oops! There was a problem submitting your form";
        });
    });
}
