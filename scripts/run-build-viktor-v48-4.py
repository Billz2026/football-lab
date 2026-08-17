"""Football Lab Viktor V48.4 final inherited-surface cleanup candidate.

V48.3 removed the dangerous floating overlay architecture and produced a much
cleaner gameplay silhouette, but the neutral audit still exposed three local art
issues: material-based facial definition read like a mask, sleeve cuff topology
was not contiguous enough, and the inherited boot shell retained visible toe
lobes. V48.4 addresses only those defects while preserving the verified rig,
1.88 m proportions, KANE 10 shirt treatment and all seven strike clips.

No independently weighted visible geometry is introduced in this pass.
"""

import math
import os
from collections import defaultdict

from mathutils import Vector

BASE_PATH = os.path.join(os.path.dirname(__file__), "run-build-viktor-v48-3.py")
with open(BASE_PATH, "r", encoding="utf-8") as handle:
    source = handle.read()

marker = "builder.main()"
if marker not in source:
    raise RuntimeError("V48.3 builder entry point not found")

v483 = {
    "__file__": BASE_PATH,
    "__name__": "football_lab_v48_3_base",
}
exec(compile(source.rsplit(marker, 1)[0], BASE_PATH, "exec"), v483)

builder = v483["builder"]
v48_globals = v483["v48_globals"]
_shape_inherited_boots = v483["_shape_inherited_boots"]
_arm_projection = v483["_arm_projection"]
base_normalise = builder.normalise_body
base_add_metadata = builder.add_metadata


def _smoothstep(a, b, value):
    if b <= a:
        return 0.0
    t = max(0.0, min(1.0, (value - a) / (b - a)))
    return t * t * (3.0 - 2.0 * t)


def _v484_normalise_body(body):
    body = base_normalise(body)

    # Integrated facial sculpt only: no separate eye/brow meshes and no flat
    # material mask. Recess the existing eye-socket topology by millimetres and
    # add a subtle brow ridge, enough for neutral lighting to read a mature face.
    for vertex in body.data.vertices:
        p = vertex.co
        if p.y >= -0.025:
            continue

        ax = abs(p.x)
        # Two socket zones around the existing eye topology.
        if 1.718 <= p.z <= 1.758 and 0.014 <= ax <= 0.072:
            vertical = 1.0 - min(1.0, abs(p.z - 1.738) / 0.020)
            horizontal = 1.0 - min(1.0, abs(ax - 0.041) / 0.031)
            weight = max(0.0, vertical * horizontal)
            p.y += 0.0045 * weight

        # Slight brow projection above the recessed sockets creates natural
        # shadow separation without dark face paint.
        if 1.755 <= p.z <= 1.778 and 0.018 <= ax <= 0.074:
            vertical = 1.0 - min(1.0, abs(p.z - 1.766) / 0.012)
            p.y -= 0.0022 * max(0.0, vertical)

        # Refine the lower face into a narrower mature striker jaw/chin.
        if 1.610 <= p.z <= 1.690 and ax <= 0.125:
            blend = 1.0 - _smoothstep(1.610, 1.690, p.z)
            p.x *= 1.0 - 0.010 * blend
            if p.z < 1.648:
                p.y *= 1.006

    body.data.update()
    body["football_lab_face_definition"] = "integrated-socket-brow-jaw-sculpt"
    body["football_lab_art_revision"] = "V48.4"
    return body


def _v484_sleeve_predicate(point):
    # Select a complete upper-arm circumference using axis position, not radial
    # clipping. The previous radial test excluded legitimate outer-arm faces and
    # caused the saw-tooth holes visible in neutral 3/4 review.
    _, _, _, t, _ = _arm_projection(point)
    return -0.16 <= t <= 0.72 and abs(point.x) >= 0.185 and point.z >= 1.215


def _v484_polish_boots(boots):
    _shape_inherited_boots(boots)

    mesh = boots.data
    neighbours = defaultdict(set)
    for edge in mesh.edges:
        a, b = map(int, edge.vertices)
        neighbours[a].add(b)
        neighbours[b].add(a)

    forefoot = {
        vertex.index for vertex in mesh.vertices
        if vertex.co.y < -0.050 and vertex.co.z < 0.175
    }

    # Stronger constrained smoothing than V48.3. Only the anatomical forefoot
    # moves; ankle/instep bind-space registration remains untouched.
    for _ in range(10):
        updates = {}
        for index in forefoot:
            vertex = mesh.vertices[index]
            linked = [mesh.vertices[j].co for j in neighbours[index] if j in forefoot]
            if len(linked) < 2:
                continue
            average = sum(linked, Vector()) / len(linked)
            value = vertex.co.lerp(average, 0.42)
            side = 1.0 if vertex.co.x >= 0.0 else -1.0
            centre_x = side * 0.105
            # Maintain foot separation and a football-boot forefoot width.
            local_x = value.x - centre_x
            local_x = max(-0.076, min(0.076, local_x))
            value.x = centre_x + local_x
            value.z = max(0.003, value.z)
            updates[index] = value
        for index, value in updates.items():
            mesh.vertices[index].co = value

    mesh.update()

    # Force only the extreme front into one smooth elliptical cap. This removes
    # the final digit-by-digit toe silhouette without lengthening the boot.
    for index in forefoot:
        vertex = mesh.vertices[index]
        side = 1.0 if vertex.co.x >= 0.0 else -1.0
        centre_x = side * 0.105
        local_x = vertex.co.x - centre_x
        if vertex.co.y < -0.150:
            nx = min(1.0, abs(local_x) / 0.074)
            cap_y = -0.246 + 0.030 * (nx * nx)
            vertex.co.y = vertex.co.y * 0.18 + cap_y * 0.82

        # Re-expand the smoothed shell a few percent so it remains visibly over
        # the anatomical foot rather than cutting inside it.
        vertex.co.x = centre_x + local_x * 1.025
        if vertex.co.z > 0.009:
            vertex.co.z = 0.005 + (vertex.co.z - 0.005) * 1.045
        vertex.co.z = max(vertex.co.z, 0.003)

    mesh.update()
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    boots["football_lab_attachment"] = "final-smoothed-inherited-football-boots"
    boots["football_lab_boot_silhouette"] = "single-rounded-forefoot"
    boots["football_lab_art_revision"] = "V48.4"
    return boots


def _no_face_material_mask(body):
    # V48.3's material-region experiment is intentionally removed. The new face
    # definition comes solely from the inherited head sculpt above.
    body["football_lab_integrated_face_definition"] = False
    body["football_lab_face_material_mask"] = False
    return body


def add_v484_metadata(body, armature):
    base_add_metadata(body, armature)
    body["football_lab_build"] = "48.4.0"
    body["football_lab_art_revision"] = "V48.4"
    body["football_lab_inherited_surface_only_polish"] = True
    body["football_lab_floating_overlay_geometry"] = False
    body["football_lab_face_material_mask"] = False
    body["football_lab_integrated_face_sculpt"] = True
    body["football_lab_contiguous_sleeve_shell"] = True
    body["football_lab_smoothed_boot_forefoot"] = True
    armature["football_lab_build"] = "48.4.0"
    armature["football_lab_art_revision"] = "V48.4"


# Patch the V48.3 function globals before main. Its kit/hem cleanup is retained,
# while face-paint, sleeve selection and boot shaping are replaced here.
v483["_integrated_face_definition"] = _no_face_material_mask
v48_globals["_v48_sleeves"] = _v484_sleeve_predicate
v48_globals["_polish_boots"] = _v484_polish_boots

builder.normalise_body = _v484_normalise_body
builder.add_metadata = add_v484_metadata
builder.main()
