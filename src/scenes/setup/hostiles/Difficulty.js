const Easy = {
    ZombieNum : 3,
    ZombieHealth : 50,
    ZombieSpeed : 1,
    ZombieAttackDamage : 10,
}

const Normal = {
    ZombieNum : 5,
    ZombieHealth : 100,
    ZombieSpeed : 1.6,
    ZombieAttackDamage : 15,
}

const Hard = {
    ZombieNum : 7,
    ZombieHealth : 200,
    ZombieSpeed : 2.0,
    ZombieAttackDamage : 20,
}

const Impossible = {
    ZombieNum : 12,
    ZombieHealth : 500,
    ZombieSpeed : 3.2,
    ZombieAttackDamage : 25,
}

const Difficulty = {
    EASY: Easy,
    NORMAL: Normal,
    HARD: Hard,
    IMPOSSIBLE: Impossible,
};

export default Difficulty;
