// Flat-level gameplay: letters are scattered around the open level (no
// platforms to stand on) and the monkey throws bananas at them to fill in
// the blanks of the current word, left to right. Get 10 words completed
// and the monkey heads into the vertical jumping shaft to the next level.

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

const GROUND_Y = 520;
const LETTER_TILE = 68;
const DECOY_COUNT = 5;
// y0 clears even a 3-line-wrapped clue panel (rare, but the panel grows
// with clue length so this has to stay below its worst case, not its
// typical case).
const SCATTER_BOUNDS = { x0: 50, x1: 910, y0: 215, y1: 470 };
// Bottom-left corner where the monkey starts and idles - keep letters out
// of it so nothing spawns hidden right behind/under him.
const MONKEY_HOME_ZONE = { x1: 190, y0: 360 };

const FlatLevel = {
  levelIndex: 0,
  monkey: null,
  ground: null,
  banana: null,
  correctCount: 0,
  needed: 5,
  currentWord: null,
  letters: [],
  blanks: [],
  remainingNeeded: {},
  roundLocked: false,
  throwInFlight: false,
  message: "",
  messageTimer: 0,
  props: [],

  init(levelIndex, monkey) {
    // Only 3 distinct background sets - levels 4+ reuse 1-3 rather than
    // needing new art for every level.
    this.levelIndex = levelIndex % 3;
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
    // vineHanging is drawn separately from the canopy, not as a ground prop.
    const keys = Object.keys(ASSET_MANIFEST.props).filter((k) => k !== "vineHanging");
    this.props = [];
    const positions = [40, 250, 470, 690, 900];
    for (let i = 0; i < positions.length; i++) {
      const key = keys[(i + this.levelIndex * 2) % keys.length];
      this.props.push({ key, x: positions[i], scale: 0.55 + (i % 3) * 0.08 });
    }

    // A vine dangling down each side of the screen, framing the play area.
    // Kept in the narrow strips left of the HP/banana HUD (x0..~20) and
    // right of the clue panel (~940..canvas.width) so they hang clear of
    // both the panels and the letter-scatter zone (SCATTER_BOUNDS starts
    // at x=50 and ends at x=910) instead of getting swallowed behind them.
    this.hangingVines = [
      { x: 6, dir: 1 },
      { x: 936, dir: -1 },
    ].map((v, i) => ({
      x: v.x,
      len: 210 + ((i + this.levelIndex) % 3) * 30,
    }));
  },

  _nextRound() {
    this.currentWord = WordDeckManager.next();
    const word = this.currentWord.word.toUpperCase();

    this.blanks = word.split("").map(() => null);
    this.remainingNeeded = {};
    for (const c of word) this.remainingNeeded[c] = (this.remainingNeeded[c] || 0) + 1;

    const chars = word.split("");
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let i = 0; i < DECOY_COUNT; i++) {
      chars.push(alphabet[Math.floor(Math.random() * alphabet.length)]);
    }
    const order = shuffle(chars);

    // Tiles use top-left x/y + w/h, same convention as Platform, so Banana's
    // targeting math (target.x + target.w/2) lands in the tile's center.
    const placed = [];
    this.letters = order.map((char) => {
      const center = this._pickSpot(placed);
      placed.push(center);
      return {
        char,
        x: center.x - LETTER_TILE / 2,
        y: center.y - LETTER_TILE / 2,
        w: LETTER_TILE,
        h: LETTER_TILE,
        resolved: null,
      };
    });

    this.roundLocked = false;
    this.throwInFlight = false;
  },

  // Rejection-sample a scatter position that doesn't overlap already-placed
  // tiles and isn't in the monkey's home corner (he starts at x=80 on the
  // ground, and at his current size that corner hides anything dropped
  // right behind him); falls back to whatever the last attempt was if it
  // can't find a clean spot (only matters for very crowded rounds).
  _pickSpot(placed) {
    const minDist = LETTER_TILE * 1.3;
    const inMonkeyCorner = (x, y) => x < MONKEY_HOME_ZONE.x1 && y > MONKEY_HOME_ZONE.y0;
    for (let attempt = 0; attempt < 200; attempt++) {
      const x = SCATTER_BOUNDS.x0 + Math.random() * (SCATTER_BOUNDS.x1 - SCATTER_BOUNDS.x0);
      const y = SCATTER_BOUNDS.y0 + Math.random() * (SCATTER_BOUNDS.y1 - SCATTER_BOUNDS.y0);
      if (inMonkeyCorner(x, y)) continue;
      const ok = placed.every((p) => Math.hypot(p.x - x, p.y - y) >= minDist);
      if (ok) return { x, y };
    }
    return {
      x: SCATTER_BOUNDS.x0 + Math.random() * (SCATTER_BOUNDS.x1 - SCATTER_BOUNDS.x0),
      y: SCATTER_BOUNDS.y0,
    };
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
    const fallback = ["#6fa2bb", "#8a6a7a", "#7a9ab0"];
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

  // A vine dangling down each side of the screen from the canopy, framing
  // the play area. Drawn before the HUD/clue panel so those still cover
  // whatever top sliver of vine falls behind them.
  drawHangingVines(ctx) {
    const img = Assets.get(ASSET_MANIFEST.props.vineHanging);
    if (!img || !img.complete) return;
    for (const vine of this.hangingVines || []) {
      const w = img.width * (vine.len / img.height);
      ctx.drawImage(img, vine.x, 0, w, vine.len);
    }
  },

  drawLetterTile(ctx, tile) {
    if (tile.resolved === "correct") return; // consumed into a blank already
    let fill = "#e8d3a8";
    let border = "#5a3d23";
    if (tile.resolved === "wrong") {
      fill = "#c98a8a";
      border = "#6b2323";
    }
    const cx = tile.x + tile.w / 2;
    const cy = tile.y + tile.h / 2;
    ctx.save();
    ctx.fillStyle = border;
    ctx.beginPath();
    ctx.roundRect(tile.x, tile.y, tile.w, tile.h, 8);
    ctx.fill();
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.roundRect(tile.x + 3, tile.y + 3, tile.w - 6, tile.h - 6, 6);
    ctx.fill();

    ctx.fillStyle = "#3a2a18";
    ctx.font = "bold 36px 'Trebuchet MS', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(tile.char, cx, cy + 1);
    ctx.restore();
  },

  drawBlanks(ctx, canvas) {
    const word = this.currentWord.word.toUpperCase();
    const boxW = Math.min(46, 760 / word.length);
    const gap = 6;
    const totalW = word.length * boxW + (word.length - 1) * gap;
    const startX = canvas.width / 2 - totalW / 2;
    const y = GROUND_Y - 34;

    ctx.save();
    for (let i = 0; i < word.length; i++) {
      const x = startX + i * (boxW + gap);
      ctx.fillStyle = "#2c2214";
      ctx.beginPath();
      ctx.roundRect(x, y, boxW, boxW, 5);
      ctx.fill();
      ctx.fillStyle = this.blanks[i] ? "#e8d3a8" : "#4a3d2a";
      ctx.beginPath();
      ctx.roundRect(x + 2, y + 2, boxW - 4, boxW - 4, 4);
      ctx.fill();
      if (this.blanks[i]) {
        ctx.fillStyle = "#3a2a18";
        ctx.font = "bold 22px 'Trebuchet MS', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.blanks[i], x + boxW / 2, y + boxW / 2 + 1);
      }
    }
    ctx.restore();
  },

  throwAt(tile) {
    if (this.roundLocked || this.banana || this.throwInFlight || tile.resolved) return;
    this.throwInFlight = true;
    this.monkey.facing = tile.x + tile.w / 2 > this.monkey.x ? 1 : -1;
    this.monkey.startThrow(() => {
      this.banana = new Banana(this.monkey.x, this.monkey.y - this.monkey.h * 0.6, tile);
      this.banana.targetTile = tile;
    });
  },

  _resolveHit(tile, hud) {
    const word = this.currentWord.word.toUpperCase();
    if (this.remainingNeeded[tile.char] > 0) {
      this.remainingNeeded[tile.char]--;
      for (let i = 0; i < word.length; i++) {
        if (word[i] === tile.char && !this.blanks[i]) {
          this.blanks[i] = tile.char;
          break;
        }
      }
      tile.resolved = "correct";
      const complete = this.blanks.every((b) => b);
      if (complete) {
        this.correctCount++;
        hud.addScore(10);
        this.message = "Correct! +10";
        this.messageTimer = 1.1;
        this.roundLocked = true;
      }
    } else {
      tile.resolved = "wrong";
      hud.damage(2);
      this.message = "Wrong letter!";
      this.messageTimer = 0.6;
    }
  },

  update(dt, canvas, hud) {
    this.monkey.update(dt, [this.ground]);
    this.monkey.x = Math.max(20, Math.min(canvas.width - 20, this.monkey.x));

    if (this.banana) {
      this.banana.update(dt);
      if (this.banana.done) {
        this._resolveHit(this.banana.targetTile, hud);
        this.banana = null;
        this.throwInFlight = false;
      }
    }

    if (Input.pointer.justClicked && !this.roundLocked) {
      // A little tap forgiveness beyond the drawn tile edge - the canvas
      // scales down a lot on small phone screens, so the visual tile is
      // tiny in real touch pixels even though it's a fixed 50px here.
      const pad = 10;
      for (const tile of this.letters) {
        if (tile.resolved) continue;
        if (
          Input.pointer.x >= tile.x - pad &&
          Input.pointer.x <= tile.x + tile.w + pad &&
          Input.pointer.y >= tile.y - pad &&
          Input.pointer.y <= tile.y + tile.h + pad
        ) {
          this.throwAt(tile);
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
    this.drawHangingVines(ctx);
    this.drawProps(ctx);
    for (const tile of this.letters) this.drawLetterTile(ctx, tile);
    this.drawBlanks(ctx, canvas);
    if (this.banana) this.banana.draw(ctx);
    this.monkey.draw(ctx);

    this.drawHeader(ctx, canvas);
  },

  // Greedy word-wrap: splits text into lines no wider than maxWidth under
  // ctx's currently-set font.
  _wrapText(ctx, text, maxWidth) {
    const words = text.split(" ");
    const lines = [];
    let current = "";
    for (const w of words) {
      const test = current ? `${current} ${w}` : w;
      if (current && ctx.measureText(test).width > maxWidth) {
        lines.push(current);
        current = w;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  },

  // Clue + progress live on a dark panel so they stay readable over bright
  // sky art. Sized and positioned to sit beside the HUD's health/score
  // boxes (top-left), never under or overlapping them. Height grows with
  // the (large) clue text, wrapping instead of squishing onto one line.
  drawHeader(ctx, canvas) {
    const panelX = 250;
    const panelY = 16;
    const panelW = canvas.width - 20 - panelX;
    const clueFont = "bold 34px 'Trebuchet MS', sans-serif";
    const progressFont = "24px 'Trebuchet MS', sans-serif";
    const clueLineH = 40;
    const progressLineH = 30;
    const padTop = 20;
    const padGap = 10;
    const padBottom = 18;

    ctx.save();
    ctx.font = clueFont;
    const clue = `Clue: ${this.currentWord.clue}`;
    const clueLines = this._wrapText(ctx, clue, panelW - 36);
    const panelH = padTop + clueLines.length * clueLineH + padGap + progressLineH + padBottom;

    ctx.fillStyle = "rgba(15, 12, 8, 0.78)";
    ctx.strokeStyle = "rgba(232, 211, 168, 0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelW, panelH, 14);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = "center";
    const midX = panelX + panelW / 2;
    ctx.fillStyle = "#fff6df";
    ctx.font = clueFont;
    let ly = panelY + padTop + clueLineH * 0.72;
    for (const line of clueLines) {
      ctx.fillText(line, midX, ly);
      ly += clueLineH;
    }

    ctx.font = progressFont;
    ctx.fillStyle = "#d8cba8";
    const progress = `${this.currentWord.word.length}-letter word - Words completed: ${this.correctCount} / ${this.needed}`;
    ctx.fillText(progress, midX, panelY + padTop + clueLines.length * clueLineH + padGap + progressLineH * 0.72, panelW - 24);
    ctx.restore();

    if (this.messageTimer > 0) {
      ctx.save();
      ctx.textAlign = "center";
      ctx.font = "bold 24px 'Trebuchet MS', sans-serif";
      ctx.strokeStyle = "#2a1f10";
      ctx.lineWidth = 5;
      ctx.fillStyle = this.message.startsWith("Correct") ? "#9dffb0" : "#ff9d9d";
      const msgY = panelY + panelH + 30;
      ctx.strokeText(this.message, canvas.width / 2, msgY);
      ctx.fillText(this.message, canvas.width / 2, msgY);
      ctx.restore();
    }
  },
};
