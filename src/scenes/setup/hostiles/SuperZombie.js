import * as THREE from "three";
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

        // Create a more precise collision shape
        this.createCollisionShape();

        // Set up animations
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

  createCollisionShape() {
    // Body dimensions
    const bodyRadius = 0.3; // Adjust based on your zombie's actual width
    const bodyHeight = 1.4; // Adjust based on your zombie's actual height

    // Head dimensions
    const headRadius = 0.2; // Adjust based on your zombie's head size

    // Create body cylinder
    const bodyGeometry = new THREE.CylinderGeometry(
      bodyRadius,
      bodyRadius,
      bodyHeight,
      8
    );
    const bodyMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.5,
      wireframe: true,
    });
    const bodyCollider = new THREE.Mesh(bodyGeometry, bodyMaterial);

    // Create head sphere
    const headGeometry = new THREE.SphereGeometry(headRadius, 8, 8);
    const headMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.5,
      wireframe: true,
    });
    const headCollider = new THREE.Mesh(headGeometry, headMaterial);

    // Position colliders
    bodyCollider.position.set(0, bodyHeight / 2, 0); // Center of the body
    headCollider.position.set(0, bodyHeight + headRadius, 0); // Top of the body

    // Create a group to hold both colliders
    this.collisionShape = new THREE.Group();
    this.collisionShape.add(bodyCollider);
    this.collisionShape.add(headCollider);

    // Position the collision shape relative to the mesh
    this.collisionShape.position.set(0, 0, 0); // Center it on the mesh
    this.mesh.add(this.collisionShape);

    if (
      this.collisionManager &&
      typeof this.collisionManager.addCollidableObject === "function"
    ) {
      this.collisionManager.addCollidableObject(this.collisionShape);
    } else {
      console.warn(
        "CollisionManager is not properly initialized or lacks addCollidableObject method"
      );
    }

    // Initially hide the collision shape
    this.collisionShape.visible = true;
  }

  toggleCollisionShapeVisibility(visible) {
    if (this.collisionShape) {
      this.collisionShape.visible = visible;
    }
  }

  setupAnimations(gltf) {
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

    this.dieBackAction.loop = THREE.LoopOnce;
    this.dieForwardAction.loop = THREE.LoopOnce;
    this.dieBackAction.clampWhenFinished = true;
    this.dieForwardAction.clampWhenFinished = true;

    // Adjust run animation speed to match desired movement speed
    //const runSpeed = this.speed / this.movementVector.length();
    //this.runAction.setEffectiveTimeScale(runSpeed);

    this.ResetAllActions();
    this.runAction.play();
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

  BlendAction(newAction){
    const currentActions = this.mixer._actions;

    // Fade out all current actions
    currentActions.forEach((action) => {
        if (action.isRunning()) {
            action.fadeOut(0.3);
        }
    });

    newAction.reset();
    newAction.fadeIn(0.3);
    newAction.play();
  }
}
