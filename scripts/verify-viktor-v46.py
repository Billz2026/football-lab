import argparse
import os
import sys

import bpy
from mathutils import Vector

REQUIRED_CLIPS = {
    "idle", "approach", "plant", "windup", "contact", "follow-through", "recovery"
}
TARGET_HEIGHT = 1.88


def cli_args():
    argv = sys.argv
    argv = argv[argv.index("--") + 1:] if "--" in argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    return parser.parse_args(argv)


def world_height(objects):
    points = []
    for obj in objects:
        if obj.type != "MESH":
            continue
        for corner in obj.bound_box:
            points.append(obj.matrix_world @ Vector(corner))
    if not points:
        return 0.0
    return max(p.z for p in points) - min(p.z for p in points)


def fail(message):
    print("VIKTOR_VERIFY_FAIL", message)
    raise SystemExit(2)


def main():
    args = cli_args()
    source = os.path.abspath(args.input)
    if not os.path.exists(source):
        fail(f"missing file: {source}")

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=source)

    meshes = [obj for obj in bpy.data.objects if obj.type == "MESH"]
    armatures = [obj for obj in bpy.data.objects if obj.type == "ARMATURE"]
    if not meshes:
        fail("no mesh objects in GLB")
    if not armatures:
        fail("no armature in GLB")

    actions = {action.name for action in bpy.data.actions}
    missing = sorted(REQUIRED_CLIPS - actions)
    if missing:
        fail(f"missing actions: {missing}; found={sorted(actions)}")

    bones = {bone.name for arm in armatures for bone in arm.data.bones}
    required_bones = {
        "Root", "Hips", "Head", "LeftFoot", "RightFoot",
        "LeftUpperLeg", "RightUpperLeg", "LeftHand", "RightHand"
    }
    missing_bones = sorted(required_bones - bones)
    if missing_bones:
        fail(f"missing semantic bones: {missing_bones}")

    skinned_meshes = []
    for mesh in meshes:
        if mesh.find_armature() is not None or any(mod.type == "ARMATURE" for mod in mesh.modifiers):
            skinned_meshes.append(mesh)
    if not skinned_meshes:
        fail("mesh is not skinned to an armature")

    height = world_height(meshes)
    if not (1.70 <= height <= 2.02):
        fail(f"unexpected imported mesh height: {height:.3f}m")

    file_size = os.path.getsize(source)
    if file_size < 50_000:
        fail(f"GLB suspiciously small: {file_size} bytes")
    if file_size > 95_000_000:
        fail(f"GLB exceeds GitHub production budget: {file_size} bytes")

    print("VIKTOR_VERIFY_OK")
    print("file", source)
    print("size_bytes", file_size)
    print("height_m", round(height, 4))
    print("meshes", [(obj.name, len(obj.data.vertices), len(obj.data.polygons)) for obj in meshes])
    print("armatures", [obj.name for obj in armatures])
    print("actions", sorted(actions))
    print("bones", sorted(bones))


if __name__ == "__main__":
    main()
