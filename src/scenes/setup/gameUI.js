// gameUI.js
export class GameUI {
    constructor(scene) {
      this.scene = scene;
      this.timerElement = document.getElementById('timer');
      this.killCounterElement = document.getElementById('kill-counter');
      this.gameOverElement = document.getElementById('game-over');
      this.restartButton = document.getElementById('restart-button');
      this.waveOverlay = document.getElementById('waveOverlay');
      this.waveText = document.getElementById('waveText');
  
      this.timeRemaining = 240; // 4 minutes in seconds
      this.kills = 0;
      this.timerInterval = null;
      this.currentWave = 1;
  
      this.setupEventListeners();
      this.startTimer();
    }
  
    setupEventListeners() {
      this.restartButton.addEventListener('click', () => this.restartGame());
    }

    startGame() {
      this.showWaveOverlay(this.currentWave); // Show Wave 1 at the start
      setTimeout(() => {
          this.startTimer();
      }, 3000); // Start the timer after showing the wave overlay for 3 seconds
  }
  
    startTimer() {
      this.updateTimerDisplay();
      this.timerInterval = setInterval(() => {
        this.timeRemaining--;
        this.updateTimerDisplay();
        this.checkForNextWave();

        if (this.timeRemaining <= 0) {
          this.stopTimer();
        //   this.gameOver();
        }
      }, 1000);
    }
  
    stopTimer() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
    }
  
    pauseTimer() {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    resumeTimer() {
        this.startTimer();
    }

    updateTimerDisplay() {
      const minutes = Math.floor(this.timeRemaining / 60);
      const seconds = this.timeRemaining % 60;
      this.timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    checkForNextWave() {
      // Show the wave overlay based on the time remaining
      if (this.timeRemaining === 180 && this.currentWave === 1) {
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
  
    gameOver() {
      this.gameOverElement.style.display = 'block';
      // Add any other game over logic here (e.g., stopping enemies, player movement, etc.)
    }
  
    restartGame() {
      this.stopTimer();
      this.timeRemaining = 240;
      this.kills = 0;
      this.currentWave = 1;
      this.killCounterElement.textContent = 'KILLS: 0';
      this.gameOverElement.style.display = 'none';
      this.showWaveOverlay(this.currentWave);
      setTimeout(() => {
        this.startTimer();
      }, 3000);
      // Add any other restart logic here (e.g., resetting player position, clearing enemies, etc.)
    }
  
    update() {
      //update other UI elements every frame
    }

  //hit animation logic

  triggerDamageEffect() {
    const overlay = document.getElementById("damageOverlay");
    overlay.style.opacity = 1;

    // Fade out the effect after a short delay
    setTimeout(() => {
        overlay.style.opacity = 0;
    }, 200); // Adjust timing as needed
  }

  // if (event.key.toLowerCase() === "z") {
  //   triggerDamageEffect();
  // }


}