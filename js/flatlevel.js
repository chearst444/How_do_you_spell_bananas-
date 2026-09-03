// Flat-level gameplay: monkey hops between word platforms and throws a
// banana at the one that's spelled correctly. 10 correct words per level
// sends the monkey into the vertical jumping shaft to the next level.

const WordDeckManager = {
  deck: [],
  ensure() {
    if (this.deck.length === 0) this.deck = buildWordDeck();
  },
  next() {
    this.ensure();
    return this.deck.pop();
  },
};

const TILE_SPRITES = ["log_whole", "lily_pad", "log_broken", "log_dark"];
// Spread across the full open play area now that the level fills the whole
// screen, not clustered in a thin band near the ground.
const TILE_X = [120, 370, 590, 830];
// Kept within single-jump reach of the ground (~140px) so every platform
// stays directly hoppable, just spread further apart than before.
const TILE_Y = [385, 460, 400, 470];
const GROUND_Y = 520;

const FlatLevel = {
  levelIndex: 0,
  monkey: null,
  platforms: [],
  ground: null,
  banana: null,
  correctCount: 0,
  needed: 10,
  currentWord: null,
  roundLocked: false,
  message: "",
  messageTimer: 0,
  props: [],

  init(levelIndex, monkey) {
    this.levelIndex = levelIndex % 4;
    this.monkey = monkey || new Monkey(80, GROUND_Y);
    this.monkey.x = 80;
    this.monkey.y = GROUND_Y;
    this.monkey.vx = 0;
    this.monkey.vy = 0;
    this.correctCount = 0;
    this.banana = null;
    this.roundLocked = false;
    this.throwInFlight = false;
    this.message = "";
    this.ground = new Platform(0, GROUND_Y, 960, 80, "log_whole", "ground");
    this.ground.solid = true;
    this._buildProps();
    this._nextRound();
    return this.monkey;
  },

  _buildProps() {
    const keys = Object.keys(ASSET_MANIFEST.props);
    this.props = [];
    const positions = [40, 250, 470, 690, 900];
    for (let i = 0; i < positions.length; i++) {
      const key = keys[(i + this.levelIndex * 2) % keys.length];
      this.props.push({ key, x: positions[i], scale: 0.55 + (i % 3) * 0.08 });
    }
  },

  _nextRound() {
    this.currentWord = WordDeckManager.next();
    const tiles = shuffle([
      { text: this.currentWord.word, correct: true },
      ...this.currentWord.misspellings.map((m) => ({ text: capitalize(m), correct: false })),
    ]);

    this.platforms = tiles.map((tile, i) => {
      const p = new Platform(TILE_X[i], TILE_Y[i], 130, 46, TILE_SPRITES[i], "word");
      p.word = { text: tile.text, correct: tile.correct, resolved: null };
      return p;
    });
    this.roundLocked = false;
    this.throwInFlight = false;
  },

  levelBackground() {
    const key = "level" + (this.levelIndex + 1);
    return ASSET_MANIFEST.levels[key];
  },

  // Each level's art is a set of full-canvas layered scene pieces (sky,
  // midground scenery, a scattered decorative layer, and a bottom "ledge"
  // strip), each mostly transparent outside its own band, PLUS one plain
  // tileable ground texture. Stacking all of them fills the whole screen
  // as one continuous scene, with the open middle band (where the sky
  // layer's own gradient shows through) acting as the play area the
  // monkey hops across.
  drawBackground(ctx, canvas) {
    const bg = this.levelBackground();

    const sky = Assets.get(bg.sky);
    if (sky && sky.complete) {
      // Extend the sky's own lowest opaque color downward first, so the
      // open play area reads as continuous air/sky instead of a hard cut.
      ctx.fillStyle = this._skyFillColor(bg);
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(sky, 0, 0, canvas.width, canvas.height);
    }

    const mid = Assets.get(bg.backdropTop || bg.floatingIslands || bg.darkRidge);
    if (mid && mid.complete) ctx.drawImage(mid, 0, 0, canvas.width, canvas.height);

    const accent = Assets.get(bg.floatingRocks || bg.bridgeGapRidge || bg.mushroomScatter || bg.groundPattern);
    if (accent && accent.complete) ctx.drawImage(accent, 0, 0, canvas.width, canvas.height);

    // Ground texture, tiled, sitting just under the bottom ledge art.
    const groundTile = Assets.get(bg.groundTile);
    if (groundTile && groundTile.complete) {
      const th = 100;
      const scale = th / groundTile.height;
      const tw = groundTile.width * scale;
      for (let x = 0; x < canvas.width; x += tw) {
        ctx.drawImage(groundTile, x, GROUND_Y - 10, tw + 1, th);
      }
    } else {
      ctx.fillStyle = "#4c5a2c";
      ctx.fillRect(0, GROUND_Y - 10, canvas.width, 100);
    }

    // Bottom ledge/wall layer on top, its opaque strip forming the visible
    // ground edge (rest of it is transparent, revealing the scene above).
    const ledge = Assets.get(bg.stoneLedge || bg.ropeBridge || bg.flowerGrass || bg.stoneGrassLedge);
    if (ledge && ledge.complete) ctx.drawImage(ledge, 0, 0, canvas.width, canvas.height);
  },

  _skyFillColor(bg) {
    const fallback = ["#6fa2bb", "#8a6a7a", "#7a9ab0", "#5f8a6a"];
    return fallback[this.levelIndex % fallback.length];
  },

  drawProps(ctx) {
    for (const prop of this.props) {
      const img = Assets.get(ASSET_MANIFEST.props[prop.key]);
      if (!img || !img.complete) continue;
      const h = 90 * prop.scale;
      const w = (img.width / img.height) * h;
      ctx.drawImage(img, prop.x, GROUND_Y - h + 10, w, h);
    }
  },

  throwAt(platform) {
    if (this.roundLocked || this.banana || this.throwInFlight || platform.word.resolved) return;
    this.throwInFlight = true;
    this.monkey.facing = platform.x + platform.w / 2 > this.monkey.x ? 1 : -1;
    this.monkey.startThrow(() => {
      this.banana = new Banana(this.monkey.x, this.monkey.y - this.monkey.h * 0.6, platform);
      this.banana.targetPlatform = platform;
    });
  },

  update(dt, canvas, hud) {
    this.monkey.update(dt, [this.ground, ...this.platforms]);
    this.monkey.x = Math.max(20, Math.min(canvas.width - 20, this.monkey.x));

    if (this.banana) {
      this.banana.update(dt);
      if (this.banana.done) {
        const platform = this.banana.targetPlatform;
        if (platform.word.correct) {
          platform.word.resolved = "correct";
          this.correctCount++;
          hud.addScore(10);
          this.message = "Correct! +10";
          this.messageTimer = 1.1;
          this.roundLocked = true;
        } else {
          platform.word.resolved = "wrong";
          hud.damage(2);
          this.message = "Not quite!";
          this.messageTimer = 0.8;
        }
        this.banana = null;
        this.throwInFlight = false;
      }
    }

    if (Input.pointer.justClicked && !this.roundLocked) {
      for (const p of this.platforms) {
        if (
          Input.pointer.x >= p.x &&
          Input.pointer.x <= p.x + p.w &&
          Input.pointer.y >= p.y - 40 &&
          Input.pointer.y <= p.y + p.h
        ) {
          this.throwAt(p);
        }
      }
    }

    if (this.messageTimer > 0) this.messageTimer -= dt;

    if (this.roundLocked && this.messageTimer <= 0) {
      if (this.correctCount >= this.needed) {
        return "advance"; // signal to game.js: go to shaft
      }
      this._nextRound();
    }
    return null;
  },

  draw(ctx, canvas) {
    this.drawBackground(ctx, canvas);
    this.drawProps(ctx);
    for (const p of this.platforms) p.draw(ctx);
    if (this.banana) this.banana.draw(ctx);
    this.monkey.draw(ctx);

    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "bold 20px 'Trebuchet MS', sans-serif";
    ctx.fillStyle = "#fff6df";
    ctx.strokeStyle = "#3a2a15";
    ctx.lineWidth = 4;
    const prompt = `Throw the banana at: "${this.currentWord.word}"`;
    ctx.strokeText(prompt, canvas.width / 2, 50);
    ctx.fillText(prompt, canvas.width / 2, 50);

    ctx.font = "16px 'Trebuchet MS', sans-serif";
    const progress = `Correct: ${this.correctCount} / ${this.needed}`;
    ctx.strokeText(progress, canvas.width / 2, 76);
    ctx.fillText(progress, canvas.width / 2, 76);

    if (this.messageTimer > 0) {
      ctx.font = "bold 22px 'Trebuchet MS', sans-serif";
      ctx.fillStyle = this.message.startsWith("Correct") ? "#9dffb0" : "#ff9d9d";
      ctx.strokeText(this.message, canvas.width / 2, 400 - 10);
      ctx.fillText(this.message, canvas.width / 2, 400 - 10);
    }
    ctx.restore();
  },
};

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
