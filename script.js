document.addEventListener("DOMContentLoaded", () => {
    
    /**********************************************************
     * 1. CORE VARIABLES & DOM ELEMENTS
     **********************************************************/
    const isMobile = window.innerWidth < 768;
    const sphere = document.getElementById("sphere");
    const photos = document.querySelectorAll(".photo");
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
     * 2. SPHERE MATH & ANIMATION
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
     * 3. FORMSPREE SUBMISSION LOGIC
     **********************************************************/
    async function handleFormSubmit(event) {
        event.preventDefault();
        const form = event.target;
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
                response.json().then(data => {
                    status.innerHTML = data.errors ? data.errors.map(e => e.message).join(", ") : "Oops! Problem submitting form.";
                });
            }
        }).catch(() => {
            status.innerHTML = "Oops! There was a problem submitting your form";
        });
    }

    /**********************************************************
     * 4. MOBILE/DESKTOP INITIALIZATION
     **********************************************************/
    if (isMobile) {
        // Mobile Gallery Logic
        if (mobileGallery && photos.length > 0) {
            mobileGallery.innerHTML = ''; 
            const imageArray = [];
            photos.forEach(photoDiv => {
                const originalImg = photoDiv.querySelector('img');
                if (originalImg) imageArray.push(originalImg.src);
            });
            for (let i = 0; i < 3; i++) {
                imageArray.forEach(src => {
                    const newImg = document.createElement('img');
                    newImg.src = src;
                    newImg.addEventListener('click', () => openOverlay(newImg.src));
                    mobileGallery.appendChild(newImg);
                });
            }
        }
    } else {
        computePositions();
        animateSphere();
        window.addEventListener("mousedown", e => { isDragging = true; lastX = e.clientX; lastY = e.clientY; });
        window.addEventListener("mouseup", () => isDragging = false);
        window.addEventListener("mousemove", e => {
            if (!isDragging) return;
            targetRotY -= (e.clientX - lastX) * 0.3;
            targetRotX += (e.clientY - lastY) * 0.3;
            lastX = e.clientX;
            lastY = e.clientY;
        });
    }

    /**********************************************************
     * 5. NAVIGATION & OVERLAYS
     **********************************************************/
    function openOverlay(src) {
        overlayImg.src = src;
        overlay.style.display = "flex";
        setTimeout(() => overlay.style.opacity = "1", 10);
    }

    if (overlayClose) {
        overlayClose.addEventListener("click", () => {
            overlay.style.opacity = "0";
            setTimeout(() => { overlay.style.display = "none"; }, 300);
        });
    }

    if (centerSphere) {
        centerSphere.addEventListener("click", () => {
            centerSphere.classList.add("expanding");
            setTimeout(() => {
                centerSphere.style.display = "none";
                textRing.style.display = "none";
                dropdownMenu.style.display = "flex";
                dropdownMenu.classList.add("active");
                centerSphere.classList.remove("expanding");
            }, 300);
        });
    }

    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            if (page === 'home') {
                contentOverlay.classList.remove("active");
                centerSphere.style.display = "block";
                textRing.style.display = "block";
            } else {
                contentContainer.innerHTML = getPageContent(page);
                contentOverlay.classList.add("active");
                
                // CRITICAL: Attach form listener AFTER HTML is injected
                if (page === 'contact') {
                    const form = document.getElementById("my-form");
                    if (form) form.addEventListener("submit", handleFormSubmit);
                }
            }
            dropdownMenu.classList.remove("active");
            setTimeout(() => { dropdownMenu.style.display = "none"; }, 300);
        });
    });

    if (backButton) {
        backButton.addEventListener("click", () => {
            contentOverlay.classList.remove("active");
            centerSphere.style.display = "block";
            textRing.style.display = "block";
        });
    }
});

/**********************************************************
 * 6. PAGE CONTENT HELPER
 **********************************************************/
function getPageContent(page) {
    const contents = {
        about: `<h1>About Peter Kopp</h1><p>Welcome to my photography portfolio. I specialize in nature, wildlife, and landscape photography.</p>`,
        contact: `
            <h1>Contact Me</h1>
            <p>Instagram: @peterkoppphotography</p>
            <form id="my-form" action="https://formspree.io/f/mgvkgkny" method="POST" style="display: flex; flex-direction: column; gap: 15px; max-width: 400px; margin-top: 20px;">
                <input type="email" name="email" placeholder="Your Email" required style="padding: 12px; background: rgba(255,255,255,0.1); border: 1px solid #444; color: white; border-radius: 4px;">
                <textarea name="message" placeholder="How can I help?" required style="padding: 12px; background: rgba(255,255,255,0.1); border: 1px solid #444; color: white; border-radius: 4px; min-height: 120px;"></textarea>
                <button type="submit" style="padding: 12px; background: white; color: black; border: none; cursor: pointer; border-radius: 4px; font-weight: bold; transition: 0.3s;">Send Message</button>
                <p id="my-form-status" style="margin-top: 10px; font-weight: bold;"></p>
            </form>`
    };
    return contents[page] || '<h1>Page Not Found</h1>';
}