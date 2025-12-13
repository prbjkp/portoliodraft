/**********************************************************
 * PHOTO SPHERE
 **********************************************************/
const sphere = document.getElementById("sphere");
const photos = document.querySelectorAll(".photo");

/* DISTRIBUTE PHOTOS ON SPHERE */
const sphereRadius = 350;
const totalPhotos = photos.length;

photos.forEach((photo, i) => {
  const phi = Math.acos(-1 + (2 * i) / totalPhotos);
  const theta = Math.sqrt(totalPhotos * Math.PI) * phi;

  const x = sphereRadius * Math.cos(theta) * Math.sin(phi);
  const y = sphereRadius * Math.sin(theta) * Math.sin(phi);
  const z = sphereRadius * Math.cos(phi);

  photo.style.transform = `translate3d(${x}px, ${y}px, ${z}px)`;
});

/* ROTATION STATE */
let rotX = 0;
let rotY = 0;
let isDragging = false;
let lastX = 0;
let lastY = 0;
let autoRotateSpeed = 0.03;

/* AUTO ROTATION LOOP */
function animateSphere() {
  if (!isDragging) {
    rotY += autoRotateSpeed;
  }

  sphere.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  requestAnimationFrame(animateSphere);
}
animateSphere();

/* MOUSE CONTROLS */
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

  rotY += dx * 0.3;
  rotX -= dy * 0.3;

  lastX = e.clientX;
  lastY = e.clientY;
});


/**********************************************************
 * START TEXT RING (WRAPPED AROUND SPHERE)
 **********************************************************/
const textRing = document.getElementById("start-text-ring");
const letters = textRing.querySelectorAll("span");

const textRadius = 110;
const letterCount = letters.length;

letters.forEach((letter, i) => {
  const angle = (360 / letterCount) * i;

  letter.style.transform = `
    rotateY(${angle}deg)
    translateZ(${textRadius}px)
  `;
});


/**********************************************************
 * START BUTTON TRANSITION
 **********************************************************/
const startContainer = document.getElementById("start-container");
const scene = document.getElementById("scene");

startContainer.addEventListener("click", () => {
  startContainer.style.opacity = "0";
  startContainer.style.pointerEvents = "none";

  scene.style.opacity = "1";
  scene.style.pointerEvents = "auto";
});
