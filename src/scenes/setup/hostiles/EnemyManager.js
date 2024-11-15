import SuperZombie from "./SuperZombie";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import Spawner from "./EnemySpawner";
import { Pathfinding, PathfindingHelper } from "three-pathfinding";

export default class EnemyManager {
  constructor(scene, player, collisionManager) {
    this.scene = scene;
    this.player = player; // player mesh
    this.collisionManager = collisionManager;
    this.gltfLoader = new GLTFLoader();

    // Zombie spawning
    this.spawningEnabled = false;
    this.zombieSpawner = undefined;

    // Path finding specific variables
    this.pathFindingEnabled = false;
    this.pathFinder = new Pathfinding();
    this.pathFinderHelper = new PathfindingHelper();
    this.PathZone = 'zone';
    this.navmesh = undefined;
    this.groupID = undefined;
    this.pathfindingRefreshRate = 0.5; // times per second
    this.pathFindingRefresh = 1 / this.pathfindingRefreshRate;

    // Additional data
    this.totalPlayerDamage = 0;
    this.totalZombiesKilled = 0;

    this.SuperZombies = [];
    
    // difficulty specific variables
    this.DesiredZombieNum = 1;
    this.SpawningRate = 0.1; // times per second
    this.SpawningRefresh = 1 / this.SpawningRate;
  }

  toggleCollisionBoxVisibility(visible) {
    for (const zombie of this.SuperZombies) {
      if (zombie.SetupComplete) {
        zombie.toggleCollisionShapeVisibility(visible);
      }
    }
  }

  EnableEnemySpawning(spawnmeshFilepath){
    if (this.spawningEnabled)
      return;

    this.zombieSpawner = new Spawner(spawnmeshFilepath);
    this.spawningEnabled = true;
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

  ChangeDifficulty(desiredDifficulty){
    this.DesiredZombieNum = desiredDifficulty.ZombieNum;

    for (let zombie of this.SuperZombies){
      zombie.health = desiredDifficulty.ZombieHealth;
      zombie.speed = desiredDifficulty.ZombieSpeed;
      zombie.attackDamage = desiredDifficulty.ZombieAttackDamage;
    }
  }

  // returns the number of alive zombies.
  GetNumZombies(){
    let sum = 0;
    for (const zombie of this.SuperZombies){
      if (!zombie.isDead)
        sum++;
    }
    return sum;
  }

  UpdateSpawns(deltaTime){
    if (!this.spawningEnabled)
      return;

    this.SpawningRefresh -= deltaTime;

    if (this.SpawningRefresh > 0)
      return;

    const currentZombieNum = this.GetNumZombies();

    if (currentZombieNum < this.DesiredZombieNum / 2){ // if there are very few zombies, 
      let position = this.zombieSpawner.GetClosestSpawn(this.player.position) // spawn them closer to keep the game interesting
      const zombie = new SuperZombie(this.scene, this.collisionManager, position, this.player.position);
      this.SuperZombies.push(zombie);
    }
    else if (currentZombieNum < this.DesiredZombieNum){
      let position = this.zombieSpawner.GetRandomSpawn()
      const zombie = new SuperZombie(this.scene, this.collisionManager, position, this.player.position);
      this.SuperZombies.push(zombie);
    }

    this.pathFindingRefresh = 1 / this.pathfindingRefreshRate;
  }


  OnUpdate(deltaTime) {
    this.UpdateSpawns(deltaTime);

    var i = 0;
    this.pathFindingRefresh -= deltaTime;
    for (const zombie of this.SuperZombies) {
      if (zombie.SetupComplete && this.pathFindingEnabled && !zombie.disposed) {
        zombie.OnUpdate(deltaTime);
        this.totalPlayerDamage += zombie.PlayerDamage;
        zombie.PlayerDamage = 0;

        if (zombie.isDead){ // clean up some zombie resources
          zombie.colliders.forEach((collider) => {
            this.scene.remove(collider);
            collider.geometry.dispose(); // Free geometry memory
            collider.material.dispose(); // Free material memory
          });
          zombie.disposed = true;
          this.totalZombiesKilled++;
          continue;
        }

        // Zombie pathfinding
        if (!zombie.isMoving)
          continue;

        // Periodically refresh zombie path finding
        if (this.pathFindingRefresh < 0) {
          const zombiePos = zombie.mesh.position;
          let zombieTarget = zombie.targetPos.clone();
          zombieTarget.y = 0;
          const ZombieGroupID = this.pathFinder.getGroup(this.PathZone, zombiePos);
          const closestZombieNode = this.pathFinder.getClosestNode(zombiePos, this.PathZone, ZombieGroupID);
          
          //const TargetGroupID = this.pathFinder.getGroup(this.PathZone, zombieTarget);
          //const closestTargetNode = this.pathFinder.getClosestNode(zombieTarget, this.PathZone, TargetGroupID);
          const path = this.pathFinder.findPath(closestZombieNode.centroid, zombieTarget, this.PathZone, ZombieGroupID);
          
          zombie.SetPath(path);

          if (path && i == 0){ // debug path viewing
            this.pathFinderHelper.setPlayerPosition(zombiePos);
            this.pathFinderHelper.setTargetPosition(zombieTarget);
            this.pathFinderHelper.reset();
            this.pathFinderHelper.setPath(path);
          }
        }
        
        zombie.FollowPath();        
      }      
      i++;
    }

    if (this.pathFindingRefresh < 0)
      this.pathFindingRefresh = 1 / this.pathfindingRefreshRate;
  }

  // returns true if bullet hit a zombie, false otherwise.
  BulletHitCheck(origin, direction, camera, damage){
    const raycaster = new THREE.Raycaster();
    raycaster.camera = camera;
    raycaster.far = 300;
    raycaster.set(origin, direction);
    let hit = false;

    const intersectsEnvironment = raycaster.intersectObjects(this.scene.children, true);
    
    if (intersectsEnvironment.length > 1){
      const firstIntersect = intersectsEnvironment[1]; // 0 is the crosshair sprite surprisingly...
      if (firstIntersect.object.type === "SkinnedMesh"){ // We hit the zombie mesh first, so lets check where we hit the zombie
        if (intersectsEnvironment.length > 1){
          const secondIntersect = intersectsEnvironment[2];
          if (secondIntersect.object.isCollider){ // We hit the zombie
            secondIntersect.object.bulletHit = true;
            secondIntersect.object.bulletDamage = damage;
            hit = true;
          }
          else { 
            // We hit the zombie, but we don't know where
            hit = true;
          }
        }
        else { 
          // We hit the zombie, but we don't know where
          hit = true;
        }
      }
      else if (firstIntersect.object.isCollider){ // We hit the zombie
        firstIntersect.object.bulletHit = true;
        firstIntersect.object.bulletDamage = damage;
        hit = true;
      }
      else {
         // We hit nothing
      }
    }
    return hit;
  }
}