import * as THREE from "three";
import EVENTS from "../../Events.js";

export class PlayerManager {
  constructor(scene, camera, collisionManager, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.collisionManager = collisionManager;
    this.renderer = renderer;

    this.setupPlayer();
    this.setupCrosshair();
    this.gunManager = null;
    this.setupEventListeners();
    this.setupAudio();
  }

  setupPlayer() {
    this.playerObject = new THREE.Object3D();
    this.playerObject.position.set(0, 2, 5);
    this.scene.add(this.playerObject);
    this.playerObject.add(this.camera);
    this.camera.position.set(0, 0, 0);

    this.rotationY = 0;
    this.rotationX = 0;
    this.mouseSensitivity = 0.002;
    this.verticalVelocity = 0;
    this.isGrounded = true;
    this.jumpStrength = 12;
    this.gravity = 0.55;
    this.moveSpeed = 8; // Walking speed
    this.runSpeed = 12; // Running speed
    this.playerHeight = 2;
    this.playerRadius = 0.5;
    this.raycaster = new THREE.Raycaster();
    this.isMoving = false; // Track movement state
    this.isRunning = false; // Track running state
  }

  setupAudio() {
    // Create an audio listener and add it to the camera
    this.listener = new THREE.AudioListener();
    this.camera.add(this.listener);

    // Load the audio file
    this.movementSound = new THREE.Audio(this.listener);
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load("src/assets/Sounds/walking.wav", (buffer) => {
      this.movementSound.setBuffer(buffer);
      this.movementSound.setLoop(true); // Loop the sound
      this.movementSound.setVolume(0.5); // Set the volume (optional)
      console.log("Movement sound loaded"); // Check if loaded
    }, undefined, (error) => {
      console.error("Error loading sound: ", error);
    });
  }

  setGunManager(gunManager) {
    this.gunManager = gunManager;
  }

  setupEventListeners() {
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
    document.addEventListener("keyup", this.handleKeyUp.bind(this)); // Fixed event listener
    document.addEventListener("mousemove", this.handleMouseMove.bind(this));
  }

  handleKeyDown(event) {
    if (event.key === "r") { // Check for the R key to toggle running
      this.isRunning = true;
      this.movementSound.setPlaybackRate(1.5); // Increase sound playback speed when running
      this.startMovementSound(); // Start sound when running
    }
  }

  handleKeyUp(event) {
    if (event.key === "r") {
      this.isRunning = false;
      this.movementSound.setPlaybackRate(1); // Reset speed when stopping
      this.checkStopMovementSound(); // Stop sound
    }
  }

  handleMouseMove(event) {
    if (document.pointerLockElement === this.renderer.domElement) {
      this.rotationY -= event.movementX * this.mouseSensitivity;
      this.rotationX = Math.max(
        -Math.PI / 2,
        Math.min(
          Math.PI / 2,
          this.rotationX - event.movementY * this.mouseSensitivity
        )
      );
      this.updateCameraRotation();
    }
  }

  updateCameraRotation() {
    this.playerObject.rotation.y = this.rotationY;
    this.camera.rotation.x = this.rotationX;
  }

  getMovementDirection() {
    const moveDirection = new THREE.Vector3();
    if (EVENTS.eventHandler.IsKeyHeld(EVENTS.KEY.W)) moveDirection.z -= 1;
    if (EVENTS.eventHandler.IsKeyHeld(EVENTS.KEY.S)) moveDirection.z += 1;
    if (EVENTS.eventHandler.IsKeyHeld(EVENTS.KEY.A)) moveDirection.x -= 1;
    if (EVENTS.eventHandler.IsKeyHeld(EVENTS.KEY.D)) moveDirection.x += 1;
    return moveDirection;
  }

  update(deltaTime) {
    let moveDirection = this.getMovementDirection();

    if (EVENTS.eventHandler.IsKeyPressed(EVENTS.KEY.SPACE) && this.isGrounded) {
      this.verticalVelocity = this.jumpStrength;
      this.isGrounded = false;
    }

    this.verticalVelocity -= this.gravity;

    if (moveDirection.length() > 0) {
      moveDirection.normalize().applyEuler(new THREE.Euler(0, this.rotationY, 0));
      this.startMovementSound(); // Start sound on movement
    } else {
      this.checkStopMovementSound(); // Stop sound if not moving
    }

    const currentSpeed = this.isRunning ? this.runSpeed : this.moveSpeed; // Use run speed if running
    const horizontalMovement = moveDirection.multiplyScalar(currentSpeed * deltaTime);
    const verticalMovement = new THREE.Vector3(0, this.verticalVelocity * deltaTime, 0);

    this.updatePosition(horizontalMovement, verticalMovement);
    this.checkGrounded();
  }

  updatePosition(horizontalMovement, verticalMovement) {
    // Handle horizontal movement
    let newPosition = this.playerObject.position.clone().add(horizontalMovement);
    if (!this.collisionManager.checkCollision(newPosition, this.playerObject.quaternion)) {
      this.playerObject.position.copy(newPosition);
    }

    // Handle vertical movement
    newPosition = this.playerObject.position.clone().add(verticalMovement);
    if (!this.collisionManager.checkCollision(newPosition, this.playerObject.quaternion)) {
      this.playerObject.position.copy(newPosition);
    } else {
      this.verticalVelocity = 0; // Reset vertical velocity upon collision
    }
  }

  checkGrounded() {
    this.raycaster.set(this.playerObject.position, new THREE.Vector3(0, -1, 0));
    const intersects = this.raycaster.intersectObjects(
      this.collisionManager.collidableMeshList,
      false
    );

    if (intersects.length > 0 && intersects[0].distance <= this.playerHeight) {
      this.playerObject.position.y = intersects[0].point.y + this.playerHeight;
      this.verticalVelocity = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }
  }

  getPlayerPosition() {
    return this.playerObject.position.clone();
  }

  setupCrosshair() {
    const crosshairTexture = new THREE.TextureLoader().load("src/assets/Weapon/crosshair.png");
    const crosshairMaterial = new THREE.SpriteMaterial({
      map: crosshairTexture,
      color: 0xffffff,
      depthTest: false,
      depthWrite: false,
    });

    this.crosshair = new THREE.Sprite(crosshairMaterial);
    this.crosshair.scale.set(0.05, 0.05, 1);
    this.crosshair.position.set(0.01, -0.01, -1);
    this.crosshair.renderOrder = 999;

    this.camera.add(this.crosshair);
  }

  adjustCameraPosition(isBlasterVisible) {
    if (isBlasterVisible) {
      this.camera.position.set(0, 0, 0);
    } else {
      // Elevate the camera when the player model is visible
      this.camera.position.set(0, 0.7, 0); // Adjust this value as needed
    }
  }

  updateCrosshairPosition() {
    if (this.gunManager && this.gunManager.isBlasterVisible) {
      this.crosshair.position.set(0.01, -0.01, -1);
    } else {
      this.crosshair.position.set(-0.005, -0.02, -1);
    }
  }

  startMovementSound() {
    if (!this.movementSound.isPlaying) {
      this.movementSound.play();
    }
  }

  checkStopMovementSound() {
    if (this.movementSound.isPlaying) {
      this.movementSound.pause(); // Pause or stop as needed
    }
  }

  destroy() {
    document.removeEventListener("keydown", this.handleKeyDown.bind(this));
    document.removeEventListener("keyup", this.handleKeyUp.bind(this));
    document.removeEventListener("mousemove", this.handleMouseMove.bind(this));
    // Additional cleanup logic if necessary
  }
}
