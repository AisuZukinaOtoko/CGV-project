import * as THREE from 'three';
import Zombie from './ZombieBase'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export default class SuperZombie extends Zombie {
    constructor(scene, collidableMeshList, initialPosition = new THREE.Vector3(0, 0, 0)){
        super();

        this.mixer, this.runAction, this.idleAction, this.screamAction, this.crawlAction, this.dieForwardAction, this.dieBackAction, this.attackAction;
        this.mesh;
        this.boundingBox = null; // Bounding box for collision detection
        this.IsWalking = false;
        this.SetupComplete = false;
        this.collidableMeshList = collidableMeshList; // List of walls and obstacles
        

        // Load the zombie model and animations
        const loader = new GLTFLoader();
        loader.load(
            'src/assets/Zombies/super.glb', // Path to the 3D model file
            (gltf) => { // Use arrow function to maintain 'this' context
                this.mesh = gltf.scene;
                this.mesh.scale.set(1.2, 1.2, 1.2); // Adjust the scale if needed
                this.mesh.position.copy(initialPosition);
                this.speed = 0.5; // Or any appropriate speed value

                this.rootBone = this.mesh.getObjectByName('mixamorigHips'); // get the hip bone which is the root of the skeleton

                // Set up the bounding box
                this.boundingBox = new THREE.Box3().setFromObject(this.mesh);


                this.mixer = new THREE.AnimationMixer(this.mesh);

                // Define animations
                this.idleAction = this.mixer.clipAction(gltf.animations[11]);
                this.screamAction = this.mixer.clipAction(gltf.animations[1]);
                this.attackAction = this.mixer.clipAction(gltf.animations[3]);
                this.crawlAction = this.mixer.clipAction(gltf.animations[5]);
                this.dieForwardAction = this.mixer.clipAction(gltf.animations[6]);
                this.dieBackAction = this.mixer.clipAction(gltf.animations[10]);
                this.runAction = this.mixer.clipAction(gltf.animations[8]);


                // Optionally, play an animation
                this.ResetAllActions();
                this.runAction.play();
                console.log("Zombie loaded");
                scene.add(this.mesh);
                this.SetupComplete = true;
                this.isRunning = true;
            },
            undefined,
            function (error) {
                console.error('An error occurred while loading the model:', error);
            }
        );

    }

    OnUpdate(deltaTime){
        if (this.mixer) {
            this.mixer.update(deltaTime); // Update the animation mixer with delta time
        }

        this.mesh.rotation.y += 0.01;
        this.state = Zombie.IDLE;
        this.stateMachine.update();
        //const forward = new THREE.Vector3(0, 0, -1); // Z-axis as forward
        //forward.applyQuaternion(this.mesh.quaternion); // Apply rotation
        //forward.multiplyScalar(deltaTime * 2); // Adjust speed here
        //this.mesh.position.add(forward);

        // If the zombie is running, move it forward
        //if (this.isRunning && !this.checkCollisionWithWalls()) {
        //    this.mesh.position.z -= this.speed * deltaTime; // Move forward if no collision
        //}
        //this.mesh.position.z -= this.speed * deltaTime;
        //this.ZombieMovement();

        // Update the bounding box to match the zombie's position
        //if (this.boundingBox) {
        //    this.boundingBox.setFromObject(this.mesh);
        //}
    }


    checkCollisionWithBullet(bullet) {
        if (this.boundingBox && bullet.boundingBox) {
            return this.boundingBox.intersectsBox(bullet.boundingBox);
        }
        return false;
    }

    ZombieMovement(){        
        if (this.rootBone) {
            const rootPosition = new THREE.Vector3();
            this.rootBone.getWorldPosition(rootPosition);
            //const posDelta = rootPosition.clone().sub(this.mesh.position);
            //const posDelta = this.mesh.position.clone().sub(rootPosition);
            //rootPosition.multiplyScalar(0.6);
            this.mesh.position.copy(rootPosition);
            console.log(this.mesh.position);
        }
    }

    // Collision check with walls or other rigid objects
    // checkCollisionWithWalls() {
    //     // Update bounding box to current position
    //     this.boundingBox.setFromObject(this.mesh);

    //     // Loop through all walls and check for intersections
    //     for (const wall of this.collidableMeshList) {
    //         const wallBoundingBox = new THREE.Box3().setFromObject(wall);
    //         if (this.boundingBox.intersectsBox(wallBoundingBox)) {
    //             console.log('Zombie collided with a wall');
    //             return true; // Collision detected
    //         }
    //     }

    //     return false; // No collision
    // }

    ResetAllActions() {
        this.idleAction.stop();
        this.screamAction.stop();
        this.attackAction.stop();
        this.crawlAction.stop();
        this.dieForwardAction.stop();
        this.dieBackAction.stop();
        this.runAction.stop();
        this.isRunning = false; // Reset running state
    }
}