// Keyboard + pointer input tracking, shared across all game states.

const Input = {
  keys: {},
  pointer: { x: 0, y: 0, down: false, justClicked: false },
  // Set by on-screen touch buttons (mobile), OR'd with keyboard state below.
  virtual: { left: false, right: false, jump: false },

  init(canvas) {
    window.addEventListener("keydown", (e) => {
      this.keys[e.code] = true;
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
    });

    const toCanvasCoords = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    };

    canvas.addEventListener("mousedown", (e) => {
      const p = toCanvasCoords(e.clientX, e.clientY);
      this.pointer.x = p.x;
      this.pointer.y = p.y;
      this.pointer.down = true;
      this.pointer.justClicked = true;
    });
    window.addEventListener("mouseup", () => {
      this.pointer.down = false;
    });
    canvas.addEventListener(
      "touchstart",
      (e) => {
        const t = e.touches[0];
        const p = toCanvasCoords(t.clientX, t.clientY);
        this.pointer.x = p.x;
        this.pointer.y = p.y;
        this.pointer.down = true;
        this.pointer.justClicked = true;
        e.preventDefault();
      },
      { passive: false }
    );
    window.addEventListener("touchend", () => {
      this.pointer.down = false;
    });

    this.initVirtualButtons();
  },

  // Wire up the on-screen d-pad/jump buttons (shown on touch devices) to
  // the same movement state the keyboard drives, so mobile play works
  // without a keyboard.
  initVirtualButtons() {
    const bind = (id, key) => {
      const el = document.getElementById(id);
      if (!el) return;
      const set = (v) => (e) => {
        this.virtual[key] = v;
        e.preventDefault();
      };
      el.addEventListener("pointerdown", set(true));
      el.addEventListener("pointerup", set(false));
      el.addEventListener("pointerleave", set(false));
      el.addEventListener("pointercancel", set(false));
    };
    bind("btn-left", "left");
    bind("btn-right", "right");
    bind("btn-jump", "jump");
  },

  // Call once per frame after all states have had a chance to read the click.
  clearFrame() {
    this.pointer.justClicked = false;
  },

  down(code) {
    return !!this.keys[code];
  },

  left() {
    return this.down("ArrowLeft") || this.down("KeyA") || this.virtual.left;
  },
  right() {
    return this.down("ArrowRight") || this.down("KeyD") || this.virtual.right;
  },
  jumpPressed() {
    return this.down("Space") || this.down("ArrowUp") || this.down("KeyW") || this.virtual.jump;
  },
  throwPressed() {
    return this.down("KeyF") || this.down("Enter");
  },
};
