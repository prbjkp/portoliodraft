const sphere = document.getElementById("sphere");
const photos = document.querySelectorAll(".photo");

const radius = 350;
const total = photos.length;

photos.forEach((photo, i) => {
  const phi = Math.acos(-1 + (2 * i) / total);
  const theta = Math.sqrt(total * Math.PI) * phi;

  const x = radius * Math.cos(theta) * Math.sin(phi);
  const y = radius * Math.sin(theta) * Math.sin(phi);
  const z = radius * Math.cos(phi);

  photo.style.transform = `
    translate3d(${x}px, ${y}px, ${z}px)
  `;
});

let rotX = 0;
let rotY = 0;
let dragging = false;
let lastX = 0;
let lastY = 0;

window.addEventListener("mousedown", e => {
  dragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
});

window.addEventListener("mouseup", () => dragging = false);

window.addEventListener("mousemove", e => {
  if (!dragging) return;
  rotY += (e.clientX - lastX) * 0.3;
  rotX -= (e.clientY - lastY) * 0.3;

  sphere.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;

  lastX = e.clientX;
  lastY = e.clientY;
});

const startContainer = document.getElementById("start-container");
const scene = document.getElementById("scene");

startContainer.addEventListener("click", () => {
  startContainer.style.opacity = "0";
  startContainer.style.pointerEvents = "none";
  scene.style.opacity = "1";
  scene.style.pointerEvents = "auto";
});
