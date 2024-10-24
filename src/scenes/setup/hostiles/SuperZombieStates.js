import * as THREE from "three";
//import ZombieData from "./ZombieBase";
import { IDLE, WALKING, AGGRAVATED, ATTACK, INJURED, STARTLED, DEAD } from './ZombieBase';
import { State, StateMachine, Vector3 } from 'yuka';

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
        //zombie.ResetAllActions();
        //zombie.idleAction.play();
        zombie.BlendAction(zombie.idleAction);
        zombie.isMoving = false;
    }
  
    execute(zombie) {
        if (zombie.CanSeePlayer()){
            zombie.stateMachine.changeTo(AGGRAVATED);
        }

        if (zombie.CanSmellPlayer()){
            zombie.mesh.rotation.y += 0.5 * zombie.speed * zombie.deltaTime;
        }
    }
  
    exit(zombie) {

    }
}


export class WalkingState extends State {
    enter(zombie) {
        //zombie.ResetAllActions();
        //zombie.runAction.play();
        zombie.BlendAction(zombie.runAction);
        zombie.speed = 1;
        zombie.isMoving = true;
    }

    execute(zombie) {
        if (zombie.CanSeePlayer()){
            zombie.stateMachine.changeTo(AGGRAVATED);
        }   

        zombie.MoveToTarget();
    }

    exit(zombie) {

    }
}

export class AggravatedState extends State {
    enter(zombie) {
        //zombie.ResetAllActions();
        //zombie.runAction.play();
        zombie.BlendAction(zombie.runAction);
        zombie.speed = 1.5;
        zombie.isMoving = true;
    }

    execute(zombie) {
        zombie.targetPos = zombie.playerPos;
        zombie.MoveToTarget();
        //console.log(zombie.mesh.position);
        if (!zombie.CanSeePlayer()){
            zombie.stateMachine.changeTo(IDLE);
        }

        if (zombie.CanAttack()){
            zombie.stateMachine.changeTo(ATTACK);
        }
    }

    exit(zombie) {

    }
}

export class AttackState extends State {
    enter(zombie) {
        //zombie.ResetAllActions();
        //zombie.attackAction.play();
        zombie.BlendAction(zombie.attackAction);
        zombie.isMoving = false;
    }

    execute(zombie) {
        // Inflict damage or check if the attack is successful
        if (!zombie.CanAttack()) {
            zombie.stateMachine.changeTo(AGGRAVATED);  // Go back to walking if no target is in range
        }

        const currentTime = zombie.attackAction.time;  // Current time into the animation
        const totalDuration = zombie.attackAction.getClip().duration;  // Total duration of the animation
        const progress = currentTime / totalDuration;

        //if (progress)
        //console.log(`Animation progress: ${(progress * 100).toFixed(2)}%`);
    }

    exit(zombie) {

    }
}

export class InjuredState extends State {
    enter(zombie) {
        //zombie.ResetAllActions();
        //zombie.hurtCrawlAction.play();
        zombie.BlendAction(zombie.hurtCrawlAction);
        zombie.health -= 10;
        zombie.isMoving = true;
    }

    execute(zombie) {

        if (zombie.CanAttack()){
            zombie.PlayerDamage = 5;
        }
        // Maybe stagger or slow down depending on the injury
        // if (zombie.health <= 0) {
        //     zombie.stateMachine.change(DEAD);
        // }
    }

    exit(zombie) {

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
        //zombie.ResetAllActions();
        //zombie.dieBackAction.play();
        zombie.BlendAction(zombie.dieBackAction);
        zombie.isMoving = false;
    }

    execute(zombie) {
        
    }

    exit(zombie) {
        
    }
}

