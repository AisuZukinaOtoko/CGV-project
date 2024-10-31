import * as THREE from "three";
import Collider, {
  HEAD,
  HAND,
  TORSO,
  LEFTLEGDOWN,
  RIGHTLEGDOWN,
  LEFTLEGUP,
  RIGHTLEGUP,
} from "./ZombieCollider";
import Zombie from "./ZombieBase";
import { IDLE, WALKING, AGGRAVATED, ATTACK, INJURED, STARTLED, DEAD } from './ZombieBase';
import { GameEntity, State, StateMachine, Vector3 } from 'yuka';
import { InitState, IdleState, WalkingState, AggravatedState, AttackState, InjuredState, StartledState, DeadState } from './SuperZombieStates'
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";


export default class SuperZombie extends Zombie {
  constructor(scene, collisionManager, initialPosition = new THREE.Vector3(0, 20, 20), playerPosition) {
    super(playerPosition);

    if (!collisionManager || typeof collisionManager.addCollidableObject !== "function" ||
      typeof collisionManager.checkCollision !== "function" ) {
      console.error("Invalid collisionManager provided to SuperZombie");
    }

    this.mixer = null;
    this.runAction = null;
    this.idleAction = null;
    this.screamAction = null;
    this.crawlAction = null;
    this.dieForwardAction = null;
    this.dieBackAction = null;
    this.attackAction = null;
    this.mesh = null;
    this.collisionShapes = null;
    this.IsWalking = false;
    this.isRunning = false;
    this.SetupComplete = false;
    this.collisionManager = collisionManager;
    this.speed = 0.5;
    this.movementVector = new THREE.Vector3(0, 0, 1);
    this.deltaTime = null;
    this.PlayerDamage = 0;

    // zombie state setup
    this.stateMachine.add(10000, new InitState());
    this.stateMachine.add(IDLE, new IdleState());
    this.stateMachine.add(WALKING, new WalkingState());
    this.stateMachine.add(AGGRAVATED, new AggravatedState());
    this.stateMachine.add(ATTACK, new AttackState());
    this.stateMachine.add(INJURED, new InjuredState());
    this.stateMachine.add(STARTLED, new StartledState());
    this.stateMachine.add(DEAD, new DeadState());
    this.stateMachine.changeTo(10000);

    // Load the zombie model and animations
    const loader = new GLTFLoader();
    loader.load(
      "src/assets/Zombies/super.glb",
      (gltf) => {
        this.mesh = gltf.scene;
        this.mesh.scale.set(1.2, 1.2, 1.2);
        this.mesh.position.copy(initialPosition);

        this.CreateSkeletalColliders(scene);
        this.setupAnimations(gltf);

        scene.add(this.mesh);
        this.SetupComplete = true;
        this.isRunning = true;
        
        
      },
      undefined,
      (error) => {
        console.error("An error occurred while loading the model:", error);
      }
    );
  }

  CreateSkeletalColliders(scene) {
    this.mesh.traverse((child) => {
      if (child.isSkinnedMesh) {
        const skeleton = child.skeleton;
        this.headBone = skeleton.bones.find(
          (bone) => bone.name === "mixamorigHead"
        );
        this.spineBone = skeleton.bones.find(
          (bone) => bone.name === "mixamorigSpine1"
        );
        this.leftLegDownBone = skeleton.bones.find(
          (bone) => bone.name === "mixamorigLeftLeg"
        );
        this.leftLegUpBone = skeleton.bones.find(
          (bone) => bone.name === "mixamorigLeftUpLeg"
        );
        this.rightLegDownBone = skeleton.bones.find(
          (bone) => bone.name === "mixamorigRightLeg"
        );
        this.rightLegUpBone = skeleton.bones.find(
          (bone) => bone.name === "mixamorigRightUpLeg"
        );
        this.rightForeArmBone = skeleton.bones.find(
          (bone) => bone.name === "mixamorigRightHandIndex2"
        );

        const colliderMaterial = new THREE.MeshBasicMaterial({
          color: 0x00ff00,
          transparent: true,
          opacity: 0.5,
          wireframe: true,
        });
        this.colliders = [
          new Collider(sharedGeometries.head, sharedMaterial, HEAD),
          new Collider(sharedGeometries.body, sharedMaterial, TORSO),
          new Collider(sharedGeometries.legUp, sharedMaterial, LEFTLEGUP),
          new Collider(sharedGeometries.legUp, sharedMaterial, RIGHTLEGUP),
          new Collider(sharedGeometries.legDown, sharedMaterial, LEFTLEGDOWN),
          new Collider(sharedGeometries.legDown, sharedMaterial, RIGHTLEGDOWN),
          new Collider(sharedGeometries.arm, sharedMaterial, HAND),
        ];

        this.colliders.forEach((collider) => scene.add(collider));
      }
    });
  }

  toggleCollisionShapeVisibility(visible) {
    if (this.collisionShape) {
      this.collisionShape.visible = visible;
    }
  }

  setupAnimations(gltf) {
    if (!this.mesh || !gltf.animations) return;

    this.mixer = new THREE.AnimationMixer(this.mesh);

    // Define animations
    this.dieBackAction = this.mixer.clipAction(gltf.animations[0]);
    this.crawlAction = this.mixer.clipAction(gltf.animations[1]);
    this.dieForwardAction = this.mixer.clipAction(gltf.animations[2]);
    this.hurtCrawlAction = this.mixer.clipAction(gltf.animations[3]);
    this.attackAction = this.mixer.clipAction(gltf.animations[4]);
    this.runAction = this.mixer.clipAction(gltf.animations[5]);
    this.idleAction = this.mixer.clipAction(gltf.animations[6]);
    //this.screamAction = this.mixer.clipAction(gltf.animations[1]);

    // Adjust run animation speed to match desired movement speed
    //const runSpeed = this.speed / this.movementVector.length();
    //this.runAction.setEffectiveTimeScale(runSpeed);

    // Start with idle
    this.idleAction.play();
  }

  OnUpdate(deltaTime) {
    this.deltaTime = deltaTime;
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }
    
    this.stateMachine.update();

    // if (this.isRunning && !this.checkCollision()) {
    //   const movement = this.movementVector
    //     .clone()
    //     .multiplyScalar(this.speed * deltaTime);
    //   this.mesh.position.add(movement);
    // }
  }

  checkCollision() {
    if (
      this.collisionManager &&
      typeof this.collisionManager.checkCollision === "function"
    ) {
      return this.collisionManager.checkCollision(
        this.mesh.position,
        this.mesh.quaternion
      );
    } else {
      console.warn(
        "CollisionManager or checkCollision method is not properly initialized"
      );
      return false; // Assume no collision if the method is not available
    }
  }

  checkCollisionWithBullet(bullet) {
    // Implement precise collision detection with bullets
    // This might involve raycasting or checking intersection with the convex hull
    // For simplicity, we'll use a sphere collision for now
    const zombiePosition = new THREE.Vector3();
    this.mesh.getWorldPosition(zombiePosition);
    const distance = zombiePosition.distanceTo(bullet.position);
    return distance < 1; // Adjust the collision radius as needed
  }

  ResetAllActions() {
    this.idleAction.stop();
    //this.screamAction.stop();
    this.hurtCrawlAction.stop();
    this.attackAction.stop();
    this.crawlAction.stop();
    this.dieForwardAction.stop();
    this.dieBackAction.stop();
    this.runAction.stop();
  }

  BlendAction(newAction) {
    if (!this.mixer || !newAction) {
      console.warn("Cannot blend - mixer or action not available");
      return;
    }

    const currentAction = this.mixer._actions.find(
      (action) => action.isRunning() && action.weight > 0
    );

    if (currentAction === newAction) return;

    newAction.reset();
    newAction.setEffectiveTimeScale(1);
    newAction.setEffectiveWeight(1);

    if (currentAction) {
      currentAction.fadeOut(0.3);
    }

    newAction.fadeIn(0.3);
    newAction.play();
  }

  cleanup() {
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer.uncacheRoot(this.mesh);
    }

    if (this.actions) {
      for (const action of Object.values(this.actions)) {
        if (action) {
          action.stop();
        }
      }
    }

    this.actions = null;
    this.mixer = null;
  }
}
