import Scene from "../Scene.js";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { MeshBVH, acceleratedRaycast } from "three-mesh-bvh";
import EnemyManager from "./hostiles/EnemyManager.js";
import { CollisionManager } from "./CollisionManager.js";
import { PlayerManager } from "./PlayerManager.js";
import { LightningEffect } from './LightningEffect.js';
import { EnvironmentManager } from "./EnvironmentManager.js";
import { GunManager } from "./GunManager.js";
import { GameUI } from "./gameUI.js";
import { PostProcessor } from "../../PostProcessing.js"
import Events from "../../Events.js";

THREE.Mesh.prototype.raycast = acceleratedRaycast;


export default class StartupScene extends Scene {
  constructor(camera, renderer) {
    super(camera);
    this.gameUI = new GameUI(this);
    this.isGamePaused = false;  // New property to track pause state
    this.m_Scene = new THREE.Scene();
    this.postProcessor = new PostProcessor(this.scene, renderer, camera);
    this.m_MainCamera = camera;
    this.m_Renderer = renderer;
    this.environmentCutoffSize = 200;
    this.initializeScene(camera, renderer);
    this.setupManagers();
    this.setupStats();
    this.setupEventListeners();
    this.setupSkybox();
    this.setupLightningAbovePlayer();
  }

  initializeScene(camera, renderer) {
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

  setupManagers() {
    this.environmentManager = new EnvironmentManager(
      this.m_Scene,
      this.environmentCutoffSize
    );
    this.collisionManager = new CollisionManager(this.m_Scene);
    this.collisionManager.collidableMeshList =
      this.environmentManager.collidableMeshList;

    // Create PlayerManager first
    this.playerManager = new PlayerManager(
      this.m_Scene,
      this.m_MainCamera,
      this.collisionManager,
      this.m_Renderer
    );

    // Create GunManager, passing the PlayerManager instance
    this.gunManager = new GunManager(
      this.m_Scene,
      this.m_MainCamera,
      this.playerManager.playerObject,
      this.collisionManager,
      this.playerManager // Pass the PlayerManager instance
    );

    // Set the GunManager in PlayerManager
    this.playerManager.setGunManager(this.gunManager);

    this.enemyManager = new EnemyManager(
      this.m_Scene,
      this.playerManager.playerObject,
      this.collisionManager
    );
    this.enemyManager.EnablePathFinding('src/assets/Environment/chapel/Whitechapel-navmesh.glb');
  }

  setupStats() {
    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);
  }

  setupEventListeners() {
    document.addEventListener("click", () => {
      if (this.m_Renderer && this.m_Renderer.domElement) {
        this.m_Renderer.domElement.requestPointerLock();
      }
    });
    document.addEventListener("click", this.handleMouseClick.bind(this));
    document.addEventListener("mousemove", this.handleMouseMove.bind(this));
  }

  setupSkybox() {
    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
      "/src/assets/Environment/env_maps/cloudy/bluecloud_ft.jpg",
      "/src/assets/Environment/env_maps/cloudy/bluecloud_bk.jpg",
      "/src/assets/Environment/env_maps/cloudy/bluecloud_up.jpg",
      "/src/assets/Environment/env_maps/cloudy/bluecloud_dn.jpg",
      "/src/assets/Environment/env_maps/cloudy/bluecloud_rt.jpg",
      "/src/assets/Environment/env_maps/cloudy/bluecloud_lf.jpg",
    ]);
    this.m_Scene.background = texture;
  }
  setupLightningAbovePlayer() {
    const playerSpawnPosition = this.playerManager.getPlayerPosition();
    const lightningPosition = playerSpawnPosition.clone().add(new THREE.Vector3(0, 2, 0));  // Offset lightning above player

    // Initialize and position the lightning effect above the player
    this.lightningEffect = new LightningEffect(this.m_Scene, this.m_MainCamera, this.m_Renderer);
    this.lightningEffect.setPosition(lightningPosition);
  }

  handleMouseClick(event) {
    if (document.pointerLockElement === this.m_Renderer.domElement) {
      this.gunManager.fireBullet();
    }
  }

  handleMouseMove(event) {
    this.playerManager.handleMouseMove(event);
  }

  onZombieKilled() {
    this.gameUI.incrementKills();
  }

  OnUpdate(deltaTime) {
    deltaTime = Math.min(deltaTime, 0.5);
    const time = performance.now() * 0.001;  // Calculate time in seconds for a smoother effect
    //this.lightningEffect.animate(time);
    if (Events.eventHandler.IsMouseButtonHeld(Events.MOUSE.RIGHT)){
      this.m_MainCamera.fov -= 1;
      if (this.m_MainCamera.fov < 30){
        this.m_MainCamera.fov = 30;
      }
    }
    else {
      this.m_MainCamera.fov += 1;
      if (this.m_MainCamera.fov > 45){
        this.m_MainCamera.fov = 45;
      }
    }

    if (Events.eventHandler.IsMouseButtonPressed(Events.MOUSE.LEFT)){
      const direction = new THREE.Vector3();
      const cameraWorldPosition = new THREE.Vector3();
      this.m_MainCamera.getWorldPosition(cameraWorldPosition);
      this.m_MainCamera.getWorldDirection(direction);
      this.enemyManager.BulletHitCheck(cameraWorldPosition, direction, this.m_MainCamera, 20);
    }

    if (!this.environmentManager.environmentSetup)
      return;

    this.m_MainCamera.updateProjectionMatrix();
    this.stats.update();
    this.gameUI.update();
    this.playerManager.update(deltaTime);
    this.enemyManager.OnUpdate(deltaTime);
    this.gunManager.updateBullets(deltaTime);
    this.gunManager.update();
  }

  OnPreRender() {
    if (this.enemyManager.totalPlayerDamage > 0){
      console.log("damage player!!!!!!", this.enemyManager.totalPlayerDamage);
      this.enemyManager.totalPlayerDamage = 0;
      this.postProcessor.ShakeCamera(100, 3);
      this.postProcessor.PlayerDamageAnimation(200);
    }
  }
}
