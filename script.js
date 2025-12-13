document.addEventListener("DOMContentLoaded", () => {

  /* ===== ORBIT LAYOUT ===== */
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

  /* ===== SHARED ELEMENT ZOOM ===== */
  const overlay = document.getElementById("overlay");
  const closeBtn = document.getElementById("overlay-close");

  let activeClone = null;
  let originRect = null;

  document.querySelectorAll(".item img").forEach(img => {
    img.addEventListener("click", () => openImage(img));
  });

  function openImage(img) {
    originRect = img.getBoundingClientRect();

    activeClone = img.cloneNode(true);
    activeClone.classList.add("zoom-clone");

    activeClone.style.top = `${originRect.top}px`;
    activeClone.style.left = `${originRect.left}px`;
    activeClone.style.width = `${originRect.width}px`;
    activeClone.style.height = `${originRect.height}px`;

    document.body.appendChild(activeClone);
    activeClone.getBoundingClientRect(); // force reflow

    const maxW = window.innerWidth * 0.85;
    const maxH = window.innerHeight * 0.85;
    const aspect = originRect.width / originRect.height;

    let finalW = maxW;
    let finalH = maxW / aspect;

    if (finalH > maxH) {
      finalH = maxH;
      finalW = maxH * aspect;
    }

    activeClone.style.top = `${(window.innerHeight - finalH) / 2}px`;
    activeClone.style.left = `${(window.innerWidth - finalW) / 2}px`;
    activeClone.style.width = `${finalW}px`;
    activeClone.style.height = `${finalH}px`;

    overlay.classList.add("show");
  }

  function closeImage() {
    if (!activeClone) return;

    activeClone.style.top = `${originRect.top}px`;
    activeClone.style.left = `${originRect.left}px`;
    activeClone.style.width = `${originRect.width}px`;
    activeClone.style.height = `${originRect.height}px`;

    overlay.classList.remove("show");

    activeClone.addEventListener("transitionend", () => {
      activeClone.remove();
      activeClone = null;
    }, { once: true });
  }

  closeBtn.addEventListener("click", closeImage);
  overlay.addEventListener("click", e => {
    if (e.target === overlay) closeImage();
  });

});
