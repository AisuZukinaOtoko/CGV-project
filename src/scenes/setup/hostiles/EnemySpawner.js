import * as THREE from 'three'
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export default class Spawner{
    constructor(filepath){
        this.spawns = [];
        this.LoadMapSpawns(filepath);
        this.setupComplete = false;
    }

    LoadMapSpawns(filepath){
        const loader = new GLTFLoader();
        loader.load(
        filepath,
        (gltf) => {
            const scene = gltf.scene;
            scene.traverse((object) => {
                if (object.type === "Object3D") {
                    this.spawns.push(object.position);
                }
            });
            
            for (let pos of this.spawns){
                pos.y = 0;
            }
            this.setupComplete = true;            
        },
        undefined,
        (error) => {
            console.error("An error occurred while loading the map spawns:", error);
        }
        );
    }

    GetSpawns(){
        return this.spawns;
    }

    GetRandomSpawn(){
        if (this.spawns.length == 0)
            return undefined;

        return this.spawns[Math.floor(Math.random() * this.spawns.length)];
    }

    GetClosestSpawn(pos){
        if (this.spawns.length == 0)
            return undefined;

        let closest = this.spawns[0];
        let distance = pos.distanceTo(closest);

        for (const spawnPoint of this.spawns){
            const spawnDistance = pos.distanceTo(spawnPoint);
            if (spawnDistance < distance){
                closest = spawnPoint;
                distance = spawnDistance;
            }
        }
        return closest;
    }

}
