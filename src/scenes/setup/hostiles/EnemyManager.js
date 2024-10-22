import SuperZombie from "./SuperZombie";
import * as THREE from "three";

export default class EnemyManager {
  constructor(scene, player, collisionManager) {
    this.scene = scene;
    this.player = player; // player mesh
    this.collisionManager = collisionManager;

    this.zombieNum = 2;
    this.SuperZombies = [];

    for (let i = 0; i < this.zombieNum; i++) {
      const initialPosition = new THREE.Vector3(2 * i, 0, -10);
      const zombie = new SuperZombie(this.scene, this.collisionManager, initialPosition, this.player.position);
      this.SuperZombies.push(zombie);
    }
  }

  toggleCollisionBoxVisibility(visible) {
    for (const zombie of this.SuperZombies) {
      if (zombie.SetupComplete) {
        zombie.toggleCollisionShapeVisibility(visible);
      }
    }
  }

  OnUpdate(deltaTime) {
    var i = 0;
    for (const zombie of this.SuperZombies) {
      if (zombie.SetupComplete) {
        zombie.OnUpdate(deltaTime);
      }
      i++;
    }
  }
}
