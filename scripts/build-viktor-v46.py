import argparse
import math
import os
import sys

import bpy
from mathutils import Vector

TARGET_HEIGHT = 1.88
REQUIRED_CLIPS = [
    "idle", "approach", "plant", "windup", "contact", "follow-through", "recovery"
]


def args_from_cli():
    argv = sys.argv
    argv = argv[argv.index("--") + 1:] if "--" in argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    return parser.parse_args(argv)


def score_body(obj):
    if obj.type != "MESH":
        return -10_000
    name = obj.name.lower()
    bad = ("eye", "teeth", "tooth", "jaw", "tongue", "hand", "foot", "head", "ear", "nose")
    score = 0
    if "male" in name and "female" not in name:
        score += 500
    if "real" in name:
        score += 260
    if "human" in name:
        score += 120
    if "body" in name or "base" in name:
        score += 90
    if "styl" in name:
        score -= 300
    if any(word in name for word in bad):
        score -= 450
    try:
        dims = obj.dimensions
        if dims.z > 1.0 and dims.z > dims.x * 1.2:
            score += 180
        score += min(120, len(obj.data.vertices) / 1000)
    except Exception:
        pass
    return score


def choose_body():
    meshes = [obj for obj in bpy.data.objects if obj.type == "MESH"]
    if not meshes:
        raise RuntimeError("No mesh objects found in the Blender human-base-mesh source")
    ranked = sorted(meshes, key=score_body, reverse=True)
    print("VIKTOR_SOURCE_CANDIDATES")
    for obj in ranked[:12]:
        print(obj.name, score_body(obj), tuple(round(v, 4) for v in obj.dimensions), len(obj.data.vertices))
    body = ranked[0]
    if score_body(body) < 0:
        raise RuntimeError(f"Could not identify a plausible full male body mesh; best={body.name}")
    print("VIKTOR_SOURCE_SELECTED", body.name)
    return body


def isolate_body(source):
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

    for modifier in list(body.modifiers):
        if modifier.type == "MULTIRES":
            try:
                modifier.levels = min(modifier.levels, 1)
                modifier.render_levels = min(modifier.render_levels, 1)
            except Exception:
                pass

    keep = {body}
    for obj in list(bpy.data.objects):
        if obj not in keep:
            bpy.data.objects.remove(obj, do_unlink=True)
    return body


def mesh_world_bounds(obj):
    corners = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    mins = Vector((min(p.x for p in corners), min(p.y for p in corners), min(p.z for p in corners)))
    maxs = Vector((max(p.x for p in corners), max(p.y for p in corners), max(p.z for p in corners)))
    return mins, maxs


def normalise_body(body):
    bpy.context.view_layer.objects.active = body
    body.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    mins, maxs = mesh_world_bounds(body)
    height = maxs.z - mins.z
    if height <= 0.1:
        raise RuntimeError(f"Invalid source body height {height}")
    scale = TARGET_HEIGHT / height
    body.scale = (scale, scale, scale)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    mins, maxs = mesh_world_bounds(body)
    body.location.z -= mins.z
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)

    mins, maxs = mesh_world_bounds(body)
    h = maxs.z - mins.z
    for vertex in body.data.vertices:
        z = (vertex.co.z - mins.z) / max(h, 1e-6)
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
    return body


def make_material(name, base, roughness=0.62, metallic=0.0):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    material.diffuse_color = (*base, 1.0)
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (*base, 1.0)
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = metallic
    return material


def assign_kit_materials(body):
    materials = [
        make_material("VIKTOR_Skin", (0.63, 0.39, 0.25), 0.72),
        make_material("VIKTOR_Shirt_White", (0.91, 0.93, 0.95), 0.58),
        make_material("VIKTOR_Shirt_Navy", (0.035, 0.075, 0.14), 0.54),
        make_material("VIKTOR_Shorts_Navy", (0.025, 0.055, 0.115), 0.58),
        make_material("VIKTOR_Socks_White", (0.88, 0.9, 0.92), 0.62),
        make_material("VIKTOR_Boots", (0.018, 0.022, 0.028), 0.48),
    ]
    for material in materials:
        body.data.materials.append(material)

    mins, maxs = mesh_world_bounds(body)
    h = maxs.z - mins.z
    centre_x = (mins.x + maxs.x) * 0.5
    for poly in body.data.polygons:
        points = [body.data.vertices[i].co for i in poly.vertices]
        z = sum(p.z for p in points) / len(points)
        x = sum(p.x for p in points) / len(points)
        zn = (z - mins.z) / max(h, 1e-6)
        xn = abs(x - centre_x) / max(h, 1e-6)
        idx = 0
        if zn < 0.055:
            idx = 5
        elif zn < 0.285:
            idx = 4
        elif 0.405 <= zn < 0.525 and xn < 0.20:
            idx = 3
        elif 0.525 <= zn < 0.775 and xn < 0.225:
            idx = 2 if xn > 0.135 else 1
        else:
            idx = 0
        poly.material_index = idx
    body.data.update()


def add_armature(body):
    bpy.ops.object.armature_add(enter_editmode=True, location=(0, 0, 0))
    armature = bpy.context.active_object
    armature.name = "FL_HUMANOID_V1"
    armature.data.name = "FL_HUMANOID_V1_Skeleton"
    edit = armature.data.edit_bones
    edit.remove(edit[0])

    def bone(name, head, tail, parent=None, connected=False):
        b = edit.new(name)
        b.head = head
        b.tail = tail
        b.roll = 0.0
        if parent:
            b.parent = edit[parent]
            b.use_connect = connected
        return b

    bone("Root", (0, 0, 0.0), (0, 0, 0.12))
    bone("Hips", (0, 0, 0.88), (0, 0, 1.02), "Root")
    bone("Spine", (0, 0, 1.02), (0, 0, 1.23), "Hips", True)
    bone("Chest", (0, 0, 1.23), (0, 0, 1.43), "Spine", True)
    bone("Neck", (0, 0, 1.43), (0, 0, 1.56), "Chest", True)
    bone("Head", (0, 0, 1.56), (0, 0, 1.79), "Neck", True)

    bone("LeftShoulder", (0.02, 0, 1.41), (0.19, 0, 1.42), "Chest")
    bone("LeftUpperArm", (0.19, 0, 1.42), (0.47, 0, 1.34), "LeftShoulder", True)
    bone("LeftLowerArm", (0.47, 0, 1.34), (0.69, 0, 1.24), "LeftUpperArm", True)
    bone("LeftHand", (0.69, 0, 1.24), (0.79, -0.01, 1.19), "LeftLowerArm", True)
    bone("RightShoulder", (-0.02, 0, 1.41), (-0.19, 0, 1.42), "Chest")
    bone("RightUpperArm", (-0.19, 0, 1.42), (-0.47, 0, 1.34), "RightShoulder", True)
    bone("RightLowerArm", (-0.47, 0, 1.34), (-0.69, 0, 1.24), "RightUpperArm", True)
    bone("RightHand", (-0.69, 0, 1.24), (-0.79, -0.01, 1.19), "RightLowerArm", True)

    bone("LeftUpperLeg", (0.105, 0, 0.91), (0.105, 0, 0.51), "Hips")
    bone("LeftLowerLeg", (0.105, 0, 0.51), (0.105, 0, 0.105), "LeftUpperLeg", True)
    bone("LeftFoot", (0.105, 0, 0.105), (0.105, -0.13, 0.065), "LeftLowerLeg", True)
    bone("LeftToe", (0.105, -0.13, 0.065), (0.105, -0.24, 0.055), "LeftFoot", True)
    bone("RightUpperLeg", (-0.105, 0, 0.91), (-0.105, 0, 0.51), "Hips")
    bone("RightLowerLeg", (-0.105, 0, 0.51), (-0.105, 0, 0.105), "RightUpperLeg", True)
    bone("RightFoot", (-0.105, 0, 0.105), (-0.105, -0.13, 0.065), "RightLowerLeg", True)
    bone("RightToe", (-0.105, -0.13, 0.065), (-0.105, -0.24, 0.055), "RightFoot", True)

    bpy.ops.object.mode_set(mode="OBJECT")
    armature.show_in_front = True

    bpy.ops.object.select_all(action="DESELECT")
    body.select_set(True)
    armature.select_set(True)
    bpy.context.view_layer.objects.active = armature
    try:
        bpy.ops.object.parent_set(type="ARMATURE_AUTO")
    except Exception as exc:
        print("AUTO_WEIGHT_WARNING", repr(exc))
        bpy.ops.object.parent_set(type="ARMATURE_ENVELOPE")
    return armature


def add_hair(armature):
    hair_mat = make_material("VIKTOR_Hair", (0.22, 0.16, 0.08), 0.78)
    verts = []
    faces = []
    rings = 6
    segments = 24
    centre = Vector((0, -0.015, 1.70))
    rx, ry, rz = 0.105, 0.095, 0.13
    for r in range(rings + 1):
        theta = (r / rings) * 1.18
        for s in range(segments):
            phi = 2 * math.pi * s / segments
            verts.append((
                centre.x + rx * math.sin(theta) * math.cos(phi),
                centre.y + ry * math.sin(theta) * math.sin(phi),
                centre.z + rz * math.cos(theta),
            ))
    for r in range(rings):
        for s in range(segments):
            a = r * segments + s
            b = r * segments + (s + 1) % segments
            c = (r + 1) * segments + (s + 1) % segments
            d = (r + 1) * segments + s
            faces.append((a, b, c, d))
    mesh = bpy.data.meshes.new("Viktor_Hair_Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    hair = bpy.data.objects.new("Viktor_Hair", mesh)
    bpy.context.collection.objects.link(hair)
    hair.data.materials.append(hair_mat)
    hair.parent = armature
    hair.parent_type = "BONE"
    hair.parent_bone = "Head"
    hair.matrix_parent_inverse = armature.matrix_world.inverted()
    return hair


def reset_pose(armature):
    bpy.context.view_layer.objects.active = armature
    bpy.ops.object.mode_set(mode="POSE")
    for pbone in armature.pose.bones:
        pbone.rotation_mode = "XYZ"
        pbone.rotation_euler = (0.0, 0.0, 0.0)
        pbone.location = (0.0, 0.0, 0.0)
        pbone.scale = (1.0, 1.0, 1.0)
    bpy.ops.object.mode_set(mode="OBJECT")


def pose_key(armature, frame, rotations=None, locations=None):
    rotations = rotations or {}
    locations = locations or {}
    bpy.context.scene.frame_set(frame)
    for name, degs in rotations.items():
        pbone = armature.pose.bones.get(name)
        if not pbone:
            continue
        pbone.rotation_mode = "XYZ"
        pbone.rotation_euler = tuple(math.radians(v) for v in degs)
        pbone.keyframe_insert("rotation_euler", frame=frame, group=name)
    for name, loc in locations.items():
        pbone = armature.pose.bones.get(name)
        if not pbone:
            continue
        pbone.location = loc
        pbone.keyframe_insert("location", frame=frame, group=name)


def create_action(armature, name, keys):
    reset_pose(armature)
    action = bpy.data.actions.new(name=name)
    if not armature.animation_data:
        armature.animation_data_create()
    armature.animation_data.action = action
    for frame, rotations, locations in keys:
        pose_key(armature, frame, rotations, locations)
    for fcurve in action.fcurves:
        for point in fcurve.keyframe_points:
            point.interpolation = "BEZIER"
    action.frame_range = (1, 24)
    action.use_fake_user = True
    return action


def create_animations(armature):
    neutral = {
        "LeftUpperArm": (3, -2, -2), "RightUpperArm": (-3, 2, 2),
        "LeftLowerArm": (2, 0, 0), "RightLowerArm": (-2, 0, 0),
    }
    clips = {
        "idle": [
            (1, neutral, {}),
            (12, {**neutral, "Chest": (1.5, 0, 0), "Hips": (-0.7, 0, 0)}, {}),
            (24, neutral, {}),
        ],
        "approach": [
            (1, {"LeftUpperLeg": (26, 0, 0), "RightUpperLeg": (-24, 0, 0), "LeftLowerLeg": (-12, 0, 0), "RightLowerLeg": (28, 0, 0), "LeftUpperArm": (-18, 0, -4), "RightUpperArm": (18, 0, 4), "Chest": (4, 0, 1)}, {}),
            (12, {"LeftUpperLeg": (-24, 0, 0), "RightUpperLeg": (26, 0, 0), "LeftLowerLeg": (28, 0, 0), "RightLowerLeg": (-12, 0, 0), "LeftUpperArm": (18, 0, -4), "RightUpperArm": (-18, 0, 4), "Chest": (5, 0, -1)}, {}),
            (24, {"LeftUpperLeg": (18, 0, 0), "RightUpperLeg": (-18, 0, 0), "LeftLowerLeg": (-8, 0, 0), "RightLowerLeg": (24, 0, 0), "LeftUpperArm": (-12, 0, -3), "RightUpperArm": (12, 0, 3), "Chest": (4, 0, 0)}, {}),
        ],
        "plant": [
            (1, {"LeftUpperLeg": (10, 0, 0), "LeftLowerLeg": (8, 0, 0), "RightUpperLeg": (-12, 0, 0), "RightLowerLeg": (26, 0, 0), "Chest": (5, 0, -2)}, {}),
            (14, {"LeftUpperLeg": (-6, 0, 0), "LeftLowerLeg": (12, 0, 0), "LeftFoot": (-3, 0, 0), "RightUpperLeg": (22, -2, 2), "RightLowerLeg": (48, 0, 0), "Chest": (6, 0, -3), "Hips": (1, 0, -2)}, {}),
            (24, {"LeftUpperLeg": (-8, 0, 0), "LeftLowerLeg": (13, 0, 0), "LeftFoot": (-4, 0, 0), "RightUpperLeg": (36, -3, 3), "RightLowerLeg": (65, 0, 0), "Chest": (7, -1, -5), "Hips": (2, 0, -4)}, {}),
        ],
        "windup": [
            (1, {"LeftUpperLeg": (-8, 0, 0), "LeftLowerLeg": (13, 0, 0), "LeftFoot": (-4, 0, 0), "RightUpperLeg": (36, -3, 3), "RightLowerLeg": (65, 0, 0), "Chest": (7, -1, -5), "Hips": (2, 0, -4), "LeftUpperArm": (12, -4, -14), "RightUpperArm": (-16, 3, 16)}, {}),
            (14, {"LeftUpperLeg": (-9, 0, 0), "LeftLowerLeg": (14, 0, 0), "RightUpperLeg": (50, -4, 4), "RightLowerLeg": (82, 0, 0), "Chest": (8, -2, -6), "Hips": (2, 0, -4), "LeftUpperArm": (18, -5, -20), "RightUpperArm": (-22, 4, 22)}, {}),
            (24, {"LeftUpperLeg": (-9, 0, 0), "LeftLowerLeg": (14, 0, 0), "RightUpperLeg": (58, -5, 5), "RightLowerLeg": (88, 0, 0), "Chest": (9, -3, -7), "Hips": (2, 0, -5), "LeftUpperArm": (20, -6, -22), "RightUpperArm": (-24, 5, 24)}, {}),
        ],
        "contact": [
            (1, {"LeftUpperLeg": (-9, 0, 0), "LeftLowerLeg": (14, 0, 0), "LeftFoot": (-4, 0, 0), "RightUpperLeg": (45, -4, 4), "RightLowerLeg": (75, 0, 0), "Chest": (8, -2, -5), "Hips": (2, 0, -4), "LeftUpperArm": (16, -4, -18), "RightUpperArm": (-20, 4, 20)}, {}),
            (12, {"LeftUpperLeg": (-8, 0, 0), "LeftLowerLeg": (12, 0, 0), "LeftFoot": (-5, 0, 0), "RightUpperLeg": (-18, -2, -2), "RightLowerLeg": (2, 0, 0), "RightFoot": (-6, 0, 0), "Chest": (10, 1, 3), "Hips": (2, 0, 2), "LeftUpperArm": (-6, 0, 14), "RightUpperArm": (14, 0, -18)}, {}),
            (24, {"LeftUpperLeg": (-7, 0, 0), "LeftLowerLeg": (11, 0, 0), "RightUpperLeg": (-42, 1, -3), "RightLowerLeg": (12, 0, 0), "RightFoot": (-4, 0, 0), "Chest": (12, 1, 6), "Hips": (2, 0, 4), "LeftUpperArm": (-12, 0, 20), "RightUpperArm": (20, 0, -24)}, {}),
        ],
        "follow-through": [
            (1, {"LeftUpperLeg": (-7, 0, 0), "LeftLowerLeg": (11, 0, 0), "RightUpperLeg": (-42, 1, -3), "RightLowerLeg": (12, 0, 0), "Chest": (12, 1, 6), "Hips": (2, 0, 4), "LeftUpperArm": (-12, 0, 20), "RightUpperArm": (20, 0, -24)}, {}),
            (12, {"LeftUpperLeg": (-6, 0, 0), "LeftLowerLeg": (10, 0, 0), "RightUpperLeg": (-58, 3, -5), "RightLowerLeg": (22, 0, 0), "Chest": (12, 2, 8), "Hips": (2, 0, 5), "LeftUpperArm": (-16, 0, 24), "RightUpperArm": (24, 0, -28)}, {}),
            (24, {"LeftUpperLeg": (-4, 0, 0), "LeftLowerLeg": (8, 0, 0), "RightUpperLeg": (-36, 2, -3), "RightLowerLeg": (34, 0, 0), "Chest": (8, 1, 5), "Hips": (1, 0, 3), "LeftUpperArm": (-10, 0, 16), "RightUpperArm": (16, 0, -20)}, {}),
        ],
        "recovery": [
            (1, {"RightUpperLeg": (-28, 1, -2), "RightLowerLeg": (30, 0, 0), "Chest": (7, 1, 4), "Hips": (1, 0, 3)}, {}),
            (12, {"RightUpperLeg": (-8, 0, 0), "RightLowerLeg": (15, 0, 0), "LeftUpperLeg": (-3, 0, 0), "Chest": (3, 0, 2), "Hips": (0, 0, 1)}, {}),
            (24, neutral, {}),
        ],
    }
    created = []
    for name in REQUIRED_CLIPS:
        created.append(create_action(armature, name, clips[name]))
    armature.animation_data.action = created[0]
    print("VIKTOR_ACTIONS", [a.name for a in created])
    return created


def add_metadata(body, armature):
    body["football_lab_character"] = "viktor-kane"
    body["football_lab_build"] = "46.0.0"
    body["target_height_m"] = TARGET_HEIGHT
    armature["skeleton_contract"] = "FL_HUMANOID_V1"
    armature["root_motion"] = "in-place"


def export_glb(path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    props = bpy.ops.export_scene.gltf.get_rna_type().properties.keys()
    kwargs = {
        "filepath": path,
        "export_format": "GLB",
        "export_animations": True,
        "export_yup": True,
        "export_apply": False,
        "export_cameras": False,
        "export_lights": False,
        "export_extras": True,
    }
    if "export_animation_mode" in props:
        kwargs["export_animation_mode"] = "ACTIONS"
    if "export_force_sampling" in props:
        kwargs["export_force_sampling"] = True
    if "export_def_bones" in props:
        kwargs["export_def_bones"] = True
    if "export_all_influences" in props:
        kwargs["export_all_influences"] = False
    if "export_draco_mesh_compression_enable" in props:
        kwargs["export_draco_mesh_compression_enable"] = False
    bpy.ops.export_scene.gltf(**kwargs)
    print("VIKTOR_EXPORTED", path, os.path.getsize(path))


def main():
    args = args_from_cli()
    source = choose_body()
    body = isolate_body(source)
    normalise_body(body)
    assign_kit_materials(body)
    armature = add_armature(body)
    add_hair(armature)
    create_animations(armature)
    add_metadata(body, armature)

    armature.rotation_euler[2] = 0.0
    body.rotation_euler[2] = 0.0

    export_glb(os.path.abspath(args.output))


if __name__ == "__main__":
    main()
