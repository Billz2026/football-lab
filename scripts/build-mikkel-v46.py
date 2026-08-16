"""Author the Football Lab Mikkel Storm V46 goalkeeper technical master.

The source body is Blender Studio's CC0 Human Base Meshes bundle. This script
creates an original 2.04 m goalkeeper, reuses the FL_HUMANOID_V1 semantic bone
contract, adds fitted deep-green keeper kit/gloves and authors the 13 exact
in-place goalkeeper clips required by character-production-v1.js.
"""

import argparse
import importlib.util
import math
import os
import sys

import bmesh
import bpy
from mathutils import Vector

BASE_PATH = os.path.join(os.path.dirname(__file__), "build-viktor-v46.py")
spec = importlib.util.spec_from_file_location("football_lab_character_base", BASE_PATH)
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)

TARGET_HEIGHT = 2.04
SKELETON_SCALE = TARGET_HEIGHT / 1.88
REQUIRED_CLIPS = [
    "set", "shuffle-left", "shuffle-right",
    "dive-left-low", "dive-left-mid", "dive-left-high",
    "dive-right-low", "dive-right-mid", "dive-right-high",
    "parry", "catch", "landing", "recovery"
]
KIT_MESHES = {
    "Mikkel_Shirt", "Mikkel_Shorts", "Mikkel_Socks", "Mikkel_Boots", "Mikkel_Gloves"
}


def cli_args():
    argv = sys.argv
    argv = argv[argv.index("--") + 1:] if "--" in argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    return parser.parse_args(argv)


def clean_isolate_body(source):
    bpy.ops.object.select_all(action="DESELECT")
    source.hide_set(False)
    source.hide_viewport = False
    source.hide_render = False
    source.select_set(True)
    bpy.context.view_layer.objects.active = source
    bpy.ops.object.duplicate()
    body = bpy.context.active_object
    body.name = "Mikkel_Storm_Body"
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
            print("MIKKEL_SHAPEKEY_CLEAN_WARNING", repr(exc))

    for obj in list(bpy.data.objects):
        if obj is not body:
            bpy.data.objects.remove(obj, do_unlink=True)
    return body


def normalise_goalkeeper(body):
    bpy.ops.object.select_all(action="DESELECT")
    body.select_set(True)
    bpy.context.view_layer.objects.active = body
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)

    minimum, maximum = base.mesh_world_bounds(body)
    source_height = maximum.z - minimum.z
    if source_height <= 0.1:
        raise RuntimeError(f"Invalid Mikkel source height {source_height}")
    scale = TARGET_HEIGHT / source_height
    body.scale = (scale, scale, scale)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    minimum, maximum = base.mesh_world_bounds(body)
    body.location.x -= (minimum.x + maximum.x) * 0.5
    body.location.y -= (minimum.y + maximum.y) * 0.5
    body.location.z -= minimum.z
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)

    # Goalkeeper-specific mass: broader shoulders/ribcage and strong hips/legs,
    # while preserving long-limbed proportions rather than superhero bulk.
    minimum, maximum = base.mesh_world_bounds(body)
    height = maximum.z - minimum.z
    for vertex in body.data.vertices:
        zn = (vertex.co.z - minimum.z) / max(height, 1e-6)
        width = depth = 1.0
        if 0.57 <= zn <= 0.79:
            width, depth = 1.12, 1.07
        elif 0.47 <= zn < 0.57:
            width, depth = 1.06, 1.06
        elif 0.28 <= zn < 0.47:
            width, depth = 1.08, 1.07
        elif 0.08 <= zn < 0.28:
            width, depth = 1.05, 1.045
        vertex.co.x *= width
        vertex.co.y *= depth
    body.data.update()

    minimum, maximum = base.mesh_world_bounds(body)
    final_height = maximum.z - minimum.z
    if abs(final_height - TARGET_HEIGHT) > 0.012:
        raise RuntimeError(f"Mikkel height drifted: {final_height}")
    return body


def ensure_body_uv(body):
    if body.data.uv_layers:
        return
    bpy.ops.object.select_all(action="DESELECT")
    body.select_set(True)
    bpy.context.view_layer.objects.active = body
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=1.15192, island_margin=0.02)
    bpy.ops.object.mode_set(mode="OBJECT")


def make_skin_texture():
    width = height = 128
    image = bpy.data.images.new("MIKKEL_Skin_BaseColor", width=width, height=height, alpha=False)
    pixels = []
    base_colour = (0.66, 0.455, 0.335)
    for y in range(height):
        v = y / max(1, height - 1)
        for x in range(width):
            u = x / max(1, width - 1)
            pore = (
                0.010 * math.sin(u * 89.0 + v * 43.0)
                + 0.007 * math.sin(u * 157.0 - v * 113.0)
                + 0.005 * math.cos(u * 61.0 + v * 137.0)
            )
            warm = 0.005 * math.sin(v * math.pi)
            r = max(0.0, min(1.0, base_colour[0] + pore + warm))
            g = max(0.0, min(1.0, base_colour[1] + pore * 0.72 + warm * 0.4))
            b = max(0.0, min(1.0, base_colour[2] + pore * 0.5))
            pixels.extend((r, g, b, 1.0))
    image.pixels.foreach_set(pixels)
    image.pack()
    return image


def apply_skin_material(body):
    ensure_body_uv(body)
    body.data.materials.clear()
    material = bpy.data.materials.new("MIKKEL_Skin")
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    texture = nodes.new("ShaderNodeTexImage")
    texture.image = make_skin_texture()
    bsdf.inputs["Roughness"].default_value = 0.67
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.27
    if "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = 0.01
    links.new(texture.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(bsdf.outputs["BSDF"], output.inputs["Surface"])
    body.data.materials.append(material)
    for polygon in body.data.polygons:
        polygon.material_index = 0


def add_goalkeeper_armature(body):
    s = SKELETON_SCALE
    def p(x, y, z):
        return (x * s, y * s, z * s)

    bpy.ops.object.armature_add(enter_editmode=True, location=(0, 0, 0))
    armature = bpy.context.active_object
    armature.name = "FL_HUMANOID_V1"
    armature.data.name = "FL_HUMANOID_V1_Skeleton"
    edit = armature.data.edit_bones
    edit.remove(edit[0])

    def bone(name, head, tail, parent=None, connected=False):
        item = edit.new(name)
        item.head = head
        item.tail = tail
        item.roll = 0.0
        if parent:
            item.parent = edit[parent]
            item.use_connect = connected
        return item

    bone("Root", p(0, 0, 0.0), p(0, 0, 0.12))
    bone("Hips", p(0, 0, 0.88), p(0, 0, 1.02), "Root")
    bone("Spine", p(0, 0, 1.02), p(0, 0, 1.23), "Hips", True)
    bone("Chest", p(0, 0, 1.23), p(0, 0, 1.43), "Spine", True)
    bone("Neck", p(0, 0, 1.43), p(0, 0, 1.56), "Chest", True)
    bone("Head", p(0, 0, 1.56), p(0, 0, 1.79), "Neck", True)

    bone("LeftShoulder", p(0.02, 0, 1.41), p(0.19, 0, 1.42), "Chest")
    bone("LeftUpperArm", p(0.19, 0, 1.42), p(0.47, 0, 1.34), "LeftShoulder", True)
    bone("LeftLowerArm", p(0.47, 0, 1.34), p(0.69, 0, 1.24), "LeftUpperArm", True)
    bone("LeftHand", p(0.69, 0, 1.24), p(0.79, -0.01, 1.19), "LeftLowerArm", True)
    bone("RightShoulder", p(-0.02, 0, 1.41), p(-0.19, 0, 1.42), "Chest")
    bone("RightUpperArm", p(-0.19, 0, 1.42), p(-0.47, 0, 1.34), "RightShoulder", True)
    bone("RightLowerArm", p(-0.47, 0, 1.34), p(-0.69, 0, 1.24), "RightUpperArm", True)
    bone("RightHand", p(-0.69, 0, 1.24), p(-0.79, -0.01, 1.19), "RightLowerArm", True)

    bone("LeftUpperLeg", p(0.105, 0, 0.91), p(0.105, 0, 0.51), "Hips")
    bone("LeftLowerLeg", p(0.105, 0, 0.51), p(0.105, 0, 0.105), "LeftUpperLeg", True)
    bone("LeftFoot", p(0.105, 0, 0.105), p(0.105, -0.13, 0.065), "LeftLowerLeg", True)
    bone("LeftToe", p(0.105, -0.13, 0.065), p(0.105, -0.24, 0.055), "LeftFoot", True)
    bone("RightUpperLeg", p(-0.105, 0, 0.91), p(-0.105, 0, 0.51), "Hips")
    bone("RightLowerLeg", p(-0.105, 0, 0.51), p(-0.105, 0, 0.105), "RightUpperLeg", True)
    bone("RightFoot", p(-0.105, 0, 0.105), p(-0.105, -0.13, 0.065), "RightLowerLeg", True)
    bone("RightToe", p(-0.105, -0.13, 0.065), p(-0.105, -0.24, 0.055), "RightFoot", True)

    bpy.ops.object.mode_set(mode="OBJECT")
    armature.show_in_front = True
    bpy.ops.object.select_all(action="DESELECT")
    body.select_set(True)
    armature.select_set(True)
    bpy.context.view_layer.objects.active = armature
    try:
        bpy.ops.object.parent_set(type="ARMATURE_AUTO")
    except Exception as exc:
        print("MIKKEL_AUTO_WEIGHT_WARNING", repr(exc))
        bpy.ops.object.parent_set(type="ARMATURE_ENVELOPE")
    return armature


def face_centre(face):
    n = max(1, len(face.verts))
    return Vector((
        sum(v.co.x for v in face.verts) / n,
        sum(v.co.y for v in face.verts) / n,
        sum(v.co.z for v in face.verts) / n,
    ))


def surface_shell(body, name, predicate, material, outward=0.014, smooth=0.03, subdivide=True, min_z=None):
    shell = body.copy()
    shell.data = body.data.copy()
    shell.name = name
    shell.data.name = f"{name}_Mesh"
    bpy.context.collection.objects.link(shell)
    shell.data.materials.clear()
    shell.data.materials.append(material)
    for polygon in shell.data.polygons:
        polygon.material_index = 0

    bm = bmesh.new()
    bm.from_mesh(shell.data)
    bm.normal_update()
    remove_faces = [face for face in bm.faces if not predicate(face_centre(face))]
    if remove_faces:
        bmesh.ops.delete(bm, geom=remove_faces, context="FACES")
    loose_edges = [edge for edge in bm.edges if not edge.link_faces]
    if loose_edges:
        bmesh.ops.delete(bm, geom=loose_edges, context="EDGES")
    loose_vertices = [vertex for vertex in bm.verts if not vertex.link_faces]
    if loose_vertices:
        bmesh.ops.delete(bm, geom=loose_vertices, context="VERTS")
    if subdivide and bm.edges:
        bmesh.ops.subdivide_edges(bm, edges=list(bm.edges), cuts=1, use_grid_fill=True)
    bm.normal_update()
    if smooth > 0 and bm.verts:
        bmesh.ops.smooth_vert(bm, verts=list(bm.verts), factor=smooth, use_axis_x=True, use_axis_y=True, use_axis_z=True)
        bm.normal_update()
    for vertex in bm.verts:
        vertex.co += vertex.normal * outward
        if min_z is not None and vertex.co.z < min_z:
            vertex.co.z = min_z
    bm.to_mesh(shell.data)
    bm.free()
    shell.data.update()
    for polygon in shell.data.polygons:
        polygon.use_smooth = True
    if not shell.data.polygons:
        raise RuntimeError(f"Mikkel fitted surface {name} has no faces")
    return shell


def create_kit(body):
    green = base.make_material("MIKKEL_Deep_Green", (0.018, 0.18, 0.10), 0.60)
    green_dark = base.make_material("MIKKEL_Deep_Green_Dark", (0.012, 0.105, 0.065), 0.59)
    socks_green = base.make_material("MIKKEL_Socks_Green", (0.016, 0.12, 0.074), 0.63)
    boots = base.make_material("MIKKEL_Boots", (0.010, 0.014, 0.018), 0.44)
    gloves = base.make_material("MIKKEL_Gloves", (0.78, 0.84, 0.72), 0.52)
    minimum, maximum = base.mesh_world_bounds(body)
    max_abs_x = max(abs(minimum.x), abs(maximum.x))

    surface_shell(body, "Mikkel_Shirt", lambda p: 1.02 <= p.z <= 1.73 and abs(p.x) <= max_abs_x * 0.88, green, 0.014, 0.035)
    surface_shell(body, "Mikkel_Shorts", lambda p: 0.71 <= p.z <= 1.12 and abs(p.x) <= 0.43, green_dark, 0.015, 0.032)
    surface_shell(body, "Mikkel_Socks", lambda p: 0.11 <= p.z <= 0.58, socks_green, 0.012, 0.024)
    surface_shell(body, "Mikkel_Boots", lambda p: p.z <= 0.185, boots, 0.015, 0.018, min_z=0.002)
    surface_shell(
        body,
        "Mikkel_Gloves",
        lambda p: abs(p.x) >= max_abs_x * 0.78 and 1.02 <= p.z <= 1.63,
        gloves,
        0.022,
        0.018,
        subdivide=True,
    )


def create_hair(armature):
    material = base.make_material("MIKKEL_Hair", (0.32, 0.225, 0.115), 0.83)
    centre = Vector((0.0, -0.004, 1.94))
    rx, ry, rz = 0.126, 0.114, 0.100
    rings, segments = 12, 40
    verts = [(centre.x, centre.y, 2.039)]
    faces = []
    for ring in range(1, rings + 1):
        fraction = ring / rings
        for segment in range(segments):
            phi = 2.0 * math.pi * segment / segments
            front = max(0.0, -math.sin(phi))
            back = max(0.0, math.sin(phi))
            theta_max = 2.0 + 0.15 * back - 0.22 * front
            theta = fraction * theta_max
            irregular = 1.0 + 0.018 * math.sin(phi * 11.0 + fraction * 7.0) + 0.008 * math.cos(phi * 19.0)
            verts.append((
                centre.x + rx * irregular * math.sin(theta) * math.cos(phi),
                centre.y + ry * irregular * math.sin(theta) * math.sin(phi),
                min(2.039, centre.z + rz * math.cos(theta)),
            ))
    for segment in range(segments):
        faces.append((0, 1 + segment, 1 + (segment + 1) % segments))
    for ring in range(rings - 1):
        arow = 1 + ring * segments
        brow = 1 + (ring + 1) * segments
        for segment in range(segments):
            a = arow + segment
            b = arow + (segment + 1) % segments
            c = brow + (segment + 1) % segments
            d = brow + segment
            faces.append((a, b, c, d))
    mesh = bpy.data.meshes.new("Mikkel_Hair_Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    for poly in mesh.polygons:
        poly.use_smooth = True
    hair = bpy.data.objects.new("Mikkel_Hair", mesh)
    bpy.context.collection.objects.link(hair)
    hair.data.materials.append(material)
    group = hair.vertex_groups.new(name="Head")
    group.add(list(range(len(mesh.vertices))), 1.0, "REPLACE")
    modifier = hair.modifiers.new(name="FL_Hair_Skin", type="ARMATURE")
    modifier.object = armature
    modifier.use_vertex_groups = True
    return hair


def keeper_pose(direction=1, level="mid", reach=1.0):
    side = 1 if direction > 0 else -1
    roll = {"low": 42, "mid": 63, "high": 78}[level] * side
    leg_drive = {"low": 28, "mid": 42, "high": 56}[level]
    arm_raise = {"low": -18, "mid": 2, "high": 24}[level]
    left_reach = side > 0
    rotations = {
        "Hips": (6, 0, roll * 0.72),
        "Spine": (5, 0, roll * 0.16),
        "Chest": (8, 0, roll * 0.24),
        "Neck": (-3, 0, -roll * 0.12),
        "LeftUpperLeg": (-leg_drive if side > 0 else 18, 0, -12 * side),
        "RightUpperLeg": (18 if side > 0 else -leg_drive, 0, -12 * side),
        "LeftLowerLeg": (30 if side > 0 else 16, 0, 0),
        "RightLowerLeg": (16 if side > 0 else 30, 0, 0),
        "LeftUpperArm": (arm_raise if left_reach else -10, -8, -55 * side * reach),
        "RightUpperArm": (-10 if left_reach else arm_raise, 8, -55 * side * reach),
        "LeftLowerArm": (-8, 0, -18 * side),
        "RightLowerArm": (8, 0, -18 * side),
    }
    return rotations


def create_animations(armature):
    set_pose = {
        "Hips": (7, 0, 0), "Spine": (4, 0, 0), "Chest": (5, 0, 0),
        "LeftUpperLeg": (13, 0, -5), "RightUpperLeg": (13, 0, 5),
        "LeftLowerLeg": (-19, 0, 0), "RightLowerLeg": (-19, 0, 0),
        "LeftUpperArm": (20, -4, -18), "RightUpperArm": (-20, 4, 18),
        "LeftLowerArm": (34, 0, -4), "RightLowerArm": (-34, 0, 4),
    }

    def dive_keys(direction, level):
        side = 1 if direction > 0 else -1
        preload = {
            **set_pose,
            "Hips": (10, 0, 8 * side),
            "Chest": (7, 0, 10 * side),
            "LeftUpperLeg": (20 if side > 0 else 8, 0, -8 * side),
            "RightUpperLeg": (8 if side > 0 else 20, 0, -8 * side),
        }
        extension = keeper_pose(direction, level, 1.0)
        return [(1, set_pose, {}), (8, preload, {}), (18, extension, {}), (24, keeper_pose(direction, level, 1.08), {})]

    clips = {
        "set": [(1, set_pose, {}), (12, {**set_pose, "Chest": (6, 0, 0), "Hips": (8, 0, 0)}, {}), (24, set_pose, {})],
        "shuffle-left": [(1, set_pose, {}), (12, {**set_pose, "Hips": (8, 0, 9), "Chest": (5, 0, 6), "LeftUpperLeg": (19, 0, -9), "RightUpperLeg": (7, 0, -7)}, {}), (24, set_pose, {})],
        "shuffle-right": [(1, set_pose, {}), (12, {**set_pose, "Hips": (8, 0, -9), "Chest": (5, 0, -6), "LeftUpperLeg": (7, 0, 7), "RightUpperLeg": (19, 0, 9)}, {}), (24, set_pose, {})],
        "dive-left-low": dive_keys(-1, "low"),
        "dive-left-mid": dive_keys(-1, "mid"),
        "dive-left-high": dive_keys(-1, "high"),
        "dive-right-low": dive_keys(1, "low"),
        "dive-right-mid": dive_keys(1, "mid"),
        "dive-right-high": dive_keys(1, "high"),
        "parry": [(1, set_pose, {}), (12, {**set_pose, "Chest": (4, 0, 0), "LeftUpperArm": (2, -8, -48), "RightUpperArm": (-2, 8, 48), "LeftLowerArm": (7, 0, -12), "RightLowerArm": (-7, 0, 12)}, {}), (24, set_pose, {})],
        "catch": [(1, set_pose, {}), (12, {**set_pose, "Chest": (3, 0, 0), "LeftUpperArm": (5, -20, -38), "RightUpperArm": (-5, 20, 38), "LeftLowerArm": (55, 0, -8), "RightLowerArm": (-55, 0, 8)}, {}), (24, {**set_pose, "LeftLowerArm": (44, 0, -6), "RightLowerArm": (-44, 0, 6)}, {})],
        "landing": [(1, keeper_pose(1, "mid", 1.0), {}), (12, {"Hips": (18, 0, 62), "Chest": (16, 0, 24), "LeftUpperLeg": (28, 0, -12), "RightUpperLeg": (18, 0, -8), "LeftLowerLeg": (42, 0, 0), "RightLowerLeg": (30, 0, 0), "LeftUpperArm": (-8, 0, -42), "RightUpperArm": (12, 0, -28)}, {}), (24, {"Hips": (14, 0, 38), "Chest": (12, 0, 17), "LeftUpperLeg": (22, 0, -8), "RightUpperLeg": (18, 0, -5), "LeftLowerLeg": (35, 0, 0), "RightLowerLeg": (28, 0, 0)}, {})],
        "recovery": [(1, {"Hips": (14, 0, 34), "Chest": (10, 0, 15), "LeftUpperLeg": (22, 0, -7), "RightUpperLeg": (18, 0, -5), "LeftLowerLeg": (34, 0, 0), "RightLowerLeg": (26, 0, 0)}, {}), (12, {**set_pose, "Hips": (10, 0, 10), "Chest": (7, 0, 6)}, {}), (24, set_pose, {})],
    }

    actions = []
    for name in REQUIRED_CLIPS:
        actions.append(base.create_action(armature, name, clips[name]))
    armature.animation_data.action = actions[0]
    print("MIKKEL_ACTIONS", [action.name for action in actions])
    return actions


def add_metadata(body, armature):
    body["football_lab_character"] = "mikkel-storm"
    body["football_lab_build"] = "46.0.0"
    body["target_height_m"] = TARGET_HEIGHT
    body["role"] = "master-goalkeeper"
    armature["skeleton_contract"] = "FL_HUMANOID_V1"
    armature["root_motion"] = "in-place"


def guarded_export(path):
    allowed = {"Mikkel_Storm_Body", "Mikkel_Hair", "FL_HUMANOID_V1", *KIT_MESHES}
    for obj in list(bpy.data.objects):
        if obj.name not in allowed:
            bpy.data.objects.remove(obj, do_unlink=True)
    base.export_glb(path)


def main():
    args = cli_args()
    source = base.choose_body()
    body = clean_isolate_body(source)
    normalise_goalkeeper(body)
    apply_skin_material(body)
    armature = add_goalkeeper_armature(body)
    create_kit(body)
    create_hair(armature)
    create_animations(armature)
    add_metadata(body, armature)
    guarded_export(os.path.abspath(args.output))


if __name__ == "__main__":
    main()
