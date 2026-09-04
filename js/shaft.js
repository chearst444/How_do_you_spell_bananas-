// Vertical jumping shaft: connects one main level to the next. The monkey
// zigzags up a column of platforms; falling costs health slowly, hazard
// platforms cost health more sharply, and reaching the top rim advances
// the game to the next main-level background.

const SHAFT_STYLE_KEYS = ["one", "two", "three", "four"];
const SHAFT_PLATFORM_COUNT = 16;
// Tighter vertical gaps now that the monkey is much bigger - platforms
// used to read as spaced too far apart relative to him.
const SHAFT_SPACING = 78;
// Horizontal zigzag distance. A jump only covers ~147px of horizontal
// ground at MOVE_SPEED=3.4 over the ~43-frame flight time to a landing at
// the SAME height (v=13, g=0.6) - and since each rung is 78px HIGHER than
// the last, the monkey doesn't land until the falling half of the arc, so
// the real reach to a rung one step up is only ~123px, not the full 147.
// The old left/right split (345 / 475, a 140px platform width) actually
// OVERLAPPED by 10px edge-to-edge - platforms in different columns were
// close enough that walking sideways (no jump needed) carried the monkey
// straight across, trivializing the whole shaft (and meant there was
// nothing to actually fall off of - the next foothold was already right
// there). This split keeps a real ~60px edge-to-edge gap: verified via a
// simulated 1600-jump sweep (100 random shaft layouts) to always be
// reachable by jumping and holding toward the target, but never crossable
// on foot.
const SHAFT_LEFT_X = 300;
const SHAFT_RIGHT_X = 500;
const SHAFT_PLATFORM_W = 140;
const SHAFT_PLATFORM_H = 40;
const FALL_DAMAGE_THRESHOLD = 260;

const Shaft = {
  monkey: null,
  platforms: [],
  camera: { y: 0 },
  styleKey: "one",
  shaftIndex: 0,
  topWorldY: 0,
  checkpoint: { x: 0, worldY: 0 },

  init(shaftIndex, monkey) {
    this.shaftIndex = shaftIndex;
    this.styleKey = SHAFT_STYLE_KEYS[shaftIndex % SHAFT_STYLE_KEYS.length];
    this.monkey = monkey;
    this.monkey.x = SHAFT_LEFT_X + SHAFT_PLATFORM_W / 2;
    this.monkey.vx = 0;
    this.monkey.vy = 0;

    // Solid starting floor so the monkey has stable footing the instant the
    // shaft begins, instead of free-falling if the player hasn't jumped yet.
    this.floor = new Platform(0, 20, 960, 30, "log_whole", "normal");
    this.monkey.y = this.floor.y;

    this.platforms = [];
    const normalSprites = ["log_whole", "lily_pad", "log_broken", "log_dark", "plank_bridge"];
    let worldY = -70;
    let leftSide = true;
    for (let i = 0; i < SHAFT_PLATFORM_COUNT; i++) {
      const isHazard = i > 2 && Math.random() < 0.18;
      const x = leftSide ? SHAFT_LEFT_X : SHAFT_RIGHT_X;
      // Kept fairly small - worst-case jitter on both platforms still has
      // to leave the gap well inside actual jump reach.
      const jitter = (Math.random() - 0.5) * 24;
      const p = new Platform(
        x + jitter,
        worldY,
        SHAFT_PLATFORM_W,
        SHAFT_PLATFORM_H,
        isHazard ? (Math.random() < 0.5 ? "hazard_spiked" : "hazard_legged") : normalSprites[i % normalSprites.length],
        isHazard ? "hazard" : "normal"
      );
      this.platforms.push(p);

      // A hazard is never the only way forward: always give this rung a
      // safe companion on the opposite column, same height, so there's
      // always a real choice instead of a forced hit.
      if (isHazard) {
        const otherX = leftSide ? SHAFT_RIGHT_X : SHAFT_LEFT_X;
        const otherJitter = (Math.random() - 0.5) * 24;
        this.platforms.push(
          new Platform(
            otherX + otherJitter,
            worldY,
            SHAFT_PLATFORM_W,
            SHAFT_PLATFORM_H,
            normalSprites[(i + 1) % normalSprites.length],
            "normal"
          )
        );
      }

      leftSide = !leftSide;
      worldY -= SHAFT_SPACING;
    }
    this.topWorldY = worldY + SHAFT_SPACING - 40;

    this.checkpoint = { x: this.monkey.x, worldY: this.monkey.y };
    this.camera.y = this.monkey.y - 600 * 0.55;
  },

  styleAssets() {
    return ASSET_MANIFEST.jumpingAreas[this.styleKey];
  },

  update(dt, canvas, hud) {
    const onLand = (platform) => {
      if (platform.kind === "hazard") {
        if (this.monkey.invuln <= 0) {
          hud.damage(15);
          this.monkey.invuln = 1.0;
          this.monkey.vy = -7;
        }
      } else {
        this.checkpoint = { x: this.monkey.x, worldY: this.monkey.y };
      }
    };

    this.monkey.update(dt, [this.floor, ...this.platforms], { onLand });
    this.monkey.x = Math.max(60, Math.min(canvas.width - 60, this.monkey.x));

    // Fell too far below the last safe platform: slow health drain + reset.
    if (this.monkey.y - this.checkpoint.worldY > FALL_DAMAGE_THRESHOLD) {
      hud.damage(8);
      this.monkey.x = this.checkpoint.x;
      this.monkey.y = this.checkpoint.worldY - 10;
      this.monkey.vy = 0;
    }

    // Camera follows the monkey upward (and gently downward).
    const desired = this.monkey.y - canvas.height * 0.55;
    this.camera.y = desired;

    if (this.monkey.y <= this.topWorldY) {
      return "advance";
    }
    return null;
  },

  // "walls" is a single full-width piece of art with BOTH shaft walls
  // already painted into it (transparent gap in the middle) — draw it once,
  // full canvas width, tiled vertically to cover the visible climb range.
  drawWalls(ctx, canvas) {
    const style = this.styleAssets();
    const wallImg = Assets.get(style.walls || style.pole);
    if (!wallImg || !wallImg.complete) return;
    const tileH = canvas.width * (wallImg.height / wallImg.width);
    const top = this.camera.y - 300;
    const bottom = this.camera.y + canvas.height + 300;
    let y = Math.floor(top / tileH) * tileH;
    for (; y < bottom; y += tileH) {
      ctx.drawImage(wallImg, 0, y, canvas.width, tileH);
    }
  },

  // top_rim / bottom_cap have their actual art clustered near the bottom of
  // a much taller transparent canvas — crop just that opaque band. The top
  // rim reuses the same art flipped vertically so it reads as a matching cap.
  _capCrop(img) {
    const w = img.width;
    const h = img.height;
    // Known art band for these packs: roughly the bottom ~11% of the frame.
    const srcY = Math.floor(h * 0.88);
    const srcH = h - srcY;
    return { sx: 0, sy: srcY, sw: w, sh: srcH };
  },

  drawCaps(ctx, canvas) {
    const style = this.styleAssets();
    const capW = 340;

    const bottomImg = Assets.get(style.bottomCap);
    if (bottomImg && bottomImg.complete) {
      const c = this._capCrop(bottomImg);
      const capH = capW * (c.sh / c.sw);
      ctx.drawImage(bottomImg, c.sx, c.sy, c.sw, c.sh, canvas.width / 2 - capW / 2, 20, capW, capH);
    }

    const topImg = Assets.get(style.topRim || style.bottomCap);
    if (topImg && topImg.complete) {
      const c = this._capCrop(topImg);
      const capH = capW * (c.sh / c.sw);
      ctx.save();
      const cx = canvas.width / 2;
      const cy = this.topWorldY - capH / 2 + 10;
      ctx.translate(cx, cy);
      ctx.scale(1, -1); // flip vertically so the cap faces down into the shaft
      ctx.drawImage(topImg, c.sx, c.sy, c.sw, c.sh, -capW / 2, -capH / 2, capW, capH);
      ctx.restore();
    }
  },

  // Which level's sky backdrop shows behind this shaft's walls. Uses the
  // sky of the level being climbed INTO, so the shaft reads as the open
  // air just below that level rather than a generic void.
  backdropSky() {
    const levelKeys = ["level1", "level2", "level3"];
    const key = levelKeys[(this.shaftIndex + 1) % levelKeys.length];
    return ASSET_MANIFEST.levels[key].sky;
  },

  draw(ctx, canvas) {
    const sky = Assets.get(this.backdropSky());
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, "#1b2a3d");
    grad.addColorStop(1, "#0d1420");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (sky && sky.complete) {
      ctx.drawImage(sky, 0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(8, 12, 20, 0.4)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.save();
    ctx.translate(0, -this.camera.y);
    this.drawWalls(ctx, canvas);
    this.drawCaps(ctx, canvas);
    for (const p of this.platforms) p.draw(ctx);
    this.monkey.draw(ctx);
    ctx.restore();

    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "bold 20px 'Trebuchet MS', sans-serif";
    ctx.fillStyle = "#fff6df";
    ctx.strokeStyle = "#3a2a15";
    ctx.lineWidth = 4;
    ctx.strokeText("Climb to the next level!", canvas.width / 2, 46);
    ctx.fillText("Climb to the next level!", canvas.width / 2, 46);
    ctx.restore();
  },
};
