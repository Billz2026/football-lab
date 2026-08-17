"""Football Lab Viktor V48.2 art-quality rebuild.

The neutral V48.1 review proved that gameplay-camera success was hiding four
unacceptable close-view defects: a hair shell crossing the eyes, raw polygon-cut
kit edges, anatomical toe shapes reading through the black foot shell, and a
feature-light face. V48.2 keeps the verified 1.88 m proportions, skeleton and
seven strike clips, but adds a clean presentation layer designed to survive
front, three-quarter, rear and animated gameplay review.

Viktor Kane remains an original Football Lab character: a tall, mature English
number-nine archetype, not a direct likeness of any real footballer.
"""

import math
import os

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
base_create_kit = v48_globals["create_v48_kit_and_hair"]
base_add_metadata = builder.add_metadata


def _ensure_armature(obj, armature, name="V48_2_Armature"):
    obj.parent = armature
    modifier = next((m for m in obj.modifiers if m.type == "ARMATURE"), None)
    if modifier is None:
        modifier = obj.modifiers.new(name=name, type="ARMATURE")
    modifier.object = armature
    return obj


def _mesh_obj(name, vertices, faces, material, armature):
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    mesh.materials.append(material)
    for polygon in mesh.polygons:
        polygon.material_index = 0
        polygon.use_smooth = True
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    _ensure_armature(obj, armature)
    return obj


def _weight_all(obj, bone_name, weight=1.0):
    group = obj.vertex_groups.get(bone_name) or obj.vertex_groups.new(name=bone_name)
    group.add([v.index for v in obj.data.vertices], weight, "REPLACE")


def _join_into(target, detail):
    bpy.ops.object.select_all(action="DESELECT")
    target.select_set(True)
    detail.select_set(True)
    bpy.context.view_layer.objects.active = target
    bpy.ops.object.join()
    target.data.update()
    return target


def _elliptical_trim(name, z, outer_rx, outer_ry, inner_rx, inner_ry, height, material, armature, bone):
    segments = 32
    vertices = []
    faces = []
    z0 = z - height * 0.5
    z1 = z + height * 0.5
    for level_z in (z0, z1):
        for rx, ry in ((outer_rx, outer_ry), (inner_rx, inner_ry)):
            for i in range(segments):
                angle = 2.0 * math.pi * i / segments
                vertices.append((rx * math.cos(angle), ry * math.sin(angle), level_z))

    # indices per layer: outer bottom, inner bottom, outer top, inner top
    ob = 0
    ib = segments
    ot = segments * 2
    it = segments * 3
    for i in range(segments):
        j = (i + 1) % segments
        faces.extend([
            (ob + i, ob + j, ot + j, ot + i),
            (it + i, it + j, ib + j, ib + i),
            (ot + i, ot + j, it + j, it + i),
            (ib + i, ib + j, ob + j, ob + i),
        ])
    obj = _mesh_obj(name, vertices, faces, material, armature)
    _weight_all(obj, bone)
    return obj


def _oriented_cuff(name, start, end, centre_t, half_length, radius_y, radius_z, material, armature, bone):
    start = Vector(start)
    end = Vector(end)
    axis = (end - start).normalized()
    centre = start.lerp(end, centre_t)
    # Skeleton upper arms lie mostly in X/Z; world Y is a stable depth axis.
    basis_y = Vector((0.0, 1.0, 0.0))
    basis_z = axis.cross(basis_y).normalized()
    segments = 20
    vertices = []
    faces = []
    for longitudinal in (-half_length, half_length):
        ring_centre = centre + axis * longitudinal
        for i in range(segments):
            angle = 2.0 * math.pi * i / segments
            point = (
                ring_centre
                + basis_y * (math.cos(angle) * radius_y)
                + basis_z * (math.sin(angle) * radius_z)
            )
            vertices.append(tuple(point))
    for i in range(segments):
        j = (i + 1) % segments
        faces.append((i, j, segments + j, segments + i))
    obj = _mesh_obj(name, vertices, faces, material, armature)
    _weight_all(obj, bone)
    return obj


def _leg_band(name, x, z, rx, ry, height, material, armature, bone):
    # Closed elliptical cuff around a thigh/calf. It intentionally overlaps the
    # body-derived shell by a few millimetres to hide the shell's polygon cut.
    segments = 24
    vertices = []
    faces = []
    for level in (z - height * 0.5, z + height * 0.5):
        for i in range(segments):
            angle = 2.0 * math.pi * i / segments
            vertices.append((x + rx * math.cos(angle), ry * math.sin(angle), level))
    for i in range(segments):
        j = (i + 1) % segments
        faces.append((i, j, segments + j, segments + i))
    obj = _mesh_obj(name, vertices, faces, material, armature)
    _weight_all(obj, bone)
    return obj


def _premium_hair_shell(armature, material):
    body = bpy.data.objects.get("Viktor_Kane_Body")
    if body is None:
        raise RuntimeError("V48.2 body missing while creating hair")

    def predicate(point):
        # Front hairline is now safely above the eye/brow band. Sides and back
        # retain the mature close-crop silhouette from the accepted gameplay view.
        if point.y < -0.018:
            threshold = 1.790 + min(0.018, abs(point.x) * 0.09)
        elif point.y > 0.035:
            threshold = 1.690
        else:
            threshold = 1.720
        return point.z >= threshold

    hair = _surface_shell(
        "Viktor_Hair",
        predicate,
        material,
        outward=0.006,
        smooth_factor=0.009,
        subdivide=False,
    )

    # Subtle asymmetric crown/side-part treatment. No helmet cap, no fringe over eyes.
    for vertex in hair.data.vertices:
        if vertex.co.z > 1.79 and vertex.co.y < 0.025:
            part_bias = max(0.0, min(1.0, (vertex.co.x + 0.085) / 0.17))
            vertex.co.z += 0.0045 * (1.0 - part_bias)
            vertex.co.y -= 0.0015 * math.sin((vertex.co.x + 0.11) * 36.0)
        vertex.co.z = min(vertex.co.z, 1.884)
    hair.data.update()
    for polygon in hair.data.polygons:
        polygon.use_smooth = True
    hair["football_lab_attachment"] = "clean-mature-short-side-part"
    hair["football_lab_art_revision"] = "V48.2"
    return hair


def _front_surface_y(body, x, z, dx=0.028, dz=0.025):
    candidates = [
        v.co.y for v in body.data.vertices
        if abs(v.co.x - x) <= dx and abs(v.co.z - z) <= dz and v.co.y < 0.0
    ]
    if not candidates:
        return -0.095
    # Front of Viktor faces negative Y in bind space.
    return min(candidates)


def _face_disc(name, x, z, rx, rz, material, body, armature, segments=16, y_offset=-0.0015):
    y = _front_surface_y(body, x, z) + y_offset
    vertices = [(x, y, z)]
    for i in range(segments):
        angle = 2.0 * math.pi * i / segments
        vertices.append((x + rx * math.cos(angle), y, z + rz * math.sin(angle)))
    faces = []
    for i in range(segments):
        faces.append((0, 1 + i, 1 + ((i + 1) % segments)))
    obj = _mesh_obj(name, vertices, faces, material, armature)
    _weight_all(obj, "Head")
    return obj


def _brow_bar(name, x, z, width, material, body, armature, tilt):
    y = _front_surface_y(body, x, z) - 0.0017
    half = width * 0.5
    dz = math.tan(math.radians(tilt)) * half
    thickness = 0.004
    vertices = [
        (x - half, y, z - dz - thickness),
        (x + half, y, z + dz - thickness),
        (x + half, y, z + dz + thickness),
        (x - half, y, z - dz + thickness),
    ]
    obj = _mesh_obj(name, vertices, [(0, 1, 2, 3)], material, armature)
    _weight_all(obj, "Head")
    return obj


def _add_face_definition(body, armature):
    sclera = _material("VIKTOR_V48_2_Eye_White", (0.72, 0.72, 0.69), 0.48)
    iris = _material("VIKTOR_V48_2_Iris", (0.055, 0.045, 0.032), 0.50)
    brow = _material("VIKTOR_V48_2_Brow", (0.075, 0.045, 0.025), 0.78)

    # Compact, non-cartoon eye treatment. The white is deliberately muted and
    # the iris small; from gameplay distance it reads as facial focus, not dots.
    for x in (-0.036, 0.036):
        white = _face_disc(f"V48_2_EyeWhite_{x:+.3f}", x, 1.742, 0.0125, 0.0044, sclera, body, armature)
        _join_into(body, white)
        pupil = _face_disc(f"V48_2_Iris_{x:+.3f}", x, 1.742, 0.0038, 0.0033, iris, body, armature, y_offset=-0.0023)
        _join_into(body, pupil)

    left_brow = _brow_bar("V48_2_Brow_L", -0.036, 1.760, 0.031, brow, body, armature, -5.0)
    _join_into(body, left_brow)
    right_brow = _brow_bar("V48_2_Brow_R", 0.036, 1.760, 0.031, brow, body, armature, 5.0)
    _join_into(body, right_brow)

    body["football_lab_face_definition"] = "muted-eyes-brows-mature-striker"
    return body


def _shoe_overlay(boots, armature, material):
    vertices = []
    faces = []
    vertex_meta = []
    rings = 8
    sections = 16

    for side, centre_x, foot_bone, toe_bone in (
        (1, 0.105, "LeftFoot", "LeftToe"),
        (-1, -0.105, "RightFoot", "RightToe"),
    ):
        start_index = len(vertices)
        for r in range(rings):
            t = r / (rings - 1)
            y = 0.035 + (-0.295 - 0.035) * t
            # Wide forefoot with a tapered aerodynamic toe, not five toe bumps.
            width = 0.047 + 0.025 * math.sin(math.pi * min(1.0, t * 1.08))
            width *= 1.0 - 0.30 * max(0.0, (t - 0.78) / 0.22)
            centre_z = 0.058 - 0.013 * t
            height = 0.052 - 0.014 * t
            for s in range(sections):
                angle = 2.0 * math.pi * s / sections
                x = centre_x + width * math.cos(angle)
                z = centre_z + height * math.sin(angle)
                z = max(0.006, z)
                vertices.append((x, y, z))
                vertex_meta.append((foot_bone, toe_bone, t))
        for r in range(rings - 1):
            for s in range(sections):
                j = (s + 1) % sections
                a = start_index + r * sections + s
                b = start_index + r * sections + j
                c = start_index + (r + 1) * sections + j
                d = start_index + (r + 1) * sections + s
                faces.append((a, b, c, d))
        # heel / toe caps
        faces.append(tuple(start_index + s for s in reversed(range(sections))))
        toe_start = start_index + (rings - 1) * sections
        faces.append(tuple(toe_start + s for s in range(sections)))

    overlay = _mesh_obj("V48_2_OuterBoot", vertices, faces, material, armature)
    # Bone weights follow the real foot/toe split, preventing the rigid-boot
    # detachment that invalidated V47.3 while still keeping the shoe coherent.
    groups = {}
    for name in ("LeftFoot", "LeftToe", "RightFoot", "RightToe"):
        groups[name] = overlay.vertex_groups.new(name=name)
    for index, (foot_bone, toe_bone, t) in enumerate(vertex_meta):
        toe_weight = max(0.0, min(0.42, (t - 0.58) / 0.42 * 0.42))
        groups[foot_bone].add([index], 1.0 - toe_weight, "REPLACE")
        if toe_weight > 0.0:
            groups[toe_bone].add([index], toe_weight, "REPLACE")

    _join_into(boots, overlay)
    boots["football_lab_boot_silhouette"] = "enclosed-rounded-football-boot"
    return boots


def _add_clean_kit_edges(armature):
    shirt = bpy.data.objects.get("Viktor_Shirt")
    sleeves = bpy.data.objects.get("Viktor_Sleeves_Navy")
    shorts = bpy.data.objects.get("Viktor_Shorts")
    socks = bpy.data.objects.get("Viktor_Socks")
    boots = bpy.data.objects.get("Viktor_Boots")
    if not all((shirt, sleeves, shorts, socks, boots)):
        raise RuntimeError("V48.2 kit objects missing before edge cleanup")

    shirt_mat = shirt.data.materials[0]
    sleeve_mat = sleeves.data.materials[0]
    shorts_mat = shorts.data.materials[0]
    socks_mat = socks.data.materials[0]
    boot_mat = boots.data.materials[0]
    navy = _material("VIKTOR_V48_2_Edge_Navy", (0.018, 0.038, 0.080), 0.63)

    # Crew collar masks the raw polygon-cut neck boundary.
    collar = _elliptical_trim("V48_2_Collar", 1.500, 0.139, 0.119, 0.104, 0.086, 0.022, navy, armature, "Chest")
    _join_into(shirt, collar)

    # Shirt hem: thin same-cloth seam, enough overlap to hide the saw-tooth cut.
    hem = _elliptical_trim("V48_2_ShirtHem", 1.006, 0.247, 0.146, 0.231, 0.132, 0.028, shirt_mat, armature, "Spine")
    _join_into(shirt, hem)

    # Short-sleeve cuffs follow the upper-arm bones instead of horizontal cuts.
    for label, start, end, bone in (
        ("L", (0.19, 0.0, 1.42), (0.47, 0.0, 1.34), "LeftUpperArm"),
        ("R", (-0.19, 0.0, 1.42), (-0.47, 0.0, 1.34), "RightUpperArm"),
    ):
        cuff = _oriented_cuff(f"V48_2_SleeveCuff_{label}", start, end, 0.70, 0.018, 0.073, 0.068, navy, armature, bone)
        _join_into(sleeves, cuff)

    # Clean football-short hems over the upper thighs.
    for x, bone, label in ((0.105, "LeftUpperLeg", "L"), (-0.105, "RightUpperLeg", "R")):
        band = _leg_band(f"V48_2_ShortsHem_{label}", x, 0.770, 0.142, 0.112, 0.030, shorts_mat, armature, bone)
        _join_into(shorts, band)

    # Sock turnover bands hide the polygon stair-step at the calf.
    for x, bone, label in ((0.105, "LeftLowerLeg", "L"), (-0.105, "RightLowerLeg", "R")):
        band = _leg_band(f"V48_2_SockTop_{label}", x, 0.486, 0.080, 0.066, 0.030, navy, armature, bone)
        _join_into(socks, band)

    _shoe_overlay(boots, armature, boot_mat)
    return shirt, sleeves, shorts, socks, boots


def create_v482_kit_hair_and_face(armature):
    # V48.1 already contains the accepted proportions, skin response, corrected
    # KANE 10 orientation and complete skinned-foot shell.
    hair = base_create_kit(armature)
    _add_clean_kit_edges(armature)
    body = bpy.data.objects.get("Viktor_Kane_Body")
    if body is None:
        raise RuntimeError("V48.2 body missing before face definition")
    _add_face_definition(body, armature)
    return hair


def add_v482_metadata(body, armature):
    base_add_metadata(body, armature)
    body["football_lab_build"] = "48.2.0"
    body["football_lab_art_revision"] = "V48.2"
    body["football_lab_neutral_review_pass"] = "pending-render-certification"
    body["football_lab_clean_kit_edges"] = True
    body["football_lab_enclosed_boot_overlay"] = True
    body["football_lab_corrected_hairline"] = True
    armature["football_lab_build"] = "48.2.0"
    armature["football_lab_art_revision"] = "V48.2"


# The V48.1 kit function resolves _hair_shell from the V48 global namespace.
v48_globals["_hair_shell"] = _premium_hair_shell
builder.add_hair = create_v482_kit_hair_and_face
builder.add_metadata = add_v482_metadata
builder.main()
