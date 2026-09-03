// Bootstraps the canvas, drives the state machine (menu / flat level /
// shaft / game over), and renders the HUD.

const STATE = { MENU: "menu", FLAT: "flat", SHAFT: "shaft", GAMEOVER: "gameover" };

const HUD = {
  score: 0,
  health: 100,
  reset() {
    this.score = 0;
    this.health = 100;
  },
  addScore(n) {
    this.score += n;
  },
  damage(n) {
    this.health = Math.max(0, this.health - n);
  },
  draw(ctx) {
    // Health bar
    const x = 20,
      y = 20,
      w = 220,
      h = 26;
    ctx.save();
    ctx.fillStyle = "#232619";
    ctx.strokeStyle = "#687832";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 6);
    ctx.fill();
    ctx.stroke();

    const pct = this.health / 100;
    const barColor = pct > 0.5 ? "#c65a4a" : pct > 0.25 ? "#d98a3a" : "#c62b2b";
    ctx.fillStyle = barColor;
    ctx.beginPath();
    ctx.roundRect(x + 3, y + 3, (w - 6) * pct, h - 6, 4);
    ctx.fill();

    ctx.fillStyle = "#fff6df";
    ctx.font = "bold 13px 'Trebuchet MS', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`HP ${Math.round(this.health)}`, x + w / 2, y + h / 2 + 1);

    // Score
    const sx = x,
      sy = y + h + 10;
    ctx.fillStyle = "#232619";
    ctx.strokeStyle = "#687832";
    ctx.beginPath();
    ctx.roundRect(sx, sy, 150, 30, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffd35c";
    ctx.font = "bold 16px 'Trebuchet MS', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`\u{1F34C} ${this.score}`, sx + 12, sy + 16);
    ctx.restore();
  },
};

const Game = {
  canvas: null,
  ctx: null,
  state: STATE.MENU,
  sharedMonkey: null,
  levelIndex: 0,
  shaftIndex: 0,
  lastTime: 0,

  init() {
    this.canvas = document.getElementById("game");
    this.ctx = this.canvas.getContext("2d");
    Input.init(this.canvas);

    Assets.loadAll((frac) => {
      const fill = document.getElementById("loading-fill");
      if (fill) fill.style.width = Math.round(frac * 100) + "%";
    }).then(() => {
      document.getElementById("loading").classList.add("hidden");
      requestAnimationFrame((t) => this.loop(t));
    });
  },

  goToMenu() {
    this.state = STATE.MENU;
  },

  startGame() {
    HUD.reset();
    this.levelIndex = 0;
    this.shaftIndex = 0;
    this.sharedMonkey = new Monkey(80, 520);
    FlatLevel.init(this.levelIndex, this.sharedMonkey);
    this.state = STATE.FLAT;
  },

  loop(time) {
    const dt = Math.min(0.05, (time - this.lastTime) / 1000 || 0);
    this.lastTime = time;

    this.update(dt);
    this.render();
    Input.clearFrame();

    requestAnimationFrame((t) => this.loop(t));
  },

  update(dt) {
    if (this.state === STATE.MENU) {
      MenuScreen.update(this.canvas, {
        onPlay: () => this.startGame(),
        onExit: () => {},
      });
    } else if (this.state === STATE.FLAT) {
      const result = FlatLevel.update(dt, this.canvas, HUD);
      if (result === "advance") {
        this.shaftIndex++;
        Shaft.init(this.shaftIndex, this.sharedMonkey);
        this.state = STATE.SHAFT;
      }
      if (HUD.health <= 0) this.state = STATE.GAMEOVER;
    } else if (this.state === STATE.SHAFT) {
      const result = Shaft.update(dt, this.canvas, HUD);
      if (result === "advance") {
        this.levelIndex++;
        FlatLevel.init(this.levelIndex, this.sharedMonkey);
        this.state = STATE.FLAT;
      }
      if (HUD.health <= 0) this.state = STATE.GAMEOVER;
    } else if (this.state === STATE.GAMEOVER) {
      if (Input.pointer.justClicked) {
        this.goToMenu();
      }
    }
  },

  render() {
    const ctx = this.ctx;
    const canvas = this.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (this.state === STATE.MENU) {
      MenuScreen.draw(ctx, canvas, this.lastTime / 1000);
    } else if (this.state === STATE.FLAT) {
      FlatLevel.draw(ctx, canvas);
      HUD.draw(ctx);
    } else if (this.state === STATE.SHAFT) {
      Shaft.draw(ctx, canvas);
      HUD.draw(ctx);
    } else if (this.state === STATE.GAMEOVER) {
      this.drawGameOver(ctx, canvas);
    }
  },

  drawGameOver(ctx, canvas) {
    ctx.fillStyle = "rgba(10,8,5,0.85)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.textAlign = "center";
    ctx.fillStyle = "#ff9d9d";
    ctx.font = "bold 42px 'Trebuchet MS', sans-serif";
    ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 30);
    ctx.fillStyle = "#fff6df";
    ctx.font = "bold 22px 'Trebuchet MS', sans-serif";
    ctx.fillText(`Final Score: ${HUD.score}`, canvas.width / 2, canvas.height / 2 + 20);
    ctx.font = "16px 'Trebuchet MS', sans-serif";
    ctx.fillText("Click anywhere to return to the menu", canvas.width / 2, canvas.height / 2 + 60);
    ctx.restore();
  },
};

window.addEventListener("DOMContentLoaded", () => Game.init());
