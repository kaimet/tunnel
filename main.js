document.body.style.cursor = 'none';

import * as THREE from 'three';

// Initialize the scene
const scene = new THREE.Scene();

// Initialize the camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 50;

// Initialize the renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Camera orientation and direction
let cameraQuaternion = new THREE.Quaternion();
let forwardDirection = new THREE.Vector3(0, 0, -1); // Initially looking forward

let dRoll = 0;
let dPitch = 0;
let rollSpeed = 0.0005;
let pitchSpeed = 0.0002;
let movementSpeed = 0.3;
let roll = 0;
let pitch = 0;

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
        case 'ArrowRight':
            roll = 0;
            break;
    }
});


function rollCamera(angle) {
    // Roll around the camera's current forward direction
    let cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(cameraQuaternion).normalize();
    let rollQuaternion = new THREE.Quaternion();
    rollQuaternion.setFromAxisAngle(cameraDirection, angle);
    cameraQuaternion.multiplyQuaternions(rollQuaternion, cameraQuaternion);
}

function pitchCamera(angle) {
		// Pitch around the camera's right axis
		let rightAxis = new THREE.Vector3(1, 0, 0).applyQuaternion(cameraQuaternion).normalize();
		let pitchQuaternion = new THREE.Quaternion();
		pitchQuaternion.setFromAxisAngle(rightAxis, angle);
		cameraQuaternion.multiplyQuaternions(pitchQuaternion, cameraQuaternion);
}


function updateCameraPosition() {
		// Move the camera forward in the direction it's facing
		let moveVector = new THREE.Vector3(0, 0, -movementSpeed).applyQuaternion(cameraQuaternion);
		camera.position.add(moveVector);
}

function applyCameraOrientation() {
		// Apply damping to gradually slow down the rotation
    dPitch *= 0.99;
    dRoll *= 0.99;
		
		dPitch += pitchSpeed * pitch;
		dRoll += rollSpeed * roll;

    // Update camera rotation based on dPitch and dRoll
    if (dPitch !== 0) {
        pitchCamera(dPitch);
    }
    if (dRoll !== 0) {
        rollCamera(dRoll);
    }
		
		camera.quaternion.copy(cameraQuaternion);
}

function renderTunnel() {
		renderer.render(scene, camera);
}

function gameLoop() {
		updateCameraPosition();
		applyCameraOrientation();
		renderTunnel();
		requestAnimationFrame(gameLoop);
}


function getGradientColor(i, segmentCount) {
    const color1 = new THREE.Color(0xffff00);
    const color2 = new THREE.Color(0x00ff00);
    return color1.lerp(color2, i / segmentCount);
}

function buildTunnel(segmentCount = 250, segmentDistance = 2) {
    let curDirection = new THREE.Vector3(0, 0, -1); // Initial direction
    let curPosition = new THREE.Vector3(0, 0, 0); // Start at the origin

    // Initial random axis of rotation
    let axis = new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize();

    for (let i = 0; i < segmentCount; i++) {
        // Create the ring
        const geometry = new THREE.RingGeometry(4.5, 5, 32);
				//const geometry = new THREE.TorusGeometry(5, 0.5, 16, 32);
        const material = new THREE.MeshBasicMaterial({
            color: i % 2 === 0 ? 0x777777 : 0x888888,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(geometry, material);
        ring.position.copy(curPosition);

        // Align the ring to the current direction
        let quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), curDirection);
        ring.quaternion.copy(quaternion);

        scene.add(ring);

        // Update the position for the next segment
        curPosition.add(curDirection.clone().multiplyScalar(segmentDistance));

        //let turnForce = (Math.random() - 0.5) * 1.5;
				let turnForce = 0.05;
        let rotationQuaternion = new THREE.Quaternion().setFromAxisAngle(axis, turnForce);
        curDirection.applyQuaternion(rotationQuaternion).normalize();

        // Slightly adjust the axis for the next step
				const dAxis = 1.2;
        let axisAdjustment = new THREE.Vector3(
            (Math.random() - 0.5) * dAxis,
            (Math.random() - 0.5) * dAxis,
            (Math.random() - 0.5) * dAxis
        );
        axis.add(axisAdjustment).normalize();

        // Ensure the axis is orthogonal to the current direction
        //axis.crossVectors(curDirection, axis.cross(new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize())).normalize();
				axis.projectOnPlane(curDirection).normalize();
    }
		
		/*
		const ambientLight = new THREE.AmbientLight(0xffffff);
		scene.add(ambientLight);

		const directionalLight = new THREE.DirectionalLight(0xffffff, 1); 
		directionalLight.position.set(5, 10, 7.5).normalize();
		scene.add(directionalLight);*/
		
		scene.background = new THREE.Color(0xaab0b3);
}


// Create a large wireframe sphere around the camera's initial position
function createWireframeSphere() {
    const geometry = new THREE.SphereGeometry(300, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
    const wireframeSphere = new THREE.Mesh(geometry, material);
    wireframeSphere.position.set(0, 0, 0); // Centered at the origin
    scene.add(wireframeSphere);
}


//createWireframeSphere();
buildTunnel();

// Start the game loop
gameLoop();