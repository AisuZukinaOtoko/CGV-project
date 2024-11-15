import * as THREE from "three";
import StartScene from "./scenes/setup/StartupScene.js";
export default class Game {
  constructor() {
    this.m_MainCamera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.m_CurrentScene;
    this.paused = false;

    // Game initialisations
    this.m_Renderer = new THREE.WebGLRenderer({
      canvas: document.querySelector("#Main-Canvas"),
    });
    this.m_Renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.m_Renderer.domElement);
    this.m_Clock = new THREE.Clock();

    // Initialize the first scene
    this.StartNewScene(StartScene);

    // ---- START --> Block of code starting from 28-36 handle the pause

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          this.paused = true; // Toggle pause state when ESC is pressed, show the game over menu by pressing q or Q (chnage this when health is 0)
        }
      });

      document.getElementById("start-button").addEventListener("click", () => {
        this.paused = false;
      });

    // ---- END
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

    if(this.m_CurrentScene.isGameOver){
      this.m_CurrentScene.gameUI.pauseTimer();
      this.paused = true;
    }
    if(this.m_CurrentScene.gameUI.timeRemaining == 0){
      this.paused = true;
    }

    /* logic to pause and resume start */ 

      let delta;

      if (this.paused){
        delta = this.m_Clock.getDelta();
        delta = 0;
        return;
      }else{
        delta = this.m_Clock.getDelta();
      }

    /* logic to pause and resume end */ 


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
