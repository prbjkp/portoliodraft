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

 /**********************************************************
 * 3. HUD HINTS - DEVICE AWARE
 **********************************************************/
function showHints() {
    // 1. Define device-specific text
    const mobileText = [
        "Scroll to explore photos",
        "Tap any photo to view full size",
        "Tap the center sphere for menu"
    ];
    
    const desktopText = [
        "Drag to rotate the gallery",
        "Click any photo to view it full size",
        "Click the center sphere for more information"
    ];

    const activeTextSet = isMobile ? mobileText : desktopText;

    // 2. Assign text to the HTML elements
    hudHints.forEach((hint, i) => {
        if (activeTextSet[i]) {
            hint.textContent = activeTextSet[i];
        }
    });

    // 3. Animation Logic
    let index = 0;
    function showNextHint() {
        if (index >= hudHints.length) return;
        
        // Remove active from previous
        if (index > 0) hudHints[index - 1].classList.remove("active");
        
        // Add active to current
        hudHints[index].classList.add("active");
        
        setTimeout(() => {
            hudHints[index].classList.remove("active");
            index++;
            setTimeout(showNextHint, 500); // Small gap between hints
        }, 3000); // How long each hint stays up
    }

    // Start the sequence after 2 seconds
    setTimeout(showNextHint, 2000);
}
    /**********************************************************
     * 4. LOGIC SWITCHER (MOBILE VS DESKTOP)
     **********************************************************/
    if (isMobile) {
        console.log("📱 Mobile Mode Active");

        // --- A. POPULATE MOBILE GALLERY ---
        if (mobileGallery && photos.length > 0) {
            mobileGallery.innerHTML = '';

            const imageArray = [];
            
            photos.forEach(photoDiv => {
                const originalImg = photoDiv.querySelector('img');
                if (originalImg && originalImg.src) {
                    imageArray.push(originalImg.src);
                }
            });

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
            
            const resetPoint = mobileGallery.scrollHeight / duplicateCount;
            
            mobileGallery.addEventListener('scroll', () => {
                handleInfiniteScroll();
            });
            
            mobileGallery.addEventListener('touchstart', () => {
                isUserScrolling = true;
                clearInterval(autoScrollInterval);
            });
            
            mobileGallery.addEventListener('touchend', () => {
                isUserScrolling = false;
                startAutoScroll();
            });
            
            function handleInfiniteScroll() {
                const scrollPos = mobileGallery.scrollTop;
                const maxScroll = mobileGallery.scrollHeight - mobileGallery.clientHeight;
                
                if (scrollPos >= maxScroll - 10) {
                    mobileGallery.scrollTop = resetPoint;
                }
                
                if (scrollPos <= 10) {
                    mobileGallery.scrollTop = resetPoint;
                }
            }
            
            function startAutoScroll() {
                autoScrollInterval = setInterval(() => {
                    if (!isUserScrolling && !overlay.style.pointerEvents.includes('auto')) {
                        mobileGallery.scrollBy({
                            top: 1.5,
                            behavior: 'auto'
                        });
                        
                        handleInfiniteScroll();
                    }
                }, 16);
            }
            
            mobileGallery.scrollTop = resetPoint;
            startAutoScroll();
        }

        // --- B. MOBILE HINTS ---
        if (hudHints.length >= 3) {
            hudHints[0].textContent = "Scroll to view all photos";
            hudHints[1].textContent = "Tap any photo to enlarge";
            hudHints[2].textContent = "Tap sphere below for menu";
        }

        showHints();

        // Animate text ring on mobile
        function animateMobileTextRing() {
            if (textRingSvg) {
                textOrbit += 0.002;
                textRingSvg.style.transform = `rotateZ(${textOrbit * 57.2958}deg)`;
            }
            requestAnimationFrame(animateMobileTextRing);
        }
        animateMobileTextRing();

    } else {
        console.log("💻 Desktop Mode Active");
        
        computePositions();
        animateSphere();
        showHints();
        
        photos.forEach(photo => {
            const img = photo.querySelector("img");
            if (img) {
                photo.addEventListener("click", () => openOverlay(img.src));
            }
            photo.ondragstart = e => e.preventDefault();
        });
        
        window.addEventListener("resize", computePositions);
        
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

        textOrbit += 0.002;
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
        overlay.classList.add("active");
        
        // Force hide both the sphere and the rotating text ring
        if (centerSphere) centerSphere.classList.add("is-hidden");
        if (textRing) textRing.classList.add("is-hidden");

        if (isMobile) {
            document.body.style.overflow = "hidden"; // Prevent background scrolling
        }
    }
}

if(overlayClose) {
    overlayClose.addEventListener("click", () => {
        overlay.classList.remove("active");
        
        // Bring them both back
        if (centerSphere) centerSphere.classList.remove("is-hidden");
        if (textRing) textRing.classList.remove("is-hidden");

        if (isMobile) {
            document.body.style.overflow = "auto";
        }
        
        // Clean up the image after fade-out
        setTimeout(() => { overlayImg.src = ""; }, 400);
    });
}
// Close when clicking the dark area of the overlay
overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
        overlayClose.click(); // Trigger the same close logic
    }
});
// Close overlay on Escape key
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("active")) {
        overlayClose.click();
    }
});

    // --- MENU LOGIC (WORKS FOR BOTH MOBILE AND DESKTOP) ---
    if (centerSphere) {
        centerSphere.addEventListener("click", (e) => {
            e.stopPropagation();
            console.log("Menu sphere clicked!");
            
            // Add expanding animation class
            centerSphere.classList.add("expanding");
            
            // Hide sphere and text ring when menu opens
            setTimeout(() => {
                if (centerSphere) centerSphere.style.display = "none";
                if (textRing) textRing.style.display = "none";
            }, 300);
            
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
            setTimeout(() => { 
                dropdownMenu.style.display = "none";
                // Show sphere and text ring again when menu closes
                if (centerSphere) centerSphere.style.display = "block";
                if (textRing) textRing.style.display = "block";
            }, 300);
        });
    }
    
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            if (page === 'home') {
                contentOverlay.classList.remove("active");
                // Show sphere and text ring when going back home
                if (centerSphere) centerSphere.style.display = "block";
                if (textRing) textRing.style.display = "block";
            } else {
                contentContainer.innerHTML = getPageContent(page);
                contentOverlay.classList.add("active");
                
                // Setup contact form if on contact page
                if (page === 'contact') {
                    setupContactForm();
                }
            }
            dropdownMenu.classList.remove("active");
            setTimeout(() => { dropdownMenu.style.display = "none"; }, 300);
        });
    });

    if(backButton) {
        backButton.addEventListener("click", () => {
            contentOverlay.classList.remove("active");
            // Show sphere and text ring when going back
            if (centerSphere) centerSphere.style.display = "block";
            if (textRing) textRing.style.display = "block";
        });
    }
    
    /**********************************************************
     * 6. CONTACT FORM HANDLER
     **********************************************************/
    function setupContactForm() {
        setTimeout(() => {
            const form = document.getElementById("my-form");
            if (form) {
                form.addEventListener("submit", async function handleSubmit(event) {
                    event.preventDefault();

                    const statusDiv = document.createElement('div');
                    statusDiv.id = "my-form-status";
                    statusDiv.style.marginTop = "10px";
                    form.appendChild(statusDiv);

                    const data = new FormData(event.target);

                    fetch(event.target.action, {
                        method: form.method,
                        body: data,
                        headers: {
                            'Accept': 'application/json'
                        }
                    }).then(response => {
                        if (response.ok) {
                            statusDiv.innerHTML = "Thanks for your submission!";
                            statusDiv.style.color = "green";
                            form.reset();
                        } else {
                            response.json().then(data => {
                                if (Object.hasOwn(data, 'errors')) {
                                    statusDiv.innerHTML = data["errors"].map(error => error["message"]).join(", ");
                                } else {
                                    statusDiv.innerHTML = "Oops! There was a problem submitting your form";
                                }
                                statusDiv.style.color = "red";
                            });
                        }
                    }).catch(error => {
                        statusDiv.innerHTML = "Oops! There was a problem submitting your form";
                        statusDiv.style.color = "red";
                    });
                });
            }
        }, 100);
    }
});

// --- HELPER: PAGE CONTENT ---
function getPageContent(page) {
    const contents = {
        about: `<h1>Hello fellow photo enjoyers!</h1><p>Welcome to my photography portfolio. I specialize in nature, wildlife, and landscape photography.</p>`,
        contact: `
            <h1>Contact Me</h1>
            <form id="my-form" action="https://formspree.io/f/mgvkgkny" method="POST">
                <label>Your Email:<br>
                    <input type="email" name="email" required style="width: 100%; padding: 8px; margin-top: 5px;">
                </label>
                <br><br>
                <label>Your Message:<br>
                    <textarea name="message" required style="width: 100%; padding: 8px; margin-top: 5px; min-height: 150px;"></textarea>
                </label>
                <br><br>
                <button type="submit" style="padding: 10px 20px; background: #333; color: white; border: none; cursor: pointer;">Send</button>
            </form>
        `
    };
    return contents[page] || '<h1>Page Not Found</h1>';
}


function showHints() {
    const mobileText = [
        "Scroll to explore photos",
        "Tap any photo to view full size",
        "Tap the sphere for menu"
    ];
    
    const desktopText = [
        "Drag to rotate the gallery",
        "Click any photo to view it full size",
        "Click the center sphere for more information"
    ];

    const activeTextSet = isMobile ? mobileText : desktopText;

    // Apply text content
    hudHints.forEach((hint, i) => {
        if (activeTextSet[i]) {
            hint.textContent = activeTextSet[i];
        }
    });

    let index = 0;
    function showNextHint() {
        if (index >= hudHints.length) return;
        
        // Remove active class from all first to be safe
        hudHints.forEach(h => h.classList.remove("active"));
        
        // Show current
        hudHints[index].classList.add("active");
        
        setTimeout(() => {
            hudHints[index].classList.remove("active");
            index++;
            // Short delay before the next one pops up
            setTimeout(showNextHint, 600);
        }, 3000);
    }

    // Delay the very first hint so the user has time to see the site load
    setTimeout(showNextHint, 1500);
}

// MAKE SURE THIS IS THE LAST LINE BEFORE THE CLOSING }); OF YOUR DOMContentLoaded
showHints();