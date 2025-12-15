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

// ---- FERROFLUID (metaballs) for center sphere -----------------
let ferroCanvas, ferroCtx, ferroBlobs = [], ferroAnimId;
function initFerro() {
  if (!centerSphere) return;
  // create canvas if not exists
  ferroCanvas = centerSphere.querySelector('canvas.ferro') || document.createElement('canvas');
  ferroCanvas.classList.add('ferro');
  ferroCanvas.style.width = '100%'; ferroCanvas.style.height = '100%';
  ferroCanvas.width = centerSphere.offsetWidth * devicePixelRatio;
  ferroCanvas.height = centerSphere.offsetHeight * devicePixelRatio;
  ferroCanvas.style.width = centerSphere.offsetWidth + 'px';
  ferroCanvas.style.height = centerSphere.offsetHeight + 'px';
  ferroCanvas.style.display = 'block';
  ferroCanvas.style.borderRadius = '50%';
  ferroCanvas.style.position = 'absolute';
  ferroCanvas.style.left = '0'; ferroCanvas.style.top = '0';
  ferroCanvas.style.pointerEvents = 'none';
  if (!centerSphere.contains(ferroCanvas)) centerSphere.appendChild(ferroCanvas);
  ferroCtx = ferroCanvas.getContext('2d');
  // create blobs sized relative to center sphere
  const w = ferroCanvas.width, h = ferroCanvas.height;
  ferroBlobs = [];
  const baseR = Math.min(w,h) * 0.12;
  const count = 7;
  for (let i=0;i<count;i++){
    ferroBlobs.push({
      ox: (w/2) + (Math.cos(i)*0.15*w),
      oy: (h/2) + (Math.sin(i)*0.15*h),
      r: baseR * (0.7 + Math.random()*0.8),
      phase: Math.random()*Math.PI*2,
      speed: 0.3 + Math.random()*0.6
    });
  }
  if (!ferroAnimId) animateFerro();
}

function resizeFerro(){
  if(!ferroCanvas || !centerSphere) return;
  ferroCanvas.width = centerSphere.offsetWidth * devicePixelRatio;
  ferroCanvas.height = centerSphere.offsetHeight * devicePixelRatio;
  ferroCanvas.style.width = centerSphere.offsetWidth + 'px';
  ferroCanvas.style.height = centerSphere.offsetHeight + 'px';
  // recompute base radii
  const baseR = Math.min(ferroCanvas.width, ferroCanvas.height) * 0.12;
  ferroBlobs.forEach((b,i)=>{ b.r = baseR * (0.7 + (i%2)*0.2); });
}

function animateFerro(){
  if(!ferroCtx) return;
  const ctx = ferroCtx; const w = ferroCanvas.width; const h = ferroCanvas.height;
  ctx.clearRect(0,0,w,h);
  ctx.save();
  ctx.scale(devicePixelRatio, devicePixelRatio);
  // draw blurred white circles (metaballs)
  ctx.globalCompositeOperation = 'lighter';
  ctx.filter = 'blur(20px)';
  ferroBlobs.forEach((b, i)=>{
    const t = performance.now()/1000;
    const ox = (b.ox/ devicePixelRatio) + Math.cos(t*b.speed + b.phase)* (20 + i*6) + (rotY*0.02);
    const oy = (b.oy/ devicePixelRatio) + Math.sin(t*b.speed + b.phase)* (18 + i*4) + (rotX*0.02);
    const grad = ctx.createRadialGradient(ox, oy, b.r*0.1, ox, oy, b.r);
    grad.addColorStop(0, 'rgba(255,255,255,0.95)');
    grad.addColorStop(0.4, 'rgba(200,200,200,0.6)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(ox, oy, b.r, 0, Math.PI*2);
    ctx.fill();
  });
  ctx.filter = 'none';
  ctx.restore();
  ferroAnimId = requestAnimationFrame(animateFerro);
}

window.addEventListener('resize', ()=>{ resizeFerro(); });
// init after DOM read
setTimeout(()=>{ try{ initFerro(); }catch(e){} }, 100);

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
photos.forEach((photo, i) => {
  const pos = positions[i];

  // Push portrait images slightly farther back
  const depthOffset = photo.classList.contains("portrait") ? -120 : 0;

  photo.style.transform =
    `translate(-50%,-50%)
     translate3d(${pos.x}px, ${pos.y}px, ${pos.z + depthOffset}px)
     rotateY(${-rotY}deg)
     rotateX(${-rotX}deg)`;
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
/**********************************************************
* IMAGE ORIENTATION DETECTION
**********************************************************/
photos.forEach(photo => {
  const img = photo.querySelector("img");

  if (img.complete) {
    applyOrientation(photo, img);
  } else {
    img.addEventListener("load", () => applyOrientation(photo, img));
  }
});

function applyOrientation(photo, img) {
  const isPortrait = img.naturalHeight > img.naturalWidth;
  photo.classList.toggle("portrait", isPortrait);
}

