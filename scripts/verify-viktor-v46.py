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
KIT_MESHES = {
    "Viktor_Shirt",
    "Viktor_Sleeves_Navy",
    "Viktor_Shorts",
    "Viktor_Socks",
    "Viktor_Boots",
}
AUTHORISED_MESHES = {"Viktor_Kane_Body", "Viktor_Hair", *KIT_MESHES}


def cli_args():
    argv = sys.argv
    argv = argv[argv.index("--") + 1:] if "--" in argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    return parser.parse_args(argv)


def fail(message):
    print("VIKTOR_VERIFY_FAIL", message)
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


def glb_mesh_bounds(gltf, node_name):
    nodes = gltf.get("nodes", [])
    matches = [node for node in nodes if node.get("name") == node_name]
    if len(matches) != 1:
        fail(f"expected one GLB node named {node_name}, found {len(matches)}")
    node = matches[0]
    mesh_index = node.get("mesh")
    if mesh_index is None:
        fail(f"GLB node {node_name} has no mesh")
    mesh = gltf.get("meshes", [])[mesh_index]

    minima = [float("inf"), float("inf"), float("inf")]
    maxima = [float("-inf"), float("-inf"), float("-inf")]
    vertex_count = 0
    for primitive in mesh.get("primitives", []):
        position_accessor = primitive.get("attributes", {}).get("POSITION")
        if position_accessor is None:
            continue
        accessor = gltf.get("accessors", [])[position_accessor]
        if "min" not in accessor or "max" not in accessor:
            fail(f"POSITION accessor for {node_name} lacks min/max bounds")
        for axis in range(3):
            minima[axis] = min(minima[axis], accessor["min"][axis])
            maxima[axis] = max(maxima[axis], accessor["max"][axis])
        vertex_count += int(accessor.get("count", 0))

    if vertex_count <= 0:
        fail(f"GLB mesh {node_name} has no POSITION vertices")
    return minima, maxima, vertex_count


def validate_authoritative_geometry(gltf):
    glb_mesh_nodes = [node.get("name") for node in gltf.get("nodes", []) if "mesh" in node]
    if set(glb_mesh_nodes) != AUTHORISED_MESHES or len(glb_mesh_nodes) != len(AUTHORISED_MESHES):
        fail(f"unexpected GLB mesh nodes: {glb_mesh_nodes}")

    body_min, body_max, body_vertices = glb_mesh_bounds(gltf, "Viktor_Kane_Body")
    hair_min, hair_max, hair_vertices = glb_mesh_bounds(gltf, "Viktor_Hair")

    height = body_max[1] - body_min[1]
    centre_x = (body_min[0] + body_max[0]) * 0.5
    centre_z = (body_min[2] + body_max[2]) * 0.5
    ground = body_min[1]

    print(
        "VIKTOR_GLB_BODY_BOUNDS",
        "min=", tuple(round(v, 5) for v in body_min),
        "max=", tuple(round(v, 5) for v in body_max),
        "height=", round(height, 5),
        "centre_x=", round(centre_x, 5),
        "centre_z=", round(centre_z, 5),
        "vertices=", body_vertices,
    )
    print(
        "VIKTOR_GLB_HAIR_BOUNDS",
        "min=", tuple(round(v, 5) for v in hair_min),
        "max=", tuple(round(v, 5) for v in hair_max),
        "vertices=", hair_vertices,
    )
    for kit_name in sorted(KIT_MESHES):
        minimum, maximum, vertices = glb_mesh_bounds(gltf, kit_name)
        print(
            "VIKTOR_GLB_KIT_BOUNDS",
            kit_name,
            "min=", tuple(round(v, 5) for v in minimum),
            "max=", tuple(round(v, 5) for v in maximum),
            "vertices=", vertices,
        )

    if abs(height - TARGET_HEIGHT) > 0.02:
        fail(f"Viktor GLB body height must be {TARGET_HEIGHT:.2f}m, found {height:.3f}m")
    if abs(ground) > 0.015:
        fail(f"Viktor GLB feet are not grounded: y_min={ground:.4f}")
    if abs(centre_x) > 0.04 or abs(centre_z) > 0.04:
        fail(f"Viktor GLB is not centred on origin: centre_x={centre_x:.4f}, centre_z={centre_z:.4f}")
    if hair_min[1] < 1.45 or hair_max[1] > 1.89:
        fail(f"Viktor hair bounds are implausible: y={hair_min[1]:.3f}..{hair_max[1]:.3f}")

    return height


def object_world_bounds(obj):
    points = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    minimum = Vector((min(p.x for p in points), min(p.y for p in points), min(p.z for p in points)))
    maximum = Vector((max(p.x for p in points), max(p.y for p in points), max(p.z for p in points)))
    return minimum, maximum


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

    glb_height = validate_authoritative_geometry(gltf)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=source)

    meshes = [obj for obj in bpy.data.objects if obj.type == "MESH"]
    armatures = [obj for obj in bpy.data.objects if obj.type == "ARMATURE"]
    authorised_imported = [bpy.data.objects.get(name) for name in AUTHORISED_MESHES]
    if any(obj is None for obj in authorised_imported):
        fail(f"authorised meshes missing after import; found={[obj.name for obj in meshes]}")
    if not armatures:
        fail("no armature in GLB")

    importer_helpers = [obj.name for obj in meshes if obj.name not in AUTHORISED_MESHES]
    if importer_helpers:
        print("VIKTOR_IMPORTER_HELPERS_IGNORED", importer_helpers)

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
    for mesh in authorised_imported:
        if mesh.find_armature() is not None or any(mod.type == "ARMATURE" for mod in mesh.modifiers):
            skinned_meshes.append(mesh)
    if len(skinned_meshes) != len(AUTHORISED_MESHES):
        fail(
            "all body, hair and football kit shells must remain skinned: "
            f"{[obj.name for obj in skinned_meshes]}"
        )

    body = bpy.data.objects["Viktor_Kane_Body"]
    body_min, body_max = object_world_bounds(body)
    body_dimensions = body_max - body_min
    imported_height_delta = abs(body_dimensions.z - glb_height)
    print(
        "VIKTOR_IMPORTED_BODY",
        "dimensions=", tuple(round(v, 5) for v in body_dimensions),
        "parent=", body.parent.name if body.parent else None,
        "height_delta=", round(imported_height_delta, 5),
    )
    if imported_height_delta > 0.05:
        fail(
            f"Blender re-import materially changed Viktor body height: GLB={glb_height:.3f}, imported={body_dimensions.z:.3f}"
        )

    file_size = os.path.getsize(source)
    if file_size < 50_000:
        fail(f"GLB suspiciously small: {file_size} bytes")
    if file_size > 95_000_000:
        fail(f"GLB exceeds GitHub production budget: {file_size} bytes")

    print("VIKTOR_VERIFY_OK")
    print("file", source)
    print("size_bytes", file_size)
    print("height_m", round(glb_height, 4))
    print("authorised_meshes", [(obj.name, len(obj.data.vertices), len(obj.data.polygons)) for obj in authorised_imported])
    print("armatures", [obj.name for obj in armatures])
    print("glb_animations", sorted(animation_names))
    print("imported_actions", sorted(imported_actions))
    print("bones", sorted(bones))


if __name__ == "__main__":
    main()
