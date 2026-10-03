# Yorktown Architectural Dawn v10.1

Authoritative code lives in `SimCity/`. `build-simcity.mjs` bundles it and Three.js into five identical offline HTML entries. Edit sources, not generated HTML. This isolated output preserves v8/v9 in their own directories. It embeds no music, media tracks or external dependency URLs.

## Branch state and progression

`branches.mjs` defines nine branch identities, four stages each, stable deterministic palettes, functional coefficients and progression waits. `branch-development.mjs` computes neighbourhood scores from real city analysis and updates one atomic foundation at a time. Foundation member state must agree on branch, candidate, observation months, stress, growth and cooldown. Residential transition capacity may differ per tile because existing residents differ.

Common stages 1–4 use the existing development path. 4→5 needs 18 stable months with the same selected candidate confirmed for at least 12; 5→6, 6→7 and 7→8 need 24/42/72 months. Conditions must remain continuously satisfied; instability resets growth. Manual investment uses these same gates. `evolution.mjs` calculates the resource bill and upkeep; `redevelopment.mjs` checks operating reserves before automatic investment. No free high-stage random growth remains.

A different candidate must beat the existing branch by a score margin of at least .14 for 18 months. Sustained unsuitability adds stress, with good months reducing it by two; stress 12 retreats a high building to common stage 4. Both paths add a 12-month reconstruction cooldown. New branch development begins at stage 5. Common buildings only enter vacancy after sustained stress 24; residential buildings must first become empty. Vacancy recovery requires six consecutive supplied, accessible months with demand and land value restored. Reconstruction and decline notifications explain the transition.

Residential retreat/fusion stores the old population as `residentReserve`. Capacity permits those existing occupants, but new immigration is bounded by the new base capacity; surplus residents adjust gradually. Clearing a plot or changing its use resets all branch state. Save version 8/`tiles-v5` persists the eight branch fields and validates branch/type combinations, integer timers and complete plot lineage. Older high-stage buildings receive a one-time identity without losing stage or population.

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

`npm test` includes all inherited active tests plus branch selection, waiting periods, rebranching/decline, resident transition capacity, fusion, migration, real economy coefficients, 576 geometry combinations and five years of actual monthly simulation. Browser evidence covers branch comparisons, selected live-building progression, mode switching, a 360px layout, console and absence of music. Counts/hashes are in `CHROMATIC-CITY-VERIFICATION.json`.

These checks do not establish a calibrated game economy, full-station performance, film-render equivalence or native mobile release. StarFleet visit/drone/crash systems and detailed damage/ruin families remain proposals. No rejected music source was copied into this version; archived drafts remain in v9.

## v10.1 facade refinement

`facade-details.mjs` supplies recessed panes, mullions, sills, loggia rails and roof service grilles to all four tower elevations. Details are clipped to the true lot bounds; sail floor plates and ribs follow the inverse cubic profile. `processDetails` adds utility manifolds, valves and maintenance platforms. `architecture-shapes.mjs` adds a shared instanced dome lattice; close-range cylinder/dome/sail tessellation is smoother. Distant buildings omit fine facade work.

Glass textures use neutral reflection colors so instance palettes remain visible. A shared fixed morning environment, restrained glazing and selective warm occupied windows replace the dark uniform glass treatment. The gallery uses the same geometry/material pipeline and can export a 1600 × 1000 PNG through its visible output button. The topbar now has a stacking context above lower scene controls, fixing intercepted More-menu clicks.

This output is isolated from the source v10.0.0 folder. It retains the branch save keys and schema. No new economic rules, StarFleet events, soundtrack or traversal areas are added in v10.1.
