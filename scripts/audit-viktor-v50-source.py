"""Audit a candidate Quaternius Universal Base Character GLB before migration.

This script is diagnostic only. It imports the candidate, prints its mesh/rig
contract and renders front/three-quarter/rear neutral views so Football Lab can
compare source quality before changing Viktor Kane's production asset pipeline.
"""

import argparse
import json
import math
import os
import sys

import bpy
from mathutils import Vector


def parse_args():
    argv = sys.argv
    argv = argv[argv.index("--") + 1:] if "--" in argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output-dir", required=True)
    return parser.parse_args(argv)


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def look_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def bounds(meshes):
    points = []
    for obj in meshes:
        points.extend(obj.matrix_world @ Vector(corner) for corner in obj.bound_box)
    mins = Vector((min(p.x for p in points), min(p.y for p in points), min(p.z for p in points)))
    maxs = Vector((max(p.x for p in points), max(p.y for p in points), max(p.z for p in points)))
    return mins, maxs


def add_area(name, location, energy, size, target):
    data = bpy.data.lights.new(name, "AREA")
    data.energy = energy
    data.size = size
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    look_at(obj, target)


def main():
    args = parse_args()
    os.makedirs(args.output_dir, exist_ok=True)
    clear_scene()
    bpy.ops.import_scene.gltf(filepath=args.input)

    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    armatures = [obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE"]
    if not meshes:
        raise RuntimeError("Candidate contains no mesh")

    minimum, maximum = bounds(meshes)
    height = maximum.z - minimum.z
    centre = (minimum + maximum) * 0.5
    target = Vector((centre.x, centre.y, minimum.z + height * 0.53))

    audit = {
        "mesh_names": [obj.name for obj in meshes],
        "mesh_count": len(meshes),
        "armatures": [],
        "actions": [action.name for action in bpy.data.actions],
        "height": height,
        "materials": sorted({mat.name for obj in meshes for mat in obj.data.materials if mat}),
    }
    for armature in armatures:
        audit["armatures"].append({
            "name": armature.name,
            "bones": [bone.name for bone in armature.data.bones],
        })

    with open(os.path.join(args.output_dir, "candidate-audit.json"), "w", encoding="utf-8") as handle:
        json.dump(audit, handle, indent=2)
    print("V50_SOURCE_AUDIT", json.dumps(audit))

    scene = bpy.context.scene
    try:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    except Exception:
        scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 800
    scene.render.resolution_y = 1000
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.world.color = (0.035, 0.04, 0.05)

    bpy.ops.mesh.primitive_plane_add(size=12, location=(centre.x, centre.y, minimum.z - 0.003))
    floor = bpy.context.active_object
    mat = bpy.data.materials.new("AuditFloor")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (0.07, 0.075, 0.085, 1.0)
    bsdf.inputs["Roughness"].default_value = 0.88
    floor.data.materials.append(mat)

    add_area("Key", (centre.x - 2.2, centre.y - 2.7, minimum.z + height * 1.25), 900, 3.0, target)
    add_area("Fill", (centre.x + 2.4, centre.y - 1.5, minimum.z + height * 0.78), 430, 3.5, target)
    add_area("Rim", (centre.x + 0.8, centre.y + 2.6, minimum.z + height * 1.18), 700, 2.5, target)

    camera_data = bpy.data.cameras.new("AuditCamera")
    camera = bpy.data.objects.new("AuditCamera", camera_data)
    bpy.context.collection.objects.link(camera)
    scene.camera = camera
    camera.data.lens = 62

    distance = height * 1.78
    views = {
        "front": Vector((centre.x, centre.y - distance, minimum.z + height * 0.55)),
        "three-quarter": Vector((centre.x - distance * 0.62, centre.y - distance * 0.82, minimum.z + height * 0.57)),
        "rear": Vector((centre.x, centre.y + distance, minimum.z + height * 0.55)),
    }
    for name, location in views.items():
        camera.location = location
        look_at(camera, target)
        scene.render.filepath = os.path.join(args.output_dir, f"v50-source-{name}.png")
        bpy.ops.render.render(write_still=True)


if __name__ == "__main__":
    main()
