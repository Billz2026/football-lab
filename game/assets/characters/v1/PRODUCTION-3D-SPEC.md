# Football Lab Production 3D Character Specification

## Purpose

This document defines the minimum asset contract for a 3D character to replace the V44 articulated 2.5D fallback in live gameplay. A GLB that merely loads is not production-ready.

## File format and coordinate system

- Format: binary glTF 2.0 (`.glb`).
- Units: metres.
- Up axis: +Y.
- Character forward: +Z.
- Character root must be centred at X=0, Z=0.
- Feet must rest on the ground plane at Y=0 in the bind/rest pose.
- Root translation in animation clips must be in-place/root-locked. Football Lab owns world-space movement and must not receive duplicate root motion from the animation.
- No camera, environment, pitch, lights, helper meshes or unrelated scene objects inside the production GLB.

## Skeleton

Use one humanoid skeleton across the entire Football Lab roster so animation can be reused and retargeted consistently.

Required semantic bones:

- Root
- Hips
- Spine / chest chain
- Neck
- Head
- LeftShoulder / LeftUpperArm / LeftLowerArm / LeftHand
- RightShoulder / RightUpperArm / RightLowerArm / RightHand
- LeftUpperLeg / LeftLowerLeg / LeftFoot / LeftToe
- RightUpperLeg / RightLowerLeg / RightFoot / RightToe

The exact exporter names may differ only when an explicit bone map is supplied with the asset. The master Viktor Kane and Mikkel Storm assets establish the final roster skeleton.

## Outfield animation clips

Exact production clip names:

- `idle`
- `approach`
- `plant`
- `windup`
- `contact`
- `follow-through`
- `recovery`

Requirements:

- All clips are in-place/root-locked.
- `approach` is a clean football run-up, not a generic jog.
- `plant` visibly loads the support leg and locks the plant foot.
- `windup` rotates hips and torso while the striking leg chambers.
- `contact` reaches a credible ball-strike pose with the boot at Football Lab contact height.
- `follow-through` transfers body weight naturally through the planted leg.
- `recovery` returns to an athletic standing state without snapping.
- Clip boundaries must blend cleanly.

## Goalkeeper animation clips

Exact production clip names:

- `set`
- `shuffle-left`
- `shuffle-right`
- `dive-left-low`
- `dive-left-mid`
- `dive-left-high`
- `dive-right-low`
- `dive-right-mid`
- `dive-right-high`
- `parry`
- `catch`
- `landing`
- `recovery`

Requirements:

- All clips are in-place/root-locked; Football Lab keeper AI owns world-space keeper movement.
- Set stance must be football-specific: balanced, knees flexed, weight forward, hands ready.
- Dives must be shoulder-led with readable push-off, extension and landing mechanics.
- Hands must reach credible save positions without detached-looking elbows or hyperextension.
- Landing and recovery must remain physically grounded.

## Master character targets

### Viktor Kane — master outfield

- Target height: 1.88 m.
- Build: tall, balanced, athletic footballer; not bodybuilder-heavy and not thin/stick-like.
- Original face only; no direct celebrity likeness.
- Short textured blond/light hair.
- Football Lab white/navy kit.
- Anatomical priorities: realistic shoulder width, ribcage, pelvis, glutes, thighs and calves; footballer leg mass must remain readable at normal gameplay distance.
- Boots must have a real football-boot silhouette rather than generic shoes.

### Mikkel Storm — master goalkeeper

- Target height: 2.04 m.
- Build: tall, physically imposing goalkeeper with long reach and realistic mass.
- Original face only; no direct celebrity likeness.
- Short light-brown/blond hair.
- Football Lab deep-green goalkeeper kit and gloves.
- Wider shoulder frame and goalkeeper-appropriate leg/hip strength without exaggerated superhero anatomy.

## Mesh and materials

- Skinned mesh only for deforming body/kit components.
- Clean deformation around shoulders, elbows, hips, knees and ankles is mandatory.
- Avoid visible clipping between body, shorts, shirt, socks, boots and gloves throughout every required clip.
- PBR materials: base colour, roughness and normal detail where useful.
- Skin should remain natural under neutral lighting; avoid waxy, metallic or plastic response.
- Hair should use game-ready geometry/cards with stable alpha handling.
- Textures should normally be 1K–2K per material set; 4K requires a demonstrated visual need.
- No copyrighted club crests, sponsor logos or branded kit assets unless separately cleared.

## Performance targets

Master LOD0 target:

- Approximately 35k–80k triangles for an outfield player.
- Approximately 40k–90k triangles for a goalkeeper including gloves.
- Prefer a small material count and atlas textures where practical.

Required LODs before full-roster rollout:

- LOD1: roughly 50–60% of LOD0 triangle count.
- LOD2: roughly 20–30% of LOD0 triangle count.

The renderer may initially validate the master LOD0 assets, but mobile rollout is not complete until LOD behaviour is tested.

## Approval gate

A character is not allowed to replace V44 simply because the file exists.

Before live integration the asset must pass:

1. GLB loads with no console errors.
2. Required animation clips are all present with exact names.
3. Character height and ground contact are correct in Football Lab world space.
4. No root-motion double movement.
5. Foot plant aligns with the ball-strike sequence.
6. Goalkeeper hands visually align with representative save contacts.
7. No major mesh clipping across all required clips.
8. Desktop and mobile frame-rate check.
9. Gameplay screenshot/video visual approval for the master character.
10. Existing shot physics, scoring, keeper AI and campaign regression tests remain unchanged.

Viktor Kane and Mikkel Storm must both pass this gate before the production 3D character path is considered visually approved.
