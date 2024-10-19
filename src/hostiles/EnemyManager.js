import SuperZombie from "./SuperZombie";


export default class EnemyManager {
    constructor(scene, player){
        this.scene = scene;
        this.player = player;
 
        this.zombieNum = 20;
        this.SuperZombies = [];

        for (let i = 0; i < this.zombieNum; i++){
            this.SuperZombies.push(new SuperZombie(this.scene));
            
            console.log("Zombie added");
        }
    }

    OnUpdate(deltaTime){
        var i = 0;
        for (const zombie of this.SuperZombies){
            if (zombie.SetupComplete){
                zombie.OnUpdate(deltaTime);
                this.SuperZombies[i].mesh.position.set(2 * i, 0, 5);
                //zombie.mesh.position.z -= 0.005;

                //console.log(zombie.position);
            }
            i++;
        }
    }


}