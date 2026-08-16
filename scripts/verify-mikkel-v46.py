import argparse
import json
import os
import struct
import sys

import bpy
from mathutils import Vector

TARGET_HEIGHT = 2.04
REQUIRED_CLIPS = {
    "set", "shuffle-left", "shuffle-right",
    "dive-left-low", "dive-left-mid", "dive-left-high",
    "dive-right-low", "dive-right-mid", "dive-right-high",
    "parry", "catch", "landing", "recovery"
}
KIT_MESHES = {"Mikkel_Shirt", "Mikkel_Shorts", "Mikkel_Socks", "Mikkel_Boots", "Mikkel_Gloves"}
AUTHORISED_MESHES = {"Mikkel_Storm_Body", "Mikkel_Hair", *KIT_MESHES}
GLB_MAGIC = 0x46546C67
JSON_CHUNK = 0x4E4F534A


def cli_args():
    argv = sys.argv
    argv = argv[argv.index("--") + 1:] if "--" in argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    return parser.parse_args(argv)


def fail(message):
    print("MIKKEL_VERIFY_FAIL", message)
    raise SystemExit(2)


def read_glb_json(path):
    with open(path, "rb") as handle:
        header = handle.read(12)
        if len(header) != 12:
            fail("invalid GLB header")
        magic, version, total_length = struct.unpack("<III", header)
        if magic != GLB_MAGIC or version != 2:
            fail(f"invalid GLB signature/version: magic={magic:#x}, version={version}")
        if total_length != os.path.getsize(path):
            fail(f"GLB length mismatch: header={total_length}, file={os.path.getsize(path)}")
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


def glb_mesh_bounds(gltf, node_name):
    nodes = [node for node in gltf.get("nodes", []) if node.get("name") == node_name]
    if len(nodes) != 1:
        fail(f"expected one GLB node named {node_name}, found {len(nodes)}")
    mesh_index = nodes[0].get("mesh")
    if mesh_index is None:
        fail(f"GLB node {node_name} has no mesh")
    mesh = gltf.get("meshes", [])[mesh_index]
    minima = [float("inf")] * 3
    maxima = [float("-inf")] * 3
    count = 0
    for primitive in mesh.get("primitives", []):
        accessor_index = primitive.get("attributes", {}).get("POSITION")
        if accessor_index is None:
            continue
        accessor = gltf.get("accessors", [])[accessor_index]
        if "min" not in accessor or "max" not in accessor:
            fail(f"POSITION accessor for {node_name} lacks bounds")
        for axis in range(3):
            minima[axis] = min(minima[axis], accessor["min"][axis])
            maxima[axis] = max(maxima[axis], accessor["max"][axis])
        count += int(accessor.get("count", 0))
    if count <= 0:
        fail(f"GLB mesh {node_name} has no vertices")
    return minima, maxima, count


def evaluated_world_bounds(obj):
    depsgraph = bpy.context.evaluated_depsgraph_get()
    evaluated = obj.evaluated_get(depsgraph)
    mesh = evaluated.to_mesh()
    try:
        if not mesh.vertices:
            fail(f"evaluated mesh {obj.name} has no vertices")
        points = [evaluated.matrix_world @ vertex.co for vertex in mesh.vertices]
        minimum = Vector((min(p.x for p in points), min(p.y for p in points), min(p.z for p in points)))
        maximum = Vector((max(p.x for p in points), max(p.y for p in points), max(p.z for p in points)))
        return minimum, maximum
    finally:
        evaluated.to_mesh_clear()


def main():
    args = cli_args()
    source = os.path.abspath(args.input)
    if not os.path.exists(source):
        fail(f"missing file: {source}")

    gltf = read_glb_json(source)
    animations = {str(item.get("name", "")) for item in gltf.get("animations", [])}
    missing = sorted(REQUIRED_CLIPS - animations)
    unexpected = sorted(animations - REQUIRED_CLIPS)
    if missing or unexpected:
        fail(f"canonical keeper clips failed: missing={missing}, unexpected={unexpected}, found={sorted(animations)}")

    mesh_nodes = [node.get("name") for node in gltf.get("nodes", []) if "mesh" in node]
    if set(mesh_nodes) != AUTHORISED_MESHES or len(mesh_nodes) != len(AUTHORISED_MESHES):
        fail(f"unexpected GLB mesh nodes: {mesh_nodes}")

    body_min, body_max, body_vertices = glb_mesh_bounds(gltf, "Mikkel_Storm_Body")
    hair_min, hair_max, hair_vertices = glb_mesh_bounds(gltf, "Mikkel_Hair")
    height = body_max[1] - body_min[1]
    centre_x = (body_min[0] + body_max[0]) * 0.5
    centre_z = (body_min[2] + body_max[2]) * 0.5
    ground = body_min[1]
    print("MIKKEL_GLB_BODY", body_min, body_max, "height", height, "vertices", body_vertices)
    print("MIKKEL_GLB_HAIR", hair_min, hair_max, "vertices", hair_vertices)
    if abs(height - TARGET_HEIGHT) > 0.025:
        fail(f"body height must be {TARGET_HEIGHT:.2f}m, found {height:.3f}m")
    if abs(ground) > 0.015:
        fail(f"feet are not grounded: y_min={ground:.4f}")
    if abs(centre_x) > 0.045 or abs(centre_z) > 0.045:
        fail(f"body is not centred: centre_x={centre_x:.4f}, centre_z={centre_z:.4f}")
    if hair_min[1] < 1.56 or hair_max[1] > 2.055:
        fail(f"hair bounds are implausible: y={hair_min[1]:.3f}..{hair_max[1]:.3f}")

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=source)
    armatures = [obj for obj in bpy.data.objects if obj.type == "ARMATURE"]
    if not armatures:
        fail("no armature in GLB")
    authorised = [bpy.data.objects.get(name) for name in AUTHORISED_MESHES]
    if any(obj is None for obj in authorised):
        fail("one or more authorised meshes are missing after import")

    imported_actions = {action.name for action in bpy.data.actions}
    for clip in REQUIRED_CLIPS:
        if not any(name == clip or name.startswith(f"{clip}_") for name in imported_actions):
            fail(f"imported action missing for {clip}; found={sorted(imported_actions)}")

    bones = {bone.name for arm in armatures for bone in arm.data.bones}
    required_bones = {
        "Root", "Hips", "Spine", "Chest", "Neck", "Head",
        "LeftShoulder", "LeftUpperArm", "LeftLowerArm", "LeftHand",
        "RightShoulder", "RightUpperArm", "RightLowerArm", "RightHand",
        "LeftUpperLeg", "LeftLowerLeg", "LeftFoot", "LeftToe",
        "RightUpperLeg", "RightLowerLeg", "RightFoot", "RightToe"
    }
    missing_bones = sorted(required_bones - bones)
    if missing_bones:
        fail(f"missing semantic bones: {missing_bones}")

    skinned = []
    for mesh in authorised:
        if mesh.find_armature() is not None or any(mod.type == "ARMATURE" for mod in mesh.modifiers):
            skinned.append(mesh)
    if len(skinned) != len(AUTHORISED_MESHES):
        fail(f"all body/kit/hair meshes must remain skinned: {[obj.name for obj in skinned]}")

    # Imported skinned bounds must be measured in the armature's REST pose.
    # Measuring object.bound_box while an imported action is active reports the
    # action-deformed silhouette and falsely shrinks/tips a diving goalkeeper.
    for armature in armatures:
        armature.data.pose_position = "REST"
        if armature.animation_data:
            armature.animation_data.action = None
    bpy.context.scene.frame_set(0)
    bpy.context.view_layer.update()

    body = bpy.data.objects["Mikkel_Storm_Body"]
    minimum, maximum = evaluated_world_bounds(body)
    imported_height = (maximum - minimum).z
    imported_ground = minimum.z
    print("MIKKEL_REIMPORT_REST", tuple(round(v, 5) for v in minimum), tuple(round(v, 5) for v in maximum), "height", imported_height)
    if abs(imported_height - height) > 0.035:
        fail(f"evaluated rest-pose re-import changed body height: GLB={height:.3f}, imported={imported_height:.3f}")
    if abs(imported_ground) > 0.025:
        fail(f"evaluated rest-pose feet are not grounded: z_min={imported_ground:.4f}")

    size = os.path.getsize(source)
    if size < 50_000:
        fail(f"GLB suspiciously small: {size} bytes")
    if size > 95_000_000:
        fail(f"GLB exceeds production budget: {size} bytes")

    print("MIKKEL_VERIFY_OK")
    print("file", source)
    print("size_bytes", size)
    print("height_m", round(height, 4))
    print("meshes", [(obj.name, len(obj.data.vertices), len(obj.data.polygons)) for obj in authorised])
    print("animations", sorted(animations))
    print("bones", sorted(bones))


if __name__ == "__main__":
    main()
