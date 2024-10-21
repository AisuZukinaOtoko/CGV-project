import Scene from "../Scene.js";
import EVENTS from "../../Events.js";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { MeshBVH, acceleratedRaycast } from "three-mesh-bvh";
import EnemyManager from "./hostiles/EnemyManager.js";
import { CollisionManager } from "./CollisionManager.js";
import { PlayerManager } from "./PlayerManager.js";
import { EnvironmentManager } from "./EnvironmentManager.js";
import { GunManager } from "./GunManager.js";

THREE.Mesh.prototype.raycast = acceleratedRaycast;

export default class StartupScene extends Scene {
  constructor(camera, renderer) {
    super(camera);
    this.m_Scene = new THREE.Scene();
    this.m_MainCamera = camera;
    this.m_Renderer = renderer;
    this.environmentCutoffSize = 200;
    this.initializeScene(camera, renderer);
    this.setupManagers();
    this.setupStats();
    this.setupEventListeners();
    this.setupSkybox();
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
    this.playerManager = new PlayerManager(
      this.m_Scene,
      this.m_MainCamera,
      this.collisionManager,
      this.m_Renderer
    );
    this.gunManager = new GunManager(
      this.m_Scene,
      this.m_MainCamera,
      this.playerManager.playerObject,
      this.collisionManager
    );
    this.enemyManager = new EnemyManager(
      this.m_Scene,
      this.playerManager.playerObject,
      this.collisionManager
    );
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

  handleMouseClick(event) {
    if (document.pointerLockElement === this.m_Renderer.domElement) {
      this.gunManager.fireBullet();
    }
  }

  handleMouseMove(event) {
    this.playerManager.handleMouseMove(event);
  }

  OnUpdate(deltaTime) {
    this.stats.update();
    this.playerManager.update(deltaTime);
    this.enemyManager.OnUpdate(deltaTime);
    this.gunManager.updateBullets(deltaTime);
  }
}
