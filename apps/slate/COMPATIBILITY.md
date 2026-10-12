# Slate Compatibility Research

Verified on 11 October 2026. This document records the data contracts Slate should accommodate and the existing repository capabilities it should reuse. It separates observed upstream behaviour from proposed Slate adapters.

The inspected Nimble Nexus source is [dstrelau/nimble.monster at commit 7118928](https://github.com/dstrelau/nimble.monster/tree/7118928deb919f1be3ac67d5826e54766cfdf510). Public monster and item API samples were also fetched from the live service. Source inspection does not establish that every route or every branch is deployed identically, and no write or publishing integration was tested.

## Nexus JSON API

The public API documents JSON:API 1.1 with the `application/vnd.api+json` content type. Resources contain `type`, `id`, `attributes`, relationships, and links. A single-resource response has an object in `data`; list responses have an array. Related resources may appear in `included`. List pagination uses a cursor and a relative `links.next` URL, with a documented maximum page size of 100.

Read endpoints include monsters, families, items, collections, encounters, users, and custom rules. Public read responses include CORS support. This does not provide a supported cross-origin publishing workflow. Some authenticated mutation handlers use internal input shapes rather than a public JSON:API write contract.

Sources: [API documentation](https://github.com/dstrelau/nimble.monster/blob/7118928deb919f1be3ac67d5826e54766cfdf510/docs/API.md), [API helpers](https://github.com/dstrelau/nimble.monster/blob/7118928deb919f1be3ac67d5826e54766cfdf510/lib/api.ts), [CORS policy](https://github.com/dstrelau/nimble.monster/blob/7118928deb919f1be3ac67d5826e54766cfdf510/lib/cors.ts), [public and private API boundaries](https://github.com/dstrelau/nimble.monster/blob/7118928deb919f1be3ac67d5826e54766cfdf510/docs/SERVER_ACTION_MIGRATION.md).

## Resource compatibility matrix

| Resource or format      | Observed representation                                                            | Slate requirement                                                              |
| ----------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Monster                 | `type: monsters`, structured attributes, creator and optional family relationships | Preserve original resource, normalize for local use, retain provenance         |
| Family                  | Name, description and abilities, with creator relationship                         | Resolve shared abilities so statblocks remain complete offline                 |
| Item                    | Name, kind, rarity, description and moreInfo                                       | Keep optional richer Slate fields separate from the limited exchange shape     |
| Encounter               | Hero count/level and monster relationships with quantity metadata                  | Resolve full statblocks and preserve scaling before creating a combat snapshot |
| Collection              | Related monsters and items available through includes                              | Import constituent resources; collection metadata alone is insufficient        |
| Custom rule             | Name, content and related rule slugs with relation labels                          | Retain rule links and map installed references where possible                  |
| Nimbrew monster JSON    | Display-oriented strings and nested action groups                                  | Treat as a separate format with lossy structure recovery                       |
| Collection Markdown ZIP | Markdown for monsters, items and spell schools                                     | Import as reference content unless structure can be mapped reliably            |
| Reference tables        | Structured subtables with columns and string cells                                 | Preserve as reference tables; require explicit roll semantics for random use   |

## Monster details

Current monster serialization includes name, HP, optional HP per hero, level, size, armor, kind, role, movement, abilities, actions, action instructions, effects, description, and optional encounter prose or portrait identifiers. Movement is an array of speed records with an optional mode. Action damage may be `{ "roll": "1d8+4" }`; targeting may include a numeric reach or range. Units must follow the selected rules and source context, not be guessed from a legacy helper's label.

Subtypes include standard, minion, legendary and team. Legendary and some other creatures carry bloodied and last-stand descriptions. Team members may have their own HP, per-hero HP, armor, size, saves, abilities, actions and instructions.

Hazards still use resource type `monsters`, distinguished by `attributes.hazard: true`. Their action damage representation can differ from ordinary creature actions, and they may omit creature statistics. The public API documentation identifies hazards as an extension beyond the upstream monster schema.

Family abilities are not guaranteed to be embedded in a creature's own abilities. Fetch `include=families,creator` or resolve relationships separately. Store the family record and display inherited abilities without duplicating them into editable local fields automatically.

The inspected repository contains mismatches between some helper TypeScript interfaces and current serializers, including phase text represented as strings in one place and objects containing `description` in another, and legacy singular family relationships versus plural families. A live sample returned an empty name and null level. The import adapter must validate actual data, support explicitly documented legacy forms, and warn on incomplete records. Do not treat a TypeScript interface as proof that every public record is valid.

Sources: [monster serializer](https://github.com/dstrelau/nimble.monster/blob/7118928deb919f1be3ac67d5826e54766cfdf510/lib/services/monsters/converters.ts), [family serializer](https://github.com/dstrelau/nimble.monster/blob/7118928deb919f1be3ac67d5826e54766cfdf510/lib/services/families/converters.ts), [legacy API helper](https://github.com/dstrelau/nimble.monster/blob/7118928deb919f1be3ac67d5826e54766cfdf510/lib/api/monsters.ts).

The API documentation also points to [nimble-schemas](https://github.com/dstrelau/nimble-schemas). That repository was not successfully inspected during this review; its current completeness and suitability as a dependency remain unverified.

## Items and inline references

The public item serializer exposes `name`, `kind`, `rarity`, `description`, and `moreInfo`, with a creator relationship. It does not expose structured item price, weight, slots, weapon statistics, or all internal image configuration fields. The Slate editor must therefore separate its own richer data from this exchange profile.

A live item description contained `@monster:<id>`. Nexus's entity reference resolver supports several kinds of content, including rules, encounters and tables. Preserve tokens and maintain a provider/type/ID mapping. Fetching a record's text alone does not guarantee that the objects it references are installed offline.

Sources: [item serializer](https://github.com/dstrelau/nimble.monster/blob/7118928deb919f1be3ac67d5826e54766cfdf510/lib/services/items/converters.ts), [reference resolver](https://github.com/dstrelau/nimble.monster/blob/7118928deb919f1be3ac67d5826e54766cfdf510/lib/services/entity-references.ts), [custom rule serializer](https://github.com/dstrelau/nimble.monster/blob/7118928deb919f1be3ac67d5826e54766cfdf510/lib/services/customRules/converters.ts).

## Encounters and collections

An encounter carries name, description, creation time, hero count and hero level. With `include=monsters`, its monster relationship entries include `quantity`, `isPerHero`, and `heroesPerMonster` inside `meta`. Included monster resources are summaries, not complete action and ability records.

Slate must fetch the individual monster details and related family records before marking an online encounter import complete offline. A local JSON file with only those summaries remains an incomplete encounter unless the dependencies already exist in the destination campaign.

The exported `monsterCount` is derived from the number of encounter entries, not necessarily the number of individual enemies after quantity and per-hero scaling. Calculate the actual combatant count from entries; do not use this field as the enemy total.

Collection includes can provide full monsters and/or items. The public collection converter's content coverage differs from the Markdown ZIP export, which also includes spell schools. Do not assume a collection JSON response covers every category visible on the website.

Sources: [encounter serializer](https://github.com/dstrelau/nimble.monster/blob/7118928deb919f1be3ac67d5826e54766cfdf510/lib/services/encounters/converters.ts), [encounter detail route](https://github.com/dstrelau/nimble.monster/blob/7118928deb919f1be3ac67d5826e54766cfdf510/app/api/encounters/%5Bid%5D/route.ts), [collection serializer](https://github.com/dstrelau/nimble.monster/blob/7118928deb919f1be3ac67d5826e54766cfdf510/lib/services/collections/converters.ts).

## Alternative exports and import limitations

The route `/monsters/:id/nimbrew.json` produces fields such as `name`, `CR`, `armor`, `hp`, `saves`, `speed`, `passives`, `actions`, `theme`, and optional `bloodied` and `laststand`. Several values are display strings. Family abilities are flattened into passives; team members may be flattened into named action groups and combined HP text. Do not promise lossless structured conversion from that format.

The route `/collections/:id/export` creates a ZIP of Markdown files for monsters, items and spell schools. It is useful for readable reference import, but is not a complete campaign or structured creature backup.

Nexus has internal/admin JSON loaders, but those are not a general public file-import promise. V1 Slate can export a compatible interchange profile without claiming that users can upload it directly into Nexus. Publishing would require a separately verified authenticated workflow.

The reference-table schema uses named subtables, columns with IDs and names, and rows of string cells keyed by column ID. This shape does not inherently specify weights, dice ranges, or selection probabilities.

Sources: [Nimbrew export](https://github.com/dstrelau/nimble.monster/blob/7118928deb919f1be3ac67d5826e54766cfdf510/app/monsters/%5Bid%5D/nimbrew.json/route.ts), [Markdown ZIP export](https://github.com/dstrelau/nimble.monster/blob/7118928deb919f1be3ac67d5826e54766cfdf510/app/collections/%5Bid%5D/export/route.ts), [reference-table schema](https://github.com/dstrelau/nimble.monster/blob/7118928deb919f1be3ac67d5826e54766cfdf510/lib/random-table-schema.ts).

## Existing Nimble repository capabilities

These paths refer to the local working tree reviewed on the date above. Some contain uncommitted work, so their interfaces must be rechecked when implementation begins.

| Capability                        | Existing path                                                                          | Reuse direction                                                                                           |
| --------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Dice evaluation                   | `packages/nimble-dice`                                                                 | Required shared engine; use its validation and structured results                                         |
| Monster models                    | `packages/shared/src/monsters`                                                         | Assess schemas and types before defining Slate's normalized model                                         |
| Monster forms                     | `packages/nimble-ui/src/monster-form.tsx` and guided builder components                | Reuse suitable presentation without forcing online dependencies                                           |
| Nimbrew conversion                | `apps/portal/lib/monsters/nimbrew-export.ts`                                           | Existing mapping to assess before adding another exporter                                                 |
| Campaign records                  | `packages/shared/src/campaigns.ts`                                                     | Existing items, journals, sessions, encounters and runs; offline requirements need a compatibility review |
| Sidekick campaign UI and services | `apps/sidekick/components/campaigns`, `apps/sidekick/lib/services/campaign-service.ts` | Coordinate concepts; do not require server-backed membership for a local campaign                         |
| Sidekick themes                   | `apps/sidekick/data/themes.ts`                                                         | Warm Nimble and modern variants provide the visual reference                                              |
| Shared UI theme                   | `packages/nimble-ui/src/theme.css`                                                     | Assess token compatibility; its current token conventions differ from Sidekick                            |
| VTT sending                       | `apps/sidekick/lib/integrations/beyond20/beyond20-sharing-service.ts`                  | Existing event dispatch and result conversion; verify target behaviour before reuse                       |
| Reference content                 | `apps/vault`                                                                           | Assess available content and conversion pipeline for offline packs                                        |

The dice engine currently accepts d4, d6, d8, d10, d12, d20, d100 and double-digit d44, d66, d88. It supports expressions and Nimble-oriented options including exploding dice, vicious dice and advantage/disadvantage. It enforces bounds on expressions and roll sizes. Nexus pages can contain unsupported expressions such as d3, which Slate must preserve and flag.

The Beyond20 README describes roll integration as future work, but the reviewed source already contains a sharing service and tests. Source is stronger evidence of current capability than that stale status list. Existing code is still not proof of successful delivery to every VTT or support inside a native WebView.

## Compatibility validation before release

Maintain versioned import/export adapters and representative fixtures from the inspected contract. Verify import, local edit, export, and reimport for supported fields. Preserve unknown fields in the original payload and document every lossy mapping.

Test resource IDs independently of display names, relative pagination links, absent optional properties, both phase-description representations, fractional levels, missing family dependencies, team members, hazards without creature statistics, and encounters whose included monsters are only summaries.

For offline validation, disconnect after import and open every imported statblock, referenced ability, and downloaded image. For backup validation, restore into an empty application store and compare meaningful data, not only record counts.

Before adding an optional upstream dependency or reusing external implementation code, check its actual license and dependency implications. Format compatibility can be implemented through Slate's own adapters; importing the whole Nexus application is not required.

## Nexus rules and spells — milestone 3

The bundled content converter uses source revision [40527955](https://github.com/dstrelau/nimble.monster/tree/40527955eb7c6f4a242d508586580401f9e0431c), separately from the API research revision above. Core rules are filesystem MDX records in data/rules, not the custom-rules JSON API. Slugs come from filenames; frontmatter contains title, keywords, book/page sources and optional variantOf. Categories/order come from lib/rules/categories.ts. terms.yaml provides aliases and hover snippets; relations.yaml provides symmetric group/hub edges; FAQ files have question, kind and target rule slugs. Bodies include dice, term and spell-school placeholders plus a small number of MDX components and image tags.

Structured spells are imported from data/official/core/spell-schools.json. School attributes contain spells with tier, actions, utility/reaction flags, target and prose mechanics such as damage, upcast and highLevels. These fields are retained rather than inferred from text. The converter records unsupported transformations in src/content/nexus-conversion.json. Original rule edition labels are preserved. Runtime import/export uses Slate's validated content pack schema; this is not a claim that Nexus accepts Slate uploads.

## Milestone 4 implementation status

Slate now implements local-file Nexus JSON:API/official seed imports for items, monsters and encounters, included family resolution, source-payload retention, Nimbrew monster exchange, structured local item editing and loss-aware exports. Import remains read-only with respect to Nexus; no public write contract or automatic catalogue fetch is assumed. Source inspection of the repository-local portal Nimbrew converter confirmed the common shape, but its AnyMonster model lacks Nexus teams/hazards and is app-local. Slate's boundary adapter preserves its own portable record model without coupling to that application or importing upstream implementation dependencies.

Official seed resources with no primary IDs require explicit source metadata and receive deterministic seed IDs distinct from live API identity. The attributed four-record original GMG fixture is pinned to revision 40527955eb7c6f4a242d508586580401f9e0431c. Source images are retained as metadata but never fetched; previews disclose external-image availability. Monster damage accepts string and roll-object shapes; phase text accepts strings and description objects. Teams, HP-less hazards, per-hero HP/quantities, missing families and abbreviated encounter inclusions have explicit validation and offline tests.

Encounter quantities round up to whole creatures with a visible fractional notice; legendary monsters/teams instantiate once, and hazards are separate snapshots. Encounter composition is now implemented in Milestone 7 using the same validated quantity/target format; GMG v1 difficulty estimates and legendary phase/action tracking are implemented; wave scheduling and automatic ability resolution remain deferred. Nexus/Nimbrew reductions identify omitted fields before download; Slate record JSON preserves complete fields, while campaign ZIP remains the dependency-complete backup. Markdown ZIP import is still deferred to a later compatibility extension.

## Rules-aware encounter and combat state (schema 13)

Difficulty uses the pinned GMG v1 rules on Nexus: ordinary resolved monster-level sum / hero-level sum, fractional levels included. A single legendary creature/team instead compares its printed level once against average hero level. Landmarks and intervening ranges are visible; minions get qualitative pressure guidance. Mixed solos, hazards, absent levels and minion-only definitions remain unrated rather than inventing a formula. These estimates are local and require no live rules fetch.

### Expanded official bundle (schema 14)

The current bundle is pinned to [d8a939aa](https://github.com/dstrelau/nimble.monster/tree/d8a939aa69752d92c05ba9760b60b2dadae07485/data/official). All 11 official seed files are represented: Core ancestries, backgrounds, equipment tables and spell schools; GMG bestiary/families; Heroes classes, subclasses and story subclasses; supplementary Hexbinder class, subclasses and spells. The rule/FAQ MDX, terminology and diagrams are also retained. `nexus-conversion.json` records SHA-256 hashes and every converted ID per seed, plus live snapshot coverage, with 443 core-pack records and 101 bestiary records. Class/subclass/ancestry/background definitions retain raw gameplay fields and full Markdown previews, including all class levels and ability lists. Equipment tables retain every column and row; all 77 rows are also item definitions with unambiguous printed prices/damage/defense preserved.

The live `/api/items` does not expose sufficient source metadata to identify official items. The build-time snapshot instead enumerates the public [item catalog](https://nimble.nexus/items) using its book-abbreviation source filters and follows pagination through the public read action. Each page's item headings are checked against captured IDs/names. On 11 October 2026, Core had seven items, GMG two and Extras three; Core3 and Heroes had none. Only entries explicitly assigned one of those Nimble book sources are bundled. The site's D&D SRD and unassigned/community content are excluded. Book/license/link and contributor display attribution are retained; Discord/account identifiers are not. This is a snapshot of Nexus's published coverage, not a claim to contain unpublished or otherwise unavailable publisher material.

Edition labels remain explicit: existing prose/bestiary uses Core v2 / GMG v1, while equipment tables say Core Rules 3.0 and some live item notes identify older editions. Encounter estimates still use the documented GMG v1 algorithm. Schema 14 remaps exact predecessor bundle references and replaces their active storage slots atomically, retaining campaign edits, pack opt-outs and the original recovery checkpoint. Old campaign ZIPs validate checksums before this replacement. New definition kinds can be imported from Nexus seeds/JSON:API; Nexus export preserves structured fields and warns that Markdown edits require Slate export for full fidelity. Complete Slate JSON/ZIP retains the full record.

The live public source catalogs also supplied 15 additional monsters, three ancestries and seven backgrounds, retained in `nexus-official-supplement.json`. The audit found 103 live monster IDs, 26 ancestry IDs, 30 background IDs, 12 classes, 24 subclasses and seven spell schools under the official book sources. Names already represented by the pinned seeds are deduplicated after trimming whitespace; older seed-only entries remain available. Live equipment tables do not expose book-attributed records through this listing, so the three complete official JSON tables are used. Supplementary monsters are read from their public JSON:API detail endpoints with included families. The adapter retains original source data, handles blank ability labels without empty headings, and interprets zero base HP plus explicit positive `hpPerHero` as a per-hero-only pool. It never infers legendary status from prose or overwrites the source's flags. Optional Paperforge artwork stays external metadata; full text/statblocks work offline without it.

Canonical monster fields now retain Bloodied/Last Stand prose and optional bloodiedAt, lastStandHp and lastStandHpPerHero. Markdown phase sections are supported for bundled/Nimbrew records. A new combat snapshot stores normal/bloodied/lastStand/defeated phase, threshold, separate nullable remaining/max Last Stand HP, original phase text and optional shared team group ID. Nexus/Slate import preserve the source payload; full Slate record JSON and campaign ZIP preserve all canonical fields. Existing reduced Nexus/Nimbrew exports continue to warn about structured information they cannot reconstruct; they are not a substitute for full backups.

The pending action queue stores the completed hero, ordered legendary group IDs, next ordinary actor and delayed round rollover. It survives browser/native saves, pause, undo and ZIP restore; campaign duplication remaps queue and group identities together with combatant IDs. Old v12 live runs/history gain phase state, but already-zero monsters keep unknown remaining HP. Legacy teams require encounter reload because older snapshots did not store shared group identity. No IndexedDB/SQLite engine migration is needed. The October 2026 second-printing playtest's alternate budgets and per-hero defaults are not silently applied to this pinned GMG v1 library.

Schema 15 distributes the converted source bundles into three runtime packs: Core Rules (350), GMG (144, including all 101 monsters) and Heroes (50, including Hexbinder). Every record retains its ID and attribution; full and encoded references migrate by record to its new pack, including campaign copies, pins, notes and combat history. Related-content links may use a fully qualified pack target for cross-book navigation. Known old pack identities migrate once; custom packs and disabled-source opt-outs are preserved. Individual book packs export as ordinary Slate content JSON. The two source JSON files remain the converter inputs; book separation happens in `starter-pack.ts`.
