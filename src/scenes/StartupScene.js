import Scene from "./Scene.js";
import EVENTS from "./../Events.js";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { MeshBVH, acceleratedRaycast } from "three-mesh-bvh";
import EnemyManager from "../hostiles/EnemyManager.js";

THREE.Mesh.prototype.raycast = acceleratedRaycast;

export default class StartupScene extends Scene {
  constructor(camera, renderer) {
    super(camera);
    this.m_Scene = new THREE.Scene();
    this.environmentCutoffSize = 200; //Handles how much of the environment model we use
    this.initializeScene(camera, renderer);
    this.setupLights();
    this.setupEnvironment();
    this.setupPlayer();
    this.EnemyManager = new EnemyManager(this.m_Scene, this.playerObject);
    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);
    this.bullets = []; // Array to store active bullets
    this.loadSound(); // Load the sound file

    // Environment maps / skyboxes
    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
        '/src/assets/Environment/env_maps/cloudy/bluecloud_ft.jpg', // Front face
        '/src/assets/Environment/env_maps/cloudy/bluecloud_bk.jpg',  // Back face
        '/src/assets/Environment/env_maps/cloudy/bluecloud_up.jpg', // Top face
        '/src/assets/Environment/env_maps/cloudy/bluecloud_dn.jpg', // Bottom face
        '/src/assets/Environment/env_maps/cloudy/bluecloud_rt.jpg', // Right face
        '/src/assets/Environment/env_maps/cloudy/bluecloud_lf.jpg', // Left face
    ]);
    this.m_Scene.background = texture;
  }

  initializeScene(camera, renderer) {
    this.m_MainCamera = camera;
    this.m_Renderer = renderer;
    this.m_MainCamera.position.set(0, 2, 5);
    this.m_MainCamera.lookAt(0, 2, 0);
    this.m_MainCamera.near = 0.1;
    this.m_MainCamera.far = 500;
    this.m_MainCamera.updateProjectionMatrix();
    this.m_Renderer.setClearColor(0x87ceeb);
    this.m_Renderer.shadowMap.enabled = true;
    this.m_Renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.m_Renderer.localClippingEnabled = true;
  }

  setupLights() {
    this.m_Scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(100, 100, 100);
    sunLight.castShadow = true;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.bias = -0.0001;
    this.m_Scene.add(sunLight);
  }

  setupEnvironment() {
    this.collidableMeshList = [];
    new GLTFLoader().load(
      "src/assets/Environment/polygonal_apocalyptic_urban_ruins/scene.gltf",
      (gltf) => {
        const environment = gltf.scene;
        environment.scale.set(1, 1, 1);
        this.m_Scene.add(environment);

        // Apply clipping to the environment
        environment.traverse((node) => {
          if (node.isMesh) {
            const clippingPlanes = [
              new THREE.Plane(
                new THREE.Vector3(1, 0, 0),
                this.environmentCutoffSize
              ),
              new THREE.Plane(
                new THREE.Vector3(-1, 0, 0),
                this.environmentCutoffSize
              ),
              new THREE.Plane(
                new THREE.Vector3(0, 0, 1),
                this.environmentCutoffSize
              ),
              new THREE.Plane(
                new THREE.Vector3(0, 0, -1),
                this.environmentCutoffSize
              ),
            ];
            node.material.clippingPlanes = clippingPlanes;
            node.material.clipShadows = true;
            this.setupNode(node);
          }
        });
      },
      undefined,
      (error) => console.error("Error loading environment:", error)
    );

    const groundMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(
        this.environmentCutoffSize * 2,
        this.environmentCutoffSize * 2
      ),
      new THREE.MeshStandardMaterial({ color: 0x555555 })
    );
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = -0.01;
    groundMesh.receiveShadow = true;
    this.setupNode(groundMesh);
    this.m_Scene.add(groundMesh);
  }

  setupNode(node) {
    if (node.isMesh) {
      node.castShadow = node.receiveShadow = true;
      if (node.material) {
        node.material.depthWrite = true;
        node.material.polygonOffset = true;
      }
      if (
        node.geometry.boundingSphere?.radius > 0.5 ||
        node.geometry.type === "PlaneGeometry"
      ) {
        node.geometry.computeBoundsTree = MeshBVH;
        node.geometry.boundsTree = new MeshBVH(node.geometry);
        this.collidableMeshList.push(node);
      }
    }
  }

  setupPlayer() {
    this.playerObject = new THREE.Object3D();
    this.playerObject.position.set(0, 2, 5);
    this.m_Scene.add(this.playerObject);

    this.playerObject.add(this.m_MainCamera);
    this.m_MainCamera.position.set(0, 0, 0);

    this.blasterObject = new THREE.Object3D();
    this.m_MainCamera.add(this.blasterObject);

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

    this.loadPlayerModel();
    document.addEventListener("mousemove", this.handleMouseMove.bind(this));
    document.addEventListener("click", this.handleMouseClick.bind(this));
    this.m_Renderer.domElement.addEventListener("click", () =>
      this.m_Renderer.domElement.requestPointerLock()
    );
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

  handleMouseClick(event) {
    if (document.pointerLockElement === this.m_Renderer.domElement) {
      this.fireBullet();
    }
  }

  fireBullet() {
    if (this.foamBulletModel) {
      const bullet = this.foamBulletModel.clone();

      // Get the blaster's world position
      const blasterWorldPosition = new THREE.Vector3();
      this.blasterObject.getWorldPosition(blasterWorldPosition);

      // Set the bullet's initial position
      bullet.position.copy(blasterWorldPosition);

      // Get the camera's world direction
      const direction = new THREE.Vector3();
      this.m_MainCamera.getWorldDirection(direction);

      // Set the bullet's rotation to match the camera's direction
      bullet.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction
      );

      // Set the initial velocity of the bullet (increased speed)
      bullet.velocity = direction.multiplyScalar(200.0);

      // Add a raycaster to the bullet
      bullet.raycaster = new THREE.Raycaster(
        bullet.position,
        bullet.velocity.clone().normalize()
      );

      // Add bounce count to the bullet
      bullet.bounceCount = 0;
      bullet.maxBounces = 3; // Maximum number of bounces

      this.m_Scene.add(bullet);
      this.bullets.push(bullet);

      // Play the blaster sound
      if (this.blasterSound) {
        const source = this.audioContext.createBufferSource();
        source.buffer = this.blasterSound;
        source.connect(this.audioContext.destination);
        source.start();
      }
    }
  }

  handleMouseMove(event) {
    if (document.pointerLockElement === this.m_Renderer.domElement) {
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

  checkCollision(position) {
    const collisionDistance = 0.3;
    const directions = [
      new THREE.Vector3(0, 0, -1),
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(1, 0, 0),
    ];

    for (let dir of directions) {
      dir.applyQuaternion(this.playerObject.quaternion);
      this.raycaster.set(position, dir);
      const intersects = this.raycaster.intersectObjects(
        this.collidableMeshList,
        false
      );
      if (intersects.length > 0 && intersects[0].distance < collisionDistance) {
        return true;
      }
    }
    return false;
  }

  OnUpdate(deltaTime) {
    this.stats.update();
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

    this.EnemyManager.OnUpdate(deltaTime);
    this.updatePosition(horizontalMovement, verticalMovement);
    this.checkGrounded();
    this.updateBlasterPosition();
    this.updateBullets(deltaTime);
  }

  updateBullets(deltaTime) {
    const gravity = new THREE.Vector3(0, -9.8, 0); // Gravity vector

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];

      // Apply gravity
      bullet.velocity.add(gravity.clone().multiplyScalar(deltaTime));

      // Calculate the next position
      const nextPosition = bullet.position
        .clone()
        .add(bullet.velocity.clone().multiplyScalar(deltaTime));

      // Update bullet raycaster
      bullet.raycaster.set(
        bullet.position,
        nextPosition.clone().sub(bullet.position).normalize()
      );

      // Check for collisions
      const intersects = bullet.raycaster.intersectObjects(
        this.collidableMeshList,
        false
      );

      if (
        intersects.length > 0 &&
        intersects[0].distance < bullet.position.distanceTo(nextPosition)
      ) {
        // Collision detected, handle bouncing
        if (bullet.bounceCount < bullet.maxBounces) {
          const normal = intersects[0].face.normal;

          // Calculate reflection
          bullet.velocity.reflect(normal);

          // Reduce velocity significantly upon collision
          bullet.velocity.multiplyScalar(0.02);

          // Move the bullet to the collision point
          bullet.position.copy(intersects[0].point);

          // Move the bullet slightly away from the collision point
          bullet.position.add(normal.multiplyScalar(0.1));

          bullet.bounceCount++;

          // If the collision is mostly vertical (e.g., with the ground), reduce horizontal velocity
          if (Math.abs(normal.y) > 0.7) {
            bullet.velocity.setX(bullet.velocity.x * 0.2);
            bullet.velocity.setZ(bullet.velocity.z * 0.2);
          }
        } else {
          // Max bounces reached, remove the bullet
          this.m_Scene.remove(bullet);
          this.bullets.splice(i, 1);
          continue;
        }
      } else {
        // No collision, update bullet position
        bullet.position.copy(nextPosition);
      }

      // Remove bullets that have traveled too far or fallen below a certain height
      if (
        bullet.position.distanceTo(this.playerObject.position) > 100 ||
        bullet.position.y < -10
      ) {
        this.m_Scene.remove(bullet);
        this.bullets.splice(i, 1);
      }
    }
  }

  updatePosition(horizontalMovement, verticalMovement) {
    let newPosition = this.playerObject.position
      .clone()
      .add(horizontalMovement);
    if (!this.checkCollision(newPosition)) {
      this.playerObject.position.copy(newPosition);
    }

    newPosition = this.playerObject.position.clone().add(verticalMovement);
    if (!this.checkCollision(newPosition)) {
      this.playerObject.position.copy(newPosition);
    } else {
      this.verticalVelocity = 0;
    }
  }

  checkGrounded() {
    this.raycaster.set(this.playerObject.position, new THREE.Vector3(0, -1, 0));
    const intersects = this.raycaster.intersectObjects(
      this.collidableMeshList,
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

  getMovementDirection() {
    const moveDirection = new THREE.Vector3();
    if (EVENTS.eventHandler.IsKeyHeld(EVENTS.KEY.W)) moveDirection.z -= 1;
    if (EVENTS.eventHandler.IsKeyHeld(EVENTS.KEY.S)) moveDirection.z += 1;
    if (EVENTS.eventHandler.IsKeyHeld(EVENTS.KEY.A)) moveDirection.x -= 1;
    if (EVENTS.eventHandler.IsKeyHeld(EVENTS.KEY.D)) moveDirection.x += 1;
    return moveDirection;
  }

  updateCameraRotation() {
    this.playerObject.rotation.y = this.rotationY;
    this.m_MainCamera.rotation.x = this.rotationX;
  }

  updateBlasterPosition() {
    if (this.blasterObject) {
      this.blasterObject.position.set(0.4, -0.3, -1.2);
      this.blasterObject.rotation.set(0, Math.PI, 0);
    }
  }

  updateFoamBulletPosition() {
    if (this.foamBullet) {
      this.foamBullet.position.set(0, 0.05, -0.5);
      this.foamBullet.rotation.set(0, 0, 0);
    }
  }
}
