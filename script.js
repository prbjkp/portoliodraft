const world = document.getElementById("world");
const sphere = document.getElementById("sphere");
const photos = document.querySelectorAll(".photo");

/* ROTATION STATE */
let rotX = 0, rotY = 0;
let targetRotX = 0, targetRotY = 0;
let isDragging = false;
let lastX = 0, lastY = 0;
const autoRotateSpeed = 0.03;

const sphereRadius = 1200;
const positions = [];

/* DISTRIBUTE TEXT */
document.querySelectorAll("#start-text-ring span").forEach((letter, i, arr) => {
  const angle = (360 / arr.length) * i;
  letter.style.transform = `rotateY(${angle}deg) translateZ(110px)`;
});

/* DISTRIBUTE PHOTOS INSIDE SPHERE */
photos.forEach((photo, i) => {
  const total = photos.length;
  const phi = Math.acos(1 - 2 * (i + 0.5) / total);
  const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);

  const x = sphereRadius * Math.sin(phi) * Math.cos(theta);
  const y = sphereRadius * Math.cos(phi);
  const z = -sphereRadius * Math.sin(phi) * Math.sin(theta);

  positions.push({ x, y, z });
});

/* ANIMATION LOOP */
function animate() {
  if (!isDragging) targetRotY += autoRotateSpeed;

  rotX += (targetRotX - rotX) * 0.1;
  rotY += (targetRotY - rotY) * 0.1;

  world.style.transform = `
    translate(-50%, -50%)
    rotateX(${rotX}deg)
    rotateY(${rotY}deg)
  `;

  photos.forEach((photo, i) => {
    const { x, y, z } = positions[i];

    const ry = Math.atan2(x, z) * 180 / Math.PI;
    const rx = Math.asin(y / sphereRadius) * 180 / Math.PI;

    photo.style.transform = `
      translate3d(${x}px, ${y}px, ${z}px)
      rotateY(${ry}deg)
      rotateX(${rx}deg)
    `;
  });

  requestAnimationFrame(animate);
}
animate();

/* DRAG CONTROLS */
window.addEventListener("mousedown", e => {
  isDragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
});

window.addEventListener("mouseup", () => isDragging = false);
window.addEventListener("mousemove", e => {
  if (!isDragging) return;

  targetRotY += (e.clientX - lastX) * 0.3;
  targetRotX -= (e.clientY - lastY) * 0.3;

  lastX = e.clientX;
  lastY = e.clientY;
});

/* IMAGE ZOOM */
const overlay = document.getElementById("overlay");

photos.forEach(photo => {
  photo.onclick = () => {
    overlay.innerHTML = `
      <button id="overlay-close">✕</button>
      <img src="${photo.querySelector("img").src}" style="
        max-width:90%;
        max-height:90%;
        transform: scale(0);
        animation: zoomIn 0.4s forwards;
      ">
    `;
    overlay.style.display = "flex";
    requestAnimationFrame(() => overlay.style.opacity = "1");

    document.getElementById("overlay-close").onclick = () => {
      overlay.style.opacity = "0";
      setTimeout(() => overlay.style.display = "none", 300);
    };
  };
});

/* ZOOM KEYFRAMES */
const style = document.createElement("style");
style.innerHTML = `@keyframes zoomIn { to { transform: scale(1); } }`;
document.head.appendChild(style);
