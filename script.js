// Define isMobile at the top so all functions can access it
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

    const sphereRadius = 2200;
    const positions = [];
    let rotX = 0, rotY = 0;
    let targetRotX = 0, targetRotY = 0;
    let isDragging = false;
    let lastX = 0, lastY = 0;
    let textOrbit = 0;
    const TEXT_RING_DISTANCE = 95;

    /**********************************************************
     * 2. INTRO / START LOGIC
     **********************************************************/
    if (beginButton && welcomeHeader) {
        // Prevent clicking until intro animation settles
        beginButton.style.pointerEvents = "none";
        setTimeout(() => { beginButton.style.pointerEvents = "auto"; }, 1800);

        beginButton.addEventListener('click', (e) => {
            e.preventDefault();
            welcomeHeader.classList.add('fade-out');
            document.body.classList.add('entered'); // Reveals the sphere/gallery
            
            // Start HUD hints and cleanup
            setTimeout(() => { 
                showHints(); 
                welcomeHeader.remove(); 
            }, 1000);
        });
    }

    /**********************************************************
     * 3. HUD HINTS (UNIFIED)
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
        // --- MOBILE INFINITE SCROLL ---
        if (mobileGallery && photos.length > 0) {
            mobileGallery.innerHTML = '';
            const imageArray = [];
            photos.forEach(photoDiv => {
                const img = photoDiv.querySelector('img');
                if (img) imageArray.push(img.src);
            });

            const duplicateCount = 3;
            for (let i = 0; i < duplicateCount; i++) {
                imageArray.forEach(src => {
                    const newImg = document.createElement('img');
                    newImg.src = src;
                    newImg.addEventListener('click', () => openOverlay(src));
                    mobileGallery.appendChild(newImg);
                });
            }

            let autoScrollInterval;
            let isUserScrolling = false;
            const resetPoint = mobileGallery.scrollHeight / duplicateCount;

            mobileGallery.addEventListener('scroll', () => {
                const scrollPos = mobileGallery.scrollTop;
                const maxScroll = mobileGallery.scrollHeight - mobileGallery.clientHeight;
                if (scrollPos >= maxScroll - 10 || scrollPos <= 10) mobileGallery.scrollTop = resetPoint;
            });

            const startAutoScroll = () => {
                autoScrollInterval = setInterval(() => {
                    if (!isUserScrolling && !overlay.classList.contains('active')) {
                        mobileGallery.scrollBy({ top: 1.5, behavior: 'auto' });
                    }
                }, 16);
            };

            mobileGallery.addEventListener('touchstart', () => { isUserScrolling = true; clearInterval(autoScrollInterval); });
            mobileGallery.addEventListener('touchend', () => { isUserScrolling = false; startAutoScroll(); });
            
            mobileGallery.scrollTop = resetPoint;
            startAutoScroll();
        }

        // Mobile Text Ring Animation
        function animateMobileTextRing() {
            if (textRingSvg) {
                textOrbit += 0.002;
                textRingSvg.style.transform = `rotateZ(${textOrbit * 57.2958}deg)`;
            }
            requestAnimationFrame(animateMobileTextRing);
        }
        animateMobileTextRing();

    } else {
        // --- DESKTOP 3D SPHERE ---
        computePositions();
        animateSphere();
        
        photos.forEach(photo => {
            const img = photo.querySelector("img");
            if (img) photo.addEventListener("click", () => openOverlay(img.src));
            photo.ondragstart = e => e.preventDefault();
        });

        window.addEventListener("resize", computePositions);
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
        textOrbit += 0.002;
        if (textRingSvg) textRingSvg.style.transform = `translateZ(${TEXT_RING_DISTANCE}px) rotateZ(${textOrbit}deg)`;

        photos.forEach((photo, i) => {
            const pos = positions[i];
            if (!pos) return;
            photo.style.transform = `translate(-50%, -50%) translate3d(${pos.x}px, ${pos.y}px, ${pos.z}px) rotateY(${-rotY}deg) rotateX(${-rotX}deg)`;
        });
        requestAnimationFrame(animateSphere);
    }

    /**********************************************************
     * 5. SHARED UI LOGIC (OVERLAY & MENU)
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
            setTimeout(() => { overlayImg.src = ""; }, 400);
        });
    }

    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlayClose.click(); });

    // Menu Toggle Logic
    if (centerSphere) {
        centerSphere.addEventListener("click", (e) => {
            e.stopPropagation();
            centerSphere.classList.add("expanding");
            setTimeout(() => {
                centerSphere.style.display = "none";
                textRing.style.display = "none";
                dropdownMenu.classList.add("active");
                dropdownMenu.style.display = "flex";
            }, 300);
            setTimeout(() => centerSphere.classList.remove("expanding"), 600);
        });
    }

    if (closeMenuBtn) {
        closeMenuBtn.addEventListener("click", () => {
            dropdownMenu.classList.remove("active");
            setTimeout(() => { 
                dropdownMenu.style.display = "none";
                centerSphere.style.display = "block";
                textRing.style.display = "block";
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
                if (page === 'contact') setupContactForm();
            }
            closeMenuBtn.click();
        });
    });

    if (backButton) backButton.addEventListener("click", () => contentOverlay.classList.remove("active"));

    /**********************************************************
     * 6. CONTACT FORM HANDLER
     **********************************************************/
    function setupContactForm() {
        const form = document.getElementById("my-form");
        if (!form) return;
        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            const statusDiv = document.createElement('div');
            form.appendChild(statusDiv);
            const data = new FormData(event.target);
            fetch(event.target.action, {
                method: form.method,
                body: data,
                headers: { 'Accept': 'application/json' }
            }).then(response => {
                if (response.ok) {
                    statusDiv.innerHTML = "Sent!";
                    form.reset();
                } else {
                    statusDiv.innerHTML = "Error!";
                }
            });
        });
    }
});

function getPageContent(page) {
    const contents = {
        about: `<h1>Hello!</h1><p>Welcome to my photography portfolio.</p>`,
        contact: `<h1>Contact Me</h1><form id="my-form" action="https://formspree.io/f/mgvkgkny" method="POST">
            <input type="email" name="email" placeholder="Your Email" required><br><br>
            <textarea name="message" placeholder="Message" required></textarea><br><br>
            <button type="submit">Send</button></form>`
    };
    return contents[page] || '<h1>Not Found</h1>';
}