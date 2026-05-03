# Eden Hall Adventure — Game Specification (v2)

## Overview

A single-player, top-down web game built in HTML/CSS/JavaScript. Inspired by *Dead by Daylight* and *Identity V*, but kid-friendly and Pittsburgh-flavored. The player controls one of three girl characters — Violet (the designer) and her friends Vada and Ada — escaping bullies across four themed biomes, ending with a boss fight against a flying-then-swimming bully.

Designed by **Violet**, an Eden Hall Upper Elementary student. Players are her classmates at Eden Hall Upper Elementary in Gibsonia, PA (Pine-Richland School District), all on Chromebooks.

**Target playthrough length:** ~7–8 minutes per run.
**Platform:** Web browser, Chromebook-friendly. No installation, no accounts.
**Tech stack:** Plain HTML + CSS + JavaScript with HTML5 Canvas. Single static site, deployable to GitHub Pages or Netlify so any kid with a link can play.

---

## Core Gameplay Loop

The player spawns in a biome with two AI-controlled teammates and several bullies. Around the map are **levers** that need to be repaired via a quick skill-check mini-game. Once all levers are fixed, a **portal** opens and the team escapes to the next biome.

The final biome is the boss fight. If the player's health hits zero, it's game over — restart from the beginning.

### Biome Progression (easy → hard)

1. **Grassland** — open field with scattered trees. 3 levers, 1 bully (Bob). Tutorial-feel intro.
2. **Desert** — sparse cover, longer sightlines, more risk. 4 levers, 2 bullies (Bob + Burt).
3. **Forest** — dense trees, lots of hiding spots, but bullies are harder to spot too. 4 levers, 2 bullies. Mix of Bob and Burt with adjusted speeds.
4. **Aquatics** — underwater/coastal setting. Boss fight with **Bryan** in fish form. Slower player movement (water resistance), boss swims and ambushes.

---

## Controls

Keyboard only (Chromebook-friendly). Two-handed split: arrow keys on the right hand for movement, left hand for interact + skills + skill-check timing.

- **Arrow Keys**: Move
- **E**: Interact (start repairing a lever, enter portal, revive teammate)
- **F**: Skill 1 (every character has one)
- **D**: Skill 2 (every character has one)
- **Spacebar**: Skill-check timing (press in the green zone during lever repair)
- **Esc**: Pause

Passive Skill 2s (Vada's Big Backpack, Violet's Steady Hands) trigger automatically — the D key does nothing for those characters. Ada's Skill 2 is active.

---

## Characters

The player picks one of three characters at the start. Each has different stats and unique abilities.

### Vada — The Equipper
- **Health:** 2 hearts
- **Lever Speed:** Slow (2/5)
- **Movement Speed:** Slow (2/5)
- **Skill Check Window:** Generous (5/5, ~25 sec)
- **Skill 1 (F):** Melee attack — auto-targets the nearest bully within ~3m, stuns them (dizzy, can't move or attack) for 5 seconds. 15-second cooldown.
- **Skill 2 (D, passive):** Larger inventory — can hold up to 5 items (Ada and Violet hold 2). No item system in v1, so this is set dressing until items ship.

### Ada — The Cook
- **Health:** 4 hearts
- **Lever Speed:** Medium (3/5)
- **Movement Speed:** Medium (3/5)
- **Skill Check Window:** Medium (3/5, ~15 sec)
- **Skill 1 (F):** Scream — auto-targets all bullies within ~5m, confuses them (they wander randomly instead of chasing) **and** slows them by 50% for 5 seconds. 20-second cooldown.
- **Skill 2 (D):** Burger Time — generate 2 burgers (heal 1 heart each, anyone can pick them up). 30-second cooldown.

### Violet — The Trapper
- **Health:** 3 hearts
- **Lever Speed:** Fast (5/5)
- **Movement Speed:** Fast (4/5)
- **Skill Check Window:** Tight (2/5, ~10 sec)
- **Skill 1 (F):** Spawn a bully trap that slows the first bully who steps on it by 50% for 10 seconds. 20-second cooldown.
- **Skill 2 (D, passive):** Steady Hands — when working a lever, gets +10 sec on her skill check window if a bully is within 15 meters. Kicks in automatically.

**Design note (anti-bully balance):** All three girls now have anti-bully debuffs (Vada stuns, Ada confuses+slows, Violet traps+slows). Regular bullies (Bob, Burt) become much more manageable; that's fine because they were already pretty light. The Bryan boss fight in Aquatics is where the difficulty lives — see his section below.

---

## AI Teammates

The two characters the player didn't pick become AI-controlled teammates:
- Wander toward the nearest unfixed lever and start repairing it.
- If a bully gets within ~10 meters, flee in the opposite direction.
- They do NOT use their abilities (keeps AI simple).
- Same stats and health as if the player controlled them.
- If knocked down, the player can revive them by holding E for 3 seconds.

---

## Bullies (Enemies)

**Line of sight:** All bullies' sight (and Burt's drag hook) is blocked by world obstacles — trees, cacti, and rocks. Hiding on the far side of cover actually breaks aggro. This applies in every biome.

### Bob — The Smoker (biomes 1–3)
- Hit cooldown: 3 sec
- Hit distance: 0.5 m (must be next to you)
- Speed: Medium
- Sight: Cannot see unless you're within 3 m
- **Smoke trail (gameplay, not just visual):**
  - Bob emits a green smoke puff **every 1.5 seconds *while moving*** (no puffs while stunned or standing still), leaving a persistent trail behind him.
  - Each puff lingers for **4 seconds** before fading.
  - Walking through smoke **slows the player to 60% speed (40% slowdown)**. The slow persists **1 second after exiting** so it can't be instantly cancelled by stepping out.
  - The player frowns (and cheeks turn green) the whole time the slow is active.
- **AI teammates path *around* smoke clouds when fleeing** — they won't run blindly through their own friendly fire.
- **Visual:** chunky, opaque bright-green clouds with thick dark-green outlines and a few rising stink-lines. Slight scale wobble for cheap animation. Should be unmistakable from a distance, not a faint wisp.
- Applies to Bob in every biome he appears in (Grassland, Desert, Forest).

### Burt — The Stretcher (biomes 2–3)
- Hit cooldown: 6 sec
- Hit distance: ~4.8 m (long reach — stretchy arm pokes from this far. Reduced 20% from the original 6 m for fairness.)
- Speed: Slow (~72 px/s)
- Sight: 20 m (sees you across most of the desert) — **but blocked by cover** (cacti, rocks, trees)
- **Drag (hook):** When the player or a teammate is within 20 m, in line of sight, and his hook is off cooldown (8 sec), Burt fires a stretchy arm and yanks them in to ~140 px range over ~0.55 seconds. The target's input is locked during the drag. Hiding behind a cactus/rock breaks the hook just like it breaks sight.
- **Visual:** tall, gangly, dark purple shirt, slit eyes. While dragging, his arm visibly extends from his shoulder to the target's grabbed position.

### Bryan — The Boss (biome 4 only)
- Hit cooldown: 0.2 sec (rapid attacks)
- Hit distance: 5 m
- Speed: Fast
- Sight: 15 m
- **Phase 1 (above water/flying):** Flies for 5 seconds at +45% speed, -10% sight. Brief landing windows are when she's vulnerable.
- **Phase 2 (in water/fish form):** Swims fast in straight lines, ambushes from below. Player must time movement between her swim-by attacks.
- The Aquatics biome forces the player into the water to reach levers, so they can't simply outrun her.

**Boss balance vs. player debuffs (important):** Now that all three girls have anti-bully debuffs, Bryan needs special handling so the fight stays threatening:
- **Immune to stun, confuse, and slow** during her flying phase (Phase 1) and during swim-by transit (Phase 2). Bullets-pass-through-walls feel — debuffs simply don't apply.
- **Vulnerable** only during the brief landing windows of Phase 1 and the surface windows of Phase 2.
- Even when vulnerable, debuff durations on Bryan are **capped at 1.5 seconds** (compare 5–10 sec on regular bullies).
- This forces players to *time* their debuffs around her vulnerable windows rather than spamming them, keeping the fight tense.

---

## Skill Check Mini-Game (Levers)

When a player presses E near a lever, a skill-check bar appears:
- A bar with a moving indicator and a green "success zone."
- Press Spacebar when the indicator is in the green zone.
- Hit it → progress advances. Miss it → bullies are alerted to your location and progress resets a small amount.
- Each character's "skill check window" stat sets the green-zone width.
- A lever takes ~3 successful checks to fully repair.

---

## Health & Game Over

- Hearts-based health pool per character.
- A bully hit removes 1 heart.
- Brief invincibility (1.5 sec) after being hit.
- No natural regen — Ada's burgers are the only heal.
- Health reaches zero → **Game Over** screen → restart from biome 1.

---

## Eden Hall / Pittsburgh Flavor

This is what makes the game *theirs*. We have a few real, authentic hooks to use:

### Real-school details to weave in
- **The RAMS mascot.** Eden Hall's mascot is the Ram. The girls can wear RAMS gear (a small ram logo on a shirt or backpack). The win screen could say "RAMS WAY!" — a nod to the school's "RAMS Way" positive-behavior program that students will recognize instantly.
- **"Biomes" is real Eden Hall vocabulary.** The school actually calls classroom groups "biomes" — the design sheet's biome theme is unintentionally on-brand for the school. Lean into it. The title screen could say "Choose your biome."
- **Eco-friendly building.** Eden Hall has skylights, a white reflective roof, and other green features. The Forest biome's "levers" could be re-themed as helping plants grow / fixing solar panels / saving the school's ecosystem.
- **Eden Hall Farm history.** The school is built on the old Eden Hall Farm property, willed by an H.J. Heinz Company executive. A Heinz ketchup bottle as an Easter-egg pickup is historically appropriate and very Pittsburgh.
- **Pittsburgh touches.** Pirates / Steelers black-and-yellow accents on signs. A distant view of the Pittsburgh skyline / Three Rivers from the Grassland level. Primanti's-style sandwich as the burger heal.

### Layout authenticity
The developer (next Claude) won't have the actual school floor plan, and that's fine — the *vibe* matters more than literal accuracy.
**Recommendation:** the daughter draws a rough top-down sketch of one biome (especially if you want a school-themed level later), labeling key spots she remembers. That sketch is gold for whoever builds it.

### Title screen credit
"**Eden Hall Adventure** — Designed by Violet, with friends Vada and Ada."

---

## Visual Style

- **Top-down 2D**, sprite-based.
- Bright, friendly, cartoon-y. The original design sheet has hand-drawn charm; preserve that feel rather than going slick/AAA.
- **Per-biome palette:**
  - **Grassland:** greens, soft blues, golden hour sun
  - **Desert:** warm tans, oranges, pale sky, cactus silhouettes
  - **Forest:** deep greens, dappled shadows, mossy browns
  - **Aquatics:** teals, deep blues, sandy seafloor, bubbles
- Use a **playful hand-lettered display font** for titles and a clean readable sans-serif for UI numbers.
- The frontend-design skill should be applied at build time — pick a bold cohesive aesthetic (kid-drawn / hand-lettered) and avoid the generic AI-game look (Inter font, purple gradients, cliché UI panels).

---

## Hosting & Distribution

The whole point is that any kid at Eden Hall can play it. Plan:

1. **Build:** A single `index.html` (with embedded or sibling CSS/JS) — no build step, no server.
2. **Host:** GitHub Pages (free) is simplest. Push to a public GitHub repo, enable Pages, and you get a URL like `username.github.io/eden-hall-adventure/`. Netlify or Cloudflare Pages are equally good free options.
3. **Share:** Send the URL to classmates. Works on any Chromebook browser.
4. **No accounts, no data collection** — keeps it COPPA-safe for elementary-age kids and avoids any school-IT headaches.
5. **High score (optional v2):** if you want a leaderboard, that requires a backend and starts pulling in privacy considerations. Skip for v1.

---

## What's NOT in v1 (parked for later)

Cut from the original design sheet to keep scope manageable:
- Shop, coins, gems, tickets, outfits, daily login XP
- "Death" game mode (last-player-standing)
- Portal sacrifice mechanic (40 tickets to revive)
- **Stamina mechanic** (originally a stat for sprinting; removed entirely — wasn't pulling its weight in a 5-minute game). All "stamina" stats and the original Vada stamina-pack ability are gone.
- **Item / inventory system.** Vada's Big Backpack passive is in the spec but has nothing to hold yet — the Heinz ketchup easter egg is the only candidate pickup.
- Multiplayer
- Mid-run boost shop / legendary items
- Persistent progress / save files

If v1 lands well with classmates, any of these can be v2 features.

---

## Build Notes for Claude (the developer)

- **Deliverable:** Single static site. `index.html` plus optional `styles.css` and `game.js`. No npm, no build tools, no frameworks needed. Vanilla JS + HTML5 Canvas is ideal.
- **Game loop:** `requestAnimationFrame`-driven update + render.
- **State:** Plain JS objects. No state library.
- **Assets:** Generate everything via Canvas drawing (shapes, gradients) or use emoji/CSS for sprites. No external image files — keeps it deploy-anywhere.
- **Audio:** Optional. Web Audio API tones for hit/lever-success/portal-open. Skip if it bloats things.
- **Performance:** 60 fps target on Chromebook.
- **Code quality:** Comment generously. Dad and daughter want to read the code together and tweak numbers (speeds, cooldowns, lever count). Put all tunable values at the top of the file as named constants in a `CONFIG` object.
- **Aesthetic:** Apply the frontend-design skill — pick a bold, cohesive direction (kid-drawn / hand-lettered / playful) and commit to it.

---

## Acceptance Criteria

The game is "done" when:
1. ✅ Title screen lets the player pick Vada, Ada, or Violet.
2. ✅ Arrow-key movement and E-to-interact work.
3. ✅ All four biomes (Grassland → Desert → Forest → Aquatics) are playable in sequence.
4. ✅ Each character's F ability works; passive D abilities (Vada Big Backpack stub, Violet Steady Hands) trigger correctly.
5. ✅ Bob and Burt patrol, chase, and damage on contact, with their special behaviors (smoke, drag).
6. ✅ Skill-check mini-game functions at levers (Space to time hits in the green zone).
7. ✅ Portal opens after all levers are fixed and transports to the next biome.
8. ✅ Aquatics biome boss fight (Bryan, both phases) ends in a win screen on victory; Bryan resists/short-duration debuffs as specced.
9. ✅ Game Over screen with "Play Again" appears at zero health.
10. ✅ A successful full run takes about 7–8 minutes.
11. ✅ Title screen shows "Eden Hall Adventure" with credit to Violet (designer) and friends Vada and Ada.
12. ✅ Game is hostable as a single static site (works opened from `file://` and from a GitHub Pages URL).
