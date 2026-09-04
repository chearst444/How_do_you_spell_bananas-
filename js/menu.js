// Main menu screen: bamboo panel with just Play (Settings/Exit removed -
// neither did anything, so the button art was cropped down to match
// rather than left as dead buttons).

const MenuScreen = {
  // Relative to the panel sprite's own width/height.
  buttons: [{ id: "play", label: "Play", yFrac: [0.516, 0.726] }],
  xFrac: [0.28, 0.77],

  panelRect(ctx, canvas) {
    const img = Assets.get(ASSET_MANIFEST.ui.panelGreenPlayOnly);
    const scale = 3.1;
    const w = img.width * scale;
    const h = img.height * scale;
    const x = canvas.width / 2 - w / 2;
    const y = canvas.height / 2 - h / 2 - 10;
    return { x, y, w, h, img };
  },

  hitTest(canvas, px, py) {
    const { x, y, w, h } = this.panelRect(null, canvas);
    for (const b of this.buttons) {
      const bx = x + w * this.xFrac[0];
      const bw = w * (this.xFrac[1] - this.xFrac[0]);
      const by = y + h * b.yFrac[0];
      const bh = h * (b.yFrac[1] - b.yFrac[0]);
      if (px >= bx && px <= bx + bw && py >= by && py <= by + bh) return b.id;
    }
    return null;
  },

  draw(ctx, canvas, time) {
    // Backdrop: level1 sky + ground, softly darkened, as a jungle-menu feel.
    ctx.fillStyle = "#3c4a22";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const sky = Assets.get(ASSET_MANIFEST.levels.level1.sky);
    if (sky && sky.complete) ctx.drawImage(sky, 0, 0, canvas.width, canvas.height * 0.62);
    const groundTile = Assets.get(ASSET_MANIFEST.levels.level1.groundTile);
    if (groundTile && groundTile.complete) {
      const th = 170;
      const scale = th / groundTile.height;
      const tw = groundTile.width * scale;
      for (let x = 0; x < canvas.width; x += tw) {
        ctx.drawImage(groundTile, x, canvas.height - th, tw + 1, th);
      }
    }
    ctx.fillStyle = "rgba(10, 15, 5, 0.35)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff6df";
    ctx.strokeStyle = "#3a2a15";
    ctx.lineWidth = 6;
    ctx.font = "bold 46px 'Trebuchet MS', sans-serif";
    const bob = Math.sin(time * 2) * 4;
    ctx.strokeText("How Do You Spell Bananas?", canvas.width / 2, 110 + bob);
    ctx.fillText("How Do You Spell Bananas?", canvas.width / 2, 110 + bob);
    ctx.restore();

    const { x, y, w, h, img } = this.panelRect(ctx, canvas);
    if (img && img.complete) ctx.drawImage(img, x, y, w, h);

    const hover = this.hitTest(canvas, Input.pointer.x, Input.pointer.y);
    if (hover) {
      const b = this.buttons.find((bt) => bt.id === hover);
      const bx = x + w * this.xFrac[0];
      const bw = w * (this.xFrac[1] - this.xFrac[0]);
      const by = y + h * b.yFrac[0];
      const bh = h * (b.yFrac[1] - b.yFrac[0]);
      ctx.save();
      ctx.strokeStyle = "#ffe27a";
      ctx.lineWidth = 3;
      ctx.strokeRect(bx - 2, by - 2, bw + 4, bh + 4);
      ctx.restore();
    }
  },

  update(canvas, callbacks) {
    if (Input.pointer.justClicked) {
      const hit = this.hitTest(canvas, Input.pointer.x, Input.pointer.y);
      if (hit === "play" && callbacks.onPlay) callbacks.onPlay();
    }
  },
};
