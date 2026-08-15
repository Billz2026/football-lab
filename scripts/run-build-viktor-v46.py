"""Production authoring wrapper for Viktor Kane V46.

The realistic Blender Studio CC0 body, Football Lab armature and seven football
clips are retained. Clothing is authored as clean purpose-built skinned meshes
rather than sliced body topology, eliminating jagged jersey seams and asymmetric
sock/boot coverage in the authoritative gameplay camera.
"""

import importlib.util
import math
import os

import bpy
from mathutils import Vector

MODULE_PATH = os.path.join(os.path.dirname(__file__), "build-viktor-v46.py")
spec = importlib.util.spec_from_file_location("football_lab_viktor_builder", MODULE_PATH)
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)

KIT_MESHES = {
    "Viktor_Shirt",
    "Viktor_Sleeves_Navy",
    "Viktor_Shorts",
    "Viktor_Socks",
    "Viktor_Boots",
}


def clean_isolate_body(source):
    bpy.ops.object.select_all(action="DESELECT")
    source.hide_set(False)
    source.hide_viewport = False
    source.hide_render = False
    source.select_set(True)
    bpy.context.view_layer.objects.active = source
    bpy.ops.object.duplicate()

    body = bpy.context.active_object
    body.name = "Viktor_Kane_Body"
    body.data = body.data.copy()

    world_matrix = body.matrix_world.copy()
    body.parent = None
    body.matrix_world = world_matrix

    for modifier in list(body.modifiers):
        body.modifiers.remove(modifier)
    for constraint in list(body.constraints):
        body.constraints.remove(constraint)
    if body.animation_data:
        body.animation_data_clear()
    if body.data.animation_data:
        body.data.animation_data_clear()

    if body.data.shape_keys:
        try:
            bpy.context.view_layer.objects.active = body
            body.select_set(True)
            bpy.ops.object.shape_key_remove(all=True, apply_mix=True)
        except Exception as exc:
            print("VIKTOR_SHAPEKEY_CLEAN_WARNING", repr(exc))

    for obj in list(bpy.data.objects):
        if obj is not body:
            bpy.data.objects.remove(obj, do_unlink=True)

    return body


def clean_normalise_body(body):
    bpy.ops.object.select_all(action="DESELECT")
    body.select_set(True)
    bpy.context.view_layer.objects.active = body

    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    minimum, maximum = builder.mesh_world_bounds(body)
    source_height = maximum.z - minimum.z
    if source_height <= 0.1:
        raise RuntimeError(f"Invalid Viktor source height {source_height}")

    uniform_scale = builder.TARGET_HEIGHT / source_height
    body.scale = (uniform_scale, uniform_scale, uniform_scale)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    minimum, maximum = builder.mesh_world_bounds(body)
    body.location.x -= (minimum.x + maximum.x) * 0.5
    body.location.y -= (minimum.y + maximum.y) * 0.5
    body.location.z -= minimum.z
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)

    minimum, maximum = builder.mesh_world_bounds(body)
    height = maximum.z - minimum.z
    for vertex in body.data.vertices:
        z = (vertex.co.z - minimum.z) / max(height, 1e-6)
        width = 1.0
        depth = 1.0
        if 0.56 <= z <= 0.78:
            width, depth = 1.085, 1.055
        elif 0.47 <= z < 0.56:
            width, depth = 1.035, 1.045
        elif 0.28 <= z < 0.47:
            width, depth = 1.07, 1.07
        elif 0.09 <= z < 0.28:
            width, depth = 1.045, 1.045
        vertex.co.x *= width
        vertex.co.y *= depth
    body.data.update()

    minimum, maximum = builder.mesh_world_bounds(body)
    final_height = maximum.z - minimum.z
    centre = (minimum + maximum) * 0.5
    print(
        "VIKTOR_NORMALISED",
        "min=", tuple(round(v, 5) for v in minimum),
        "max=", tuple(round(v, 5) for v in maximum),
        "centre=", tuple(round(v, 5) for v in centre),
        "height=", round(final_height, 5),
    )
    if abs(final_height - builder.TARGET_HEIGHT) > 0.01:
        raise RuntimeError(f"Viktor height drifted during normalisation: {final_height}")
    if abs(centre.x) > 0.03 or abs(centre.y) > 0.03 or abs(minimum.z) > 0.01:
        raise RuntimeError(
            f"Viktor origin normalisation failed: centre=({centre.x:.3f},{centre.y:.3f}), ground={minimum.z:.3f}"
        )
    return body


def skin_only_material(body):
    body.data.materials.clear()
    skin = builder.make_material("VIKTOR_Skin", (0.62, 0.43, 0.33), 0.74)
    body.data.materials.append(skin)
    for polygon in body.data.polygons:
        polygon.material_index = 0
    body.data.update()


def _new_skinned_mesh(name, vertices, faces, material, armature, weights):
    if not vertices or not faces:
        raise RuntimeError(f"Cannot create empty Viktor mesh {name}")

    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update(calc_edges=True)
    for polygon in mesh.polygons:
        polygon.use_smooth = True

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(material)
    obj.parent = armature
    obj.matrix_parent_inverse = armature.matrix_world.inverted()

    for bone_name, entries in weights.items():
        group = obj.vertex_groups.new(name=bone_name)
        by_weight = {}
        for index, weight in entries:
            by_weight.setdefault(round(float(weight), 6), []).append(index)
        for weight, indices in by_weight.items():
            group.add(indices, weight, "REPLACE")

    modifier = obj.modifiers.new(name="FL_Skin", type="ARMATURE")
    modifier.object = armature
    modifier.use_vertex_groups = True
    obj["football_lab_kit_shell"] = name in KIT_MESHES
    return obj


def _append_elliptic_rings(vertices, faces, weights, rings, segments=28, x_offset=0.0):
    starts = []
    for ring in rings:
        start = len(vertices)
        starts.append(start)
        z, rx, ry, bone_weights = ring
        for segment in range(segments):
            angle = (2 * math.pi * segment) / segments
            index = len(vertices)
            vertices.append((x_offset + rx * math.cos(angle), ry * math.sin(angle), z))
            for bone_name, weight in bone_weights.items():
                weights.setdefault(bone_name, []).append((index, weight))

    for ring_index in range(len(starts) - 1):
        lower = starts[ring_index]
        upper = starts[ring_index + 1]
        for segment in range(segments):
            nxt = (segment + 1) % segments
            faces.append((
                lower + segment,
                lower + nxt,
                upper + nxt,
                upper + segment,
            ))
    return starts


def _append_tube_between(vertices, faces, weights, start_point, end_point, start_radius, end_radius, bone_name, segments=20):
    start_point = Vector(start_point)
    end_point = Vector(end_point)
    direction = (end_point - start_point).normalized()
    basis_a = Vector((0.0, 1.0, 0.0))
    if abs(direction.dot(basis_a)) > 0.95:
        basis_a = Vector((1.0, 0.0, 0.0))
    basis_b = direction.cross(basis_a).normalized()
    basis_a = basis_b.cross(direction).normalized()

    starts = []
    for centre, radius in ((start_point, start_radius), (end_point, end_radius)):
        ring_start = len(vertices)
        starts.append(ring_start)
        for segment in range(segments):
            angle = 2 * math.pi * segment / segments
            radial = basis_a * (math.cos(angle) * radius) + basis_b * (math.sin(angle) * radius)
            index = len(vertices)
            point = centre + radial
            vertices.append(tuple(point))
            weights.setdefault(bone_name, []).append((index, 1.0))

    for segment in range(segments):
        nxt = (segment + 1) % segments
        faces.append((starts[0] + segment, starts[0] + nxt, starts[1] + nxt, starts[1] + segment))


def _append_box(vertices, faces, weights, minimum, maximum, bone_name):
    x0, y0, z0 = minimum
    x1, y1, z1 = maximum
    start = len(vertices)
    vertices.extend([
        (x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0),
        (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1),
    ])
    faces.extend([
        (start + 0, start + 3, start + 2, start + 1),
        (start + 4, start + 5, start + 6, start + 7),
        (start + 0, start + 1, start + 5, start + 4),
        (start + 1, start + 2, start + 6, start + 5),
        (start + 2, start + 3, start + 7, start + 6),
        (start + 3, start + 0, start + 4, start + 7),
    ])
    for index in range(start, start + 8):
        weights.setdefault(bone_name, []).append((index, 1.0))


def _create_shirt(armature, material):
    vertices, faces, weights = [], [], {}
    rings = [
        (0.975, 0.225, 0.145, {"Hips": 0.22, "Spine": 0.78}),
        (1.105, 0.245, 0.153, {"Spine": 0.90, "Chest": 0.10}),
        (1.270, 0.265, 0.164, {"Spine": 0.35, "Chest": 0.65}),
        (1.405, 0.296, 0.174, {"Chest": 1.00}),
        (1.475, 0.125, 0.100, {"Chest": 0.78, "Neck": 0.22}),
    ]
    _append_elliptic_rings(vertices, faces, weights, rings, segments=32)
    return _new_skinned_mesh("Viktor_Shirt", vertices, faces, material, armature, weights)


def _create_sleeves(armature, material):
    vertices, faces, weights = [], [], {}
    _append_tube_between(
        vertices, faces, weights,
        (0.205, 0.0, 1.420), (0.430, 0.0, 1.355),
        0.112, 0.088, "LeftUpperArm", segments=22,
    )
    _append_tube_between(
        vertices, faces, weights,
        (-0.205, 0.0, 1.420), (-0.430, 0.0, 1.355),
        0.112, 0.088, "RightUpperArm", segments=22,
    )
    return _new_skinned_mesh("Viktor_Sleeves_Navy", vertices, faces, material, armature, weights)


def _create_shorts(armature, material):
    vertices, faces, weights = [], [], {}
    trunk = [
        (1.015, 0.246, 0.158, {"Hips": 1.0}),
        (0.905, 0.255, 0.170, {"Hips": 1.0}),
        (0.800, 0.226, 0.158, {"Hips": 1.0}),
    ]
    _append_elliptic_rings(vertices, faces, weights, trunk, segments=30)
    left_leg = [
        (0.865, 0.118, 0.130, {"LeftUpperLeg": 1.0}),
        (0.690, 0.104, 0.112, {"LeftUpperLeg": 1.0}),
    ]
    right_leg = [
        (0.865, 0.118, 0.130, {"RightUpperLeg": 1.0}),
        (0.690, 0.104, 0.112, {"RightUpperLeg": 1.0}),
    ]
    _append_elliptic_rings(vertices, faces, weights, left_leg, segments=24, x_offset=0.108)
    _append_elliptic_rings(vertices, faces, weights, right_leg, segments=24, x_offset=-0.108)
    return _new_skinned_mesh("Viktor_Shorts", vertices, faces, material, armature, weights)


def _create_socks(armature, material):
    vertices, faces, weights = [], [], {}
    for side, bone in ((1, "LeftLowerLeg"), (-1, "RightLowerLeg")):
        rings = [
            (0.115, 0.058, 0.062, {bone: 1.0}),
            (0.285, 0.070, 0.074, {bone: 1.0}),
            (0.485, 0.078, 0.082, {bone: 1.0}),
        ]
        _append_elliptic_rings(vertices, faces, weights, rings, segments=22, x_offset=side * 0.106)
    return _new_skinned_mesh("Viktor_Socks", vertices, faces, material, armature, weights)


def _create_boots(armature, material):
    vertices, faces, weights = [], [], {}
    for side, bone in ((1, "LeftFoot"), (-1, "RightFoot")):
        centre_x = side * 0.106
        cuff_rings = [
            (0.025, 0.074, 0.082, {bone: 1.0}),
            (0.135, 0.068, 0.076, {bone: 1.0}),
        ]
        _append_elliptic_rings(vertices, faces, weights, cuff_rings, segments=20, x_offset=centre_x)
        _append_box(
            vertices, faces, weights,
            (centre_x - 0.082, -0.245, 0.010),
            (centre_x + 0.082, 0.045, 0.090),
            bone,
        )
    return _new_skinned_mesh("Viktor_Boots", vertices, faces, material, armature, weights)


def _create_hair(armature, material):
    vertices, faces, weights = [], [], {}
    rings = 11
    segments = 34
    centre = Vector((0.0, -0.006, 1.790))
    radius_x, radius_y, radius_z = 0.132, 0.119, 0.095
    max_theta = 2.35

    ring_starts = []
    for ring in range(rings + 1):
        theta = (ring / rings) * max_theta
        start = len(vertices)
        ring_starts.append(start)
        for segment in range(segments):
            phi = 2 * math.pi * segment / segments
            texture = 1.0 + 0.020 * math.sin(phi * 7.0 + ring * 0.9)
            point = (
                centre.x + radius_x * texture * math.sin(theta) * math.cos(phi),
                centre.y + radius_y * texture * math.sin(theta) * math.sin(phi),
                min(1.886, centre.z + radius_z * texture * math.cos(theta)),
            )
            index = len(vertices)
            vertices.append(point)
            weights.setdefault("Head", []).append((index, 1.0))

    for ring in range(rings):
        lower = ring_starts[ring]
        upper = ring_starts[ring + 1]
        for segment in range(segments):
            nxt = (segment + 1) % segments
            faces.append((lower + segment, lower + nxt, upper + nxt, upper + segment))

    hair = _new_skinned_mesh("Viktor_Hair", vertices, faces, material, armature, weights)
    hair["football_lab_attachment"] = "head-hair"
    return hair


def create_clean_kit_and_hair(armature):
    white = builder.make_material("VIKTOR_Kit_White", (0.91, 0.93, 0.95), 0.61)
    navy = builder.make_material("VIKTOR_Kit_Navy", (0.018, 0.045, 0.090), 0.56)
    sleeve_navy = builder.make_material("VIKTOR_Sleeve_Navy", (0.022, 0.060, 0.125), 0.54)
    sock_white = builder.make_material("VIKTOR_Sock_White", (0.88, 0.905, 0.925), 0.64)
    boot_black = builder.make_material("VIKTOR_Boot_Black", (0.010, 0.014, 0.020), 0.42)
    blond = builder.make_material("VIKTOR_Hair", (0.43, 0.31, 0.15), 0.76)

    _create_shirt(armature, white)
    _create_sleeves(armature, sleeve_navy)
    _create_shorts(armature, navy)
    _create_socks(armature, sock_white)
    _create_boots(armature, boot_black)
    return _create_hair(armature, blond)


def guarded_export_glb(path):
    allowed = {"Viktor_Kane_Body", "Viktor_Hair", "FL_HUMANOID_V1", *KIT_MESHES}
    for obj in list(bpy.data.objects):
        if obj.name not in allowed:
            print("VIKTOR_EXPORT_PRUNE", obj.name, obj.type)
            bpy.data.objects.remove(obj, do_unlink=True)

    meshes = [obj for obj in bpy.data.objects if obj.type == "MESH"]
    armatures = [obj for obj in bpy.data.objects if obj.type == "ARMATURE"]
    expected_meshes = {"Viktor_Kane_Body", "Viktor_Hair", *KIT_MESHES}
    if {obj.name for obj in meshes} != expected_meshes:
        raise RuntimeError(f"Unexpected Viktor export meshes: {[obj.name for obj in meshes]}")
    if [obj.name for obj in armatures] != ["FL_HUMANOID_V1"]:
        raise RuntimeError(f"Unexpected Viktor export armatures: {[obj.name for obj in armatures]}")

    builder_original_export(path)


builder_original_export = builder.export_glb
builder.isolate_body = clean_isolate_body
builder.normalise_body = clean_normalise_body
builder.assign_kit_materials = skin_only_material
builder.add_hair = create_clean_kit_and_hair
builder.export_glb = guarded_export_glb
builder.main()
