import argparse
import json
import os
import struct
import sys

import bpy
from mathutils import Vector

REQUIRED_CLIPS = {
    "idle", "approach", "plant", "windup", "contact", "follow-through", "recovery"
}
TARGET_HEIGHT = 1.88
GLB_MAGIC = 0x46546C67
JSON_CHUNK = 0x4E4F534A


def cli_args():
    argv = sys.argv
    argv = argv[argv.index("--") + 1:] if "--" in argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    return parser.parse_args(argv)


def read_glb_json(path):
    with open(path, "rb") as handle:
        header = handle.read(12)
        if len(header) != 12:
            fail("invalid GLB header")
        magic, version, total_length = struct.unpack("<III", header)
        if magic != GLB_MAGIC or version != 2:
            fail(f"invalid GLB signature/version: magic={magic:#x}, version={version}")
        if total_length != os.path.getsize(path):
            fail(f"GLB length header mismatch: header={total_length}, file={os.path.getsize(path)}")
        while handle.tell() < total_length:
            chunk_header = handle.read(8)
            if len(chunk_header) != 8:
                fail("truncated GLB chunk header")
            chunk_length, chunk_type = struct.unpack("<II", chunk_header)
            data = handle.read(chunk_length)
            if len(data) != chunk_length:
                fail("truncated GLB chunk")
            if chunk_type == JSON_CHUNK:
                return json.loads(data.decode("utf-8").rstrip(" \t\r\n\x00"))
    fail("GLB JSON chunk missing")


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

    gltf = read_glb_json(source)
    animation_names = {str(item.get("name", "")) for item in gltf.get("animations", [])}
    missing_glb_clips = sorted(REQUIRED_CLIPS - animation_names)
    unexpected_glb_clips = sorted(animation_names - REQUIRED_CLIPS)
    if missing_glb_clips or unexpected_glb_clips:
        fail(
            "canonical GLB animation names failed: "
            f"missing={missing_glb_clips}, unexpected={unexpected_glb_clips}, found={sorted(animation_names)}"
        )

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=source)

    meshes = [obj for obj in bpy.data.objects if obj.type == "MESH"]
    armatures = [obj for obj in bpy.data.objects if obj.type == "ARMATURE"]
    if not meshes:
        fail("no mesh objects in GLB")
    if not armatures:
        fail("no armature in GLB")

    # Blender's importer may suffix imported Action datablocks with the target
    # armature name. The browser runtime consumes the canonical GLB animation
    # names checked above, so imported Action names are only a secondary sanity check.
    imported_actions = {action.name for action in bpy.data.actions}
    for clip in REQUIRED_CLIPS:
        if not any(name == clip or name.startswith(f"{clip}_") for name in imported_actions):
            fail(f"imported animation action missing for {clip}; found={sorted(imported_actions)}")

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
    print("glb_animations", sorted(animation_names))
    print("imported_actions", sorted(imported_actions))
    print("bones", sorted(bones))


if __name__ == "__main__":
    main()
