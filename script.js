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
const centerSphere = document.getElementById("center-sphere");

let rotX=0, rotY=0, targetRotX=0, targetRotY=0;
const toRad = Math.PI/180;
let isDragging=false, lastX=0, lastY=0;
const autoRotateSpeed = 0.03; // reduced ~25% for slower auto-rotation
let sphereRadius = 360; // will be computed based on `#sphere` size
const positions = [];

function computePositions(){
  // compute a radius that fits inside the #sphere element and guarantees
  // the photos sit outside the center sphere (so they form a surrounding
  // shell). We compute an inner minimum radius based on the center
  // sphere size and a max radius from the container size, then pick
  // the larger of those so the outer photos actually surround the
  // center object.
  const marginFromEdge = 20; // reduce margin so we can expand further
  const containerRadius = Math.min(sphere.clientWidth, sphere.clientHeight) / 2 - marginFromEdge;
  const centerRadius = centerSphere ? (centerSphere.offsetWidth || 220) / 2 : 110;
  // place photos so their centers sit outside the center sphere surface
  // and a bit further back; apply a larger spread so the shell fully
  // encompasses the center sphere and feels more roomy.
  const photoHalf = photos[0] ? Math.max(photos[0].offsetWidth, photos[0].offsetHeight) / 2 : 90;
  const extraGap = 600; // push photos much further from the center sphere
  const spreadScale = 2.2; // scale positions outward more to spread them
  const desiredRadius = centerRadius + photoHalf + extraGap;
  // apply spread before clamping so we get a roomy shell, then clamp
  const spacedRadius = desiredRadius * spreadScale;
  // ensure final radius is well outside the center sphere so the
  // viewer (at the origin) is inside the photo shell. Pick a large
  // minimum outer radius to guarantee the perspective sits inside
  // the sphere even on large screens.
  const minOuterRadius = 3200;
  sphereRadius = Math.max(spacedRadius, centerRadius + photoHalf + 20, minOuterRadius);
  positions.length = 0;
  photos.forEach((photo,i)=>{
    const total = photos.length;
    const phi = Math.acos(1 - 2*(i+0.5)/total);
    const theta = Math.PI*(1+Math.sqrt(5))*(i+0.5);
    const x = sphereRadius*Math.sin(phi)*Math.cos(theta);
    const y = sphereRadius*Math.cos(phi);
    const z = sphereRadius*Math.sin(phi)*Math.sin(theta);
    // store negative z so images face inward toward the center sphere
    positions.push({x, y, z: -z});
  });
}

// initialize positions now
computePositions();
window.addEventListener('resize', computePositions);

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
// photos positions are computed in `computePositions()` (called below)

/**********************************************************
* ANIMATION LOOP
**********************************************************/
function animateSphere(){
  if(!isDragging) targetRotY+=autoRotateSpeed;
  rotX += (targetRotX - rotX)*0.1;
  rotY += (targetRotY - rotY)*0.1;
  // Rotate the outer sphere container so the whole shell moves
  sphere.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  // Keep the center sphere visually locked to the viewport by
  // counter-rotating it (inverse rotations in Y then X order).
  if (centerSphere) {
    centerSphere.style.transform = `translate(-50%, -50%) rotateY(${-rotY}deg) rotateX(${-rotX}deg)`;
    const lightX = 50 + Math.sin(rotY*toRad) * 30;
    const lightY = 50 - Math.sin(rotX*toRad) * 30;
    centerSphere.style.setProperty('--light-x', `${lightX}%`);
    centerSphere.style.setProperty('--light-y', `${lightY}%`);
  }
  photos.forEach((photo,i)=>{
    const pos=positions[i];
    const dx=-pos.x, dy=-pos.y, dz=-pos.z;
    // Compute the angles to the center in the photo's local/base space
    // then subtract the parent's rotation so the photo's local rotation
    // cancels the parent's rotation and the image points at the center
    // sphere while the outer shell rotates.
    // Billboard: cancel the parent's rotation so each image faces the camera
    // regardless of the outer sphere rotation. Apply translation first
    // (position in the rotated parent), then rotate by the inverse of
    // the parent's rotation to align with the viewport.
    photo.style.transform = `translate(-50%,-50%) translate3d(${pos.x}px, ${pos.y}px, ${pos.z}px) rotateY(${-rotY}deg) rotateX(${-rotX}deg)`;
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
  // Inverted controls: moving cursor left should rotate scene right
  const deltaX = e.clientX - lastX;
  const deltaY = e.clientY - lastY;
  targetRotY -= deltaX * 0.3; // invert horizontal
  targetRotX += deltaY * 0.3; // invert vertical
  lastX = e.clientX; lastY = e.clientY;
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
  textRing.style.opacity="0";
  textRing.style.pointerEvents="none";
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
