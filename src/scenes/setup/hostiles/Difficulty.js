const Easy = {
    ZombieNum : 3,
    ZombieHealth : 50,
    ZombieSpeed : 1,
    ZombieAttackDamage : 20,
}

const Normal = {
    ZombieNum : 5,
    ZombieHealth : 1200,
    ZombieSpeed : 10.2,
    ZombieAttackDamage : 80,
}

const Hard = {
    ZombieNum : 7,
    ZombieHealth : 200,
    ZombieSpeed : 1.6,
    ZombieAttackDamage : 70,
}

const Impossible = {
    ZombieNum : 12,
    ZombieHealth : 500,
    ZombieSpeed : 2.5,
    ZombieAttackDamage : 100,
}

const Difficulty = {
    EASY: Easy,
    NORMAL: Normal,
    HARD: Hard,
    IMPOSSIBLE: Impossible,
};

export default Difficulty;