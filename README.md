# How Do You Spell Bananas?

A vertical-jumper spelling game starring a monkey. Hop between platforms on
each jungle level, then throw a banana at the correctly spelled word among
a set of common misspellings. Get 10 words right and the monkey climbs a
vertical jumping shaft up to the next level, where a fresh set of 10 words
awaits.

## How to play

- **Move:** Arrow keys / A,D
- **Jump:** Space, Up, or W
- **Throw a banana at a word platform:** click/tap the platform (or press
  F / Enter to throw at the nearest word while standing near it)

### Scoring & health

- Correct word: **+10 points**
- Wrong word: small health penalty
- Falling off a platform in the jumping shaft: moderate health penalty
- Landing on a hazard platform (spiked or rigged with pegs): bigger health
  penalty, but never instant death
- Health reaches 0: game over

## Running locally

This is a static, dependency-free HTML5 canvas game. Serve the folder with
any static file server and open `index.html`, e.g.:

```
python3 -m http.server 8080
```

then visit `http://localhost:8080/`.

## Project structure

- `index.html`, `css/style.css` — page shell and styling
- `js/words.js` — the word bank (49 words + common misspellings)
- `js/assets.js` — asset manifest + preloader
- `js/input.js` — keyboard/pointer input
- `js/entities.js` — Monkey, Platform, and Banana projectile
- `js/menu.js` — main menu screen
- `js/flatlevel.js` — flat-level word-spelling gameplay
- `js/shaft.js` — vertical jumping-shaft climbing between levels
- `js/game.js` — state machine, main loop, HUD
- `assets/` — all game art, organized by category (monkey animations,
  platforms, jumping-area wall/rim/cap sets, level backgrounds, UI, props)
