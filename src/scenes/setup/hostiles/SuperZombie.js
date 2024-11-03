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
import {
  IDLE,
  WALKING,
  AGGRAVATED,
  ATTACK,
  INJURED,
  STARTLED,
  DEAD,
} from "./ZombieBase";
import { GameEntity, State, StateMachine, Vector3 } from "yuka";
import {
  InitState,
  IdleState,
  WalkingState,
  AggravatedState,
  AttackState,
  InjuredState,
  StartledState,
  DeadState,
} from "./SuperZombieStates";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import zombie from "/Zombies/super.glb";

const sharedGeometries = {
  head: new THREE.SphereGeometry(0.2, 8, 8),
  body: new THREE.BoxGeometry(0.5, 1, 0.3),
  legUp: new THREE.BoxGeometry(0.25, 0.5, 0.25),
  legDown: new THREE.BoxGeometry(0.25, 0.5, 0.25),
  arm: new THREE.SphereGeometry(0.13, 8, 8),
};

const sharedMaterial = new THREE.MeshBasicMaterial({
  color: 0xff0000,
  transparent: true,
  opacity: 0.5,
  wireframe: true,
});

export default class SuperZombie extends Zombie {
  constructor(
    scene,
    collisionManager,
    initialPosition = new THREE.Vector3(0, 20, 20),
    playerPosition
  ) {
    super(playerPosition);

    if (
      !collisionManager ||
      typeof collisionManager.addCollidableObject !== "function" ||
      typeof collisionManager.checkCollision !== "function"
    ) {
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
    this.speed = 1.1;
    this.movementVector = new THREE.Vector3(0, 0, 1);
    this.deltaTime = null;
    this.PlayerDamage = 0;

    this.colliders = [];
    this.BoneColliders = [];
    this.headBone;
    this.spineBone;
    this.leftLegUpBone;
    this.leftLegDownBone;
    this.rightLegUpBone;
    this.rightLegDownBone;
    this.rightForeArmBone;
    this.headCollider;
    this.spineCollider;
    this.leftLegUpCollider;
    this.rightLegUpCollider;
    this.leftLegDownCollider;
    this.rightLegDownCollider;
    this.rightForeArmCollider;

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
      zombie,
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
        this.colliders.forEach((collider) => collider.visible = false);
      }
    });
  }

  toggleCollisionShapeVisibility(visible) {
    if (this.collisionShape) {
      this.collisionShape.visible = visible;
    }
  }

  SetSpeed(speed){
    this.speed = speed;
    this.dieBackAction.timeScale = speed;
    this.crawlAction.timeScale = speed;
    this.dieForwardAction.timeScale = speed;
    this.hurtCrawlAction.timeScale = speed;
    this.attackAction.timeScale = speed;
    this.runAction.timeScale = speed;
    this.idleAction.timeScale = speed;
  }

  setupAnimations(gltf) {
    if (!this.mesh || !gltf.animations) return;

    this.mixer = new THREE.AnimationMixer(this.mesh);

    // Store animation clips
    this.animations = {
      dieBack: gltf.animations[0],
      crawl: gltf.animations[1],
      dieForward: gltf.animations[2],
      hurtCrawl: gltf.animations[3],
      attack: gltf.animations[4],
      run: gltf.animations[5],
      idle: gltf.animations[6],
    };

    // Create all actions
    this.dieBackAction = this.mixer.clipAction(this.animations.dieBack);
    this.crawlAction = this.mixer.clipAction(this.animations.crawl);
    this.dieForwardAction = this.mixer.clipAction(this.animations.dieForward);
    this.hurtCrawlAction = this.mixer.clipAction(this.animations.hurtCrawl);
    this.attackAction = this.mixer.clipAction(this.animations.attack);
    this.runAction = this.mixer.clipAction(this.animations.run);
    this.idleAction = this.mixer.clipAction(this.animations.idle);

    // Configure special animations
    this.dieBackAction.loop = THREE.LoopOnce;
    this.dieForwardAction.loop = THREE.LoopOnce;
    this.dieBackAction.clampWhenFinished = true;
    this.dieForwardAction.clampWhenFinished = true;

    // Start with idle
    this.idleAction.play();
  }

  OnUpdate(deltaTime) {
    if (!this.SetupComplete) return;

    this.deltaTime = deltaTime;

    try {
      if (this.mixer) {
        this.mixer.update(deltaTime);
      }

      this.stateMachine.update();
      this.UpdateColliders();
    } catch (error) {
      console.warn("Error in zombie update:", error);
    }
  }

  UpdateColliders() {
    for (let collider of this.colliders) {
      switch (collider.type) {
        case HEAD:
          collider.position.copy(
            this.headBone.getWorldPosition(new THREE.Vector3())
          );
          collider.updateMatrixWorld();
          if (collider.bulletHit) {
            this.health -= collider.bulletDamage * 3;
            collider.bulletHit = false;
          }
          break;

        case TORSO:
          collider.quaternion.copy(
            this.spineBone.getWorldQuaternion(new THREE.Quaternion())
          );
          collider.position.copy(
            this.spineBone
              .getWorldPosition(new THREE.Vector3())
              .add(new THREE.Vector3(0, 0, 0))
          );
          collider.updateMatrixWorld();
          if (collider.bulletHit) {
            this.health -= collider.bulletDamage * 1.5;
            collider.bulletHit = false;
          }
          break;

        case HAND:
          collider.position.copy(
            this.rightForeArmBone
              .getWorldPosition(new THREE.Vector3())
              .add(new THREE.Vector3(0, 0, 0))
          );
          collider.quaternion.copy(
            this.rightForeArmBone.getWorldQuaternion(new THREE.Quaternion())
          );
          collider.updateMatrixWorld();
          break;

        case LEFTLEGUP:
          collider.position.copy(
            this.leftLegUpBone
              .getWorldPosition(new THREE.Vector3())
              .add(new THREE.Vector3(0, -0.2, 0.1))
          );
          collider.quaternion.copy(
            this.leftLegUpBone.getWorldQuaternion(new THREE.Quaternion())
          );
          collider.updateMatrixWorld();
          if (collider.bulletHit) {
            this.health -= collider.bulletDamage * 0.8;
            this.legHealth -= collider.bulletDamage;
            collider.bulletHit = false;
          }
          break;

        case LEFTLEGDOWN:
          collider.position.copy(
            this.leftLegDownBone
              .getWorldPosition(new THREE.Vector3())
              .add(new THREE.Vector3(0, -0.2, -0.05))
          );
          collider.quaternion.copy(
            this.leftLegDownBone.getWorldQuaternion(new THREE.Quaternion())
          );
          collider.updateMatrixWorld();
          if (collider.bulletHit) {
            this.health -= collider.bulletDamage;
            this.legHealth -= collider.bulletDamage * 1.3;
            collider.bulletHit = false;
          }
          break;

        case RIGHTLEGUP:
          collider.position.copy(
            this.rightLegUpBone
              .getWorldPosition(new THREE.Vector3())
              .add(new THREE.Vector3(0, -0.2, 0.1))
          );
          collider.quaternion.copy(
            this.rightLegUpBone.getWorldQuaternion(new THREE.Quaternion())
          );
          collider.updateMatrixWorld();
          if (collider.bulletHit) {
            this.health -= collider.bulletDamage * 0.8;
            this.legHealth -= collider.bulletDamage;
            collider.bulletHit = false;
          }
          break;

        case RIGHTLEGDOWN:
          collider.position.copy(
            this.rightLegDownBone
              .getWorldPosition(new THREE.Vector3())
              .add(new THREE.Vector3(0, -0.2, -0.05))
          );
          collider.quaternion.copy(
            this.rightLegDownBone.getWorldQuaternion(new THREE.Quaternion())
          );
          collider.updateMatrixWorld();
          if (collider.bulletHit) {
            this.health -= collider.bulletDamage;
            this.legHealth -= collider.bulletDamage * 1.3;
            collider.bulletHit = false;
          }
          break;

        default:
          break;
      }
    }
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
