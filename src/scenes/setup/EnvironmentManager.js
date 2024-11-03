import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshBVH } from "three-mesh-bvh";
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import playground from "/Environment/playground/blender_playground.glb";

export class EnvironmentManager {
  constructor(scene, environmentCutoffSize) {
    this.scene = scene;
    this.environmentCutoffSize = environmentCutoffSize;
    this.collidableMeshList = [];
    this.setupEnvironment();
    this.setupLights();

    this.environmentSetup = false;

    this.flickerSound = new Audio("./Sounds/bulb.mp3"); // Replace with your sound file path
    this.flickerSound.volume = 0.8; // Set volume (0 to 1)
    this.lampLights = []; // Array to store each lamp light for flickering
  }

  setupEnvironment() {
    new GLTFLoader().load(
      playground,
      (gltf) => {
        const environment = gltf.scene;
        environment.scale.set(1, 1, 1);
        this.scene.add(environment);

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

            if (node.name === "lamp2" || node.name === "lamp") {
              const light = new THREE.PointLight(0xffedb3, 5, 20);
              light.position.copy(node.position);
  
              // Adjust position based on lamp name
              if (node.name === "lamp2") {
                light.position.y += 4;
                light.position.x += 2.5;
                light.position.z += 1.7;
                this.createReflector(light.position);
              } else if (node.name === "lamp") {
                light.position.y = 0;
                light.position.x -= 0.25;
                light.position.z -= 1.5;
              }
  
              light.castShadow = true;
              this.scene.add(light);
              this.lampLights.push(light);  // Add each light to the lampLights array
  
              const bulbGeometry = new THREE.SphereGeometry(0.1, 8, 4);
              const bulbMaterial = new THREE.MeshBasicMaterial({ color: 0xffedb3, emissive: 0xffedb3 });
              const bulbMesh = new THREE.Mesh(bulbGeometry, bulbMaterial);
              bulbMesh.position.copy(light.position);
              this.scene.add(bulbMesh);
            }
          }
        });
        this.environmentSetup = true;
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
    this.scene.add(groundMesh);
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

  // Update setupLights to store lampLight
  setupLights() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.1));

    const sunLight = new THREE.DirectionalLight(0xffffff, 0.2);
    sunLight.position.set(100, 100, 100);
    sunLight.castShadow = true;
    this.scene.add(sunLight);

    // Set up the flickering lamp light
    // this.lampLight = new THREE.PointLight(0xffedb3, 5, 20);
    // this.lampLight.position.set(-18.2, 3.05, 8.5);
    // this.lampLight.castShadow = true;

    // const bulbGeometry = new THREE.SphereGeometry(0.1, 8, 4);
    // const bulbMaterial = new THREE.MeshBasicMaterial({
    //   color: 0xffedb3,
    //   emissive: 0xffedb3,
    // });
    // const bulbMesh = new THREE.Mesh(bulbGeometry, bulbMaterial);

    // bulbMesh.position.set(-18.2, 3.0, 8.5);
    // this.scene.add(bulbMesh);
    // this.scene.add(this.lampLight);

  }

  createReflector(position) {
    const reflectorGeometry = new THREE.PlaneGeometry(2, 2);
    const reflector = new Reflector(reflectorGeometry, {
      color: 0x777777,
      textureWidth: window.innerWidth * 0.5,
      textureHeight: window.innerHeight * 0.5,
      clipBias: 0.003,
      recursion: 1,
    });
    reflector.position.copy(position);
    reflector.position.y = 0.02;
    reflector.rotation.x = -Math.PI / 2;
    reflector.position.x += 2;
    this.scene.add(reflector);
  }
  
  animate() {
    if (this.lampLight) {
      // Set the light off occasionally (e.g., 20% chance per frame)
      const flickerOff = Math.random() < 0.2;

      if (flickerOff) {
        this.lampLight.intensity = 0; // Turn light off
      } else {
        this.lampLight.intensity = 5 + Math.random() * 0.5;
        // Play sound if lamp is flickering
        if (this.lampLight.intensity > 0 && !this.flickerSound.paused) {
          this.flickerSound.currentTime = 0; // Reset sound playback
        }
        this.flickerSound.play(); // Play sound if the lamp is flickering
      }
    }
  }
}
