import * as THREE from 'three';

export function triggerDamageEffect(){
     // Adjust timing as needed
}

export class PostProcessor {
    constructor(scene, renderer, camera){
        this.scene = scene;
        this.renderer = renderer;
        this.camera = camera;

        this.cameraShakeDuration = 0;
        this.cameraShakeIntensity = 0;
    }

    OnUpdate(deltaTime){
        this.#HandleCameraShake(deltaTime);
    }

    // duration in seconds
    ShakeCamera(duration, intensity){
        this.cameraShakeDuration = duration;
        this.cameraShakeIntensity = intensity;
    }

    PlayerDamageAnimation(duration){
        const overlay = document.getElementById("damageOverlay");
        overlay.style.opacity = 1;

        // Fade out the effect after a short delay
        setTimeout(() => {
            overlay.style.opacity = 0;
        }, duration);
    }

    #HandleCameraShake(deltaTime){
        if (this.cameraShakeDuration < 0)
            return;
        
        console.log("Shake camera");
        const originalPosition = this.camera.position.clone();
        const offsetX = (Math.random() - 0.5) * this.cameraShakeIntensity;
        const offsetY = (Math.random() - 0.5) * this.cameraShakeIntensity;
        const offsetZ = (Math.random() - 0.5) * this.cameraShakeIntensity;

        this.camera.rotation.set(
            originalPosition.x + offsetX,
            originalPosition.y + offsetY,
            originalPosition.z
        );

        this.cameraShakeDuration -= deltaTime;
    }
}