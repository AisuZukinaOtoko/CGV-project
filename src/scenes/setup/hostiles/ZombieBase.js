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
      this.immediateDestination = new THREE.Vector3(0, 0, 0); // next destination on the path to the target
      this.health = 100;
      this.legHealth = 50;
      this.sightDistance = 30;
      this.smellDistance = 10;
      this.attackDistance = 3;
      this.attackCooldown = false;
      this.speed = 1;
      this.isAggravated = false;  // Placeholder for when the zombie is aggravated by the player
      this.playerDamage = 0;
      this.deltaTime = 0;
      this.isMoving = false;
      this.noPath = false; // true if no path to destination is found -> zombie to idle
      this.isDead = false; // false = still being updated. Animations etc
      this.disposed = false; // memory cleaned
    }

    OnUpdate(delta) {
        this.stateMachine.update();
    }

    FollowPath(path){
      let pathTarget;

      if (!path || path.length <= 0){
        pathTarget = this.immediateDestination;
        //return;
      }
      else {
        pathTarget = path[0];
        this.noPath = false;
        this.immediateDestination = pathTarget;
      }

      var distance = pathTarget.clone().sub(this.mesh.position);

      if (distance.lengthSq() > this.speed * 0.01){
        distance.normalize();
        this.mesh.position.add(distance.multiplyScalar(this.speed * this.deltaTime));
        this.LookAt(pathTarget);
        //this.mesh.rotation.x = 0; // remove later
      } else{ // move on to next node in the path
        this.mesh.position.copy(pathTarget);
        if (!path){
          this.noPath = true;
          return;
        }
        
        path.shift();
        if (path.length == 0){
          this.noPath = true;
          return;
        }
        
        pathTarget = path[0];
        distance = pathTarget.clone().sub(this.mesh.position);
        distance.normalize();
        this.mesh.position.add(distance.multiplyScalar(0.5));
        //this.mesh.position.add(distance.multiplyScalar(this.speed * this.deltaTime));
        this.LookAt(pathTarget);
        //console.log(distance);
      }
    }

    MoveToTarget(){
      return;
      // Get the current position of the mesh
      const meshPosition = this.mesh.position.clone();
      
      // Calculate the direction vector from the mesh to the player
      const targetDirection = new THREE.Vector3();
      targetDirection.subVectors(this.targetPos, meshPosition).normalize();

      // Calculate the target angle using Math.atan2
      const targetYAngle = Math.atan2(targetDirection.x, targetDirection.z); // Assuming forward is along the Z-axis
      this.mesh.rotation.y = targetYAngle;
      
      if (this.CanSeeTarget(this.targetPos)){
        targetDirection.multiplyScalar(this.speed * this.deltaTime);
        this.mesh.position.x += targetDirection.x;
        this.mesh.position.z += targetDirection.z;
      }
    }

    LookAt(target){
      this.mesh.lookAt(target);
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
