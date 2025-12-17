document.addEventListener("DOMContentLoaded", () => {
    
    /**********************************************************
     * 1. CORE VARIABLES & DOM ELEMENTS
     **********************************************************/
    const isMobile = window.innerWidth < 768;
    
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

        // Hide text ring on mobile
        if (textRing) textRing.style.display = "none";

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

        if (!isDragging) targetRotY += 0.02;
        rotX += (targetRotX - rotX) * 0.1;
        rotY += (targetRotY - rotY) * 0.1;

        if(sphere) sphere.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;

        textOrbit += 0.01;
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

    // --- MENU LOGIC (WORKS FOR BOTH MOBILE AND DESKTOP) ---
    if (centerSphere) {
        centerSphere.addEventListener("click", (e) => {
            e.stopPropagation();
            console.log("Menu sphere clicked!");
            
            // Add expanding animation class
            centerSphere.classList.add("expanding");
            
            // Show menu after a brief delay to let expansion start
            setTimeout(() => {
                dropdownMenu.classList.add("active");
                dropdownMenu.style.display = "flex";
            }, 100);
            
            // Remove expanding class after animation completes
            setTimeout(() => {
                centerSphere.classList.remove("expanding");
            }, 600);
        });
    }

    if (closeMenuBtn) {
        closeMenuBtn.addEventListener("click", () => {
            dropdownMenu.classList.remove("active");
            setTimeout(() => { dropdownMenu.style.display = "none"; }, 300);
        });
    }
    
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
            setTimeout(() => { dropdownMenu.style.display = "none"; }, 300);
        });
    });

    if(backButton) {
        backButton.addEventListener("click", () => {
            contentOverlay.classList.remove("active");
        });
    }
});

// --- HELPER: PAGE CONTENT ---
function getPageContent(page) {
    const contents = {
        about: `<h1>About Peter Kopp</h1><p>Welcome to my photography portfolio. I specialize in nature, wildlife, and landscape photography.</p>`,
        contact: `<h1>Contact Me</h1><p>Email: peter@example.com</p><p>Instagram: @peterkoppphotography</p>`
    };
    return contents[page] || '<h1>Page Not Found</h1>';
}