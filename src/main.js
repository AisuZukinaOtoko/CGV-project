import Game from "./Game.js";

const game = new Game();
window.addEventListener("resize", game.OnWindowResize);
game.Run();
