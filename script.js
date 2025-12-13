/**********************************************************
* VARIABLES
**********************************************************/
const sphere = document.getElementById("sphere");
const photos = document.querySelectorAll(".photo");
const startContainer = document.getElementById("start-container");
const scene = document.getElementById("scene");
const textRing = document.getElementById("start-text-ring");
const letters = textRing.querySelectorAll("span");

/* Rotation state */
let rotX = 1, rotY = 0;
let targetRotX = 0, targetRotY = 0;
let isDragging = false;
let lastX = 0, lastY = 0;
const autoRotateSpeed = 0.03;

/**********************************************************
* DISTRIBUTE START TEXT AROUND SPHERE
**********************************************************/
const textRadius = 110;
letters.forEach((letter, i) => {
  const angle = (360 / letters.length) * i;
  letter.style.transform = `rotateY(${angle}deg) translateZ(${textRadius}px)`;
});

/**********************************************************
* DISTRIBUTE PHOTOS ON SPHERE
**********************************************************/
const sphereRadius = 350;
photos.forEach((photo, i) => {
  const phi = Math.acos(-1 + (2 * i) / photos.length);
  const theta = Math.sqrt(photos.length * Math.PI) * phi;

  const x = sphereRadius * Math.cos(theta) * Math.sin(phi);
  const y = sphereRadius * Math.sin(theta) * Math.sin(phi);
  const z = sphereRadius * Math.cos(phi);

  photo.style.transform = `translate3d(${x}px, ${y}px, ${z}px)`;
});

/**********************************************************
* AUTO-ROTATE + DRAG
**********************************************************/
function animateSphere() {
  if (!isDragging) targetRotY += autoRotateSpeed;

  // Smooth interpolation
  rotX += (targetRotX - rotX) * 0.1;
  rotY += (targetRotY - rotY) * 0.1;

  sphere.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  requestAnimationFrame(animateSphere);
}
animateSphere();

window.addEventListener("mousedown", e => {
  isDragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
});

window.addEventListener("mouseup", () => {
  isDragging = false;
});

window.addEventListener("mousemove", e => {
  if (!isDragging) return;

  const dx = e.clientX - lastX;
  const dy = e.clientY - lastY;

  targetRotY += dx * 0.3;
  targetRotX -= dy * 0.3;

  lastX = e.clientX;
  lastY = e.clientY;
});

/**********************************************************
* START BUTTON TRANSITION
**********************************************************/
startContainer.addEventListener("click", () => {
  startContainer.style.opacity = "0";
  startContainer.style.pointerEvents = "none";

  scene.style.opacity = "1";
  scene.style.pointerEvents = "auto";
});

/**********************************************************
* IMAGE ZOOM OVERLAY
**********************************************************/
const overlay = document.createElement("div");
overlay.id = "overlay";
overlay.style.cssText = `
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.85);
  display: none;
  justify-content: center;
  align-items: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.4s ease;
  z-index: 100;
`;
document.body.appendChild(overlay);

photos.forEach(photo => {
  photo.addEventListener("click", () => {
    const imgSrc = photo.querySelector("img").src;

    overlay.innerHTML = `
      <button id="overlay-close" style="
        position:absolute;
        top:20px;
        right:20px;
        font-size:2rem;
        background:none;
        border:none;
        color:white;
        cursor:pointer;">✕</button>
      <img src="${imgSrc}" style="
        max-width:90%;
        max-height:90%;
        border-radius:10px;
        box-shadow:0 20px 40px rgba(0,0,0,0.8);
        transform: scale(0);
        animation: zoomIn 0.4s forwards;">
    `;

    overlay.style.display = "flex";
    requestAnimationFrame(() => {
      overlay.style.opacity = "1";
      overlay.style.pointerEvents = "auto";
    });

    const closeBtn = document.getElementById("overlay-close");
    closeBtn.addEventListener("click", () => {
      overlay.style.opacity = "0";
      overlay.style.pointerEvents = "none";
    });
  });
});

/**********************************************************
* ZOOM ANIMATION KEYFRAMES (inject into document)
**********************************************************/
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes zoomIn {
  to { transform: scale(1); }
}`;
document.head.appendChild(styleSheet);
