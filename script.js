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
