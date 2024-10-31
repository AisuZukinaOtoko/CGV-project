import SuperZombie from "./SuperZombie";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Pathfinding, PathfindingHelper } from "three-pathfinding";

export default class EnemyManager {
  constructor(scene, player, collisionManager, gameUI) {
    this.scene = scene;
    this.player = player; // player mesh
    this.collisionManager = collisionManager;
    this.gltfLoader = new GLTFLoader();
    this.gameUI = gameUI;
    this.pathFindingEnabled = false;
    this.pathFinder = new Pathfinding();
    this.pathFinderHelper = new PathfindingHelper();
    this.PathZone = "zone";
    this.navmesh = undefined;
    this.groupID = undefined;

    this.zombieNum = 5;
    this.SuperZombies = [];
    this.spawnInitialZombies();
  }

  spawnInitialZombies() {
    for (let i = 0; i < this.zombieNum; i++) {
      const initialPosition = new THREE.Vector3(6 * i, 0, -15);
      const zombie = new SuperZombie(
        this.scene,
        this.collisionManager,
        initialPosition,
        this.player.position
      );
      this.SuperZombies.push(zombie);
    }
  }

  spawnAdditionalZombies(count) {
    for (let i = 0; i < count; i++) {
      const randomX = (Math.random() - 0.5) * 60;
      const randomZ = (Math.random() - 0.5) * 60;
      //const initialPosition = new THREE.Vector3(randomX, 0, randomZ);
      const initialPosition = new THREE.Vector3(6 * i, 0, -15);
      const zombie = new SuperZombie(
        this.scene,
        this.collisionManager,
        initialPosition,
        this.player.position
      );
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

  EnablePathFinding(navmeshFilepath) {
    if (this.pathFindingEnabled)
      // initially false
      return;

    this.gltfLoader.load(navmeshFilepath, (gltf) => {
      gltf.scene.traverse((node) => {
        if (node.isMesh && node.geometry) {
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

        if (zombie.isDead) {
          // clean up zombie resources
          zombie.colliders.forEach((collider) => {
            this.scene.remove(collider);
            collider.geometry.dispose();
            collider.material.dispose();
          });
          zombie.disposed = true;
          if (this.gameUI) {
            this.gameUI.incrementKills(); // Increment kill counter
          }
          continue;
        }

        // Skip pathfinding if zombie isn't moving
        if (!zombie.isMoving) continue;

        const zombiePos = zombie.mesh.position;
        let zombieTarget = zombie.targetPos.clone();
        zombieTarget.y = 0;
        const ZombieGroupID = this.pathFinder.getGroup(
          this.PathZone,
          zombiePos
        );
        const closestZombieNode = this.pathFinder.getClosestNode(
          zombiePos,
          this.PathZone,
          ZombieGroupID
        );

        const path = this.pathFinder.findPath(
          closestZombieNode.centroid,
          zombieTarget,
          this.PathZone,
          ZombieGroupID
        );

        zombie.FollowPath(path);
      }
      i++;
    }
  }

  setGameUI(gameUI) {
    this.gameUI = gameUI;
  }

  cleanupZombie(zombie) {
    if (zombie.disposed) return;

    // Cleanup animations
    if (zombie.mixer) {
      zombie.mixer.stopAllAction();
      zombie.mixer.uncacheRoot(zombie.mesh);
    }

    // Cleanup colliders
    zombie.colliders.forEach((collider) => {
      this.scene.remove(collider);
      if (collider.geometry) collider.geometry.dispose();
      if (collider.material) collider.material.dispose();
    });

    // Cleanup mesh
    if (zombie.mesh) {
      this.scene.remove(zombie.mesh);
      if (zombie.mesh.geometry) zombie.mesh.geometry.dispose();
      if (zombie.mesh.material) {
        if (Array.isArray(zombie.mesh.material)) {
          zombie.mesh.material.forEach((material) => material.dispose());
        } else {
          zombie.mesh.material.dispose();
        }
      }
    }

    zombie.disposed = true;
  }

  updateZombiePathfinding(zombie) {
    const zombiePos = zombie.mesh.position;
    let zombieTarget = zombie.targetPos.clone();
    zombieTarget.y = 0;

    // Get the group ID for the zombie's current position
    const zombieGroupID = this.pathFinder.getGroup(this.PathZone, zombiePos);

    // Find the closest node to the zombie
    const closestZombieNode = this.pathFinder.getClosestNode(
      zombiePos,
      this.PathZone,
      zombieGroupID
    );

    // Calculate path
    const path = this.pathFinder.findPath(
      closestZombieNode.centroid,
      zombieTarget,
      this.PathZone,
      zombieGroupID
    );

    // Update zombie's path
    zombie.FollowPath(path);
  }

  // returns true if bullet hit a zombie, false otherwise.
  BulletHitCheck(origin, direction, camera, damage) {
    const raycaster = new THREE.Raycaster();
    raycaster.camera = camera;
    raycaster.far = 300;
    raycaster.set(origin, direction);

    // Only check active zombies' colliders
    const activeColliders = this.SuperZombies.filter(
      (z) => !z.disposed && z.SetupComplete
    ).flatMap((z) => z.colliders);

    const intersects = raycaster.intersectObjects(activeColliders, false);

    if (intersects.length > 0) {
      const hit = intersects[0];
      if (hit.object.isCollider) {
        hit.object.bulletHit = true;
        hit.object.bulletDamage = damage;
        return true;
      }
    }
    return false;
  }
}
