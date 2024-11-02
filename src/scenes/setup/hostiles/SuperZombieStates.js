import * as THREE from "three";
//import ZombieData from "./ZombieBase";
import { IDLE, WALKING, AGGRAVATED, ATTACK, INJURED, STARTLED, DEAD } from './ZombieBase';
import { State, StateMachine, Vector3 } from 'yuka';



const zombieSounds = {
    idle: new Audio('src/assets/Sounds/zombie_idle.mp3'),
    walking: new Audio('src/assets/Sounds/zombie_idle.mp3'),
    aggravated: new Audio('src/assets/Sounds/zombie_idle.mp3'),
    attack: new Audio('src/assets/Sounds/zombie_attack.mp3'),
    injured: new Audio('src/assets/Sounds/zombie_idle.mp3'),
    startled: new Audio('src/assets/Sounds/zombie_idle.mp3'),
    death: new Audio('src/assets/Sounds/zombie_die.mp3')
};
zombieSounds.idle.loop = true;
zombieSounds.walking.loop = true;
zombieSounds.aggravated.loop = true;
zombieSounds.injured.loop = true;

const playZombieSound = (soundKey, volume = 1.0) => {
    const sound = zombieSounds[soundKey];
    if (!sound) return;
    sound.volume = volume;
    sound.play();
}

const stopZombieSound = (soundKey) => {
    const sound = zombieSounds[soundKey];
    if (!sound) return;
    sound.pause();
    sound.currentTime = 0;
};


// DO nothing until all the setup is complete
export class InitState extends State {
    enter(zombie) {
    }
  
    execute(zombie) {
        if (zombie.SetupComplete){
            zombie.targetPos.set(0, 0, 20);
            zombie.stateMachine.changeTo(IDLE);
        }
    }
  
    exit(zombie) {
    }
}

export class IdleState extends State {
    enter(zombie) {
        zombie.BlendAction(zombie.idleAction);
        zombie.isMoving = false;
        playZombieSound('idle', 0.3);
    }
  
    execute(zombie) {
        if (zombie.health < 0){
            zombie.stateMachine.changeTo(DEAD);
            return;
        }

        if (zombie.legHealth < 0){
            zombie.stateMachine.changeTo(INJURED);
            return;
        }

        console.log(zombie.noPath);
        if (zombie.CanSeePlayer() && !zombie.noPath){
            zombie.stateMachine.changeTo(AGGRAVATED);
            return;
        }

        if (zombie.CanSmellPlayer()){
            zombie.mesh.rotation.y += 0.5 * zombie.speed * zombie.deltaTime;
        }

        
    }
  
    exit(zombie) {
        stopZombieSound('idle');

    }
}


export class WalkingState extends State {
    enter(zombie) {
        zombie.BlendAction(zombie.runAction);
        zombie.speed = 1;
        zombie.isMoving = true;
        zombie.noPath = false;
        playZombieSound('walking', 0.4);
    }

    execute(zombie) {
        if (zombie.health < 0){
            zombie.stateMachine.changeTo(DEAD);
            return;
        }

        if (zombie.legHealth < 0){
            zombie.stateMachine.changeTo(INJURED);
            return;
        }

        if (zombie.noPath){
            zombie.stateMachine.changeTo(IDLE);
            return;
        }

        if (zombie.CanSeePlayer()){
            zombie.stateMachine.changeTo(AGGRAVATED);
            return;
        }

        zombie.MoveToTarget();
    }

    exit(zombie) {
        stopZombieSound('walking');


    }
}

export class AggravatedState extends State {
    enter(zombie) {
        zombie.BlendAction(zombie.runAction);
        zombie.speed = 1.5;
        zombie.isMoving = true;
        zombie.noPath = false;
        playZombieSound('aggravated', 0.7);
    }

    execute(zombie) {
        if (zombie.health < 0){
            zombie.stateMachine.changeTo(DEAD);
            return;
        }

        if (zombie.legHealth < 0){
            zombie.stateMachine.changeTo(INJURED);
            return;
        }

        zombie.targetPos = zombie.playerPos;
        zombie.MoveToTarget();

        if (zombie.noPath){
            //zombie.stateMachine.changeTo(IDLE);
            //return;
        }

        if (!zombie.CanSeePlayer()){
            zombie.stateMachine.changeTo(IDLE);
            return;
        }

        if (zombie.CanAttack()){
            zombie.stateMachine.changeTo(ATTACK);
            return;
        }
    }

    exit(zombie) {
        stopZombieSound('aggravated');

    }
}

export class AttackState extends State {
    enter(zombie) {
        zombie.BlendAction(zombie.attackAction);
        zombie.isMoving = false;
    }

    execute(zombie) {
        if (zombie.health < 0){
            zombie.stateMachine.changeTo(DEAD);
            return;
        }

        if (zombie.legHealth < 0){
            zombie.stateMachine.changeTo(INJURED);
            return;
        }
        let canAttack = zombie.CanAttack();
        const currentTime = zombie.attackAction.time;  // Current time into the animation
        const totalDuration = zombie.attackAction.getClip().duration;  // Total duration of the animation
        const progress = currentTime / totalDuration;

        if (progress > 0.5 && canAttack && !zombie.attackCooldown) { // Time of attack
            console.log("Attack");
            playZombieSound('attack', 0.2);
            zombie.PlayerDamage = 40;
            zombie.attackCooldown = true;
            return;
        }
        else if (progress < 0.5){
            zombie.attackCooldown = false;
        }

        if (!canAttack) {
            zombie.stateMachine.changeTo(AGGRAVATED);  // Go back to walking if no target is in range
            return;
        }

        

        //if (progress)
        //console.log(`Animation progress: ${(progress * 100).toFixed(2)}%`);
    }

    exit(zombie) {

    }
}

export class InjuredState extends State {
    enter(zombie) {
        zombie.BlendAction(zombie.hurtCrawlAction);
        zombie.isMoving = true;
        zombie.noPath = false;
        playZombieSound('injured', 0.5)
    }

    execute(zombie) {
        if (zombie.health < 0){
            zombie.stateMachine.changeTo(DEAD);
            return;
        }

        if (zombie.CanAttack()){
            zombie.PlayerDamage = 5;
        }
    }

    exit(zombie) {
        stopZombieSound('injured');

    }
}

export class StartledState extends State {
    enter(zombie) {
        console.log('Zombie is startled!');
        // Play startled animation or quickly turn towards noise
    }

    execute(zombie) {
        // Look around and switch to aggravated or walk away
        //zombie.stateMachine.change(WALKING);
    }

    exit(zombie) {
        console.log('Zombie stops being startled.');
    }
}

export class DeadState extends State {
    enter(zombie) {
        zombie.BlendAction(zombie.dieBackAction);
        zombie.isMoving = false;
        playZombieSound('death', 0.7);
        stopZombieSound('idle');
        stopZombieSound('walking');
        stopZombieSound('aggravated');
        stopZombieSound('attack');
        stopZombieSound('injured');
    }

    execute(zombie) {
        if (zombie.dieBackAction.time >= zombie.dieBackAction.getClip().duration) {
            zombie.isDead = true;
        }
    }

    exit(zombie) {

         stopZombieSound('death');
    }
}

