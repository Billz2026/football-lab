# Football Lab Character Assets V1

This directory is the staging area for the production rigged character system. The current live game must not switch away from the V42.1 canvas fallback until the master outfield and goalkeeper assets have passed the production gate.

## Approved benchmarks

- `outfield/viktor-kane/viktor-kane.glb` — master outfield benchmark
- `goalkeeper/mikkel-storm/mikkel-storm.glb` — master goalkeeper benchmark

The remaining six characters must be derived to the same realism and rig standards after the two masters are approved in motion.

## Required directory structure

```text
v1/
  outfield/
    viktor-kane/
      viktor-kane.glb
      viktor-kane-lod1.glb
      viktor-kane-lod2.glb
    bruno-silva/
    david-beckett/
    wayne-redman/
  goalkeeper/
    mikkel-storm/
      mikkel-storm.glb
      mikkel-storm-lod1.glb
      mikkel-storm-lod2.glb
    rafael-dantas/
    diego-varela/
    simon-henshaw/
```

## Non-negotiable visual requirements

- human-realistic anatomy; no mannequin proportions
- original faces; inspiration must not become direct celebrity likeness
- realistic head-to-neck, shoulder, elbow, wrist, hip, knee and ankle transitions
- real hand and finger silhouette at close replay distance
- layered hair geometry/cards with believable volume
- physically plausible football kit fit and folds
- separate skin, hair, cloth, boot and goalkeeper-glove materials
- clean silhouettes from the normal gameplay camera and close replay camera
- no baked sponsor, club or third-party trademarks

## Rig contract

All characters use skeleton `FL_HUMANOID_V1`. Bone names and required animation clips are defined in `game/character-production-v1.js`.

Outfield master clips:

- idle
- approach
- plant
- windup
- contact
- follow-through
- recovery

Goalkeeper master clips:

- set
- shuffle-left / shuffle-right
- low, mid and high dives on both sides
- parry
- catch
- landing
- recovery

## Mobile-oriented asset targets

These are production targets, not automatic acceptance thresholds:

- master mesh: approximately 70k–110k visible triangles
- LOD1: approximately 35k–55k triangles
- LOD2: approximately 15k–25k triangles
- texture sets: up to 2K for gameplay assets; higher-resolution source files may be retained outside the deployed build
- one shared skeleton family so animation retargeting works across the roster
- GLB as the deployed container format

## Release gate

A character does not become live merely because a `.glb` file has been added. Its manifest entry must be changed from `awaiting-glb` to `ready`, automated asset verification must pass, and the character must be visually approved in idle and action screenshots before `liveIntegration` is enabled.
