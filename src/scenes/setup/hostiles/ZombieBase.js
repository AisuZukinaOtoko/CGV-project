import * as THREE from 'three';
import { GameEntity, State, StateMachine, Vector3 } from 'yuka';

export const IDLE = "0";
export const WALKING = "1";
export const AGGRAVATED = "2";
export const ATTACK = "3";
export const INJURED = "4";
export const STARTLED = "5";
export const DEAD = "6";

export default class Zombie extends GameEntity {
    constructor(playerPos) {
        super();
        this.stateMachine = new StateMachine(this);
        this.playerPos = playerPos;
        this.targetPos = new THREE.Vector3(0, 0, 0);
        this.health = 100;
        this.sightDistance = 10;
        this.smellDistance = 10;
        this.attackDistance = 3;
        this.speed = 1;
        this.isAggravated = false;  // Placeholder for when the zombie is aggravated by the player
        this.deltaTime = 0;
    }

    OnUpdate(delta) {
        this.stateMachine.update();
    }

    MoveToTarget(){
      // Get the current position of the mesh
      const meshPosition = this.mesh.position.clone();
      
      // Calculate the direction vector from the mesh to the player
      const targetDirection = new THREE.Vector3();
      targetDirection.subVectors(this.targetPos, meshPosition).normalize();

      // Calculate the target angle using Math.atan2
      const targetYAngle = Math.atan2(targetDirection.x, targetDirection.z); // Assuming forward is along the Z-axis

      // Smoothly interpolate the mesh's Y rotation towards the target angle
      //this.mesh.rotation.y += THREE.MathUtils.euclideanDistance(this.mesh.rotation.y, targetYAngle) * this.speed * this.deltaTime * 5;
      const difference = this.mesh.rotation.y - targetYAngle
      this.mesh.rotation.y += (difference / Math.abs(difference)) * this.speed * this.deltaTime;
      //this.mesh.rotation.y = THREE.MathUtils.lerpAngle(this.mesh.rotation.y, targetYAngle, this.speed * this.deltaTime * 5);

      // const meshPosition = this.mesh.position.clone();
      // const directionToTarget = new THREE.Vector3();
      // directionToTarget.subVectors(this.playerPos, meshPosition).normalize();
  
      // // Calculate the target angle using the direction vector
      // const targetQuaternion = new THREE.Quaternion();
      // targetQuaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), directionToTarget);
  
      // const currentQuaternion = this.mesh.quaternion.clone();
      // const newQuaternion = new THREE.Quaternion();
      // newQuaternion.slerpQuaternions(currentQuaternion, targetQuaternion, 0.5 * this.deltaTime);

      // this.mesh.quaternion.copy(newQuaternion);

      if (this.CanSeeTarget(this.targetPos)){
        targetDirection.multiplyScalar(this.speed * this.deltaTime);
        this.mesh.position.x += targetDirection.x;
        this.mesh.position.z += targetDirection.z;
      }
    }

    // Vector 3 target
    CanSeeTarget(target){
      const zombieLookDirection = new THREE.Vector3(0, 0, -1);
      zombieLookDirection.applyQuaternion(this.mesh.quaternion);
      zombieLookDirection.normalize();

      const directionToTarget = new THREE.Vector3();
      directionToTarget.subVectors(target, this.mesh.position);
      directionToTarget.normalize();

      const dotProduct = zombieLookDirection.dot(directionToTarget);
      return (this.mesh.position.distanceTo(target) < this.sightDistance) && (dotProduct < 0);
    }

    CanSeePlayer(){
      return this.CanSeeTarget(this.playerPos);
    }

    CanSmellPlayer(){
        return this.mesh.position.distanceTo(this.playerPos) < this.smellDistance;
    }

    CanAttack(){
        return this.mesh.position.distanceTo(this.playerPos) < this.attackDistance;
    }
}
