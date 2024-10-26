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

  CreateSkeletalColliders(scene){
    this.mesh.traverse((child) => {
      if (child.isSkinnedMesh) {
        const skeleton = child.skeleton;
        console.log(skeleton);
        this.headBone = skeleton.bones.find((bone) => bone.name === "mixamorigHead");
        this.spineBone = skeleton.bones.find((bone) => bone.name === "mixamorigSpine1");
        this.leftLegDownBone = skeleton.bones.find((bone) => bone.name === "mixamorigLeftLeg");
        this.leftLegUpBone = skeleton.bones.find((bone) => bone.name === "mixamorigLeftUpLeg");
        this.rightLegDownBone = skeleton.bones.find((bone) => bone.name === "mixamorigRightLeg");
        this.rightLegUpBone = skeleton.bones.find((bone) => bone.name === "mixamorigRightUpLeg");
        this.rightForeArmBone = skeleton.bones.find((bone) => bone.name === "mixamorigRightHandIndex2");

        const colliderMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5, wireframe: true });
        // Head collider
        const headGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        this.headCollider = new THREE.Mesh(headGeometry, colliderMaterial);

        // Body collider
        //const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1, 6);
        const bodyGeometry = new THREE.BoxGeometry(0.5, 1, 0.3);
        this.spineCollider = new THREE.Mesh(bodyGeometry, colliderMaterial);

        // Leg Colliders
        const legGeometry = new THREE.BoxGeometry(0.25, 0.5, 0.25);
        this.leftLegUpCollider = new THREE.Mesh(legGeometry, colliderMaterial);
        this.rightLegUpCollider = new THREE.Mesh(legGeometry, colliderMaterial);
        this.leftLegDownCollider = new THREE.Mesh(legGeometry, colliderMaterial);
        this.rightLegDownCollider = new THREE.Mesh(legGeometry, colliderMaterial);

        // ForeArm Collider
        const armGeometry = new THREE.SphereGeometry(0.13, 8, 8);
        this.rightForeArmCollider = new THREE.Mesh(armGeometry, colliderMaterial);

        scene.add(this.headCollider);
        scene.add(this.spineCollider);
        scene.add(this.leftLegUpCollider);
        scene.add(this.rightLegUpCollider);
        scene.add(this.leftLegDownCollider);
        scene.add(this.rightLegDownCollider);
        scene.add(this.rightForeArmCollider);

      }
    });
  }

  // createCollisionShape() {
  //   // Body dimensions
  //   const bodyRadius = 0.3; // Adjust based on your zombie's actual width
  //   const bodyHeight = 1.4; // Adjust based on your zombie's actual height

  //   // Head dimensions
  //   const headRadius = 0.2; // Adjust based on your zombie's head size

  //   // Create body cylinder
  //   const bodyGeometry = new THREE.CylinderGeometry(
  //     bodyRadius,
  //     bodyRadius,
  //     bodyHeight,
  //     8
  //   );
  //   const bodyMaterial = new THREE.MeshBasicMaterial({
  //     color: 0x00ff00,
  //     transparent: true,
  //     opacity: 0.5,
  //     wireframe: true,
  //   });
  //   const bodyCollider = new THREE.Mesh(bodyGeometry, bodyMaterial);

  //   // Create head sphere
  //   const headGeometry = new THREE.SphereGeometry(headRadius, 8, 8);
  //   const headMaterial = new THREE.MeshBasicMaterial({
  //     color: 0x00ff00,
  //     transparent: true,
  //     opacity: 0.5,
  //     wireframe: true,
  //   });
  //   const headCollider = new THREE.Mesh(headGeometry, headMaterial);

  //   // Position colliders
  //   bodyCollider.position.set(0, bodyHeight / 2, 0); // Center of the body
  //   headCollider.position.set(0, bodyHeight + headRadius, 0); // Top of the body

  //   // Create a group to hold both colliders
  //   this.collisionShape = new THREE.Group();
  //   this.collisionShape.add(bodyCollider);
  //   this.collisionShape.add(headCollider);

  //   // Position the collision shape relative to the mesh
  //   this.collisionShape.position.set(0, 0, 0); // Center it on the mesh
  //   this.mesh.add(this.collisionShape);

  //   if (
  //     this.collisionManager &&
  //     typeof this.collisionManager.addCollidableObject === "function"
  //   ) {
  //     this.collisionManager.addCollidableObject(this.collisionShape);
  //   } else {
  //     console.warn(
  //       "CollisionManager is not properly initialized or lacks addCollidableObject method"
  //     );
  //   }

  //   // Initially hide the collision shape
  //   this.collisionShape.visible = true;
  // }

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
    this.headCollider.position.copy(this.headBone.getWorldPosition(new THREE.Vector3()));
    this.spineCollider.quaternion.copy(this.spineBone.getWorldQuaternion(new THREE.Quaternion()));
    this.spineCollider.position.copy(this.spineBone.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0, 0)));

    this.leftLegUpCollider.position.copy(this.leftLegUpBone.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, -0.2, 0.1)));
    this.leftLegUpCollider.quaternion.copy(this.leftLegUpBone.getWorldQuaternion(new THREE.Quaternion()));
    this.leftLegDownCollider.position.copy(this.leftLegDownBone.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, -0.2, -0.05)));
    this.leftLegDownCollider.quaternion.copy(this.leftLegDownBone.getWorldQuaternion(new THREE.Quaternion()));

    this.rightLegUpCollider.position.copy(this.rightLegUpBone.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, -0.2, 0.1)));
    this.rightLegUpCollider.quaternion.copy(this.rightLegUpBone.getWorldQuaternion(new THREE.Quaternion()));
    this.rightLegDownCollider.position.copy(this.rightLegDownBone.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, -0.2, -0.05)));
    this.rightLegDownCollider.quaternion.copy(this.rightLegDownBone.getWorldQuaternion(new THREE.Quaternion()));

    this.rightForeArmCollider.position.copy(this.rightForeArmBone.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0, 0)));
    this.rightForeArmCollider.quaternion.copy(this.rightForeArmBone.getWorldQuaternion(new THREE.Quaternion()));
    // const worldQuaternion = new THREE.Quaternion();
    //       specificBone.getWorldQuaternion(worldQuaternion);

    //       // Optionally convert the world quaternion to Euler angles (if needed)
    //       const worldEuler = new THREE.Euler().setFromQuaternion(worldQuaternion);

    //       console.log(`World Rotation (Euler):`, worldEuler); // x, y, z in radians

    //       // Apply the world rotation to the collider geometry
    //       colliderGeometry.rotation.copy(worldEuler); // Assuming colliderGeometry is your geometry object

    //       // If your collider uses quaternions, you can directly copy the quaternion
    //       colliderGeometry.quaternion.copy(worldQuaternion);
    //console.log(this.headBone.getWorldPosition());
    //const temp = this.headBone.getWorldPosition(new THREE.Vector3())
    //this.headCollider.position.x = temp.x;
    //this.headCollider.position.y = temp.y;
    //this.headCollider.position.z = temp.z;

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
