# Yorktown Branch Evolution v11.2

Authoritative code lives in `SimCity/`. `build-simcity.mjs` generates four web entries with bundled Three.js and deferred local MP3 playback, plus one standalone offline HTML containing the approved MP3. Edit sources, not generated HTML. This isolated output preserves the prior v11 source directory. Earlier sections describe inherited systems; the v11.2 section below supersedes older branch geometry and render budgets.

## Branch state and progression

`branches.mjs` defines nine branch identities, four stages each, stable deterministic palettes, functional coefficients and progression waits. `branch-development.mjs` computes neighbourhood scores from real city analysis and updates one atomic foundation at a time. Foundation member state must agree on branch, candidate, observation months, stress, growth and cooldown. Residential transition capacity may differ per tile because existing residents differ.

Common stages 1–4 use the existing development path. 4→5 needs 18 stable months with the same selected candidate confirmed for at least 12; 5→6, 6→7 and 7→8 need 24/42/72 months. Conditions must remain continuously satisfied; instability resets growth. Manual investment uses these same gates. `evolution.mjs` calculates the resource bill and upkeep; `redevelopment.mjs` checks operating reserves before automatic investment. No free high-stage random growth remains.

A different candidate must beat the existing branch by a score margin of at least .14 for 18 months. Sustained unsuitability adds stress, with good months reducing it by two; stress 12 retreats a high building to common stage 4. Both paths add a 12-month reconstruction cooldown. New branch development begins at stage 5. Common buildings only enter vacancy after sustained stress 24; residential buildings must first become empty. Vacancy recovery requires six consecutive supplied, accessible months with demand and land value restored. Reconstruction and decline notifications explain the transition.

Residential retreat/fusion stores the old population as `residentReserve`. Capacity permits those existing occupants, but new immigration is bounded by the new base capacity; surplus residents adjust gradually. Clearing a plot or changing its use resets all branch state. Branch state originated in save version 8/`tiles-v5`; version 9 adds continuum metadata. `tiles-v5` persists the eight branch fields and validates branch/type combinations, integer timers and complete plot lineage. Older high-stage buildings receive a one-time identity without losing stage or population.

## Real economic effects

Branch coefficients scale linearly from 25% at stage 5 to 100% at stage 8. Power, water and heat loads feed existing utility networks. Industrial pollution feeds the actual land-value/happiness calculation. Commercial bonuses use filled jobs for tax revenue; industrial bonuses apply to actual alloy production. Branch upkeep feeds monthly costs and investment reserve estimates.

Each occupied operational plot emits neighbourhood effects once, weighted by occupancy, minimum member supply and distance on the same gravity deck. Income/production auras exclude their own plot and cap at .08 residential, .10 commercial and .20 production. Base park coverage is saved separately so a garden cannot select itself solely using its own generated amenity bonus. Mature-commerce scoring requires actual filled jobs rather than an empty tall building.

## Geometry and materials

`branch-architecture.mjs` supplies nine families of forms, each changing podiums, wings, gardens, bridges, machinery or courtyards through levels 5–8. `architecture-shapes.mjs` provides normalized true arches, vertical/horizontal rings, half-sphere domes, curved hangar vaults and extruded sails. `architecture.mjs` uses these same generators for live buildings; `evolution-gallery.mjs` renders the same models for comparison. Both LODs support density and 1/2/3/4-square foundations. The gallery offers three branch comparisons or an eight-stage path.

Deterministic common/branch palettes give ivory bodies distinct glass, structural metal, accents and vegetation. Public facilities have independent palettes. The inherited fixed warm/cool morning lighting remains independent of camera rotation. Bridges and exterior roof platforms are architectural visuals, not new traversable interiors.

## Inherited systems

- `catalog.mjs`, `engine.mjs`, `space.mjs`, `orbital.mjs`: zoning, supply, employment, finances, heat/oxygen, stocks, orders, portals, lift and floating city.
- `plots.mjs`, `redevelopment.mjs`: three-tile road access, complete foundation fusion, funded public tiers, whole-plot demolition/undo and renewal strategies. Zoned fusion carries minimum stage/progress and maximum stress/cooldown, retaining residents; public fusion retains the existing equipment policy and oldest plant age.
- `maglev.mjs`, `maglev-scene.mjs`: automatically routed station links, real passenger edges, visible trains, explicit demolition suppression and restoration.
- `habitat.mjs`, `camera-controls.mjs`, `camera-ground.mjs`, `explorer-controller.mjs`: intrinsic curved/folded surfaces, wrapped yaw, local gravity, third-person ground/floor constraints and contextual interactions.
- `surrogate.mjs`, `surrogate-scene.mjs`, `body-collision.mjs`: three profiles, representative scooters/hounds, equivalent-mass separation, contact sliding and safe dismount.
- `interior-layout.mjs`, `interior.mjs`: one three-floor maze building; no duplicated single-room interiors.
- `living-plan.mjs`, `view.mjs`, `app.mjs`, `style.css`: initial demonstration city, actual model rebuilding, picking, compact inspection/progression panels, mode controls and responsive layout.

## Evidence and limits

`npm test` includes inherited active tests plus branch selection, waiting periods, rebranching/decline, resident transition capacity, fusion, migration, real economy coefficients, 576 geometry combinations and five years of actual monthly simulation. Earlier v10 browser evidence covered branch comparisons, selected live-building progression, mode switching, a 360px layout, console and absence of music. Later v11 evidence separately covers the accepted soundtrack and continuum features. These are inherited visual observations unless explicitly repeated in the current release evidence.

These checks do not establish a calibrated game economy, full-station performance, film-render equivalence or native mobile release. StarFleet visit/drone/crash systems and detailed damage/ruin families remain proposals. No rejected music source was copied into this version; archived drafts remain in v9.

## v10.1 facade refinement

`facade-details.mjs` supplies recessed panes, mullions, sills, loggia rails and roof service grilles to all four tower elevations. Details are clipped to the true lot bounds; sail floor plates and ribs follow the inverse cubic profile. `processDetails` adds utility manifolds, valves and maintenance platforms. `architecture-shapes.mjs` adds a shared instanced dome lattice; close-range cylinder/dome/sail tessellation is smoother. Distant buildings omit fine facade work.

Glass textures use neutral reflection colors so instance palettes remain visible. A shared fixed morning environment, restrained glazing and selective warm occupied windows replace the dark uniform glass treatment. The gallery uses the same geometry/material pipeline and can export a 1600 × 1000 PNG through its visible output button. The topbar now has a stacking context above lower scene controls, fixing intercepted More-menu clicks.

This output is isolated from the source v10.0.0 folder. It retains the branch save keys and schema. No new economic rules, StarFleet events, soundtrack or traversal areas are added in v10.1.

## v11 main-game integration

`continuum-plan.mjs` only prepares new starter cities. Imported saves retain their layout. `continuum-scene.mjs` adopts the shared structure-lab generators for large mature garden/finance/precision plots, sail/shell landmarks and staged gardens. Stages 5–8 keep distinct changes; every model is selected from actual simulation cells, not a separate display scene. Existing branch, capacity, maintenance and progression rules still apply.

`continuum.mjs` owns validated LINE anchors, axis, segment counts, full footprints, garden clocks, health and landmark quest state. LINE children carry zero population and jobs; the anchor owns capacity and upkeep. Building, extension, full-plot demolition and undo carry metadata with the tile transaction. Save v9 persists this data in both full and compact formats; incomplete footprints or impossible quest prerequisites are rejected.

`assisted-planning.mjs` generates an immutable candidate from a rectangular same-deck selection. Road components connect through free ground to existing road access; disconnected speculative stubs are removed. Existing occupied/preserved plots and portal footings cannot be overwritten. Demand capacity includes existing unbuilt zones, preventing speculative commercial flooding. Local utility reserves, service placement, transport/freight, stage-4 mature load and six-month reserves are checked before a quote is returned. Commit rejects stale tiles or insufficient reserves, orders infrastructure before zoning and rolls back the full transaction if construction fails. The three investment tiers have finite ceilings and keep unused funds.

`continuum-ui.mjs` exposes one area tool and three investment tiers, quote dimensions, a drawn construction plan, explicit commit/reselection and contextual LINE controls. The committed quote shares the ordinary month's undo stack.

LINE uses a real passenger graph shortcut between only its connected end roads. Supply above 95% and transport funding at least 50% activate the commuter edge; actual assignments count riders. Freight remains on its separate logistics network. Anchor solar/oxygen/cooling reserves and reduced water loads supplement existing networks, with monthly fees and occupied job income in `forecast`.

Long-side camouflage renders the existing scene into an aspect-matched shared background target with LINE objects hidden, then projects it onto the side panels with a subtle tint and seams. End/inside/overhead views expose actual geometry. No video, static copied reference image or hidden background texture provides the effect.

`continuum-interior.mjs` and `structure/` implement the six-floor sail quest, actual stair navigation, constrained guidance, ordered interactions, jump gap, recovery and persisted progress. `line-walking.mjs` supplies pure floor-opening geometry and planter collisions. LINE has six floors, true lift shaft openings, bounded walking, dynamic lift cabs, walk-to controls, end-to-end train travel and return to the corresponding street end. Public corridors are explorable; residential/office room layouts are not simulated. Generic interior prompts are suppressed when a dedicated room HUD is active.

Automatic park investment uses 12 stable months for 2×2 and a further 18 for 3×3, funded fees and six-month reserves. Garden health responds to supply; six stressed months retreat stage 3 while retaining its footprint for traversal. No graph connectivity depends on visual plant geometry.

The authoritative release evidence is `CONTINUUM-CITY-VERIFICATION.json`. Browser checks in this release cover construction quote/commit/refund, saved sail quest completion, LINE side/end distinction, lift and train, mode controls and captured console logs. Automated checks were rerun for this release; older evidence above describes inherited system coverage rather than newly repeated visual checks of every feature.

## v11 morning-axis starter and preview isolation

`DEMO_BLUEPRINT` defines an organized main-deck core, utility campus, collector avenues, four magnetically linked stations, freight-connected dock/fabrication pairs, three ordinary level-6 representative plots and expansion gates at both ends. `prepareContinuum` supplies these assets only to new cities. The high-stage plots are not preserved display props: real population, filled jobs, branch eligibility, supply, funded growth and decline remain active. The exact compact starter is shipped as `Yorktown-Morning-Axis-Demo-v11.json`; `DEMO-STABILITY-v11.json` records the same unmodified starter through 60 monthly steps, with disasters off and automatic investment/plant renewal on. Local road bottlenecks remain part of management.

The preview is loaded through `?demo=1` in a fresh document before the renderer constructs city geometry. Entering first persists the user's city. Preview persistence is guarded, and return removes the preview URL state and reloads the original city. This avoids building both cities during a scene swap and protects the user's save. A memory fallback remains when browser storage is unavailable.

`ContinuumScene.remove` treats shared foliage/material textures as owned by the scene cache, not by an individual retired building. Rebuilding a garden disposes unique geometry and private maps while retaining shared textures. Repeated same-mode selections skip redundant camera/scene updates.

## Approved cello soundtrack

`music.mjs` uses one HTML audio element and one More-menu toggle. It starts only after a user gesture, fades to a restrained level, preserves mute preference, suspends hidden-page playback and resumes at the current track position. Playback rejection offers a direct retry without affecting simulation. Generation checks prevent delayed play promises from defeating a later mute or interrupting a newer start. Four focused control tests cover these cases. Web entries use the accepted local MP3 with `preload=none` so audio download does not delay city initialization. The standalone offline HTML embeds that same mixed MP3; the build validates exactly one approved audio source and resolves the nested template's relative path. No older rejected draft is loaded.


## 2026-10-03 background simulation and render budgets

The simulation retains the same game rules. Monthly `step` avoids full analysis passes when branch, garden, redevelopment or investment functions did not change visual/operational state. Commute routing shares sparse-reset buffers, compiles edge metadata once per analysis while reading live traffic/ridership, and stops exploring above the existing 42-cost commute threshold. Freight retains its separate 65-cost traversal. Exact serialized city states and aggregate indicators match the previous release for all 60 starter months and the measured 10%/20% cases.

A Blob-backed bundled worker performs one month at a time. `simulation-runner.mjs` permits one in-flight request, caches a revisioned snapshot, and resyncs after edits. The main thread discards stale results after edits, pause, modal changes, city replacement or visibility changes; failed workers pause rather than retrying indefinitely. Sparse cell patches and transferred analysis buffers avoid retaining full city copies per month. Monthly backpressure leaves time between calculations; recorded CPU speedups compare equal game months and do not count slowing the clock as acceleration.

`render-budget.mjs` stops static paused drawing and hidden drawing, bounds normal running construction views at 12fps and movement at 30fps, and caps canvas pixels at 1,152,000. `render-plan.mjs` limits complete detail to 80 nearby buildings and medium detail to 320; all remaining buildings retain visible branch-coloured silhouettes. Stable 32x16 chunks reuse instanced meshes across ordinary population updates. Shadows are cached at 1024px and invalidated on geometry changes; LINE shares a 640px backdrop, updates during camera movement at a bounded rate and otherwise reuses it. Close views retain the established detailed forms. These caps are rendering policy, not an assertion of measured battery power.

The complete 109-test suite, CPU parity/timing report, synthetic capacity fixture, 12-month supply result and bounded browser/music observations are under `checks`. The 20% capacity fixture is deliberately populated and supplied but is not a new startup template or an all-policy economic calibration. A later excess-commerce vacancy was observed under unchanged rules. Full-station/endurance/thermal certification remains open.

## v11.1 clear dawn: detail without repeated work

`simulation-speed.mjs` limits speeds to 0/1/2/4, maps legacy 12 to 4 and legacy 3 to 2, and defines an 8,000ms base month. Work completes one month at a time with at least 250ms rest, or the duration of the previous month if greater. Bounded accumulation prevents an unbounded catch-up queue. These clock changes do not alter per-month game rules.

`ViewQuality` distinguishes actual camera movement from a running simulation. Position/quaternion changes trigger a 650ms motion interval and one settled-quality frame. Settled pixel ratio is at least 1.5 and at most 2, bounded by 8,388,608 pixels; motion is bounded by 2,500,000 pixels and ratio 1.4. Antialiasing remains on. Hidden or blocked views draw no frames; static paused construction draws none after settlement. Running construction uses 8fps, growth uses 20fps, movement 30fps, and idle walk/fly/interior uses 12fps. No periodic static-quality timer keeps an inactive view alive.

`render-plan.mjs` selects 96 full-detail and 320 medium-detail buildings using camera projection, true building height, frustum visibility and hysteresis. All other buildings remain visible with branch-specific low-detail forms. Stable 32×16 chunks are reused when their visual state does not change. Camera movement invalidates the selection, with a 1,300ms planning interval and a settled refresh. Canvas data attributes expose drawing statistics for read-only browser evidence.

`AtelierScene.updateLandmarks` emits a mature adopted model only for its fusion anchor. The previous loop emitted a model for every member of an adopted plot: 4×4 produced 16 overlapping instances, 3×3 produced nine. This is per-foundation duplication, not proof of global quadratic simulation complexity. A regression test deliberately marks every member full-detail and verifies one model per plot, reuse and cleanup. The honest single residence model has wider stepped terraces, roof trees, winter garden glazing and fins; the commercial double blades and forecourt are wider. Industrial detail is retained.

`static-batch.mjs` merges fixed same-material geometry after baking world transforms, positions, normals and UVs. Animated, independently hidden and instance-colored branches stay separate. Prototype clones reuse baked buffers. Atelier static subgroups and the complete sail/shell landmarks use this path; LINE keeps independently visible camouflage walls and moving mechanisms. Tests compare triangle counts and transformed vertex bounds before/after and verify that both real sail/shell generators submit fewer than half the mesh objects. No triangle decimation is involved.

The fixed-direction morning shadow uses a cached 2048px map following the camera target in snapped four-unit steps. Glass atlases are 1024px with anisotropy up to 8, limited by device capability. LINE uses a cached 1280px settled backdrop and 640px motion backdrop; unchanged backgrounds are reused. These restore detail beyond the earlier budgeted settings without making static scenes redraw continuously.

Current evidence: `checks/clear-dawn-tests.tap` (117 passed, zero failures), `checks/clear-dawn-browser.json` (20.08% populated close view at 4× with music; bounded pause observation), and `checks/clear-dawn-verification.json` (build/source hashes and final screenshot settings). The earlier 4.4× equal-month CPU speedup is inherited, not a new GPU, energy or thermal measurement. The 20% browser fixture contains no sail/shell landmarks, so its observation remains applicable after that isolated batching change; final starter screenshots were recaptured from the rebuilt source. Long-running thermal/battery stability, browser-specific crash coverage and full-station performance are still unverified.

## v11.2 shared branch geometry and budgets

`residential-architecture.mjs`, `commercial-architecture.mjs` and `industrial-architecture.mjs` generate all nine level 5–8 branches for each foundation. They share preallocated shapes from their respective `*-shapes.mjs` modules with the gallery. `adoptedForm()` now returns null so the former three showcase overrides cannot replace the branch models in the main city. Common level 1–4 buildings retain their existing renderer.

`render-plan.mjs` admits fine models from 20 CSS pixels (18 retention), up to 96 buildings AND 900,000 estimated submitted triangles; medium is up to 320 AND 700,000. `branch-visuals.mjs` holds conservative bounds checked against actual generated geometry. These are branch-detail budgets, not total-scene triangle limits. Far geometry remains under 1,600 triangles per prototype. Static instancing and cached geometry avoid rebuilding detailed geometry per frame. The CPU worker pacing, 4× cap, stationary render cessation and cached lighting are inherited from 11.1.

Shipyard work selection is deterministic from the city month: three objects, each with three work phases, changing every eight months. Object/phase changes invalidate only the appropriate visual state, not every animation frame. Timber co-living retains its economic branch identity but applies passive-envelope electricity/water coefficients. Other branch effects and evolution waits remain unchanged.

Shared facade textures add window room layers, timber grain, leaf masks and panel seams. Full detail supplies real curved frames, support members, railings, hull panels, casting hydraulics and tank access ladders; distant models retain silhouette and color. The corrected canopy winding prevents the upper surface from disappearing. No claim of film-quality material equivalence is made.

`music.mjs` uses one deferred HTML audio element and the approved Firstlight file, remembers mute, pauses hidden playback and performs a short fade. Web entries stream the MP3; the offline file embeds identical bytes.

Validation: 127 automated tests, per-model geometry report and browser observations are recorded in `checks/branch-*`. Distinguish the normal 20.08% city's simulation progression from the paused, forced-level-8 near-view stress test. Neither is a long-running battery, thermal or crash certification.
