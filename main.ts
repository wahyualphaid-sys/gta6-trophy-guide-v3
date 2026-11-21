// Leonida Legend — offline GTA VI trophy guide and tracker.
// Written from scratch for the gta6-trophy-guide-01 resubmit.
// Data: 55 trophies verified against PowerPyx and Output Lag, 19-20 Nov 2026.
// No external dependencies: only node:fs and node:path.
// Usage:
//   node main.ts                 -> build guide.md + guide.html, print progress
//   node main.ts --list          -> list every trophy, grouped by grade
//   node main.ts --grade Gold    -> list trophies of one grade
//   node main.ts --trophy "Bowling" -> show one trophy (partial name match)
// Progress is kept in progress.json next to this file (a simple list of
// unlocked trophy names). Nothing is uploaded anywhere by this program.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";

const ROOT = process.cwd();
const PROGRESS_FILE = join(ROOT, "progress.json");

// One entry per trophy. `how` is the unlock route as verified on 19-20 Nov
// 2026. Five hidden trophies have no confirmed method: they are flagged
// UNCONFIRMED and no method is invented for them.
const TROPHIES = [
  // ---- Visible trophies (27) ----
  { name: "Vice Got a Price!", grade: "Platinum", points: 0, kind: "visible", category: "Platinum", how: "Unlock every other trophy in the game. There is no shortcut: the Platinum only pops once the other 54 are done.", missable: false, unconfirmed: false },
  { name: "A Long Road", grade: "Gold", points: 100, kind: "visible", category: "Completion", how: "Reach 100% completion. That means the full checklist: 200 of 277 vehicles scanned, 100 of 255 animals studied, 70 of 80 challenges, 300 stunts and 100 optional missions, plus story and side content.", missable: false, unconfirmed: false },
  { name: "Cunning Stunts", grade: "Silver", points: 40, kind: "visible", category: "Driving", how: "Complete 250 stunts across Leonida. Stunts count toward the 300 needed for 100%, so keep doing them after this pops.", missable: false, unconfirmed: false },
  { name: "The Shootist", grade: "Silver", points: 40, kind: "visible", category: "Combat", how: "Earn a Gold medal in all 42 Shooting Range challenges. Practice one weapon class at a time; Gold needs accuracy and speed, not just completion.", missable: false, unconfirmed: false },
  { name: "Maximum Withdrawal", grade: "Silver", points: 40, kind: "visible", category: "Heists", how: "Rob 5 bank vaults and escape. Plan the getaway route before you go in, and do not linger after the vault opens.", missable: false, unconfirmed: false },
  { name: "Strangers & Freaks", grade: "Silver", points: 30, kind: "visible", category: "Side missions", how: "Complete 8 mission strands for strangers. Talk to every stranger marker you pass; strands unlock as the story advances.", missable: false, unconfirmed: false },
  { name: "Don't Touch My Deck", grade: "Silver", points: 30, kind: "visible", category: "Collectibles", how: "Complete 3 collectible card sets. Cards are scattered across Leonida; a set only counts once every card in it is found.", missable: false, unconfirmed: false },
  { name: "You WAiNKer!", grade: "Silver", points: 30, kind: "visible", category: "Collectibles", how: "WAiNK It at 100 locations. These are photo spots; check the in-game map for unvisited markers as you travel.", missable: false, unconfirmed: false },
  { name: "Master of None", grade: "Bronze", points: 20, kind: "visible", category: "Activities", how: "Try each type of activity once (9 types). Sample everything early: races, fishing, bowling, arcade, meditation, shooting range, drone races, stunt jumps and card collecting.", missable: false, unconfirmed: false },
  { name: "Earn Cash, Not Kudos", grade: "Bronze", points: 20, kind: "visible", category: "Driving", how: "Win 20 different races. Different race events count; replaying the same race does not.", missable: false, unconfirmed: false },
  { name: "Hot Together", grade: "Bronze", points: 20, kind: "visible", category: "Story", how: "Lose a 4-star Wanted Level while with your partner. Build the wanted level together, then break line of sight and stay hidden until it clears.", missable: false, unconfirmed: false },
  { name: "Retail Therapy", grade: "Bronze", points: 20, kind: "visible", category: "Heists", how: "Rob 3 shops back-to-back with your partner without losing your Wanted Level. Chain the robberies fast and keep the wanted level alive between them.", missable: false, unconfirmed: false },
  { name: "Whip It Good", grade: "Bronze", points: 20, kind: "visible", category: "Exploration", how: "Discover 100 vehicles. Drive or scan new vehicles as you find them; the vehicle list in the pause menu shows what is still missing.", missable: false, unconfirmed: false },
  { name: "The Goodtime State", grade: "Bronze", points: 20, kind: "visible", category: "Exploration", how: "Explore all of Leonida. Visit every named region on the map until no fogged area remains.", missable: false, unconfirmed: false },
  { name: "Pest Control", grade: "Bronze", points: 20, kind: "visible", category: "Heists", how: "Rob an Illegal Operation belonging to each gang (9 gangs). One operation per gang; the map markers change as gangs are hit.", missable: false, unconfirmed: false },
  { name: "Dime on the Dollar", grade: "Bronze", points: 20, kind: "visible", category: "Money", how: "Earn $250,000 laundering Marked Bills. Launder bills through the available fronts and keep a cut moving; it adds up across the game.", missable: false, unconfirmed: false },
  { name: "Top Fun", grade: "Bronze", points: 15, kind: "visible", category: "Activities", how: "Win a Top Fun Drone Race at every location (14). Learn each course once, then race to win; all 14 locations are required.", missable: false, unconfirmed: false },
  { name: "Treat Yo Self", grade: "Bronze", points: 15, kind: "visible", category: "Money", how: "Spend $100,000 across all shops. Normal story spending counts; big purchases such as properties help, but every shop dollar adds up.", missable: false, unconfirmed: false },
  { name: "Little Boxes", grade: "Bronze", points: 15, kind: "visible", category: "Money", how: "Purchase all garage properties (8). Buy garages as they become available; they also give you somewhere to store found vehicles.", missable: false, unconfirmed: false },
  { name: "On the Spot", grade: "Bronze", points: 15, kind: "visible", category: "Driving", how: "Register 10 vehicles to the Scooter Bros app. Find a vehicle, then register it through the app instead of just driving it away.", missable: false, unconfirmed: false },
  { name: "Baited My Tackle", grade: "Bronze", points: 10, kind: "visible", category: "Activities", how: "Beat Cal in a fishing challenge. Fishing challenges unlock through the fishing activity; beat Cal's score to take this one.", missable: false, unconfirmed: false },
  { name: "Stick Fiddler", grade: "Bronze", points: 10, kind: "visible", category: "Activities", how: "Complete an arcade game. Any arcade cabinet counts; finish a full game rather than just starting one.", missable: false, unconfirmed: false },
  { name: "Positive Mental Attitude", grade: "Bronze", points: 10, kind: "visible", category: "Activities", how: "Meditate at every spot across Leonida (18 spots, 10 locations). POTENTIALLY MISSABLE in Chapter 1: do the meditation spots as soon as you can reach them, and do not assume they all stay available later.", missable: true, unconfirmed: false },
  { name: "Gunslinger", grade: "Bronze", points: 10, kind: "visible", category: "Combat", how: "Take down 5 enemies in a single use of Combat Focus. Group enemies first, trigger Combat Focus, and chain the five takedowns before it ends.", missable: false, unconfirmed: false },
  { name: "Sneakthief", grade: "Bronze", points: 10, kind: "visible", category: "Heists", how: "Rob a jewelry store without being detected. Go in quiet, avoid cameras and staff sightlines, and leave before any alarm.", missable: false, unconfirmed: false },
  { name: "A Classic Blitz Play", grade: "Bronze", points: 10, kind: "visible", category: "Heists", how: "Rob an Armored Truck and escape. Hit a truck on the road, take the cash, and lose the wanted level to finish it.", missable: false, unconfirmed: false },
  { name: "One Last Thing", grade: "Bronze", points: 5, kind: "visible", category: "Completion", how: "Complete 50 challenges. Challenges cover combat, driving, exploration and activities; 50 of the 80 count here, 70 are needed for 100%.", missable: false, unconfirmed: false },
  // ---- Hidden trophies (28) — story spoilers below ----
  { name: "Just Like Paradise", grade: "Bronze", points: 5, kind: "hidden", category: "Story", how: "Complete the mission Gone Fishing. Story mission; unmissable if you finish the story.", missable: false, unconfirmed: false },
  { name: "Paradise Lost", grade: "Bronze", points: 20, kind: "hidden", category: "Story", how: "Complete Chapter 1. Story trophy; awarded at the end of the first chapter.", missable: false, unconfirmed: false },
  { name: "T**s Ass Drug Money", grade: "Bronze", points: 20, kind: "hidden", category: "Story", how: "Complete Chapter 2. Story trophy; awarded at the end of the second chapter.", missable: false, unconfirmed: false },
  { name: "Vice City, Baby!", grade: "Bronze", points: 20, kind: "hidden", category: "Story", how: "Complete Chapter 3. Story trophy; awarded at the end of the third chapter.", missable: false, unconfirmed: false },
  { name: "Top Of The World, Ma", grade: "Bronze", points: 20, kind: "hidden", category: "Story", how: "Complete Chapter 4. Story trophy; awarded at the end of the fourth chapter.", missable: false, unconfirmed: false },
  { name: "You Gotta Know When to Get Off", grade: "Gold", points: 50, kind: "hidden", category: "Story", how: "Complete the final mission. Story trophy; the last mission of the game.", missable: false, unconfirmed: false },
  { name: "Trust", grade: "Bronze", points: 10, kind: "hidden", category: "Story", how: "Complete the mission Breakfast Run.", missable: false, unconfirmed: false },
  { name: "Break the Bank", grade: "Bronze", points: 25, kind: "hidden", category: "Story", how: "Complete the mission The Cartel Heist.", missable: false, unconfirmed: false },
  { name: "Family Matters", grade: "Bronze", points: 15, kind: "hidden", category: "Story", how: "Complete the mission Child's Play.", missable: false, unconfirmed: false },
  { name: "DWNFALL", grade: "Bronze", points: 15, kind: "hidden", category: "Story", how: "Complete the mission Headliners.", missable: false, unconfirmed: false },
  { name: "Hi-Jacked", grade: "Bronze", points: 25, kind: "hidden", category: "Story", how: "Complete the mission VCIA Takedown.", missable: false, unconfirmed: false },
  { name: "Snow Storm", grade: "Bronze", points: 25, kind: "hidden", category: "Story", how: "Complete the mission Operation Savage Glory.", missable: false, unconfirmed: false },
  { name: "This Was No Boat Accident", grade: "Bronze", points: 15, kind: "hidden", category: "Story", how: "Complete the final mission for Kenton.", missable: false, unconfirmed: false },
  { name: "The Lone Rider", grade: "Bronze", points: 15, kind: "hidden", category: "Story", how: "Complete the final mission for Billy.", missable: false, unconfirmed: false },
  { name: "Road to Rehabilitation", grade: "Bronze", points: 15, kind: "hidden", category: "Story", how: "Complete the final mission for Andy.", missable: false, unconfirmed: false },
  { name: "Supply & Demand", grade: "Bronze", points: 20, kind: "hidden", category: "Story", how: "Complete the final mission for Randy.", missable: false, unconfirmed: false },
  { name: "Spin On This!", grade: "Bronze", points: 15, kind: "hidden", category: "Story", how: "Complete the final mission for Tyrone.", missable: false, unconfirmed: false },
  { name: "Fair Game", grade: "Bronze", points: 15, kind: "hidden", category: "Story", how: "Hunt a unique animal for Bret.", missable: false, unconfirmed: false },
  { name: "Catch Me If You Can", grade: "Bronze", points: 10, kind: "hidden", category: "Exploration", how: "Make an unscheduled departure at VCIA: steal a docked airliner at gates E3/E4 and take off.", missable: false, unconfirmed: false },
  { name: "Challenging Tank", grade: "Bronze", points: 10, kind: "hidden", category: "Exploration", how: "Get in a Rhino tank at Mile Zero Air Station.", missable: false, unconfirmed: false },
  { name: "Let's Go Bowling", grade: "Bronze", points: 5, kind: "hidden", category: "Activities", how: "Follow through at the Kolt & Associates bowling alley: bowl there and finish the game.", missable: false, unconfirmed: false },
  { name: "Personal Best", grade: "Bronze", points: 5, kind: "hidden", category: "Activities", how: "Jason and Lucia both reach maximum Strength. Train both characters' Strength to the cap.", missable: false, unconfirmed: false },
  { name: "Actions Speak Louder", grade: "Bronze", points: 5, kind: "hidden", category: "Completion", how: "Perform 500 actions that change your Criminal Profile. Play naturally across crime, driving and activities; the counter climbs as your profile changes.", missable: false, unconfirmed: false },
  { name: "In The Beginning...", grade: "Bronze", points: 5, kind: "hidden", category: "Story", how: "UNCONFIRMED — enjoy a cocktail with a view on Ocean Beach. No verified method is known yet; do not trust invented steps.", missable: false, unconfirmed: true },
  { name: "Capital Offense", grade: "Bronze", points: 5, kind: "hidden", category: "Story", how: "UNCONFIRMED — smash your way out of a vehicle showroom. No verified method is known yet; do not trust invented steps.", missable: false, unconfirmed: true },
  { name: "Bad Luck, I Guess", grade: "Bronze", points: 5, kind: "hidden", category: "Story", how: "UNCONFIRMED — second time's the charm. No verified method is known yet; do not trust invented steps.", missable: false, unconfirmed: true },
  { name: "The Truth Is Out There", grade: "Bronze", points: 5, kind: "hidden", category: "Story", how: "UNCONFIRMED — what the hell just happened? No verified method is known yet; do not trust invented steps.", missable: false, unconfirmed: true },
  { name: "Ten Pin", grade: "Bronze", points: 5, kind: "hidden", category: "Story", how: "UNCONFIRMED — bowl 'em over with a melee drive-by. No verified method is known yet; do not trust invented steps.", missable: false, unconfirmed: true },
];

const GRADES = ["Platinum", "Gold", "Silver", "Bronze"];

function counts() {
  const byGrade = {};
  for (const g of GRADES) byGrade[g] = 0;
  let hidden = 0, visible = 0, unconfirmed = 0, missable = 0, points = 0;
  for (const t of TROPHIES) {
    byGrade[t.grade]++;
    points += t.points;
    if (t.kind === "hidden") hidden++; else visible++;
    if (t.unconfirmed) unconfirmed++;
    if (t.missable) missable++;
  }
  return { total: TROPHIES.length, byGrade, hidden, visible, unconfirmed, missable, points };
}

function loadProgress() {
  if (!existsSync(PROGRESS_FILE)) return [];
  try {
    const raw = JSON.parse(readFileSync(PROGRESS_FILE, "utf8"));
    if (Array.isArray(raw)) return raw.filter((n) => typeof n === "string");
    if (Array.isArray(raw.unlocked)) return raw.unlocked;
  } catch { /* a broken progress file means start from zero */ }
  return [];
}

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function tag(t) {
  const bits = [];
  if (t.missable) bits.push("MISSABLE");
  if (t.unconfirmed) bits.push("UNCONFIRMED");
  return bits.length ? " [" + bits.join(" | ") + "]" : "";
}

function renderMarkdown(unlocked) {
  const c = counts();
  const done = new Set(unlocked);
  const lines = [];
  lines.push("# Leonida Legend — GTA VI Trophy Guide");
  lines.push("");
  lines.push("All 55 trophies for Grand Theft Auto VI (global release 19 November 2026): "
    + "1 Platinum, 2 Gold, 6 Silver, 46 Bronze. No online trophies, no mission replay, "
    + "15 manual save slots, and cheats disable trophies. Estimated Platinum time: about 200 hours, difficulty 4/10.");
  lines.push("");
  lines.push("## Progress");
  lines.push("");
  lines.push(`Unlocked: ${done.size} / ${c.total} (${Math.round((done.size / c.total) * 100)}%). `
    + `Gamerscore banked: ${TROPHIES.filter((t) => done.has(t.name)).reduce((s, t) => s + t.points, 0)} / ${c.points}G. `
    + `Hidden: ${c.hidden}. Unconfirmed methods: ${c.unconfirmed} (flagged, never invented). `
    + `Missable: ${c.missable} — Positive Mental Attitude, Chapter 1.`);
  lines.push("Track your own progress by editing progress.json (a list of unlocked trophy names), then run `node main.ts` again.");
  lines.push("");
  lines.push("## Platinum roadmap (3 phases, ~200 hours)");
  lines.push("");
  lines.push("### Phase 1 — Story first, clean up as you go (~60 hours)");
  lines.push("Play all 5 chapters, finish every story mission and the four character finale strands (Kenton, Billy, Andy, Randy, Tyrone). "
    + "Do Positive Mental Attitude meditation spots in Chapter 1 while you can. Keep 15 manual saves and rotate them before risky missions, because there is no mission replay.");
  lines.push("");
  lines.push("### Phase 2 — Side content and collectibles (~80 hours)");
  lines.push("Stranger strands (8), card sets (3), 100 WAiNK photo spots, 100 vehicles discovered, all of Leonida explored, "
    + "8 garages bought, 10 vehicles registered, drone races at all 14 locations, fishing and arcade games, both characters to max Strength.");
  lines.push("");
  lines.push("### Phase 3 — Grind and 100% (~60 hours)");
  lines.push("250 stunts (300 for 100%), 42 shooting-range Gold medals, 20 different race wins, 5 bank vaults, 9 gang operations, "
    + "$250,000 laundered, $100,000 spent, 50 challenges (70 for 100%), 200/277 vehicles scanned, 100/255 animals studied, 100 optional missions.");
  lines.push("");
  lines.push("## 100% completion checklist");
  lines.push("");
  lines.push("- Vehicles scanned: 200 / 277");
  lines.push("- Animals studied: 100 / 255");
  lines.push("- Challenges: 70 / 80");
  lines.push("- Stunts: 300");
  lines.push("- Optional missions: 100");
  lines.push("");
  for (const grade of GRADES) {
    const list = TROPHIES.filter((t) => t.grade === grade);
    lines.push(`## ${grade} (${list.length})`);
    lines.push("");
    for (const t of list) {
      const mark = done.has(t.name) ? "[x]" : "[ ]";
      lines.push(`### ${mark} ${t.name} — ${t.points}G${tag(t)}`);
      lines.push("");
      lines.push(`*${t.kind === "hidden" ? "Hidden" : "Visible"} · ${t.category}.* ${t.how}`);
      lines.push("");
    }
  }
  lines.push("## Sources");
  lines.push("");
  lines.push("PowerPyx — GTA 6 Trophy Guide & Roadmap: https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/");
  lines.push("Output Lag — GTA 6 Trophy List: https://outputlag.com/guides/gta-6-trophy-list/");
  lines.push("Cross-checked against KeenGamer and GTABase, 19-20 November 2026. See SOURCES.md.");
  lines.push("");
  lines.push("Generated by `node main.ts`. Edit progress.json to track unlocks.");
  return lines.join("\n");
}

function renderHtml(unlocked) {
  const c = counts();
  const done = new Set(unlocked);
  const rows = TROPHIES.map((t) => {
    const mark = done.has(t.name) ? "Unlocked" : "Locked";
    return `<tr><td>${esc(t.name)}</td><td>${esc(t.grade)}</td><td>${t.points}G</td><td>${esc(t.category)}</td><td>${t.kind}</td><td>${esc(t.how)}${t.missable ? " <b>MISSABLE</b>" : ""}${t.unconfirmed ? " <b>UNCONFIRMED</b>" : ""}</td><td>${mark}</td></tr>`;
  }).join("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Leonida Legend — GTA VI Trophy Guide</title>`
    + `<style>body{font-family:system-ui,sans-serif;max-width:1000px;margin:2em auto;padding:0 1em;line-height:1.5}table{border-collapse:collapse;width:100%}td,th{border:1px solid #999;padding:6px 8px;text-align:left;vertical-align:top}th{background:#eee}</style></head><body>`
    + `<h1>Leonida Legend — GTA VI Trophy Guide</h1>`
    + `<p>All 55 trophies: 1 Platinum, 2 Gold, 6 Silver, 46 Bronze. No online trophies. About 200 hours, difficulty 4/10. Global release 19 November 2026.</p>`
    + `<p>Progress: ${done.size} / ${c.total} unlocked. Hidden: ${c.hidden}. Unconfirmed: ${c.unconfirmed}. Missable: ${c.missable} (Positive Mental Attitude, Chapter 1).</p>`
    + `<h2>Platinum roadmap</h2><ol><li><b>Phase 1 — Story (~60h):</b> all 5 chapters, character finales, meditation spots in Chapter 1, rotate the 15 manual saves.</li>`
    + `<li><b>Phase 2 — Side content (~80h):</b> strangers, cards, photos, vehicles, garages, drone races, fishing, arcade, max Strength.</li>`
    + `<li><b>Phase 3 — Grind and 100% (~60h):</b> stunts, shooting-range Golds, races, vaults, gang operations, laundering, challenges, scans.</li></ol>`
    + `<h2>100% checklist</h2><p>Vehicles 200/277 · Animals 100/255 · Challenges 70/80 · Stunts 300 · Optional missions 100.</p>`
    + `<h2>All trophies</h2><table><tr><th>Trophy</th><th>Grade</th><th>Points</th><th>Category</th><th>Kind</th><th>How to unlock</th><th>Status</th></tr>${rows}</table>`
    + `<p>Sources: PowerPyx and Output Lag, cross-checked against KeenGamer and GTABase (19-20 Nov 2026). See SOURCES.md. The 5 UNCONFIRMED trophies have no invented method.</p>`
    + `</body></html>\n`;
}

function printTrophy(t) {
  console.log(`${t.name} — ${t.grade} ${t.points}G [${t.kind}, ${t.category}]${tag(t)}`);
  console.log(`  ${t.how}`);
}

function main() {
  const args = process.argv.slice(2);
  const unlocked = loadProgress();
  if (args.includes("--list")) {
    for (const grade of GRADES) {
      console.log(`== ${grade} ==`);
      for (const t of TROPHIES.filter((x) => x.grade === grade)) printTrophy(t);
    }
    return;
  }
  const gradeIdx = args.indexOf("--grade");
  if (gradeIdx !== -1 && args[gradeIdx + 1]) {
    const want = args[gradeIdx + 1].toLowerCase();
    const list = TROPHIES.filter((t) => t.grade.toLowerCase() === want);
    if (!list.length) { console.error(`No grade named "${args[gradeIdx + 1]}". Try Platinum, Gold, Silver or Bronze.`); process.exitCode = 1; return; }
    for (const t of list) printTrophy(t);
    return;
  }
  const trophyIdx = args.indexOf("--trophy");
  if (trophyIdx !== -1 && args[trophyIdx + 1]) {
    const want = args[trophyIdx + 1].toLowerCase();
    const list = TROPHIES.filter((t) => t.name.toLowerCase().includes(want));
    if (!list.length) { console.error(`No trophy matches "${args[trophyIdx + 1]}".`); process.exitCode = 1; return; }
    for (const t of list) printTrophy(t);
    return;
  }
  const md = renderMarkdown(unlocked);
  const html = renderHtml(unlocked);
  writeFileSync(join(ROOT, "guide.md"), md);
  writeFileSync(join(ROOT, "guide.html"), html);
  const c = counts();
  console.log(`Trophies: ${c.total} (Platinum ${c.byGrade.Platinum}, Gold ${c.byGrade.Gold}, Silver ${c.byGrade.Silver}, Bronze ${c.byGrade.Bronze})`);
  console.log(`Kind: ${c.visible} visible, ${c.hidden} hidden. Unconfirmed: ${c.unconfirmed}. Missable: ${c.missable}.`);
  console.log(`Progress: ${unlocked.length}/${c.total} unlocked.`);
  console.log("Wrote guide.md and guide.html");
}

main();
