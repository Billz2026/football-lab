"""Football Lab Viktor V48 premium striker polish.

V47.4 is technically sound, but the gameplay captures still read as a generic
base humanoid. V48 keeps the verified rig, bind-space skinning and seven strike
clips, then improves only the visible art layer: lean elite-striker proportions,
a genuinely fitted short-sleeve kit, slimmer inherited boots, a less helmet-like
short haircut, restrained kit trim and an integrated back name/number.

Viktor Kane remains an original Football Lab character. The brief is a tall,
mature English number-nine archetype, not a direct likeness of a real player.
"""

import math
import os

import bpy
from mathutils import Vector

BASE_PATH = os.path.join(os.path.dirname(__file__), "run-build-viktor-v47-4.py")
with open(BASE_PATH, "r", encoding="utf-8") as handle:
    source = handle.read()

marker = "builder.main()"
if marker not in source:
    raise RuntimeError("V47.4 builder entry point not found")

v474_globals = {
    "__file__": BASE_PATH,
    "__name__": "football_lab_v47_4_base",
}
exec(compile(source.rsplit(marker, 1)[0], BASE_PATH, "exec"), v474_globals)

builder = v474_globals["builder"]
_surface_shell = v474_globals["_surface_shell"]
_material = v474_globals["_material"]
_hair_shell = v474_globals["_hair_shell"]
_shape_inherited_boots = v474_globals["_shape_inherited_boots"]

base_normalise_body = builder.normalise_body
base_skin_only_material = builder.assign_kit_materials
base_add_metadata = builder.add_metadata

TARGET_HEIGHT = 1.88


def _mesh_centre(mesh, polygon):
    count = max(1, len(polygon.vertices))
    return Vector((
        sum(mesh.vertices[i].co.x for i in polygon.vertices) / count,
        sum(mesh.vertices[i].co.y for i in polygon.vertices) / count,
        sum(mesh.vertices[i].co.z for i in polygon.vertices) / count,
    ))


def premium_normalise_body(body):
    body = base_normalise_body(body)

    minimum, maximum = builder.mesh_world_bounds(body)
    height = max(0.001, maximum.z - minimum.z)

    # V47 already fixed the stocky V46 silhouette. This pass is deliberately
    # smaller: create a stronger shoulder-to-waist taper, keep useful calf mass
    # and restore a little head presence so the 1.88 m player does not read as
    # a small-headed mannequin from the gameplay camera.
    for vertex in body.data.vertices:
        z = (vertex.co.z - minimum.z) / height

        if 0.08 <= z < 0.27:      # calves: athletic rather than stick-thin
            vertex.co.x *= 1.018
            vertex.co.y *= 1.010
        elif 0.50 <= z < 0.63:    # pelvis / waist
            vertex.co.x *= 0.955
            vertex.co.y *= 0.980
        elif 0.63 <= z < 0.75:    # lower / mid torso
            vertex.co.x *= 0.978
            vertex.co.y *= 0.990
        elif 0.75 <= z < 0.815:   # upper chest / shoulder girdle
            vertex.co.x *= 1.015
            vertex.co.y *= 1.005
        elif z >= 0.84:            # head: undo the overly small V47 rear read
            vertex.co.x *= 1.018
            vertex.co.y *= 1.012

    body.data.update()
    body["football_lab_visual_archetype"] = "premium-elite-english-striker"
    body["football_lab_art_revision"] = "V48"
    body["football_lab_gameplay_camera_polish"] = True
    return body


def premium_skin_material(body):
    base_skin_only_material(body)

    # Keep the procedural skin map but reduce the dry/chalky V47 response.
    for material in body.data.materials:
        if not material or not material.use_nodes:
            continue
        bsdf = next((node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
        if bsdf is None:
            continue
        bsdf.inputs["Roughness"].default_value = 0.64
        if "Specular IOR Level" in bsdf.inputs:
            bsdf.inputs["Specular IOR Level"].default_value = 0.26


def _v48_shirt(point):
    if point.z < 0.985 or point.z > 1.595:
        return False

    # Spatial shells are evaluated in the source T-pose. V47's lower limit was
    # broad enough to catch forearm vertices, creating the long-sleeve/sweater
    # look in the real gameplay capture. Keep the torso deliberately narrow and
    # let the dedicated sleeve shell own the upper arms.
    if point.z < 1.22:
        limit = 0.235
    elif point.z < 1.39:
        limit = 0.255
    else:
        limit = 0.295

    if abs(point.x) > limit:
        return False

    # Compact crew neck rather than a raw horizontal cut.
    if point.z > 1.485:
        neck_x = point.x / 0.118
        neck_y = point.y / 0.103
        if neck_x * neck_x + neck_y * neck_y < 1.0:
            return False
    return True


def _v48_sleeves(point):
    # True short sleeves: shoulder to upper arm only.
    return 1.335 <= point.z <= 1.525 and 0.185 <= abs(point.x) <= 0.455


def _v48_shorts(point):
    # Shorter athletic football shorts; V47.4 ran too far down the thigh.
    return 0.755 <= point.z <= 1.015 and abs(point.x) <= 0.355


def _v48_socks(point):
    return 0.105 <= point.z <= 0.495


def _v48_boot_seed(point):
    return point.z <= 0.178


def _assign_material_band(obj, material, predicate):
    if material.name not in {m.name for m in obj.data.materials if m}:
        obj.data.materials.append(material)
    material_index = next(
        index for index, item in enumerate(obj.data.materials)
        if item and item.name == material.name
    )
    changed = 0
    for polygon in obj.data.polygons:
        centre = _mesh_centre(obj.data, polygon)
        if predicate(centre):
            polygon.material_index = material_index
            changed += 1
    obj.data.update()
    return changed


def _append_back_text(shirt, armature, material, text_value, size, z):
    # Place text just outside the actual rear shirt surface rather than relying
    # on a hard-coded body depth.
    candidates = [
        vertex.co.y
        for vertex in shirt.data.vertices
        if 1.12 <= vertex.co.z <= 1.50 and abs(vertex.co.x) <= 0.18
    ]
    if not candidates:
        raise RuntimeError("V48 could not resolve rear shirt surface")
    back_y = max(candidates) + 0.006

    curve = bpy.data.curves.new(f"V48_{text_value}_Curve", type="FONT")
    curve.body = text_value
    curve.align_x = "CENTER"
    curve.align_y = "CENTER"
    curve.size = size
    curve.extrude = 0.0016
    curve.bevel_depth = 0.0005
    curve.bevel_resolution = 1
    curve.resolution_u = 2
    curve.materials.append(material)

    text = bpy.data.objects.new(f"V48_{text_value}_Text", curve)
    bpy.context.collection.objects.link(text)
    text.location = (0.0, back_y, z)

    # Default Blender text is XY with +Z normal. Rotate local Y to world +Z and
    # reflect only local Z so the glyph faces the rear camera without mirroring.
    text.rotation_euler = (math.radians(90.0), 0.0, 0.0)
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
    modifier = text.modifiers.new(name="V48_Number_Armature", type="ARMATURE")
    modifier.object = armature
    text.parent = armature

    # Merge the detail into the authorised shirt node. This retains the strict
    # production mesh contract while preserving a separate navy material slot.
    bpy.ops.object.select_all(action="DESELECT")
    shirt.select_set(True)
    text.select_set(True)
    bpy.context.view_layer.objects.active = shirt
    bpy.ops.object.join()
    shirt.name = "Viktor_Shirt"
    shirt.data.name = "Viktor_Shirt_Mesh"
    shirt.data.update()


def _polish_hair(hair):
    # Break the perfectly smooth cap outline by adding only a few millimetres of
    # controlled crown irregularity. Keep the sides/back close-cropped.
    for vertex in hair.data.vertices:
        if vertex.co.z >= 1.755:
            ripple = 0.0025 * (
                math.sin(vertex.co.x * 61.0 + vertex.co.y * 29.0)
                + 0.45 * math.sin(vertex.co.x * 113.0 - vertex.co.y * 47.0)
            )
            vertex.co.z = min(1.884, vertex.co.z + ripple)
        elif vertex.co.z < 1.705:
            vertex.co.x *= 0.992
            vertex.co.y *= 0.994
    hair.data.update()
    hair["football_lab_attachment"] = "premium-cropped-textured-scalp-shell"
    hair["football_lab_art_revision"] = "V48"
    return hair


def _polish_boots(boots):
    _shape_inherited_boots(boots)

    for vertex in boots.data.vertices:
        side = 1.0 if vertex.co.x >= 0.0 else -1.0
        centre_x = side * 0.105
        vertex.co.x = centre_x + (vertex.co.x - centre_x) * 0.955
        if vertex.co.y < -0.045:
            vertex.co.y = -0.045 + (vertex.co.y + 0.045) * 1.020
    boots.data.update()
    boots["football_lab_attachment"] = "premium-inherited-skinned-football-boots"
    boots["football_lab_art_revision"] = "V48"
    return boots


def create_v48_kit_and_hair(armature):
    # Slightly darker cloth than V47.4 preserves folds/shading under the strong
    # gameplay light instead of clipping the shirt to flat white.
    shirt_mat = _material("VIKTOR_V48_Shirt", (0.80, 0.825, 0.845), 0.68)
    sleeve_mat = _material("VIKTOR_V48_Sleeves", (0.79, 0.815, 0.835), 0.69)
    shorts_mat = _material("VIKTOR_V48_Shorts", (0.012, 0.026, 0.060), 0.66)
    socks_mat = _material("VIKTOR_V48_Socks", (0.82, 0.84, 0.855), 0.74)
    boots_mat = _material("VIKTOR_V48_Boots", (0.006, 0.008, 0.011), 0.36)
    hair_mat = _material("VIKTOR_V48_Hair", (0.115, 0.070, 0.034), 0.80)
    navy_trim = _material("VIKTOR_V48_Navy_Trim", (0.018, 0.038, 0.080), 0.61)
    white_trim = _material("VIKTOR_V48_White_Trim", (0.78, 0.815, 0.84), 0.68)
    sole_mat = _material("VIKTOR_V48_Boot_Sole", (0.055, 0.060, 0.067), 0.46)

    shirt = _surface_shell(
        "Viktor_Shirt", _v48_shirt, shirt_mat,
        outward=0.013, smooth_factor=0.014, subdivide=False,
    )
    sleeves = _surface_shell(
        "Viktor_Sleeves_Navy", _v48_sleeves, sleeve_mat,
        outward=0.011, smooth_factor=0.012, subdivide=False,
    )
    shorts = _surface_shell(
        "Viktor_Shorts", _v48_shorts, shorts_mat,
        outward=0.012, smooth_factor=0.013, subdivide=False,
    )
    socks = _surface_shell(
        "Viktor_Socks", _v48_socks, socks_mat,
        outward=0.006, smooth_factor=0.008, subdivide=False,
    )
    boots = _surface_shell(
        "Viktor_Boots", _v48_boot_seed, boots_mat,
        outward=0.007, smooth_factor=0.006, subdivide=False, min_z=0.002,
    )
    _polish_boots(boots)

    # Restrained football-kit detailing that remains readable from the normal
    # rear camera without turning the character into a billboard.
    _assign_material_band(
        sleeves, navy_trim,
        lambda p: abs(p.x) >= 0.405 and 1.34 <= p.z <= 1.50,
    )
    _assign_material_band(
        shorts, white_trim,
        lambda p: abs(p.x) >= 0.255 and 0.79 <= p.z <= 0.995,
    )
    _assign_material_band(
        socks, navy_trim,
        lambda p: 0.445 <= p.z <= 0.495,
    )
    _assign_material_band(
        boots, sole_mat,
        lambda p: p.z <= 0.030,
    )

    # Viktor is Football Lab's number 10. Integrate the detail into the shirt so
    # it deforms with the chest and does not add an unauthorised export node.
    _append_back_text(shirt, armature, navy_trim, "10", 0.205, 1.285)
    _append_back_text(shirt, armature, navy_trim, "KANE", 0.055, 1.445)

    hair = _hair_shell(armature, hair_mat)
    return _polish_hair(hair)


def add_v48_metadata(body, armature):
    base_add_metadata(body, armature)
    body["football_lab_build"] = "48.0.0"
    body["football_lab_character"] = "viktor-kane"
    body["football_lab_visual_archetype"] = "premium-elite-english-striker"
    body["football_lab_art_revision"] = "V48"
    body["football_lab_gameplay_camera_polish"] = True
    armature["football_lab_build"] = "48.0.0"
    armature["football_lab_art_revision"] = "V48"


builder.normalise_body = premium_normalise_body
builder.assign_kit_materials = premium_skin_material
builder.add_hair = create_v48_kit_and_hair
builder.add_metadata = add_v48_metadata
builder.main()
