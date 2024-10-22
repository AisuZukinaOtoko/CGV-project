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
    this.moveSpeed = 8;
    this.playerHeight = 2;
    this.playerRadius = 0.5;
    this.raycaster = new THREE.Raycaster();
  }

  setGunManager(gunManager) {
    this.gunManager = gunManager;
  }

  setupEventListeners() {
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
  }

  handleKeyDown(event) {
    if (event.key === "p") {
      this.gunManager.toggleModel();
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
      moveDirection
        .normalize()
        .applyEuler(new THREE.Euler(0, this.rotationY, 0));
    }

    const horizontalMovement = moveDirection.multiplyScalar(this.moveSpeed);
    const verticalMovement = new THREE.Vector3(0, this.verticalVelocity, 0);

    this.updatePosition(horizontalMovement, verticalMovement, deltaTime);
    this.checkGrounded();
  }

  updatePosition(horizontalMovement, verticalMovement, deltaTime) {
    let newPosition = this.playerObject.position.clone().add(horizontalMovement.multiplyScalar(deltaTime));
    if (!this.collisionManager.checkCollision(newPosition, this.playerObject.quaternion)) {
      this.playerObject.position.copy(newPosition);
    }

    newPosition = this.playerObject.position.clone().add(verticalMovement.multiplyScalar(deltaTime));
    if (!this.collisionManager.checkCollision(newPosition, this.playerObject.quaternion)) {
      this.playerObject.position.copy(newPosition);
    } else {
      this.verticalVelocity = 0;
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
    const crosshairTexture = new THREE.TextureLoader().load(
      "src/assets/Weapon/crosshair.png"
    );
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
}
