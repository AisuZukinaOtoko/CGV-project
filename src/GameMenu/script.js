document.addEventListener("DOMContentLoaded", () => {
  const loadingDelay = 20000; // make this match the one in index,html

  // Select the loading screen and start button
  const loadingScreen = document.getElementById("loading-screen");

  const intro = document.getElementById("intro");
  const gameOver = document.getElementById("Game-over");
  const gameCompleted = document.getElementById("Game-over1");

  const startButton = document.getElementById("start-button");
  const exitButton = document.getElementById("exit-button");
  const exitButton1 = document.getElementById("exit-button1");
  const exitButton2 = document.getElementById("exit-button2");

  const restartButton = document.getElementById("restart-button1");
  const restartButton1 = document.getElementById("restart-button2");
  const restartButton2 = document.getElementById("restart-button3");

  const audioSettingsButton = document.getElementById("audio-settings-button");
  // const volumeSlider = document.getElementById("volume-slider");
  const controlsButton = document.getElementById("controls-button");
  const audioButton = document.getElementById("audio-button");
  const audioPopup = document.getElementById("audio-popup");
  const controlsPopup = document.getElementById("controls-popup");
  const closeControlsButton = document.getElementById("close-controls");
  const closeAudioButton = document.getElementById("close-audio");

  const menuSound = document.getElementById("menu-sound"); // Reference to the audio element

  let gameModule = null; // Store the imported module
  let isGamePaused = false; // Track the pause state
  let gameStarted = false; // Track if the game has been started at least once
  let isAudioMuted = false;

  // Start button event listener to display the loading screen
  startButton.addEventListener("click", function () {
    // Display the loading screen
    loadingScreen.classList.remove("hidden");

    // Hide the loading screen after the delay and start the game
    setTimeout(() => {
      loadingScreen.classList.add("hidden");
      startGame(); // Replace with your actual game start function
      //userInterface.resumeTimer();
    }, loadingDelay);
  });

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

  function toggleAudio() {
    isAudioMuted = !isAudioMuted;
    menuSound.muted = isAudioMuted;
    audioButton.textContent = isAudioMuted ? "Unmute Sound" : "Mute Sound";
  }

  // function adjustVolume() {
  //   menuSound.volume = volumeSlider.value;
  // }

  function showControls() {
    controlsPopup.classList.remove("hidden");
  }

  function hideControls() {
    controlsPopup.classList.add("hidden");
  }

  function showAudioSettings() {
    audioPopup.classList.remove("hidden");
  }

  function hideAudioSettings() {
    audioPopup.classList.add("hidden");
  }

  function restartGame() {
    // Fallback: Reload the entire page if the game module isn't available or if a full refresh is needed
    location.reload();
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
  function showMenu() {
    intro.style.display = "flex";
    playIntroSound(); // Play sound when showing the intro or pause menu
    if (gameModule && !isGamePaused) {
      gameModule.pauseGame();
      isGamePaused = true;
      console.log("Game paused/showing menu.");
    }
  }

  // Function to show the game over screen
  function showGameOver() {
    gameOver.classList.remove("hidden"); // Show the game over screen
    intro.style.display = "none"; // Hide intro if visible
    playIntroSound(); // Play sound when showing the game over screen
    if (gameModule && !isGamePaused) {
      gameModule.pauseGame(); // Pause the game when showing game over
      isGamePaused = true;
      console.log("Game paused, showing game over screen.");
    }
  }

  // Function to show the game completed screen
  function showGameCompleted() {
    gameCompleted.classList.remove("hidden"); // Show the game over screen
    intro.style.display = "none"; // Hide intro if visible
    playIntroSound(); // Play sound when showing the game over screen
    if (gameModule && !isGamePaused) {
      gameModule.pauseGame(); // Pause the game when showing game over
      isGamePaused = true;
      console.log("Game paused, showing game over screen.");
    }
  }

  // Function to exit the game
  function exitGame() {
    intro.style.display = "flex";
    stopIntroSound(); // Optionally stop sound when exiting
    console.log("Game exited and reset.");
    window.close();
  }

  // Event listener for starting the game when the start button is clicked resume-button
  startButton.addEventListener("click", startGame);
  restartButton.addEventListener("click", restartGame);
  restartButton1.addEventListener("click", restartGame);
  restartButton2.addEventListener("click", restartGame);

  // Event listener for exiting the game when the exit button is clicked
  exitButton.addEventListener("click", exitGame);
  exitButton1.addEventListener("click", exitGame);
  exitButton2.addEventListener("click", exitGame);

  controlsButton.addEventListener("click", showControls);
  audioButton.addEventListener("click", toggleAudio);
  audioSettingsButton.addEventListener("click", showAudioSettings);
  // volumeSlider.addEventListener("input", adjustVolume);
  closeControlsButton.addEventListener("click", hideControls);
  closeAudioButton.addEventListener("click", hideAudioSettings);

  // Event listener for pressing 'ESC' to toggle between pause and resume
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (isGamePaused) {
        startGame(); // Resume the game if it was paused
      } else {
        showMenu(); // Pause the game if it was running
      }
    }
  });

  // Event listener for pressing 'ESC' to toggle between pause and resume
  document.addEventListener("keydown", (event) => {
    if (event.key === "q" || event.key === "Q") {
      showGameOver(); // Pause the game if it was running
    }
  });

  // Event listener for pressing 'ESC' to toggle between pause and resume
  document.addEventListener("keydown", (event) => {
    if (event.key === "e" || event.key === "E") {
      showGameCompleted(); // Pause the game if it was running
    }
  });

  // Play sound initially when the DOM content is loaded (for the intro screen)
  playIntroSound();
});
