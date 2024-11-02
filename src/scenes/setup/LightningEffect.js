// LightningEffect.js
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { OutlinePass } from "three/addons/postprocessing/OutlinePass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { LightningStrike } from "../../../LightningStrike";

export class LightningEffect {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.composer = new EffectComposer(renderer);
        const renderPass = new RenderPass(scene, camera);
        this.composer.addPass(renderPass);

        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.gainNode = this.audioContext.createGain(); // Create a GainNode for volume control
        this.gainNode.gain.value = 0.1; // Set initial volume (0.0 to 1.0)
        this.gainNode.connect(this.audioContext.destination); // Connect GainNode to destination

        this.loadSound('src/assets/Sounds/thunder.mp3'); // Load your sound file here

        this.initLightning();
        setInterval(() => this.triggerLightning(), 10000); // Strike every 10 seconds
    }

    async loadSound(url) {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    }

    playSound() {
        if (this.audioBuffer) {
            const soundSource = this.audioContext.createBufferSource();
            soundSource.buffer = this.audioBuffer;
            soundSource.connect(this.gainNode); // Connect sound source to GainNode
            soundSource.start(0);
        } else {
            console.warn("Audio buffer not loaded yet.");
        }
    }

    initLightning() {
        this.lightningMeshes = [];
        const rayParams = {
            sourceOffset: new THREE.Vector3(),
            destOffset: new THREE.Vector3(),
            radius0: 0.05,
            radius1: 0.05,
            minRadius: 2.5,
            maxIterations: 7,
            isEternal: true,
            timeScale: 0.7,
            propagationTimeFactor: 0.05,
            vanishingTimeFactor: 0.95,
            subrayPeriod: 2.5,
            subrayDutyCycle: 0.3,
            maxSubrayRecursion: 3,
            ramification: 7,
            recursionProbability: 0.6,
            roughness: 0.85,
            straightness: 0.68
        };

        // Create multiple lightning strikes
        for (let i = 0; i < 2; i++) {
            const lightningStrike = new LightningStrike(rayParams);
            const lightningMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
            lightningMaterial.emissive = new THREE.Color(0xffffff);
            lightningMaterial.emissiveIntensity = 15; 
            const lightningMesh = new THREE.Mesh(lightningStrike, lightningMaterial);
            
            this.lightningMeshes.push({ mesh: lightningMesh, strike: lightningStrike });
            this.scene.add(lightningMesh);
        }

        // Create an outline effect for lightning
        const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), this.scene, this.camera, this.lightningMeshes.map(l => l.mesh));
        outlinePass.edgeStrength = 3;
        outlinePass.edgeGlow = 3.5;
        outlinePass.edgeThickness = 1;
        outlinePass.visibleEdgeColor.set(0x00aaff);
        this.composer.addPass(outlinePass);
    }

    triggerLightning() {
        this.lightningMeshes.forEach(({ mesh }) => {
            mesh.visible = true;  // Make the lightning visible
        });
        this.playSound(); // Play the sound effect
    
        // Hide lightning after short delay (e.g., 200ms for flash effect)
        setTimeout(() => {
            this.lightningMeshes.forEach(({ mesh }) => {
                mesh.visible = false;
            });
        }, 200);
    }

    setPositions(positions) {
        if (positions.length !== this.lightningMeshes.length) {
            console.warn("Positions array length does not match number of lightning meshes.");
            return;
        }

        positions.forEach((position, index) => {
            const lightning = this.lightningMeshes[index];
            lightning.strike.rayParameters.sourceOffset.copy(position);
            lightning.strike.rayParameters.destOffset.copy(position.clone().add(new THREE.Vector3(0, -5, 0)));
        });
    }

    setPosition(position) {
        const highAbovePosition = position.clone().add(new THREE.Vector3(0, 50, 0)); 
    
        this.lightningMeshes.forEach(({ strike }) => {
            strike.rayParameters.sourceOffset.copy(highAbovePosition); // Start point high above
            strike.rayParameters.destOffset.copy(position); // End point
        });
    }

    animate(t) {
        this.lightningMeshes.forEach(({ strike, mesh }, index) => {
            strike.update(t + index * 0.2);  // Adding offset to create staggered effect
            mesh.material.opacity = Math.random();  // Random opacity for flicker effect
        });

        this.composer.render();
    }
}
