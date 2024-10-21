import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export default class Zombie extends THREE.Object3D {
  constructor() {
    super();
    this.health = 100;
    this.speed = 1;
  }

  OnUpdate(deltaTime) {}

  ResetAllActions() {}
}
