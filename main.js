const backgroundColor = 0xaaaeb6;
const collisionColor = 0xff0000;
const ringColor1 = 0x777777;
const ringColor2 = 0x888888;

const segmentCount = 150; // visible segments
const segmentDistance = 2; // rings density
const tunnelLength = 1000; // segments
const tunnelRad = 5;
const wigliness = 1.2;
const turnForce = 0.05;

// controls
const rollSpeed = 0.0008;
const rollDamp = 0.98;
const pitchSpeed = 0.00007;
const pitchDamp = 0.997;
const movementSpeed = 0.3;


document.body.style.cursor = 'none';

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


document.addEventListener('keydown', function(event) {
    switch (event.key) {
        case 'ArrowUp':
            //pitch = 1;
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
				(Math.random() - 0.5) * wigliness,
				(Math.random() - 0.5) * wigliness,
				(Math.random() - 0.5) * wigliness
		);
		axis.add(axisAdjustment).normalize();
		// Ensure the axis is orthogonal to the current direction
		axis.projectOnPlane(curDirection).normalize();
		
		// update the direction
		let rotationQuaternion = new THREE.Quaternion().setFromAxisAngle(axis, turnForce);
		curDirection.applyQuaternion(rotationQuaternion).normalize();
}


function buildTunnel(segmentCount = 250, segmentDistance = 2) {
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
buildTunnel(segmentCount, segmentDistance);

gameLoop();
function gameLoop() {
  updateCameraPosition();
  applyCameraOrientation();
  checkCollisions();
  renderTunnel();
  requestAnimationFrame(gameLoop);
} 
