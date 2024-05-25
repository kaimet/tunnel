const backgroundColor = 0xaaaeb6;
const collisionColor = 0xff0000;
const ringColor1 = 0x777777;
const ringColor2 = 0x888888;

const segmentCount = 150; // visible segments
const segmentDistance = 2; // rings density
let tunnelLength = 1000; // segments
const tunnelRad = 5;
const wigliness = 1.2;
const turnForce = 0.05;

// controls
const rollSpeed = 0.0008;
const rollDamp = 0.98;
const pitchSpeed = 0.00007;
const pitchDamp = 0.997;

const skills = [0.2, 0.3, 0.4];
let movementSpeed = skills[1];



import * as THREE from 'three';
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 50;
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

let cameraQuaternion = new THREE.Quaternion();
let forwardDirection = new THREE.Vector3(0, 0, -1);

let dRoll = 0;
let dPitch = 0;
let roll = 0;
let pitch = 0;

let score = 0;
let scoreElement = document.createElement('div');
scoreElement.style.position = 'absolute';
scoreElement.style.top = '10px';
scoreElement.style.left = '10px';
scoreElement.style.color = 'white';
scoreElement.style.fontSize = '24px';
document.body.appendChild(scoreElement);

let skillElement = document.createElement('div');
skillElement.style.position = 'absolute';
skillElement.style.top = '40px';
skillElement.style.left = '10px';
skillElement.style.color = 'white';
skillElement.style.fontSize = '24px';
document.body.appendChild(skillElement);

document.body.style.cursor = 'none';


const names = [
  "Amelia", "Emma", "Sophia", "Emily", "Violet", "Layla", "Scarlett", "Abigail", "Eleanor", "Olivia"
];

const seeds = names;

/*
usage of random generator:
var seed = cyrb128("apples");
var rnd = mulberry32(seed[0]);
var x = rnd(); // in a range [0; 1]
*/

// Calling cyrb128 will produce a 128-bit hash value from a string which can be used to seed a PRNG. 
function cyrb128(str) {
    let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    return [(h1^h2^h3^h4)>>>0, (h2^h1)>>>0, (h3^h1)>>>0, (h4^h1)>>>0];
}

// Mulberry32 is a simple generator with a 32-bit state, but is extremely fast and has good quality randomness
function mulberry32(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

let rnd = Math.random; 


function startNewGame(seedIndex) {
	if (seedIndex !== undefined) { 
    rnd = mulberry32(cyrb128(seeds[seedIndex])[0]);
		tunnelLength = 150;
  } else { 
    rnd = Math.random;
		tunnelLength = 1000;
  }
	
  score = 0;
  scoreElement.textContent = `Score: ${score}`;
  camera.position.set(0, 0, 150 * movementSpeed);
  cameraQuaternion.set(0, 0, 0, 1); // Reset to initial orientation
  dRoll = 0;
  dPitch = 0;
  roll = 0;
  pitch = 0;
	curPosition = new THREE.Vector3(0, 0, 0);
	curDirection = new THREE.Vector3(0, 0, -1);
	axis = new THREE.Vector3(rnd(), rnd(), rnd()).normalize();
	ind = 0;
  curRingIndex = 0;
	nSegments = 0;
	scene.background = new THREE.Color(backgroundColor);

  // Clear the existing tunnel
  while (scene.children.length > 0) {
    scene.remove(scene.children[0]);
  }

  buildTunnel();
}



document.addEventListener('keydown', function(event) {
    switch (event.key) {
        case 'ArrowUp':
            //pitch = 1; // not used, just 3 keys for controls
            break;
        case 'ArrowDown':
            pitch = 1;
            break;
        case 'ArrowLeft':
            roll = -1;
            break;
        case 'ArrowRight':
            roll = 1;
            break;
						
						
				case ' ':
        case 'Enter':
            startNewGame();
            break;
				
				// predifined tunnels
        case '1':
            startNewGame(0);
            break;
        case '2':
            startNewGame(1);
            break;
        case '3':
            startNewGame(2);
            break;
        case '4':
            startNewGame(3);
            break;
        case '5':
            startNewGame(4);
            break;
        case '6':
            startNewGame(5);
            break;
        case '7':
            startNewGame(6);
            break;
        case '8':
            startNewGame(7);
            break;
        case '9':
            startNewGame(8);
            break;
        case '0':
            startNewGame(9);
            break;
						
				case 'q':
						movementSpeed = skills[0];
						skillElement.textContent = `Slow`;
            break;
				case 'w':
						movementSpeed = skills[1];
						skillElement.textContent = ``;
            break;
				case 'e':
						movementSpeed = skills[2];
						skillElement.textContent = `Fast`;
            break;
    }
});

document.addEventListener('keyup', function(event) {
    switch (event.key) {
        case 'ArrowUp':
        case 'ArrowDown':
            pitch = 0;
            break;
        case 'ArrowLeft':
						if (roll < 0) roll = 0;
						break;
        case 'ArrowRight':
            if (roll > 0) roll = 0;
            break;
    }
});


function rollCamera(angle) {
    let cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(cameraQuaternion).normalize();
    let rollQuaternion = new THREE.Quaternion();
    rollQuaternion.setFromAxisAngle(cameraDirection, angle);
    cameraQuaternion.multiplyQuaternions(rollQuaternion, cameraQuaternion);
}

function pitchCamera(angle) {
		let rightAxis = new THREE.Vector3(1, 0, 0).applyQuaternion(cameraQuaternion).normalize();
		let pitchQuaternion = new THREE.Quaternion();
		pitchQuaternion.setFromAxisAngle(rightAxis, angle);
		cameraQuaternion.multiplyQuaternions(pitchQuaternion, cameraQuaternion);
}

function updateCameraPosition() {
		let moveVector = new THREE.Vector3(0, 0, -movementSpeed).applyQuaternion(cameraQuaternion);
		camera.position.add(moveVector);
}

function applyCameraOrientation() {
    dPitch *= pitchDamp;
    dRoll *= rollDamp;
		
		dPitch += pitchSpeed * pitch;
		dRoll += rollSpeed * roll;
		
		rollCamera(dRoll);
		pitchCamera(dPitch);
		
		camera.quaternion.copy(cameraQuaternion);
}

function renderTunnel() {
		renderer.render(scene, camera);
}


let curPosition = new THREE.Vector3(0, 0, 0);
let curDirection = new THREE.Vector3(0, 0, -1);
//axis of rotation for tunnel's turns
let axis = new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize();
let ind = 0;
let nSegments = 0;

function addSegment() {
		const geometry = new THREE.RingGeometry(tunnelRad - 0.5, tunnelRad, 32);
		const material = new THREE.MeshBasicMaterial({
				color: ind % 2 === 0 ? ringColor1 : ringColor2,
				side: THREE.DoubleSide
		});
		const ring = new THREE.Mesh(geometry, material);
		ring.position.copy(curPosition);

		// Align the ring to the current direction
		let quaternion = new THREE.Quaternion();
		quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), curDirection);
		ring.quaternion.copy(quaternion);

		ring.userData = { index: ind++ };
		scene.add(ring);
		nSegments++;
		
		// Update the position for the next segment
		curPosition.add(curDirection.clone().multiplyScalar(segmentDistance));

		// Slightly adjust the axis of rotation
  let axisAdjustment = new THREE.Vector3(
    (rnd() - 0.5) * wigliness,
    (rnd() - 0.5) * wigliness,
    (rnd() - 0.5) * wigliness
  );
		axis.add(axisAdjustment).normalize();
		// Ensure the axis is orthogonal to the current direction
		axis.projectOnPlane(curDirection).normalize();
		
		// update the direction
		let rotationQuaternion = new THREE.Quaternion().setFromAxisAngle(axis, turnForce);
		curDirection.applyQuaternion(rotationQuaternion).normalize();
}


function buildTunnel() {
		for (let i = 0; i < segmentCount; i++) {
				addSegment();
    }
}

function removeSegment() {
  if (scene.children.length > 0) {
    scene.remove(scene.children[0]);
		curRingIndex--;
  }
}

function updateTunnel() {
  if (nSegments < tunnelLength) {
		addSegment();
	}
	
  if (scene.children.length > segmentCount) {
    removeSegment();
  }
}


let curRingIndex = 0;
let collisionTimer = null;

function checkCollisions() {
  if (curRingIndex > scene.children.length - 1) return;
  let child = scene.children[curRingIndex];
  if (child.type === 'Mesh' && child.userData.index !== undefined) {
    // Check if the player has crossed the plane of the ring
    let ringPosition = child.position;
    let ringDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(child.quaternion);
    let playerPosition = camera.position;
    let playerDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(cameraQuaternion);

    let distanceToPlane = ringDirection.dot(playerPosition.clone().sub(ringPosition));

    if (distanceToPlane > 0) { // Player has crossed the plane of the ring
      curRingIndex++;
      let distanceToCenter = playerPosition.distanceTo(ringPosition);
      if (distanceToCenter <= tunnelRad) { // Player is inside the tunnel
        score += 1; //child.userData.index;
        scoreElement.textContent = `Score: ${score}`;
				scene.background = new THREE.Color(backgroundColor);
      } else { // Player is outside the tunnel
        scene.background = new THREE.Color(collisionColor);
        if (collisionTimer) clearTimeout(collisionTimer);
        collisionTimer = setTimeout(() => {
          scene.background = new THREE.Color(backgroundColor);
        }, 1000);
      }
			
			updateTunnel();
    }
  }
}

function setLight() {
		/*
		const ambientLight = new THREE.AmbientLight(0xffffff);
		scene.add(ambientLight);

		const directionalLight = new THREE.DirectionalLight(0xffffff, 1); 
		directionalLight.position.set(5, 10, 7.5).normalize();
		scene.add(directionalLight);
		*/
		
		scene.background = new THREE.Color(backgroundColor);
}


setLight();
buildTunnel();

gameLoop();
function gameLoop() {
  updateCameraPosition();
  applyCameraOrientation();
  checkCollisions();
  renderTunnel();
  requestAnimationFrame(gameLoop);
} 
