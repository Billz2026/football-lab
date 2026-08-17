"""Football Lab Viktor V48.3 inherited-surface art cleanup.

V48.2 proved that adding independently weighted collar/cuff/boot geometry was the
wrong architecture: the production contract passed, but the neutral render showed
those additions floating away from the body. V48.3 deliberately returns to the
last mechanically clean V48.1 model and improves only surfaces that already
inherit Viktor's verified bind-space skinning.

Changes in this pass:
- clean, high mature hairline on the inherited scalp shell;
- sleeve selection follows the actual upper-arm axis instead of horizontal cuts;
- existing shirt/short/sock boundary vertices are regularised into cleaner hems;
- the inherited boot shell is smoothed and rounded across the forefoot to reduce
  individual anatomical toe shapes without introducing detached shoe geometry;
- restrained integrated brow/stubble material regions add facial definition
  without separate floating eye meshes.

Viktor Kane remains an original Football Lab character: a tall, mature English
number-nine archetype rather than a direct likeness of a real footballer.
"""

import math
import os
from collections import defaultdict

import bpy
from mathutils import Vector

BASE_PATH = os.path.join(os.path.dirname(__file__), "run-build-viktor-v48-1.py")
with open(BASE_PATH, "r", encoding="utf-8") as handle:
    source = handle.read()

marker = "builder.main()"
if marker not in source:
    raise RuntimeError("V48.1 builder entry point not found")

v481 = {
    "__file__": BASE_PATH,
    "__name__": "football_lab_v48_1_base",
}
exec(compile(source.rsplit(marker, 1)[0], BASE_PATH, "exec"), v481)

builder = v481["builder"]
v48_globals = v481["v48_globals"]
_surface_shell = v48_globals["_surface_shell"]
_material = v48_globals["_material"]
_shape_inherited_boots = v481["_shape_inherited_boots"]
base_create_kit = builder.add_hair
base_add_metadata = builder.add_metadata


def _polygon_centre(mesh, polygon):
    count = max(1, len(polygon.vertices))
    return Vector((
        sum(mesh.vertices[i].co.x for i in polygon.vertices) / count,
        sum(mesh.vertices[i].co.y for i in polygon.vertices) / count,
        sum(mesh.vertices[i].co.z for i in polygon.vertices) / count,
    ))


def _edge_counts(mesh):
    counts = defaultdict(int)
    for polygon in mesh.polygons:
        verts = list(polygon.vertices)
        for i, a in enumerate(verts):
            b = verts[(i + 1) % len(verts)]
            counts[tuple(sorted((int(a), int(b))))] += 1
    return counts


def _boundary_vertices(obj):
    counts = _edge_counts(obj.data)
    result = set()
    for (a, b), count in counts.items():
        if count == 1:
            result.add(a)
            result.add(b)
    return result


def _shirt_predicate(point):
    if point.z < 0.985 or point.z > 1.585:
        return False

    # Fitted torso envelope. Keep enough shoulder overlap for the separately
    # selected upper-arm sleeves but never catch forearms as V47 did.
    if point.z < 1.20:
        limit = 0.238
    elif point.z < 1.38:
        limit = 0.260
    else:
        limit = 0.315
    if abs(point.x) > limit:
        return False

    # A true front/back crew-neck curve rather than a horizontal guillotine.
    # Front of the source body is negative Y.
    if abs(point.x) < 0.155 and point.z > 1.455:
        if point.y < 0.0:
            centre_z, radius_z, radius_x = 1.558, 0.080, 0.145
        else:
            centre_z, radius_z, radius_x = 1.565, 0.052, 0.138
        qx = point.x / radius_x
        qz = (point.z - centre_z) / radius_z
        if qx * qx + qz * qz < 1.0:
            return False
    return True


def _arm_projection(point):
    side = 1.0 if point.x >= 0.0 else -1.0
    shoulder = Vector((side * 0.19, 0.0, 1.42))
    elbow = Vector((side * 0.47, 0.0, 1.34))
    axis = elbow - shoulder
    denom = max(axis.length_squared, 1e-8)
    t = (Vector(point) - shoulder).dot(axis) / denom
    closest = shoulder + axis * t
    radial = (Vector(point) - closest).length
    return side, shoulder, axis, t, radial


def _sleeve_predicate(point):
    _, _, _, t, radial = _arm_projection(point)
    return -0.10 <= t <= 0.69 and radial <= 0.125 and point.z >= 1.255


def _shorts_predicate(point):
    return 0.755 <= point.z <= 1.015 and abs(point.x) <= 0.355


def _socks_predicate(point):
    return 0.108 <= point.z <= 0.492


def _premium_hair_shell(armature, material):
    body = bpy.data.objects.get("Viktor_Kane_Body")
    if body is None:
        raise RuntimeError("V48.3 body missing while creating hair")

    def predicate(point):
        # Mature high front hairline; close sides/back. The centre front sits
        # safely above the brow region so no hair can cross the eyes in 3/4.
        if point.y < -0.018:
            temple = min(1.0, abs(point.x) / 0.105)
            threshold = 1.778 + 0.020 * (temple ** 1.35)
        elif point.y > 0.040:
            threshold = 1.685
        else:
            threshold = 1.710
        return point.z >= threshold

    hair = _surface_shell(
        "Viktor_Hair",
        predicate,
        material,
        outward=0.0065,
        smooth_factor=0.010,
        subdivide=False,
    )

    for vertex in hair.data.vertices:
        # Millimetre-scale crown breakup avoids a plastic helmet silhouette
        # without creating spikes or changing the production envelope.
        if vertex.co.z > 1.790:
            vertex.co.z += 0.0018 * math.sin(vertex.co.x * 67.0 + vertex.co.y * 31.0)
        vertex.co.z = min(vertex.co.z, 1.884)
    hair.data.update()
    for polygon in hair.data.polygons:
        polygon.use_smooth = True
    hair["football_lab_attachment"] = "inherited-clean-mature-short-hair"
    hair["football_lab_art_revision"] = "V48.3"
    return hair


def _regularise_shirt(shirt):
    boundary = _boundary_vertices(shirt)
    for index in boundary:
        vertex = shirt.data.vertices[index]
        p = vertex.co.copy()

        # Straight lower shirt hem. KANE/10 is much higher so it is unaffected.
        if p.z < 1.045:
            vertex.co.z = 0.997
            continue

        # Smooth crew-neck boundary on the inherited cloth surface. This edits
        # the already-skinned shell, so there is no extra collar object to float.
        if p.z > 1.472 and abs(p.x) < 0.158:
            if p.y < 0.0:
                centre_z, radius_z, radius_x = 1.558, 0.080, 0.145
            else:
                centre_z, radius_z, radius_x = 1.565, 0.052, 0.138
            ratio = min(0.999, abs(p.x) / radius_x)
            target_z = centre_z - radius_z * math.sqrt(max(0.0, 1.0 - ratio * ratio))
            vertex.co.z = p.z * 0.25 + target_z * 0.75
    shirt.data.update()
    shirt["football_lab_clean_inherited_hem"] = True
    return shirt


def _regularise_sleeves(sleeves):
    boundary = _boundary_vertices(sleeves)
    for index in boundary:
        vertex = sleeves.data.vertices[index]
        side, shoulder, axis, t, radial = _arm_projection(vertex.co)
        if t < 0.53:
            continue
        closest = shoulder + axis * t
        radial_vector = vertex.co - closest
        # Project cuff boundary onto one plane perpendicular to the upper-arm
        # axis. This removes the saw-tooth horizontal crop while retaining the
        # original armature weights and deformation.
        vertex.co = shoulder + axis * 0.675 + radial_vector
    sleeves.data.update()
    sleeves["football_lab_axis_aligned_cuffs"] = True
    return sleeves


def _regularise_shorts(shorts):
    boundary = _boundary_vertices(shorts)
    for index in boundary:
        vertex = shorts.data.vertices[index]
        if vertex.co.z < 0.835:
            vertex.co.z = 0.765
        elif vertex.co.z > 0.985:
            vertex.co.z = min(vertex.co.z, 1.012)
    shorts.data.update()
    shorts["football_lab_clean_inherited_hems"] = True
    return shorts


def _regularise_socks(socks):
    boundary = _boundary_vertices(socks)
    for index in boundary:
        vertex = socks.data.vertices[index]
        if vertex.co.z > 0.445:
            vertex.co.z = 0.490
        elif vertex.co.z < 0.145:
            vertex.co.z = max(0.108, vertex.co.z)
    socks.data.update()
    socks["football_lab_clean_inherited_tops"] = True
    return socks


def _smooth_forefoot(boots):
    # Start from V47.4's verified bind-space boot shaping exactly once.
    _shape_inherited_boots(boots)

    mesh = boots.data
    neighbours = defaultdict(set)
    for edge in mesh.edges:
        a, b = edge.vertices
        neighbours[int(a)].add(int(b))
        neighbours[int(b)].add(int(a))

    toe_indices = [
        vertex.index for vertex in mesh.vertices
        if vertex.co.y < -0.075 and vertex.co.z < 0.165
    ]

    # Laplacian smoothing only on the forefoot removes individual toe knuckles.
    # Preserve each foot's side and expand very slightly afterwards so the black
    # shoe surface remains outside the anatomical body rather than revealing skin.
    for _ in range(5):
        updates = {}
        for index in toe_indices:
            vertex = mesh.vertices[index]
            linked = [mesh.vertices[j].co for j in neighbours[index] if j in neighbours]
            if not linked:
                continue
            average = sum(linked, Vector()) / len(linked)
            blended = vertex.co.lerp(average, 0.34)
            # Do not let left/right feet collapse towards the centre line.
            side = 1.0 if vertex.co.x >= 0.0 else -1.0
            centre_x = side * 0.105
            if side > 0:
                blended.x = max(centre_x - 0.082, blended.x)
            else:
                blended.x = min(centre_x + 0.082, blended.x)
            updates[index] = blended
        for index, value in updates.items():
            mesh.vertices[index].co = value

    # Unified rounded toe cap: blend the extreme front vertices toward a smooth
    # elliptical front profile instead of five anatomical toe tips.
    for index in toe_indices:
        vertex = mesh.vertices[index]
        side = 1.0 if vertex.co.x >= 0.0 else -1.0
        centre_x = side * 0.105
        local_x = vertex.co.x - centre_x
        if vertex.co.y < -0.165:
            width = 0.078
            nx = min(1.0, abs(local_x) / width)
            cap_y = -0.258 + 0.034 * (nx * nx)
            vertex.co.y = vertex.co.y * 0.35 + cap_y * 0.65
        # Keep a slim but safe shell around the foot after smoothing.
        vertex.co.x = centre_x + local_x * 1.018
        if vertex.co.z > 0.010:
            vertex.co.z = 0.006 + (vertex.co.z - 0.006) * 1.035
        vertex.co.z = max(vertex.co.z, 0.003)

    mesh.update()
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    boots["football_lab_attachment"] = "smoothed-inherited-skinned-football-boots"
    boots["football_lab_boot_silhouette"] = "rounded-unified-forefoot"
    boots["football_lab_art_revision"] = "V48.3"
    return boots


def _integrated_face_definition(body):
    # No extra facial geometry: material regions live on Viktor's already-skinned
    # head polygons, eliminating the floating-eye problem from V48.2.
    brow = _material("VIKTOR_V48_3_Brow", (0.085, 0.050, 0.028), 0.80)
    stubble = _material("VIKTOR_V48_3_Stubble", (0.39, 0.275, 0.225), 0.78)
    body.data.materials.append(brow)
    body.data.materials.append(stubble)
    brow_index = len(body.data.materials) - 2
    stubble_index = len(body.data.materials) - 1

    brow_faces = 0
    stubble_faces = 0
    for polygon in body.data.polygons:
        centre = _polygon_centre(body.data, polygon)
        # Front of face is negative Y. Keep regions deliberately small so the
        # subdivision topology produces shading/definition rather than face paint.
        if centre.y < -0.052 and 1.748 <= centre.z <= 1.770 and 0.014 <= abs(centre.x) <= 0.070:
            polygon.material_index = brow_index
            brow_faces += 1
        elif centre.y < -0.035 and 1.610 <= centre.z <= 1.690 and abs(centre.x) <= 0.105:
            polygon.material_index = stubble_index
            stubble_faces += 1

    body.data.update()
    body["football_lab_integrated_face_definition"] = True
    body["football_lab_brow_faces"] = brow_faces
    body["football_lab_stubble_faces"] = stubble_faces
    print("V48_3_FACE_REGIONS", "brows=", brow_faces, "stubble=", stubble_faces)
    return body


def _v483_polish_boots(boots):
    return _smooth_forefoot(boots)


def create_v483_kit_hair_face(armature):
    hair = base_create_kit(armature)

    shirt = bpy.data.objects.get("Viktor_Shirt")
    sleeves = bpy.data.objects.get("Viktor_Sleeves_Navy")
    shorts = bpy.data.objects.get("Viktor_Shorts")
    socks = bpy.data.objects.get("Viktor_Socks")
    boots = bpy.data.objects.get("Viktor_Boots")
    body = bpy.data.objects.get("Viktor_Kane_Body")
    if not all((shirt, sleeves, shorts, socks, boots, body)):
        raise RuntimeError("V48.3 expected inherited character surfaces are missing")

    _regularise_shirt(shirt)
    _regularise_sleeves(sleeves)
    _regularise_shorts(shorts)
    _regularise_socks(socks)
    _integrated_face_definition(body)
    return hair


def add_v483_metadata(body, armature):
    base_add_metadata(body, armature)
    body["football_lab_build"] = "48.3.0"
    body["football_lab_art_revision"] = "V48.3"
    body["football_lab_inherited_surface_only_polish"] = True
    body["football_lab_floating_overlay_geometry"] = False
    body["football_lab_corrected_hairline"] = True
    body["football_lab_clean_kit_edges"] = True
    body["football_lab_smoothed_boot_forefoot"] = True
    armature["football_lab_build"] = "48.3.0"
    armature["football_lab_art_revision"] = "V48.3"


# Patch the V48.1 kit function's global lookups before invoking it.
v48_globals["_v48_shirt"] = _shirt_predicate
v48_globals["_v48_sleeves"] = _sleeve_predicate
v48_globals["_v48_shorts"] = _shorts_predicate
v48_globals["_v48_socks"] = _socks_predicate
v48_globals["_hair_shell"] = _premium_hair_shell
v48_globals["_polish_boots"] = _v483_polish_boots

builder.add_hair = create_v483_kit_hair_face
builder.add_metadata = add_v483_metadata
builder.main()
