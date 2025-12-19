// 1. Move global variable to the very top
const isMobile = window.innerWidth < 768;

document.addEventListener("DOMContentLoaded", () => {
    
    /**********************************************************
     * 1. CORE VARIABLES & DOM ELEMENTS
     **********************************************************/
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
    const welcomeHeader = document.getElementById('welcome-header');
    const beginButton = document.getElementById('begin-button');

    // 3D Variables
    const sphereRadius = 2200;
    const positions = [];
    let rotX = 0, rotY = 0;
    let targetRotX = 0, targetRotY = 0;
    let isDragging = false;
    let lastX = 0, lastY = 0;
    let textOrbit = 0;
    const TEXT_RING_DISTANCE = 95;

    /**********************************************************
     * 2. INTRO SCREEN (BEGIN BUTTON) LOGIC
     **********************************************************/
    if (beginButton && welcomeHeader) {
        // Lock button until animation finishes
        beginButton.style.pointerEvents = "none";
        setTimeout(() => {
            beginButton.style.pointerEvents = "auto";
        }, 1800);

        beginButton.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Trigger the CSS Slide-Up
            welcomeHeader.classList.add('fade-out');
            
            // Unlock scrolling
            document.body.style.overflow = "auto";

            // Start HUD hints after panel clears
            setTimeout(() => {
                showHints();
            }, 800);

            // Clean up DOM after animation
            setTimeout(() => {
                welcomeHeader.remove();
            }, 1100); 
        });
    }

    /**********************************************************
     * 3. HUD HINTS FUNCTION
     **********************************************************/
    function showHints() {
        const mobileText = [
            "Scroll to explore photos",
            "Tap any photo to view full size",
            "Tap the sphere for menu"
        ];
        
        const desktopText = [
            "Drag to rotate the gallery",
            "Click any photo to view it full size",
            "Click the sphere for info"
        ];

        const activeTextSet = isMobile ? mobileText : desktopText;

        hudHints.forEach((hint, i) => {
            if (activeTextSet[i]) hint.textContent = activeTextSet[i];
        });

        let index = 0;
        function showNextHint() {
            if (index >= hudHints.length) return;
            
            hudHints.forEach(h => h.classList.remove("active"));
            hudHints[index].classList.add("active");
            
            setTimeout(() => {
                hudHints[index].classList.remove("active");
                index++;
                setTimeout(showNextHint, 600);
            }, 3000);
        }
        showNextHint();
    }

    /**********************************************************
     * 4. GALLERY LOGIC (SWITCHER)
     **********************************************************/
    if (isMobile) {
        if (mobileGallery && photos.length > 0) {
            mobileGallery.innerHTML = '';
            const images = Array.from(photos).map(p => p.querySelector('img').src);
            
            [...images, ...images, ...images].forEach(src => {
                const img = document.createElement('img');
                img.src = src;
                img.addEventListener('click', () => openOverlay(src));
                mobileGallery.appendChild(img);
            });

            function animRing() {
                textOrbit += 0.002;
                if(textRingSvg) textRingSvg.style.transform = `rotateZ(${textOrbit * 57.29}deg)`;
                requestAnimationFrame(animRing);
            }
            animRing();
        }
    } else {
        computePositions();
        function mainLoop() {
            if (!isDragging) targetRotY += 0.02;
            rotX += (targetRotX - rotX) * 0.1;
            rotY += (targetRotY - rotY) * 0.1;

            if(sphere) sphere.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;

            textOrbit += 0.002;
            if (textRingSvg) textRingSvg.style.transform = `translateZ(${TEXT_RING_DISTANCE}px) rotateZ(${textOrbit}deg)`;

            photos.forEach((photo, i) => {
                const pos = positions[i];
                if (!pos) return;
                photo.style.transform = `translate(-50%, -50%) translate3d(${pos.x}px, ${pos.y}px, ${pos.z}px) rotateY(${-rotY}deg) rotateX(${-rotX}deg)`;
            });
            requestAnimationFrame(mainLoop);
        }
        mainLoop();

        window.addEventListener("mousedown", e => { isDragging = true; lastX = e.clientX; lastY = e.clientY; });
        window.addEventListener("mouseup", () => isDragging = false);
        window.addEventListener("mousemove", e => {
            if (!isDragging) return;
            targetRotY -= (e.clientX - lastX) * 0.3;
            targetRotX += (e.clientY - lastY) * 0.3;
            lastX = e.clientX; lastY = e.clientY;
        });
    }

    function computePositions() {
        const total = photos.length;
        photos.forEach((_, i) => {
            const phi = Math.acos(1 - 2 * (i + 0.5) / total);
            const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
            positions[i] = {
                x: sphereRadius * Math.sin(phi) * Math.cos(theta),
                y: sphereRadius * Math.cos(phi),
                z: -sphereRadius * Math.sin(phi) * Math.sin(theta)
            };
        });
    }

    /**********************************************************
     * 5. UI COMPONENTS (SHARED)
     **********************************************************/

    function openOverlay(src) {
        overlayImg.src = src;
        overlay.classList.add("active");
        if (centerSphere) centerSphere.classList.add("is-hidden");
        if (textRing) textRing.classList.add("is-hidden");
        document.body.style.overflow = "hidden";
    }

    if (overlayClose) {
        overlayClose.addEventListener("click", () => {
            overlay.classList.remove("active");
            if (centerSphere) centerSphere.classList.remove("is-hidden");
            if (textRing) textRing.classList.remove("is-hidden");
            if (isMobile) document.body.style.overflow = "auto";
        });
    }

    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlayClose.click(); });

    if (centerSphere) {
        centerSphere.addEventListener("click", () => {
            centerSphere.classList.add("expanding");
            setTimeout(() => {
                dropdownMenu.style.display = "flex";
                dropdownMenu.classList.add("active");
                centerSphere.style.display = "none";
                textRing.style.display = "none";
            }, 300);
        });
    }

    if (closeMenuBtn) {
        closeMenuBtn.addEventListener("click", () => {
            dropdownMenu.classList.remove("active");
            setTimeout(() => {
                dropdownMenu.style.display = "none";
                centerSphere.style.display = "block";
                textRing.style.display = "block";
                centerSphere.classList.remove("expanding");
            }, 300);
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
            closeMenuBtn.click();
        });
    });

    if (backButton) backButton.addEventListener("click", () => contentOverlay.classList.remove("active"));
});

// Helper Function Outside
function getPageContent(page) {
    const contents = {
        about: `<h1>About</h1><p>Professional photography portfolio by Peter Kopp.</p>`,
        contact: `<h1>Contact</h1><form id="my-form" action="https://formspree.io/f/mgvkgkny" method="POST">
                <label>Email:<br><input type="email" name="email" required></label><br>
                <label>Message:<br><textarea name="message" required></textarea></label><br>
                <button type="submit">Send</button></form>`
    };
    return contents[page] || '<h1>Page Not Found</h1>';
}