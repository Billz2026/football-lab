"""Render neutral Viktor Kane review angles from the committed GLB.

This is an art-review utility only. It does not modify the model or gameplay.
It renders front, three-quarter and rear neutral views so visual approval is not
based solely on Football Lab's normal behind-the-player gameplay camera.
"""

import argparse
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
    for block in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
        for item in list(block):
            if item.users == 0:
                block.remove(item)


def world_bounds(objects):
    points = []
    for obj in objects:
        if obj.type != "MESH" or not obj.bound_box:
            continue
        points.extend(obj.matrix_world @ Vector(corner) for corner in obj.bound_box)
    if not points:
        raise RuntimeError("No rendered mesh bounds found")
    mins = Vector((min(p.x for p in points), min(p.y for p in points), min(p.z for p in points)))
    maxs = Vector((max(p.x for p in points), max(p.y for p in points), max(p.z for p in points)))
    return mins, maxs


def look_at(camera, target):
    direction = Vector(target) - camera.location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def make_area(name, location, energy, size, target):
    light_data = bpy.data.lights.new(name=name, type="AREA")
    light_data.energy = energy
    light_data.shape = "DISK"
    light_data.size = size
    light = bpy.data.objects.new(name, light_data)
    bpy.context.collection.objects.link(light)
    light.location = location
    look_at(light, target)
    return light


def set_idle_pose():
    armature = next((obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE"), None)
    if armature is None:
        return
    actions = list(bpy.data.actions)
    idle = next((action for action in actions if action.name.lower() == "idle"), None)
    if armature.animation_data is None:
        armature.animation_data_create()
    if idle is not None:
        armature.animation_data.action = idle
    bpy.context.scene.frame_set(1)


def main():
    args = parse_args()
    os.makedirs(args.output_dir, exist_ok=True)
    clear_scene()

    bpy.ops.import_scene.gltf(filepath=args.input)
    set_idle_pose()

    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    mins, maxs = world_bounds(meshes)
    centre = (mins + maxs) * 0.5
    height = maxs.z - mins.z
    target = Vector((centre.x, centre.y, mins.z + height * 0.55))

    scene = bpy.context.scene
    try:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    except Exception:
        scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 800
    scene.render.resolution_y = 1000
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False

    if hasattr(scene, "view_settings"):
        try:
            scene.view_settings.look = "AgX - Medium High Contrast"
        except Exception:
            pass
        scene.view_settings.exposure = 0.0

    scene.world.color = (0.035, 0.04, 0.05)

    # Neutral review floor.
    bpy.ops.mesh.primitive_plane_add(size=12, location=(centre.x, centre.y, mins.z - 0.003))
    floor = bpy.context.active_object
    floor_mat = bpy.data.materials.new("Review_Floor")
    floor_mat.use_nodes = True
    floor_bsdf = floor_mat.node_tree.nodes.get("Principled BSDF")
    floor_bsdf.inputs["Base Color"].default_value = (0.07, 0.075, 0.085, 1.0)
    floor_bsdf.inputs["Roughness"].default_value = 0.88
    floor.data.materials.append(floor_mat)

    make_area("Key", (centre.x - 2.2, centre.y - 2.7, mins.z + height * 1.25), 900, 3.0, target)
    make_area("Fill", (centre.x + 2.4, centre.y - 1.5, mins.z + height * 0.78), 430, 3.5, target)
    make_area("Rim", (centre.x + 0.8, centre.y + 2.6, mins.z + height * 1.18), 700, 2.5, target)

    camera_data = bpy.data.cameras.new("ReviewCamera")
    camera = bpy.data.objects.new("ReviewCamera", camera_data)
    bpy.context.collection.objects.link(camera)
    scene.camera = camera
    camera.data.lens = 68

    distance = height * 1.55
    views = {
        "front": Vector((centre.x, centre.y - distance, mins.z + height * 0.58)),
        "three-quarter": Vector((centre.x - distance * 0.62, centre.y - distance * 0.82, mins.z + height * 0.61)),
        "rear": Vector((centre.x, centre.y + distance, mins.z + height * 0.58)),
    }

    for name, location in views.items():
        camera.location = location
        look_at(camera, target)
        scene.render.filepath = os.path.join(args.output_dir, f"viktor-v48-review-{name}.png")
        bpy.ops.render.render(write_still=True)
        print("VIKTOR_REVIEW_RENDER", name, scene.render.filepath)


if __name__ == "__main__":
    main()
