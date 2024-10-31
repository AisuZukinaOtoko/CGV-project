import * as THREE from "three";

export class MiniMap {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;

    // Create minimap camera
    this.camera = new THREE.OrthographicCamera(-50, 50, 50, -50, 1, 1000);
    this.camera.position.set(0, 100, 0);
    this.camera.lookAt(0, 0, 0);

    // Create minimap renderer with proper settings
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    this.renderer.setSize(150, 150);
    this.renderer.domElement.id = "mini-map-canvas";
    this.renderer.setClearColor(0x000000, 0.3);

    // Create minimap container
    const minimapContainer = document.createElement("div");
    minimapContainer.id = "mini-map";
    document.body.appendChild(minimapContainer);
    minimapContainer.appendChild(this.renderer.domElement);

    // Create separate scene for player marker
    this.markerScene = new THREE.Scene();

    // Create player marker
    const markerGeometry = new THREE.CircleGeometry(3, 32);
    const markerMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      opacity: 0.8,
    });
    this.playerMarker = new THREE.Mesh(markerGeometry, markerMaterial);
    this.playerMarker.rotation.x = -Math.PI / 2;
    this.playerMarker.position.y = 50; // Position above the map
    this.markerScene.add(this.playerMarker);
  }

  update() {
    const playerPos = this.player.getPlayerPosition();

    // Update camera position
    this.camera.position.set(playerPos.x, 100, playerPos.z);
    this.camera.lookAt(playerPos.x, 0, playerPos.z);

    // Update player marker position
    this.playerMarker.position.x = playerPos.x;
    this.playerMarker.position.z = playerPos.z;

    // Render main scene
    this.renderer.render(this.scene, this.camera);

    // Render marker scene on top
    this.renderer.autoClear = false;
    this.renderer.render(this.markerScene, this.camera);
    this.renderer.autoClear = true;
  }
}
