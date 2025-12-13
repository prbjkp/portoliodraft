const items = document.querySelectorAll(".item");
const radius = 350;
const centerX = window.innerWidth / 2;
const centerY = window.innerHeight / 2;

items.forEach((item, index) => {
  const angle = (index / items.length) * Math.PI * 2;

  const x = centerX + radius * Math.cos(angle) - item.offsetWidth / 2;
  const y = centerY + radius * Math.sin(angle) - item.offsetHeight / 2;

  item.style.left = `${x}px`;
  item.style.top = `${y}px`;
});
item.addEventListener("click", () => {
  item.style.transform = "scale(2)";
});
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
if (closeBtn) {
  closeBtn.addEventListener("click", closeImage);
}


document.querySelectorAll(".item img").forEach(img => {
  img.addEventListener("click", () => {
    lightboxImg.src = img.src;
    lightbox.classList.add("show");
  });
});

closeBtn.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});

function closeLightbox() {
  lightbox.classList.remove("show");
}
const overlay = document.getElementById("overlay");
const closeBtn = document.getElementById("overlay-close");

let activeClone = null;
let originRect = null;

document.querySelectorAll(".item img").forEach(img => {
  img.addEventListener("click", () => openImage(img));
});

function openImage(img) {
  originRect = img.getBoundingClientRect();

  // Create clone
  activeClone = img.cloneNode(true);
  activeClone.classList.add("zoom-clone");

  // Set start position
  activeClone.style.top = `${originRect.top}px`;
  activeClone.style.left = `${originRect.left}px`;
  activeClone.style.width = `${originRect.width}px`;
  activeClone.style.height = `${originRect.height}px`;

  document.body.appendChild(activeClone);

  // Force reflow
  activeClone.getBoundingClientRect();

  // Target size (centered)
  const targetWidth = window.innerWidth * 0.85;
  const targetHeight = window.innerHeight * 0.85;

  const aspect = originRect.width / originRect.height;
  let finalWidth = targetWidth;
  let finalHeight = targetWidth / aspect;

  if (finalHeight > targetHeight) {
    finalHeight = targetHeight;
    finalWidth = targetHeight * aspect;
  }

  activeClone.style.top = `${(window.innerHeight - finalHeight) / 2}px`;
  activeClone.style.left = `${(window.innerWidth - finalWidth) / 2}px`;
  activeClone.style.width = `${finalWidth}px`;
  activeClone.style.height = `${finalHeight}px`;

  overlay.classList.add("show");
}

function closeImage() {
  if (!activeClone) return;

  // Animate back
  activeClone.style.top = `${originRect.top}px`;
  activeClone.style.left = `${originRect.left}px`;
  activeClone.style.width = `${originRect.width}px`;
  activeClone.style.height = `${originRect.height}px`;

  overlay.classList.remove("show");

  activeClone.addEventListener(
    "transitionend",
    () => {
      activeClone.remove();
      activeClone = null;
    },
    { once: true }
  );
}

closeBtn.addEventListener("click", closeImage);
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) closeImage();
});
