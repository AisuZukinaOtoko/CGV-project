document.addEventListener("DOMContentLoaded", () => {
    const intro = document.getElementById("intro");
    const startButton = document.getElementById("start-button");
    const exitButton = document.getElementById("exit-button");
    let gameModule = null; // Store the imported module
    let isGamePaused = false; // Track the pause state
    let gameStarted = false; // Track if the game has been started at least once

    // Function to start or resume the game
    function startGame() {
        intro.style.display = "none";

        if (isGamePaused && gameModule) {
            // Resume the game if it's paused
            gameModule.resumeGame();
            isGamePaused = false;
            console.log("Game resumed!");
        } else if (!gameStarted) {
            // Load the game script dynamically the first time
            import('../main.js').then((module) => {
                gameModule = module;
                gameStarted = true;
                console.log("Game script loaded!");
                // Call the start function if available
                if (gameModule.startGame) {
                    gameModule.startGame();
                }
            }).catch((error) => {
                console.error("Error loading the game script:", error);
            });
            console.log("Game started!");
        }
    }

    // Function to show the intro screen and pause the game
    function showIntro() {
        intro.style.display = "flex";
        if (gameModule && !isGamePaused) {
            gameModule.pauseGame();
            isGamePaused = true;
            console.log("Game paused/showing menu.");
        }
    }

    // Function to exit the game
    function exitGame() {
        // alert('Exiting the game...');
        intro.style.display = "flex";
        // isGamePaused = false;
        // gameStarted = false;
        console.log("Game exited and reset.");
        // Add any other logic to reset the game state here, if needed.
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
});


