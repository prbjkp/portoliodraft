document.addEventListener("DOMContentLoaded", () => {
    
    /**********************************************************
     * WELCOME HEADER LOGIC - MUST BE FIRST
     **********************************************************/
    const welcomeHeader = document.getElementById('welcome-header');
    const beginButton = document.getElementById('begin-button');
if (beginButton && welcomeHeader) {
        beginButton.addEventListener('click', () => {
            console.log("BEGIN button clicked!");
            
            welcomeHeader.classList.add('fade-out');
            
            setTimeout(() => {
                welcomeHeader.remove();
                console.log("Welcome header removed - main screen should now be visible");
                
                // Trigger HUD hints AFTER the welcome header is removed
                showHints();
            }, 1000);
        });
    }
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
    let aboutOverlayScrollHandler = null;
    renderCarsGallery();
    let aboutOverlayAnimationId = null;

    async function fetchPageBody(url) {
        try {
            const response = await fetch(url, { cache: 'no-store' });
            if (!response.ok) return '';
            const text = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            doc.querySelectorAll('script').forEach(el => el.remove());
            return doc.body ? doc.body.innerHTML : text;
        } catch (err) {
            console.warn('Unable to fetch page body for', url, err);
            return '';
        }
    }

    function clearAboutPageState() {
        document.body.classList.remove('about-page');
        document.body.classList.remove('cars-page');
        document.body.classList.remove('content-open');
        if (contentOverlay) {
            contentOverlay.classList.remove('about-page');
            contentOverlay.classList.remove('cars-page');
        }
        if (aboutOverlayScrollHandler) {
            if (contentOverlay) {
                contentOverlay.removeEventListener('scroll', aboutOverlayScrollHandler);
            }
            window.removeEventListener('scroll', aboutOverlayScrollHandler);
            aboutOverlayScrollHandler = null;
        }
        if (aboutOverlayAnimationId) {
            cancelAnimationFrame(aboutOverlayAnimationId);
            aboutOverlayAnimationId = null;
        }
    }

    function getLazyImagePlaceholder() {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
            <rect width="800" height="600" fill="#e8e3d5"/>
            <rect x="40" y="40" width="720" height="520" rx="24" fill="#f4efe1"/>
            <path d="M170 430c56-112 110-172 167-172 56 0 112 58 167 172" fill="none" stroke="#d4cab0" stroke-width="24" stroke-linecap="round"/>
            <circle cx="260" cy="230" r="56" fill="#d4cab0"/>
        </svg>`;
        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    }

    function createLazyImage(src, alt = '') {
        const img = document.createElement('img');
        img.alt = alt;
        img.loading = 'lazy';
        img.decoding = 'async';
        img.className = 'cars-image';
        img.dataset.src = src;
        img.src = getLazyImagePlaceholder();
        return img;
    }

    function loadGalleryImage(img) {
        if (!img || img.dataset.loaded === 'true') return;
        img.dataset.loaded = 'true';
        img.src = img.dataset.src;
    }

    function renderCarsGallery() {
        const gallery = document.getElementById('cars-grid');
        if (!gallery) return;

        const imagePaths = [
            'cars/DSC00998.jpg',
            'cars/DSC01002.jpg',
            'cars/DSC01014.jpg',
            'cars/DSC01016.jpg',
            'cars/DSC01027.jpg',
            'cars/DSC01036.jpg',
            'cars/DSC01066.jpg',
            'cars/DSC01093.jpg',
            'cars/DSC01096.jpg',
            'cars/DSC01098.jpg',
            'cars/DSC01103.jpg',
            'cars/DSC01120.jpg',
            'cars/DSC01127.jpg',
            'cars/DSC01136.jpg',
            'cars/DSC01142.jpg',
            'cars/DSC01147-1.jpg',
            'cars/DSC01153.jpg',
            'cars/DSC01157.jpg',
            'cars/DSC01159.jpg',
            'cars/DSC01248.jpg',
            'cars/DSC01256.jpg',
            'cars/DSC01296.jpg',
            'cars/DSC01324.jpg',
            'cars/DSC01325.jpg',
            'cars/DSC01339.jpg'
        ];

        gallery.innerHTML = '';
        const imageElements = [];

        imagePaths.forEach((src) => {
            const card = document.createElement('article');
            card.className = 'cars-card';

            const img = createLazyImage(src);
            imageElements.push(img);

            card.appendChild(img);
            gallery.appendChild(card);
        });

        const initialBatch = Math.min(imageElements.length, window.innerWidth < 768 ? 6 : 8);
        imageElements.slice(0, initialBatch).forEach(loadGalleryImage);

        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries, obs) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    loadGalleryImage(entry.target);
                    obs.unobserve(entry.target);
                });
            }, { rootMargin: '220px 0px 220px 0px', threshold: 0.01 });

            imageElements.slice(initialBatch).forEach((img) => observer.observe(img));
        } else {
            imageElements.slice(initialBatch).forEach(loadGalleryImage);
        }
    }

    function setupOverlayAboutEffects() {
        if (!contentOverlay || !contentContainer) return;

        const heroCopy = contentContainer.querySelector('.hero-copy');
        const heroPhoto = contentContainer.querySelector('.hero-photo-placeholder');
        const bgWall = contentContainer.querySelector('.about-bg-wall');
        const revealItems = contentContainer.querySelectorAll('.reveal-on-scroll');

        if (heroCopy) requestAnimationFrame(() => heroCopy.classList.add('active'));
        if (heroPhoto) requestAnimationFrame(() => heroPhoto.classList.add('active'));

        if (bgWall) {
            bgWall.style.transform = 'translateY(0px)';
            bgWall.style.opacity = '1';
        }

        if ('IntersectionObserver' in window) {
            const revealObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('active');
                    }
                });
            }, { threshold: 0.2 });
            revealItems.forEach((item) => revealObserver.observe(item));
        } else {
            revealItems.forEach((item) => item.classList.add('active'));
        }

        if (aboutOverlayScrollHandler) {
            if (contentOverlay) {
                contentOverlay.removeEventListener('scroll', aboutOverlayScrollHandler);
            }
            window.removeEventListener('scroll', aboutOverlayScrollHandler);
        }
        if (aboutOverlayAnimationId) {
            cancelAnimationFrame(aboutOverlayAnimationId);
            aboutOverlayAnimationId = null;
        }

        aboutOverlayScrollHandler = () => {
            if (!contentOverlay) return;
            const scrollTop = contentOverlay.scrollTop || window.scrollY || 0;
            const offset = Math.min(scrollTop, 280);

            if (heroPhoto) {
                heroPhoto.style.transform = `translateY(-${offset * 0.14}px)`;
                heroPhoto.style.filter = `blur(${Math.min(offset * 0.008, 3)}px)`;
            }
            if (heroCopy) {
                heroCopy.style.transform = `translateY(-${offset * 0.18}px)`;
                heroCopy.style.opacity = `${Math.max(0.88, 1 - offset / 950)}`;
            }
            if (bgWall) {
                bgWall.style.transform = `translateY(${offset * 0.42}px)`;
            }
        };

        const frameTick = () => {
            aboutOverlayScrollHandler();
            aboutOverlayAnimationId = requestAnimationFrame(frameTick);
        };

        contentOverlay.addEventListener('scroll', aboutOverlayScrollHandler, { passive: true });
        window.addEventListener('scroll', aboutOverlayScrollHandler, { passive: true });
        frameTick();
    }

    async function loadPageContent(page) {
        if (!contentContainer) return;

        const shouldAnimate = contentOverlay.classList.contains('active') && contentContainer.innerHTML.trim();
        if (shouldAnimate) {
            contentContainer.classList.remove('page-swipe-in');
            contentContainer.classList.add('page-swipe-out');
            await new Promise(resolve => setTimeout(resolve, 620));
        }

        contentContainer.classList.remove('page-swipe-out');
        contentContainer.classList.remove('page-swipe-in');
        document.body.classList.add('content-open');

        if (page === 'about') {
            const aboutMarkup = await fetchPageBody('about.html');
            contentContainer.innerHTML = aboutMarkup || getPageContent(page);
            contentOverlay.classList.add('about-page');
            document.body.classList.add('about-page');
            setupOverlayAboutEffects();
        } else if (page === 'cars') {
            const carsMarkup = await fetchPageBody('cars.html');
            contentContainer.innerHTML = carsMarkup || getPageContent(page);
            contentOverlay.classList.add('cars-page');
            document.body.classList.add('cars-page');
            renderCarsGallery();
        } else {
            contentOverlay.classList.remove('about-page');
            contentOverlay.classList.remove('cars-page');
            document.body.classList.remove('about-page');
            document.body.classList.remove('cars-page');
            contentContainer.innerHTML = getPageContent(page);
        }

        contentContainer.classList.add('page-swipe-in');
        requestAnimationFrame(() => {
            contentContainer.classList.remove('page-swipe-in');
        });
    }

    /**********************************************************
     * Debugging: log input events on photos/images
     * Enabled to capture what the Chromebook sends (tap, trackpad)
     **********************************************************/
    const DEBUG_ACTIVATION = false;
    if (DEBUG_ACTIVATION) {
        const interestingEvents = ['pointerdown','pointerup','pointercancel','mousedown','mouseup','touchstart','touchend','click','auxclick','contextmenu'];

        // Create a non-interfering on-screen debug panel so managed devices can still see logs
        let __dbgPanel;
        function ensureDbgPanel() {
            if (__dbgPanel) return __dbgPanel;
            __dbgPanel = document.createElement('div');
            __dbgPanel.id = 'dbg-panel';
            __dbgPanel.style.position = 'fixed';
            __dbgPanel.style.right = '12px';
            __dbgPanel.style.bottom = '12px';
            __dbgPanel.style.width = '360px';
            __dbgPanel.style.maxHeight = '40vh';
            __dbgPanel.style.overflow = 'auto';
            __dbgPanel.style.background = 'rgba(0,0,0,0.75)';
            __dbgPanel.style.color = '#E6ECE8';
            __dbgPanel.style.fontSize = '12px';
            __dbgPanel.style.padding = '8px';
            __dbgPanel.style.borderRadius = '8px';
            // Ensure panel sits above any full-screen welcome overlays
            __dbgPanel.style.zIndex = '2147483648';
            __dbgPanel.style.pointerEvents = 'none'; // don't block input
            __dbgPanel.style.boxShadow = '0 8px 30px rgba(0,0,0,0.6)';
            __dbgPanel.style.border = '1px solid rgba(255,255,255,0.06)';
            __dbgPanel.style.whiteSpace = 'nowrap';
            document.body.appendChild(__dbgPanel);
            return __dbgPanel;
        }

        function appendDbgLine(txt) {
            const p = document.createElement('div');
            p.textContent = txt;
            p.style.marginBottom = '6px';
            p.style.opacity = '0.95';
            ensureDbgPanel().appendChild(p);
            // keep only recent 60 lines
            const children = ensureDbgPanel().children;
            while (children.length > 60) ensureDbgPanel().removeChild(children[0]);
        }

        function dbgLog(e) {
            try {
                const photoEl = e.target.closest && e.target.closest('.photo');
                if (!photoEl && e.target.tagName !== 'IMG') return;
                const img = photoEl ? photoEl.querySelector('img') : (e.target.tagName === 'IMG' ? e.target : null);
                const msg = `[${e.type}] target=${e.target.tagName} class=${(e.target.className||'').replace(/\s+/g,' ')} closestPhoto=${!!photoEl} img=${img?img.src.split('/').pop():'n/a'} btn=${e.button} ptr=${e.pointerType||'n/a'} touches=${e.touches?e.touches.length:'n/a'} client=${e.clientX||'n/a'},${e.clientY||'n/a'}`;
                console.log('[DBG EVENT]', msg);
                appendDbgLine(msg);
            } catch (err) {
                console.log('[DBG EVENT] error logging event', err);
                appendDbgLine('[DBG EVENT] error logging event');
            }
        }

        interestingEvents.forEach(ev => {
            document.addEventListener(ev, dbgLog, {capture: true, passive: true});
        });
    }
    
    console.log("Center Sphere Element:", centerSphere);
    if (centerSphere) {
        console.log("Center Sphere computed style:", window.getComputedStyle(centerSphere).display);
        console.log("Center Sphere position:", window.getComputedStyle(centerSphere).position);
        console.log("Center Sphere z-index:", window.getComputedStyle(centerSphere).zIndex);
    }

    const isHomePage = (location.pathname === '/' || location.pathname.endsWith('/index.html') || document.body.classList.contains('home-page'));

    function setCenterSphereVisible(visible) {
        if (!centerSphere || !textRing) return;
        const displayValue = visible ? 'block' : 'none';
        centerSphere.style.display = displayValue;
        textRing.style.display = displayValue;
    }

    if (isMobile && !isHomePage) {
        setCenterSphereVisible(false);
        console.log('Hiding center sphere and text ring on mobile (non-home page)');
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
    const AUTO_ROTATE_SPEED = 0.06;

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
     * Unified activation handler for clicks, taps, and pointers
     * Ensures trackpads, touch, mouse and pen input all open images
     **********************************************************/
    function addActivationListeners(elem, src, stopPropagation = false) {
        elem.__lastActivated = 0;
        elem.__pressInfo = { startX: null, startY: null, moved: false };

        const startInteraction = (e) => {
            const point = e.touches && e.touches[0] ? e.touches[0] : e;
            elem.__pressInfo.startX = point.clientX;
            elem.__pressInfo.startY = point.clientY;
            elem.__pressInfo.moved = false;
        };

        const moveInteraction = (e) => {
            const point = e.touches && e.touches[0] ? e.touches[0] : e;
            if (typeof elem.__pressInfo.startX !== 'number') return;
            const dx = point.clientX - elem.__pressInfo.startX;
            const dy = point.clientY - elem.__pressInfo.startY;
            if (Math.hypot(dx, dy) > 10) {
                elem.__pressInfo.moved = true;
            }
        };

        const handler = (e) => {
            const now = Date.now();
            if (now - elem.__lastActivated < 350) return; // debounce duplicates
            elem.__lastActivated = now;
            if (e.type === 'pointerup' && e.button !== 0) return; // only primary button
            if (elem.__pressInfo.moved) return;
            if (stopPropagation && e.stopPropagation) e.stopPropagation();
            if (e.preventDefault) e.preventDefault();
            openOverlay(src);
        };

        elem.addEventListener('pointerdown', startInteraction, { passive: true });
        elem.addEventListener('touchstart', startInteraction, { passive: true });
        elem.addEventListener('pointermove', moveInteraction, { passive: true });
        elem.addEventListener('touchmove', moveInteraction, { passive: true });
        elem.addEventListener('pointercancel', () => { elem.__pressInfo.moved = true; }, { passive: true });

        elem.addEventListener('click', handler);
        elem.addEventListener('pointerup', handler);
        elem.addEventListener('touchend', handler);
    }

    /**********************************************************
     * 3. HUD HINTS - DEVICE AWARE
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
            "Click the center sphere for more information"
        ];

        const activeTextSet = isMobile ? mobileText : desktopText;

        hudHints.forEach((hint, i) => {
            if (activeTextSet[i]) {
                hint.textContent = activeTextSet[i];
            }
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

        setTimeout(showNextHint, 1500);
    }

    /**********************************************************
     * 4. LOGIC SWITCHER (MOBILE VS DESKTOP)
     **********************************************************/
    if (isMobile) {
        console.log("📱 Mobile Mode Active");

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
                    
                    addActivationListeners(newImg, newImg.src);

                    mobileGallery.appendChild(newImg);
                });
            }

            console.log(`✅ Added ${mobileGallery.children.length} images to mobile gallery`);
            
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
                    const overlayOpen = overlay && overlay.style && overlay.style.pointerEvents.includes('auto');
                    if (!isUserScrolling && !overlayOpen) {
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

        showHints();

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
                addActivationListeners(photo, img.src);
                addActivationListeners(img, img.src, true);
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
            targetRotY -= (e.clientX - lastX) * 0.5;
            targetRotX += (e.clientY - lastY) * 0.5;
            lastX = e.clientX;
            lastY = e.clientY;
        });
    }

    // about-page dynamic background removed; no JS modifications for about page

    /**********************************************************
     * 5. SHARED FUNCTIONS
     **********************************************************/
    function animateSphere() {
        if (isMobile) return; 

        if (!isDragging) targetRotY += AUTO_ROTATE_SPEED;
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

    function openOverlay(src) {
        if (!overlay || !overlayImg) return;

        overlayImg.src = src;
        overlay.classList.add("active");
        overlayImg.style.opacity = "0";
        overlayImg.style.transform = "scale(0.95)";
        requestAnimationFrame(() => {
            overlayImg.style.opacity = "1";
            overlayImg.style.transform = "scale(1)";
        });

        if (centerSphere) centerSphere.classList.add("is-hidden");
        if (textRing) textRing.classList.add("is-hidden");

        if (isMobile) {
            document.body.style.overflow = "hidden";
        }
    }

    function closeOverlay() {
        if (!overlay || !overlayImg) return;

        overlay.classList.remove("active");
        if (centerSphere) centerSphere.classList.remove("is-hidden");
        if (textRing) textRing.classList.remove("is-hidden");

        if (isMobile) {
            document.body.style.overflow = "auto";
        }

        setTimeout(() => { overlayImg.src = ""; }, 400);
    }

    if (overlayClose) {
        overlayClose.addEventListener("click", closeOverlay);
    }

    if (overlay) {
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) {
                closeOverlay();
            }
        });
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && overlay && overlay.classList.contains("active")) {
            closeOverlay();
        }
    });

    /**********************************************************
     * 6. MENU LOGIC
     **********************************************************/
    if (centerSphere) {
        centerSphere.addEventListener("click", (e) => {
            e.stopPropagation();
            console.log("Menu sphere clicked!");
            document.body.classList.add('menu-open');

            centerSphere.classList.add("expanding");

            // reveal dropdown container immediately so it animates (expand/outward or drop)
            dropdownMenu.style.display = 'flex';
            dropdownMenu.classList.add('active');

            // after a very slight pause, reveal items with staggered CSS delays
            const itemsDelay = 160; // ms before items start dropping in
            setTimeout(() => {
                dropdownMenu.classList.add('items-in');
            }, itemsDelay);

            setTimeout(() => {
                if (centerSphere) centerSphere.style.display = "none";
                if (textRing) textRing.style.display = "none";
            }, 300);

            setTimeout(() => {
                centerSphere.classList.remove("expanding");
            }, 700);
        });
    }

    if (closeMenuBtn) {
        closeMenuBtn.addEventListener("click", () => {
            // hide items first, then container
            dropdownMenu.classList.remove('items-in');
            setTimeout(() => {
                dropdownMenu.classList.remove("active");
                document.body.classList.remove('menu-open');
            }, 120);
            setTimeout(() => { 
                dropdownMenu.style.display = "none";
                if (centerSphere) centerSphere.style.display = "block";
                if (textRing) textRing.style.display = "block";
            }, 420);
        });
    }
    
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', async () => {
            const page = item.dataset.page;
            if (page === 'shop') {
                const tab = window.open(
                    'https://peterbkopp.darkroom.com',
                    '_blank'
                );
                if (tab) tab.opener = null;
                // hide items and container cleanly
                dropdownMenu.classList.remove('items-in');
                setTimeout(() => {
                    dropdownMenu.classList.remove("active");
                    document.body.classList.remove('menu-open');
                }, 120);
                setTimeout(() => { dropdownMenu.style.display = "none"; }, 420);
                return;
            }

            if (page === 'home') {
                contentOverlay.classList.remove("active");
                clearAboutPageState();
                setCenterSphereVisible(true);
            } else {
                clearAboutPageState();
                document.body.classList.add('content-open');
                await loadPageContent(page);
                contentOverlay.classList.add("active");
                setCenterSphereVisible(false);

                if (page === 'contact') {
                    setupContactForm();
                }
            }

            dropdownMenu.classList.remove('items-in');
            setTimeout(() => {
                dropdownMenu.classList.remove("active");
                document.body.classList.remove('menu-open');
            }, 120);
            setTimeout(() => { dropdownMenu.style.display = "none"; }, 420);
        });
    });

    function closeOverlayWithSwipeUp() {
        if (!contentOverlay || !contentContainer) return;
        contentContainer.classList.add('page-swipe-up');
        setTimeout(() => {
            contentOverlay.classList.remove('active');
            contentContainer.classList.remove('page-swipe-up');
            clearAboutPageState();
            setCenterSphereVisible(true);
        }, 620);
    }

    if(backButton) {
        backButton.addEventListener("click", () => {
            closeOverlayWithSwipeUp();
        });
    }
    
    /**********************************************************
     * 7. CONTACT FORM HANDLER
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

    /**********************************************************
     * 8. HELPER FUNCTIONS
     **********************************************************/
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

    const isAboutPage = document.body.classList.contains('about-page');
    if (isAboutPage) {
        const heroCopy = document.querySelector('.hero-copy');
        const heroPhoto = document.querySelector('.hero-photo-placeholder');
        const revealItems = document.querySelectorAll('.reveal-on-scroll');

        if (heroCopy) {
            requestAnimationFrame(() => heroCopy.classList.add('active'));
        }
        if (heroPhoto) {
            requestAnimationFrame(() => heroPhoto.classList.add('active'));
        }

        window.addEventListener('scroll', () => {
            const offset = Math.min(window.scrollY, 260);
            if (heroPhoto) {
                heroPhoto.style.transform = `translateY(${offset * 0.18}px)`;
                heroPhoto.style.filter = `blur(${Math.min(offset * 0.01, 4)}px)`;
            }
        }, { passive: true });

        if ('IntersectionObserver' in window) {
            const revealObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('active');
                    }
                });
            }, {
                threshold: 0.2,
            });

            revealItems.forEach((item) => revealObserver.observe(item));
        } else {
            revealItems.forEach((item) => item.classList.add('active'));
        }
    }
    /**********************************************************
 * ABOUT PAGE - SCROLLING BACKGROUND GRID
 **********************************************************/
const isAboutPageDirect = document.body.classList.contains('about-page');
if (isAboutPageDirect) {
    const scrollGrid = document.getElementById('scrollGrid');
    const desktopBreakpoint = 960;

    if (scrollGrid && window.innerWidth > desktopBreakpoint) {
        const imageList = [
            'images/flowers.jpg',
            'images/bird9.jpg',
            'images/cat.jpg',
            'images/dajlkdsajd.jpg',
            'images/asljdhsalkdjaskl.jpg',
            'images/landscapeboarder.jpg',
            'images/landscape2.jpg',
            'images/ljdalskdjka.jpg',
            'images/DSC01087.jpg',
            'images/DSC01160.jpg',
            'images/DSC01213.jpg',
            'images/DSC04338.JPG',
            'images/DSC01285.jpg',
            'images/_DSC1013.jpg',
            'images/snake1.jpg',
            'images/acropliswindow.jpg'
        ];

        const cells = [];
        const totalCells = 24;

        for (let i = 0; i < totalCells; i += 1) {
            const img = document.createElement('img');
            img.src = imageList[i % imageList.length];
            img.alt = 'Background gallery image';
            img.loading = 'lazy';
            img.decoding = 'async';
            img.fetchPriority = 'low';
            img.dataset.cellIndex = String(i);
            scrollGrid.appendChild(img);
            cells.push(img);
        }

        let ticking = false;
        let lastCycle = -1;

        function updateGridPosition() {
            const scrollTop = Math.min(window.scrollY, document.documentElement.scrollHeight - window.innerHeight);
            const scrollPercent = scrollTop / (document.documentElement.scrollHeight - window.innerHeight || 1);
            const translateX = (scrollPercent - 0.5) * -18;
            const translateY = (scrollPercent - 0.5) * -14;
            const rotate = (scrollPercent - 0.5) * 6;

            scrollGrid.style.transform = `translate3d(${translateX}%, ${translateY}%, 0) rotate(${rotate}deg)`;

            const cycleStep = Math.floor(scrollPercent * 16);
            if (cycleStep !== lastCycle) {
                lastCycle = cycleStep;
                cells.forEach((img, index) => {
                    const sourceIndex = (index + cycleStep) % imageList.length;
                    const newSrc = imageList[sourceIndex];
                    if (!img.src.endsWith(newSrc)) {
                        img.src = newSrc;
                    }
                    const offset = (index % 6) - 2.5;
                    const scale = 1 - Math.abs(offset) * 0.02;
                    img.style.transform = `rotate(${offset * 2.2 + scrollPercent * 4}deg) scale(${scale})`;
                });
            }

            ticking = false;
        }

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(updateGridPosition);
                ticking = true;
            }
        }, { passive: true });

        updateGridPosition();
    }
}
});


