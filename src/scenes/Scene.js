import * as THREE from "three";

export default class Scene {
  constructor(camera) {
    this.m_Scene = new THREE.Scene();
    this.m_RequestSceneSwitch = false;
    this.m_SwitchScene;
  }

  SwitchScenes(newScene) {
    this.m_RequestSceneSwitch = true;
    this.m_SwitchScene = newScene;
  }

  OnBegin() {}

  OnUpdate(deltaTime) {}

  OnPreRender() {}

  OnUIRender() {}

  OnEnd() {}
}
