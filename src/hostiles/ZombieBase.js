// import * as THREE from 'three';
// import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// const IDLE = 0;
// const WALKING = 1;
// const AGGRAVATED = 2;
// const ATTACK = 3;
// const INJURED = 4;
// const STARTLED = 5;
// const DEAD = 6;

// export default class Zombie extends THREE.Object3D {
//     constructor(){
//         super();
//         this.health = 100;
//         this.speed = 1;
//         this.PlayerCurrentPos = new THREE.Vector3();
//         this.PlayerLastSeenPos = new THREE.Vector3();
//         this.TargetPos = new THREE.Vector3();
//         this.state = IDLE;
//     }

//     OnUpdate(deltaTime){

//     }

//     ResetAllActions(){

//     }

//     StateChange(){

//     }
// }

import * as THREE from 'three';
import { GameEntity, State, StateMachine, Vector3 } from 'yuka';

const IDLE = 0;
const WALKING = 1;
const AGGRAVATED = 2;
const ATTACK = 3;
const INJURED = 4;
const STARTLED = 5;
const DEAD = 6;

// Define the Zombie class
export default class Zombie extends GameEntity {
    constructor() {
        super();
        this.stateMachine = new StateMachine(this);
        this.stateMachine.add(IDLE, new IdleState());
        this.stateMachine.add(WALKING, new WalkingState());
        this.stateMachine.add(AGGRAVATED, new AggravatedState());
        this.stateMachine.add(ATTACK, new AttackState());
        this.stateMachine.add(INJURED, new InjuredState());
        this.stateMachine.add(STARTLED, new StartledState());
        this.stateMachine.add(DEAD, new DeadState());

        this.health = 100;
        this.isAggroed = false;  // Placeholder for when the zombie is aggravated by the player
    }

    OnUpdate(delta) {
        this.stateMachine.update();
    }

    MoveToTarget(){
        
    }
}

// Define each state for the zombie

class IdleState extends State {
    enter(zombie) {
        console.log('Zombie is now idle.');
        // Set animation to idle or make zombie stand still
    }

    execute(zombie) {
        // Check for player proximity or noise to transition to AGGRAVATED or STARTLED
        if (zombie.isAggroed) {
            zombie.stateMachine.change(AGGRAVATED);
        }
    }

    exit(zombie) {
        console.log('Zombie exits idle.');
    }
}

class WalkingState extends State {
    enter(zombie) {
        console.log('Zombie starts walking.');
        // Set animation to walking and move towards a target
    }

    execute(zombie) {
        // Move zombie forward
        // Check if the zombie sees a player or gets aggravated
        if (zombie.isAggroed) {
            zombie.stateMachine.change(AGGRAVATED);
        }
    }

    exit(zombie) {
        console.log('Zombie stops walking.');
    }
}

class AggravatedState extends State {
    enter(zombie) {
        console.log('Zombie is aggravated and is searching for the player!');
        // Set animation to aggravated behavior
    }

    execute(zombie) {
        // Move faster, pursue the player, or check surroundings
        if (zombie.canAttack()) {
            zombie.stateMachine.change(ATTACK);
        }
    }

    exit(zombie) {
        console.log('Zombie calms down from being aggravated.');
    }
}

class AttackState extends State {
    enter(zombie) {
        console.log('Zombie attacks!');
        // Trigger attack animation or action
    }

    execute(zombie) {
        // Inflict damage or check if the attack is successful
        if (!zombie.canAttack()) {
            zombie.stateMachine.change(WALKING);  // Go back to walking if no target is in range
        }
    }

    exit(zombie) {
        console.log('Zombie finishes attacking.');
    }
}

class InjuredState extends State {
    enter(zombie) {
        console.log('Zombie is injured!');
        // Play injured animation
        zombie.health -= 10;
    }

    execute(zombie) {
        // Maybe stagger or slow down depending on the injury
        if (zombie.health <= 0) {
            zombie.stateMachine.change(DEAD);
        }
    }

    exit(zombie) {
        console.log('Zombie recovers from being injured.');
    }
}

class StartledState extends State {
    enter(zombie) {
        console.log('Zombie is startled!');
        // Play startled animation or quickly turn towards noise
    }

    execute(zombie) {
        // Look around and switch to aggravated or walk away
        zombie.stateMachine.change(WALKING);
    }

    exit(zombie) {
        console.log('Zombie stops being startled.');
    }
}

class DeadState extends State {
    enter(zombie) {
        console.log('Zombie is dead.');
        // Trigger death animation
        zombie.dead = true;
    }

    execute(zombie) {
        // No further actions
    }

    exit(zombie) {
        // No exit, the zombie is dead
    }
}

// Instantiate the zombie and set the initial state to idle
//const zombie = new Zombie();
//zombie.stateMachine.change(IDLE);

// Simulate game loop
// function gameLoop(delta) {
//     zombie.update(delta);

//     // Example trigger
//     //if (/* player is near */) {
//         //zombie.isAggroed = true;
//     //}
// }
