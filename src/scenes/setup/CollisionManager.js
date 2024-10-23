import * as THREE from "three";

export class CollisionManager {
  constructor(scene) {
    this.scene = scene;
    this.collidableMeshList = [];
    this.raycaster = new THREE.Raycaster();
  }

  addCollidableObject(object) {
    this.collidableMeshList.push(object);
  }

  checkCollision(position, quaternion) {
    const collisionDistance = 0.3;
    const directions = [
      new THREE.Vector3(0, 0, -1),
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(1, 0, 0),
    ];

    for (let dir of directions) {
      dir.applyQuaternion(quaternion);
      this.raycaster.set(position, dir);
      const intersects = this.raycaster.intersectObjects(
        this.collidableMeshList,
        false
      );
      if (intersects.length > 0 && intersects[0].distance < collisionDistance) {
        return true;
      }
    }
    return false;
  }
}
