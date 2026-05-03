/* =====================================================================
   EDEN HALL ADVENTURE
   Designed by Violet, with friends Vada and Ada.

   This file is meant to be readable. Numbers you can safely tweak live
   in CONFIG at the top. Below that: data, then drawing helpers, then
   the actual game.
   ===================================================================== */

'use strict';

/* ---------------------------------------------------------------------
   CONFIG — change these to tune the game
   --------------------------------------------------------------------- */
const CONFIG = {
  // Canvas logical size (game is drawn in 1280x720 then CSS-scaled to fit)
  view: { w: 1280, h: 720 },

  // Character select layout
  select: {
    cardW: 360,
    cardH: 560,
    gap: 30,
    bobAmplitude: 6,    // how many pixels the selected card bobs up/down
    bobSpeed: 2.4,      // bob cycles per second
  },

  // Colors — tweak to match Violet's marker style
  colors: {
    paper:    '#f6ecd2',
    ink:      '#1f1a17',
    inkSoft:  '#423931',
    red:      '#d6403c',
    yellow:   '#f5c842',
    sky:      '#bfe4f5',
    grass:    '#7bb265',
    grassDk:  '#5a8d4a',
    skin:     '#f4d2b3',
    skinShade:'#dcb594',
    cardBg:   '#fffaeb',
    cardBgSel:'#fff7d6',
  },
};

/* ---------------------------------------------------------------------
   CHARACTERS — stats + look. Stats come straight from the spec.
   The order of the keys here is also the order shown on the select
   screen. Violet first because she designed the game.
   --------------------------------------------------------------------- */
const CHARACTERS = {
  violet: {
    name: 'Violet',
    role: 'The Trapper',
    blurb: 'Fast hands, fast feet, eagle-eye repair.',
    hearts: 3,
    stats: { lever: 5, speed: 4, skill: 2 },
    color: '#8e5fb8',          // primary marker color
    colorSoft: '#b58edb',
    abilities: [
      { key: 'F', name: 'Bully Trap', desc: 'Drop a trap that slows bullies 50% for 10s. 20s cooldown.' },
      { passive: true, name: 'Steady Hands', desc: 'Skill window grows when a bully is within 15m.' },
    ],
    look: {
      skin:      '#f1d4ad',     // warm Asian skin tone
      hair:      '#1a1410',     // black, long with bangs
      hairLight: '#3a2a22',
      shirt:     '#8e5fb8',     // purple
      shirtTrim: '#5e3a86',
      pants:     '#372c5a',
      shoes:     '#1f1a17',
      style:     'longHair',    // tells the drawer which hairstyle
    },
  },

  vada: {
    name: 'Vada',
    role: 'The Equipper',
    blurb: 'Steady hands, big swing. Stuns bullies up close.',
    hearts: 2,
    stats: { lever: 2, speed: 2, skill: 5 },
    color: '#4a90c2',
    colorSoft: '#7fb6dd',
    abilities: [
      { key: 'F', name: 'Stun Punch', desc: 'Hit the nearest bully within ~3m. Stuns them for 5s. 15s cooldown.' },
      { passive: true, name: 'Big Backpack', desc: 'Hold up to 5 items (others hold 2).' },
    ],
    look: {
      skin:      '#f4d2b3',     // light cream
      hair:      '#a8814f',     // light brown pigtails
      hairLight: '#c8a072',
      shirt:     '#4a90c2',     // denim blue striped
      shirtTrim: '#2f6e9a',
      pants:     '#2c2c2c',
      shoes:     '#1f1a17',
      style:     'pigtails',
    },
  },

  ada: {
    name: 'Ada',
    role: 'The Cook',
    blurb: 'Tough as a Primanti\'s sandwich. Heals her friends.',
    hearts: 4,
    stats: { lever: 3, speed: 3, skill: 3 },
    color: '#f08a86',
    colorSoft: '#f7b1ad',
    abilities: [
      { key: 'F', name: 'Scream', desc: 'Confuse + slow all bullies within ~5m for 5s. 20s cooldown.' },
      { key: 'D', name: 'Burger Time', desc: 'Cook 2 burgers (heal 1 heart each). 30s cooldown.' },
    ],
    look: {
      skin:      '#f1d4ad',     // warm Asian skin tone
      hair:      '#1a1410',     // black, peeking under chef hat
      hairLight: '#3a2a22',
      shirt:     '#f08a86',     // coral shirt
      shirtTrim: '#c25e5a',
      apron:     '#fff8e8',
      pants:     '#3d2f24',
      shoes:     '#1f1a17',
      style:     'chefHat',
    },
  },
};

const CHARACTER_ORDER = ['violet', 'vada', 'ada'];

/* ---------------------------------------------------------------------
   BIOMES — world dimensions and per-biome look. M2 ships grassland.
   Levers (M3) and bullies (M4) will be added to each biome's config.
   --------------------------------------------------------------------- */
const BIOMES = {
  grassland: {
    name: 'Grassland',
    world:        { w: 1800, h: 1100 },
    decorType:    'grass',                 // dispatches drawGround()
    groundBase:   '#9ec97a',
    groundDark:   '#7eb35e',
    groundFleck:  '#5e8e44',
    flowerColors: ['#ffe066', '#ffffff', '#f29ab2', '#c995ff'],
    treeCount:    14,
    cactusCount:  0,
    rockCount:    0,
    treeSeed:     1234,
    flowerCount:  70,
    leverCount:   3,
    bullies:      ['bob'],
  },

  desert: {
    name: 'Desert',
    world:        { w: 2200, h: 1300 },    // bigger map → more open sightlines
    decorType:    'sand',
    groundBase:   '#e6c98c',               // warm tan
    groundDark:   '#cda866',
    groundFleck:  '#b08850',
    flowerColors: ['#e8a04a', '#d8602a', '#fde08a'],   // wildflowers / cactus blooms
    treeCount:    0,                       // no trees here
    cactusCount:  22,                      // bumped — more cover for hiding from bullies
    rockCount:    16,
    treeSeed:     4321,
    flowerCount:  28,                      // sparse
    leverCount:   4,
    bullies:      ['bob', 'burt'],
    hasMesa:      true,                    // backdrop silhouette at the north edge
  },
  // forest / aquatics added in M6+
};

// Order players progress through. Used by the post-victory transition.
const BIOME_ORDER = ['grassland', 'desert', 'forest', 'aquatics'];

/* ---------------------------------------------------------------------
   BULLIES — enemy data. Spec: 1m ≈ 80 px in Eden Hall world units.
   --------------------------------------------------------------------- */
const BULLIES = {
  bob: {
    name:           'Bob',
    speed:          148,        // px/s when chasing (~10% faster than original 135)
    patrolFactor:   0.45,       // patrols at this fraction of chase speed
    sight:          260,        // 3m + a little forgiveness for kids
    hitDistance:    52,         // 0.5m + collision radius (~contact)
    hitCooldown:    3.0,        // seconds
    chaseGiveUp:    420,        // beyond this, lose interest and patrol
    radius:         24,         // collision radius
    smokeRate:      1.5,        // emit one puff every 1.5s while moving (a real trail, not a fog bank)
    smokeMaxAge:    4.0,
    skin:           '#dcb594',
    shirt:          '#7d6738',
    shirtTrim:      '#5a4828',
    pants:          '#2c2c2c',
    shoes:          '#1a1a1a',
  },

  burt: {
    name:           'Burt',
    speed:          72,         // very slow — relies on his reach
    patrolFactor:   0.55,
    sight:          1600,       // 20m at 80 px/m — sees across most of the desert
    hitDistance:    384,        // ~4.8m — reduced 20% from original 6m
    hitCooldown:    6.0,
    chaseGiveUp:    900,
    radius:         24,
    smokeRate:      0,          // doesn't smoke
    smokeMaxAge:    0,
    // Drag (hook) — yanks the target in when ready
    hookCooldown:   8.0,
    hookRange:      1600,       // 20m
    dragDuration:   0.55,
    dragStopDist:   140,        // pull stops when target is this close to Burt
    skin:           '#dec8a8',
    shirt:          '#5e4a8e',  // sinister purple
    shirtTrim:      '#3d2e60',
    pants:          '#2c2c2c',
    shoes:          '#1a1a1a',
  },
};

/* ---------------------------------------------------------------------
   PLAY tunables — speeds, sizes, etc. Easy to tweak.
   --------------------------------------------------------------------- */
const PLAY = {
  // Player speed: pixels per second. Translates the 1-5 stat into actual movement.
  // speed = base + perPoint * stat   →  stat=1 → 115, stat=2 → 148, stat=3 → 181, stat=4 → 214, stat=5 → 247
  // (~10% faster than the original 75 + 30*stat scale)
  speedBase:    82,
  speedPerStat: 33,
  playerRadius: 18,        // collision circle around feet
  playerScale:  0.36,      // visual scale for the in-game character sprite
  walkBobAmp:   1.6,
  walkBobFreq:  12,
  edgePad:      26,        // keep player this far from world edges
  introDuration: 2.5,      // seconds the "GRASSLAND" banner stays up
  victoryDuration: 3.0,    // seconds the "BIOME CLEARED" banner stays up

  // Lever / skill-check tuning
  lever: {
    interactRadius:  60,    // how close player must be to start the check
    cancelRadius:    90,    // walk farther than this and the check cancels
    hitsToFix:       3,     // successful hits required per lever
    indicatorSpeed:  0.85,  // sweeps per second across the bar
    // Green zone width as a fraction of the bar.  width = base + perStat * skill
    baseGreenWidth:  0.06,
    greenPerStat:    0.05,  // skill 1=11%, 3=21%, 5=31%
    missPenalty:     0.5,   // progress lost on a miss (clamped to 0)
    flashTime:       0.45,  // hit/miss colour flash duration
  },

  // Portal
  portal: {
    radius:       42,       // visual / interact radius
  },

  // Combat / damage
  combat: {
    iframes:      1.5,      // seconds of invincibility after taking a hit
    pixelsPerMeter: 80,
  },

  // Bob's green fart cloud — gameplay AND visual obstacle.
  fart: {
    slowMul:        0.6,    // 40% slow while inside (or in linger)
    lingerTime:     1.0,    // seconds the slow persists after stepping out
    maxLifeFrac:    0.95,   // count smoke as "active" until it's almost fully faded
  },

  // AI teammate behavior
  teammate: {
    spawnOffset:        110,    // distance from player at spawn
    fleeRadius:         260,    // start fleeing if any bully closer than this
    fixRadius:          38,     // close enough to a lever to start auto-repairing it
    leverProgressBase:  0.22,   // hits/sec per lever-stat point
    reviveTime:         3.0,    // seconds player must hold Space to revive
    reviveRadius:       70,
    reviveDecayMul:     2.0,    // revive bar drains this fast when player walks away
  },

  // Game-over animation timing
  gameOver: {
    deathFreeze: 0.9,           // seconds before the game-over screen appears
  },

  // Active abilities — keyed by mechanic, not character
  abilities: {
    trap:   { cooldown: 20, slowMul: 0.5, slowDuration: 10, radius: 38, lingerAfter: 1.4 },
    burger: { cooldown: 30, count: 2, healAmount: 1, scatterRadius: 70, pickupRadius: 30 },
    // Vada F: melee stun. ~3m range, 5s stun on the nearest bully.
    stun:   { cooldown: 15, range: 240 /* 3m */, duration: 5 },
    // Ada F: scream — AOE confuse+slow within ~5m, 5s.
    scream: { cooldown: 20, range: 400 /* 5m */, duration: 5, slowMul: 0.5 },
    // Violet passive: when a bully is within range, widen her skill-check green zone.
    steadyHands: { range: 1200 /* 15m */, greenWidthAdd: 0.18 },
  },
};

/* ---------------------------------------------------------------------
   Canvas + HiDPI setup
   --------------------------------------------------------------------- */
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const hintEl = document.getElementById('hint');

function setupCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = CONFIG.view.w * dpr;
  canvas.height = CONFIG.view.h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;
  resizeStage();
}

function resizeStage() {
  const pad = 24;
  const aspect = CONFIG.view.w / CONFIG.view.h;
  const vw = window.innerWidth - pad * 2;
  const vh = window.innerHeight - pad * 2;
  let w = vw, h = vw / aspect;
  if (h > vh) { h = vh; w = vh * aspect; }
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
}
window.addEventListener('resize', resizeStage);

/* ---------------------------------------------------------------------
   Hand-drawn helpers
   The "wobble" for static elements is baked in with a fixed seed so it
   doesn't shimmer between frames. For animated wobble, pass `time`.
   --------------------------------------------------------------------- */

// Deterministic pseudo-random in [-1, 1] from any seed
function jitter(seed) {
  const s = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return (s - Math.floor(s)) * 2 - 1;
}

// Draw a wobbly straight line as a slightly bent curve.
function wobblyLine(x1, y1, x2, y2, opts = {}) {
  const { stroke = CONFIG.colors.ink, width = 4, seed = 1, jitterAmt = 2 } = opts;
  const mx = (x1 + x2) / 2 + jitter(seed) * jitterAmt;
  const my = (y1 + y2) / 2 + jitter(seed + 1) * jitterAmt;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(mx, my, x2, y2);
  ctx.stroke();
}

// Wobbly rounded rectangle with optional fill + outline (marker style).
function wobblyRect(x, y, w, h, opts = {}) {
  const {
    fill = null,
    stroke = CONFIG.colors.ink,
    width = 4,
    radius = 14,
    seed = 1,
    jitterAmt = 1.6,
    rotate = 0,         // small radians of rotation (paper-on-desk feel)
  } = opts;

  ctx.save();
  if (rotate) {
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(rotate);
    ctx.translate(-(x + w / 2), -(y + h / 2));
  }

  // Build path with corner jitter so it's not a perfect rectangle.
  const r = radius;
  const j = (i) => jitter(seed + i) * jitterAmt;
  ctx.beginPath();
  ctx.moveTo(x + r + j(0), y + j(1));
  ctx.lineTo(x + w - r + j(2), y + j(3));
  ctx.quadraticCurveTo(x + w + j(4), y + j(5), x + w + j(6), y + r + j(7));
  ctx.lineTo(x + w + j(8), y + h - r + j(9));
  ctx.quadraticCurveTo(x + w + j(10), y + h + j(11), x + w - r + j(12), y + h + j(13));
  ctx.lineTo(x + r + j(14), y + h + j(15));
  ctx.quadraticCurveTo(x + j(16), y + h + j(17), x + j(18), y + h - r + j(19));
  ctx.lineTo(x + j(20), y + r + j(21));
  ctx.quadraticCurveTo(x + j(22), y + j(23), x + r + j(24), y + j(25));
  ctx.closePath();

  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
  ctx.restore();
}

// Wobbly circle/ellipse — same idea, jitter the radius around the perimeter.
function wobblyCircle(cx, cy, r, opts = {}) {
  const {
    fill = null,
    stroke = CONFIG.colors.ink,
    width = 4,
    seed = 1,
    jitterAmt = 1.4,
    squashY = 1,
  } = opts;
  const segments = 22;
  ctx.beginPath();
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    const rr = r + jitter(seed + i) * jitterAmt;
    const px = cx + Math.cos(t) * rr;
    const py = cy + Math.sin(t) * rr * squashY;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
}

// Hand-lettered text using Permanent Marker. Returns measured width.
function markerText(text, x, y, opts = {}) {
  const {
    size = 48,
    color = CONFIG.colors.ink,
    align = 'center',
    baseline = 'middle',
    rotate = 0,
    shadow = false,
    family = 'Permanent Marker',
  } = opts;
  ctx.save();
  if (rotate) {
    ctx.translate(x, y);
    ctx.rotate(rotate);
    x = 0; y = 0;
  }
  ctx.font = `${size}px "${family}", "Comic Sans MS", cursive`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  if (shadow) {
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillText(text, x + 3, y + 4);
  }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  const w = ctx.measureText(text).width;
  ctx.restore();
  return w;
}

function handText(text, x, y, opts = {}) {
  return markerText(text, x, y, { ...opts, family: 'Patrick Hand' });
}

/* ---------------------------------------------------------------------
   Stat bars (5-pip dot row) and hearts
   --------------------------------------------------------------------- */
function drawStatRow(label, value, x, y, w) {
  // label on the left, 5 dot pips on the right
  handText(label, x, y, { size: 22, align: 'left', baseline: 'middle', color: CONFIG.colors.inkSoft });
  const pipsRightEdge = x + w;
  const pipR = 8;
  const pipGap = 6;
  const totalPipsW = 5 * (pipR * 2) + 4 * pipGap;
  let px = pipsRightEdge - totalPipsW + pipR;
  for (let i = 0; i < 5; i++) {
    const filled = i < value;
    wobblyCircle(px, y, pipR, {
      fill: filled ? CONFIG.colors.ink : CONFIG.colors.paper,
      stroke: CONFIG.colors.ink,
      width: 2,
      seed: 50 + i + value * 7,
      jitterAmt: 0.6,
    });
    px += pipR * 2 + pipGap;
  }
}

function drawHeart(cx, cy, size, filled = true, seed = 1) {
  const s = size;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  // two bumps + point — built from arcs with tiny jitter
  const j = (i) => jitter(seed + i) * 0.6;
  ctx.moveTo(0 + j(0), s * 0.3 + j(1));
  ctx.bezierCurveTo(
    -s * 1.0 + j(2), -s * 0.3 + j(3),
    -s * 0.6 + j(4), -s * 1.0 + j(5),
    0 + j(6),       -s * 0.4 + j(7)
  );
  ctx.bezierCurveTo(
    s * 0.6 + j(8),  -s * 1.0 + j(9),
    s * 1.0 + j(10), -s * 0.3 + j(11),
    0 + j(12),        s * 0.3 + j(13)
  );
  ctx.closePath();
  if (filled) {
    ctx.fillStyle = CONFIG.colors.red;
    ctx.fill();
  }
  ctx.strokeStyle = CONFIG.colors.ink;
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();
}

function drawHeartRow(hearts, cx, y, size = 14) {
  const total = 4; // always show 4 slots so cards line up
  const gap = 6;
  const totalW = total * (size * 2) + (total - 1) * gap;
  let x = cx - totalW / 2 + size;
  for (let i = 0; i < total; i++) {
    drawHeart(x, y, size, i < hearts, i + hearts);
    x += size * 2 + gap;
  }
}

/* ---------------------------------------------------------------------
   Character portraits — drawn from primitive shapes.
   Each character has a unique silhouette: hair, outfit, accessory.
   Drawn at a logical 200x300 size, then translated/scaled by caller.
   --------------------------------------------------------------------- */

/*
 * Chibi proportions: feet at y=0, big head centered at y=-185 (radius 58),
 * compact body y=-125..-55, tiny stubby legs y=-55..-14, shoes y=-14..0.
 * The big-head/tiny-body silhouette is what reads as "cute."
 */
function drawCharacterPortrait(ctx, key, cx, baseY, scale = 1, opts = {}) {
  const ch = CHARACTERS[key];
  const L = ch.look;

  ctx.save();
  ctx.translate(cx, baseY);
  ctx.scale(scale, scale);

  // Soft shadow under feet
  ctx.beginPath();
  ctx.ellipse(0, 0, 60, 11, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(31, 26, 23, 0.18)';
  ctx.fill();

  // Tiny stubby legs
  wobblyRect(-22, -55, 18, 41, { fill: L.pants, stroke: CONFIG.colors.ink, width: 3, radius: 8, seed: 11 });
  wobblyRect(  4, -55, 18, 41, { fill: L.pants, stroke: CONFIG.colors.ink, width: 3, radius: 8, seed: 12 });

  // Pudgy little shoes
  wobblyRect(-28, -14, 26, 14, { fill: L.shoes, stroke: CONFIG.colors.ink, width: 3, radius: 7, seed: 13 });
  wobblyRect(  2, -14, 26, 14, { fill: L.shoes, stroke: CONFIG.colors.ink, width: 3, radius: 7, seed: 14 });

  // Round oval body (big radius makes the rect read as a chibi torso)
  wobblyRect(-38, -125, 76, 72, { fill: L.shirt, stroke: CONFIG.colors.ink, width: 3.5, radius: 28, seed: 15 });
  // Collar / shirt-trim accent across the top
  wobblyRect(-36, -125, 72, 14, { fill: L.shirtTrim, stroke: null, radius: 8, seed: 16 });

  // Stubby arms tilted slightly outward
  wobblyRect(-54, -118, 16, 38, { fill: L.shirt, stroke: CONFIG.colors.ink, width: 3, radius: 8, seed: 17, rotate: -0.12 });
  wobblyRect( 38, -118, 16, 38, { fill: L.shirt, stroke: CONFIG.colors.ink, width: 3, radius: 8, seed: 18, rotate:  0.12 });

  // Mitten-like pudgy hands
  const skin = L.skin || CONFIG.colors.skin;
  wobblyCircle(-46, -75, 11, { fill: skin, stroke: CONFIG.colors.ink, width: 3, seed: 19 });
  wobblyCircle( 46, -75, 11, { fill: skin, stroke: CONFIG.colors.ink, width: 3, seed: 20 });

  // Hair behind the head, then big head, then face, then hair in front.
  drawHairBack(L, key);
  wobblyCircle(0, -185, 58, { fill: skin, stroke: CONFIG.colors.ink, width: 3.5, seed: 22 });
  drawFace(L, key, opts);
  drawHairFront(L, key);

  // Per-character outfit details
  if (key === 'vada')   drawEquipperPouches(L);
  if (key === 'ada')    drawCookApron(L);
  if (key === 'violet') drawRamLogo(L);

  ctx.restore();
}

// Hair / volume drawn BEHIND the head
function drawHairBack(L, key) {
  if (L.style === 'longHair') {
    // long flowing hair past shoulders
    ctx.beginPath();
    ctx.fillStyle = L.hair;
    ctx.strokeStyle = CONFIG.colors.ink;
    ctx.lineWidth = 3;
    ctx.moveTo(-58, -225);
    ctx.bezierCurveTo(-92, -180, -90, -130, -76, -88);
    ctx.lineTo(-44, -88);
    ctx.lineTo(-30, -150);
    ctx.lineTo( 30, -150);
    ctx.lineTo( 44, -88);
    ctx.lineTo( 76, -88);
    ctx.bezierCurveTo(90, -130, 92, -180, 58, -225);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  if (L.style === 'pigtails') {
    // back-of-head hair volume
    wobblyCircle(0, -200, 52, { fill: L.hair, stroke: CONFIG.colors.ink, width: 3, seed: 30 });
  }
  if (L.style === 'chefHat') {
    // small hair tufts peeking out at the sides
    wobblyCircle(-46, -160, 16, { fill: L.hair, stroke: CONFIG.colors.ink, width: 2.5, seed: 31 });
    wobblyCircle( 46, -160, 16, { fill: L.hair, stroke: CONFIG.colors.ink, width: 2.5, seed: 32 });
  }
}

// Hair / hat IN FRONT of head (bangs, pigtails, chef hat)
function drawHairFront(L, key) {
  if (L.style === 'longHair') {
    // soft bangs across forehead
    ctx.beginPath();
    ctx.fillStyle = L.hair;
    ctx.strokeStyle = CONFIG.colors.ink;
    ctx.lineWidth = 3;
    ctx.moveTo(-54, -224);
    ctx.bezierCurveTo(-40, -252, 40, -252, 54, -224);
    ctx.bezierCurveTo(48, -200, 22, -188, 0, -194);
    ctx.bezierCurveTo(-22, -188, -48, -200, -54, -224);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // a few hair strand lines for texture
    wobblyLine(-26, -228, -20, -200, { stroke: L.hairLight, width: 2, seed: 41 });
    wobblyLine(  4, -240,   2, -200, { stroke: L.hairLight, width: 2, seed: 42 });
    wobblyLine( 28, -226,  22, -200, { stroke: L.hairLight, width: 2, seed: 43 });
  }
  if (L.style === 'pigtails') {
    // bangs cap on top of head
    ctx.beginPath();
    ctx.fillStyle = L.hair;
    ctx.strokeStyle = CONFIG.colors.ink;
    ctx.lineWidth = 3;
    ctx.moveTo(-52, -226);
    ctx.bezierCurveTo(-40, -258, 40, -258, 52, -226);
    ctx.bezierCurveTo(46, -198, 22, -190, 0, -196);
    ctx.bezierCurveTo(-22, -190, -46, -198, -52, -226);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // two pigtails sticking out the sides
    wobblyCircle(-78, -178, 22, { fill: L.hair, stroke: CONFIG.colors.ink, width: 3, seed: 44 });
    wobblyCircle( 78, -178, 22, { fill: L.hair, stroke: CONFIG.colors.ink, width: 3, seed: 45 });
    // bright red hair-tie bands
    wobblyRect(-92, -166, 18, 10, { fill: CONFIG.colors.red, stroke: CONFIG.colors.ink, width: 2, radius: 4, seed: 46 });
    wobblyRect( 74, -166, 18, 10, { fill: CONFIG.colors.red, stroke: CONFIG.colors.ink, width: 2, radius: 4, seed: 47 });
  }
  if (L.style === 'chefHat') {
    // small bangs peeking out under the hat band
    ctx.beginPath();
    ctx.fillStyle = L.hair;
    ctx.strokeStyle = CONFIG.colors.ink;
    ctx.lineWidth = 3;
    ctx.moveTo(-38, -210);
    ctx.bezierCurveTo(-30, -228, 30, -228, 38, -210);
    ctx.bezierCurveTo(28, -198, -28, -198, -38, -210);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // chef hat band across the top of the head
    wobblyRect(-50, -244, 100, 18, { fill: L.apron, stroke: CONFIG.colors.ink, width: 3, radius: 6, seed: 48 });
    // fluffy hat puff (three overlapping circles)
    wobblyCircle(-30, -270, 24, { fill: L.apron, stroke: CONFIG.colors.ink, width: 3, seed: 49, jitterAmt: 2.0 });
    wobblyCircle(  4, -282, 28, { fill: L.apron, stroke: CONFIG.colors.ink, width: 3, seed: 50, jitterAmt: 2.0 });
    wobblyCircle( 32, -270, 24, { fill: L.apron, stroke: CONFIG.colors.ink, width: 3, seed: 51, jitterAmt: 2.0 });
  }
}

function drawFace(L, key, opts = {}) {
  // Big shiny chibi eyes — head center y=-185, eyes slightly above center
  const eyeY = -180;
  const eyeX = 18;
  const frown = !!opts.frown;

  // Eye whites (with a thin outline so they pop on skin)
  wobblyCircle(-eyeX, eyeY, 8, { fill: '#fff', stroke: CONFIG.colors.ink, width: 2.5, seed: 60, squashY: 1.1 });
  wobblyCircle( eyeX, eyeY, 8, { fill: '#fff', stroke: CONFIG.colors.ink, width: 2.5, seed: 61, squashY: 1.1 });

  // Solid dark pupils (slightly big — anime-cute)
  ctx.fillStyle = CONFIG.colors.ink;
  ctx.beginPath(); ctx.ellipse(-eyeX + 1, eyeY + 1, 5, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( eyeX + 1, eyeY + 1, 5, 6, 0, 0, Math.PI * 2); ctx.fill();

  // Sparkle highlights — the key trick that makes the eyes feel cute
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(-eyeX + 2.5, eyeY - 2, 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc( eyeX + 2.5, eyeY - 2, 2.2, 0, Math.PI * 2); ctx.fill();
  // tiny secondary sparkle on the lower-left of the pupil
  ctx.beginPath(); ctx.arc(-eyeX - 1.5, eyeY + 3, 1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc( eyeX - 1.5, eyeY + 3, 1, 0, Math.PI * 2); ctx.fill();

  // Chubby pink cheek blush — green-tinged when frowning (the player is a bit grossed out)
  const blush = frown ? 'rgba(120, 180, 80, 0.45)' : 'rgba(214, 64, 60, 0.42)';
  wobblyCircle(-30, -160, 9, { fill: blush, stroke: null, seed: 64 });
  wobblyCircle( 30, -160, 9, { fill: blush, stroke: null, seed: 65 });

  // Mouth — smile by default, frown when the player is in Bob's fart
  ctx.beginPath();
  ctx.strokeStyle = CONFIG.colors.ink;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  if (frown) {
    // Inverted-U: ends low, peaks higher in the middle = frown
    ctx.moveTo(-7, -150);
    ctx.quadraticCurveTo(0, -158, 7, -150);
  } else {
    // U-shape: ends high, dips lower in the middle = smile
    ctx.moveTo(-6, -156);
    ctx.quadraticCurveTo(0, -148, 6, -156);
  }
  ctx.stroke();
}

// Vada extras — utility belt with little pouches at the bottom of her body
function drawEquipperPouches(L) {
  // belt
  wobblyRect(-38, -78, 76, 10, { fill: '#5a3a2a', stroke: CONFIG.colors.ink, width: 2.5, radius: 4, seed: 70 });
  // pouches
  wobblyRect(-30, -75, 14, 18, { fill: '#8b5a3a', stroke: CONFIG.colors.ink, width: 2, radius: 3, seed: 71 });
  wobblyRect( -8, -75, 14, 18, { fill: '#8b5a3a', stroke: CONFIG.colors.ink, width: 2, radius: 3, seed: 72 });
  wobblyRect( 16, -75, 14, 18, { fill: '#8b5a3a', stroke: CONFIG.colors.ink, width: 2, radius: 3, seed: 73 });
  // suspender straps from collar to belt
  wobblyLine(-18, -123, -18, -78, { stroke: '#5a3a2a', width: 4, seed: 74 });
  wobblyLine( 18, -123,  18, -78, { stroke: '#5a3a2a', width: 4, seed: 75 });
}

// Ada extras — apron over the body, wooden spoon in pocket
function drawCookApron(L) {
  wobblyRect(-30, -110, 60, 60, { fill: L.apron, stroke: CONFIG.colors.ink, width: 3, radius: 8, seed: 80 });
  // apron pocket
  wobblyRect(-15, -84, 30, 18, { fill: '#f3e9c8', stroke: CONFIG.colors.ink, width: 2, radius: 4, seed: 81 });
  // little neck-strap loops
  wobblyLine(-22, -125, -22, -110, { stroke: CONFIG.colors.ink, width: 2.5, seed: 82 });
  wobblyLine( 22, -125,  22, -110, { stroke: CONFIG.colors.ink, width: 2.5, seed: 83 });
  // wooden spoon poking out
  wobblyLine(0, -84, 0, -56, { stroke: '#9b6b3a', width: 4, seed: 84 });
  wobblyCircle(0, -52, 6, { fill: '#9b6b3a', stroke: CONFIG.colors.ink, width: 2, seed: 85 });
}

// Violet extras — small RAMS roundel on her shirt
function drawRamLogo(L) {
  wobblyCircle(0, -90, 14, { fill: CONFIG.colors.paper, stroke: CONFIG.colors.ink, width: 2.5, seed: 90 });
  ctx.save();
  ctx.strokeStyle = CONFIG.colors.ink;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  // little ram-horn curls flanking the R
  ctx.beginPath();
  ctx.moveTo(-7, -96);
  ctx.bezierCurveTo(-13, -90, -9, -84, -3, -86);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(7, -96);
  ctx.bezierCurveTo(13, -90, 9, -84, 3, -86);
  ctx.stroke();
  ctx.fillStyle = CONFIG.colors.ink;
  ctx.font = '700 12px "Permanent Marker", cursive';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('R', 0, -89);
  ctx.restore();
}

/* ---------------------------------------------------------------------
   Background decorations — doodles to make the paper feel busy + warm
   --------------------------------------------------------------------- */
function drawTitleDoodles(time) {
  const c = CONFIG.colors;
  // Sun in upper-right with rays
  const sx = 1140, sy = 110;
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + time * 0.2;
    const r1 = 52, r2 = 70;
    const x1 = sx + Math.cos(a) * r1;
    const y1 = sy + Math.sin(a) * r1;
    const x2 = sx + Math.cos(a) * r2;
    const y2 = sy + Math.sin(a) * r2;
    wobblyLine(x1, y1, x2, y2, { stroke: c.yellow, width: 4, seed: 100 + i });
  }
  wobblyCircle(sx, sy, 42, { fill: c.yellow, stroke: c.ink, width: 4, seed: 110 });

  // a couple of fluffy clouds
  drawCloud(190, 130, 1.0, 120);
  drawCloud(360, 90,  0.7, 130);
  drawCloud(880, 180, 0.85, 140);

  // grass tufts at bottom
  for (let x = 40; x < 1240; x += 60) {
    drawGrassTuft(x + (jitter(x) * 8), 690 + (jitter(x + 1) * 4), x);
  }

  // tiny ram doodle bottom-left (RAMS reference)
  drawTinyRam(80, 640, 0.9);

  // tiny Pittsburgh skyline silhouette bottom-right (the "view from Eden Hall")
  drawTinySkyline(1020, 638, 0.85);
}

function drawCloud(cx, cy, scale, seedBase) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  wobblyCircle(-26, 0, 22, { fill: '#fff', stroke: CONFIG.colors.ink, width: 3, seed: seedBase });
  wobblyCircle(  0, -8, 26, { fill: '#fff', stroke: CONFIG.colors.ink, width: 3, seed: seedBase + 1 });
  wobblyCircle( 26, 0, 22, { fill: '#fff', stroke: CONFIG.colors.ink, width: 3, seed: seedBase + 2 });
  ctx.restore();
}

function drawGrassTuft(x, y, seed) {
  const c = CONFIG.colors;
  wobblyLine(x - 6, y, x - 6, y - 14, { stroke: c.grass, width: 3, seed });
  wobblyLine(x,     y, x,     y - 18, { stroke: c.grassDk, width: 3, seed: seed + 1 });
  wobblyLine(x + 6, y, x + 6, y - 13, { stroke: c.grass, width: 3, seed: seed + 2 });
}

function drawTinyRam(cx, cy, scale) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  // body
  wobblyRect(-24, -16, 48, 24, { fill: '#fff8e8', stroke: CONFIG.colors.ink, width: 2.5, radius: 12, seed: 200 });
  // head
  wobblyCircle(-30, -10, 14, { fill: '#fff8e8', stroke: CONFIG.colors.ink, width: 2.5, seed: 201 });
  // horn
  ctx.beginPath();
  ctx.strokeStyle = CONFIG.colors.ink;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.moveTo(-36, -22);
  ctx.bezierCurveTo(-46, -22, -46, -10, -38, -10);
  ctx.stroke();
  // legs
  wobblyLine(-14, 8, -14, 18, { stroke: CONFIG.colors.ink, width: 2.5, seed: 202 });
  wobblyLine( 14, 8,  14, 18, { stroke: CONFIG.colors.ink, width: 2.5, seed: 203 });
  // eye
  wobblyCircle(-32, -10, 1.6, { fill: CONFIG.colors.ink, stroke: null, seed: 204 });
  // label
  ctx.fillStyle = CONFIG.colors.inkSoft;
  ctx.font = '20px "Patrick Hand", cursive';
  ctx.textAlign = 'center';
  ctx.fillText('RAMS', 0, 36);
  ctx.restore();
}

function drawTinySkyline(cx, cy, scale) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  const c = '#3b4a5c';
  // a few buildings of varying heights
  const buildings = [
    [-90, -28, 16, 28], [-72, -42, 18, 42], [-52, -34, 14, 34],
    [-36, -56, 22, 56], [-12, -64, 14, 64], [4, -50, 12, 50],
    [18, -44, 18, 44], [40, -60, 14, 60], [56, -38, 16, 38],
    [74, -46, 14, 46],
  ];
  for (let i = 0; i < buildings.length; i++) {
    const [x, y, w, h] = buildings[i];
    wobblyRect(x, y, w, h, { fill: c, stroke: CONFIG.colors.ink, width: 1.5, radius: 2, seed: 300 + i, jitterAmt: 0.6 });
  }
  // little river line
  wobblyLine(-100, 4, 100, 4, { stroke: '#6fb0c8', width: 3, seed: 320 });
  ctx.fillStyle = CONFIG.colors.inkSoft;
  ctx.font = '16px "Patrick Hand", cursive';
  ctx.textAlign = 'center';
  ctx.fillText('Pittsburgh', 0, 24);
  ctx.restore();
}

/* ---------------------------------------------------------------------
   Game state
   --------------------------------------------------------------------- */
const game = {
  scene: 'title',           // 'title' | 'select' | 'play'
  selectedIndex: 0,         // index into CHARACTER_ORDER
  selected: null,
  time: 0,                  // seconds since game start (for animation)
  promptPulse: 0,

  // Play-mode state — populated by initBiome()
  biome: null,              // current biome key, e.g. 'grassland'
  world: null,              // { w, h, def }
  player: null,             // { x, y, hearts, ... }
  trees: [],
  flowers: [],
  levers: [],               // [{ x, y, progress, fixed, seed }]
  portal: null,             // { x, y } once all levers are fixed
  skillCheck: null,         // active skill-check, see startSkillCheck()
  bullies: [],              // [{ key, x, y, state, ... }]
  teammates: [],            // [{ key, x, y, hearts, state, ... }]
  smokeParticles: [],       // [{ x, y, age, size }]
  traps: [],                // [{ x, y, triggered, triggeredT, seed }]
  burgers: [],              // [{ x, y, seed }]
  cooldowns: { trap: 0, burger: 0, stun: 0, scream: 0 },
  reviveTarget: null,       // teammate currently being revived (visual cue)
  camera: { x: 0, y: 0 },
  introT: 0,                // biome intro banner timer (counts down)
  victoryT: 0,              // biome-cleared overlay timer
  deathT: 0,                // counts down after player dies before game-over screen
};

// Keys currently held — used in update loop for continuous movement.
const keysHeld = new Set();

/* ---------------------------------------------------------------------
   Title scene
   --------------------------------------------------------------------- */
function renderTitle(t) {
  const c = CONFIG.colors;
  // background paper already shows through canvas bg color (via CSS), but
  // we also paint paper here so canvas is self-contained when screenshotted
  ctx.fillStyle = c.paper;
  ctx.fillRect(0, 0, CONFIG.view.w, CONFIG.view.h);

  drawTitleDoodles(t);

  // Title — two big lines, slightly tilted (paper-on-desk feel)
  ctx.save();
  ctx.translate(CONFIG.view.w / 2, 240);
  ctx.rotate(-0.02);
  // soft yellow highlight blob behind the title
  ctx.save();
  ctx.translate(-20, 6);
  ctx.fillStyle = 'rgba(245, 200, 66, 0.55)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 540, 130, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  markerText('EDEN HALL', 0, -32, { size: 110, color: c.red, shadow: true });
  markerText('ADVENTURE', 0, 78, { size: 110, color: c.ink, shadow: true });
  ctx.restore();

  // Subtitle / credit
  handText('Designed by Violet,', CONFIG.view.w / 2, 408, { size: 34, color: c.inkSoft });
  handText('with friends Vada and Ada.', CONFIG.view.w / 2, 446, { size: 34, color: c.inkSoft });

  // Pulse "Press SPACE" prompt
  const pulse = 0.5 + 0.5 * Math.sin(t * 3);
  ctx.save();
  ctx.globalAlpha = 0.6 + pulse * 0.4;
  markerText('press SPACE to begin', CONFIG.view.w / 2, 580, { size: 38, color: c.ink });
  ctx.restore();
}

/* ---------------------------------------------------------------------
   Character select scene
   --------------------------------------------------------------------- */
function renderSelect(t) {
  const c = CONFIG.colors;
  ctx.fillStyle = c.paper;
  ctx.fillRect(0, 0, CONFIG.view.w, CONFIG.view.h);

  // Header
  markerText('CHOOSE YOUR HERO', CONFIG.view.w / 2, 70, { size: 64, color: c.red, shadow: true });
  handText('arrow keys ←  → to choose,  press SPACE to confirm',
    CONFIG.view.w / 2, 118, { size: 24, color: c.inkSoft });

  // Layout three cards
  const { cardW, cardH, gap } = CONFIG.select;
  const totalW = cardW * 3 + gap * 2;
  const startX = (CONFIG.view.w - totalW) / 2;
  const baseY = 150;

  for (let i = 0; i < CHARACTER_ORDER.length; i++) {
    const key = CHARACTER_ORDER[i];
    const isSel = i === game.selectedIndex;
    const x = startX + i * (cardW + gap);
    const bob = isSel ? Math.sin(t * CONFIG.select.bobSpeed) * CONFIG.select.bobAmplitude : 0;
    const y = baseY + bob;
    drawCharacterCard(key, x, y, cardW, cardH, isSel, i);
  }
}

function drawCharacterCard(key, x, y, w, h, selected, index) {
  const ch = CHARACTERS[key];
  const c = CONFIG.colors;
  const seed = 500 + index * 20;
  const rotate = (index - 1) * 0.012; // subtle fan

  // selection glow
  if (selected) {
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(rotate);
    ctx.translate(-w / 2, -h / 2);
    ctx.fillStyle = ch.colorSoft;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(-12, -12, w + 24, h + 24, 22) : ctx.rect(-12, -12, w + 24, h + 24);
    ctx.fill();
    ctx.restore();
  }

  // Card body
  wobblyRect(x, y, w, h, {
    fill: selected ? c.cardBgSel : c.cardBg,
    stroke: c.ink,
    width: selected ? 6 : 4,
    radius: 18,
    seed,
    jitterAmt: 1.4,
    rotate,
  });

  // Name banner — colored ribbon at top
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(rotate);
  ctx.translate(-w / 2, -h / 2);

  wobblyRect(20, 20, w - 40, 64, {
    fill: ch.color,
    stroke: c.ink,
    width: 4,
    radius: 12,
    seed: seed + 5,
    jitterAmt: 1.4,
  });
  markerText(ch.name.toUpperCase(), w / 2, 52, { size: 44, color: c.paper });

  // Big chibi portrait — moved up + scaled up since the role line is gone
  drawCharacterPortrait(ctx, key, w / 2, 290, 0.62);

  // Hearts row right below the feet
  drawHeartRow(ch.hearts, w / 2, 312, 12);

  // Stats
  const statsX = 36;
  const statsW = w - 72;
  let sy = 348;
  drawStatRow('Lever Speed',  ch.stats.lever,   statsX, sy, statsW); sy += 26;
  drawStatRow('Foot Speed',   ch.stats.speed,   statsX, sy, statsW); sy += 26;
  drawStatRow('Skill Window', ch.stats.skill,   statsX, sy, statsW); sy += 30;

  // Blurb
  ctx.save();
  ctx.font = 'italic 18px "Patrick Hand", cursive';
  ctx.fillStyle = c.inkSoft;
  ctx.textAlign = 'center';
  wrapText(ch.blurb, w / 2, sy, w - 56, 20);
  ctx.restore();

  // Abilities (first 1 or 2 — keeps card readable)
  let ay = sy + 38;
  for (let i = 0; i < Math.min(ch.abilities.length, 2); i++) {
    const ab = ch.abilities[i];
    // Active = yellow chip with key letter; Passive = cream chip with a star
    wobblyRect(28, ay - 12, 24, 24, {
      fill: ab.passive ? c.cardBg : c.yellow,
      stroke: c.ink,
      width: 2.5,
      radius: 5,
      seed: seed + 30 + i,
    });
    ctx.fillStyle = ab.passive ? c.inkSoft : c.ink;
    ctx.font = '700 16px "Permanent Marker", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ab.passive ? '★' : ab.key, 40, ay);
    // Name (italic for passive abilities)
    ctx.font = ab.passive
      ? 'italic 700 16px "Patrick Hand", cursive'
      : '700 16px "Patrick Hand", cursive';
    ctx.fillStyle = c.ink;
    ctx.textAlign = 'left';
    ctx.fillText(ab.name + (ab.passive ? '  (passive)' : ''), 60, ay - 4);
    ctx.font = '13px "Patrick Hand", cursive';
    ctx.fillStyle = c.inkSoft;
    wrapText(ab.desc, 60, ay + 10, w - 90, 14, 'left');
    ay += 32;
  }

  ctx.restore();

  // Selection indicator: marker arrow above selected card
  if (selected) {
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(rotate);
    ctx.translate(-w / 2, -h / 2);
    markerText('▼', w / 2, -14, { size: 36, color: c.red });
    ctx.restore();
  }
}

// Naive text wrap — fine for the small amounts of text we have.
function wrapText(text, x, y, maxWidth, lineHeight, align = 'center') {
  const words = text.split(' ');
  let line = '';
  let yy = y;
  ctx.textAlign = align;
  for (let i = 0; i < words.length; i++) {
    const test = line ? line + ' ' + words[i] : words[i];
    const metrics = ctx.measureText(test);
    if (metrics.width > maxWidth && line) {
      ctx.fillText(line, x, yy);
      line = words[i];
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
}

/* =====================================================================
   PLAY SCENE — biome map, player movement, camera, HUD
   ===================================================================== */

// Tiny seedable RNG so the same biome lays out the same trees every run.
function rngFromSeed(seed) {
  let s = (seed >>> 0) || 1;
  return function rand() {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

// Variable name kept as `trees`, but it now holds heterogeneous obstacles
// (trees, cacti, rocks). Each item has a `type` field so drawTree() can dispatch.
function generateTrees(biome) {
  const obstacles = [];
  const rng = rngFromSeed(biome.treeSeed);
  const { w, h } = biome.world;
  const cx = w / 2, cy = h / 2;

  // Per-type sizes — keeps things readable to tweak.
  const TYPE_SPEC = {
    tree:   { canopyMin: 38, canopyVar: 16, trunkR: 14 },
    cactus: { canopyMin: 28, canopyVar: 10, trunkR: 16 },
    rock:   { canopyMin: 24, canopyVar: 14, trunkR: 20 },
  };
  const PLAN = [
    { type: 'tree',   count: biome.treeCount   || 0 },
    { type: 'cactus', count: biome.cactusCount || 0 },
    { type: 'rock',   count: biome.rockCount   || 0 },
  ];

  for (const { type, count } of PLAN) {
    const ts = TYPE_SPEC[type];
    let placed = 0, attempts = 0;
    while (placed < count && attempts < 600) {
      attempts++;
      const x = 100 + rng() * (w - 200);
      const y = 100 + rng() * (h - 200);
      const canopyR = ts.canopyMin + rng() * ts.canopyVar;
      // Keep a clearing around the spawn point.
      if ((x - cx) * (x - cx) + (y - cy) * (y - cy) < 240 * 240) continue;
      // Don't crowd against another obstacle.
      let bad = false;
      for (const t of obstacles) {
        const dx = x - t.x, dy = y - t.y;
        const minSep = canopyR + t.canopyR + 22;
        if (dx * dx + dy * dy < minSep * minSep) { bad = true; break; }
      }
      if (bad) continue;
      obstacles.push({
        type,
        x, y,
        canopyR,
        trunkR: ts.trunkR,
        seed: 1000 + obstacles.length * 11,
      });
      placed++;
    }
  }
  return obstacles;
}

function generateFlowers(biome) {
  const flowers = [];
  const rng = rngFromSeed(biome.treeSeed + 99);
  for (let i = 0; i < biome.flowerCount; i++) {
    flowers.push({
      x: 30 + rng() * (biome.world.w - 60),
      y: 30 + rng() * (biome.world.h - 60),
      color: biome.flowerColors[Math.floor(rng() * biome.flowerColors.length)],
      size: 3.5 + rng() * 2.5,
    });
  }
  return flowers;
}

// Place levers around the map, away from spawn, away from trees, spread apart.
function generateLevers(biome, trees) {
  const levers = [];
  const rng = rngFromSeed(biome.treeSeed + 7);
  const { w, h } = biome.world;
  const cx = w / 2, cy = h / 2;
  const minSpread = 360;     // minimum distance between two levers
  let attempts = 0;
  while (levers.length < biome.leverCount && attempts < 600) {
    attempts++;
    const x = 140 + rng() * (w - 280);
    const y = 140 + rng() * (h - 280);
    // Stay clear of the spawn point
    if (Math.hypot(x - cx, y - cy) < 300) continue;
    // Stay clear of trees
    let bad = false;
    for (const t of trees) {
      if (Math.hypot(x - t.x, y - t.y) < t.canopyR + 50) { bad = true; break; }
    }
    if (bad) continue;
    // Spread levers across the map
    for (const l of levers) {
      if (Math.hypot(x - l.x, y - l.y) < minSpread) { bad = true; break; }
    }
    if (bad) continue;
    levers.push({
      x, y,
      progress: 0,           // 0..hitsToFix
      fixed: false,
      seed: 7000 + levers.length * 13,
    });
  }
  return levers;
}

// Find the nearest unfixed lever within reach (or null).
function nearestInteractableLever() {
  const p = game.player;
  let best = null, bestD = PLAY.lever.interactRadius;
  for (const l of game.levers) {
    if (l.fixed) continue;
    const d = Math.hypot(p.x - l.x, p.y - l.y);
    if (d < bestD) { bestD = d; best = l; }
  }
  return best;
}

// Pick a random green-zone center such that the whole zone fits on the bar.
function randomGreenCenter(width) {
  const margin = width / 2;
  return margin + Math.random() * (1 - 2 * margin);
}

function startSkillCheck(lever) {
  const greenW = currentGreenWidth();
  game.skillCheck = {
    leverIndex:  game.levers.indexOf(lever),
    pos:         0,                      // 0..1 along the bar
    dir:         1,                      // +1 right, -1 left
    speed:       PLAY.lever.indicatorSpeed,
    greenW,
    greenCenter: randomGreenCenter(greenW),
    flashT:      0,
    flashKind:   null,                   // 'hit' | 'miss' | null
  };
}

function hitSkillCheck() {
  const sc = game.skillCheck;
  if (!sc) return;
  const lever = game.levers[sc.leverIndex];
  if (!lever || lever.fixed) { game.skillCheck = null; return; }

  const inGreen = Math.abs(sc.pos - sc.greenCenter) <= sc.greenW / 2;
  sc.flashT = PLAY.lever.flashTime;
  sc.flashKind = inGreen ? 'hit' : 'miss';

  if (inGreen) {
    lever.progress += 1;
    if (lever.progress >= PLAY.lever.hitsToFix) {
      lever.fixed = true;
      game.skillCheck = null;
      maybeSpawnPortal();
    } else {
      // Move the green zone for the next attempt
      sc.greenCenter = randomGreenCenter(sc.greenW);
    }
  } else {
    lever.progress = Math.max(0, lever.progress - PLAY.lever.missPenalty);
    // M4: this is also where Bob/Burt get an alert ping at the player's position.
  }
}

function maybeSpawnPortal() {
  if (game.portal) return;
  if (!game.levers.every(l => l.fixed)) return;
  // Place the portal at a fixed spot — the right side of the map for grassland.
  const w = game.world;
  game.portal = {
    x: w.w * 0.85,
    y: w.h * 0.5,
    spawnT: 0,        // counts up so we can pop the portal in
  };
}

function initBiome(biomeKey) {
  const def = BIOMES[biomeKey];
  const ch = CHARACTERS[game.selected];

  game.biome = biomeKey;
  game.world = { w: def.world.w, h: def.world.h, def };
  game.trees = generateTrees(def);
  game.flowers = generateFlowers(def);
  game.levers = generateLevers(def, game.trees);
  game.portal = null;
  game.skillCheck = null;
  game.victoryT = 0;
  game.deathT = 0;
  game.smokeParticles = [];
  game.reviveTarget = null;
  game.traps = [];
  game.burgers = [];
  game.cooldowns = { trap: 0, burger: 0, stun: 0, scream: 0 };

  const cx = def.world.w / 2;
  const cy = def.world.h / 2;

  game.player = {
    x: cx,
    y: cy,
    radius: PLAY.playerRadius,
    speed: PLAY.speedBase + ch.stats.speed * PLAY.speedPerStat,
    walkPhase: 0,
    moving: false,
    hearts: ch.hearts,
    maxHearts: ch.hearts,
    iframes: 0,
    hitFlashT: 0,
    fartSlowT: 0,         // seconds of fart-slow remaining (refreshed while inside smoke)
    beingDragged: null,   // bully reference while Burt is reeling the player in
  };

  // Teammates = the two unselected characters, spawned beside the player.
  const tmKeys = CHARACTER_ORDER.filter(k => k !== game.selected);
  game.teammates = tmKeys.map((key, i) => {
    const tch = CHARACTERS[key];
    const offset = PLAY.teammate.spawnOffset;
    const dx = i === 0 ? -offset : offset;
    return {
      key,
      x: cx + dx,
      y: cy + 30,
      radius: PLAY.playerRadius,
      speed: PLAY.speedBase + tch.stats.speed * PLAY.speedPerStat,
      walkPhase: 0,
      moving: false,
      hearts: tch.hearts,
      maxHearts: tch.hearts,
      state: 'walkToLever',         // walkToLever | fixLever | flee | idle | downed
      iframes: 0,
      hitFlashT: 0,
      reviveT: 0,
      fixingLever: null,
      beingDragged: null,           // set when Burt is reeling them in
    };
  });

  // Bullies — placed far from spawn around the perimeter
  const bullyKeys = def.bullies || [];
  game.bullies = bullyKeys.map((key, i) => {
    const bdef = BULLIES[key];
    // Spread them around the spawn at a comfortable distance
    const angle = (i / Math.max(1, bullyKeys.length)) * Math.PI * 2 + 0.7;
    const dist = 580;
    return {
      key,
      x: clamp(cx + Math.cos(angle) * dist, 100, def.world.w - 100),
      y: clamp(cy + Math.sin(angle) * dist * 0.7, 100, def.world.h - 100),
      radius: bdef.radius,
      state: 'patrol',              // patrol | chase | recover
      target: null,
      targetX: 0,
      targetY: 0,
      waypointTimer: 0,
      hitCooldown: 0,
      smokeTimer: 0,
      walkPhase: 0,
      moving: false,
      slowT: 0,                     // seconds of slow remaining (Violet's trap, Ada's scream)
      stunT: 0,                     // seconds of stun remaining (Vada's punch)
      confusedT: 0,                 // seconds of confusion remaining (Ada's scream)
      wanderTimer: 0,               // re-pick wander target while confused
      hitFlashT: 0,                 // brief flash when hit by Vada's stun
      // Burt-only fields (harmless on Bob)
      hookCooldown: (key === 'burt') ? 2.0 : 0,    // 2s grace before first hook
      dragT: 0,
      dragTarget: null,
    };
  });

  game.camera = { x: 0, y: 0 };
  updateCamera();
  game.introT = PLAY.introDuration;
  keysHeld.clear();
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function updateCamera() {
  const p = game.player;
  const w = game.world;
  game.camera.x = p.x - CONFIG.view.w / 2;
  game.camera.y = p.y - CONFIG.view.h / 2;
  // Clamp to world bounds (only if world is larger than the view)
  game.camera.x = Math.max(0, Math.min(Math.max(0, w.w - CONFIG.view.w), game.camera.x));
  game.camera.y = Math.max(0, Math.min(Math.max(0, w.h - CONFIG.view.h), game.camera.y));
}

/* ---- Combat / AI ---- */

function dealDamage(target) {
  if (!target || target.iframes > 0 || target.hearts <= 0) return;
  target.hearts -= 1;
  target.iframes = PLAY.combat.iframes;
  target.hitFlashT = 0.35;

  if (target === game.player && target.hearts <= 0) {
    // Cancel any active interaction so the death freeze reads cleanly.
    game.skillCheck = null;
    game.reviveTarget = null;
    game.deathT = PLAY.gameOver.deathFreeze;
  }
}

// True if the line segment (x1,y1)→(x2,y2) is blocked by the canopy of any
// obstacle (tree/cactus/rock). Used so bullies can't see the player when
// they're hiding on the far side of cover.
function sightBlocked(x1, y1, x2, y2) {
  for (const o of game.trees) {
    const cx = o.x;
    const cy = o.y - 4;                 // approximate visual centre
    const r  = o.canopyR * 0.7;         // generous, but not the full canopy
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) continue;
    let t = ((cx - x1) * dx + (cy - y1) * dy) / lenSq;
    if (t < 0) t = 0; else if (t > 1) t = 1;
    const px = x1 + t * dx;
    const py = y1 + t * dy;
    if ((cx - px) * (cx - px) + (cy - py) * (cy - py) < r * r) return true;
  }
  return false;
}

function pushOutOfTrees(ent) {
  for (const t of game.trees) {
    const ddx = ent.x - t.x;
    const ddy = ent.y - (t.y - 4);
    const dist = Math.hypot(ddx, ddy);
    const minDist = ent.radius + t.trunkR;
    if (dist > 0 && dist < minDist) {
      const push = (minDist - dist) / dist;
      ent.x += ddx * push;
      ent.y += ddy * push;
    }
  }
}

function updateBullies(dt) {
  const p = game.player;
  for (const b of game.bullies) {
    const def = BULLIES[b.key];
    if (b.hitCooldown > 0)  b.hitCooldown -= dt;
    if (b.slowT > 0)        b.slowT       -= dt;
    if (b.stunT > 0)        b.stunT       -= dt;
    if (b.confusedT > 0)    b.confusedT   -= dt;
    if (b.hitFlashT > 0)    b.hitFlashT   -= dt;
    if (b.hookCooldown > 0) b.hookCooldown -= dt;
    // Smoke trail only ticks while Bob is actually moving — no farts while
    // stunned or standing still. Timer carries over so resuming feels natural.

    // ----- Burt's drag tick: yank the target toward him over `dragDuration`.
    // Runs even when stunned (the hand is already extended), so getting stunned
    // mid-drag doesn't free the target.
    if (b.dragT > 0 && b.dragTarget) {
      const target = b.dragTarget;
      const ddx = b.x - target.x;
      const ddy = b.y - target.y;
      const dd = Math.hypot(ddx, ddy);
      const stopDist = def.dragStopDist || 140;
      if (dd > stopDist) {
        const remaining = Math.max(0.05, b.dragT);
        const pullSpeed = Math.max(700, (dd - stopDist) / remaining);
        target.x += (ddx / dd) * pullSpeed * dt;
        target.y += (ddy / dd) * pullSpeed * dt;
      }
      b.dragT -= dt;
      if (b.dragT <= 0) {
        if (target.beingDragged === b) target.beingDragged = null;
        b.dragTarget = null;
      }
    }

    if (b.stunT > 0) {
      // Frozen — no movement, no attacks. Smoke still puffs.
      b.moving = false;
    } else if (b.confusedT > 0) {
      // Wander randomly, no chase, no attack
      if (b.wanderTimer <= 0 ||
          Math.hypot(b.targetX - b.x, b.targetY - b.y) < 30) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 100 + Math.random() * 120;
        b.targetX = clamp(b.x + Math.cos(angle) * dist, 100, game.world.w - 100);
        b.targetY = clamp(b.y + Math.sin(angle) * dist, 100, game.world.h - 100);
        b.wanderTimer = 1.2 + Math.random() * 1.2;
      }
      b.wanderTimer -= dt;
      const dx = b.targetX - b.x, dy = b.targetY - b.y;
      const d = Math.hypot(dx, dy);
      const speedMul = b.slowT > 0 ? 0.5 : 1;
      const speed = def.speed * speedMul * 0.55;
      if (d > 0) {
        b.x += (dx / d) * speed * dt;
        b.y += (dy / d) * speed * dt;
        b.walkPhase += dt;
        b.moving = true;
      } else {
        b.moving = false;
      }
      b.target = null;
    } else {
      // ----- Normal patrol/chase logic -----
      const candidates = [];
      if (p.hearts > 0) candidates.push(p);
      for (const tm of game.teammates) if (tm.hearts > 0) candidates.push(tm);

      let closest = null, closestD = def.sight;
      for (const t of candidates) {
        const d = Math.hypot(b.x - t.x, b.y - t.y);
        if (d >= closestD) continue;
        if (sightBlocked(b.x, b.y, t.x, t.y)) continue;   // hidden behind cover
        closest = t; closestD = d;
      }

      if (closest) {
        b.state = 'chase';
        b.target = closest;
      } else if (b.target) {
        const d = Math.hypot(b.x - b.target.x, b.y - b.target.y);
        if (d > def.chaseGiveUp || b.target.hearts <= 0) {
          b.target = null;
          b.state = 'patrol';
        }
      }

      // Burt: fire the long-reach drag if a target's in hook range, in line
      // of sight, and we're cool. Cover blocks the hook just like sight.
      if (b.key === 'burt' && b.target && b.dragT <= 0 && b.hookCooldown <= 0 &&
          b.target.hearts > 0 && !b.target.beingDragged) {
        const td = Math.hypot(b.x - b.target.x, b.y - b.target.y);
        const minDragDist = def.dragStopDist + 40;
        if (td > minDragDist && td < def.hookRange &&
            !sightBlocked(b.x, b.y, b.target.x, b.target.y)) {
          b.dragT = def.dragDuration;
          b.dragTarget = b.target;
          b.target.beingDragged = b;
          b.hookCooldown = def.hookCooldown;
        }
      }

      const speedMul = b.slowT > 0 ? 0.5 : 1;
      const baseSpeed = def.speed * speedMul;

      if (b.state === 'chase' && b.target) {
        const dx = b.target.x - b.x;
        const dy = b.target.y - b.y;
        const d = Math.hypot(dx, dy);
        if (d > 0) {
          b.x += (dx / d) * baseSpeed * dt;
          b.y += (dy / d) * baseSpeed * dt;
          b.walkPhase += dt;
          b.moving = true;
        }
        if (d < def.hitDistance && b.hitCooldown <= 0) {
          dealDamage(b.target);
          b.hitCooldown = def.hitCooldown;
        }
      } else {
        if (b.waypointTimer <= 0 ||
            Math.hypot(b.targetX - b.x, b.targetY - b.y) < 30) {
          b.targetX = 120 + Math.random() * (game.world.w - 240);
          b.targetY = 120 + Math.random() * (game.world.h - 240);
          b.waypointTimer = 4 + Math.random() * 4;
        }
        b.waypointTimer -= dt;
        const dx = b.targetX - b.x, dy = b.targetY - b.y;
        const d = Math.hypot(dx, dy);
        if (d > 0) {
          b.x += (dx / d) * baseSpeed * def.patrolFactor * dt;
          b.y += (dy / d) * baseSpeed * def.patrolFactor * dt;
          b.walkPhase += dt;
          b.moving = true;
        } else {
          b.moving = false;
        }
      }
    }

    pushOutOfTrees(b);

    // Trap collision (Violet's J)
    for (const tr of game.traps) {
      if (tr.triggered) continue;
      if (Math.hypot(b.x - tr.x, b.y - tr.y) < PLAY.abilities.trap.radius) {
        tr.triggered = true;
        tr.triggeredT = 0;
        b.slowT = PLAY.abilities.trap.slowDuration;
      }
    }

    // Smoke emission — Bob only, and only while moving. Big, opaque puffs.
    if (b.moving && def.smokeRate > 0) {
      b.smokeTimer += dt;
      if (b.smokeTimer >= def.smokeRate) {
        b.smokeTimer = 0;
        game.smokeParticles.push({
          x: b.x + (Math.random() - 0.5) * 18,
          y: b.y - 14 + (Math.random() - 0.5) * 8,
          age: 0,
          size: 30 + Math.random() * 10,        // bigger initial radius (~30-40)
          seed: Math.floor(Math.random() * 100000),
        });
      }
    }
  }

  // Tick smoke particles, drop the dead ones.
  for (let i = game.smokeParticles.length - 1; i >= 0; i--) {
    const s = game.smokeParticles[i];
    s.age += dt;
    if (s.age > BULLIES.bob.smokeMaxAge) game.smokeParticles.splice(i, 1);
  }
}

function updateTeammates(dt) {
  const p = game.player;

  for (const tm of game.teammates) {
    if (tm.iframes > 0) tm.iframes -= dt;
    if (tm.hitFlashT > 0) tm.hitFlashT -= dt;

    // ----- Being dragged: AI is locked out, Burt's drag tick moves us.
    if (tm.beingDragged) {
      tm.moving = true;
      tm.walkPhase += dt;
      continue;
    }

    // ----- Downed: lie on the ground; player can revive by holding Space.
    if (tm.hearts <= 0) {
      tm.state = 'downed';
      tm.moving = false;
      const beingRevived =
        keysHeld.has('KeyE') &&
        Math.hypot(p.x - tm.x, p.y - tm.y) < PLAY.teammate.reviveRadius &&
        // Only one teammate revives at a time — prefer nearest (handled below).
        game.reviveTarget === tm;
      if (beingRevived) {
        tm.reviveT += dt;
        if (tm.reviveT >= PLAY.teammate.reviveTime) {
          tm.hearts = 1;
          tm.reviveT = 0;
          tm.iframes = 1.5;
          tm.state = 'walkToLever';
          game.reviveTarget = null;
        }
      } else {
        tm.reviveT = Math.max(0, tm.reviveT - dt * PLAY.teammate.reviveDecayMul);
      }
      continue;
    }

    // ----- Flee from any nearby bully.
    let fleeFrom = null, fleeD = PLAY.teammate.fleeRadius;
    for (const b of game.bullies) {
      const d = Math.hypot(tm.x - b.x, tm.y - b.y);
      if (d < fleeD) { fleeFrom = b; fleeD = d; }
    }

    let dx = 0, dy = 0;
    if (fleeFrom) {
      tm.state = 'flee';
      tm.fixingLever = null;
      const fdx = tm.x - fleeFrom.x;
      const fdy = tm.y - fleeFrom.y;
      const fd = Math.hypot(fdx, fdy);
      if (fd > 0) { dx = fdx / fd; dy = fdy / fd; }

      // Smoke avoidance: if a smoke cloud sits in our flee path, deflect
      // sideways (perpendicular to the flee direction) so we go around it.
      const maxAge = BULLIES.bob.smokeMaxAge;
      const cushion = 50;     // start steering this many px before the cloud edge
      for (const s of game.smokeParticles) {
        const lifeT = s.age / maxAge;
        if (lifeT > PLAY.fart.maxLifeFrac) continue;
        const sx = s.x;
        const sy = s.y - lifeT * 14;
        const sr = s.size * (1 + lifeT * 0.7);
        const tox = sx - tm.x;
        const toy = sy - tm.y;
        const td = Math.hypot(tox, toy);
        const safe = sr + cushion;
        if (td <= 0 || td > safe) continue;
        // Only deflect if the cloud is "ahead" (positive dot with flee dir).
        const ahead = (tox * dx + toy * dy) / td;
        if (ahead <= 0) continue;
        // Sign of cross-product tells us which side the cloud is on, deflect
        // to the *opposite* side.
        const cross = tox * dy - toy * dx;
        const perpX = cross > 0 ? -dy :  dy;
        const perpY = cross > 0 ?  dx : -dx;
        const strength = (safe - td) / safe;     // 0 at edge of cushion, 1 at center
        dx += perpX * strength * 1.6;
        dy += perpY * strength * 1.6;
      }
      const ll = Math.hypot(dx, dy);
      if (ll > 0) { dx /= ll; dy /= ll; }
    } else {
      // Walk to nearest unfixed lever and start auto-repairing.
      let target = null, targetD = Infinity;
      for (const l of game.levers) {
        if (l.fixed) continue;
        const d = Math.hypot(tm.x - l.x, tm.y - l.y);
        if (d < targetD) { target = l; targetD = d; }
      }
      if (target) {
        if (targetD > PLAY.teammate.fixRadius) {
          tm.state = 'walkToLever';
          tm.fixingLever = null;
          dx = (target.x - tm.x) / targetD;
          dy = (target.y - tm.y) / targetD;
        } else {
          tm.state = 'fixLever';
          tm.fixingLever = target;
          const tch = CHARACTERS[tm.key];
          const rate = PLAY.teammate.leverProgressBase * tch.stats.lever;
          target.progress = Math.min(PLAY.lever.hitsToFix, target.progress + rate * dt);
          if (target.progress >= PLAY.lever.hitsToFix) {
            target.fixed = true;
            tm.fixingLever = null;
            maybeSpawnPortal();
          }
        }
      } else if (game.portal) {
        // All levers fixed — head for the portal.
        const pdx = game.portal.x - tm.x;
        const pdy = game.portal.y - tm.y;
        const pd = Math.hypot(pdx, pdy);
        tm.state = 'idle';
        if (pd > 50) { dx = pdx / pd; dy = pdy / pd; }
      }
    }

    if (dx !== 0 || dy !== 0) {
      tm.x += dx * tm.speed * dt;
      tm.y += dy * tm.speed * dt;
      tm.walkPhase += dt;
      tm.moving = true;
    } else {
      tm.moving = false;
    }

    pushOutOfTrees(tm);
    tm.x = clamp(tm.x, PLAY.edgePad, game.world.w - PLAY.edgePad);
    tm.y = clamp(tm.y, PLAY.edgePad, game.world.h - PLAY.edgePad);
  }

  // Pick the single closest downed teammate as the active revive target while E is held.
  if (keysHeld.has('KeyE')) {
    let best = null, bestD = PLAY.teammate.reviveRadius;
    for (const tm of game.teammates) {
      if (tm.hearts > 0) continue;
      const d = Math.hypot(p.x - tm.x, p.y - tm.y);
      if (d < bestD) { best = tm; bestD = d; }
    }
    game.reviveTarget = best;
  } else {
    game.reviveTarget = null;
  }
}

/* ---- Abilities ---- */

// Compute the current green-zone width for the player's skill check.
// Violet's "Steady Hands" passive widens it when a bully is in range.
function currentGreenWidth() {
  const ch = CHARACTERS[game.selected];
  let w = PLAY.lever.baseGreenWidth + PLAY.lever.greenPerStat * ch.stats.skill;
  if (game.selected === 'violet') {
    const range = PLAY.abilities.steadyHands.range;
    for (const b of game.bullies) {
      if (Math.hypot(game.player.x - b.x, game.player.y - b.y) <= range) {
        w += PLAY.abilities.steadyHands.greenWidthAdd;
        break;
      }
    }
  }
  return Math.min(0.6, w);    // sanity cap
}

// Skill 1 (F) — every character has an active here.
function fireSkill1() {
  if (game.player.hearts <= 0 || game.deathT > 0 || game.victoryT > 0) return;
  const sel = game.selected;

  if (sel === 'violet') {
    if (game.cooldowns.trap > 0) return;
    game.traps.push({
      x: game.player.x,
      y: game.player.y,
      triggered: false,
      triggeredT: 0,
      seed: 8500 + Math.floor(Math.random() * 1000),
    });
    game.cooldowns.trap = PLAY.abilities.trap.cooldown;
    return;
  }

  if (sel === 'vada') {
    if (game.cooldowns.stun > 0) return;
    // Auto-target: nearest bully within range.
    let target = null, bestD = PLAY.abilities.stun.range;
    for (const b of game.bullies) {
      const d = Math.hypot(game.player.x - b.x, game.player.y - b.y);
      if (d < bestD) { bestD = d; target = b; }
    }
    if (!target) return;       // missed swing — no cooldown burned
    target.stunT = PLAY.abilities.stun.duration;
    target.hitFlashT = 0.5;
    target.hitCooldown = Math.max(target.hitCooldown, 1.0);
    game.cooldowns.stun = PLAY.abilities.stun.cooldown;
    return;
  }

  if (sel === 'ada') {
    if (game.cooldowns.scream > 0) return;
    const range = PLAY.abilities.scream.range;
    const dur = PLAY.abilities.scream.duration;
    let any = false;
    for (const b of game.bullies) {
      if (Math.hypot(game.player.x - b.x, game.player.y - b.y) <= range) {
        b.confusedT = dur;
        b.slowT = Math.max(b.slowT, dur);
        b.target = null;
        b.wanderTimer = 0;
        any = true;
      }
    }
    if (any) game.cooldowns.scream = PLAY.abilities.scream.cooldown;
  }
}

// Skill 2 (D) — only Ada has an active here. Vada/Violet's Skill 2 is passive.
function fireSkill2() {
  if (game.player.hearts <= 0 || game.deathT > 0 || game.victoryT > 0) return;
  if (game.selected !== 'ada') return;
  if (game.cooldowns.burger > 0) return;
  for (let i = 0; i < PLAY.abilities.burger.count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 30 + Math.random() * (PLAY.abilities.burger.scatterRadius - 30);
    game.burgers.push({
      x: clamp(game.player.x + Math.cos(angle) * r, 40, game.world.w - 40),
      y: clamp(game.player.y + Math.sin(angle) * r, 40, game.world.h - 40),
      seed: 8700 + Math.floor(Math.random() * 1000),
    });
  }
  game.cooldowns.burger = PLAY.abilities.burger.cooldown;
}

function updatePlay(dt) {
  const p = game.player;
  const w = game.world;

  // Tick player iframes / hit flash regardless of state
  if (p.iframes > 0) p.iframes -= dt;
  if (p.hitFlashT > 0) p.hitFlashT -= dt;

  // Death freeze: brief pause after the player dies before the game-over screen.
  if (game.deathT > 0) {
    game.deathT -= dt;
    if (game.deathT <= 0) {
      game.scene = 'gameOver';
      keysHeld.clear();
    }
    return;   // skip the rest of the simulation while dying
  }

  // Smoke contact: refresh slow timer to its full linger value while inside,
  // and let it decay naturally for `lingerTime` seconds after stepping out.
  let touchingSmoke = false;
  const maxAge = BULLIES.bob.smokeMaxAge;
  for (const s of game.smokeParticles) {
    const lifeT = s.age / maxAge;
    if (lifeT > PLAY.fart.maxLifeFrac) continue;     // skip faded ghosts
    const cy = s.y - lifeT * 14;                     // matches drawSmokeLayer's drift
    const r  = s.size * (1 + lifeT * 0.7);
    if (Math.hypot(p.x - s.x, p.y - cy) < r) { touchingSmoke = true; break; }
  }
  if (touchingSmoke) {
    if (p.fartSlowT < PLAY.fart.lingerTime) p.fartSlowT = PLAY.fart.lingerTime;
  } else if (p.fartSlowT > 0) {
    p.fartSlowT = Math.max(0, p.fartSlowT - dt);
  }

  // Read arrow keys — but not while dead, dragged, or in death freeze.
  let dx = 0, dy = 0;
  if (p.hearts > 0 && !p.beingDragged) {
    if (keysHeld.has('ArrowUp'))    dy -= 1;
    if (keysHeld.has('ArrowDown'))  dy += 1;
    if (keysHeld.has('ArrowLeft'))  dx -= 1;
    if (keysHeld.has('ArrowRight')) dx += 1;
  }

  if (dx !== 0 || dy !== 0) {
    const len = Math.hypot(dx, dy);
    dx /= len; dy /= len;
    const fartMul = p.fartSlowT > 0 ? PLAY.fart.slowMul : 1;
    p.x += dx * p.speed * fartMul * dt;
    p.y += dy * p.speed * fartMul * dt;
    p.moving = true;
    p.walkPhase += dt;
  } else {
    p.moving = false;
  }

  pushOutOfTrees(p);

  // World edge clamp
  p.x = clamp(p.x, PLAY.edgePad, w.w - PLAY.edgePad);
  p.y = clamp(p.y, PLAY.edgePad, w.h - PLAY.edgePad);

  // AI updates
  updateTeammates(dt);
  updateBullies(dt);

  updateCamera();
  if (game.introT > 0) game.introT -= dt;

  // ----- Cooldown timers -----
  for (const k in game.cooldowns) {
    if (game.cooldowns[k] > 0) game.cooldowns[k] -= dt;
  }

  // ----- Trap lifetime (remove triggered traps after a brief lingering effect) -----
  for (let i = game.traps.length - 1; i >= 0; i--) {
    const tr = game.traps[i];
    if (tr.triggered) {
      tr.triggeredT += dt;
      if (tr.triggeredT > PLAY.abilities.trap.lingerAfter) game.traps.splice(i, 1);
    }
  }

  // ----- Burger pickups (player or alive teammates can grab them) -----
  if (game.burgers.length) {
    const heal = PLAY.abilities.burger.healAmount;
    const r = PLAY.abilities.burger.pickupRadius;
    for (let i = game.burgers.length - 1; i >= 0; i--) {
      const bg = game.burgers[i];
      // Player first
      if (p.hearts > 0 && p.hearts < p.maxHearts &&
          Math.hypot(p.x - bg.x, p.y - bg.y) < r) {
        p.hearts = Math.min(p.maxHearts, p.hearts + heal);
        game.burgers.splice(i, 1);
        continue;
      }
      // Then any teammate that needs it
      let eaten = false;
      for (const tm of game.teammates) {
        if (tm.hearts <= 0 || tm.hearts >= tm.maxHearts) continue;
        if (Math.hypot(tm.x - bg.x, tm.y - bg.y) < r) {
          tm.hearts = Math.min(tm.maxHearts, tm.hearts + heal);
          eaten = true;
          break;
        }
      }
      if (eaten) game.burgers.splice(i, 1);
    }
  }

  // ----- Skill-check tick -----
  if (game.skillCheck) {
    const sc = game.skillCheck;
    const lever = game.levers[sc.leverIndex];
    // Cancel if the player walked away from the lever
    if (!lever || lever.fixed ||
        Math.hypot(p.x - lever.x, p.y - lever.y) > PLAY.lever.cancelRadius) {
      game.skillCheck = null;
    } else {
      // Live-update green-zone width so Violet's Steady Hands kicks in
      // the moment a bully shows up nearby.
      sc.greenW = currentGreenWidth();
      const margin = sc.greenW / 2;
      sc.greenCenter = clamp(sc.greenCenter, margin, 1 - margin);
      sc.pos += sc.dir * sc.speed * dt;
      if (sc.pos > 1) { sc.pos = 1; sc.dir = -1; }
      if (sc.pos < 0) { sc.pos = 0; sc.dir = 1; }
      if (sc.flashT > 0) sc.flashT -= dt;
    }
  }

  // ----- Portal touch -----
  if (game.portal && game.victoryT <= 0) {
    const dist = Math.hypot(p.x - game.portal.x, p.y - game.portal.y);
    if (dist < PLAY.portal.radius + p.radius) {
      game.victoryT = PLAY.victoryDuration;
    }
  }

  // ----- Victory countdown — advance to the next biome when it ends -----
  if (game.victoryT > 0) {
    game.victoryT -= dt;
    if (game.victoryT <= 0) advanceBiome();
  }
}

function advanceBiome() {
  const idx = BIOME_ORDER.indexOf(game.biome);
  const nextKey = BIOME_ORDER[idx + 1];
  if (nextKey && BIOMES[nextKey]) {
    initBiome(nextKey);   // implemented biome — keep playing
  } else if (nextKey) {
    // Biome exists in the order but isn't built yet — show placeholder.
    game.placeholderBiome = nextKey;
    game.scene = 'placeholder';
    keysHeld.clear();
  } else {
    // No more biomes (game complete in v1)
    game.scene = 'select';
    keysHeld.clear();
  }
}

/* ---- Drawing pieces for the world ---- */

function drawGround() {
  const w = game.world;
  const b = w.def;
  ctx.fillStyle = b.groundBase;
  ctx.fillRect(0, 0, w.w, w.h);

  // Optional backdrop silhouette (e.g. desert mesas at the north edge)
  if (b.hasMesa) drawMesaBackdrop();

  // Per-biome surface decoration drawn only in the visible region (perf).
  const cam = game.camera;
  const cell = 56;
  const sx = Math.max(0, Math.floor(cam.x / cell) - 1) * cell;
  const sy = Math.max(0, Math.floor(cam.y / cell) - 1) * cell;
  const ex = Math.min(w.w, cam.x + CONFIG.view.w + cell);
  const ey = Math.min(w.h, cam.y + CONFIG.view.h + cell);

  if (b.decorType === 'sand') {
    // Tiny dots — sand specks instead of grass blades.
    for (let gx = sx; gx < ex; gx += cell) {
      for (let gy = sy; gy < ey; gy += cell) {
        const seed = (gx * 13 + gy * 7) | 0;
        const tx = gx + cell / 2 + jitter(seed) * 22;
        const ty = gy + cell / 2 + jitter(seed + 1) * 22;
        // 3 small dots per cell
        ctx.fillStyle = jitter(seed + 2) > 0 ? b.groundFleck : b.groundDark;
        ctx.beginPath(); ctx.arc(tx - 4, ty,     1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(tx + 1, ty - 3, 1.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(tx + 5, ty + 2, 1.5, 0, Math.PI * 2); ctx.fill();
      }
    }
    // A few longer drifting wind-streaks for desert texture
    for (let gx = sx; gx < ex; gx += cell * 2) {
      for (let gy = sy; gy < ey; gy += cell * 2) {
        const seed = (gx * 31 + gy * 17) | 0;
        const tx = gx + jitter(seed) * 30;
        const ty = gy + jitter(seed + 1) * 30;
        ctx.strokeStyle = b.groundDark;
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(tx - 14, ty);
        ctx.bezierCurveTo(tx - 6, ty - 2, tx + 6, ty + 2, tx + 14, ty);
        ctx.stroke();
      }
    }
    return;
  }

  // Default: grass-blade decoration (grassland)
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (let gx = sx; gx < ex; gx += cell) {
    for (let gy = sy; gy < ey; gy += cell) {
      const seed = (gx * 13 + gy * 7) | 0;
      const tx = gx + cell / 2 + jitter(seed) * 22;
      const ty = gy + cell / 2 + jitter(seed + 1) * 22;
      ctx.strokeStyle = jitter(seed + 2) > 0 ? b.groundFleck : b.groundDark;
      ctx.beginPath();
      ctx.moveTo(tx - 4, ty); ctx.lineTo(tx - 4, ty - 6);
      ctx.moveTo(tx,     ty); ctx.lineTo(tx,     ty - 8);
      ctx.moveTo(tx + 4, ty); ctx.lineTo(tx + 4, ty - 5);
      ctx.stroke();
    }
  }
}

// Distant mesa silhouettes at the north edge of the world. Drawn after the
// ground fill but before any obstacles/entities so it reads as a backdrop.
function drawMesaBackdrop() {
  const w = game.world.w;
  // Layer 1: faded distant mesas
  ctx.save();
  ctx.fillStyle = 'rgba(180, 140, 110, 0.55)';
  ctx.strokeStyle = 'rgba(110, 80, 60, 0.55)';
  ctx.lineWidth = 2;
  const drawMesa = (cx, w0, h0, seed) => {
    const left = cx - w0 / 2;
    const right = cx + w0 / 2;
    const top = 60 + jitter(seed) * 4;
    const stepLeft = left + w0 * 0.18 + jitter(seed + 1) * 6;
    const stepRight = right - w0 * 0.16 + jitter(seed + 2) * 6;
    ctx.beginPath();
    ctx.moveTo(left, 200);
    ctx.lineTo(left,  90);
    ctx.lineTo(stepLeft, 60 + h0 * 0.2);
    ctx.lineTo(stepLeft, top);
    ctx.lineTo(stepRight, top);
    ctx.lineTo(stepRight, 60 + h0 * 0.18);
    ctx.lineTo(right, 90);
    ctx.lineTo(right, 200);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };
  drawMesa(w * 0.18, 320, 80, 200);
  drawMesa(w * 0.45, 420, 110, 210);
  drawMesa(w * 0.78, 360, 90, 220);
  ctx.restore();

  // Layer 2: closer, warmer mesas with thicker outline
  ctx.save();
  ctx.fillStyle = '#c98a5a';
  ctx.strokeStyle = '#7a4a2a';
  ctx.lineWidth = 3;
  const closeMesa = (cx, w0, h0, seed) => {
    const left = cx - w0 / 2;
    const right = cx + w0 / 2;
    const top = 130 + jitter(seed) * 5;
    ctx.beginPath();
    ctx.moveTo(left, 240);
    ctx.lineTo(left + 8, 170);
    ctx.lineTo(left + 28 + jitter(seed + 1) * 4, top);
    ctx.lineTo(right - 28 + jitter(seed + 2) * 4, top);
    ctx.lineTo(right - 8, 170);
    ctx.lineTo(right, 240);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };
  closeMesa(w * 0.32, 280, 100, 300);
  closeMesa(w * 0.66, 320, 110, 310);
  ctx.restore();
}

function drawFlower(f) {
  const cam = game.camera;
  if (f.x < cam.x - 30 || f.x > cam.x + CONFIG.view.w + 30 ||
      f.y < cam.y - 30 || f.y > cam.y + CONFIG.view.h + 30) return;
  ctx.fillStyle = f.color;
  ctx.beginPath(); ctx.arc(f.x - f.size, f.y, f.size * 0.7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(f.x + f.size, f.y, f.size * 0.7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(f.x, f.y - f.size, f.size * 0.7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(f.x, f.y + f.size, f.size * 0.7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffd24c';
  ctx.beginPath(); ctx.arc(f.x, f.y, f.size * 0.55, 0, Math.PI * 2); ctx.fill();
}

// Single entry point — dispatches per obstacle type so the rest of the engine
// (y-sort, etc.) doesn't have to care.
function drawTree(t) {
  if (t.type === 'cactus') return drawCactus(t);
  if (t.type === 'rock')   return drawRock(t);
  // Default: leafy tree
  // Soft elliptical shadow
  ctx.beginPath();
  ctx.ellipse(t.x + 6, t.y + 8, t.canopyR * 1.05, t.canopyR * 0.45, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fill();
  // Trunk (its base sits at t.y so y-sort against player.y works correctly)
  wobblyRect(t.x - 8, t.y - 24, 16, 26, {
    fill: '#7a5034', stroke: CONFIG.colors.ink, width: 2.5, radius: 4, seed: t.seed,
  });
  // Leafy canopy: three overlapping wobbly circles
  wobblyCircle(t.x - 10, t.y - 36, t.canopyR * 0.55, {
    fill: '#5e9e4a', stroke: CONFIG.colors.ink, width: 3, seed: t.seed + 1, jitterAmt: 2.5,
  });
  wobblyCircle(t.x + 10, t.y - 40, t.canopyR * 0.62, {
    fill: '#6cb656', stroke: CONFIG.colors.ink, width: 3, seed: t.seed + 2, jitterAmt: 2.5,
  });
  wobblyCircle(t.x, t.y - 52, t.canopyR * 0.5, {
    fill: '#5e9e4a', stroke: CONFIG.colors.ink, width: 3, seed: t.seed + 3, jitterAmt: 2.5,
  });
  // A couple of darker leaf clumps for texture
  wobblyCircle(t.x - 4, t.y - 38, t.canopyR * 0.18, {
    fill: '#447a36', stroke: null, seed: t.seed + 4, jitterAmt: 1.2,
  });
  wobblyCircle(t.x + 14, t.y - 44, t.canopyR * 0.16, {
    fill: '#447a36', stroke: null, seed: t.seed + 5, jitterAmt: 1.2,
  });
}

// Saguaro-style cactus — vertical column with a couple of upturned arms.
function drawCactus(t) {
  // Shadow
  ctx.beginPath();
  ctx.ellipse(t.x + 4, t.y + 8, t.canopyR * 0.85, t.canopyR * 0.35, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fill();
  // Main column
  const colH = t.canopyR * 1.9;
  wobblyRect(t.x - 12, t.y - colH, 24, colH, {
    fill: '#5e9a52', stroke: CONFIG.colors.ink, width: 3, radius: 12, seed: t.seed,
  });
  // Left arm (lower)
  wobblyRect(t.x - 30, t.y - colH * 0.62, 14, 22, {
    fill: '#5e9a52', stroke: CONFIG.colors.ink, width: 2.5, radius: 7, seed: t.seed + 1,
  });
  wobblyRect(t.x - 30, t.y - colH * 0.78, 14, 18, {
    fill: '#5e9a52', stroke: CONFIG.colors.ink, width: 2.5, radius: 7, seed: t.seed + 2,
  });
  // Right arm (higher)
  wobblyRect(t.x + 16, t.y - colH * 0.5, 14, 24, {
    fill: '#5e9a52', stroke: CONFIG.colors.ink, width: 2.5, radius: 7, seed: t.seed + 3,
  });
  wobblyRect(t.x + 16, t.y - colH * 0.7, 14, 22, {
    fill: '#5e9a52', stroke: CONFIG.colors.ink, width: 2.5, radius: 7, seed: t.seed + 4,
  });
  // Vertical ridge lines for texture
  ctx.strokeStyle = '#3f7036';
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const x = t.x - 6 + i * 6;
    ctx.beginPath();
    ctx.moveTo(x, t.y - colH + 6);
    ctx.lineTo(x, t.y - 4);
    ctx.stroke();
  }
  // Tiny pink bloom on top sometimes (deterministic from seed)
  if ((t.seed % 3) === 0) {
    wobblyCircle(t.x, t.y - colH - 4, 6, {
      fill: '#f29ab2', stroke: CONFIG.colors.ink, width: 2, seed: t.seed + 9,
    });
  }
}

// Lumpy desert rock with a small darker stripe.
function drawRock(t) {
  // Shadow
  ctx.beginPath();
  ctx.ellipse(t.x + 3, t.y + 6, t.canopyR * 0.9, t.canopyR * 0.35, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fill();
  // Main lump (base touches t.y so y-sort matches the visual base)
  const r = t.canopyR;
  wobblyCircle(t.x, t.y - r * 0.55, r * 0.95, {
    fill: '#bd9a72',
    stroke: CONFIG.colors.ink,
    width: 3,
    seed: t.seed,
    jitterAmt: 2.4,
    squashY: 0.85,
  });
  // Smaller lump beside it
  wobblyCircle(t.x + r * 0.55, t.y - r * 0.35, r * 0.45, {
    fill: '#a8865e',
    stroke: CONFIG.colors.ink,
    width: 2.5,
    seed: t.seed + 1,
    jitterAmt: 1.4,
    squashY: 0.85,
  });
  // Crack line
  ctx.strokeStyle = '#7a5a3a';
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(t.x - r * 0.45, t.y - r * 0.6);
  ctx.lineTo(t.x - r * 0.1, t.y - r * 0.4);
  ctx.lineTo(t.x + r * 0.15, t.y - r * 0.55);
  ctx.stroke();
}

function drawPlayer() {
  const p = game.player;
  // Iframe flicker — make the sprite blink while invincible.
  if (p.iframes > 0) {
    const blink = Math.floor(p.iframes * 12) % 2 === 0;
    if (!blink) return;
  }
  const bob = p.moving ? Math.sin(p.walkPhase * PLAY.walkBobFreq) * PLAY.walkBobAmp : 0;
  drawCharacterPortrait(ctx, game.selected, p.x, p.y + bob, PLAY.playerScale, { frown: p.fartSlowT > 0 });
  // Red impact flash as a tinted disc on top, fades quickly.
  if (p.hitFlashT > 0) {
    ctx.save();
    ctx.globalAlpha = p.hitFlashT / 0.35;
    ctx.fillStyle = 'rgba(214, 64, 60, 0.45)';
    ctx.beginPath(); ctx.ellipse(p.x, p.y - 50, 40, 60, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

function drawTeammate(tm) {
  // Downed pose: rotated sideways, semi-transparent.
  if (tm.hearts <= 0) {
    ctx.save();
    ctx.translate(tm.x, tm.y);
    ctx.rotate(-Math.PI / 2);
    ctx.globalAlpha = 0.7;
    drawCharacterPortrait(ctx, tm.key, 0, 0, PLAY.playerScale);
    ctx.restore();
    // "X X" eyes effect — dimming overlay on the head area
    ctx.save();
    ctx.fillStyle = 'rgba(31, 26, 23, 0.18)';
    ctx.beginPath(); ctx.ellipse(tm.x, tm.y - 18, 60, 24, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // Revive progress bar above the body
    if (tm.reviveT > 0) {
      const w = 80, h = 8;
      const x = tm.x - w / 2;
      const y = tm.y - 64;
      wobblyRect(x, y, w, h, {
        fill: '#fffaeb', stroke: CONFIG.colors.ink, width: 2, radius: 3,
        seed: 7700 + tm.key.charCodeAt(0), jitterAmt: 0.4,
      });
      const pct = tm.reviveT / PLAY.teammate.reviveTime;
      ctx.fillStyle = '#7bc05a';
      ctx.fillRect(x + 1, y + 1, (w - 2) * pct, h - 2);
    }
    // "press SPACE" hint when player is in range and revive isn't ticking
    if (game.reviveTarget === tm) return;
    if (Math.hypot(game.player.x - tm.x, game.player.y - tm.y) < PLAY.teammate.reviveRadius) {
      const cy = tm.y - 80 + Math.sin(game.time * 4) * 2;
      wobblyRect(tm.x - 78, cy - 14, 156, 28, {
        fill: CONFIG.colors.cardBg, stroke: CONFIG.colors.ink, width: 2.5, radius: 6,
        seed: 7800 + tm.key.charCodeAt(0),
      });
      ctx.fillStyle = CONFIG.colors.ink;
      ctx.font = '700 14px "Patrick Hand", cursive';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('hold E to revive', tm.x, cy);
    }
    return;
  }

  // Iframe flicker
  if (tm.iframes > 0) {
    const blink = Math.floor(tm.iframes * 12) % 2 === 0;
    if (!blink) return;
  }
  const bob = tm.moving ? Math.sin(tm.walkPhase * PLAY.walkBobFreq) * PLAY.walkBobAmp : 0;
  drawCharacterPortrait(ctx, tm.key, tm.x, tm.y + bob, PLAY.playerScale);

  // Tiny "fixing" wrench bob over their head when repairing a lever
  if (tm.state === 'fixLever') {
    ctx.save();
    ctx.fillStyle = CONFIG.colors.yellow;
    ctx.strokeStyle = CONFIG.colors.ink;
    ctx.lineWidth = 2;
    const wy = tm.y - 96 + Math.sin(game.time * 6) * 2;
    ctx.beginPath(); ctx.arc(tm.x, wy, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = CONFIG.colors.ink;
    ctx.font = '700 12px "Permanent Marker", cursive';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('!', tm.x, wy + 1);
    ctx.restore();
  }
  if (tm.hitFlashT > 0) {
    ctx.save();
    ctx.globalAlpha = tm.hitFlashT / 0.35;
    ctx.fillStyle = 'rgba(214, 64, 60, 0.45)';
    ctx.beginPath(); ctx.ellipse(tm.x, tm.y - 50, 40, 60, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

function drawBob(b) {
  const def = BULLIES[b.key];
  // Walk bob
  const bob = b.moving ? Math.sin(b.walkPhase * 10) * 1.6 : 0;
  const cx = b.x;
  const cy = b.y + bob;

  // Shadow
  ctx.beginPath();
  ctx.ellipse(cx + 4, b.y + 8, 50, 14, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fill();

  // Stubby legs (very short for a chubby body)
  wobblyRect(cx - 22, cy - 30, 18, 30, { fill: def.pants, stroke: CONFIG.colors.ink, width: 3, radius: 6, seed: 6000 });
  wobblyRect(cx + 4,  cy - 30, 18, 30, { fill: def.pants, stroke: CONFIG.colors.ink, width: 3, radius: 6, seed: 6001 });
  // Shoes
  wobblyRect(cx - 26, cy - 4, 22, 12, { fill: def.shoes, stroke: CONFIG.colors.ink, width: 3, radius: 5, seed: 6002 });
  wobblyRect(cx + 4,  cy - 4, 22, 12, { fill: def.shoes, stroke: CONFIG.colors.ink, width: 3, radius: 5, seed: 6003 });

  // Big round belly (the silhouette that says "Bob")
  wobblyCircle(cx, cy - 70, 40, { fill: def.shirt, stroke: CONFIG.colors.ink, width: 4, seed: 6010, jitterAmt: 1.6 });
  // Shirt stripe
  wobblyRect(cx - 36, cy - 80, 72, 14, { fill: def.shirtTrim, stroke: null, radius: 6, seed: 6011 });

  // Stubby arms
  wobblyRect(cx - 52, cy - 80, 16, 32, { fill: def.shirt, stroke: CONFIG.colors.ink, width: 3, radius: 6, seed: 6012, rotate: -0.18 });
  wobblyRect(cx + 36, cy - 80, 16, 32, { fill: def.shirt, stroke: CONFIG.colors.ink, width: 3, radius: 6, seed: 6013, rotate:  0.18 });
  // Hands
  wobblyCircle(cx - 50, cy - 50, 9, { fill: def.skin, stroke: CONFIG.colors.ink, width: 2.5, seed: 6014 });
  wobblyCircle(cx + 50, cy - 50, 9, { fill: def.skin, stroke: CONFIG.colors.ink, width: 2.5, seed: 6015 });

  // Head
  wobblyCircle(cx, cy - 122, 30, { fill: def.skin, stroke: CONFIG.colors.ink, width: 3.5, seed: 6020 });

  // Angry brows
  ctx.strokeStyle = CONFIG.colors.ink;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 14, cy - 132); ctx.lineTo(cx - 4, cy - 126);
  ctx.moveTo(cx + 14, cy - 132); ctx.lineTo(cx + 4, cy - 126);
  ctx.stroke();
  // Beady eyes
  wobblyCircle(cx - 8, cy - 121, 3, { fill: CONFIG.colors.ink, stroke: null, seed: 6030 });
  wobblyCircle(cx + 8, cy - 121, 3, { fill: CONFIG.colors.ink, stroke: null, seed: 6031 });
  // Frown
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy - 105);
  ctx.quadraticCurveTo(cx, cy - 113, cx + 8, cy - 105);
  ctx.stroke();

  // Slowed indicator (purple wash from a trap or scream)
  if (b.slowT > 0) {
    ctx.save();
    ctx.fillStyle = 'rgba(120, 100, 200, 0.45)';
    ctx.beginPath();
    ctx.arc(cx, cy - 30, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Hit flash (Vada's stun lands a punch)
  if (b.hitFlashT > 0) {
    ctx.save();
    ctx.globalAlpha = b.hitFlashT / 0.5;
    ctx.fillStyle = 'rgba(245, 200, 66, 0.65)';
    ctx.beginPath(); ctx.arc(cx, cy - 50, 50, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // Stunned: yellow stars circling the head, can't move
  if (b.stunT > 0) {
    ctx.save();
    for (let i = 0; i < 3; i++) {
      const a = game.time * 4 + (i * Math.PI * 2 / 3);
      const sx = cx + Math.cos(a) * 22;
      const sy = cy - 150 + Math.sin(a) * 8;
      drawStar(sx, sy, 7, '#f5c842');
    }
    ctx.restore();
  } else if (b.confusedT > 0) {
    // Confused: bobbing question marks
    const qY = cy - 156 + Math.sin(game.time * 5) * 3;
    ctx.fillStyle = '#8e5fb8';
    ctx.strokeStyle = CONFIG.colors.ink;
    ctx.lineWidth = 2;
    ctx.font = '900 30px "Permanent Marker", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', cx - 12, qY);
    ctx.strokeText('?', cx - 12, qY);
    ctx.fillText('?', cx + 14, qY + 4);
    ctx.strokeText('?', cx + 14, qY + 4);
  } else if (b.state === 'chase') {
    // "!" alert above head when chasing
    const alertY = cy - 168 + Math.sin(game.time * 8) * 2;
    ctx.fillStyle = CONFIG.colors.red;
    ctx.strokeStyle = CONFIG.colors.ink;
    ctx.lineWidth = 2;
    ctx.font = '900 36px "Permanent Marker", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', cx, alertY);
    ctx.strokeText('!', cx, alertY);
  }
}

// Tiny 5-point star, used for the stun overlay.
function drawStar(cx, cy, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = CONFIG.colors.ink;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.45;
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// Burt: tall, thin, gangly. Long stretchy arm during drags + when poking from afar.
function drawBurt(b) {
  const def = BULLIES.burt;
  const bob = b.moving ? Math.sin(b.walkPhase * 8) * 1.4 : 0;
  const cx = b.x;
  const cy = b.y + bob;

  // Shadow
  ctx.beginPath();
  ctx.ellipse(cx + 3, b.y + 8, 28, 9, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fill();

  // Long thin legs
  wobblyRect(cx - 14, cy - 64, 12, 64, { fill: def.pants, stroke: CONFIG.colors.ink, width: 3, radius: 5, seed: 7100 });
  wobblyRect(cx + 2,  cy - 64, 12, 64, { fill: def.pants, stroke: CONFIG.colors.ink, width: 3, radius: 5, seed: 7101 });
  // Pointy shoes
  wobblyRect(cx - 18, cy - 4, 18, 12, { fill: def.shoes, stroke: CONFIG.colors.ink, width: 3, radius: 4, seed: 7102 });
  wobblyRect(cx,      cy - 4, 18, 12, { fill: def.shoes, stroke: CONFIG.colors.ink, width: 3, radius: 4, seed: 7103 });

  // Tall thin torso
  wobblyRect(cx - 22, cy - 134, 44, 70, { fill: def.shirt, stroke: CONFIG.colors.ink, width: 3.5, radius: 8, seed: 7110 });
  // Collar stripe
  wobblyRect(cx - 22, cy - 134, 44, 12, { fill: def.shirtTrim, stroke: null, radius: 6, seed: 7111 });

  // Arms — stretchy hand reaches the drag target if reeling someone in
  if (b.dragT > 0 && b.dragTarget) {
    const t = b.dragTarget;
    const tx = t.x;
    const ty = t.y - 50;
    const sx = cx + 16;            // shoulder
    const sy = cy - 124;
    // Outer dark line for the marker outline
    ctx.save();
    ctx.strokeStyle = CONFIG.colors.ink;
    ctx.lineWidth = 11;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(tx, ty); ctx.stroke();
    // Purple sleeve fill on top
    ctx.strokeStyle = def.shirt;
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(tx, ty); ctx.stroke();
    ctx.restore();
    // Hand grabbing the target
    wobblyCircle(tx, ty, 10, { fill: def.skin, stroke: CONFIG.colors.ink, width: 2.5, seed: 7140 });
    // Idle other arm at side
    wobblyRect(cx - 38, cy - 130, 14, 70, { fill: def.shirt, stroke: CONFIG.colors.ink, width: 3, radius: 6, seed: 7112, rotate: -0.06 });
    wobblyCircle(cx - 35, cy - 60, 9, { fill: def.skin, stroke: CONFIG.colors.ink, width: 2.5, seed: 7114 });
  } else {
    // Both arms hanging long
    wobblyRect(cx - 38, cy - 130, 14, 78, { fill: def.shirt, stroke: CONFIG.colors.ink, width: 3, radius: 6, seed: 7112, rotate: -0.07 });
    wobblyRect(cx + 24, cy - 130, 14, 78, { fill: def.shirt, stroke: CONFIG.colors.ink, width: 3, radius: 6, seed: 7113, rotate:  0.07 });
    wobblyCircle(cx - 35, cy - 56, 9, { fill: def.skin, stroke: CONFIG.colors.ink, width: 2.5, seed: 7114 });
    wobblyCircle(cx + 35, cy - 56, 9, { fill: def.skin, stroke: CONFIG.colors.ink, width: 2.5, seed: 7115 });
  }

  // Long thin neck
  wobblyRect(cx - 7, cy - 152, 14, 22, { fill: def.skin, stroke: CONFIG.colors.ink, width: 2.5, radius: 4, seed: 7120 });

  // Smaller, narrow head
  wobblyCircle(cx, cy - 168, 22, { fill: def.skin, stroke: CONFIG.colors.ink, width: 3, seed: 7130, squashY: 1.05 });

  // Mean angled brows
  ctx.strokeStyle = CONFIG.colors.ink;
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 12, cy - 178); ctx.lineTo(cx - 4, cy - 173);
  ctx.moveTo(cx + 12, cy - 178); ctx.lineTo(cx + 4, cy - 173);
  ctx.stroke();
  // Slit eyes
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy - 170); ctx.lineTo(cx - 4, cy - 169);
  ctx.moveTo(cx + 10, cy - 170); ctx.lineTo(cx + 4, cy - 169);
  ctx.stroke();
  // Frown
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx - 6, cy - 156);
  ctx.quadraticCurveTo(cx, cy - 161, cx + 6, cy - 156);
  ctx.stroke();

  // Slowed indicator (purple wash)
  if (b.slowT > 0) {
    ctx.save();
    ctx.fillStyle = 'rgba(120, 100, 200, 0.45)';
    ctx.beginPath(); ctx.arc(cx, cy - 60, 50, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  if (b.hitFlashT > 0) {
    ctx.save();
    ctx.globalAlpha = b.hitFlashT / 0.5;
    ctx.fillStyle = 'rgba(245, 200, 66, 0.65)';
    ctx.beginPath(); ctx.arc(cx, cy - 80, 50, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // Status badges above head
  if (b.stunT > 0) {
    for (let i = 0; i < 3; i++) {
      const a = game.time * 4 + (i * Math.PI * 2 / 3);
      drawStar(cx + Math.cos(a) * 22, cy - 200 + Math.sin(a) * 8, 7, '#f5c842');
    }
  } else if (b.confusedT > 0) {
    const qY = cy - 206 + Math.sin(game.time * 5) * 3;
    ctx.fillStyle = '#8e5fb8';
    ctx.strokeStyle = CONFIG.colors.ink;
    ctx.lineWidth = 2;
    ctx.font = '900 30px "Permanent Marker", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', cx - 12, qY);  ctx.strokeText('?', cx - 12, qY);
    ctx.fillText('?', cx + 14, qY);  ctx.strokeText('?', cx + 14, qY);
  } else if (b.dragT > 0) {
    // Show "GRAB!" while reeling
    const gy = cy - 198 + Math.sin(game.time * 10) * 2;
    ctx.fillStyle = CONFIG.colors.red;
    ctx.strokeStyle = CONFIG.colors.ink;
    ctx.lineWidth = 2;
    ctx.font = '900 28px "Permanent Marker", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GRAB!', cx, gy);
    ctx.strokeText('GRAB!', cx, gy);
  } else if (b.state === 'chase') {
    const alertY = cy - 204 + Math.sin(game.time * 8) * 2;
    ctx.fillStyle = CONFIG.colors.red;
    ctx.strokeStyle = CONFIG.colors.ink;
    ctx.lineWidth = 2;
    ctx.font = '900 36px "Permanent Marker", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', cx, alertY); ctx.strokeText('!', cx, alertY);
  }
}

function drawSmokeLayer() {
  for (const s of game.smokeParticles) {
    const lifeT = s.age / BULLIES.bob.smokeMaxAge;
    if (lifeT >= 1) continue;

    // Particles drift up + grow as they age — match what updatePlay's collision uses.
    const cx = s.x;
    const cy = s.y - lifeT * 14;
    // Tiny scale wobble so the cloud breathes — purely cosmetic.
    const wobble = 1 + 0.04 * Math.sin(game.time * 4 + s.seed * 0.013);
    const baseSize = s.size * (1 + lifeT * 0.7);
    const size = baseSize * wobble;

    // Hold full opacity for most of the lifetime; only fade quickly at the very end.
    let alpha;
    if (lifeT < 0.06)      alpha = lifeT / 0.06;
    else if (lifeT > 0.85) alpha = (1 - lifeT) / 0.15;
    else                    alpha = 1;
    alpha = Math.max(0, Math.min(1, alpha));

    ctx.save();
    ctx.globalAlpha = alpha;

    // Chunky bright-green cloud with a dark outline — kid-drawn marker style
    wobblyCircle(cx, cy, size, {
      fill: '#7fcc4a',
      stroke: '#3a5e1f',
      width: 3.5,
      seed: s.seed,
      jitterAmt: size * 0.16,
    });
    // Darker patch inside for depth
    wobblyCircle(cx - size * 0.22, cy - size * 0.12, size * 0.48, {
      fill: '#5a9e2c',
      stroke: null,
      seed: s.seed + 5,
      jitterAmt: size * 0.1,
    });
    // Bright highlight bubble
    ctx.globalAlpha = alpha * 0.65;
    wobblyCircle(cx + size * 0.28, cy - size * 0.28, size * 0.22, {
      fill: '#b9e87a',
      stroke: null,
      seed: s.seed + 11,
      jitterAmt: size * 0.06,
    });

    // A few wavy stink-lines rising off the cloud
    if (lifeT < 0.6) {
      ctx.strokeStyle = '#3a5e1f';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.globalAlpha = alpha * 0.85;
      const baseY = cy - size * 0.7;
      for (let i = 0; i < 3; i++) {
        const sx = cx + (i - 1) * size * 0.35;
        const phase = s.seed * 0.013 + i;
        ctx.beginPath();
        ctx.moveTo(sx, baseY);
        ctx.bezierCurveTo(
          sx - 4, baseY - 8 + Math.sin(phase) * 2,
          sx + 4, baseY - 16 + Math.sin(phase + 1) * 2,
          sx,     baseY - 22
        );
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}

function drawTrap(tr) {
  const baseAlpha = tr.triggered
    ? Math.max(0, 1 - tr.triggeredT / PLAY.abilities.trap.lingerAfter)
    : 1;
  ctx.save();
  ctx.globalAlpha = baseAlpha;
  // Subtle pulse when armed
  const pulse = tr.triggered ? 1 : 0.85 + 0.15 * Math.sin(game.time * 6);
  // Plate
  wobblyCircle(tr.x, tr.y, 22 * pulse, {
    fill: '#a87c4a', stroke: CONFIG.colors.ink, width: 3, seed: tr.seed,
  });
  // Spiky teeth ring (purple to match Violet)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + (tr.triggered ? 0.2 : 0);
    const x1 = tr.x + Math.cos(a) * 18;
    const y1 = tr.y + Math.sin(a) * 18;
    const x2 = tr.x + Math.cos(a) * 26;
    const y2 = tr.y + Math.sin(a) * 26;
    ctx.strokeStyle = '#8e5fb8';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  // V mark in the middle
  ctx.fillStyle = CONFIG.colors.ink;
  ctx.font = '900 18px "Permanent Marker", cursive';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('V', tr.x, tr.y + 1);
  ctx.restore();
  // Triggered: brief sparkle
  if (tr.triggered) {
    ctx.save();
    ctx.globalAlpha = baseAlpha;
    ctx.fillStyle = '#ffe066';
    for (let i = 0; i < 5; i++) {
      const a = i * 1.3 + game.time * 4;
      ctx.beginPath();
      ctx.arc(tr.x + Math.cos(a) * 30, tr.y + Math.sin(a) * 16, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawBurger(bg) {
  const bob = Math.sin(game.time * 4 + bg.seed * 0.1) * 1.5;
  const cx = bg.x;
  const cy = bg.y + bob;
  // shadow
  ctx.beginPath();
  ctx.ellipse(cx + 2, bg.y + 8, 14, 4, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fill();
  // bottom bun
  wobblyRect(cx - 14, cy - 4, 28, 10, {
    fill: '#d9a35a', stroke: CONFIG.colors.ink, width: 2, radius: 6, seed: bg.seed,
  });
  // patty
  wobblyRect(cx - 13, cy - 12, 26, 8, {
    fill: '#7a4828', stroke: CONFIG.colors.ink, width: 2, radius: 3, seed: bg.seed + 1,
  });
  // green lettuce squiggle
  ctx.strokeStyle = '#5e9e4a';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 12, cy - 14);
  ctx.lineTo(cx - 5,  cy - 16);
  ctx.lineTo(cx + 2,  cy - 14);
  ctx.lineTo(cx + 9,  cy - 16);
  ctx.lineTo(cx + 12, cy - 14);
  ctx.stroke();
  // top bun
  wobblyRect(cx - 14, cy - 22, 28, 12, {
    fill: '#e8b56a', stroke: CONFIG.colors.ink, width: 2, radius: 8, seed: bg.seed + 2,
  });
  // sesame seeds
  ctx.fillStyle = '#fffaeb';
  ctx.beginPath(); ctx.arc(cx - 6, cy - 18, 1.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 4, cy - 17, 1.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 9, cy - 19, 1.2, 0, Math.PI * 2); ctx.fill();
}

function drawLever(l) {
  // shadow
  ctx.beginPath();
  ctx.ellipse(l.x + 3, l.y + 6, 30, 10, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fill();

  // wooden base — turns green when fixed
  wobblyRect(l.x - 24, l.y - 4, 48, 24, {
    fill: l.fixed ? '#7eb35e' : '#a8825c',
    stroke: CONFIG.colors.ink,
    width: 3,
    radius: 6,
    seed: l.seed,
  });
  // panel screws
  wobblyCircle(l.x - 18, l.y + 4, 2,  { fill: '#3a2a1a', stroke: null, seed: l.seed + 50 });
  wobblyCircle(l.x + 18, l.y + 4, 2,  { fill: '#3a2a1a', stroke: null, seed: l.seed + 51 });
  wobblyCircle(l.x - 18, l.y + 14, 2, { fill: '#3a2a1a', stroke: null, seed: l.seed + 52 });
  wobblyCircle(l.x + 18, l.y + 14, 2, { fill: '#3a2a1a', stroke: null, seed: l.seed + 53 });

  // The lever arm — tilted right when broken, upright when fixed.
  ctx.save();
  ctx.translate(l.x, l.y - 4);
  ctx.rotate(l.fixed ? 0 : -0.55);
  wobblyRect(-3, -32, 6, 32, {
    fill: '#a8a8b0', stroke: CONFIG.colors.ink, width: 2.5, radius: 3, seed: l.seed + 1,
  });
  wobblyCircle(0, -34, 7, {
    fill: l.fixed ? CONFIG.colors.yellow : '#cc3838',
    stroke: CONFIG.colors.ink, width: 2.5, seed: l.seed + 2,
  });
  ctx.restore();

  // Progress dots above (or a checkmark if fixed)
  if (!l.fixed) {
    const dots = PLAY.lever.hitsToFix;
    const r = 6, gap = 8;
    const totalW = dots * (r * 2) + (dots - 1) * gap;
    let dx = l.x - totalW / 2 + r;
    for (let i = 0; i < dots; i++) {
      wobblyCircle(dx, l.y - 56, r, {
        fill: i < l.progress ? CONFIG.colors.yellow : CONFIG.colors.cardBg,
        stroke: CONFIG.colors.ink, width: 2, seed: l.seed + 10 + i,
      });
      dx += r * 2 + gap;
    }
  } else {
    // Hand-drawn checkmark
    ctx.save();
    ctx.strokeStyle = '#3a7a2a';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(l.x - 14, l.y - 50);
    ctx.lineTo(l.x - 4,  l.y - 40);
    ctx.lineTo(l.x + 16, l.y - 62);
    ctx.stroke();
    ctx.restore();
  }
}

function drawLeverPrompt(l, time) {
  // Floats above the lever, bobs gently.
  const bob = Math.sin(time * 4) * 3;
  const cy = l.y - 86 + bob;
  // Chip body
  wobblyRect(l.x - 70, cy - 18, 140, 36, {
    fill: CONFIG.colors.cardBg, stroke: CONFIG.colors.ink, width: 3, radius: 8, seed: 5555,
  });
  // SPACE keycap
  wobblyRect(l.x - 60, cy - 12, 50, 24, {
    fill: CONFIG.colors.yellow, stroke: CONFIG.colors.ink, width: 2.5, radius: 4, seed: 5556,
  });
  ctx.fillStyle = CONFIG.colors.ink;
  ctx.font = '700 14px "Permanent Marker", cursive';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SPACE', l.x - 35, cy);
  // verb
  ctx.font = '700 18px "Patrick Hand", cursive';
  ctx.textAlign = 'left';
  ctx.fillText('to fix', l.x - 5, cy);
  // Pointer triangle below
  ctx.fillStyle = CONFIG.colors.cardBg;
  ctx.strokeStyle = CONFIG.colors.ink;
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(l.x - 8, cy + 18);
  ctx.lineTo(l.x + 8, cy + 18);
  ctx.lineTo(l.x,     cy + 28);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawPortal(p, time) {
  // Pulsing concentric rings — friendly, cartoonish "exit here"
  const pulse = 0.92 + 0.08 * Math.sin(time * 4);
  // shadow
  ctx.beginPath();
  ctx.ellipse(p.x + 3, p.y + 8, 38, 12, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fill();
  // Outer red ring
  wobblyCircle(p.x, p.y - 6, 50 * pulse, {
    fill: 'rgba(214, 64, 60, 0.30)',
    stroke: CONFIG.colors.red,
    width: 5,
    seed: 8001 + Math.floor(time * 3) % 4,
    jitterAmt: 2.4,
  });
  // Mid yellow ring
  wobblyCircle(p.x, p.y - 6, 36 * pulse, {
    fill: 'rgba(245, 200, 66, 0.65)',
    stroke: CONFIG.colors.ink,
    width: 4,
    seed: 8101 + Math.floor(time * 3) % 4,
    jitterAmt: 1.8,
  });
  // Inner bright core
  wobblyCircle(p.x, p.y - 6, 22 * pulse, {
    fill: 'rgba(255, 255, 240, 0.95)',
    stroke: CONFIG.colors.ink,
    width: 3,
    seed: 8201 + Math.floor(time * 3) % 4,
    jitterAmt: 1.2,
  });
  // Sparkles around the portal
  for (let i = 0; i < 6; i++) {
    const a = time * 1.2 + i * (Math.PI * 2 / 6);
    const sx = p.x + Math.cos(a) * 56;
    const sy = p.y - 6 + Math.sin(a) * 26;
    ctx.fillStyle = CONFIG.colors.yellow;
    ctx.beginPath();
    ctx.arc(sx, sy, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderPlay() {
  // Solid green underneath the world, in case the world is smaller than
  // the viewport along one axis (it isn't right now, but cheap insurance).
  ctx.fillStyle = '#5a8d4a';
  ctx.fillRect(0, 0, CONFIG.view.w, CONFIG.view.h);

  // World layer: shift by camera, draw ground + entities (y-sorted).
  ctx.save();
  ctx.translate(-game.camera.x, -game.camera.y);

  drawGround();
  for (const f of game.flowers) drawFlower(f);

  // Smoke layer goes behind characters but in front of grass/flowers.
  drawSmokeLayer();

  // Y-sort everything so the player passes correctly behind/in front.
  const ents = [];
  for (const t of game.trees)      ents.push({ y: t.y,            draw: () => drawTree(t) });
  for (const tr of game.traps)     ents.push({ y: tr.y - 12,       draw: () => drawTrap(tr) });
  for (const bg of game.burgers)   ents.push({ y: bg.y - 4,        draw: () => drawBurger(bg) });
  for (const l of game.levers)     ents.push({ y: l.y + 16,        draw: () => drawLever(l) });
  if (game.portal)                 ents.push({ y: game.portal.y,   draw: () => drawPortal(game.portal, game.time) });
  for (const tm of game.teammates) ents.push({ y: tm.y,            draw: () => drawTeammate(tm) });
  for (const b of game.bullies)    ents.push({ y: b.y,             draw: () => (b.key === 'burt' ? drawBurt(b) : drawBob(b)) });
  ents.push({ y: game.player.y, draw: drawPlayer });
  ents.sort((a, b) => a.y - b.y);
  for (const e of ents) e.draw();

  // Floating "press SPACE" prompt above the nearest interactable lever
  // (only when no skill check is currently running).
  if (!game.skillCheck && !game.victoryT) {
    const lever = nearestInteractableLever();
    if (lever) drawLeverPrompt(lever, game.time);
  }

  ctx.restore();

  // ----- Screen-space overlays -----
  renderHUD();
  if (game.skillCheck) renderSkillCheck();
  if (game.introT > 0) renderBiomeIntro();
  if (game.victoryT > 0) renderVictory();
}

function renderSkillCheck() {
  const sc = game.skillCheck;
  const c = CONFIG.colors;
  const barW = 620, barH = 36;
  const barX = (CONFIG.view.w - barW) / 2;
  const barY = CONFIG.view.h - 140;

  // helper text above the bar
  handText('press SPACE when the dot is in the green!',
    CONFIG.view.w / 2, barY - 22, { size: 22, color: c.ink });

  // bar background
  wobblyRect(barX, barY, barW, barH, {
    fill: '#fffaeb', stroke: c.ink, width: 4, radius: 10, seed: 4444,
  });

  // green zone
  const greenX = barX + (sc.greenCenter - sc.greenW / 2) * barW;
  const greenW = sc.greenW * barW;
  wobblyRect(greenX, barY + 4, greenW, barH - 8, {
    fill: '#7bc05a', stroke: null, radius: 4, seed: 4445, jitterAmt: 0.6,
  });

  // hit/miss flash
  if (sc.flashT > 0) {
    ctx.save();
    ctx.globalAlpha = sc.flashT / PLAY.lever.flashTime;
    ctx.fillStyle = sc.flashKind === 'hit'
      ? 'rgba(123, 192, 90, 0.55)'
      : 'rgba(214, 64, 60, 0.55)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.restore();
  }

  // indicator (vertical line + red dot)
  const ix = barX + sc.pos * barW;
  ctx.strokeStyle = c.ink;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(ix, barY - 8);
  ctx.lineTo(ix, barY + barH + 8);
  ctx.stroke();
  wobblyCircle(ix, barY + barH / 2, 7, {
    fill: c.red, stroke: c.ink, width: 2.5, seed: 4446,
  });

  // Show how many hits remaining on this lever
  const lever = game.levers[sc.leverIndex];
  const remaining = PLAY.lever.hitsToFix - Math.floor(lever.progress);
  handText(`${Math.max(0, remaining)} more ${remaining === 1 ? 'hit' : 'hits'}`,
    CONFIG.view.w / 2, barY + barH + 28, { size: 20, color: c.inkSoft });
}

// Side-view camel — used as the desert-clear celebration mascot.
function drawCamel(cx, cy, time) {
  const ink   = CONFIG.colors.ink;
  const tan   = '#d4a868';
  const shade = '#a87a40';

  ctx.save();

  // Soft shadow under the camel
  ctx.beginPath();
  ctx.ellipse(cx, cy + 4, 50, 6, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fill();

  // Legs — 4, paired (front/back-pair offset by π for a walk cycle)
  const legPositions = [-26, -10, 10, 26];
  for (let i = 0; i < 4; i++) {
    const phase = time * 7 + (i % 2 === 0 ? 0 : Math.PI);
    const swing = Math.sin(phase) * 5;
    ctx.strokeStyle = tan;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx + legPositions[i], cy - 14);
    ctx.lineTo(cx + legPositions[i] + swing, cy + 4);
    ctx.stroke();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + legPositions[i] - 4, cy - 14);
    ctx.lineTo(cx + legPositions[i] - 4 + swing, cy + 4);
    ctx.moveTo(cx + legPositions[i] + 4, cy - 14);
    ctx.lineTo(cx + legPositions[i] + 4 + swing, cy + 4);
    ctx.stroke();
  }

  // Body — long oval
  wobblyRect(cx - 38, cy - 28, 76, 28, {
    fill: tan, stroke: ink, width: 3, radius: 16, seed: 12000,
  });
  // Belly shading
  wobblyRect(cx - 34, cy - 14, 68, 14, {
    fill: shade, stroke: null, radius: 10, seed: 12001, jitterAmt: 0.4,
  });

  // Two humps on top
  wobblyCircle(cx - 14, cy - 38, 16, {
    fill: tan, stroke: ink, width: 3, seed: 12010, jitterAmt: 1.3,
  });
  wobblyCircle(cx + 14, cy - 38, 14, {
    fill: tan, stroke: ink, width: 3, seed: 12011, jitterAmt: 1.3,
  });

  // Long neck — slants up-left toward the head (camel is walking left)
  ctx.save();
  ctx.translate(cx - 32, cy - 26);
  ctx.rotate(-0.42);
  wobblyRect(-8, -38, 16, 38, {
    fill: tan, stroke: ink, width: 3, radius: 6, seed: 12020,
  });
  ctx.restore();

  // Head
  const headX = cx - 56;
  const headY = cy - 56;
  wobblyCircle(headX, headY, 13, {
    fill: tan, stroke: ink, width: 3, seed: 12030, jitterAmt: 1.0,
  });
  // Snout sticking out the front
  wobblyRect(headX - 18, headY - 4, 14, 12, {
    fill: tan, stroke: ink, width: 2.5, radius: 5, seed: 12031,
  });
  // Eye
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.arc(headX - 4, headY - 2, 1.8, 0, Math.PI * 2);
  ctx.fill();
  // Tiny ear (triangle pointing up-back)
  ctx.beginPath();
  ctx.moveTo(headX + 1, headY - 11);
  ctx.lineTo(headX + 7, headY - 16);
  ctx.lineTo(headX + 8, headY - 7);
  ctx.closePath();
  ctx.fillStyle = tan;
  ctx.fill();
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Mouth/smile
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(headX - 16, headY + 3);
  ctx.lineTo(headX - 10, headY + 4);
  ctx.stroke();

  // Tail wag at the back-right
  const tailWag = Math.sin(time * 6) * 5;
  ctx.strokeStyle = tan;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(cx + 36, cy - 22);
  ctx.lineTo(cx + 50 + tailWag, cy - 16);
  ctx.stroke();
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx + 36, cy - 22);
  ctx.lineTo(cx + 50 + tailWag, cy - 16);
  ctx.stroke();

  ctx.restore();
}

// Hand-drawn speech bubble with a tail pointing down toward (cx, cy+...)
function drawSpeechBubble(cx, cy, text) {
  ctx.font = '700 28px "Permanent Marker", cursive';
  const tw = ctx.measureText(text).width;
  const padX = 22, padY = 14;
  const w = tw + padX * 2;
  const h = 28 + padY * 2;
  const x = cx - w / 2;
  const y = cy - h / 2;

  // Tail FIRST so the bubble outline overdraws it cleanly at the join
  ctx.save();
  ctx.fillStyle = '#fffaeb';
  ctx.strokeStyle = CONFIG.colors.ink;
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 22, y + h - 2);
  ctx.lineTo(cx - 32, y + h + 22);
  ctx.lineTo(cx + 4,  y + h - 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Bubble body
  wobblyRect(x, y, w, h, {
    fill: '#fffaeb', stroke: CONFIG.colors.ink, width: 4, radius: 16,
    seed: 13000, jitterAmt: 1.2,
  });

  // Text
  ctx.fillStyle = CONFIG.colors.red;
  ctx.font = '700 28px "Permanent Marker", cursive';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, y + h / 2);
}

// Camel walks across the lower portion of the screen during desert victory.
// Speech bubble pops up while it's mid-screen.
function drawCamelGreeting() {
  if (game.biome !== 'desert') return;
  const total = PLAY.victoryDuration;
  const elapsed = total - game.victoryT;
  const delay = 0.35;
  const moveDur = total - delay;
  const progress = clamp((elapsed - delay) / moveDur, 0, 1);

  const startX = CONFIG.view.w + 180;
  const endX   = -180;
  const cx = startX + (endX - startX) * progress;
  const cy = CONFIG.view.h - 80;
  if (cx < -160 || cx > CONFIG.view.w + 200) return;

  drawCamel(cx, cy, elapsed);

  // Speech bubble appears once the camel is on screen and disappears before exit.
  if (progress > 0.20 && progress < 0.85) {
    drawSpeechBubble(cx + 30, cy - 110, 'Congratulations!');
  }
}

function renderVictory() {
  const total = PLAY.victoryDuration;
  const t = game.victoryT;
  let alpha;
  if (t > total - 0.4) alpha = (total - t) / 0.4;
  else if (t < 0.5)    alpha = t / 0.5;
  else                  alpha = 1;
  alpha = Math.max(0, Math.min(1, alpha));

  // dim the screen behind the banner
  ctx.save();
  ctx.globalAlpha = alpha * 0.55;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CONFIG.view.w, CONFIG.view.h);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = alpha;
  wobblyRect(CONFIG.view.w / 2 - 420, 220, 840, 250, {
    fill: '#fffaeb', stroke: CONFIG.colors.ink, width: 6, radius: 24, seed: 9998,
  });
  const biomeName = (game.world.def.name || '').toUpperCase();
  markerText(biomeName, CONFIG.view.w / 2, 302,
    { size: 78, color: CONFIG.colors.red, shadow: true });
  markerText('CLEARED!', CONFIG.view.w / 2, 378,
    { size: 78, color: CONFIG.colors.ink, shadow: true });

  // What's next? Tease the upcoming biome (if any).
  const idx = BIOME_ORDER.indexOf(game.biome);
  const nextKey = BIOME_ORDER[idx + 1];
  let subtitle = 'RAMS WAY!';
  if (nextKey) {
    const nextName = (BIOMES[nextKey] && BIOMES[nextKey].name) || cap(nextKey);
    subtitle = `next stop: ${nextName}!`;
  }
  handText(subtitle, CONFIG.view.w / 2, 430,
    { size: 28, color: CONFIG.colors.inkSoft });
  ctx.restore();

  // Mascot pass-through (currently desert only — ships with a camel)
  drawCamelGreeting();
}

function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }

function renderHUD() {
  const c = CONFIG.colors;

  // ----- Top-left: party panel — player + 2 teammates stacked -----
  const allies = [
    { key: game.selected, ent: game.player, isPlayer: true },
    ...game.teammates.map(tm => ({ key: tm.key, ent: tm, isPlayer: false })),
  ];
  const panelW = 230;
  const rowH = 48;
  const panelH = 16 + allies.length * rowH;
  wobblyRect(20, 20, panelW, panelH, {
    fill: c.cardBg, stroke: c.ink, width: 3, radius: 12, seed: 9001,
  });
  for (let i = 0; i < allies.length; i++) {
    const a = allies[i];
    const ach = CHARACTERS[a.key];
    const rowY = 36 + i * rowH;
    // mini portrait
    drawCharacterPortrait(ctx, a.key, 50, rowY + 22, 0.13);
    // "YOU" tag for the player
    if (a.isPlayer) {
      wobblyRect(78, rowY - 4, 36, 18, {
        fill: c.yellow, stroke: c.ink, width: 2, radius: 4, seed: 9050,
      });
      ctx.fillStyle = c.ink;
      ctx.font = '700 12px "Permanent Marker", cursive';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('YOU', 96, rowY + 5);
    } else {
      ctx.fillStyle = c.inkSoft;
      ctx.font = '700 14px "Patrick Hand", cursive';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(ach.name, 78, rowY + 4);
    }
    // hearts row (always show maxHearts slots, fill based on current)
    if (a.ent.hearts > 0) {
      let hx = 124;
      for (let h = 0; h < ach.hearts; h++) {
        drawHeart(hx, rowY + 22, 8, h < a.ent.hearts, h + i * 10);
        hx += 18;
      }
    } else {
      ctx.fillStyle = c.red;
      ctx.font = '700 14px "Permanent Marker", cursive';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('DOWNED', 124, rowY + 22);
    }
  }

  // ----- Top-center: biome name banner -----
  const bw = 280, bx = (CONFIG.view.w - bw) / 2;
  wobblyRect(bx, 20, bw, 56, {
    fill: c.yellow, stroke: c.ink, width: 4, radius: 14, seed: 9100,
  });
  markerText(game.world.def.name, CONFIG.view.w / 2, 50, { size: 32, color: c.ink });

  // ----- Top-right: lever counter -----
  const fixed = game.levers.filter(l => l.fixed).length;
  const total = game.levers.length;
  const lw = 200, lx = CONFIG.view.w - lw - 20;
  wobblyRect(lx, 20, lw, 56, {
    fill: c.cardBg, stroke: c.ink, width: 3, radius: 12, seed: 9200,
  });
  // pulse the counter green when all levers are done
  const counterColor = (fixed === total && total > 0) ? '#3a7a2a' : c.ink;
  markerText(`${fixed} / ${total}`, lx + 56, 50, { size: 28, color: counterColor });
  handText('LEVERS', lx + 100, 50, { size: 22, color: c.inkSoft, align: 'left' });

  // ----- Ability chips (J / K) above the bottom hint -----
  drawAbilityChips();

  // ----- Bottom: control hint (only when not running a skill check) -----
  if (!game.skillCheck) {
    ctx.save();
    ctx.globalAlpha = 0.7;
    let hint;
    if (game.portal) {
      hint = 'Portal is open — head to the swirl!  ·  ←↑↓→ move  ·  hold E to revive';
    } else {
      hint = '←↑↓→ move  ·  E fix lever / revive  ·  SPACE time the green  ·  F / D skills';
    }
    handText(hint, CONFIG.view.w / 2, CONFIG.view.h - 24, { size: 20, color: c.ink });
    ctx.restore();
  }
}

function drawAbilityChips() {
  const c = CONFIG.colors;
  const ch = CHARACTERS[game.selected];
  // Slot 1 (F) is always the first ability; slot 2 (D) is the second.
  // We render both chips so the player can see what each key does.
  const slots = [];
  if (ch.abilities[0]) slots.push({ slot: 'F', ability: ch.abilities[0] });
  if (ch.abilities[1]) slots.push({ slot: 'D', ability: ch.abilities[1] });
  if (!slots.length) return;

  const chipW = 220, chipH = 56, gap = 14;
  const totalW = slots.length * chipW + (slots.length - 1) * gap;
  const startX = (CONFIG.view.w - totalW) / 2;
  const y = CONFIG.view.h - 100;

  for (let i = 0; i < slots.length; i++) {
    const { slot, ability: ab } = slots[i];
    const cx = startX + i * (chipW + gap);
    const cdKey = abilityCooldownKey(game.selected, slot);
    const cd = cdKey ? Math.max(0, game.cooldowns[cdKey] || 0) : 0;
    const onCD = cd > 0.05;
    const isPassive = !!ab.passive;

    // Chip body
    wobblyRect(cx, y, chipW, chipH, {
      fill: onCD || isPassive ? '#d8cfb6' : c.cardBg,
      stroke: c.ink, width: 3, radius: 10, seed: 9300 + i, jitterAmt: 1.2,
    });

    // Key chip on left (star for passive, letter for active)
    wobblyRect(cx + 8, y + 8, 40, 40, {
      fill: isPassive ? c.cardBg : (onCD ? '#b8a880' : c.yellow),
      stroke: c.ink, width: 2.5, radius: 6, seed: 9320 + i, jitterAmt: 1,
    });
    ctx.fillStyle = isPassive ? c.inkSoft : c.ink;
    ctx.font = '700 26px "Permanent Marker", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isPassive ? '★' : slot, cx + 28, y + 28);

    // Ability name
    ctx.font = isPassive
      ? 'italic 700 16px "Patrick Hand", cursive'
      : '700 16px "Patrick Hand", cursive';
    ctx.fillStyle = c.ink;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(ab.name, cx + 56, y + 18);

    // Status line
    ctx.font = '13px "Patrick Hand", cursive';
    ctx.fillStyle = c.inkSoft;
    let status;
    if (isPassive)  status = '(passive — auto)';
    else if (onCD)  status = `ready in ${cd.toFixed(1)}s`;
    else            status = 'ready!';
    ctx.fillText(status, cx + 56, y + 38);
  }
}

// Map (character, slot letter) -> cooldowns slot, or null for passives.
function abilityCooldownKey(characterKey, slotLetter) {
  if (characterKey === 'violet' && slotLetter === 'F') return 'trap';
  if (characterKey === 'vada'   && slotLetter === 'F') return 'stun';
  if (characterKey === 'ada'    && slotLetter === 'F') return 'scream';
  if (characterKey === 'ada'    && slotLetter === 'D') return 'burger';
  return null;     // Violet D and Vada D are passive
}

function renderGameOver() {
  const c = CONFIG.colors;
  ctx.fillStyle = c.paper;
  ctx.fillRect(0, 0, CONFIG.view.w, CONFIG.view.h);

  // Decorative doodles to soften the loss
  drawTitleDoodles(game.time * 0.5);

  // Big banner on top of a dim overlay
  ctx.fillStyle = 'rgba(31, 26, 23, 0.18)';
  ctx.fillRect(0, 180, CONFIG.view.w, 360);

  markerText('GAME OVER', CONFIG.view.w / 2, 240, { size: 110, color: c.red, shadow: true });
  handText('Bob got you. Take a deep breath and try again.',
    CONFIG.view.w / 2, 320, { size: 28, color: c.inkSoft });

  // pulse "press SPACE"
  const pulse = 0.5 + 0.5 * Math.sin(game.time * 3);
  ctx.save();
  ctx.globalAlpha = 0.65 + pulse * 0.35;
  markerText('press SPACE to play again',
    CONFIG.view.w / 2, 470, { size: 40, color: c.ink });
  ctx.restore();
  handText('press ESC to pick a different hero',
    CONFIG.view.w / 2, 520, { size: 22, color: c.inkSoft });
}

// "Forest is locked / coming soon" placeholder shown when the next biome
// in BIOME_ORDER hasn't been built yet.
function renderPlaceholder() {
  const c = CONFIG.colors;
  ctx.fillStyle = c.paper;
  ctx.fillRect(0, 0, CONFIG.view.w, CONFIG.view.h);
  drawTitleDoodles(game.time * 0.5);

  const next = game.placeholderBiome || 'forest';
  const nextName = (BIOMES[next] && BIOMES[next].name) || cap(next);

  ctx.fillStyle = 'rgba(31, 26, 23, 0.18)';
  ctx.fillRect(0, 180, CONFIG.view.w, 360);

  markerText(`${nextName.toUpperCase()}`, CONFIG.view.w / 2, 250,
    { size: 100, color: c.red, shadow: true });
  handText('is locked — coming in the next milestone!',
    CONFIG.view.w / 2, 320, { size: 28, color: c.inkSoft });
  handText(`You cleared Grassland AND Desert. Nice run!`,
    CONFIG.view.w / 2, 360, { size: 24, color: c.inkSoft });

  const pulse = 0.5 + 0.5 * Math.sin(game.time * 3);
  ctx.save();
  ctx.globalAlpha = 0.65 + pulse * 0.35;
  markerText('press SPACE or ESC to continue',
    CONFIG.view.w / 2, 480, { size: 36, color: c.ink });
  ctx.restore();
}

function renderBiomeIntro() {
  const total = PLAY.introDuration;
  const t = game.introT;
  // Fade in for the first 0.5s, hold, then fade out the last 0.5s.
  let alpha;
  if (t > total - 0.5)      alpha = (total - t) / 0.5;
  else if (t < 0.5)         alpha = t / 0.5;
  else                       alpha = 1;
  alpha = Math.max(0, Math.min(1, alpha));

  ctx.save();
  ctx.globalAlpha = alpha;
  // Big banner
  wobblyRect(CONFIG.view.w / 2 - 380, 250, 760, 170, {
    fill: '#fffaeb',
    stroke: CONFIG.colors.ink,
    width: 6,
    radius: 24,
    seed: 9999,
  });
  markerText(game.world.def.name.toUpperCase(),
    CONFIG.view.w / 2, 320, { size: 84, color: CONFIG.colors.red, shadow: true });
  handText('escape with your friends!',
    CONFIG.view.w / 2, 388, { size: 28, color: CONFIG.colors.inkSoft });
  ctx.restore();
}

/* ---------------------------------------------------------------------
   Input
   --------------------------------------------------------------------- */
const KEYS = {
  left:  ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up:    ['ArrowUp', 'KeyW'],
  down:  ['ArrowDown', 'KeyS'],
  confirm: ['Space', 'Enter'],
  back:  ['Escape'],
};

function isKey(e, list) {
  return list.includes(e.code);
}

window.addEventListener('keydown', (e) => {
  // Prevent the page from scrolling on space/arrows/WASD held
  if (['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
    e.preventDefault();
  }

  // Track held keys so updatePlay can read them every frame.
  keysHeld.add(e.code);

  if (game.scene === 'title') {
    if (isKey(e, KEYS.confirm)) {
      game.scene = 'select';
    }
    return;
  }

  if (game.scene === 'select') {
    if (isKey(e, KEYS.left)) {
      game.selectedIndex = (game.selectedIndex - 1 + CHARACTER_ORDER.length) % CHARACTER_ORDER.length;
    } else if (isKey(e, KEYS.right)) {
      game.selectedIndex = (game.selectedIndex + 1) % CHARACTER_ORDER.length;
    } else if (isKey(e, KEYS.confirm)) {
      game.selected = CHARACTER_ORDER[game.selectedIndex];
      initBiome('grassland');
      game.scene = 'play';
    } else if (isKey(e, KEYS.back)) {
      game.scene = 'title';
    }
    return;
  }

  if (game.scene === 'play') {
    if (isKey(e, KEYS.back)) {
      game.scene = 'select';
      keysHeld.clear();
      return;
    }
    if (e.repeat) return;
    if (game.victoryT > 0 || game.deathT > 0 || game.player.hearts <= 0) return;

    // Skill keys
    if (e.code === 'KeyF') { fireSkill1(); return; }
    if (e.code === 'KeyD') { fireSkill2(); return; }

    // E: interact — start a skill check at a nearby lever.
    // (Holding E to revive a downed teammate is handled in the update loop.)
    if (e.code === 'KeyE') {
      if (game.skillCheck) return;
      // Don't start a skill check if a downed teammate is closer — revive first.
      const downed = game.teammates.find(tm =>
        tm.hearts <= 0 &&
        Math.hypot(game.player.x - tm.x, game.player.y - tm.y) < PLAY.teammate.reviveRadius
      );
      if (downed) return;
      const lever = nearestInteractableLever();
      if (lever) startSkillCheck(lever);
      return;
    }

    // Space: time the skill-check hit, OR start a check at a nearby lever
    // (so Space-only muscle-memory still works for the whole lever interaction).
    if (e.code === 'Space') {
      if (game.skillCheck) {
        hitSkillCheck();
      } else {
        const downed = game.teammates.find(tm =>
          tm.hearts <= 0 &&
          Math.hypot(game.player.x - tm.x, game.player.y - tm.y) < PLAY.teammate.reviveRadius
        );
        if (downed) return;
        const lever = nearestInteractableLever();
        if (lever) startSkillCheck(lever);
      }
      return;
    }
  }

  if (game.scene === 'gameOver') {
    if (isKey(e, KEYS.confirm)) {
      // Replay the same biome with the same character.
      initBiome(game.biome || 'grassland');
      game.scene = 'play';
    } else if (isKey(e, KEYS.back)) {
      game.scene = 'select';
      keysHeld.clear();
    }
    return;
  }

  if (game.scene === 'placeholder') {
    if (isKey(e, KEYS.confirm) || isKey(e, KEYS.back)) {
      game.scene = 'select';
      keysHeld.clear();
    }
    return;
  }
});

window.addEventListener('keyup', (e) => {
  keysHeld.delete(e.code);
});

// If the window loses focus, drop any held keys so the player doesn't run forever.
window.addEventListener('blur', () => keysHeld.clear());

// Mouse: click a card to select it; click again (or click selected) to confirm.
canvas.addEventListener('click', (e) => {
  if (game.scene !== 'select') {
    if (game.scene === 'title') game.scene = 'select';
    return;
  }
  // Map click position from CSS pixels to canvas logical coords
  const rect = canvas.getBoundingClientRect();
  const cx = ((e.clientX - rect.left) / rect.width) * CONFIG.view.w;
  const cy = ((e.clientY - rect.top) / rect.height) * CONFIG.view.h;

  const { cardW, cardH, gap } = CONFIG.select;
  const totalW = cardW * 3 + gap * 2;
  const startX = (CONFIG.view.w - totalW) / 2;
  const baseY = 150;
  for (let i = 0; i < CHARACTER_ORDER.length; i++) {
    const x = startX + i * (cardW + gap);
    if (cx >= x && cx <= x + cardW && cy >= baseY && cy <= baseY + cardH) {
      if (game.selectedIndex === i) {
        game.selected = CHARACTER_ORDER[i];
        initBiome('grassland');
        game.scene = 'play';
      } else {
        game.selectedIndex = i;
      }
      return;
    }
  }
});

/* ---------------------------------------------------------------------
   Main loop
   --------------------------------------------------------------------- */
let lastT = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000); // clamp for tab-switch
  lastT = now;
  game.time += dt;

  // Update phase (only the play scene needs continuous updates for now)
  if (game.scene === 'play') updatePlay(dt);

  // Render phase
  ctx.save();
  ctx.clearRect(0, 0, CONFIG.view.w, CONFIG.view.h);

  if (game.scene === 'title')          renderTitle(game.time);
  else if (game.scene === 'select')    renderSelect(game.time);
  else if (game.scene === 'play')      renderPlay();
  else if (game.scene === 'gameOver')  renderGameOver();
  else if (game.scene === 'placeholder') renderPlaceholder();

  ctx.restore();

  // Hint text in the wood-frame area below the canvas
  if (game.scene === 'title') {
    hintEl.textContent = 'click anywhere or press SPACE';
  } else if (game.scene === 'select') {
    hintEl.textContent = '← →  choose  ·  SPACE  confirm  ·  ESC  back';
  } else if (game.scene === 'play') {
    hintEl.textContent = 'arrows move · E interact · SPACE time skill check · F/D skills · ESC back';
  } else if (game.scene === 'gameOver') {
    hintEl.textContent = 'SPACE  retry  ·  ESC  pick another hero';
  } else if (game.scene === 'placeholder') {
    hintEl.textContent = 'SPACE or ESC to continue';
  }

  requestAnimationFrame(frame);
}

/* ---------------------------------------------------------------------
   Boot — wait for the Google fonts to load so the title doesn't pop in
   a system fallback for the first frame.
   --------------------------------------------------------------------- */
async function boot() {
  setupCanvas();
  try {
    if (document.fonts && document.fonts.ready) {
      // Force-load the two display weights we use
      await Promise.all([
        document.fonts.load('110px "Permanent Marker"'),
        document.fonts.load('24px "Patrick Hand"'),
      ]);
    }
  } catch (_) { /* offline / no fonts API — fallbacks will look fine */ }
  requestAnimationFrame(frame);
}
boot();
