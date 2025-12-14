/**********************************************************
* VARIABLES
**********************************************************/
const sphere = document.getElementById("sphere");
const photos = document.querySelectorAll(".photo");
const startContainer = document.getElementById("start-container");
const scene = document.getElementById("scene");
const textRing = document.getElementById("start-text-ring");
const letters = textRing.querySelectorAll("span");
const overlay = document.getElementById("overlay");
const overlayClose = document.getElementById("overlay-close");

let rotX=0, rotY=0, targetRotX=0, targetRotY=0;
let isDragging=false, lastX=0, lastY=0;
const autoRotateSpeed = 0.02;
const sphereRadius = 1200;
const positions = [];

/**********************************************************
* DISTRIBUTE START TEXT
**********************************************************/
const textRadius = 110;
letters.forEach((letter,i)=>{
  const angle = (360/letters.length)*i;
  letter.style.transform = `rotateY(${angle}deg) translateZ(${textRadius}px)`;
});

/**********************************************************
* DISTRIBUTE PHOTOS INSIDE SPHERE
**********************************************************/
photos.forEach((photo,i)=>{
  const total = photos.length;
  const phi = Math.acos(1 - 2*(i+0.5)/total);
  const theta = Math.PI*(1+Math.sqrt(5))*(i+0.5);
  const x = sphereRadius*Math.sin(phi)*Math.cos(theta);
  const y = sphereRadius*Math.cos(phi);
  const z = sphereRadius*Math.sin(phi)*Math.sin(theta);
  positions.push({x, y, z: -z}); // face inward
});

/**********************************************************
* ANIMATION LOOP
**********************************************************/
function animateSphere(){
  if(!isDragging) targetRotY+=autoRotateSpeed;
  rotX += (targetRotX - rotX)*0.1;
  rotY += (targetRotY - rotY)*0.1;
  sphere.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(1200px)`;
  photos.forEach((photo,i)=>{
    const pos=positions[i];
    const dx=-pos.x, dy=-pos.y, dz=-pos.z;
    const rotYtoCenter = Math.atan2(dx,dz)*(180/Math.PI);
    const rotXtoCenter = Math.asin(dy/sphereRadius)*(180/Math.PI);
    photo.style.transform = `translate3d(${pos.x}px, ${pos.y}px, ${pos.z}px) rotateY(${rotYtoCenter}deg) rotateX(${rotXtoCenter}deg)`;
  });
  requestAnimationFrame(animateSphere);
}
animateSphere();

/**********************************************************
* DRAG CONTROLS
**********************************************************/
window.addEventListener("mousedown", e=>{ isDragging=true; lastX=e.clientX; lastY=e.clientY; });
window.addEventListener("mouseup", ()=>{ isDragging=false; });
window.addEventListener("mouseleave", ()=>{ isDragging=false; });
window.addEventListener("mousemove", e=>{
  if(!isDragging) return;
  targetRotY += (e.clientX - lastX)*0.3;
  targetRotX -= (e.clientY - lastY)*0.3;
  lastX=e.clientX; lastY=e.clientY;
});

/**********************************************************
* PREVENT IMAGE SELECTION
**********************************************************/
photos.forEach(p=>p.ondragstart=e=>e.preventDefault());
document.body.style.userSelect="none";

/**********************************************************
* START SCREEN
**********************************************************/
startContainer.addEventListener("click", ()=>{
  startContainer.style.opacity="0";
  startContainer.style.pointerEvents="none";
  scene.style.opacity="1";
  scene.style.pointerEvents="auto";
});

/**********************************************************
* IMAGE ZOOM
**********************************************************/
photos.forEach(photo=>{
  photo.addEventListener("click", ()=>{
    const imgSrc = photo.querySelector("img").src;
    overlay.innerHTML = `<button id="overlay-close">✕</button><img src="${imgSrc}">`;
    overlay.style.display="flex";
    requestAnimationFrame(()=>{ overlay.style.opacity="1"; overlay.style.pointerEvents="auto"; });
    document.getElementById("overlay-close").addEventListener("click", closeOverlay);
  });
});
function closeOverlay() {
  overlay.style.opacity="0"; overlay.style.pointerEvents="none";
}
window.addEventListener("keydown", e=>{ if(e.key==="Escape") closeOverlay(); });
