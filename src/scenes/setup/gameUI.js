// gameUI.js
export class GameUI {
  constructor(scene) {
    this.scene = scene;
    this.timerElement = document.getElementById("timer");
    this.killCounterElement = document.getElementById("kill-counter");
    this.gameOverElement = document.getElementById("game-over");
    this.restartButton = document.getElementById("restart-button");

    this.timeRemaining = 240; // 4 minutes in seconds
    this.kills = 0;
    this.timerInterval = null;

    this.spawnIntervals = [
      180, // 3:00
      120, // 2:00
      60, // 1:00
      30, // 0:30
    ];
    this.zombiesPerSpawn = 5;

    this.setupEventListeners();
    this.startTimer();
    this.currentSpawnQueue = 0; // Track remaining zombies to spawn
    this.spawnTimer = null; // Timer for individual zombie spawns
  }

  setupEventListeners() {
    this.restartButton.addEventListener("click", () => this.restartGame());
  }

  setEnemyManager(enemyManager) {
    this.enemyManager = enemyManager;
  }

  startTimer() {
    this.updateTimerDisplay();
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      this.updateTimerDisplay();

      if (
        this.enemyManager &&
        this.spawnIntervals.includes(this.timeRemaining) &&
        this.currentSpawnQueue === 0
      ) {
        this.currentSpawnQueue = this.zombiesPerSpawn;
        this.startZombieWave();
      }

      if (this.timeRemaining <= 0) {
        this.stopTimer();
        this.gameOver();
      }
    }, 1000);
  }

  startZombieWave() {
    if (this.spawnTimer) {
      clearInterval(this.spawnTimer);
    }

    this.spawnTimer = setInterval(() => {
      if (this.currentSpawnQueue > 0) {
        this.enemyManager.spawnAdditionalZombies(1);
        this.currentSpawnQueue--;
      } else {
        clearInterval(this.spawnTimer);
        this.spawnTimer = null;
      }
    }, 3000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.spawnTimer) {
      clearInterval(this.spawnTimer);
      this.spawnTimer = null;
    }
  }

  updateTimerDisplay() {
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    this.timerElement.textContent = `${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  incrementKills() {
    this.kills++;
    this.killCounterElement.textContent = `KILLS: ${this.kills}`;
  }

  gameOver() {
    this.gameOverElement.style.display = "block";
    // Add any other game over logic here (e.g., stopping enemies, player movement, etc.)
  }

  restartGame() {
    this.stopTimer();
    this.timeRemaining = 240;
    this.kills = 0;
    this.currentSpawnQueue = 0;
    this.killCounterElement.textContent = "KILLS: 0";
    this.gameOverElement.style.display = "none";
    this.startTimer();
    // Add any other restart logic here (e.g., resetting player position, clearing enemies, etc.)
  }

  update() {
    //update other UI elements every frame
  }
}
