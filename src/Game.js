import * as THREE from "three";
import StartScene from "./scenes/StartupScene.js";

export default class Game {
  constructor() {
    this.m_MainCamera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.m_CurrentScene;

    // Game initialisations
    this.m_Renderer = new THREE.WebGLRenderer({
      canvas: document.querySelector("#Main-Canvas"),
    });
    this.m_Renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.m_Renderer.domElement);
    this.m_Clock = new THREE.Clock();

    // Initialize the first scene
    this.StartNewScene(StartScene);
  }

  StartNewScene(SceneClass) {
    if (this.m_CurrentScene != undefined) {
      this.m_CurrentScene.OnEnd();
    }
    this.m_CurrentScene = new SceneClass(this.m_MainCamera, this.m_Renderer);
    this.m_CurrentScene.OnBegin();
  }

  // Main game loop
  Run = () => {
    requestAnimationFrame(this.Run);
    if (this.m_CurrentScene.m_RequestSceneSwitch) {
      this.StartNewScene(this.m_CurrentScene.m_SwitchScene);
    }
    const delta = this.m_Clock.getDelta();
    this.m_CurrentScene.OnUpdate(delta);
    this.m_CurrentScene.OnPreRender();

    this.m_Renderer.render(this.m_CurrentScene.m_Scene, this.m_MainCamera);

    this.m_CurrentScene.OnUIRender();
  };

  OnWindowResize = () => {
    this.m_Renderer.setSize(window.innerWidth, window.innerHeight);
    this.m_MainCamera.aspect = window.innerWidth / window.innerHeight;
    this.m_MainCamera.updateProjectionMatrix();
  };

  StartNewScene(newScene) {
    if (this.m_CurrentScene != undefined) {
      this.m_CurrentScene.OnEnd();
    }
    this.m_CurrentScene = new newScene(this.m_MainCamera, this.m_Renderer);
    this.m_CurrentScene.OnBegin();
  }
}
