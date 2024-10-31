import SuperZombie from "./SuperZombie";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Pathfinding, PathfindingHelper } from "three-pathfinding";

export default class EnemyManager {
  constructor(scene, player, collisionManager) {
    this.scene = scene;
    this.player = player; // player mesh
    this.collisionManager = collisionManager;
    this.gltfLoader = new GLTFLoader();

    this.pathFindingEnabled = false;
    this.pathFinder = new Pathfinding();
    this.pathFinderHelper = new PathfindingHelper();
    this.PathZone = 'zone';
    this.navmesh = undefined;
    this.groupID = undefined;

    this.zombieNum = 5;
    this.SuperZombies = [];

    for (let i = 0; i < this.zombieNum; i++) {
      const initialPosition = new THREE.Vector3(6 * i, 0, -15);
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

  EnablePathFinding(navmeshFilepath){
    if (this.pathFindingEnabled) // initially false
      return;

    this.gltfLoader.load(navmeshFilepath, (gltf) => {
      gltf.scene.traverse( (node) => {
        if (node.isMesh && node.geometry){
         this.navmesh = node;
         const zone = Pathfinding.createZone(this.navmesh.geometry);         
         this.pathFinder.setZoneData(this.PathZone, zone);
        }
      });
      
      this.pathFindingEnabled = true;
      this.scene.add(this.pathFinderHelper);
    });
  }


  OnUpdate(deltaTime) {
    var i = 0;
    for (const zombie of this.SuperZombies) {
      if (zombie.SetupComplete && this.pathFindingEnabled && !zombie.disposed) {
        zombie.OnUpdate(deltaTime);

        if (zombie.isDead){ // clean up some zombie resources
          zombie.colliders.forEach((collider) => {
            this.scene.remove(collider);
            collider.geometry.dispose(); // Free geometry memory
            collider.material.dispose(); // Free material memory
          });
          zombie.disposed = true;
          continue;
        }

        // Zombie pathfinding
        if (!zombie.isMoving)
          continue;

        const zombiePos = zombie.mesh.position;
        let zombieTarget = zombie.targetPos.clone();
        zombieTarget.y = 0;
        const ZombieGroupID = this.pathFinder.getGroup(this.PathZone, zombiePos);
        const closestZombieNode = this.pathFinder.getClosestNode(zombiePos, this.PathZone, ZombieGroupID);
        
        //const TargetGroupID = this.pathFinder.getGroup(this.PathZone, zombieTarget);
        //const closestTargetNode = this.pathFinder.getClosestNode(zombieTarget, this.PathZone, TargetGroupID);
        const path = this.pathFinder.findPath(closestZombieNode.centroid, zombieTarget, this.PathZone, ZombieGroupID);
        
        zombie.FollowPath(path);
        
        if (path && i == 0){ // debug path viewing
          this.pathFinderHelper.setPlayerPosition(zombiePos);
          this.pathFinderHelper.setTargetPosition(zombieTarget);
          this.pathFinderHelper.reset();
          this.pathFinderHelper.setPath(path);
        }
      }      
      i++;
    }

  }

  // returns true if bullet hit a zombie, false otherwise.
  BulletHitCheck(origin, direction, camera, damage){
    const raycaster = new THREE.Raycaster();
    raycaster.camera = camera;
    raycaster.far = 300;
    raycaster.set(origin, direction);

    const intersectsEnvironment = raycaster.intersectObjects(this.scene.children, true);
    
    if (intersectsEnvironment.length > 1){
      const firstIntersect = intersectsEnvironment[1]; // 0 is the crosshair sprite surprisingly...
      if (firstIntersect.object.type === "SkinnedMesh"){ // We hit the zombie mesh first, so lets check where we hit the zombie
        if (intersectsEnvironment.length > 1){
          const secondIntersect = intersectsEnvironment[2];
          if (secondIntersect.object.isCollider){ // We hit the zombie
            secondIntersect.object.bulletHit = true;
            secondIntersect.object.bulletDamage = damage;
          }
          else { 
            // We hit the zombie, but we don't know where
          }
        }
        else { 
          // We hit the zombie, but we don't know where
        }
      }
      else if (firstIntersect.object.isCollider){ // We hit the zombie
        firstIntersect.object.bulletHit = true;
        firstIntersect.object.bulletDamage = damage;
      }
      else {
         // We hit nothing
      }
    }
  }
}
