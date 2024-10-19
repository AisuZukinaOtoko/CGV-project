import * as THREE from 'three';
import Zombie from './ZombieBase'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export default class SuperZombie extends Zombie {
    constructor(scene){
        super();

        this.mixer, this.runAction, this.idleAction, this.screamAction, this.crawlAction, this.dieForwardAction, this.dieBackAction, this.attackAction;
        this.mesh;
        this.IsWalking = false;
        this.SetupComplete = false;

        

        // Load the zombie model and animations
        const loader = new GLTFLoader();
        loader.load(
            'src/assets/Zombies/super.glb', // Path to the 3D model file
            (gltf) => { // Use arrow function to maintain 'this' context
                this.mesh = gltf.scene;
                this.mesh.scale.set(1.2, 1.2, 1.2); // Adjust the scale if needed
                //scene.add(this.zombie); // Make sure 'scene' is defined or passed to the class

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

        // If the zombie is running, move it forward
        if (this.isRunning) {
            this.mesh.position.z += 0.05; // Move forward along the Z-axis
        }
    }

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