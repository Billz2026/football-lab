"""Football Lab Viktor V48.1 visual correction.

V48.0 materially improved Viktor's gameplay silhouette and short-sleeve kit,
but the real rendered evidence exposed two art defects that are unacceptable for
a lock candidate: rear shirt lettering was mirrored and the extra boot narrowing
could expose anatomical skin at some foot angles.

V48.1 preserves the accepted V48 proportions, materials, hair, rig and all seven
strike clips. It only corrects those two rendered defects.
"""

import math
import os

import bpy

BASE_PATH = os.path.join(os.path.dirname(__file__), "run-build-viktor-v48.py")
with open(BASE_PATH, "r", encoding="utf-8") as handle:
    source = handle.read()

marker = "builder.main()"
if marker not in source:
    raise RuntimeError("V48 builder entry point not found")

v48_globals = {
    "__file__": BASE_PATH,
    "__name__": "football_lab_v48_base",
}
exec(compile(source.rsplit(marker, 1)[0], BASE_PATH, "exec"), v48_globals)

builder = v48_globals["builder"]
_shape_inherited_boots = v48_globals["_shape_inherited_boots"]
base_add_metadata = builder.add_metadata


def _v481_boot_seed(point):
    # Restore V47.4's proven complete anatomical-foot selection. The V48.0
    # 0.178 m crop was too aggressive around the ankle/instep in angled poses.
    return point.z <= 0.185


def _v481_polish_boots(boots):
    # Use the already-certified inherited-bind-space shaping exactly once.
    # Do not shrink the shell again: the second V48.0 width contraction could
    # move the shoe surface inside the anatomical foot and reveal skin.
    _shape_inherited_boots(boots)
    boots["football_lab_attachment"] = "premium-full-coverage-skinned-football-boots"
    boots["football_lab_art_revision"] = "V48.1"
    return boots


def _append_back_text_v481(shirt, armature, material, text_value, size, z):
    candidates = [
        vertex.co.y
        for vertex in shirt.data.vertices
        if 1.12 <= vertex.co.z <= 1.50 and abs(vertex.co.x) <= 0.18
    ]
    if not candidates:
        raise RuntimeError("V48.1 could not resolve rear shirt surface")
    back_y = max(candidates) + 0.006

    curve = bpy.data.curves.new(f"V48_1_{text_value}_Curve", type="FONT")
    curve.body = text_value
    curve.align_x = "CENTER"
    curve.align_y = "CENTER"
    curve.size = size
    curve.extrude = 0.0016
    curve.bevel_depth = 0.0005
    curve.bevel_resolution = 1
    curve.resolution_u = 2
    curve.materials.append(material)

    text = bpy.data.objects.new(f"V48_1_{text_value}_Text", curve)
    bpy.context.collection.objects.link(text)
    text.location = (0.0, back_y, z)

    # V48.0 correctly placed the text on the rear shirt but the gameplay camera
    # viewed the glyph winding from the opposite side, so KANE/10 appeared
    # mirrored. Reflect local X as well as local Z: this corrects the visible
    # glyph orientation while retaining the same rear-facing placement.
    text.rotation_euler = (math.radians(90.0), 0.0, 0.0)
    text.scale.x = -1.0
    text.scale.z = -1.0

    bpy.ops.object.select_all(action="DESELECT")
    text.select_set(True)
    bpy.context.view_layer.objects.active = text
    bpy.ops.object.convert(target="MESH")
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    text = bpy.context.active_object
    for polygon in text.data.polygons:
        polygon.use_smooth = False

    group = text.vertex_groups.new(name="Chest")
    group.add([vertex.index for vertex in text.data.vertices], 1.0, "REPLACE")
    modifier = text.modifiers.new(name="V48_1_Number_Armature", type="ARMATURE")
    modifier.object = armature
    text.parent = armature

    bpy.ops.object.select_all(action="DESELECT")
    shirt.select_set(True)
    text.select_set(True)
    bpy.context.view_layer.objects.active = shirt
    bpy.ops.object.join()
    shirt.name = "Viktor_Shirt"
    shirt.data.name = "Viktor_Shirt_Mesh"
    shirt.data.update()


def add_v481_metadata(body, armature):
    base_add_metadata(body, armature)
    body["football_lab_build"] = "48.1.0"
    body["football_lab_art_revision"] = "V48.1"
    body["football_lab_boot_coverage_fix"] = True
    body["football_lab_rear_kit_orientation_fix"] = True
    armature["football_lab_build"] = "48.1.0"
    armature["football_lab_art_revision"] = "V48.1"


# create_v48_kit_and_hair resolves these symbols from its defining globals.
v48_globals["_v48_boot_seed"] = _v481_boot_seed
v48_globals["_polish_boots"] = _v481_polish_boots
v48_globals["_append_back_text"] = _append_back_text_v481
builder.add_hair = v48_globals["create_v48_kit_and_hair"]
builder.add_metadata = add_v481_metadata
builder.main()
