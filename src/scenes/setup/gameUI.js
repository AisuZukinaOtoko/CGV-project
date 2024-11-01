export class GameUI {
  constructor(scene) {
    this.scene = scene;
    this.timerElement = document.getElementById("timer");
    this.killCounterElement = document.getElementById("kill-counter");
    this.waveOverlay = document.getElementById("waveOverlay");
    this.waveText = document.getElementById("waveText");

    this.startButton = document.getElementById("start-button");

    this.timeRemaining = 255; // 4 minutes in seconds
    this.kills = 0;
    this.timerInterval = null;
    this.currentWave = 1;
    this.isPaused = false; // Track if the game is paused

    this.spawnIntervals = [
      180, // 3:00
      120, // 2:00
      60, // 1:00
      30, // 0:30
    ];
    this.zombiesPerSpawn = 5;

    this.startTimer();
    this.setupKeyListener(); // Set up ESC key listener
    this.currentSpawnQueue = 0; // Track remaining zombies to spawn
    this.spawnTimer = null; // Timer for individual zombie spawns
  }

  setupKeyListener() {
    // Listen for the ESC key to toggle pause/resume
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        if (this.isPaused) {
          this.startButton.addEventListener("click", () => this.resumeTimer());
        } else {
          this.pauseTimer();
        }
      }
    });
  }

  setEnemyManager(enemyManager) {
    this.enemyManager = enemyManager;
  }

  startGame() {
    this.showWaveOverlay(this.currentWave); // Show Wave 1 at the start
    setTimeout(() => {
      if (!this.isPaused) {
        this.startTimer();
      }
    }, 3000); // Start the timer after showing the wave overlay for 3 seconds
  }

  startTimer() {
    this.isPaused = false; // Unpause when the timer starts
    this.updateTimerDisplay();
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      this.updateTimerDisplay();
      this.checkForNextWave();

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
        //this.gameOver();
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

  pauseTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
      this.isPaused = true; // Set paused state
    }
  }

  resumeTimer() {
    if (this.isPaused) {
      this.isPaused = false; // Unpause the game
      this.startTimer(); // Restart the timer
    }
  }

  updateTimerDisplay() {
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    this.timerElement.textContent = `${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  checkForNextWave() {
    // Show the wave overlay based on the time remaining
    if (this.timeRemaining === 240) {
      this.pauseForNextWave(1);
    } else if (this.timeRemaining === 180 && this.currentWave === 1) {
      this.pauseForNextWave(2);
    } else if (this.timeRemaining === 120 && this.currentWave === 2) {
      this.pauseForNextWave(3);
    } else if (this.timeRemaining === 60 && this.currentWave === 3) {
      this.pauseForNextWave(4);
    }
  }

  pauseForNextWave(nextWave) {
    this.pauseTimer();
    this.currentWave = nextWave;
    this.showWaveOverlay(this.currentWave);
    setTimeout(() => {
      this.resumeTimer();
    }, 3000); // Display each wave overlay for 3 seconds
  }

  showWaveOverlay(wave) {
    this.waveText.textContent = `Wave ${wave}`;
    this.waveOverlay.style.opacity = 1;

    // Hide the overlay after 3 seconds
    setTimeout(() => {
      this.waveOverlay.style.opacity = 0;
    }, 3000);
  }

  incrementKills() {
    this.kills++;
    this.killCounterElement.textContent = `KILLS: ${this.kills}`;
  }

  update() {
    // Update other UI elements every frame
  }

  // Hit animation logic
  triggerDamageEffect() {
    const overlay = document.getElementById("damageOverlay");
    overlay.style.opacity = 1;

    // Fade out the effect after a short delay
    setTimeout(() => {
      overlay.style.opacity = 0;
    }, 200); // Adjust timing as needed
  }
}
