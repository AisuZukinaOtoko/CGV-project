import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export class GunManager {
  constructor(scene, camera, playerObject, collisionManager, playerManager) {
    this.scene = scene;
    this.camera = camera;
    this.bullets = [];
    this.playerObject = playerObject;
    this.collisionManager = collisionManager;
    this.playerManager = playerManager;
    this.blasterObject = new THREE.Object3D();
    this.playerModelObject = new THREE.Object3D();
    this.blasterBulletScale = 6;
    this.playerModelBulletScale = 4;
    this.camera.add(this.blasterObject);
    this.camera.add(this.playerModelObject);
    this.blasterVolume = 0.1;
    this.isBlasterVisible = true;
    this.loadModels();
    this.loadSound();
    this.updateModelPosition();
    this.blasterZoom = 1;
    this.playerModelZoom = 0.8;
    this.currentZoom = this.blasterZoom;
  }

  loadModels() {
    const loader = new GLTFLoader();
    loader.load(
      "src/assets/Weapon/kenney_blaster-kit/Models/blasterG.glb",
      (gltf) => {
        this.blasterModel = gltf.scene;
        this.blasterModel.scale.set(1, 1, 1);
        this.blasterObject.add(this.blasterModel);
        this.updateModelPosition();
        this.loadFoamBullet();
      },
      undefined,
      (error) => console.error("Error loading blaster model:", error)
    );

    loader.load(
      "src/assets/player/steve.glb",
      (gltf) => {
        this.playerModel = gltf.scene;
        this.playerModel.scale.set(1, 1, 1);
        this.playerModelObject.add(this.playerModel);
        this.playerModelObject.visible = false;
        this.updateModelPosition();
      },
      undefined,
      (error) => console.error("Error loading player model:", error)
    );
  }

  loadFoamBullet() {
    const loader = new GLTFLoader();
    loader.load(
      "src/assets/Weapon/kenney_blaster-kit/Models/foamBulletB.glb",
      (gltf) => {
        this.foamBulletModel = gltf.scene;
        this.foamBulletModel.scale.set(6, 6, 6);
      },
      undefined,
      (error) => console.error("Error loading foam bullet model:", error)
    );
  }

  loadSound() {
    this.audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    this.blasterSound = null;

    fetch("src/assets/Sounds/656527__de1977__automatic-pistol.wav")
      .then((response) => response.arrayBuffer())
      .then((arrayBuffer) => this.audioContext.decodeAudioData(arrayBuffer))
      .then((audioBuffer) => {
        this.blasterSound = audioBuffer;
      })
      .catch((error) => console.error("Error loading sound:", error));
  }

  setBlasterVolume(volume) {
    // Ensure volume is between 0 and 1
    this.blasterVolume = Math.max(0, Math.min(1, volume));
  }

  fireBullet() {
    if (this.foamBulletModel) {
      const bullet = this.foamBulletModel.clone();

      const bulletStartPosition = new THREE.Vector3();
      const bulletOffset = new THREE.Vector3();

      if (this.isBlasterVisible) {
        bulletOffset.set(0.4, -0.3, -1.2); // Blaster position
      } else {
        bulletOffset.set(-0.2, -0.3, -1); // Player model position
      }

      // Apply the offset in the camera's local space
      bulletStartPosition
        .copy(bulletOffset)
        .applyMatrix4(this.camera.matrixWorld);

      bullet.position.copy(bulletStartPosition);

      const direction = new THREE.Vector3();
      this.camera.getWorldDirection(direction);

      bullet.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction
      );

      bullet.velocity = direction.multiplyScalar(200.0);

      bullet.raycaster = new THREE.Raycaster(
        bullet.position,
        bullet.velocity.clone().normalize()
      );

      bullet.bounceCount = 0;
      bullet.maxBounces = 3;

      if (this.isBlasterVisible) {
        bullet.scale.set(
          this.blasterBulletScale,
          this.blasterBulletScale,
          this.blasterBulletScale
        );
      } else {
        bullet.scale.set(
          this.playerModelBulletScale,
          this.playerModelBulletScale,
          this.playerModelBulletScale
        );
      }

      this.scene.add(bullet);
      this.bullets.push(bullet);

      if (this.blasterSound) {
        const source = this.audioContext.createBufferSource();
        source.buffer = this.blasterSound;

        // Create a gain node for volume control
        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(
          this.blasterVolume,
          this.audioContext.currentTime
        );

        // Connect the source to the gain node, then to the destination
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        source.start();
      }
    }
  }

  updateBullets(deltaTime) {
    const gravity = new THREE.Vector3(0, -9.8, 0);

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];

      bullet.velocity.add(gravity.clone().multiplyScalar(deltaTime));

      const nextPosition = bullet.position
        .clone()
        .add(bullet.velocity.clone().multiplyScalar(deltaTime));

      bullet.raycaster.set(
        bullet.position,
        nextPosition.clone().sub(bullet.position).normalize()
      );

      const intersects = bullet.raycaster.intersectObjects(
        this.collisionManager.collidableMeshList,
        false
      );

      if (
        intersects.length > 0 &&
        intersects[0].distance < bullet.position.distanceTo(nextPosition)
      ) {
        if (bullet.bounceCount < bullet.maxBounces) {
          const normal = intersects[0].face.normal;
          bullet.velocity.reflect(normal);
          bullet.velocity.multiplyScalar(0.02);
          bullet.position.copy(intersects[0].point);
          bullet.position.add(normal.multiplyScalar(0.1));
          bullet.bounceCount++;

          if (Math.abs(normal.y) > 0.7) {
            bullet.velocity.setX(bullet.velocity.x * 0.2);
            bullet.velocity.setZ(bullet.velocity.z * 0.2);
          }
        } else {
          this.scene.remove(bullet);
          this.bullets.splice(i, 1);
          continue;
        }
      } else {
        bullet.position.copy(nextPosition);
      }

      if (
        bullet.position.distanceTo(this.playerObject.position) > 100 ||
        bullet.position.y < -10
      ) {
        this.scene.remove(bullet);
        this.bullets.splice(i, 1);
      }
    }
  }

  updateBlasterPosition() {
    if (this.blasterObject) {
      this.blasterObject.position.set(0.4, -0.3, -1.2);
      this.blasterObject.rotation.set(0, Math.PI, 0);
    }
  }

  updateModelPosition() {
    if (this.blasterObject) {
      this.blasterObject.position.set(0.4, -0.3, -1.2);
      this.blasterObject.rotation.set(0, Math.PI, 0);
    }
    if (this.playerModelObject) {
      this.playerModelObject.position.set(-0.43, -1.8, -1.2);
      this.playerModelObject.rotation.set(0, Math.PI, 0);
    }
  }

  toggleModel() {
    this.isBlasterVisible = !this.isBlasterVisible;
    this.blasterObject.visible = this.isBlasterVisible;
    this.playerModelObject.visible = !this.isBlasterVisible;

    // Update zoom
    this.currentZoom = this.isBlasterVisible
      ? this.blasterZoom
      : this.playerModelZoom;
    this.updateCameraZoom();

    // Update crosshair position
    if (this.playerManager) {
      this.playerManager.updateCrosshairPosition(this.isBlasterVisible);
      this.playerManager.adjustCameraPosition(this.isBlasterVisible);
    }
  }

  updateCameraZoom() {
    this.camera.zoom = this.currentZoom;
    this.camera.updateProjectionMatrix();
  }

  setBlasterBulletScale(scale) {
    this.blasterBulletScale = scale;
  }

  setPlayerModelBulletScale(scale) {
    this.playerModelBulletScale = scale;
  }

  update() {
    this.updateCameraZoom();
  }
}
