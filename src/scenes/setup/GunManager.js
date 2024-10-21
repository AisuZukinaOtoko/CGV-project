import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export class GunManager {
  constructor(scene, camera, playerObject, collisionManager) {
    this.scene = scene;
    this.camera = camera;
    this.bullets = [];
    this.playerObject = playerObject;
    this.collisionManager = collisionManager;
    this.bullets = [];
    this.setupGun();
    this.loadSound();
    this.updateBlasterPosition();
  }

  setupGun() {
    this.blasterObject = new THREE.Object3D();
    this.camera.add(this.blasterObject);
    this.loadPlayerModel();
  }

  loadPlayerModel() {
    const loader = new GLTFLoader();
    loader.load(
      "src/assets/Weapon/kenney_blaster-kit/Models/blasterG.glb",
      (gltf) => {
        this.gltfModel = gltf.scene;
        this.gltfModel.scale.set(1, 1, 1);
        this.blasterObject.add(this.gltfModel);
        this.updateBlasterPosition();
        this.loadFoamBullet();
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

  fireBullet() {
    if (this.foamBulletModel) {
      const bullet = this.foamBulletModel.clone();

      const blasterWorldPosition = new THREE.Vector3();
      this.blasterObject.getWorldPosition(blasterWorldPosition);

      bullet.position.copy(blasterWorldPosition);

      const direction = new THREE.Vector3();
      this.camera.getWorldDirection(direction); // Use this.camera instead of this.m_MainCamera

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

      this.scene.add(bullet);
      this.bullets.push(bullet);

      if (this.blasterSound) {
        const source = this.audioContext.createBufferSource();
        source.buffer = this.blasterSound;
        source.connect(this.audioContext.destination);
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
}
