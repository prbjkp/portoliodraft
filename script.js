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
let isDragging=false, lastX=0, lastY=0;
const autoRotateSpeed = 0.04;
let sphereRadius = 360; // will be computed based on `#sphere` size
const positions = [];

function computePositions(){
  // compute a radius that fits inside the #sphere element, leaving room
  // for photo size so images form a shell around the center sphere.
  const padding = 160; // leave space from the edge and center sphere
  const maxRadius = Math.min(sphere.clientWidth, sphere.clientHeight) / 2 - padding;
  sphereRadius = Math.max(180, maxRadius);
  positions.length = 0;
  photos.forEach((photo,i)=>{
    const total = photos.length;
    const phi = Math.acos(1 - 2*(i+0.5)/total);
    const theta = Math.PI*(1+Math.sqrt(5))*(i+0.5);
    const x = sphereRadius*Math.sin(phi)*Math.cos(theta);
    const y = sphereRadius*Math.cos(phi);
    const z = sphereRadius*Math.sin(phi)*Math.sin(theta);
    positions.push({x, y, z: -z}); // face inward
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
  sphere.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  // Keep the center sphere facing the camera by counter-rotating it
  if (centerSphere) {
    centerSphere.style.transform = `translate(-50%, -50%) rotateX(${-rotX}deg) rotateY(${-rotY}deg)`;
    // Update lighting position so the highlight follows rotation, making
    // the sphere look solid and 3D. Values are percentages for the CSS vars.
    const lightX = 50 + (rotY / 360) * 40; // shift with horizontal rotation
    const lightY = 50 - (rotX / 360) * 40; // shift with vertical rotation
    centerSphere.style.setProperty('--light-x', `${lightX}%`);
    centerSphere.style.setProperty('--light-y', `${lightY}%`);
  }
  photos.forEach((photo,i)=>{
    const pos=positions[i];
    const dx=-pos.x, dy=-pos.y, dz=-pos.z;
    // Rotate the direction vector by the sphere's current rotation to get
    // the vector in world space, then compute the world-space angles to
    // the center. Subtract the parent rotation so the child's local
    // rotation cancels the parent's rotation and the photo faces the
    // center sphere in world space.
    const toRad = Math.PI/180;
    const rx = rotX*toRad, ry = rotY*toRad;
    // apply rotateX then rotateY (same order as the sphere transform)
    const y1 = dy*Math.cos(rx) - dz*Math.sin(rx);
    const z1 = dy*Math.sin(rx) + dz*Math.cos(rx);
    const x2 = dx*Math.cos(ry) + z1*Math.sin(ry);
    const z2 = -dx*Math.sin(ry) + z1*Math.cos(ry);
    const worldX = x2, worldY = y1, worldZ = z2;
    const angleYWorld = Math.atan2(worldX, worldZ)*(180/Math.PI);
    const sinX = Math.max(-1, Math.min(1, worldY / sphereRadius));
    const angleXWorld = Math.asin(sinX)*(180/Math.PI);
    const localRotY = angleYWorld - rotY;
    const localRotX = angleXWorld - rotX;
    photo.style.transform = `translate3d(${pos.x}px, ${pos.y}px, ${pos.z}px) rotateY(${localRotY}deg) rotateX(${localRotX}deg)`;
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
