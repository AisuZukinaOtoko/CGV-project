import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshBVH } from "three-mesh-bvh";

export class EnvironmentManager {
  constructor(scene, environmentCutoffSize) {
    this.scene = scene;
    this.environmentCutoffSize = environmentCutoffSize;
    this.collidableMeshList = [];
    this.setupEnvironment();
    this.setupLights();
  }

  setupEnvironment() {
    new GLTFLoader().load(
      "src/assets/Environment/polygonal_apocalyptic_urban_ruins/flat-scene.glb",
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

  setupLights() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(100, 100, 100);
    sunLight.castShadow = true;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.bias = -0.0001;
    this.scene.add(sunLight);
  }
}
