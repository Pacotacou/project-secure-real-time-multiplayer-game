import Collectible from './Collectible.mjs';
import Player from './Player.mjs';

const socket = io();

// Game state
const players = [];
let currentPlayer = null;
const activeKeys = {};
const collectibles = [];

// Handle keyboard input for WASD keys
const validKeys = ["KeyW", "KeyA", "KeyS", "KeyD"];
document.addEventListener("keydown", (ev) => {
  if (validKeys.includes(ev.code)) {
    activeKeys[ev.code] = true;
  }
});
document.addEventListener("keyup", (ev) => {
  if (validKeys.includes(ev.code)) {
    activeKeys[ev.code] = false;
  }
});

// Canvas setup
const canvas = document.getElementById('game-window');
const ctx = canvas.getContext('2d');

// Main update/render function
function update() {
  // Clear the canvas and optionally reset state if available
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (typeof ctx.reset === "function") {
    ctx.reset();
  }

  // Draw background layers
  ctx.fillStyle = "slate";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "gray";
  ctx.fillRect(10, 60, canvas.width - 20, canvas.height - 70);

  // Draw UI elements
  ctx.font = "25px serif";
  ctx.textAlign = "left";
  ctx.fillText("Controls: WASD", 10, 40);

  ctx.font = "30px serif";
  ctx.textAlign = "center";
  ctx.fillText("My Game", canvas.width / 2, 40);

  ctx.font = "25px serif";
  ctx.textAlign = "right";
  ctx.fillText(
    currentPlayer ? currentPlayer.calculateRank(players) : "Loading",
    canvas.width - 10,
    40
  );

  // Process input to move the current player
  if (currentPlayer) {
    if (activeKeys['KeyS']) currentPlayer.movePlayer("down", 4);
    if (activeKeys['KeyW']) currentPlayer.movePlayer("up", 4);
    if (activeKeys['KeyA']) currentPlayer.movePlayer("left", 4);
    if (activeKeys['KeyD']) currentPlayer.movePlayer("right", 4);
  }

  // Render all players
  players.forEach((player) => {
    player.render();
  });

  // Render collectibles and check collisions with the current player
  collectibles.forEach((collectible) => {
    collectible.render();
    if (currentPlayer && currentPlayer.collision(collectible)) {
      console.log("COLLISION DETECTED");
      socket.emit('player:collected', { id: currentPlayer.id, collectible: collectible.id });
    }
  });
}

// Game loop using requestAnimationFrame
function gameLoop() {
  update();
  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

// Socket event handlers

// New player connected
socket.on("player:new", (playerId) => {
  if (!players.find((p) => p.id === playerId)) {
    players.push(new Player({ x: 100, y: 100, score: 0, id: playerId }));
  }
});

// Update movement for a player (except for current player)
socket.on("player:move", (data) => {
  const player = players.find((p) => p.id === data.id);
  if (player && player.id !== currentPlayer?.id) {
    player.setPos(
      data.x !== undefined ? data.x : player.x,
      data.y !== undefined ? data.y : player.y
    );
  }
});

// Remove a player that has left
socket.on("player:leave", (data) => {
  const index = players.findIndex((p) => p.id === data.id);
  if (index !== -1) {
    players.splice(index, 1);
  }
});

// Spawn a new collectible
socket.on("collectible:spawn", (data) => {
  collectibles.push(new Collectible(data));
});

// When a collectible is collected, update score and remove it
socket.on("collectible:collected", (data) => {
  const player = players.find((p) => p.id === data.id);
  const collectible = collectibles.find((c) => c.id === data.collectible);
  if (player && collectible) {
    player.score += Number(collectible.value);
    collectibles.splice(collectibles.indexOf(collectible), 1);
  }
});

// On initial connection, set up players and collectibles
socket.on("connected", (data) => {
  if (data?.players) {
    // Reset the players array with current data
    players.length = 0;
    data.players.forEach((playerData) => {
      players.push(new Player(playerData));
    });
  }
  currentPlayer = players.find((p) => p.id === data.you);
  
  if (data.collectibles) {
    collectibles.length = 0;
    data.collectibles.forEach((colData) => {
      collectibles.push(new Collectible(colData));
    });
  }
});

// Handle connection errors
socket.on("connect_error", (err) => {
  console.error(err);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = "center";
  ctx.font = "30px serif";
  ctx.fillText("Failed to connect", canvas.width / 2, canvas.height / 2);
});
