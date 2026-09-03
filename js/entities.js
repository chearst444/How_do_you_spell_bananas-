// Core game entities: Monkey, Platform, Banana.

const GRAVITY = 0.6;
const JUMP_VELOCITY = -13;
const MOVE_SPEED = 3.4;
const TERMINAL_FALL = 14;

class Monkey {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    // Almost twice the original size so the monkey reads clearly during
    // gameplay and shaft platforms feel closer together relative to him.
    this.w = 112;
    this.h = 122;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.facing = 1; // 1 = right, -1 = left
    this.state = "idle"; // idle | walk | jump | fall | throw
    this.walkSet = "walk1";
    this.frame = 0;
    this.frameTimer = 0;
    this.throwTimer = 0;
    this.throwCallback = null;
    this.invuln = 0; // seconds of hazard invulnerability after taking damage
  }

  get bounds() {
    // Slightly inset hitbox for friendlier collision than the full sprite.
    // this.y is the monkey's feet (bottom of the sprite), matching draw().
    return { x: this.x - this.w * 0.32, y: this.y - this.h, w: this.w * 0.64, h: this.h };
  }

  startThrow(onRelease) {
    if (this.state === "throw") return;
    this.state = "throw";
    this.frame = 0;
    this.frameTimer = 0;
    this.throwCallback = onRelease;
  }

  jump() {
    if (this.onGround) {
      this.vy = JUMP_VELOCITY;
      this.onGround = false;
    }
  }

  update(dt, platforms, opts) {
    opts = opts || {};
    if (this.invuln > 0) this.invuln -= dt;

    if (this.state !== "throw") {
      let moving = false;
      if (Input.left()) {
        this.vx = -MOVE_SPEED;
        this.facing = -1;
        moving = true;
      } else if (Input.right()) {
        this.vx = MOVE_SPEED;
        this.facing = 1;
        moving = true;
      } else {
        this.vx = 0;
      }

      if (Input.jumpPressed()) this.jump();

      if (!this.onGround) {
        this.state = this.vy < 0 ? "jump" : "fall";
      } else if (moving) {
        this.state = "walk";
      } else {
        this.state = "idle";
      }
    } else {
      // Plant firmly for the throw instead of sliding on whatever
      // horizontal speed was left over from the moment it started.
      this.vx = 0;
    }

    // Physics integration
    this.vy = Math.min(this.vy + GRAVITY, TERMINAL_FALL);
    this.x += this.vx;
    this.y += this.vy;

    this.onGround = false;
    if (platforms) {
      const feet = this.y;
      const prevFeet = feet - this.vy;
      const left = this.x - this.w * 0.32;
      const right = this.x + this.w * 0.32;
      for (const p of platforms) {
        if (p.solid === false) continue;
        const withinX = right > p.x && left < p.x + p.w;
        // Landing = falling, and the feet crossed the platform's top surface
        // this frame (was above it last frame, at/below it now).
        const landing = withinX && this.vy >= 0 && prevFeet <= p.y + 1 && feet >= p.y;
        if (landing) {
          this.y = p.y;
          this.vy = 0;
          this.onGround = true;
          if (opts.onLand) opts.onLand(p);
        }
      }
    }

    // Animation timing
    this.frameTimer += dt;
    if (this.state === "throw") {
      const frames = ASSET_MANIFEST.monkey.throw;
      const perFrame = 0.09;
      if (this.frameTimer >= perFrame) {
        this.frameTimer = 0;
        this.frame++;
        if (this.frame >= frames.length) {
          this.frame = frames.length - 1;
          if (this.throwCallback) {
            this.throwCallback();
            this.throwCallback = null;
          }
          this.state = "idle";
          this.frame = 0;
        }
      }
    } else if (this.state === "walk") {
      const frames = ASSET_MANIFEST.monkey[this.walkSet];
      const perFrame = 0.09;
      if (this.frameTimer >= perFrame) {
        this.frameTimer = 0;
        this.frame = (this.frame + 1) % frames.length;
      }
    } else if (this.state === "idle") {
      const frames = ASSET_MANIFEST.monkey.idle;
      const perFrame = 0.18;
      if (this.frameTimer >= perFrame) {
        this.frameTimer = 0;
        this.frame = (this.frame + 1) % frames.length;
      }
    } else {
      // jump / fall: pick a frame based on vertical speed instead of cycling
      const frames = ASSET_MANIFEST.monkey.jump;
      const t = Math.max(-1, Math.min(1, this.vy / 10));
      this.frame = Math.min(frames.length - 1, Math.floor(((t + 1) / 2) * frames.length));
    }
  }

  currentFrameSrc() {
    if (this.state === "throw") return ASSET_MANIFEST.monkey.throw[this.frame];
    if (this.state === "walk") return ASSET_MANIFEST.monkey[this.walkSet][this.frame];
    if (this.state === "jump" || this.state === "fall") return ASSET_MANIFEST.monkey.jump[this.frame];
    return ASSET_MANIFEST.monkey.idle[this.frame];
  }

  draw(ctx) {
    const src = this.currentFrameSrc();
    const img = Assets.get(src);
    if (!img || !img.complete) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.facing < 0) ctx.scale(-1, 1);
    if (this.invuln > 0 && Math.floor(this.invuln * 20) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    }
    ctx.drawImage(img, -this.w / 2, -this.h, this.w, this.h);
    ctx.restore();
  }
}

class Platform {
  constructor(x, y, w, h, spriteKey, kind) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.spriteKey = spriteKey; // path into ASSET_MANIFEST.platforms
    this.kind = kind || "normal"; // normal | hazard
    this.solid = true;
    this.word = null; // { text, correct, resolved, wrong }
  }

  draw(ctx) {
    const img = Assets.get(ASSET_MANIFEST.platforms[this.spriteKey]);
    if (img && img.complete) {
      ctx.drawImage(img, this.x, this.y, this.w, this.h);
    }
    if (this.word) {
      this.drawWordTag(ctx);
    }
  }

  drawWordTag(ctx) {
    const label = this.word.text;
    ctx.save();
    ctx.font = "bold 15px 'Trebuchet MS', sans-serif";
    const padX = 10;
    const textW = ctx.measureText(label).width;
    const tagW = textW + padX * 2;
    const tagH = 26;
    const tx = this.x + this.w / 2 - tagW / 2;
    const ty = this.y - tagH - 6;

    let fill = "#e8d3a8";
    let border = "#5a3d23";
    if (this.word.resolved === "correct") {
      fill = "#bfe6a0";
      border = "#2f6b1f";
    } else if (this.word.resolved === "wrong") {
      fill = "#e6a0a0";
      border = "#7a2020";
    }

    ctx.fillStyle = border;
    ctx.beginPath();
    ctx.roundRect(tx, ty, tagW, tagH, 6);
    ctx.fill();
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.roundRect(tx + 2, ty + 2, tagW - 4, tagH - 4, 5);
    ctx.fill();

    ctx.fillStyle = "#3a2a18";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, tx + tagW / 2, ty + tagH / 2 + 1);
    ctx.restore();
  }
}

class Banana {
  constructor(startX, startY, target) {
    this.x0 = startX;
    this.y0 = startY;
    this.target = target;
    this.x1 = target.x + target.w / 2;
    this.y1 = target.y - 10;
    this.t = 0;
    this.duration = 0.45;
    this.done = false;
    this.arcHeight = 90;
    this.x = startX;
    this.y = startY;
  }

  update(dt) {
    this.t += dt / this.duration;
    if (this.t >= 1) {
      this.t = 1;
      this.done = true;
    }
    const t = this.t;
    this.x = this.x0 + (this.x1 - this.x0) * t;
    const straightY = this.y0 + (this.y1 - this.y0) * t;
    this.y = straightY - Math.sin(t * Math.PI) * this.arcHeight;
    this.rotation = t * Math.PI * 3;
  }

  draw(ctx) {
    const img = Assets.get(ASSET_MANIFEST.platforms.banana);
    if (!img || !img.complete) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation || 0);
    ctx.drawImage(img, -14, -14, 28, 28);
    ctx.restore();
  }
}
