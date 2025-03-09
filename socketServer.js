const Server = require('socket.io');

module.exports = function (server) {
  const io = new Server(server);
  let players = [];
  let idCount = 0;
  let collectibleCount = 0;
  const CANVAS_BOUND_X = 588;
  const CANVAS_BOUND_Y = 378;
  let collectibles = [];

  // Periodically spawn a collectible if none exist
  setInterval(() => {
    if (collectibles.length === 0) {
      collectibleCount++;
      const collectible = {
        x: Math.floor(Math.random() * (CANVAS_BOUND_X - 10 + 1)),
        y: Math.floor(Math.random() * (CANVAS_BOUND_Y - 10 + 1)),
        value: Math.floor(Math.random() * 3) + 1,
        id: collectibleCount,
        w: 10,
        h: 10,
      };
      collectibles.push(collectible);
      io.emit("collectible:spawn", collectible);
    }
  }, 1000);

  // Handle new socket connections
  io.on("connection", (socket) => {
    idCount++;
    const playerId = idCount;

    // When a player disconnects, remove them from the players list
    socket.on("disconnect", () => {
      players.splice(players.findIndex((player) => player.id === playerId), 1);
      io.emit("player:leave", { id: playerId });
    });

    // Handle player movement
    socket.on("player:move", (data) => {
      const player = players.find((p) => p.id === data.id);
      if (player) {
        // Prevent movement outside the canvas boundaries
        if (player.x + data.x >= CANVAS_BOUND_X || player.x + data.x <= 0) return;
        if (player.y + data.y >= CANVAS_BOUND_Y || player.y + data.y <= 0) return;

        if (data.x) player.x += data.x;
        if (data.y) player.y += data.y;
      }
      io.emit("player:move", { x: player.x, y: player.y, id: data.id });
    });

    // Handle collectible collection by a player
    socket.on("player:collected", (data) => {
      const player = players.find((p) => p.id === data.id);
      const collectible = collectibles.find((c) => c.id === data.collectible);

      if (
        collectible &&
        player.x < collectible.x + collectible.w &&
        player.x + 32 > collectible.x &&
        player.y < collectible.y + collectible.h &&
        player.y + 32 > collectible.y
      ) {
        collectibles.splice(
          collectibles.findIndex((c) => c.id === data.collectible),
          1
        );
        io.emit("collectible:collected", { id: player.id, collectible: data.collectible });
      }
    });

    // Add new player and inform all clients
    players.push({ id: playerId, score: 0, x: 100, y: 100 });
    io.emit("player:new", playerId);
    socket.emit("connected", { you: playerId, players, collectibles });
    return true;
  });
};
