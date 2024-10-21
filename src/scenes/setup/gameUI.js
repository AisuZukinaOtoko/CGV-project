// gameUI.js
export class GameUI {
    constructor(scene) {
      this.scene = scene;
      this.timerElement = document.getElementById('timer');
      this.killCounterElement = document.getElementById('kill-counter');
      this.gameOverElement = document.getElementById('game-over');
      this.restartButton = document.getElementById('restart-button');
  
      this.timeRemaining = 240; // 4 minutes in seconds
      this.kills = 0;
      this.timerInterval = null;
  
      this.setupEventListeners();
      this.startTimer();
    }
  
    setupEventListeners() {
      this.restartButton.addEventListener('click', () => this.restartGame());
    }
  
    startTimer() {
      this.updateTimerDisplay();
      this.timerInterval = setInterval(() => {
        this.timeRemaining--;
        this.updateTimerDisplay();
        if (this.timeRemaining <= 0) {
          this.stopTimer();
          this.gameOver();
        }
      }, 1000);
    }
  
    stopTimer() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
    }
  
    updateTimerDisplay() {
      const minutes = Math.floor(this.timeRemaining / 60);
      const seconds = this.timeRemaining % 60;
      this.timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
      this.killCounterElement.textContent = 'KILLS: 0';
      this.gameOverElement.style.display = 'none';
      this.startTimer();
      // Add any other restart logic here (e.g., resetting player position, clearing enemies, etc.)
    }
  
    update() {
      //update other UI elements every frame
    }
}