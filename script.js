const sphere = document.getElementById("sphere");
const photos = document.querySelectorAll(".photo");

/* ROTATION STATE */
let rotX = 0, rotY = 0;
let targetRotX = 0, targetRotY = 0;
let isDragging = false;
let lastX = 0, lastY = 0;

const autoRotateSpeed = 0.15;
const sphereRadius = 900;

/* DISTRIBUTE PHOTOS ON SPHERE */
const positions = [];
const total = photos.length;

photos.forEach((photo, i) => {
  const phi = Math.acos(1 - 2 * (i + 0.5) / total);
  const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);

  const x = sphereRadius * Math.sin(phi) * Math.cos(theta);
  const y = sphereRadius * Math.cos(phi);
  const z = sphereRadius * Math.sin(phi) * Math.sin(theta);

  positions.push({ x, y, z: -z });
});

/* ANIMATION LOOP */
function animate() {
  if (!isDragging) targetRotY += autoRotateSpeed;

  rotX += (targetRotX - rotX) * 0.08;
  rotY += (targetRotY - rotY) * 0.08;

  /* Rotate the sphere */
  sphere.style.transform = `
    rotateX(${rotX}deg)
    rotateY(${rotY}deg)
  `;

  /* Position photos */
  photos.forEach((photo, i) => {
    const { x, y, z } = positions[i];

    photo.style.transform = `
      translate3d(${x}px, ${y}px, ${z}px)
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
window.addEventListener("mouseleave", () => isDragging = false);
window.addEventListener("mousemove", e => {
  if (!isDragging) return;
  targetRotY += (e.clientX - lastX) * 0.25;
  targetRotX -= (e.clientY - lastY) * 0.25;
  lastX = e.clientX;
  lastY = e.clientY;
});

/* PREVENT IMAGE DRAG */
photos.forEach(p => p.ondragstart = e => e.preventDefault());
document.body.style.userSelect = "none";
