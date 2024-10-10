import Scene from "./Scene.js"
import EVENTS from './../Events.js';
import StartScene from "./StartupScene.js"
import * as THREE from './../../node_modules/three/build/three.module.js';

const material = new THREE.MeshBasicMaterial({ color: 0xa0ff0f });

export default class TestScene extends Scene {
    constructor(camera){
        super(camera);

        this.m_MainCamera = camera;
        this.m_MainCamera.position.z = 7;
        // Create a cube
        const geometry = new THREE.BoxGeometry();
        this.cube = new THREE.Mesh(geometry, material);
        this.m_Scene.add(this.cube);
        
    }


    OnBegin(){

    }

    OnUpdate(deltaTime){
        this.cube.rotation.x += 0.01;
        this.cube.rotation.y += 0.01;
        this.cube.rotation.z += 0.01;
        //this.m_MainCamera.position.z += 0.5;
        //material.color.setHSL(Math.sin(this.m_FrameNumber / 60) * 0.5 + 0.5, 1, 0.5);
        if (EVENTS.eventHandler.IsKeyHeld(EVENTS.KEY.W)){
            console.log("W is held");
        }
        
        if (EVENTS.eventHandler.IsKeyPressed(EVENTS.KEY.A)){
            console.log("A is pressed");
        }
        
        if (EVENTS.eventHandler.IsKeyPressed(EVENTS.KEY.D)){
            console.log("D key pressed");
        }

        if (EVENTS.eventHandler.IsKeyPressed(EVENTS.KEY.ONE)){
            this.SwitchScenes(new StartScene(this.m_MainCamera));
        }
    }

    OnPreRender(){

    }

    OnUIRender(){

    }

    OnEnd(){

    }
}