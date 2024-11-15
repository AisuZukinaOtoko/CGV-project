import * as THREE from "three";


export const HEAD = 0;
export const HAND = 1;
export const TORSO = 2;
export const LEFTLEGDOWN = 3;
export const RIGHTLEGDOWN = 4;
export const LEFTLEGUP = 5;
export const RIGHTLEGUP = 6;


export default class Collider extends THREE.Mesh {
    constructor(geometry, material, type){
        super(geometry, material);
        this.type = type;
        this.isCollider = true;
        this.bulletHit = false;
        this.bulletDamage = 0;
    }
}