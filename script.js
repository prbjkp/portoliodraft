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
let rotX = 0, rotY = 0;
let targetRotX = 0, targetRotY = 0;
let isDragging = false;
let lastX = 0, lastY = 0;
const autoRotateSpeed = 0.03;

/* Sphere radius (distance from center to images) */
const sphereRadius = 1200;

/* Store positions for the sphere */
const positions = [];

/**********************************************************
* DISTRIBUTE START TEXT AROUND CENTER SPHERE
**********************************************************/
const textRadius = 110;
letters.forEach((letter, i) => {
  const angle = (360 / letters.length) * i;
  letter.style.transform = `rotateY(${angle}deg) translateZ(${textRadius}px)`;
});

/**********************************************************
* DISTRIBUTE PHOTOS EVENLY AROUND INSIDE OF SPHERE
**********************************************************/
photos.forEach((photo, i) => {
  const total = photos.length;

  // Fibonacci sphere formula for even distribution
  const phi = Math.acos(1 - 2 * (i + 0.5) / total);
  const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);

  const x = sphereRadius * Math.sin(phi) * Math.cos(theta);
  const y = sphereRadius * Math.cos(phi);
  const z = sphereRadius * Math.sin(phi) * Math.sin(theta);

  // Flip Z so the images face inward (viewer is inside)
  positions.push({ x, y, z: -z });
});

/**********************************************************
* ANIMATION LOOP: AUTO-ROTATE + DRAG + BILLBOARDING
**********************************************************/
function animateSphere() {
  if (!isDragging) targetRotY += autoRotateSpeed;

  // Smooth interpolation for rotation
  rotX += (targetRotX - rotX) * 0.1;
  rotY += (targetRotY - rotY) * 0.1;

  // Rotate the entire sphere container
  sphere.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;

  // Update each photo to face the center sphere
  photos.forEach((photo, i) => {
    const pos = positions[i];

    // Compute rotation toward center
    const dx = -pos.x;
    const dy = -pos.y;
    const dz = -pos.z;

    const rotYtoCenter = Math.atan2(dx, dz) * (180 / Math.PI);
    const rotXtoCenter = Math.asin(dy / sphereRadius) * (180 / Math.PI);

    photo.style.transform = `
      translate3d(${pos.x}px, ${pos.y}px, ${pos.z}px)
      rotateY(${rotYtoCenter}deg)
      rotateX(${rotXtoCenter}deg)
    `;
  });

  requestAnimationFrame(animateSphere);
}
animateSphere();

/* Mouse drag controls */
window.addEventListener("mousedown", e => {
  isDragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
});

window.addEventListener("mouseup", () => {
  isDragging = false;
});

window.addEventListener("mouseleave", () => {
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
* PREVENT IMAGE SELECTION / DRAGGING
**********************************************************/
photos.forEach(photo => {
  photo.ondragstart = e => e.preventDefault();
});
document.body.style.userSelect = "none";

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
* ZOOM ANIMATION KEYFRAMES
**********************************************************/
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes zoomIn {
  to { transform: scale(1); }
}`;
document.head.appendChild(styleSheet);
