import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================
const TELEPORT_GROUND_EYE_Y = 0.3;
const TELEPORT_UPPER_EYE_Y = 2.5;

const COLLIDER_RADIUS = 0.3;
const COLLIDER_HEIGHT = 0.6;
const COLLIDER_BOTTOM_OFFSET = -0.3;

const MOVE_SPEED_WALK = 4.0;
const MOVE_SPEED_SPRINT = 7.0;

const RAYCAST_DOWN_DISTANCE = 10.0;
const RAYCAST_UP_DISTANCE = 2.0;

const EXCLUDED_MESH_NAMES = ['Plane.002', 'Plane.005'];

// ============================================================================
// SCENE / CAMERA / RENDERER
// ============================================================================
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(-5, TELEPORT_GROUND_EYE_Y, 7);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

// REALISTIC rendering settings
renderer.shadowMap.enabled = true;
renderer.shadowMap.type= THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.35;
renderer.physicallyCorrectLights = true;
renderer.outputEncoding = THREE.sRGBEncoding;

document.body.appendChild(renderer.domElement);

// ============================================================================
// POINTER LOCK CONTROLS
// ============================================================================
const controls = new PointerLockControls(camera, renderer.domElement);
document.addEventListener("click", () => controls.lock());

// ============================================================================
// LIGHTING
// ============================================================================
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.1);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

/*
const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
dirLight.position.set(15, 50, 10);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
scene.add(dirLight);
*/

scene.add(new THREE.AmbientLight(0xffffff, 0.55));

const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
dirLight.position.set(5, 50, 10);

dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;

// SOFT SHADOWS
dirLight.shadow.radius = 4; // increase value -> softer

// Optional: widen shadow area
dirLight.shadow.camera.left = -50;
dirLight.shadow.camera.right = 50;
dirLight.shadow.camera.top = 50;
dirLight.shadow.camera.bottom = -50;
dirLight.shadow.camera.near = 1;
dirLight.shadow.camera.far = 200;

scene.add(dirLight);

// ======================
// POINT LIGHTS (INDOOR)
// ======================

const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
);

bulb.position.set(-5,0.55,7);
scene.add(bulb);

const bulbLight = new THREE.PointLight(0xffffff, 1.8, 12, 2);
bulbLight.position.copy(bulb.position);

scene.add(bulbLight);



const bulb3 = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
);

bulb3.position.set(6.16,0.55,7);
scene.add(bulb3);

const bulbLight3 = new THREE.PointLight(0xffffff, 1.8, 12, 2);
bulbLight3.position.copy(bulb3.position);
scene.add(bulbLight3);



const bulb4 = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
);

bulb4.position.set(6.16,2.85,7);
scene.add(bulb4);

const bulbLight4 = new THREE.PointLight(0xffffff, 1.8, 12, 2);
bulbLight4.position.copy(bulb4.position);
scene.add(bulbLight4);

const bulb5 = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
);

bulb5.position.set(-5,2.85,7);
scene.add(bulb5);

const bulbLight5 = new THREE.PointLight(0xffffff, 1.8, 12, 2);
bulbLight5.position.copy(bulb5.position);
scene.add(bulbLight5);











// ============================================================================
// HDRI ENVIRONMENT MAP
// ============================================================================
const rgbeLoader = new RGBELoader();
const hdrPath = new URL('../hdr/studio.exr', import.meta.url).href;

let envMap = null;

rgbeLoader.load(hdrPath, (hdrTexture) => {
  hdrTexture.mapping = THREE.EquirectangularReflectionMapping;

  scene.environment = hdrTexture;   // reflections
  scene.background = hdrTexture;    // optional background

  envMap = hdrTexture;

  console.log("HDRI loaded successfully.");
});

// ============================================================================
// ENVIRONMENT MODEL LOADING + COLLISIONS
// ============================================================================
const environmentMeshes = [];
const environmentBoxes = [];
const raycaster = new THREE.Raycaster();

const gltfLoader = new GLTFLoader();
gltfLoader.load(
  new URL('../models/new2.glb', import.meta.url).href,

  (gltf) => {
    const model = gltf.scene;

    model.traverse((child) => {
      if (child.isMesh) {

        // FIX MATERIALS FOR REALISM
        const mat = child.material;

        if (mat.map) mat.map.encoding = THREE.sRGBEncoding;
        if (mat.emissiveMap) mat.emissiveMap.encoding = THREE.sRGBEncoding;

        mat.envMap = envMap;
        mat.envMapIntensity = 1.2;
        mat.needsUpdate = true;

        child.castShadow = true;
        child.receiveShadow = true;

        if (!EXCLUDED_MESH_NAMES.includes(child.name)) {
          environmentMeshes.push(child);
        }
      }
    });

    // Precompute bounding boxes
    for (const mesh of environmentMeshes) {
      environmentBoxes.push(new THREE.Box3().setFromObject(mesh));
    }

    scene.add(model);
    console.log("Model + collisions loaded.");

  },
  undefined,
  (err) => console.error("GLB Load Error:", err)
);

// ============================================================================
// COLLISION SYSTEM
// ============================================================================
/**
 * Creates a bounding box representing the player's collider at a given position.
 * The collider is a capsule-like shape (cylinder approximation) centered vertically
 * below the camera eye position.
 * 
 * @param {THREE.Vector3} eyePosition - The camera/eye position
 * @returns {THREE.Box3} The player's collision bounding box
 */
function createPlayerCollider(eyePosition) {
  const colliderCenter = new THREE.Vector3(
    eyePosition.x,
    eyePosition.y + COLLIDER_BOTTOM_OFFSET + (COLLIDER_HEIGHT / 2),
    eyePosition.z
  );
  
  const halfSize = new THREE.Vector3(
    COLLIDER_RADIUS,
    COLLIDER_HEIGHT / 2,
    COLLIDER_RADIUS
  );
  
  return new THREE.Box3(
    colliderCenter.clone().sub(halfSize),
    colliderCenter.clone().add(halfSize)
  );
}

/**
 * Creates a horizontal-only collider (upper portion) for checking wall collisions.
 * This ignores floor contact which is expected when standing on the floor.
 * Uses only the middle-to-upper portion, well above any floor contact.
 * 
 * @param {THREE.Vector3} eyePosition - The camera/eye position
 * @returns {THREE.Box3} The horizontal collision bounding box (upper portion only)
 */
function createHorizontalCollider(eyePosition) {
  const colliderBottom = eyePosition.y + COLLIDER_BOTTOM_OFFSET;
  
  // Use only the upper 50% of the collider, starting from the middle
  // This ensures we're well above floor contact (floor is at collider bottom)
  const horizontalCheckHeight = COLLIDER_HEIGHT * 0.5;
  const horizontalCheckBottom = colliderBottom + COLLIDER_HEIGHT * 0.5;
  
  const center = new THREE.Vector3(
    eyePosition.x,
    horizontalCheckBottom + horizontalCheckHeight / 2,
    eyePosition.z
  );
  
  const halfSize = new THREE.Vector3(
    COLLIDER_RADIUS,
    horizontalCheckHeight / 2,
    COLLIDER_RADIUS
  );
  
  return new THREE.Box3(
    center.clone().sub(halfSize),
    center.clone().add(halfSize)
  );
}

/**
 * Checks if the player collider at a given position intersects with any environment mesh.
 * 
 * @param {THREE.Vector3} eyePosition - The camera/eye position to check
 * @param {boolean} horizontalOnly - If true, use raycast-based wall detection (ignores floors)
 * @returns {boolean} True if collision detected, false otherwise
 */
function checkCollision(eyePosition, horizontalOnly = false) {
  // If environment not loaded yet, allow movement
  if (environmentBoxes.length === 0 || environmentMeshes.length === 0) {
    return false;
  }
  
  // For horizontal movement, use raycast-based wall detection to avoid floor contact issues
  if (horizontalOnly) {
    // Cast rays horizontally from collider center to detect walls
    const colliderCenterY = eyePosition.y + COLLIDER_BOTTOM_OFFSET + COLLIDER_HEIGHT * 0.5;
    const rayOrigin = new THREE.Vector3(eyePosition.x, colliderCenterY, eyePosition.z);
    
    // Check 8 directions around the player
    const directions = [
      new THREE.Vector3(1, 0, 0),      // Right
      new THREE.Vector3(-1, 0, 0),     // Left
      new THREE.Vector3(0, 0, 1),      // Forward
      new THREE.Vector3(0, 0, -1),     // Backward
      new THREE.Vector3(0.707, 0, 0.707),   // Forward-right
      new THREE.Vector3(-0.707, 0, 0.707), // Forward-left
      new THREE.Vector3(0.707, 0, -0.707), // Back-right
      new THREE.Vector3(-0.707, 0, -0.707) // Back-left
    ];
    
    for (const dir of directions) {
      raycaster.set(rayOrigin, dir);
      raycaster.far = COLLIDER_RADIUS + 0.05; // Slightly more than radius for safety
      const hits = raycaster.intersectObjects(environmentMeshes, true);
      
      if (hits.length > 0) {
        const hit = hits[0];
        // Check if this is a wall (vertical surface) vs floor/ceiling (horizontal surface)
        if (hit.face) {
          const normal = hit.face.normal.clone();
          normal.transformDirection(hit.object.matrixWorld);
          const normalY = Math.abs(normal.y);
          
          // If normal is mostly horizontal (wall), it's a collision
          // Threshold of 0.5 means surface is more vertical than horizontal
          if (normalY < 0.5) {
            return true;
          }
        } else {
          // If no face normal, assume it's a wall if distance is very close
          if (hit.distance < COLLIDER_RADIUS) {
            return true;
          }
        }
      }
    }
    
    return false;
  }
  
  // For vertical checks, use bounding box intersection
  const playerBox = createPlayerCollider(eyePosition);
  
  for (const envBox of environmentBoxes) {
    if (playerBox.intersectsBox(envBox)) {
      return true;
    }
  }
  
  return false;
}

// ============================================================================
// RAYCAST SYSTEM
// ============================================================================

/**
 * Performs a downward raycast from the eye position to detect the floor.
 * 
 * @param {THREE.Vector3} eyePosition - Starting position (camera/eye)
 * @returns {THREE.Intersection|null} The closest floor intersection, or null if none found
 */
function raycastFloor(eyePosition) {
  raycaster.set(
    eyePosition,
    new THREE.Vector3(0, -1, 0)
  );
  raycaster.far = RAYCAST_DOWN_DISTANCE;
  
  const intersections = raycaster.intersectObjects(environmentMeshes, true);
  return intersections.length > 0 ? intersections[0] : null;
}

/**
 * Performs an upward raycast from the eye position to detect the ceiling.
 * 
 * @param {THREE.Vector3} eyePosition - Starting position (camera/eye)
 * @returns {THREE.Intersection|null} The closest ceiling intersection, or null if none found
 */
function raycastCeiling(eyePosition) {
  raycaster.set(
    eyePosition,
    new THREE.Vector3(0, 1, 0)
  );
  raycaster.far = RAYCAST_UP_DISTANCE;
  
  const intersections = raycaster.intersectObjects(environmentMeshes, true);
  return intersections.length > 0 ? intersections[0] : null;
}


// ============================================================================
// MOVEMENT SYSTEM
// ============================================================================
const movementKeys = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  sprint: false
};

document.addEventListener("keydown", (event) => {
  switch (event.code) {
    case "KeyW":
      movementKeys.forward = true;
      break;
    case "KeyS":
      movementKeys.backward = true;
      break;
    case "KeyA":
      movementKeys.left = true;
      break;
    case "KeyD":
      movementKeys.right = true;
      break;
    case "ShiftLeft":
    case "ShiftRight":
      movementKeys.sprint = true;
      break;
    case "KeyG":
      // Teleport to ground floor eye height
      camera.position.y = TELEPORT_GROUND_EYE_Y;
      console.log(`Teleported to ground floor eye height: ${TELEPORT_GROUND_EYE_Y}`);
      break;
    case "KeyU":
      // Teleport to upper floor eye height
      camera.position.y = TELEPORT_UPPER_EYE_Y;
      console.log(`Teleported to upper floor eye height: ${TELEPORT_UPPER_EYE_Y}`);
      break;
    case "KeyP":
      // Debug: print camera position
      console.log(`Camera Position: X=${camera.position.x.toFixed(3)}, Y=${camera.position.y.toFixed(3)}, Z=${camera.position.z.toFixed(3)}`);
      break;
  }
});

document.addEventListener("keyup", (event) => {
  switch (event.code) {
    case "KeyW":
      movementKeys.forward = false;
      break;
    case "KeyS":
      movementKeys.backward = false;
      break;
    case "KeyA":
      movementKeys.left = false;
      break;
    case "KeyD":
      movementKeys.right = false;
      break;
    case "ShiftLeft":
    case "ShiftRight":
      movementKeys.sprint = false;
      break;
  }
});



// ============================================================================
// MOVEMENT SYSTEM
// ============================================================================

/**
 * Attempts to move the camera horizontally, checking for collisions.
 * Uses sliding collision response: if diagonal movement hits a wall,
 * tries to slide along one axis at a time.
 * 
 * @param {THREE.Vector3} proposedPosition - The desired new position
 * @returns {boolean} True if movement was successful (at least partially)
 */
function tryHorizontalMovement(proposedPosition) {
  // Try full movement first (ignore floor contact for horizontal movement)
  if (!checkCollision(proposedPosition, true)) {
    camera.position.copy(proposedPosition);
    return true;
  }
  
  // Try X-axis only
  const tryX = new THREE.Vector3(proposedPosition.x, camera.position.y, camera.position.z);
  if (!checkCollision(tryX, true)) {
    camera.position.copy(tryX);
    return true;
  }
  
  // Try Z-axis only
  const tryZ = new THREE.Vector3(camera.position.x, camera.position.y, proposedPosition.z);
  if (!checkCollision(tryZ, true)) {
    camera.position.copy(tryZ);
    return true;
  }
  
  // Movement blocked in all directions
  return false;
}

/**
 * Updates camera position based on WASD input and camera orientation.
 * Movement is relative to camera's forward/right vectors, working at any Y position.
 */
function updateMovement(deltaTime) {
  if (!controls.isLocked) return;
  
  // Get camera's forward direction (horizontal only)
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();
  
  // Get camera's right direction
  const right = new THREE.Vector3();
  right.crossVectors(forward, new THREE.Vector3(0, 1, 0));
  right.normalize();
  
  // Build movement vector from input
  const moveDirection = new THREE.Vector3();
  if (movementKeys.forward) moveDirection.add(forward);
  if (movementKeys.backward) moveDirection.sub(forward);
  if (movementKeys.left) moveDirection.sub(right);
  if (movementKeys.right) moveDirection.add(right);
  
  // Normalize and apply speed
  if (moveDirection.lengthSq() > 0) {
    moveDirection.normalize();
    const speed = movementKeys.sprint ? MOVE_SPEED_SPRINT : MOVE_SPEED_WALK;
    const moveDistance = speed * deltaTime;
    
    const proposedPosition = camera.position.clone();
    proposedPosition.add(moveDirection.multiplyScalar(moveDistance));
    
    tryHorizontalMovement(proposedPosition);
  }
}

// ============================================================================
// VERTICAL COLLISION AND FLOOR DETECTION
// ============================================================================

/**
 * Handles vertical collision detection and prevents falling through floors.
 * Uses raycasting to detect floors and ceilings, and collider checks for walls.
 */
function updateVerticalCollision() {
  const currentEyeY = camera.position.y;
  
  // Check for floor below using raycast
  const floorHit = raycastFloor(camera.position);
  
  if (floorHit) {
    const floorY = floorHit.point.y;
    const colliderBottom = currentEyeY + COLLIDER_BOTTOM_OFFSET;
    
    // If collider bottom would penetrate the floor, push camera up
    if (colliderBottom <= floorY) {
      const requiredEyeY = floorY - COLLIDER_BOTTOM_OFFSET;
      const testPosition = camera.position.clone();
      testPosition.y = requiredEyeY;
      
      // Only adjust if it doesn't cause a collision
      if (!checkCollision(testPosition)) {
        camera.position.y = requiredEyeY;
      }
    }
  }
  
  // Check for ceiling above using raycast
  const ceilingHit = raycastCeiling(camera.position);
  
  if (ceilingHit) {
    const ceilingY = ceilingHit.point.y;
    const colliderTop = currentEyeY + COLLIDER_BOTTOM_OFFSET + COLLIDER_HEIGHT;
    
    // If collider top would penetrate the ceiling, push camera down
    if (colliderTop >= ceilingY) {
      const requiredEyeY = ceilingY - COLLIDER_BOTTOM_OFFSET - COLLIDER_HEIGHT;
      const testPosition = camera.position.clone();
      testPosition.y = requiredEyeY;
      
      // Only adjust if it doesn't cause a collision
      if (!checkCollision(testPosition)) {
        camera.position.y = requiredEyeY;
      }
    }
  }
  
  // Final check: ensure current position doesn't intersect environment (vertical check only)
  // Use full collider check, not horizontal-only
  if (checkCollision(camera.position, false)) {
    // If we're intersecting, try to resolve by moving up slightly
    const testUp = camera.position.clone();
    testUp.y += 0.1;
    if (!checkCollision(testUp, false)) {
      camera.position.y = testUp.y;
    }
  }
}


// ============================================================================
// CAMERA POSITION DISPLAY
// ============================================================================
const coordDisplay = document.createElement('div');
coordDisplay.style.position = 'fixed';
coordDisplay.style.bottom = '10px';
coordDisplay.style.left = '10px';
coordDisplay.style.color = 'white';
coordDisplay.style.background = 'rgba(0, 0, 0, 0.6)';
coordDisplay.style.padding = '8px 12px';
coordDisplay.style.fontFamily = 'monospace';
coordDisplay.style.fontSize = '13px';
coordDisplay.style.borderRadius = '5px';
coordDisplay.style.zIndex = '1000';
document.body.appendChild(coordDisplay);

function updateCoordDisplay() {
    coordDisplay.innerHTML =
        `X: ${camera.position.x.toFixed(2)}<br>` +
        `Y: ${camera.position.y.toFixed(2)}<br>` +
        `Z: ${camera.position.z.toFixed(2)}`;
}



// ============================================================================
// MAIN ANIMATION LOOP
// ============================================================================

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  
  const deltaTime = Math.min(clock.getDelta(), 0.05); // Cap delta time for stability
  
  // Update movement (WASD)
  updateMovement(deltaTime);
  
  // Update vertical collision detection
  updateVerticalCollision();

  updateCoordDisplay();

  
  // Render scene
  renderer.render(scene, camera);
}

animate();

// ============================================================================
// WINDOW RESIZE HANDLER
// ============================================================================

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ============================================================================
// UI INSTRUCTIONS
// ============================================================================

const instructions = document.createElement('div');
instructions.style.position = 'fixed';
instructions.style.top = '10px';
instructions.style.left = '10px';
instructions.style.color = 'white';
instructions.style.background = 'rgba(0, 0, 0, 0.7)';
instructions.style.padding = '15px';
instructions.style.fontFamily = 'monospace';
instructions.style.fontSize = '14px';
instructions.style.borderRadius = '5px';
instructions.style.zIndex = '1000';
instructions.innerHTML = `
  <b>FPS Controller Controls:</b><br>
  <b>Movement:</b><br>
  &nbsp;&nbsp;WASD - Move<br>
  &nbsp;&nbsp;Shift - Sprint<br>
  <b>Teleportation:</b><br>
  &nbsp;&nbsp;G - Ground Floor (Y = ${TELEPORT_GROUND_EYE_Y})<br>
  &nbsp;&nbsp;U - Upper Floor (Y = ${TELEPORT_UPPER_EYE_Y})<br>
  <b>Debug:</b><br>
  &nbsp;&nbsp;P - Print Camera Position<br>
  <br>
  <i>Click to lock pointer and start</i>
`;
document.body.appendChild(instructions);