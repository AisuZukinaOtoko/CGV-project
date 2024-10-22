document.addEventListener("DOMContentLoaded", () => {
  const intro = document.getElementById("intro");
  const startButton = document.getElementById("start-button");
  const exitButton = document.getElementById("exit-button");
  const menuSound = document.getElementById("menu-sound"); // Reference to the audio element
  let gameModule = null; // Store the imported module
  let isGamePaused = false; // Track the pause state
  let gameStarted = false; // Track if the game has been started at least once

  // Function to play menu sound
  function playIntroSound() {
    if (menuSound) {
      menuSound.play();
      console.log("Menu sound playing...");
    }
  }

  // Function to stop menu sound
  function stopIntroSound() {
    if (menuSound) {
      menuSound.pause();
      menuSound.currentTime = 0; // Reset sound to the beginning when stopped
      console.log("Menu sound stopped.");
    }
  }

  // Function to start or resume the game
  function startGame() {
    intro.style.display = "none"; // Hide intro screen
    stopIntroSound(); // Stop the menu sound when the game starts

    if (isGamePaused && gameModule) {
      // Resume the game if it's paused
      gameModule.resumeGame();
      isGamePaused = false;
      console.log("Game resumed!");
    } else if (!gameStarted) {
      // Load the game script dynamically the first time
      import("../main.js")
        .then((module) => {
          gameModule = module;
          gameStarted = true;
          console.log("Game script loaded!");
          if (gameModule.startGame) {
            gameModule.startGame();
          }
        })
        .catch((error) => {
          console.error("Error loading the game script:", error);
        });
      console.log("Game started!");
    }
  }

  // Function to show the intro screen and pause the game
  function showIntro() {
    intro.style.display = "flex";
    playIntroSound(); // Play sound when showing the intro or pause menu
    if (gameModule && !isGamePaused) {
      gameModule.pauseGame();
      isGamePaused = true;
      console.log("Game paused/showing menu.");
    }
  }

  // Function to exit the game
  function exitGame() {
    intro.style.display = "flex";
    stopIntroSound(); // Optionally stop sound when exiting
    console.log("Game exited and reset.");
    window.close();
  }

  // Event listener for starting the game when the start button is clicked
  startButton.addEventListener("click", startGame);

  // Event listener for exiting the game when the exit button is clicked
  exitButton.addEventListener("click", exitGame);

  // Event listener for pressing 'ESC' to toggle between pause and resume
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (isGamePaused) {
        startGame(); // Resume the game if it was paused
      } else {
        showIntro(); // Pause the game if it was running
      }
    }
  });

  // Play sound initially when the DOM content is loaded (for the intro screen)
  playIntroSound();
});
