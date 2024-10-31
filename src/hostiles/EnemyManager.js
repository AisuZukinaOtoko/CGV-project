import SuperZombie from "./SuperZombie";
import * as THREE from 'three';


export default class EnemyManager {
    constructor(scene, player, collidableMeshList){
        this.scene = scene;
        this.player = player;
 
        this.zombieNum = 1;
        this.SuperZombies = [];
        this.collidableMeshList = collidableMeshList; // Pass the collidable objects

        for (let i = 0; i < this.zombieNum; i++) {
            const initialPosition = new THREE.Vector3(2 * i, 0, 0); // Stagger along x-axis
            const zombie = new SuperZombie(this.scene, this.collidableMeshList,initialPosition);
            //zombie.stateMachine.change(IDLE);

            // Set initial position for each zombie
            this.SuperZombies.push(zombie);

            console.log("Zombie added");
        }
    }

    OnUpdate(deltaTime){
        var i = 0;
        for (const zombie of this.SuperZombies){
            if (zombie.SetupComplete){
                zombie.OnUpdate(deltaTime);
               
                //zombie.mesh.position.z -= 0.005;

                //console.log(zombie.position);
            }
            i++;
        }
    }


}