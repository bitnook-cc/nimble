# Slate

An offline-first Nimble GM screen built with React, TypeScript and Vite. Includes a configurable cell grid, a dice roller using `@nimble/dice`, an initiative tracker with Nimble and D&D classic modes, a campaign party roster, an NPC name/attribute generator using `@nimble/generators`, and campaign management with portable backups. Milestones 1–5 are implemented for the web. Milestone 6 adds accessibility and release checks, native SQLite persistence, file picking/sharing, and Android/iOS projects; SDK builds and real-device release acceptance remain pending.

## Run locally

From the Nimble repository root, using Node 22.13 or newer and npm (Node 24 LTS recommended):

```sh
npm install
npm run dev:slate
```

Open http://127.0.0.1:3010. The root command builds the shared dice and generator packages before starting Slate. Slate does not require the API server, Docker, an account, or a database service.

For a production preview with offline support:

```sh
npm run build -w @nimble/dice
npm run build -w @nimble/generators
npm run build -w @nimble/slate
npm run preview -w @nimble/slate
```

The build produces static files in `apps/slate/dist`. Serve that directory over HTTPS or localhost. The development server does not install a service worker. Wait for **Ready for offline play** in the production preview before disconnecting. A web installation needs one successful online load; packaged native builds use bundled assets.

## This first version

- A default local campaign, creation, renaming, switching, duplication, archive/restore, and confirmed permanent deletion.
- A campaign party of simple PCs (name, player, level, current/maximum HP, notes), managed through the toolbar’s **Campaign party** button. **Add party** in any initiative tracker adds missing PCs as heroes without changing existing combatants.
- A configurable resolution of 4–24 columns and 4–30 rows. The grid fills the viewport below the title bar, with no page scrolling.
- Widgets occupy whole-cell rectangles, down to a single cell. Each tool has a minimum usable pixel width/height; below either threshold its tile shows a placeholder instead of squeezed controls. Click the placeholder to expand the saved tool, or drag/resize it in Arrange mode. Pixel size is measured live as the viewport, grid resolution or placement changes. Add widgets to free cells, drag and resize in Arrange mode, or use arrow keys on the move and resize handles. Overlap and clipping beyond the configured grid are rejected.
- Every screen size displays the entire grid. Widget content scrolls internally; expanded views provide more room without changing saved cell placements. Preview/offline status lives in a bottom-left popover pill.
- Removing a widget keeps its tool data. Use **Click an empty cell → Saved tools** to restore it.
- Dice expressions, advantage/disadvantage, explicit critical/fumble/vicious options, saved presets, individual dice and discarded results, and up to 50 retained rolls per tool. The UI shows the 10 most recent rolls.
- **Nimble** initiative is the default: Begin combat puts the party before ordinary monsters, preserving table order within each side. Legendary monsters act after each hero, replacing their ordinary turn; allies and followers do not trigger legendary actions. The GM can rearrange turns during combat.
- Open the initiative widget’s header **Configure** button to choose **Initiative mode**. Changes apply when you select **Save tool**; dismissing the popup discards the draft.
- **D&D classic** initiative: Roll initiative opens a popup for each living combatant's total, then Start combat sorts highest first and begins the round. Ties preserve the current order. Legendary monsters receive one ordinary initiative turn per round. Cancelling or dismissing the popup leaves the encounter unchanged.
- Both modes support heroes/enemies/allies, HP, conditions, notes, rounds, pause/resume/finish, and the last 30 combat changes available to undo. Defeated combatants are skipped. Changing mode restarts turn progress while retaining combatants and HP; one undo restores the previous mode and progress. Action economy remains GM-managed.
- IndexedDB persistence on the web; SQLite persistence in native builds. Transaction completion precedes reporting saved, with validation on load and revision checks to reject stale writes.
- Parchment follows Sidekick’s Nimble Classic/Nimble Dark palette; Stone follows Modern/Modern Dark, with contrast-safe text/accent shades. Both support light/dark/system appearance. Geist interface text, the bold Alegreya Sans wordmark and restrained Cinzel headings use bundled local WOFF2 fonts, including their SIL Open Font Licenses, with no runtime font download. Font sources and checksums are recorded in `public/fonts/SOURCES.json`.
- Installable PWA with a deferred update prompt. Updates activate only after local changes are saved.

The data model separates widget placement from tool state and campaigns from device appearance. Removing an active combatant selects the next living combatant and advances the round when wrapping. Resetting a run and HP changes are undoable. Changing an encounter title is saved directly, outside the combat undo stack.

Schema 17 saves initiative modes in live encounters and undo snapshots, including campaign copies and ZIP backups. Schema 2–16 backups remain readable. Existing ongoing ordinary encounters retain their manual order in classic mode; legendary encounters retain Nimble timing. Ready trackers adopt the Nimble default. Upgrades retain rounds, active combatants, HP and undo history.

## Utility tools (Milestone 5)

Use **Click an empty cell → New tools** to add any utility to the grid. **Alt+P / ⌘P** opens the same utilities without a placement. All five support multiple instances, names, expanded views, shared state across screens, campaign copying, and ZIP backups. The icon-only **Configure** button in every widget header opens its tool settings, including expanded and command-palette views. Utilities keep their full editors; other tools can be renamed there. Tile settings continue to control the view and its saved-tool link.

| Tool          | How it works                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Clock & timer | One compact widget with clock, countdown and stopwatch modes. Icon controls start/pause, reset, extend by one minute and acknowledge expiry. Mode switches preserve both time tools.                                                                                                                                                                                                                                        |
| Counter       | Manual −/+ and reset to a starting value; configurable step, unit, bounds and target. Optionally add/subtract a step on each turn or round of a selected initiative tracker.                                                                                                                                                                                                                                                |
| Random table  | Display reusable library content: simple lists, weighted rows or explicit dice ranges. Roll or choose an entry manually, insert Markdown references, and optionally roll a linked table. Each tool retains a 20-result history.                                                                                                                                                                                             |
| Image card    | Import PNG/JPEG/WebP/GIF up to 10 MiB, or select an existing campaign image. Set a caption and fit/fill. Drag with a mouse or one finger to pan; scroll or pinch to zoom (1–4×) around the pointer or pinch centre. Compact zoom buttons and keyboard arrows, +/− and 0 are also available. The view saves offline after each gesture. **Fit image** restores the whole image. Use the tile's **Expand** for a larger view. |
| Checklist     | Add/edit up to 200 tasks, check/uncheck, reorder with buttons, duplicate, indent 0–3 levels or uncheck all. Duplicated tasks start unchecked.                                                                                                                                                                                                                                                                               |

Create a table through **Campaign library → Create content → Random table**, or **Create table** in a table widget. Definitions are campaign content (`kind: "table"`, `fields.definition`), independent of widgets. Widgets store only the selected content target and their result history. **Choose table** selects content from the campaign or enabled packs; **Pin** adds a table widget. Editing library content updates every linked widget, while existing results retain their original prose.

The library labels rollable entries **Random table** and catalogs **Reference table**. For structured catalogs such as Weapons, **Make rollable campaign copy** extracts all source rows into an equal-chance list, preserving categories, column values and source attribution. The official record stays unchanged. Edit the copy to configure weights or dice ranges. Copying a reference table through the library editor also starts with its real rows instead of placeholder entries.

Simple lists give each entry an equal chance. Weighted mode accepts positive integer weights and uses unbiased selection through the existing @nimble/dice d100 engine. Dice-range mode accepts 1–20 standard dice (d4/d6/d8/d10/d12/d20/d100), optionally with an integer offset within 10,000. Ranges are inclusive and cover every possible total exactly once: gaps, overlaps and out-of-range endpoints are rejected. For example, use `1d100-1` with rows `0–9` and `10–99` for 10%/90% chances. Linked table targets resolve against campaign content or enabled packs, reject cycles/missing tables, and stop at eight tables. A failed linked roll stores no partial result. Nexus reference tables retain their Markdown until the GM explicitly adds a mapping to a campaign copy.

Use **Import / export content → Slate content pack** to export selected tables and their related campaign content as a `slate-content` pack. Install it through **Content packs → Import content pack**. The complete record format also preserves tables; older `slate-table` version 1 files can be imported through content exchange. Definitions contain `{mode: "list" | "weighted" | "ranges", formula, rows}`; rows have `id`, `name`, `body`, `weight`, `from`, `to`, and an optional `tableId` content target. Inactive mapping fields remain present. Include linked tables in the same export; references between selected records are rewritten to the exported pack. A campaign ZIP also carries tool results and attachments. Schema 16 automatically moves existing embedded table definitions into campaign content, preserving widget IDs, links, history and an original recovery checkpoint.

Linked counters react only to explicit turns/new rounds in the selected tracker. Manual controls always remain available. Combat undo reverses actual linked changes in the same save, including after reload or campaign copying. Resetting or saving configuration invalidates older linked changes. These are general counters; they do not automatically interpret spell durations.

Timers store timestamps and reconcile them when opened or resumed; they do not save on every display tick. Expiry is visual, acknowledged once, and silent. Background alarms and exact suspended-app delivery are not promised. Replaced images stay in campaign attachments until explicitly removed there; multiple cards can share one image. Remote images and SVG are not imported. Attachment removal leaves a clear missing-image message rather than replacing the card silently.

## Offline readiness checks

Run `npm run test:e2e:cross -w @nimble/slate` after building Slate and installing Playwright Firefox/WebKit for additional functional and accessibility coverage. Visual baselines stay in the main browser suite. WebKit offline checks stop a test-owned static server instead of using its broken offline emulation ([Playwright issue 42775](https://github.com/microsoft/playwright/issues/42775)); a fresh uncached context must fail while an installed app reloads from its service worker. No assertions are skipped. Browser attachments are persisted as bytes with their MIME type; older Blob attachments and recovery points remain readable.

Open the bottom-left status pill for local-save state, estimated site storage, browser storage protection, **Check campaign backup**, and **Download backup**. Checking constructs and validates a complete ZIP for the current campaign, verifies attachment checksums and enabled pack dependencies, and makes no changes to the campaign. Its result becomes stale after subsequent saves or a campaign switch. Download creates a new verified copy.

**Request storage protection** asks the browser to reduce automatic eviction. The browser may decline or lack support; clearing site data still deletes campaigns. Estimates apply to the site and are approximate. Native storage validation remains a release gate. Before play, wait for **Ready for offline play**, check/download a backup, then reload with networking disabled to verify the actual device. Development mode saves data but does not cache the app.

Schema 12 upgrades previous versions transactionally with an original recovery checkpoint; existing tools and disabled packs retain their state. Schema 2–11 campaign ZIPs remain readable. Existing clocks, step countdowns and travel counters migrate to the single Counter tool, preserving names, values, bounds, tracker links, placements and combat undo. Utility browser tests exercise grid/palette shared state, offline timer reconciliation, linked combat undo, table/reference authoring, bounds, mobile dark checklists, local image bytes and verified backups. Screenshot baselines include the compact time widget, a counter, mobile dark checklist and zoomed image card.

## Campaign party

Open **Campaign party** in the toolbar, or **Set up party** in an empty-party initiative tracker. Create, edit, and remove up to 100 PCs per campaign. A party is shared across screens and quick-access widgets, saved offline, and included in campaign duplication and ZIP backups. Existing installations gain an empty party without changing their encounters.

**Add party** snapshots each missing PC into the current encounter with its name, current/maximum HP, and notes. Initiative starts unset. Stable party IDs prevent duplicates even after a PC is renamed; existing enemies, turns, rounds, and damaged PCs remain unchanged. Additions are undoable together. If there is insufficient room in the 100-combatant encounter, nothing is added. Resetting an encounter allows the party to be added again. Editing or removing a PC does not alter existing encounters or their undo history.

Party summaries use their own stable local IDs. The optional source metadata records a Sidekick character ID, campaign ID, and sync timestamp; `characterFromSidekick` projects the existing Sidekick character model’s `name`, `level`, and `hitPoints.current/max` into a local summary. A future adapter can retain a versioned full character snapshot and refresh this summary while preserving its identity. Account connection, import UI, full sheets, and bidirectional/live sync are deferred. Combat changes currently affect only the encounter snapshot.

## Screens and shared tools

Use the screen selector in the toolbar to switch screens, and the adjacent **Manage screens** button to create, rename, reorder, duplicate or delete them. Each campaign keeps at least one screen, supports up to 20, and remembers the selected screen. Each screen has its own grid and widget placements.

- **Duplicate screen** copies the layout and creates new widget views of the same saved tools. Changes to a shared dice roller or initiative tracker appear on every screen using it.
- **Create screen** starts from Blank, Combat, Dice table, or a campaign's saved layout preset. Presets create fresh tools; they carry layout, widget titles and tool names/types, but no dice expressions, roll presets/history or combat state. Up to 20 custom layout presets can be saved per campaign.
- **Click an empty cell** to search new tool types and saved tools. Choosing a saved tool creates another view; removing a widget or deleting a screen leaves its tool available here.
- Use the header's **Configure** gear to rename the shared tool. To replace a widget, choose **… → Remove from screen**, then click an empty cell to add a new or saved tool. Removing a widget keeps its saved content in the campaign. Shared tool content and names are campaign-wide.
- **Expand** opens a focused view without changing the tool’s data. Widgets always show their content in their reserved grid cells.
- **Arrange** exposes layout undo/redo, retaining the latest 20 changes per screen across reloads. Placement, resizing, grid changes, adding/removing views, titles and linked-tool changes are undoable. Layout undo does not revert rolls, combat, shared tool names or screen lifecycle changes.

Existing installations gain a single **Session screen** with their original placements and tool data. Campaign duplication and ZIP backups include all screens, layout history and custom layout presets. Duplicating an entire campaign makes independent copies of its tools; duplicating a screen shares them within its campaign.

## Command palette

Press **Alt+P** or **Cmd+P**, or use the toolbar's search icon, to open the command palette. Search widgets by name, type or purpose, including a saved initiative tool's encounter name. Use **↑/↓** and **Enter**, or select a result, to open it in a compact popover. **Escape**, the close button, an outside click, or the same shortcut closes it and returns focus. **Ctrl+P** retains the browser's print shortcut.

The palette lists existing campaign tools and offers widget types the campaign does not yet have. Opening a missing type creates a saved campaign tool with no grid placement. Reopening it uses that same tool and its history. Rolls, NPCs, notes and combat updates are shared with any grid views and persist offline. The Back button returns to search; this does not discard tool data or alter layout history. Notes and references retain their usual nested previews and library chooser.

Notes are standalone campaign content (`kind: "note"`), with their own permanent ID, title, Markdown, tags and category. Create one through **Campaign library → Create content → note**, save an NPC as a note, or add a Notes widget. Widgets store a `noteId` instead of their own text. **Configure → Campaign note** selects an existing document; edits and title changes appear in every view of that note. Removing a widget keeps its document in the library, where it can be edited, pinned again, mentioned, exported as Slate records or a content pack, and included in campaign ZIP backups. Deleting the document explicitly removes its editing widgets and their layout-history entries; other references remain visible as unavailable. Imported pack notes are read-only references until copied into the campaign. Layout presets create fresh blank notes, while campaign duplication copies documents and remaps their local links together. Schema 18 automatically promotes existing note tools without changing their IDs or reference targets, retaining the original data in a recovery checkpoint on web and native storage.

## NPC names and attributes

**Click an empty cell → Generators → NPC generator** adds a reusable campaign tool. Select a name style (Mixed fantasy, Human, Elf, Dwarf, Halfling or Gnome) and name pool, then generate one NPC or a batch of five. Each has an appearance, scar or distinguishing mark, mannerism and quirk. These are roleplaying prompts, with no mechanical effects.

- Reroll the name or any single detail without changing the others. A reroll uses the current NPC's original style/pool; changing the selectors applies to the next generation.
- The latest 20 NPCs remain in **Recent NPCs**. **Save NPC** keeps up to 100 favourites per tool, independently of recent results. Rerolling a favourite does not overwrite the saved copy until you save it again.
- **Copy NPC** copies plain text. If clipboard access is unavailable, select the text or save a note instead. **Save as note** adds an editable, tagged Markdown note to the campaign library and Saved tools; add a Notes widget to display it.
- Every view of a generator shares its options, results and favourites. All data persists offline and is included in campaign duplication and ZIP backups. Existing schema-v4 installations upgrade to v10 with a recovery point, preserving their content packs and layouts.
- The pure TypeScript package `@nimble/generators` owns the name engine and extracted Sidekick tables. Sidekick's existing imports re-export the same API. It exports `NameGenerator`, `nameStyles`, `generateNpc`, `generateNpcs`, per-detail rerolls, result/options schemas and attribute tables. Optional random sources allow reproducible generation; custom name configurations and attribute tables work without a browser or network.

## NPC generator content packs

Open **NPC generator → Manage generators** from a tile, expanded view, or command palette. **New generator** creates campaign-owned tables; **Make campaign copy** starts from a built-in or imported generator. Edit a campaign generator, duplicate it, or confirm its removal. Select it under **Name style** before generating NPCs.

The editor supports **Name lists** (any, masculine, feminine, and optional surnames) and **Syllable patterns** using the shared Sidekick engine. Enter one name, fragment, pattern, or attribute per line. Repeated entries act as weights. Any first-name pools take precedence over gender pools; absent gender pools fall back to available names. Patterns use P/M/S for prefixes/middles/suffixes, with length and syllable-count constraints. All four attribute tables—appearance, scar/mark, mannerism, quirk—are editable. **Try generator** previews a result without saving; **Save generator** validates empty pools, entry limits, and impossible patterns before changing campaign data.

**Export generator pack** downloads all campaign generators as a standard <code>.slate-content.json</code> file with a chosen pack ID, name, and version. **Import / manage packs** uses the existing validated preview/install flow. Packs are immutable: publish edits under a new version. Enable or disable installed packs per campaign; disabled generators disappear from the selector, and tools retain their selection with a clear unavailable message. Imported tables can be adapted through campaign copies. Local generator packs omit an external source URL; imported packs can include an HTTP(S) URL and license metadata.

Generator records use <code>kind: "npc-generator"</code>; their <code>fields</code> contain <code>names</code> and <code>attributes</code>. List names use <code>{ mode: "list", firstNames: { any: [], male: [], female: [] }, surnames: [] }</code>. Syllable names use <code>{ mode: "syllables", config: NameConfig }</code>, with optional unisex/male/female/surnames pools. Attributes have <code>appearance</code>, <code>scar</code>, <code>mannerism</code>, and <code>quirk</code> arrays, each with at least one entry. Name entries and individual generated name parts are limited to 39 characters; attribute entries to 500 characters. Lists hold up to 2,000 entries, fragment pools up to 500, and patterns use 1–8 syllables. The usual 8 MiB content-pack input limit also applies.

Custom generated NPCs retain a validated snapshot of their generator tables. Rerolls use those original tables even after a generator is edited, removed, or disabled; changing selectors applies to the next generation. Tables, selections, and results persist in IndexedDB, campaign duplication, and offline ZIP backups. Existing built-in settings/results remain compatible; the v7→v8 storage upgrade keeps a recovery checkpoint and preserves disabled-pack choices. The shared library exposes <code>generatorDefinitionSchema</code>, <code>generateDefinedName</code>, and an optional third/fourth definition argument on <code>generateNpc</code>/<code>generateNpcs</code> without changing Sidekick's name API.

## Monster references and initiative search

Notes can @-mention monsters alongside rules, spells, items and other notes. Monster previews and pinned references show HP, level (including fractions), armor, size, movement, saves, family abilities, actions and legendary Bloodied/Last Stand descriptions. Action dice links use the shared roller.

The initiative tracker’s **Monsters** tab searches names, kinds, tags and ability text from the campaign and enabled packs. **Add** creates one enemy with copied HP, an unset initiative, and an independent statblock snapshot. Add again for another creature; each gets separate HP and an ID. **Combatants** returns to turn order, and **Statblock** opens the saved copy. Additions use the normal combat undo history and survive offline reload. Later edits to library records leave existing encounters unchanged. Legendary phases remain descriptive; they do not automatically change HP or turn rules.

**Manage monsters** opens the library filtered to monsters. Create a simple campaign monster with HP, level, armor and Markdown abilities, or make a campaign copy of a bundled monster and edit it. Existing content-pack import/export supports <code>kind: "monster"</code> records; <code>fields.hp</code> must be an integer from 1–99,999, and <code>fields.level</code> is a nonempty string (such as <code>"1/3"</code>). The remaining structured fields are armor, size, kind, movement, saves, legendary and minion. Full campaign backups include monster packs and combat snapshots.

The app includes an immutable **Nimble · GMG** pack, including the bestiary: 86 seeded monsters with inherited abilities from 11 families, plus 15 additional book-attributed monsters from the live catalog. The seeds are pinned to Nexus revision d8a939aa69752d92c05ba9760b60b2dadae07485, with a supplementary snapshot dated 11 October 2026. It is enabled in new campaigns. Schema 15 splits the old official bundles into Core Rules, GMG and Heroes and remaps saved references. The old rules bundle enables all three replacement packs; the old bestiary enables GMG. Campaigns with both sources disabled keep the new packs disabled. The converters preserve source attribution, full actions and legendary text; remote artwork remains source metadata. The live community catalogue is not downloaded during play.

## Items, compatible JSON and encounter import

**Click an empty cell → Item library** creates a persistent searchable item tile. The same tool is available through Alt+P / Cmd+P. Search names, tags and text; filter by item type and rarity; favourite records per campaign; create, edit, duplicate or pin an item. **Campaign library → Manage items** opens the same editor without placing a tile. Pack items are immutable; use **Copy** to customize one. Preview edits and tile edits update the same campaign record.

The item editor stores kind, Nexus rarity, Markdown description, additional information, tags/category, optional price/currency, inventory slots, damage, armor, uses capacity and up to 100 custom string properties. Empty price, slots and uses mean unknown; explicit zero is retained. These are item definitions, not owned stacks or remaining charges.

**Import / export content** validates a local JSON file up to 8 MiB before showing records, duplicate counts, encounter quantities and warnings. Supported shapes:

- Nexus JSON:API documents with one resource or a data array and optional included resources. Items, monsters, families and encounter monster relationship metadata are supported. Official seed documents may omit primary IDs when source metadata is present; Slate derives stable seed IDs, not live Nexus IDs.
- Nexus Nimbrew monster JSON with CR, hp, armor, speed, passives, grouped actions, and bloodied/laststand descriptions. This flattened format can lose structured damage and source identity; preview warnings describe that limitation.
- Slate records: <code>{ "format": "slate-records", "schemaVersion": 1, "records": [...] }</code>. This preserves complete fields and original source payloads. Versioned Slate content packs and complete campaign ZIPs remain supported separately.

Choose **Keep existing records**, **Replace matching records**, or **Import independent copies**. Imported IDs determine collisions. Copy remaps encounter and Markdown links together. Replacement is atomic, retains a recovery checkpoint and never changes active combat snapshots. Unknown source fields are preserved inside the exchange metadata. External images are disclosed and are not downloaded; packaged/embedded content remains the offline source.

Nexus imports and bundled reference content are made possible by [Nimble Nexus](https://nimble.nexus), developed by [byteslicer](https://nimble.nexus/u/_byteslicer). Slate credits the platform in the import screen, pack library and source previews. Imported records retain that developer credit separately from their individual creators, and Nexus import packs carry it in their source attribution so it survives sharing and offline use. Original publisher credits and licenses remain intact.

**Campaign library** has a prominent **Import / export content** button next to **Content packs**. **Nexus link** is the first, default import option. Paste a public `nimble.nexus` monster, hazard, item, encounter or collection page (JSON API URLs and old `nimble.monster/m/` links also work). **Preview Nexus import** fetches the content, full encounter monsters and inherited family abilities. Browse every incoming record, expand its full Markdown/statblock, follow references or try inline dice rolls without creating content or dice history. Nothing is stored until the final import button is pressed. Cancel, private/missing dependencies, malformed responses and interrupted downloads leave existing content unchanged.

Choose **Campaign content** for editable records with keep/replace/copy duplicate controls, or **Content pack** to name an immutable offline pack enabled for this campaign. Installed packs can be enabled in other campaigns and exported through **Content packs**. A local `.slate-content.json` file offers the same choice; installing retains its identity/version/assets, while campaign copies rewrite internal references and preserve referenced images, terms and attribution. The pack-tab uploader also previews every record and offers campaign copies (keeping existing matching records). Pack versions cannot overwrite different contents. Imports are bounded to 8 MiB; online imports also limit requests and dependency counts and can be cancelled. Fetching links needs internet access; saved content works offline. Public links only, with no account sign-in or publishing. External artwork remains source links and is not cached; remote rules/spells remain outside this link importer. Hazards use Nexus’s `monsters` resource type with `hazard: true`; `/hazards/…` links fetch through the monster API and retain their hazard source links. The library includes a hazard filter and labels hazards separately while keeping existing monster/encounter compatibility. Campaign-authored hazards can also be created through **Create content** and pinned or mentioned in notes.

**Optional hosted packs:** Open **Campaign library → Content packs → Available to install**. The **5.5e SRD 5.2.1 · 2024 rules** pack is served as a separate 2.8 MiB download, with 1,309 references including 339 spells, 12 classes and subclasses, backgrounds, species, equipment, magic items, glossary entries and monster statblocks. **Preview pack** downloads and verifies the file and previews its records; **Install content pack** saves it locally and enables it only for this campaign. Installed packs can be enabled separately in other campaigns, disabled, exported and included in campaign ZIP backups. Nothing is installed automatically. Refresh the catalog to retry a failed connection; interrupted, oversized, mismatched or corrupt downloads do not change local data.

The SRD is a reference library, with D&D spell details and full Markdown statblocks. Its 330 statblocks use the **monster** content type with explicit reference-only metadata. Already-installed first-version SRD packs and campaign copies also appear under the monster filter, preserving their original IDs and immutable pack data. The initiative search can preview these references but disables adding them, and the Nimble encounter builder excludes them; this pack does not add D&D encounter ratings or combat automation. Its optional `system` and `referenceOnly` pack metadata leave existing packs and saves valid. Original SRD attribution, the CC BY 4.0 link, conversion credit and pinned source-line provenance accompany the content. Ambiguous names are left unlinked rather than resolving into another system's content.

`public/content-packs/catalog.json` is the small server catalog; the versioned `.slate-content.json` file beside it is fetched only when previewing. Both are served by Slate's static host, and neither is part of the service-worker precache or native bundle. The Vercel headers allow public reads from native clients. Web builds default to the same-origin catalog. For native builds or a separate static content server, set `VITE_CONTENT_PACK_CATALOG_URL=https://YOUR-HOST/content-packs/catalog.json` before building; that host must allow cross-origin GET requests. Each catalog download must remain on its catalog's origin. No account or separate application backend is needed.

Rebuild deliberately with `npm run content:srd -w @nimble/slate`. The converter downloads only the [pinned your5e Markdown conversion](https://github.com/your5e/5e-srd-markdown/tree/f1f5060fd975aa2ffc3e4b336560ded479934d80/dnd/521), checks both source hashes, preserves all source prose/tables, creates stable record IDs and internal reference links, and writes the pack plus its size and SHA-256 catalog entry. `node scripts/build-srd-pack.mjs` reuses the downloaded files in ignored `work/srd/`. The generated files are committed so ordinary builds require no network. Changes to the published contents require a new pack version. The authoritative source is the [official SRD 5.2.1](https://www.dndbeyond.com/srd); its required attribution is retained in the pack and exports.

Exports support selected records or the campaign collection. **Preview export** lists omitted fields before **Download export**. Nexus item JSON cannot express Slate prices, slots, damage, armor, uses or custom properties. Unedited Nexus monsters retain structured actions and included families; authored or edited Markdown statblocks export their text as a description with explicit loss warnings. Nimbrew supports one monster at a time. Use Slate JSON for full record fields and campaign ZIP for packs, attachments, tool state and complete dependencies. No export publishes online.

**Initiative → Load encounter** imports or selects a saved encounter, inspects its description and quantity rules, selects party size, and optionally includes campaign PCs. Nexus encounter JSON files may include only mini-statblocks; import each full monster document, including referenced families, before starting. Pasted encounter links fetch those dependencies automatically. An incomplete draft is kept searchable but cannot start. Import full records using **Replace matching records** to resolve a draft.

Per-hero quantities resolve as quantity × party size / heroes per monster, rounded **up** to whole creatures with the fractional result displayed. A legendary monster or team resolves to one entry. Per-hero HP scales against the chosen party size. Teams create independently identified member combatants; hazards retain separate statblock snapshots without invented creature HP or armor. All creature and hazard limits are checked before replacing the run. A populated tracker requires explicit replacement; one combat undo restores it. Starting again creates fresh snapshots, while normal tracker state resumes after offline reload. Encounter title, description, party assumptions, annotations and composition can now be authored in the encounter builder. Difficulty estimates use the bundled GMG v1 guidance; wave scheduling remains future work.

Application schema **10** migrates existing schemas 1–9 transactionally with recovery, preserves disabled pack choices and accepts campaign ZIP schemas 2–10. Item favourites, tile filters, source payloads, encounter definitions, teams and hazards participate in campaign copies and backups. The physical IndexedDB schema remains version 3.

Compatibility behavior is grounded in the [Nexus item converters](https://github.com/dstrelau/nimble.monster/blob/main/lib/services/items/converters.ts), [monster converters](https://github.com/dstrelau/nimble.monster/blob/main/lib/services/monsters/converters.ts), [encounter converters](https://github.com/dstrelau/nimble.monster/blob/main/lib/services/encounters/converters.ts) and Nimbrew route. The official test fixture preserves four GMG records and included families from revision 40527955eb7c6f4a242d508586580401f9e0431c, with its original source license; synthetic fixtures cover teams, hazards, missing dependencies and future fields.

## Rules, spells and Markdown notes

The toolbar's book icon opens **Campaign library**. Search names, tags or full text, filter by type/category, open a preview, or pin a result to the current screen. **Click an empty cell → Content** adds Notes or an empty Reference widget. **Choose reference** switches a reference widget's content without deleting the old record.

- The three bundled Nexus packs contain **544 searchable entries**: 129 rule pages, seven spell-school references, 99 spells (including nine Hexbinder spells), 18 FAQs, 12 classes, 28 subclasses (including story subclasses), 27 ancestries, 31 backgrounds, three equipment tables, 89 items and 101 monsters. There are also 36 terminology entries/aliases and six offline diagrams. Class previews include all 20 levels and complete ability choice lists; subclasses link to their parent class. Everything can be previewed, pinned or mentioned in notes. The supplement adds 15 monsters, three ancestries and seven backgrounds absent from the seeds; older seeded variants remain available.
- The 89 item entries comprise all 77 equipment-table rows and 12 public items explicitly attributed by Nexus to official Nimble books. Original edition labels remain visible: rule prose identifies Core Rules v2 and GMG v1; the equipment tables identify **Core Rules 3.0**. These sources are not silently combined into one rules edition. The source revision is `d8a939aa69752d92c05ba9760b60b2dadae07485`, with the live item snapshot captured on 11 October 2026. Community-only content and third-party SRD items are excluded from the default bundle.
- Notes support safe Markdown, tables, task lists and code blocks. Type **@** to open a search dropdown beside the text cursor. Keep typing to filter campaign content and installed references; use ↑/↓ and Enter/Tab, or click a result. Escape dismisses suggestions without closing the note. The dropdown stays within the viewport, including in small tiles and command-palette notes. Notes save on every change through the existing save/retry workflow. Read mode shows clickable references; **Note details** renames, tags, exports or deletes the note.
- References support click/tap/keyboard previews, back navigation within one preview, sources, related rules, backlinks, section selection and pinning. Renaming campaign content keeps its links. Deleted or missing targets retain a readable label. Removing a note widget keeps the note available under Saved tools.
- **Create content** makes a campaign rule, spell, item or monster reference. **Make campaign copy** preserves source information and spell fields while allowing local title/text/tag edits. Items have a structured editor through previews or **Manage items**. **Import / export content** supports Nexus JSON:API, official seed JSON, Nimbrew monsters and complete Slate record JSON. **Load encounter** in initiative imports and instantiates saved encounters.
- Dice links in rules use `@nimble/dice` and retain the result in the campaign's first saved dice tool (creating one if needed). Attribute placeholders must be replaced with numbers in the dice tool; unsupported notation is reported, never silently substituted.
- **Content packs** imports/exports `.slate-content.json` files. Import previews the name, version, record/image counts and attribution, then installs atomically. Maximum input is 8 MiB, with 3,000 records and 100 embedded raster images per pack. The same pack/version cannot overwrite different content. New versions coexist; existing references retain their original version.
- The app installs its bundled packs locally on first launch. Schema 15 reorganizes the previous bundled versions into Core Rules, GMG and Heroes in browser IndexedDB, native SQLite and older campaign ZIPs, remapping notes, pins, copied-content origins, favourites, encounters and combat snapshots/undo. Campaign edits are preserved; source opt-outs are mapped to the replacement book packs. Storage upgrades retain the original in a recovery checkpoint and retire the old active versions atomically. Custom pack versions remain unchanged. Packs are shared immutable records in the IndexedDB `packs` store; campaign notes/custom content and enabled pack keys remain in application state. Backups include enabled pack data and images, and do not require a subsequent download.

Portable references are standard Markdown links: `[Label](slate:<percent-encoded-target>)`. Targets are `local::<record-id>` or `<pack-id>@<version>::<record-key>`, optionally followed by `#section-anchor`. The label remains readable in other Markdown tools. **Export Markdown** preserves these links; a campaign ZIP is the complete portable export including dependencies.

Imported content never executes MDX, scripts or raw HTML. The renderer supports safe Markdown links and embedded pack raster images; remote images are shown as unavailable instead of being fetched. Source links open only when explicitly selected.

### Rebuild the Nexus pack

The bundled JSON is generated from a pinned Nexus checkout, with no runtime API dependency. From `apps/slate/`:

```sh
node scripts/build-nexus-pack.mjs /path/to/nimble.monster d8a939aa69752d92c05ba9760b60b2dadae07485 src/content/nexus-official-items.json
node scripts/build-nexus-monsters.mjs /path/to/nimble.monster d8a939aa69752d92c05ba9760b60b2dadae07485
node scripts/build-nexus-supplement.mjs src/content/nexus-official-supplement.json
```

Use a checkout at the supplied revision. The converter reads `data/rules/*.mdx`, terms, relations, FAQs, literal category metadata, **every JSON file in `data/official`** and referenced images. It resolves rule/dice/term/school links, checks dependencies and rejects unhandled MDX or unknown official resource types. It parses category literals without executing upstream TypeScript. Equipment rows become individual items as well as complete Markdown tables. Original structured definition attributes and source attribution remain in each record. Output is `src/content/nexus-core.json`, `nexus-monsters.json` and the audit manifest `nexus-conversion.json`, which records file hashes, coverage, per-kind counts, item sources and conversion warnings.

The checked-in `src/content/nexus-official-items.json` and `nexus-official-supplement.json` make rebuilding reproducible without querying the live service. To refresh deliberately, run `node scripts/fetch-nexus-items.mjs src/content/nexus-official-items.json` and `node scripts/fetch-nexus-supplement.mjs /path/to/nimble.monster src/content/nexus-official-supplement.json`, then run all three build scripts above. The read-only fetchers require Playwright's Chromium, or set `SLATE_BROWSER_CHANNEL=msedge` to use installed Edge. They enumerate public official-book source filters and follow pagination. The item snapshot checks captured IDs/names against visible results; the supplement compares published definitions with the seeds and fetches full monster JSON with included families. Classes, subclasses and spell schools are audited from the server-rendered lists; equipment tables are supplied by the official seed files. Content, book attribution and contributor display names are retained; account identifiers are omitted. `build-nexus-supplement` bundles Slate's own compatibility adapter into ignored `work/` and validates all supplementary records before writing the packs. Runtime play never contacts Nexus unless the GM explicitly previews a pasted Nexus import link. After updating data, run the unit and browser tests, build, and `npm run cap:prepare -w @nimble/slate` from the repository root to copy the new offline bundle into both native projects.

Two conversions are recorded: the interactive advantage example becomes explanatory text, and the undefined “Riding” term stays readable text. Original rule prose, sources, variant relationships and spell attributes otherwise remain represented in the pack. Attribution is available in previews and the pack manager. Vault is not used.

## Campaigns, attachments and backups

Open the campaign name in the toolbar. **Campaigns** manages the campaign lifecycle; **Attachments** stores local files; **Backup & recovery** imports and exports backups and restores recovery points.

- **Duplicate** creates new IDs, remapping tool placements, combatants, active turns, undo history, rolls, presets and attachments. It makes the copy active without changing the source.
- **Archive** keeps all data and selects another active campaign if available. With no active campaigns, Slate offers create, restore or import. An empty library is not mistaken for first launch.
- **Delete** requires typing the campaign name. It removes that campaign, its attachments, and any local recovery points containing it. Previously downloaded files are unaffected.
- **Export** downloads a complete single-campaign ZIP with tools, grid placements, combat state/history, roll history/presets and attachment bytes. Device appearance is excluded. Attachment limits are 10 MiB each, 100 files and 64 MiB total per campaign.
- **Import** validates the entire ZIP and previews its contents before writing. The default creates a separate campaign with new IDs. **Restore original campaign** preserves IDs; if those IDs already exist, explicitly confirm replacement. Restored campaigns become active, including backups of archived campaigns.
- Replacement saves a recovery point in the same transaction as the new data. **Restore snapshot** replaces the entire local library and settings with that snapshot and first snapshots the current state. The five latest recovery points are retained. They are local copies, not external backups.

If startup cannot open local data (including **Campaign content pack is missing**), the recovery screen offers **Export original data**, **Try again**, and **Reset local data**. Export keeps the original state, available packs and attachment bytes in a diagnostic recovery ZIP. Reset requires **Delete local data and start over** confirmation: it clears the active local workspace, including campaigns, custom content, installed packs, attachments and recovery points, then creates a default campaign with bundled official content. Downloaded backups and the offline app installation are retained. A failed reset write rolls back; close other Slate tabs if database recreation is waiting. The controls work independently of campaign validation, including malformed state and unsupported browser database versions. Native SQLite reset also bypasses unreadable envelopes and does not re-import the legacy WebView workspace.

Schema 16 upgrades now hydrate packs from their separate storage before migrating, preserving campaign IDs, content and imported packs. This fixes an upgrade path that could falsely report a missing pack; updating Slate can resolve that error without a reset. Genuinely missing custom packs still stop startup so data is preserved until the GM explicitly chooses recovery or reset.

Backup format v1 contains a manifest identifying campaign schema v13, creation time, campaign and pack SHA-256 checksums, and attachment paths; campaign JSON holds each attachment's metadata and checksum. Schema-v2–v12 campaign ZIPs remain importable, gaining the new screen, content, and empty party fields as needed. Schema-v4–v13 ZIPs include packs.json and require its checksum. Import rejects unsupported versions, duplicate/unexpected paths, missing assets, bad checksums and malformed references before committing. ZIP input/expanded size is bounded to 128 MiB, campaign JSON to 20 MiB, and manifests to 64 KiB. SHA-256 detects corruption, not publisher authenticity. No remote assets are implied or silently fetched.

Existing schema-v1–v12 installations upgrade transactionally to v13. Upgrades preserve pack selections, including disabled packs since v7, and retain a recovery checkpoint before adding newer record formats. The IndexedDB object-store version is now 3 with a dedicated packs store; application records have their own schema version. The original state is retained in a recovery point; a failed migration leaves the original untouched. The load-error screen offers **Export original data**, a raw recovery ZIP for repair (not a normal campaign backup). Failed saves retain in-memory edits with retry and emergency JSON export; those snapshots are also distinct from the validated campaign backup format.

## Checks

```sh
npm run build -w @nimble/dice
npm run build -w @nimble/generators
npm run typecheck -w @nimble/slate
npm run lint -w @nimble/slate
npm run test -w @nimble/slate
npm run build -w @nimble/slate
npm exec -w @nimble/slate -- playwright install chromium
npm run test:e2e -w @nimble/slate
```

Browser tests start a production preview automatically. The additional `npm run test:e2e:dev -w @nimble/slate` checks start a development server with React StrictMode enabled and cover tool configuration, placement, combatants, nested previews and toolbar popups. To use an installed Edge browser instead of downloading Chromium, set `SLATE_BROWSER_CHANNEL=msedge` in your shell before running the tests. For PowerShell: `$env:SLATE_BROWSER_CHANNEL = 'msedge'`.

Tests additionally cover v1/v2/v3 migration and failed migration rollback, deletion of the last campaign, ID remapping across combat history, attachment checksums, malformed/oversized ZIPs, restore conflicts, atomic quota failures, and recovery-point restoration. A browser test exports combat, rolls and an attachment, restores them in a fresh offline installation, reloads and compares the results.

Screen tests cover shared records across views, independent layouts, bounded undo/redo, fresh tools from presets, old ZIP migration, multi-screen backup round trips, tool configuration and replacement, catalogue search, and keyboard placement offline.

Tests cover cell collision and bounds, turn transitions, undo snapshots, shared dice results, persisted state, concurrent-tab conflicts, campaign isolation, offline reload, themes, and pointer drag/resize. Content tests cover source-link resolution, pack immutability, checksummed dependency backups, campaign copy remapping, offline rule/spell/diagram previews, keyboard reference insertion, renaming, safe rendering, and mobile preview focus. Browser screenshots and traces are written to ignored test output folders.

### Direct UI and snapshot tests

`e2e/ui.spec.ts` drives the production app through visible controls, with a fresh browser context for each test. It compares screenshot baselines and full accessibility trees for the desktop dashboard, populated initiative/dice tools, placement collision messages, tool configuration, library search, spell previews and pinned references, Markdown notes with keyboard @ suggestions, offline diagrams, campaign management, and mobile/dark layouts. It also verifies persistence, offline reload, undo/redo, keyboard submission and preview focus return. These snapshots complement the existing browser workflows; they are assertions, not just screenshots saved as artifacts.

From the repository root, build Slate first, then run:

```sh
npm run test:ui -w @nimble/slate
npm run test:e2e -w @nimble/slate
```

`e2e/generator-packs.spec.ts` covers list and syllable editing, validation, portable pack downloads/imports, conflicts, campaign enable/disable, saved table snapshots, offline reload, and light/dark responsive editor snapshots. The nested editor is also checked against React development effect replay.

`e2e/npcs.spec.ts` additionally covers individual rerolls, batch generation, favourites, clipboard output, Markdown note creation, shared/expanded views, offline persistence and a fresh offline ZIP restore. Its reviewed light/dark desktop and mobile snapshots check the generated NPC and its controls.

The UI suite fixes its viewport, locale, timezone, wall-clock time and dice randomness, uses reduced motion, waits for local saving/offline readiness/fonts, and fails on uncaught browser errors. Timers, the real shared dice engine, service worker and IndexedDB remain active. Screenshots allow at most 80 changed pixels with Playwright's default perceptual threshold; text/controls are additionally checked through complete accessibility snapshots. This checks rendered roles and labels, not full accessibility compliance.

Reviewed PNG baselines are in `e2e/snapshots/win32/msedge/ui.spec.ts/`; use Windows with `SLATE_BROWSER_CHANNEL=msedge` to compare them. Accessibility baselines are in `e2e/snapshots/aria/ui.spec.ts/` and are platform independent. PNG paths separate operating system and browser channel because fonts and rendering differ. Other environments fail on missing baselines until they are explicitly generated and reviewed; the default run never creates or accepts snapshots.

For an intentional UI change, use the same browser/OS as the baseline:

```sh
npm run test:ui:update -w @nimble/slate
npm run test:ui -w @nimble/slate
```

Review the PNG and accessibility `.yml` changes before keeping updated baselines, and commit them with the tests when ready. The update command replaces all UI baselines for the current environment; it does not replace behavioral assertions. Failed comparisons put actual/expected/diff images and traces in ignored `test-results/`. Open a trace with `npm exec -w @nimble/slate -- playwright show-trace <trace.zip>`. The full browser command includes the UI/snapshot suite automatically.

## Native storage and packaging (Milestone 6)

Android and iOS projects are in `android/` and `ios/`. Their source configuration is retained; copied web assets, SDK paths, signing keys and build outputs are ignored. `capacitor.config.ts` uses the local `dist` bundle and no remote server. The working application ID is `app.nimble.slate`; change it consistently in the configuration and platform projects before distribution.

The native backend uses [Capacitor Community SQLite](https://github.com/capacitor-community/sqlite) for both campaign records and immutable attachment bytes. Images are deduplicated by SHA-256; state and the five retained recovery points reference those bytes. Save, restore, migration, revision checking, checkpoint creation and unreferenced-byte cleanup share one SQL transaction. A save is reported complete only after commit. Disk-full, checksum, malformed-data and migration failures preserve the prior state; the app does not silently fall back to WebView storage or reset campaigns.

On first native storage initialization, existing WebView IndexedDB campaigns, installed packs, attachments and recovery points are copied and validated transactionally. The source database remains unchanged, and a migration checkpoint retains the original. Subsequent launches use SQLite; failed migrations leave the original available through the emergency recovery export. Uninstalling the app can remove its local database; portable ZIP backups remain necessary. Unreadable native envelopes can be exported verbatim with their encoded attachment rows for diagnostic recovery; they are not ordinary campaign backups. Large campaign/recovery snapshots and bridge memory usage still need device performance validation.

Imports use the [Capawesome system file picker](https://capawesome.io/docs/sdks/capacitor/file-picker/) and immediately copy selected bytes into the same validation/preview flow used on the web. Selecting or cancelling does not change a campaign. Native exports use [Filesystem](https://capacitorjs.com/docs/apis/filesystem) cache files and [Share](https://capacitorjs.com/docs/apis/share) to offer the system save/share sheet. Unique export paths avoid overwriting an active share; the OS may evict those temporary copies. Android sharing is restricted to the export cache directory. The iOS file-timestamp privacy manifest is included in the Xcode resources. Rules, bestiary, fonts and interface assets are bundled, and native builds skip the browser service worker.

From the repository root:

```sh
npm ci
npm run cap:prepare -w @nimble/slate
npm run cap:android -w @nimble/slate
```

`cap:prepare` builds the shared packages and Slate, synchronizes both platforms, then checks that every copied native asset matches the production bundle and that neither configuration points to a remote server. `cap:sync` stages the app without optional hosted content packs before invoking Capacitor; `cap:verify` also checks those downloads were excluded. It deliberately does not claim SDK or device validation. Use these npm scripts instead of calling `cap sync` directly.

Follow the [Capacitor environment guide](https://capacitorjs.com/docs/getting-started/environment-setup) for supported Java/Xcode versions.

Android: install Android Studio and the SDK specified in `android/variables.gradle` (currently compile/target SDK 36, minimum 24), configure the SDK path locally, and use the Gradle wrapper or Android Studio to assemble/install. From `apps/slate/android`, run `./gradlew assembleDebug` on macOS/Linux or `.\\gradlew.bat assembleDebug` on Windows. A signed release needs the intended app ID, signing configuration, version and release assets.

iOS: on macOS with Xcode, run `npm run cap:prepare -w @nimble/slate`, then `npm run cap:ios -w @nimble/slate`. The generated Xcode project uses Swift Package Manager. Choose a development team/device and build the App scheme. Keep the app identifier stable when testing an upgrade, and increment the build number. Signing and store publication are separate steps.

Dependency review patched Slate tooling’s brace expansion, URI parsing and source-map packages within supported ranges. The workspace audit still reports existing advisories, including the Capacitor CLI’s transitive Xcode/UUID dependency. No breaking audit fixes were applied to unrelated apps; review the lockfile audit before release.

### Release verification and remaining device gates

`npm run test:a11y -w @nimble/slate` scans both palette families and light/dark modes with axe, checks keyboard focus wrapping/restoration and touch targets. `test:release` injects a storage failure, retries offline, and installs a genuinely waiting service worker on an isolated local server: updates remain disabled while changes are unsaved, then activate without losing the campaign. The complete browser suite includes both. Use `SLATE_BROWSER_CHANNEL=msedge` for the reviewed Windows screenshot baselines. Unit tests use Node's SQLite engine to check actual file reopen, transaction/commit failure rollback, stale writes, migration, corrupt bytes, recovery-point attachment retention, and native/web ZIP compatibility; native file adapters are tested with mocked plugin calls. These checks do not replace assistive-technology or physical-device testing.

Verified on this Windows host: web build/lint/unit/browser checks; generation and synchronization of both platform projects; matching offline bundles. Android SDK/Studio/adb are not available, and iOS compilation requires macOS/Xcode. APK/IPA compilation, signing and all device checks below are **pending**. Milestone 6 is not release-approved until those results are recorded.

For each supported Android/iOS device and OS version, record the build/version, device/OS, result and exported backup:

1. Install the bundled build, enable airplane mode before its first launch, and open rules, spells, monsters and every utility without network access.
2. Create a party, notes with references, combat, running/paused timers, custom packs and near-limit attachments. Force-close/reopen, reboot, suspend/resume and rotate; verify values and attachment checksums.
3. Upgrade the installed app without uninstalling. Check existing native data and an older WebView workspace migrate once; verify the recovery checkpoint and source preservation.
4. Exercise local/cloud-provider file picking, cancellation, malformed/oversized imports, the save/share sheet, cancellation and export failure. Save ZIPs outside the app; restore native-to-web and web-to-native offline, comparing party, combat, references, packs and image bytes.
5. Test storage exhaustion and interruption during save/restore/update. Reopen and verify either the old or complete new transaction, never partial state; retry or export original recovery data. Test missing/corrupt attachment reporting and restoration from an external backup.
6. Check VoiceOver/TalkBack, keyboard/switch navigation, larger text, theme contrast, touch placement/popups and safe areas in both orientations. Measure large-workspace save latency and export memory usage on the lowest supported hardware.

Encounter composition is delivered in Milestone 7 below. Difficulty estimates and legendary phase/turn handling are implemented; wave scheduling and VTT integrations remain future work.

## Current boundaries

The broader [specification](SPEC.md) remains the roadmap. Wave scheduling, automatic resolution of monster abilities, VTT adapters and native platform/device validation remain future work. The emergency JSON download shown after a save error is a recovery snapshot; the campaign ZIP workflow above is the supported backup/restore path.

Browser storage can be cleared or evicted. Export campaign backups regularly; local recovery points share the same device storage and cannot recover data after that storage is cleared.

The static architecture follows [Vite's guide](https://vite.dev/guide/); the service worker uses [Vite PWA](https://vite-pwa-org.netlify.app/guide/), and the native wrapper follows [Capacitor configuration](https://capacitorjs.com/docs/config). [Compatibility research](COMPATIBILITY.md) records the Nexus formats and existing repository code to reuse as further tools are added.

## Milestone 7: Encounter builder

Open **Campaign library → Manage encounters**, or **Initiative → Load encounter**. Choose **New encounter** to author a campaign definition without a JSON import. Search full statblocks from campaign content and enabled offline packs, filter creatures/teams/hazards, preview them, and add up to 100 composition rows. Each row has its own stable ID; repeated statblocks are supported. Remove/reorder rows, enter a fixed quantity or a quantity per N heroes, and set default party size, party level, Markdown description and GM annotations.

The live preview uses the existing Nexus-compatible quantity semantics: fractions round up; each legendary creature/team row resolves to one; per-hero HP scales with party size; team members count individually; hazards count separately. It identifies missing full statblocks/families, scaled HP above 99,999, and totals above 100 combatants or 100 hazards. Party level is the average hero level and drives the difficulty estimate; **Use campaign party levels** fills the exact average and party size from PCs. Empty, incomplete and over-capacity definitions can be saved as drafts, but cannot start until their actual resolved composition is valid.

**Save encounter** writes the definition to this campaign; **Cancel** leaves it unchanged. **Edit encounter** changes a local definition, **Duplicate encounter** creates independent definition/row IDs, and **Edit campaign copy** preserves an immutable pack source. Imported fields, extensions and provenance are retained. Deletion requires confirmation, leaves existing combat snapshots intact, and may leave missing references to the deleted definition.

From **Load encounter**, choose party size and whether to include campaign PCs. The preview counts those PCs against the combatant limit. Starting a populated tracker requires explicit replacement and makes one undo step. Starting again creates fresh combat snapshots; editing/duplicating/deleting a saved definition never modifies a live run. Each saved definition survives offline reload, campaign duplication and complete ZIP backup/restore. These encounter fields were introduced within schema 10; schema 11 also consolidates counters.

Use **Import / export encounters** for the existing Slate record and Nexus JSON:API exchange. Include referenced custom statblocks when exporting record JSON; pack references require the matching enabled packs. For complete portable campaign content, use the campaign ZIP backup, which includes packs and attachments. Nexus export warns about reduced metadata; it is interchange, not authenticated publishing to Nexus.

Verification covers authoring/duplication, quantities and limits, fresh combat/undo, persistent drafts, campaign copies and ZIP/JSON round trips. Direct Playwright tests exercise the actual editor, nested statblock previews/focus, offline reload, party inclusion, confirmed deletion and desktop/mobile theme snapshots, with automated accessibility scans. Native asset bundles must be synced after rebuilding; SDK builds and physical-device release acceptance from Milestone 6 remain pending.

### Counter

Add **Counter** to a tile or open it from the command palette. Use **−**, **+** and **Reset** manually; reset returns to its configured starting value. **Configure tool** sets the current/starting values, step size, optional unit, bounds and target. Values retain six decimal places. Targets are reached when crossing them from the starting value, in either direction.

Choose **Linked tracker**, **Combat trigger** (each Next turn or each new round) and **Automatic change** (increment or decrement). Both manual and automatic changes use the step size and clamp to bounds. Beginning/resuming combat and reloading never change a counter. Pause/resume linkage on the counter without disabling manual controls. Combat undo reverses only the actual linked change and preserves subsequent manual adjustments within bounds. Saving configuration or resetting starts a new counter history, so older combat undo does not alter it. Missing or deleted trackers do not trigger updates. Clock, stopwatch and real-time countdown modes share the Clock & timer widget.

### Clock & timer

Add **Clock & timer** to a tile or open it in the command palette. Three icon buttons select **Clock**, **Timer** or **Stopwatch**; the selected mode is highlighted. Clock shows the device's local time, with 12/24-hour format in Configure. Timer and stopwatch have compact start/pause and reset buttons. Timer also has **+1m**, restart on expiry and an acknowledgement button. Running modes have a small indicator, and an unacknowledged timer expiry remains visible in other modes.

Switching modes never resets or pauses their independent state. Both running tools reconcile time after closing or suspending the app. Editing the name or clock format preserves both tools. Changing the timer duration resets only the countdown; setting a future local deadline selects timer mode and starts it. Expiry is visual and silent. Reset affects only the selected timer/stopwatch.

Schema 12 migrates saved Stopwatch and Countdown timer tools into this single type, retaining IDs, names, running/paused values, deadlines, acknowledgement, placements, layout history and presets. Schema 11 counter settings and combat undo remain unchanged. Original data is retained in a recovery checkpoint in browser and native storage; older campaign ZIPs are also supported.

## Encounter difficulty and legendary combat

The builder and encounter loader show the rating and the level totals behind it. Ordinary monster levels (including fractions) are summed using resolved quantities and compared with total hero levels. The baseline is the bundled **Nexus Core v2 / GMG v1**, not the October 2026 second-printing playtest. [GMG difficulty guidance](https://nimble.nexus/rules/encounter-difficulties) gives landmarks: Easy below 50%, Medium around 75%, Hard at 100%, Deadly above 100% through 125%, Very deadly at 150% or more. Gaps show ranges. Resource depletion, terrain, abilities and tactics still require GM judgment.

A [legendary solo or team](https://nimble.nexus/rules/legendary-monster-builder) compares its printed level once with average hero level: equal is **Hard solo**, lower **Easier solo**, higher **Harder solo**. Minions add qualitative pressure without an invented numerical budget. Missing/unknown levels, hazards, minion-only encounters and mixed/multiple legendary groups display **Unrated** and explain why. An unrated estimate alone does not prevent a valid encounter from starting. When including a campaign party with the chosen matching headcount, the loader uses its actual level average; otherwise it uses the saved encounter assumption.

Legendary monsters [act after each hero](https://nimble.nexus/rules/running-legendary-monsters). **Next turn** inserts a visible action step; **Complete legendary action** resumes the next ordinary combatant. Allies and followers do not trigger actions. A team shares one action per hero and lets the GM select the acting member. Separate legendary instances each get their own action. Their ordinary initiative slots are omitted while living heroes remain; without heroes, living monsters use the normal order so combat can still proceed. Round rollover waits for the final hero's pending actions. Linked turn counters include completed legendary actions; round counters tick at rollover. Pause, undo, campaign copies and complete backups preserve the pending action queue.

Bloodied activates at the statblock's declared threshold, otherwise half maximum HP rounded down, and remains active after healing. At 0 ordinary HP a legendary monster enters **Last Stand** and remains eligible to act. Unambiguous printed extra-damage pools initialize automatically; subsequent damage/healing controls change that separate pool, and zero marks it defeated. Phase text stays visible for GM resolution. Set normal HP and Last Stand remaining HP directly from the combatant editor; **Legendary monster settings** can override thresholds, pools, phase and legendary status. Healing alone does not restart a defeated monster or undo a phase.

Unusual Last Stand effects (such as spawning minions), action restrictions, transformation and reaction triggers remain manual. Unknown pools show **?**, disable numerical damage controls and prompt the GM to enter a pool or mark the monster defeated after resolving its text. Damage that enters Last Stand starts its declared pool; apply any excess damage manually according to the statblock. No special effect or damage carryover is guessed. Imported canonical **lastStandHpPerHero** scales explicitly with party size; bundled GMG v1 pools remain fixed.

Schema 13 adds optional combatant phase state and a resumable legendary action queue. Existing live runs and undo snapshots upgrade with an original recovery checkpoint, without advancing combat. Old monsters already at 0 HP have unknown remaining Last Stand HP rather than receiving a refilled pool; review their phase settings. Legacy team snapshots did not store group identity: reload a saved encounter to establish team groups before restarting combat. Existing browser IndexedDB and native SQLite storage engines are retained. Unit/storage tests and direct Playwright tests cover ratings, phase transitions, shared team actions, special-effect review, offline reload and undo; screenshots and accessibility scans cover the visible controls.

The library Content source filter lists Campaign content and each enabled pack by name. Official content is organized into **Nimble · Core Rules** (350 entries), **Nimble · GMG** (144 entries, including the bestiary) and **Nimble · Heroes** (50 entries). Hexbinder supplements are grouped with Heroes, and supplementary weapons with GMG; printed source attribution is retained. Imported packs appear individually. Pack selection combines with text, type and category filters; changing source resets the category. Packs can be enabled, disabled and exported independently in Content packs. Cross-book references require the destination pack to be enabled. The library supports 24 installed packs so splitting a formerly full library retains all custom packs.
