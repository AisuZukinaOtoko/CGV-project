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

    this.zombieNum = 1;
    this.SuperZombies = [];

    for (let i = 0; i < this.zombieNum; i++) {
      const initialPosition = new THREE.Vector3(6 * i, 0, -12);
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
         
         console.log(this.PathZone);
         this.pathFinder.setZoneData(this.PathZone, zone);
         console.log(this.PathZone);
        }
      });
      
      //this.navmesh = navmesh;
      this.scene.add(this.navmesh);
      this.pathFindingEnabled = true;
      this.scene.add(this.pathFinderHelper);
    });
  }


  OnUpdate(deltaTime) {
    var i = 0;
    for (const zombie of this.SuperZombies) {
      if (zombie.SetupComplete && this.pathFindingEnabled) {
        zombie.OnUpdate(deltaTime);

        // Zombie pathfinding
        if (!zombie.isMoving)
          continue;

        const zombiePos = zombie.mesh.position;
        let zombieTarget = zombie.targetPos.clone();
        zombieTarget.y = 0;
        const ZombieGroupID = this.pathFinder.getGroup(this.PathZone, zombiePos);
        const closestZombieNode = this.pathFinder.getClosestNode(zombiePos, this.PathZone, ZombieGroupID);
        
        const TargetGroupID = this.pathFinder.getGroup(this.PathZone, zombieTarget);
        const closestTargetNode = this.pathFinder.getClosestNode(zombieTarget, this.PathZone, TargetGroupID);
        const path = this.pathFinder.findPath(closestZombieNode.centroid, zombieTarget, this.PathZone, ZombieGroupID);
        //const path = this.pathFinder.findPath(closestZombieNode.centroid, closestTargetNode.centroid, this.PathZone, ZombieGroupID);
        
        zombie.FollowPath(path);
        //console.log("Yea");
        //let path = this.pathFinder.findPath(zombie.mesh.position, target, this.PathZone);
        
        if (path && i == 0){
          //console.log("Zombie moving");
          this.pathFinderHelper.setPlayerPosition(zombiePos);
          this.pathFinderHelper.setTargetPosition(zombieTarget);
          this.pathFinderHelper.reset();
          this.pathFinderHelper.setPath(path);
        }
      }      
      i++;
    }
  }
}
