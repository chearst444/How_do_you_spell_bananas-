// Central asset manifest + preloader for "How Do You Spell Bananas?"

const ASSET_MANIFEST = {
  monkey: {
    idle: ["assets/monkey/idle/idle_1.png", "assets/monkey/idle/idle_2.png", "assets/monkey/idle/idle_3.png", "assets/monkey/idle/idle_4.png"],
    walk1: ["assets/monkey/walk1/walk1_1.png", "assets/monkey/walk1/walk1_2.png", "assets/monkey/walk1/walk1_3.png", "assets/monkey/walk1/walk1_4.png", "assets/monkey/walk1/walk1_5.png"],
    walk2: ["assets/monkey/walk2/walk2_1.png", "assets/monkey/walk2/walk2_2.png", "assets/monkey/walk2/walk2_3.png", "assets/monkey/walk2/walk2_4.png"],
    jump: ["assets/monkey/jump/jump_1.png", "assets/monkey/jump/jump_2.png", "assets/monkey/jump/jump_3.png", "assets/monkey/jump/jump_4.png", "assets/monkey/jump/jump_5.png"],
    throw: ["assets/monkey/throw/throw_1.png", "assets/monkey/throw/throw_2.png", "assets/monkey/throw/throw_3.png", "assets/monkey/throw/throw_4.png", "assets/monkey/throw/throw_5.png"],
  },
  platforms: {
    banana: "assets/platforms/banana.png",
    log_whole: "assets/platforms/log_whole.png",
    lily_pad: "assets/platforms/lily_pad.png",
    log_broken: "assets/platforms/log_broken.png",
    log_dark: "assets/platforms/log_dark.png",
    hazard_spiked: "assets/platforms/hazard_spiked.png",
    hazard_legged: "assets/platforms/hazard_legged.png",
    plank_bridge: "assets/platforms/plank_bridge.png",
  },
  jumpingAreas: {
    one: {
      walls: "assets/jumping-areas/one/walls.png",
      topRim: "assets/jumping-areas/one/top_rim.png",
      pole: "assets/jumping-areas/one/pole_texture.png",
      bottomCap: "assets/jumping-areas/one/bottom_cap.png",
    },
    two: {
      walls: "assets/jumping-areas/two/walls.png",
      topRim: "assets/jumping-areas/two/top_rim.png",
      pole: "assets/jumping-areas/two/pole_texture.png",
      bottomCap: "assets/jumping-areas/two/bottom_cap.png",
    },
    three: {
      walls: "assets/jumping-areas/three/walls.png",
      topRim: "assets/jumping-areas/three/top_rim.png",
      pole: "assets/jumping-areas/three/pole_texture.png",
      bottomCap: "assets/jumping-areas/three/bottom_cap.png",
    },
    four: {
      walls: "assets/jumping-areas/four/walls.png",
      pole: "assets/jumping-areas/four/pole_texture.png",
      bottomCap: "assets/jumping-areas/four/bottom_cap.png",
    },
  },
  levels: {
    level1: {
      groundTile: "assets/levels/level1/ground_tile.png",
      backdropTop: "assets/levels/level1/backdrop_top.png",
      sky: "assets/levels/level1/sky.png",
      floatingRocks: "assets/levels/level1/floating_rocks.png",
      stoneLedge: "assets/levels/level1/stone_ledge.png",
    },
    level2: {
      ropeBridge: "assets/levels/level2/rope_bridge.png",
      bridgeGapRidge: "assets/levels/level2/bridge_gap_ridge.png",
      groundTile: "assets/levels/level2/ground_tile.png",
      sky: "assets/levels/level2/sky_sunset.png",
      floatingIslands: "assets/levels/level2/floating_islands_castle.png",
    },
    level3: {
      sky: "assets/levels/level3/sky.png",
      darkRidge: "assets/levels/level3/dark_ridge.png",
      flowerGrass: "assets/levels/level3/flower_grass.png",
      groundTile: "assets/levels/level3/ground_tile.png",
      mushroomScatter: "assets/levels/level3/mushroom_scatter.png",
    },
    level4: {
      sky: "assets/levels/level4/sky.png",
      backdropTop: "assets/levels/level4/floating_islands.png",
      groundPattern: "assets/levels/level4/ground_pattern.png",
      groundTile: "assets/levels/level4/ground_tile.png",
      stoneGrassLedge: "assets/levels/level4/stone_grass_ledge.png",
    },
  },
  props: {
    spearFlag: "assets/props/spear_flag.png",
    signpostBlank: "assets/props/signpost_blank.png",
    signpostPlanks: "assets/props/signpost_planks.png",
    bush1: "assets/props/bush1.png",
    bush2: "assets/props/bush2.png",
    grassTuft: "assets/props/grass_tuft.png",
    stairs1: "assets/props/stairs1.png",
    stairs2: "assets/props/stairs2.png",
    cobblestoneTile: "assets/props/cobblestone_tile.png",
    roundTree: "assets/props/round_tree.png",
    vineSwagLeafy: "assets/props/vine_swag_leafy.png",
    vineSwagBerry: "assets/props/vine_swag_berry.png",
    vineRopePlain: "assets/props/vine_rope_plain.png",
    vineRopeThin: "assets/props/vine_rope_thin.png",
    vineHanging: "assets/props/vine_hanging.png",
  },
  ui: {
    panelGreen: "assets/ui/panel_green.png",
    panelGreenPlayOnly: "assets/ui/panel_green_playonly.png",
    panelDark: "assets/ui/panel_dark.png",
  },
};

const Assets = {
  images: {},
  total: 0,
  loaded: 0,

  // Walk the manifest tree, collecting every path string.
  _collectPaths(node, out) {
    if (typeof node === "string") {
      out.push(node);
    } else if (Array.isArray(node)) {
      node.forEach((n) => this._collectPaths(n, out));
    } else if (typeof node === "object") {
      Object.values(node).forEach((n) => this._collectPaths(n, out));
    }
    return out;
  },

  // Load everything in the manifest, calling onProgress(fraction) as images
  // resolve. Resolves once every image has loaded (or failed).
  loadAll(onProgress) {
    const paths = this._collectPaths(ASSET_MANIFEST, []);
    this.total = paths.length;
    this.loaded = 0;

    const loadOne = (path) =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          this.loaded++;
          if (onProgress) onProgress(this.loaded / this.total);
          resolve();
        };
        img.onerror = () => {
          console.warn("Failed to load asset:", path);
          this.loaded++;
          if (onProgress) onProgress(this.loaded / this.total);
          resolve();
        };
        img.src = path;
        this.images[path] = img;
      });

    return Promise.all(paths.map(loadOne));
  },

  get(path) {
    return this.images[path];
  },
};
