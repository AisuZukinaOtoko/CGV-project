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
    this.jumpStrength = 0.3;
    this.gravity = 0.015;
    this.moveSpeed = 0.1;
    this.playerHeight = 2;
    this.playerRadius = 0.5;
    this.raycaster = new THREE.Raycaster();
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

    this.updatePosition(horizontalMovement, verticalMovement);
    this.checkGrounded();
  }

  updatePosition(horizontalMovement, verticalMovement) {
    let newPosition = this.playerObject.position
      .clone()
      .add(horizontalMovement);
    if (
      !this.collisionManager.checkCollision(
        newPosition,
        this.playerObject.quaternion
      )
    ) {
      this.playerObject.position.copy(newPosition);
    }

    newPosition = this.playerObject.position.clone().add(verticalMovement);
    if (
      !this.collisionManager.checkCollision(
        newPosition,
        this.playerObject.quaternion
      )
    ) {
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
}
