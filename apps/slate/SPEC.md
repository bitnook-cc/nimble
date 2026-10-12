# Slate GM Screen Specification

Status: Draft for feature and behaviour review  
Updated: 11 October 2026  
Working title: Slate  
Repository location: `apps/slate/`

Slate is a TypeScript, offline-first GM screen for Nimble RPG. It helps a GM prepare and run an in-person session using a flexible dashboard of draggable, resizable tiles. Campaigns own custom content, references, layouts, and ongoing session state. The application must work as an installable web app and be suitable for packaging with Capacitor for fully offline Android and iOS use.

Implemented slices include the app skeleton, configurable cell grid, dice roller, manual initiative tracker, campaign backup/recovery, and named screens with shared tools. See README.md for its current capabilities and limits. Confirmed requirements record the product decisions already made. Proposed defaults make the intended behaviour concrete but remain open to revision. Acceptance criteria describe future implementation checks, not tests that have already passed.

## Product principles

1. Keep attention on the table. Frequent operations should be visible, quick, and easy to undo.
2. Make offline operation the normal path. Running a prepared session must not require an account, server, or connection.
3. Make campaigns the organizational boundary for all custom content.
4. Let the GM arrange the tools they need. Widgets share a consistent tile shell but retain suitable controls for their function.
5. Preserve content and provenance. Importing, editing, exporting, and reimporting must not silently discard information.
6. Reuse the repository's dice engine and suitable existing models and components.
7. Keep future integrations optional. A VTT connection must not become a dependency of local play.

## Scope and decision status

| Feature                                                                        | Status                    | Scope                                                                                             |
| ------------------------------------------------------------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------- |
| TypeScript app, persistent offline storage, PWA, Capacitor packaging           | Confirmed                 | Web, Android, and iOS architecture; packaged native app works offline from first launch           |
| Freely arranged draggable and resizable tile dashboard                         | Confirmed                 | Desktop and tablet primary use, responsive mobile access                                          |
| Campaign ownership and automatic default campaign                              | Confirmed                 | All custom content belongs to a campaign                                                          |
| Campaign party and PC prepopulation                                            | Confirmed and implemented | Simple local PCs, stable identity, offline backups, future Sidekick adapter                       |
| Initiative tracker                                                             | Confirmed                 | Persistent combat state; exact Nimble automation requires rule validation                         |
| NPC name generator                                                             | Confirmed                 | Offline generation and saving useful results                                                      |
| Markdown notes with references and popup previews                              | Confirmed                 | Rules, spells, items, and extensible reference types                                              |
| Nimble monster statblocks                                                      | Confirmed                 | Nexus-compatible representation and import support                                                |
| Item database, editor, import and export                                       | Confirmed                 | Campaign content with loss-aware exchange formats                                                 |
| Pinned Markdown references                                                     | Confirmed                 | Locally available content                                                                         |
| Encounter import                                                               | Confirmed for V1          | Import, inspect, and instantiate an encounter in the tracker                                      |
| Encounter builder                                                              | Composition delivered M7  | Campaign authoring, quantities, scaling, previews and reusable encounters; difficulty delivered; waves deferred |
| Dice roller using the existing library                                         | Confirmed                 | Reuse `@nimble/dice`                                                                              |
| Random tables, counters, timers, image cards, checklists                       | Confirmed                 | Every tool can be added as a tile                                                                 |
| Clean minimalist appearance with themes, dark mode, and a slight fantasy touch | Confirmed                 | Sidekick is the visual reference                                                                  |
| Future VTT roll delivery                                                       | Confirmed extension point | Specific VTT adapters are deferred                                                                |
| Multiple screens, layout presets, global search, undo and recovery             | Proposed V1               | Foundational convenience and reliability features                                                 |
| Rich NPC profiles, journal templates and backlinks                             | Proposed V1               | Lightweight support for session continuity                                                        |
| Shops, treasure parcels, shared stash and treasury                             | Candidate features        | Discussed, but not yet committed to V1                                                            |
| Cloud sync, player sharing, multiplayer, fog of war, character builder         | Future candidates         | Outside the proposed V1 scope                                                                     |

The sections below specify confirmed features and proposed supporting behaviour. Candidate features remain explicitly separate from the release commitment.

## Campaigns and first launch

### Ownership

Every custom note, NPC, monster, item, reference, random table, checklist, counter, saved roll, attachment, encounter definition, and combat run has a campaign owner. Screens and tile configurations belong to that same campaign.

Bundled reference content may be installed once as immutable content packs. Campaigns select the packs and versions they use. An annotation or edited copy belongs to the campaign; changing it never changes another campaign's content. There is no implicit global library of custom content.

Proposed defaults:

- Create a campaign named `My Campaign` on first launch, with a stable local ID.
- Open a starter screen containing initiative, session notes, dice, and a reference tile with a useful empty state.
- Do not require a setup wizard. Renaming and customization are available immediately.
- Remember the last campaign and screen between launches.
- Theme and accessibility preferences belong to the device, while saved roll presets and session history belong to the campaign.
- Offer create, rename, duplicate, archive, restore, export, and delete operations.
- If no active campaign remains, offer to restore an archived campaign or create another. First-run creation must not recur simply because an existing database temporarily failed to load.

### Copying and deleting

Copying content to another campaign creates new local IDs and rewrites references between copied records. The user can include referenced dependencies or retain explicitly unresolved references. Original source IDs remain provenance, not local ownership.

Duplicating a campaign copies its content and layout. It must not carry active VTT connections or make external sends. An imported backup defaults to a new campaign unless the user explicitly chooses restore or merge.

Removing a tile does not delete its underlying content. Deleting content shows where it is referenced, offers recovery, and leaves a readable missing-content marker in notes or tiles. Archive is reversible; permanent campaign deletion is a separate explicit action.

### Sessions

A proposed lightweight session record groups a title, date, notes, roll history, and combat runs. Starting or ending a session does not reset the campaign or delete unfinished combat. Session management is optional during play; tools remain usable without an active session.

## Dashboard and tile behaviour

### Screens and layouts

Each widget occupies one or more grid cells, with any number of instances of a widget type. Cells define placement and size; they are not independent copies of a widget. Campaigns can have named screens such as Exploration, Combat, and Town. Screens can be duplicated or created from presets.

The dashboard is a configurable grid of tiles, where each tile is a cell. Widgets are placed onto the grid and may span multiple rows and columns. Every widget occupies a rectangular whole-cell footprint, down to one cell; there are no tool-specific minimum cell spans. Each widget type declares a minimum usable pixel width/height. If either actual tile dimension is smaller, render a compact placeholder instead of its full controls. The placeholder opens the expanded tool; in Arrange mode it supports drag and resize. Arrange mode is the only way to move and resize widgets, using pointer handles or arrow keys; there are no numeric placement menus. Shared saved tool data remains intact when switching between placeholder and full view. Moving and resizing snap to cell boundaries. Overlap and placement outside the configured grid are rejected without moving other widgets. The GM can configure column and row counts as grid resolution. All columns and rows evenly divide the full viewport below the title bar, with compact gutters and no page scrolling. Cell dimensions scale with the viewport; there is no fixed pixel height setting. Shrinking a grid cannot silently remove or clip widgets. Existing backups with fixed cell heights remain importable; those obsolete heights are ignored.

Provide an explicit `Arrange` mode. Normal play allows editing widget content while keeping tile positions locked. In Arrange mode, headers become drag handles and resize controls appear. Saving a layout happens automatically after a completed gesture; layout changes can be undone.

Each tile shell provides a title, an icon-only Configure button in the header, widget-specific primary actions, settings menu, expand, and remove. Expanded and command-palette widget headers provide the same Configure button, with an accessible label and tooltip. Configuration opens a dialog and returns focus to its opener when closed; it does not occupy space in the widget body. Widgets always display their content within their reserved grid footprint. Expanded mode temporarily fills the working area, then restores the original position and size. Overflow menus hold infrequent operations.

### Adding content

Clicking an empty grid cell opens a searchable catalogue grouped into Combat, Content, Generators, and Utilities. Selecting a content widget allows choosing an existing campaign record or creating one. Multiple note or monster tiles can point to the same record, and updates appear in every view.

References and search results provide `Pin to screen`. Pinning selects the current screen by default and creates a view of the existing content. A tile may also be switched to different content without deleting the old record.

### Responsive behaviour

Desktop, tablet, and phone views show the entire configured grid below the title bar and retain widget cell positions and spans. Usable-sized widgets scroll internally. Undersized tiles show placeholders, with expanded views for focused work. Arrangement instructions and preview/offline status are accessible through a small bottom-left popover pill that does not reserve grid space. Notices overlay the grid rather than changing its dimensions.

All arrangement actions must have a keyboard and non-drag alternative. Touch scrolling inside a tile must not accidentally drag the tile. Switching screens or expanding a tile must not interrupt timers, lose note edits, or reroll dice.

## Campaign party

Each campaign owns a party, initially empty. The implemented local PC summary includes a stable ID, character and player names, level (1–20), current/maximum HP, and short notes. The toolbar opens an editable roster; an initiative tracker can open it when no party exists. Party records are independent of screens and widgets, persist offline, and are included in versioned campaign backups and duplication. Removing a character requires confirmation and leaves existing combat snapshots intact.

The initiative tracker’s **Add party** action adds all missing PCs as hero combatants, preserving party order and copying current HP, maximum HP, name, and notes. It leaves initiative unset and does not alter enemies, active turns, rounds, conditions, or already-added PCs. Combatants retain a stable party-character reference so renaming a PC does not cause duplicate additions. The action is undoable as one combat change. It adds nothing if the complete missing party would exceed the encounter’s 100-combatant limit. Resetting and adding again creates fresh snapshots. Party edits never implicitly synchronize into an active encounter.

Local character identity is separate from an optional Sidekick source reference (provider, character ID, optional campaign ID and sync timestamp). A structural adapter accepts the existing full Sidekick model and projects its name, level and current/maximum hit points into the summary without requiring the Sidekick backend. Future work may attach a versioned full character snapshot, render a full sheet, and provide explicit synchronization through a provider adapter. The simple summary remains available offline; combat snapshots and source character state stay separate. No live connection, full-sheet storage, or write-back is implemented yet.

## Initiative and combat tracker

The tracker represents a combat run, separate from reusable monster and encounter definitions. Loading a monster snapshots its relevant statistics into the run. Editing the library entry later does not silently change enemies already in combat.

### Visible information and actions

- Round and encounter name, current selection or active combatant, and paused or active state.
- Combatant name, side, ordering value where relevant, current and maximum HP, conditions, brief notes, and link to the full statblock.
- Add a hero, monster, group of identical monsters, or an ad hoc combatant.
- Enter or roll initiative where the selected rules profile supports it, manually reorder, and resolve ties explicitly.
- Apply damage or healing, set HP, toggle conditions, and mark defeated or remove from the run.
- Advance the turn or round, undo an advancement, pause, resume, and finish the run.

Identical enemies may appear in a collapsed group but keep separate IDs, HP, conditions, and notes. Selection must make clear whether an operation affects one enemy or the whole group. Applying damage to a group requires an explicit target choice.

### Rules and effects

The exact Nimble initiative procedure, action cadence, initiative roll options, minion behaviour, bloodied threshold, last stand, and save semantics must be checked against the chosen rules edition before automation is finalized. Do not inherit a generic d20 initiative model merely because it is familiar.

The data model supports numeric ordering and manual or grouped activation without forcing either as the rule. Timed effects can reference a specific combatant's turn, a round boundary, or a manual duration. The expiry event must be explicit. Removing the referenced combatant leaves an effect needing review rather than silently expiring it.

Bloodied and last-stand sections remain visible in statblocks. Phase changes can be suggested from validated rules but are GM-overridable. Last-stand damage tracking must not be collapsed into ordinary HP where the imported creature uses a distinct mechanic.

On reload, preserve combatant snapshots, order, HP, conditions, round, activation state, effect durations, and run notes. Resuming combat must not automatically advance a turn or expire effects.

## Monsters and hazards

The statblock tile follows the information hierarchy used by Nimble Nexus: name and level, type and role, defensive statistics, movement and saves, passive abilities, action instructions, actions, and special phases. It must remain readable at narrow widths and in both appearance modes.

Preserve standard, minion, legendary, team, and hazard distinctions. Teams may contain member-specific statistics, abilities, and actions. A hazard may lack HP, armor, or creature movement; do not invent those fields to satisfy a creature schema.

Action damage formulas become roll controls only if supported by the shared engine. Rules prose stays readable even when it cannot be automated. Do not infer missing mechanics from prose without review. Preserve fractional levels and HP-per-hero expressions.

The campaign bestiary provides search, tags, favourites, import, and pinning. Proposed V1 editing includes creating a custom entry and duplicating an imported one, with structured fields and Markdown descriptions. The existing monster builder models and UI should be assessed for reuse; a sophisticated guided balancing workflow is not required for Slate V1.

When adding a creature to combat, show any party-size scaling and allow a manual override. A hero-count change after combat starts does not retroactively alter HP or spawn enemies without explicit action.

## Dice roller

All dice evaluation uses the repository's `@nimble/dice` package. Tiles, monster actions, reference roll controls, and table generators use the same service boundary and produce the same structured result.

The dice tile provides common dice buttons, a formula input, modifier controls, roll mode, saved named presets, and recent history. Rolls display their total, formula, individual dice, kept and discarded results, and any critical or fumble information returned by the engine.

Separate plain rolls from rule-specific attack rolls. An ordinary random-table roll must not acquire attack fumbles or critical explosions by accident. Defaults for Nimble attack options depend on the rules validation described above.

Presets store the expression and options, not a previous result. Reroll creates a new history entry. Copying or sending an existing result never evaluates the expression again. Formulas with variables require an explicit context or a prompt for missing values; an unresolved attribute is not silently zero.

The current engine supports d4, d6, d8, d10, d12, d20, d100 and double-digit d44, d66, d88. Imported Nexus content can contain other notation, such as d3. Unsupported expressions remain visible with an explanation and a manual-result option. Any expanded notation must be added to the shared engine with tests, not implemented as a second Slate-only parser.

Each saved roll includes a unique ID, campaign, optional session, timestamp, source, original and resolved formula, options, complete result, and optional manual-result annotation. History retention is configurable; eviction must not break explicitly pinned results. Animated or 3D dice are optional future presentation, with a reduced-motion path.

## Notes and references

### Markdown notes

Notes support Markdown headings, lists, tasks, tables, emphasis, links, and code blocks. Editing and reading are available in a tile or expanded view. Autosave reports saving, saved, or failed status accurately; a failed write retains the editor draft and offers retry or export.

Typing `@` opens an inline search dropdown beside the text cursor. Continued typing filters campaign content and installed references, with each result showing its type and source. The current note is excluded. Arrow keys navigate, Enter/Tab or a pointer click select, and Escape dismisses suggestions without closing the note. Positioning follows wrapping, scrolling and resizing, opening above the cursor when needed and remaining inside the viewport. This works in grid tiles, expanded notes and the command palette. Selecting an entry preserves surrounding text and editor focus, inserting a stable reference token while rendering a readable name in read mode. Renaming the target must not break the link.

Rules, spells, items, monsters, and notes are supported reference types. NPCs, locations, tables, and encounters are proposed extensions. Imported Nexus tokens such as `@monster:<sourceId>` must be recognized and mapped through provenance to local content.

Slate uses Markdown links whose slate: URL percent-encodes either local::<record-id> or <pack-id>@<version>::<record-key>, with an optional #section-anchor. It must distinguish local IDs from external IDs and content-pack keys, survive Markdown export, and preserve readable labels when viewed outside Slate. Do not treat an unqualified ID as globally unique across providers.

### Preview interaction

Click, tap, or keyboard activation opens an accessible preview. Hover may offer a desktop convenience preview but cannot be the only interaction. Previews include the name, type, main content, source information where available, and actions to open, pin, or navigate to the source.

Nested references replace the current preview with back navigation rather than creating unlimited overlapping popups. Escape closes the preview and focus returns to the invoking reference. Selecting a reference while editing must not unexpectedly discard editor focus or changes.

Unknown references display a readable unresolved marker. Resolution uses installed content offline; it must not initiate a network request merely because the GM opened a note. An explicit online fetch can be offered. Import dependency traversal must handle cycles and bounded depth.

### Pinned content and search

Reference tiles display a whole record or a selected section. They retain the source ID and installed version. Local annotations and house-rule overrides are separate from bundled text and visibly distinguishable.

Proposed global search supports name, type, tag, and full-text lookup within the current campaign and its installed packs. Results can open a preview or be pinned. Backlinks identify notes using an entity. Large content libraries must not require online search.

Nimble Nexus MDX/YAML and structured spell JSON supply reference content through a pinned build-time pack converter. Vault is excluded. Imported Markdown must not execute JavaScript, MDX components, scripts, or event handlers. Embedded remote images require an explicit asset-download step before offline availability can be claimed.

## NPC generator and campaign people

The confirmed feature is an offline NPC name generator. Provide a dataset or style selector, generate-one and generate-many actions, copy, save, and recent results. Generation uses bundled or campaign-owned tables. No generative AI or online service is required.

Proposed profile fields are name, pronouns, appearance, mannerism, motivation, complication, tags, notes, and related location or faction. Each generated field can be locked while rerolling others. Saving creates a campaign NPC with a stable ID; generating another result must not overwrite a saved NPC.

Implemented generator packs use Slate's standard versioned content-pack format. Each <code>npc-generator</code> record contains a complete name definition and four editable attribute tables: appearance, scar/mark, mannerism, and quirk. Names can come from complete-name lists or the shared Sidekick syllable engine (P/M/S patterns, fragment pools, and length/syllable constraints), with optional gender pools and surnames. Any pools override gender pools; unavailable gender pools fall back to available names. Repeated entries supply implicit weights.

The NPC tool's **Manage generators** opens campaign-owned creation/editing, duplication, confirmed removal, built-in/imported campaign copies, pack import/enable/disable, and export of all campaign generators under a chosen ID/name/version. **Try generator** previews unsaved drafts. Validation rejects empty required tables, unsupported formats, impossible patterns, and conflicting installed pack versions. Built-in and installed packs remain immutable. Imported pack attribution is retained in backups; local packs need no external source URL.

The tool selects generators by stable local or versioned pack target. Disabling/removing a selected generator retains the selection, shows an unavailable message, and prevents new generation until it is restored or another style is chosen. Custom generated NPCs snapshot their tables so saved results and individual rerolls survive edits, disabled packs, and offline reloads. Generator definitions and selections belong to the campaign and participate in duplication and complete ZIP backups; local targets are remapped consistently during copying. Generation remains fully offline with no external service. The six existing Sidekick-derived built-in name styles remain available. Application schema v8 retains a pre-upgrade recovery checkpoint when loading v7 state and preserves pack enable/disable choices; campaign ZIP schemas v2–v7 remain readable.

## Items and reference database

The item library supports search, tags, favourites, type and rarity filters, create, edit, duplicate, import, export, and pin. A tile may show one item or a filtered library view. Editing from either location changes the same campaign record.

The minimum interoperable record contains name, kind, rarity, Markdown description, additional information, and source identifiers. Proposed optional Slate fields include price with currency, inventory slots, damage formula, armor information, uses, and custom properties. Unknown means unknown: absent price or slots must not become zero.

Item definitions are distinct from owned stacks. A quantity, remaining uses, or a shop's price override belongs to a future inventory or shop instance rather than changing the base item for every use.

Import offers validation, preview, duplicate handling, and field-level warnings. Export can target selected items or the campaign collection. Fields that Nexus cannot represent stay in Slate backups and must be identified before a reduced export. No automatic publishing to Nexus is part of V1.

## Utility tiles

All utilities use the same add, arrange, expand, persistence, and removal behaviour as other tiles. Each can have multiple instances and a custom label.

| Utility       | Configuration and operations                                                                                                                              | Persistent state                                                        |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Clock & timer | Compact clock/timer/stopwatch mode buttons; local 12/24-hour clock; start/pause, selected-mode reset, timer +1 minute/restart/acknowledgement             | Selected mode, clock format, independent stopwatch and countdown states |
| Counter       | Manual increment/decrement/reset; current and starting values, step, unit, bounds, target; optional tracker/turn/round/increment/decrement link and pause | Numeric value, reset baseline, settings, link, undo epoch               |
| Random table  | Named rows, dice ranges or weights, optional Markdown and references, roll, manually select, edit, and import                                             | Table definition, mode, last result, optional result history            |
| Image card    | Import a local map, portrait, or handout; fit, zoom, pan, caption, expand                                                                                 | Local asset ID, caption, view preferences                               |
| Checklist     | Add, reorder, indent if supported, check, uncheck, duplicate, reset                                                                                       | Entries, order, completion and optional template source                 |

Random-table roll ranges must reject accidental overlaps and report uncovered outcomes. Weighted mode and dice-range mode are explicit alternatives. Linked tables have cycle and recursion limits. A reference table imported from Nexus does not become rollable until it has an explicit roll mapping; tabular reference data alone is insufficient.

Counter target completion and timer expiry produce a visible state change. Sound is optional and off by default as a proposed in-person-play preference. Do not promise exact background alarms while the browser or native app is suspended. On resume, calculate elapsed time from stored timestamps, show expired timers once, and avoid replaying sounds repeatedly.

Wall-clock timers and combat-round counters are separate types. Advancing combat should only change a utility explicitly linked to that event, and undoing the advance must undo that change. Reloading never advances a counter.

Maps are reference images in V1. Tokens, measurement, fog of war, and map synchronization are future VTT features.

## Encounter import

V1 allows an existing encounter to be brought into a campaign, inspected, and used to start combat. The GM can rename the local copy, annotate it, select party size, and adjust instantiated combatants during play. Campaign encounter authoring is delivered in Milestone 7; GMG v1 difficulty guidance is delivered; automatic balancing and wave scheduling remain future work.

The import preview shows encounter name, description, party assumptions, entries, quantity rules, missing dependencies, and statblock availability. Resolve Nexus entries to full monster or hazard records, including family abilities and required assets. Preserve `quantity`, `isPerHero`, and `heroesPerMonster` rather than reducing them to a single fixed number.

Show the proposed resulting enemy count before starting combat. Exact rounding for per-hero quantities must match the selected source semantics and have fixtures. Preserve unsupported scaling expressions and ask for an explicit value rather than guessing.

An encounter definition contains stable entry IDs, content references, quantity expressions, party assumptions, annotations, and optional future extension fields. A combat run snapshots resolved quantities and creature statistics. Starting again creates a fresh run; resuming uses the existing run.

Missing full statblocks prevent a claim that the encounter is complete offline. The user may still import an incomplete draft, clearly marked with missing dependencies, and add manual details later.

## Import export and backup workflows

See [Compatibility research](COMPATIBILITY.md) for verified upstream shapes and limitations.

### Import sequence

1. Select the destination campaign and input: local file, pasted JSON, or a supported Nexus URL while online.
2. Detect the format and version. Reject unsupported containers with an explanation.
3. Validate structure, safely parse content, and collect warnings without changing the campaign.
4. Preview records, dependencies, duplicate candidates, and assets. Offer skip, update, or duplicate decisions.
5. Apply the chosen changes atomically where possible. Report exactly what was imported, skipped, or left unresolved.

Malformed data must not partially overwrite a campaign. Preserve original payloads and unknown fields where feasible for future conversion and faithful backup. Local custom fields are kept separately from source data. Reimport matching uses source provider, resource type, and source ID; names alone do not establish identity.

Updating an edited local copy requires a comparison or an explicit replacement choice. The default must not silently overwrite local edits. External fetches use bounded dependency traversal, safe URL handling, and clear failure reporting.

### Formats

- **Slate campaign backup:** the authoritative complete format, proposed as a ZIP with a versioned manifest, records, references, layouts, ongoing runs, and local assets.
- **Slate content bundle:** selected content and chosen dependencies; excludes campaign-private state unless explicitly selected.
- **Nexus-compatible JSON:** a documented content-exchange profile for supported resource types. This is not a promise that Nexus has a corresponding public upload workflow.
- **Markdown:** readable note and reference export, including source labels and portable links where possible.
- **Nimbrew JSON and Nexus Markdown ZIP:** proposed compatibility adapters with documented losses and explicit handling of unstructured text.

A backup includes everything required to resume the campaign offline, subject to any explicitly listed external or excluded assets. It does not contain authentication tokens, integration credentials, or device-only settings. The manifest lists schema and adapter versions, creation time, asset checksums, and missing dependencies.

Restore validates the entire archive, IDs, references, sizes, and assets before committing changes. It rejects path traversal and decompression bombs. Copy-as-new remaps local IDs; restore-in-place requires an explicit target and a recoverable pre-restore snapshot. Unsupported newer schema versions must not be silently downgraded.

## Offline operation and persistence

The proposed primary store is IndexedDB behind a typed repository interface, including asset blobs. LocalStorage may hold small appearance preferences but must not be the main campaign database. Final native storage selection should follow a Capacitor persistence spike; platform adapters must preserve the same domain semantics and portable backup format.

Discrete edits such as HP changes are committed promptly; note text is debounced with an explicit save status. Proposed target: note saves complete within one second after typing stops under normal conditions. The app must not depend solely on unload events to save data.

Use schema versions, transactional migrations, and recoverable migration failures. A failed migration must preserve the original database and offer export or recovery. Simultaneous tabs need revision checks or single-writer coordination so stale edits cannot silently replace newer ones.

The PWA precaches its application shell and required local fonts and assets. Installed content packs and downloaded campaign assets are stored explicitly, not left to incidental network caches. Offer an offline-readiness view distinguishing app installation, content, and assets. Storage persistence can be requested where supported; browser storage is not a substitute for user-exported backups.

A web app needs an initial successful download before offline use. A packaged native app must bundle its shell and starter assets and launch in airplane mode without ever contacting the hosted website. Importing new online content requires connectivity; using imported content does not.

Storage quota failures show a durable error, retain in-memory edits where possible, and offer backup or asset cleanup. Never delete user content automatically to make room. An update is offered without interrupting active play; save current state before activation. Cache updates must not delete campaign data.

## Visual identity and accessibility

The interface is clean and minimalist with a slight fantasy touch, using Sidekick as the local reference. Warm neutral surfaces, restrained borders, clear typography, modest accent colours, and small thematic details should support dense information without becoming decorative clutter.

Theme configuration separates a palette from light, dark, or system appearance. Provide a warm Nimble-inspired palette and a neutral alternative as proposed defaults. Reuse compatible design tokens and accessible components from the repository; current Sidekick and shared UI tokens need reconciliation before sharing a single theme implementation.

Use fantasy-influenced display typography sparingly for titles; body content, controls, numbers, and statblocks need highly readable fonts. All required fonts and icons must be packaged locally. A network font request cannot be required for the intended design.

Required accessibility behaviour includes visible keyboard focus, labels for icon buttons, logical tab order, non-drag placement controls, sufficient contrast, touch-friendly targets, reduced motion, and status indicators that do not rely on colour alone. Reference previews and dialogs manage focus and return it on close. Text zoom must not hide essential controls.

The initial performance proposal is smooth interaction with 20 visible tiles and a campaign containing 1,000 content records on a representative tablet. Search should usually respond within 200 ms after input on that device. These are validation targets to benchmark, not measured claims or hard content limits.

## Domain model and architecture

### Core records

| Record               | Key responsibilities                                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Campaign             | ID, name, description, lifecycle status, installed pack versions, revision and timestamps                          |
| Screen               | Campaign ID, name, ordering, layout variants, selected preset                                                      |
| Tile                 | Screen ID, widget type, content reference or utility reference, position, dimensions, display settings             |
| Content record       | Campaign ID, stable local ID, kind, title, tags, typed fields, Markdown, revision, provenance                      |
| Reference target     | Local entity ID or provider/type/source ID or pack/version/key; readable fallback label                            |
| Asset                | Campaign association, content hash, MIME type, size, local blob or native file reference, source URL if applicable |
| Encounter definition | Entries, quantity expressions, party assumptions, notes, source metadata                                           |
| Combat run           | Definition reference, snapshots, combatants, activation state, round, conditions and effects                       |
| Roll event           | Campaign/session, immutable result, source, formula, options, timestamp                                            |
| Utility state        | Typed timer, counter, table, checklist or generator state                                                          |
| Import batch         | Format and adapter version, source metadata, record mappings, warnings and outcome                                 |

Common custom records use stable IDs and a campaign ID. Pack-backed references may point to immutable shared storage, but campaign customizations never modify that storage. Source identifiers and local identifiers are separate. Imported unknown fields belong in an extension or original-payload field rather than disappearing during validation.

### Boundaries

Use separate layers for presentation, domain operations, persistence, format adapters, and optional network integrations. Widgets subscribe to campaign records rather than owning isolated copies of the same note or monster. Combat snapshots are an intentional exception.

Domain operations describe meaningful changes such as apply damage, advance round, update note, or adjust counter. This makes undo and activity records consistent and provides future integration hooks. Do not build a full event-sourcing system solely to satisfy this boundary.

Reuse `@nimble/dice` directly. Assess the shared monster schemas, Sidekick campaign types, existing monster form components, reference content pipeline, and Beyond20 service before creating equivalents. Existing campaign code is under active development and includes online/player-sharing concerns; reuse does not require making Slate depend on its backend or accepting limits that do not fit Slate.

Proposed implementation is a React and TypeScript client application, consistent with existing UI expertise, built into static assets suitable for both PWA hosting and Capacitor. The implementation uses Vite for the static build. Required offline features cannot depend on request-time server rendering or server actions.

Slate lives in `apps/slate/` alongside the other applications. The `@nimble/slate` package is registered there in the npm workspace.

## Future VTT integration

Provide an integration interface with capability detection, connection status, and explicit roll delivery. A canonical roll event contains the result actually shown to the GM. An adapter may send that result, describe limitations, or report unsupported mechanics; it must not silently request a fresh random roll.

VTT sending is opt-in and disabled by default. Delivery attempts are separate from the immutable local roll, include a unique event ID, and have visible success or failure where the target can confirm it. Retry does not reroll and should avoid duplicate messages. Old rolls must not automatically flood the VTT after reconnection.

Sidekick's Beyond20 code is a candidate first adapter reference. Browser-extension availability does not imply availability inside a Capacitor WebView. Native VTT delivery needs its own supported transport. V1 defines these boundaries but does not promise a working adapter, inbound control, shared combat, or player synchronization.

## Platform and developer documentation requirements

Implementation must supply reproducible instructions for prerequisites, dependency installation, local development, checks, production build, PWA installation, and offline verification. Current executable commands are documented in README.md.

Android instructions must cover generating or adding the Capacitor platform, producing the static web build, synchronizing web assets, opening the native project, running on a device or emulator, and producing a release build. iOS instructions must cover the equivalent flow with a macOS host and Xcode, device signing, and archive creation. Store accounts, signing identities, and publication are separate deployment decisions.

The packaged application loads bundled assets rather than a configured remote development server. Document native file import/export and sharing, asset locations, app upgrades and migrations, backup recovery, and the distinction between web-install caching and native first-launch offline operation. Platform-specific checks need real or emulated Android and iOS coverage before claiming support.

## Acceptance criteria

| ID   | Scenario                                                   | Required result                                                                                                      |
| ---- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| AC01 | Launch with empty storage                                  | Exactly one default campaign is created and a usable starter screen opens without login                              |
| AC02 | Create two campaigns and switch repeatedly                 | Content, layouts, rolls and active runs remain correctly separated                                                   |
| AC03 | Arrange, resize, expand and reload                         | The appropriate device layout and tile settings are restored                                                         |
| AC04 | Pin the same note twice, edit it, then remove one tile     | Both views update; removing a tile does not delete the note                                                          |
| AC05 | Use only keyboard or touch                                 | Essential dashboard, editing, rolling and preview actions are usable                                                 |
| AC06 | Enter an @ reference, rename the target and reopen offline | The reference still resolves; missing targets remain readable                                                        |
| AC07 | Roll from the tile and a monster action                    | Both use the shared engine and preserve complete result details                                                      |
| AC08 | Import unsupported dice notation                           | Content is preserved and the unsupported roll is explained without substitution                                      |
| AC09 | Reload during combat                                       | HP, conditions, order, round, phases, effects and notes survive without automatic advancement                        |
| AC10 | Import a Nexus encounter                                   | Quantity metadata is preserved and full statblocks and family dependencies are resolved or explicitly marked missing |
| AC11 | Reimport edited content                                    | The GM chooses skip, update or duplicate; local edits are not silently lost                                          |
| AC12 | Import malformed or partial data                           | No partial destructive write occurs; warnings identify records needing attention                                     |
| AC13 | Run counters, timers and tables across reload              | State is preserved; elapsed-time behaviour is correct; tables validate their mappings                                |
| AC14 | Close or suspend the app with a running timer              | Resume reconciles elapsed time without claiming guaranteed background alarms                                         |
| AC15 | Export and restore a campaign                              | Content, references, layouts, assets and unfinished runs are restored with matching meaning                          |
| AC16 | Use a reduced export format                                | Unsupported fields are listed before export and remain in the campaign                                               |
| AC17 | Disconnect after web installation and content download     | Every prepared core workflow, reference and local image remains available                                            |
| AC18 | First-launch native app in airplane mode                   | The bundled shell, default campaign, dice and starter content work                                                   |
| AC19 | Simulate quota, migration or write failure                 | Saved data survives and unsaved changes are not falsely reported as saved                                            |
| AC20 | Update while a session is active                           | Update activation is deferred and preserves campaign state                                                           |
| AC21 | Import a note containing HTML or executable content        | Content cannot execute scripts or access application state                                                           |
| AC22 | Future adapter retries sending a roll                      | The original result is retained and no new dice are rolled                                                           |

Compatibility fixtures must cover standard, minion, legendary, team and hazard records; fractional levels; per-hero quantities and HP; family abilities; optional fields; string and object phase descriptions; unknown fields; and missing dependencies. Representative current Nexus payloads should supplement formal schemas.

Tests should focus on meaningful domain behaviour, migrations, adapters, backup restoration, and offline end-to-end workflows. Visual review must cover light and dark themes, narrow statblocks, long names, touch layouts, text zoom, and popup focus. Documentation-only changes require document and link checks, not an application build.

## Suggested implementation sequence

1. Review the open decisions and settle the V1 feature boundary.
2. Validate the static PWA and native packaging approach, persistence, and shared model reuse with small technical spikes.
3. Build campaigns, storage, backups, tiles, Markdown references, and the shared dice path.
4. Add monster and item content, Nexus adapters, initiative, and encounter import.
5. Add the agreed utility tiles and offline readiness checks.
6. Verify accessibility, offline recovery, upgrade behaviour, and Android/iOS packaging.
7. Design V2 encounter building and optional VTT adapters against the established data boundaries.

Milestone 0 (grid, dice, manual initiative and compact interface) is implemented. Milestone 1 adds campaign lifecycle, versioned storage, attachments and portable backup/recovery. Its web acceptance checks are implemented; native validation remains a release gate documented in README.md.

### Milestone 1 behaviour and acceptance

- Keep a single default campaign on genuine first launch; archiving/deleting the last campaign leaves an explicit empty-library flow.
- Duplicate remaps local IDs and internal references, including current/undo combat states. Archive is reversible; permanent deletion requires the campaign name and removes attachment data plus local recovery snapshots containing that campaign.
- Backups are single-campaign ZIPs containing all supported campaign data and attachments. Import defaults to a separate campaign; original-ID restoration requires explicit confirmation if it replaces an existing campaign. Restore is atomic and does not import device appearance.
- Schema v1 originally upgraded to v2; current v1/v2/v3 installations upgrade to v4 with an original-state recovery point in the same transaction. Failures leave the old state intact and allow a raw recovery export.
- The latest five pre-upgrade/pre-replacement snapshots can restore the entire local library and settings after confirmation. Recovery itself first snapshots the current state.
- Attachments have explicit size/count limits and checksums. Backup validation finishes before mutation; invalid paths, unsupported schemas, missing files and corruption reject the import.
- Acceptance: restore into an empty store and compare campaign records plus asset bytes; preserve combat, dice and attachments through an offline browser restore/reload; verify archive/delete empty-state behaviour; simulate failed upgrades, quota errors and concurrent writes without partial replacement.
- Native review: retain a replaceable persistence boundary and backend-independent backup format. Verify durable native storage and native file handling on Android/iOS before claiming support. SDK/device validation is pending; see README.md.

### Milestone 2 behaviour and acceptance

Implemented for the web: named screens, independent grids, a searchable widget catalogue, shared tools, header configuration controls, expanded views, layout presets and layout undo/redo. Replace widgets by removing them and adding new or saved tools in an empty cell. Rules, spells and reference libraries were delivered in Milestone 3; the item database and compatibility adapters are delivered in Milestone 4.

- Each campaign has 1–20 ordered screens and a remembered active screen. Create, rename, reorder, duplicate and confirmed delete are available. Deleting a screen retains all saved tools.
- A widget stores its own ID, tool ID, kind, grid rectangle, optional title. Old minimized flags are ignored on load, including in history and presets. Tool names and data belong to the campaign. Duplicate screens have fresh screen/widget IDs and share tool IDs; their layout history starts empty.
- Blank, Combat and Dice table are built-in presets. A campaign may save 20 custom presets. Presets store layout and tool descriptors, not live tool state; creating a screen from one creates fresh tools while preserving shared slots within that preset.
- Each screen persists the latest 20 layout undo/redo snapshots. A new edit clears redo. No-op edits create no entry; invalid placement is rejected. Layout undo leaves tool state unchanged. Screen lifecycle and shared-tool renaming are outside layout undo.
- Widgets always show their content in their reserved footprint; expanded views share the same saved tool. The catalogue separates new tools from saved tools and searches names/types/purpose. Implemented dice, initiative, notes, references, NPC generators and item libraries are offered.
- Application schema v3 replaces campaign-level grid/widgets with screens, adds tool names and layout presets, and preserves v1/v2 data transactionally. Backup format v1 now identifies schema v3 and still imports schema-v2 campaigns. Copying a campaign remaps screen, view, tool, history and preset references.
- Acceptance verified: shared state across screen switches/reloads; independent layout undo and live rolls; custom presets creating fresh state; switching linked tools and local titles; old-schema migration and ZIP restore; offline keyboard placement and toolbar fit at 390px. Existing campaign, backup, dice, combat, drag/resize and offline checks continue to pass.

### Milestone 3 behaviour and acceptance

Implemented: a searchable offline campaign library; Markdown note and pinned-reference widgets; keyboard @ autocomplete; stable links and section anchors; nested previews with back navigation; source citations, related links and backlinks; local custom rule/spell/item references; campaign copies of pack records; content-pack import/export; and dependency-complete campaign backups.

Nexus revision 40527955eb7c6f4a242d508586580401f9e0431c is the source of the bundled pack, preserving Core Rules v2 / GMG v1 labels. The converter includes 239 records, 36 terms and six diagrams, and records its two conversion warnings. It consumes rule MDX frontmatter, terms.yaml, relations.yaml, FAQ targets, category hierarchy and structured spell-school JSON. Markdown and validated embedded raster assets are rendered safely; upstream code and imported MDX are never executed. Vault is not part of this pipeline.

Application schema v4 stores campaign content and enabled pack keys; physical IndexedDB version 3 adds a separate packs store. Pack versions are immutable, installed once per device and shared by campaigns. A new version does not silently retarget existing references. Campaign customizations preserve source metadata and stay independent. New/default campaigns enable the bundled pack without a setup step.

Pack import validates and previews before an atomic installation. Campaign ZIP format v1 now declares schema v4 and contains checksummed packs.json alongside campaign.json and attachments. Schema-v2/v3 ZIPs still import. Duplicate campaigns remap local content and note references while retaining pack/version identity. Recovery snapshots include pack data; raw recovery exports separately retain the original pack store.

Notes save on each edit through the existing persistence queue, keeping edits visible during failed saves. The UI supports Markdown tables/lists/tasks/code and explicit read/edit modes. Autocomplete inserts stable links; previews resolve current titles and retain fallback labels for missing records. Pinning a section uses its stable anchor. Imported remote images are not fetched implicitly. Dice tokens route through the existing dice engine and campaign roll history.

Limits: 20 installed packs; 8 MiB per imported pack, 3,000 records and 100 raster images; 1,000 campaign reference records; 100,000 characters per note/body; 20 preview navigation entries. Structured item authoring and monster/encounter adapters are delivered in Milestone 4 below. Native storage validation remains later work. Markdown exports preserve readable labels and portable reference tokens; campaign ZIPs include dependencies.

Acceptance checks cover old-state/ZIP migration, immutable pack collisions, dedicated-store persistence, malformed and corrupted packs, backup restoration into a fresh store, local-ID remapping, all bundled reference targets/anchors, offline rules/spells/diagrams, keyboard @ insertion, renamed targets, script/remote-image rejection, shared dice rolls and narrow dark-theme previews. See README.md for use, converter commands and native release gates.

## Open decisions

- Which Nimble edition or revision defines automated combat behaviour, and how will imported content from other revisions be labelled?
- Are phones a supported primary editing surface or mainly a compact play/reference view?
- Which proposed V1 conveniences and candidate campaign tools belong in the initial release?
- Which reference packs and NPC datasets ship initially, with what distribution rights and attribution?
- Should V1 include Nimbrew and Markdown ZIP adapters, or start with Nexus JSON plus full Slate backup?
- How much of the existing campaign and monster work can be shared without coupling Slate to online services?
- Which static frontend build and native persistence adapter satisfy the offline and repository constraints?
- What undo history depth, recovery retention, file-size limits and reference dependency limits are appropriate?
- Party character summaries are entered manually in this version. Sidekick source identity and a projection adapter are implemented; full sheets and live synchronization are future work.

Resolve these through feature review before treating the proposed defaults as final product decisions.

### Monster reference and tracker search implementation

Application schema v7 adds validated monster content records and optional combatant statblock snapshots. Existing schema-v1–v6 state upgrades transactionally, retaining a recovery point; v2–v6 campaign ZIPs remain readable. The separately versioned GMG bestiary pack is installed and enabled during upgrade when the existing 20-pack limits allow it. New campaigns enable it when installed. The original rules pack and existing links keep their identities.

The tracker has keyboard-accessible Combatants and Monsters tabs in tile, expanded and command-palette views. Monster search covers the local campaign and enabled packs, shows basic statistics, previews a statblock, and adds one independently identified enemy per click. Adding copies initial HP and the complete Markdown/statistics record into combat, preserves the current turn/round, and creates an undo step. Existing runs never synchronize implicitly with edited library monsters. A statblock button reads the saved encounter copy; action rolls use the shared dice service. Maximum encounter size stays 100 combatants.

The bundled pinned Nexus bestiary contains 86 monsters, including abilities inherited from 11 included families, fractional levels and legendary phase text. Simple campaign authoring supports name, HP, level, armor and Markdown abilities; monster content-pack import/export, stable note references, previews, pinning, campaign copying and dependency-complete backups use the existing content framework. Direct Nexus/Nimbrew JSON exchange and encounter import are implemented in Milestone 4 below. Encounter composition and legendary phase/action tracking are delivered below; automatic ability resolution remains future work.

### Milestone 4 behaviour and acceptance

Implemented for the web: structured item definitions/editor; campaign favourites and persistent searchable item tiles; Nexus JSON:API and official seed import; Nimbrew monster exchange; validated loss-aware selected/collection exports; encounter import, inspection and fresh combat instantiation. The item library is available in the grid, command palette and campaign library. Existing notes, references, offline storage and packs remain shared foundations.

- Items store kind, rarity, Markdown body, moreInfo, optional price/currency, slots, damage, armor, uses capacity and up to 100 custom properties. Empty optional numbers remain absent. Immutable pack items require a campaign copy to edit. Preview and tile editing use the same record; favourites belong to the campaign.
- Local JSON imports are capped at 8 MiB and validated completely before mutation. Preview shows record types, duplicates, quantities, party assumptions, incomplete statblocks, unknown fields and external image warnings. Duplicate choices are keep, replace or independent copies. Replacements retain a transactional recovery checkpoint; copies consistently remap local encounter and Markdown references.
- Nexus monster families are resolved from included resources. Standard, fractional, minion, legendary, team, per-hero HP, grouped Nimbrew actions and string/object phase text are supported. Missing family/full-statblock dependencies make a draft visibly incomplete. Hazards need no invented HP, armor, size or movement. Unknown source payload fields remain preserved in exchange metadata and full backups.
- Exports list field losses before downloading. Slate record JSON preserves all fields; campaign ZIP preserves packs, assets and state. Nexus item export reports omitted optional mechanics. Unedited imported monsters preserve structured source data and families. Authored/edited Markdown exports are reduced to description, with explicit warnings; Nimbrew exports one monster at a time. Nothing publishes or fetches content implicitly.
- Encounters are content records with stable entry IDs, targets, names, quantity, isPerHero, heroesPerMonster, heroCount/heroLevel, annotations and an extensions boundary for V2. Import preserves definitions; the library edits title, description, party assumptions and annotations without a composition/balance builder.
- Starting requires resolved full statblocks. Quantities are quantity × party size / heroesPerMonster for per-hero entries, rounded up with a visible notice. Legendary creatures/teams instantiate one entry. Per-hero HP scales with party size. Teams create separate member combatants and hazards use a separate snapshot list. Party PCs are optional; the complete result is validated against 100-combatant/100-hazard limits before mutation. Replacing existing combat is confirmed and undoable as one change. Library edits never alter live snapshots; starting again is fresh and resuming remains ordinary persisted tracker state.
- Schema 9 upgrades schemas 1–8 transactionally with recovery and preserves disabled pack choices. Older campaign ZIP schemas 2–8 remain readable. Item filters, favourites, source payloads, encounter references and creature/hazard snapshots survive copying and complete backup restore. Physical IndexedDB remains version 3. Native durable storage remains a release gate.
- Unit coverage includes an attributed pinned official GMG fixture plus synthetic compatibility, malformed input, quantity/HP, missing dependency, capacity, copy, export, migration and ZIP cases. Browser checks cover authoring, favourites, filters, losses, incomplete/full imports, undo, offline reload, team/hazard UI, Nimbrew previews and mobile dark popup layout/focus. Existing regressions and snapshots remain release checks.

### Milestone 5 behaviour and acceptance

Implemented for the web: five campaign-owned utilities and offline readiness checks. Each utility appears in the searchable catalogue and command palette, can span grid cells, supports multiple instances and shared views, and survives reload, campaign copying and ZIP restoration. View placement remains independent of utility state; layout presets create fresh tools.

- Random tables have explicit weighted/range mappings, 1–200 named Markdown rows, reference insertion, manual selection and a 20-result snapshot history. Range validation covers overlaps, gaps and impossible endpoints. Standard-dice evaluation and unbiased weighted selection reuse @nimble/dice. Linked campaign tables reject missing dependencies/cycles and limit a roll to eight tables; failed rolls save no partial history. JSON import is validated and previewed before replacement; standalone exports exclude table links, with full portability through campaign ZIPs.
- One Counter supports manual increment/decrement, current and starting values, reset, fractional step size, optional unit/bounds/target, and an optional tracker link. Links choose turns or rounds and increment or decrement by the step size; linkage can be paused independently of manual controls. Starting combat, unrelated edits and reload never trigger it. Combat undo reverses actual clamped linked changes. Reset/configuration invalidates old counter undo. Old clocks, step countdowns and travel counters migrate with their state, grid/layout history, presets, links and combat undo preserved.
- One Clock & timer widget provides local clock, stopwatch and countdown modes with compact icon controls. Switching modes preserves independent state. Stopwatch and real-time countdown state uses stored timestamps, reconciles closed/suspended time, and is never written every display tick. Duration/deadline, pause/resume/reset/extend/restart and persistent expiry acknowledgement are implemented. Deadlines use device local time. Expiry is visual and silent; optional sound and guaranteed background alarms are not implemented.
- Checklists support 200 entries, text editing, completion, button reordering, indentation, duplication and reset of completion.
- Image cards use validated local raster imports/existing attachments, caption, fit/fill, zoom/pan and normal expanded views. No remote downloads occur. Assets use the existing atomic attachment save/backup path. Missing/deleted assets remain understandable. Map measurement, tokens and fog are VTT work.
- The status popover exposes save state, browser persistence protection and approximate storage usage. It validates the current campaign's complete backup, attachments and enabled dependencies, supports download, and invalidates prior check results after changes. A declined persistence request remains visible and does not imply durable storage. Production cache readiness and a device-specific offline reload are separate checks.
- Schema 11 preserves prior campaigns and disabled packs through one transactional migration/recovery checkpoint. Existing schema 2–10 ZIPs remain readable. Utility IDs, table links, references, asset links and combat undo metadata are remapped together during copying.

Acceptance coverage includes domain validation, unbiased selection through the real shared dice engine, recursion failure without mutation, closed/paused time reconciliation, bounded fractional counters, linked round/turn undo (including history saturation), migration and ZIP/copy round trips. Browser workflows exercise visible controls, offline reload, reference previews, mobile dark layouts, local image integrity and verified backups; light/dark screenshots are reviewed.

### Milestone 6 implementation and release acceptance

Implemented: keyboard focus wrapping/restoration for modal and command-palette dialogs; explicit selector labels; measured contrast corrections in Sidekick-derived palette shades; coarse-pointer 44px controls, reduced-motion and safe-area handling; automated axe checks across light/dark Parchment and Stone; browser save-failure/retry and real deferred service-worker upgrade checks.

Native persistence now uses app-private SQLite for records and deduplicated immutable attachment bytes behind the existing storage contract. Revision checks, restore, migration, five recovery checkpoints and attachment cleanup are atomic. Original WebView state/packs/assets/checkpoints migrate once without source deletion. Corrupt or unsupported state stops loading and permits original recovery export; native failures never silently fall back to IndexedDB. Native imports pass system-picker files through existing bounded validation and previews; exports use unique temporary cache files and the system save/share sheet, with visible failure dialogs.

Android/iOS source projects and plugins are included. The repeatable cap:prepare command builds, synchronizes and verifies matching local offline bundles. Native service-worker registration remains disabled. Unit verification uses real SQLite transactions and connection closure, failure injection, migration/recovery and backup integrity; plugin file tests use mocks, and browser tests use the actual rendered UI/service worker.

Release acceptance remains open: no Android SDK/device is available on this host, and iOS needs macOS/Xcode. Compiling/signing APK/IPA builds, airplane-mode first launch, force-close/reboot/update persistence, storage exhaustion, native file providers/share sheets, large-workspace performance and VoiceOver/TalkBack must pass on supported devices. README.md records setup and the device test procedure. A successful web bundle/sync is not a native release claim. Encounter composition is delivered in Milestone 7. GMG v1 difficulty guidance and legendary phase/action tracking are delivered below; wave scheduling and VTT integrations remain future work.

### Milestone 7 implementation: Encounter builder

The builder is reachable through Campaign library → Manage encounters and Initiative → Load encounter → New encounter. All custom definitions belong to the active campaign. It uses the existing schema-10 encounter content record, preserving interoperability rather than introducing a parallel encounter format.

- Author/edit title, Markdown description, default hero count, planning hero level and annotations. Search campaign/enabled-pack statblocks by name/tag/text; filter creatures, teams and hazards; preview complete abilities in nested reference dialogs. No network is needed.
- Composition has up to 100 independent rows with stable IDs, targets and fallback names. Add repeated statblocks; remove or reorder rows; edit quantity, fixed/per-hero mode and heroes-per-quantity divisor. Quantities may be fractional; hero count/divisors are whole numbers from 1–100. Quantity must be positive and at most 100. Legendary rows retain imported metadata but visibly resolve to one. Teams create member combatants, hazards stay separate, and per-hero HP/rounding use the established import semantics.
- Preview recomputes actual creature/team-member and hazard totals. It reports unresolved/incomplete statblocks and family dependencies, aggregate caps and scaled HP above 99,999. Starting also preflights party PCs against the 100-combatant cap. Hero level is the exact average PC level and drives GMG v1 difficulty guidance. Empty, incomplete or excessive definitions may remain saved drafts; starting them is disabled.
- Save validates the whole definition and uses normal persistent campaign storage. Cancel does not mutate records. Local edits preserve stable definition/row IDs, tags, categories, source payloads and unknown extension fields. Dependency notes are refreshed against current composition. Pack originals are immutable: editing creates a campaign copy. Duplicate makes a new definition and independent row IDs with provenance. Delete requires confirmation and does not cascade into active combat or other references.
- Loading a definition offers party-size override and optional party PCs. Starting makes fresh independent combat IDs/HP/statblock snapshots and requires confirmation before replacing existing combat; replacement is undoable. Definitions and live combat do not implicitly synchronize. Drafts, references and composition persist across reload, campaign copying and portable campaign ZIP restore; existing JSON exchange remains available. Selected record JSON requires statblock/pack dependencies, while ZIP is the complete campaign backup.
- Desktop/light/dark and mobile snapshots plus accessibility/browser tests cover real editor flows, preview focus restoration, draft/capacity gates, duplicate independence, cancellation/deletion, offline persistence and combat undo. Unit tests cover scale/HP/team/hazard limits, immutable source metadata, copying and JSON/ZIP restoration. No schema migration or storage-engine replacement is required.

Deferred: automatic balancing, scheduled waves, a tactical map/player display, live Sidekick sync and VTT delivery. Native platform signing and actual device acceptance remain separate open release gates.

Counter consolidation supersedes the original milestone 5 segmented-clock and step-countdown types. App schema 11 stores Counter {value, initial, step, min, max, target, unit, epoch, link}. Link is null or {trackerId, event: turn|round, direction: increment|decrement, paused}. Initiative undo stores signed actual deltas with tool ID and counter epoch. Schema 10 campaign ZIPs and local/native saves are migrated; an original local recovery checkpoint is retained.

Time-tool consolidation supersedes the original separate stopwatch/timer widget types. App schema 12 stores Time {mode: clock|timer|stopwatch, clockFormat: 24h|12h, stopwatch: {elapsedMs, startedAt}, timer: {durationMs, remainingMs, deadline, acknowledged}}. Mode switching does not pause/reset either time state. Only changing duration, setting a new deadline or an explicit reset changes timer configuration/state. Expiry is visible from other modes until acknowledged; sound and guaranteed background alarms remain outside scope. Saved time tools, placements, layout undo/redo and presets migrate from schema 11 without altering counters or signed combat undo.

### Encounter guidance and legendary combat follow-up (delivered)

- Builder and loader show resolved ordinary level totals against total hero levels. Fractional monster levels are numeric. Party size and exact average level can come from the campaign PCs. Difficulty uses the pinned Nexus Core v2 / GMG v1 landmarks with ranges in unspecified gaps; a single legendary solo/team uses printed level once against average PC level. Minions get qualitative guidance. Hazards, unknown/missing levels, minion-only and mixed/multiple solos are visibly unrated, with reasons; rating alone is not a start gate.
- Legendary actions replace ordinary monster slots while heroes remain, occurring after each hero, excluding allies/followers. A legendary team is one action group; GM selects its acting living member. Distinct instances each act. Pending actions defer round rollover, survive pause/reload and undo, and participate in linked turn counters. No-hero combat falls back to normal eligible initiative order.
- Legendary snapshots store Bloodied threshold and sticky phase, Last Stand remaining/max HP and retained ability text. Zero normal HP enters Last Stand and remains active; subsequent pool damage can defeat it. Explicit canonical per-hero pools scale; fixed GMG v1 declarations remain fixed. Unknown/special pools require GM configuration or manual defeat. No transformation, summon, attack effect or damage carryover is guessed. Combatant editing supports manual legendary status, phases, thresholds and pools, including explicit reset after healing.
- Schema 13 migrates live runs and history without advancing combat; old zero-HP monsters retain unknown remaining pools. Original recovery remains available. New team groups, queue identities and phase state survive complete ZIP restore and campaign copies. Legacy team snapshots need encounter reload to obtain missing group identities. Browser/native storage engines are unchanged.
- Validation includes fractional/scaled budgets, solo/team/minion guidance, phases, cadence, removal, pause, signed counter undo, copies/backups and real IndexedDB/SQLite schema upgrades. Direct UI tests and reviewed snapshots exercise ratings, team actor selection, Last Stand, special-effect review and offline reload with accessibility scans. Ability automation, wave scheduling and second-printing rules switching remain future work.

