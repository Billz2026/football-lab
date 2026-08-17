"""Football Lab Viktor V47.3 visual correction.

V47.2 passed the production GLB contract and the real gameplay tests, but the
captured frames still failed the visual bar: the hair read as a rounded cap,
the explicit boots were oversized and lost their material when the mesh data
was replaced, and the shirt had an overly broad/raw shoulder opening.

This pass preserves the verified V47.2 body proportions, skin, skeleton and all
seven strike clips. It only rebuilds the three failed art elements.
"""

import os
import math

import bmesh
import bpy
from mathutils import Vector

BASE_PATH = os.path.join(os.path.dirname(__file__), "run-build-viktor-v47-2.py")
with open(BASE_PATH, "r", encoding="utf-8") as handle:
    source = handle.read()

marker = "builder.main()"
if marker not in source:
    raise RuntimeError("V47.2 builder entry point not found")

v472_globals = {
    "__file__": BASE_PATH,
    "__name__": "football_lab_v47_2_base",
}
exec(compile(source.rsplit(marker, 1)[0], BASE_PATH, "exec"), v472_globals)

builder = v472_globals["builder"]
# V47.2 -> V47.1 -> V47 base. The actual kit function lives in this deepest
# namespace, and builder.add_hair currently points to that function object.
v471_globals = v472_globals["v471_globals"]
base_globals = v472_globals["base_globals"]
_surface_shell = base_globals["_surface_shell"]
_ensure_armature_modifier = v471_globals["_ensure_armature_modifier"]


def _material(name, base, roughness):
    return builder.make_material(name, base, roughness)


def _crew_neck_shirt(point):
    if point.z < 0.955 or point.z > 1.615:
        return False

    # Fitted waist-to-chest envelope.
    t = max(0.0, min(1.0, (point.z - 0.955) / (1.615 - 0.955)))
    torso_limit = 0.335 + 0.205 * (t ** 0.72)
    if abs(point.x) > torso_limit:
        return False

    # Above the upper chest, retain fabric over the shoulder ridge but cut a
    # compact elliptical crew neck around the actual neck rather than slicing
    # the whole mesh horizontally. This removes the raw shoulder opening seen
    # in the V47.2 screenshots.
    if point.z > 1.475:
        neck_x = point.x / 0.118
        neck_y = point.y / 0.105
        if neck_x * neck_x + neck_y * neck_y < 1.0:
            return False
    return True


def _sleeves(point):
    return 1.17 <= point.z <= 1.505 and 0.255 <= abs(point.x) <= 0.565


def _shorts(point):
    return 0.675 <= point.z <= 1.015 and abs(point.x) <= 0.365


def _socks(point):
    return 0.10 <= point.z <= 0.505


def _boot_seed(point):
    # Only creates the legacy object/material container. Its geometry is fully
    # replaced by deterministic V47.3 boots below.
    return point.z <= 0.17


def _hair_shell(armature, material):
    body = bpy.data.objects.get("Viktor_Kane_Body")
    if body is None:
        raise RuntimeError("V47.3 body missing while creating hair")

    # Duplicate the anatomical scalp itself instead of approximating hair with
    # ellipsoids. Front is deliberately higher/receded; sides/back extend lower.
    def predicate(point):
        if point.y < -0.020:      # forehead/front
            threshold = 1.735 + min(0.018, abs(point.x) * 0.10)
        elif point.y > 0.035:     # back
            threshold = 1.655
        else:                     # sides/crown
            threshold = 1.675
        return point.z >= threshold

    hair = _surface_shell(
        "Viktor_Hair",
        predicate,
        material,
        outward=0.008,
        smooth_factor=0.012,
        subdivide=False,
    )

    # Keep the scalp shell inside the strict character envelope even at the
    # crown, while retaining enough offset to read clearly from mobile distance.
    for vertex in hair.data.vertices:
        vertex.co.z = min(vertex.co.z, 1.884)
    hair.data.update()
    for polygon in hair.data.polygons:
        polygon.use_smooth = True
    hair["football_lab_attachment"] = "anatomical-cropped-scalp-shell"
    hair["football_lab_art_revision"] = "V47.3"
    return hair


def _boot_vertices_for_side(center_x):
    # Football boot: compact tapered wedge aligned with the existing foot/toe
    # bones. Overall ~27 cm long, ~11 cm at the toe, ~8 cm at the heel.
    y_heel = 0.010
    y_toe = -0.260
    z_bottom = 0.004
    z_heel_top = 0.082
    z_toe_top = 0.060
    heel_half = 0.040
    toe_half = 0.055

    return [
        (center_x - heel_half, y_heel, z_bottom),
        (center_x + heel_half, y_heel, z_bottom),
        (center_x - toe_half, y_toe, z_bottom),
        (center_x + toe_half, y_toe, z_bottom),
        (center_x - heel_half, y_heel, z_heel_top),
        (center_x + heel_half, y_heel, z_heel_top),
        (center_x - toe_half, y_toe, z_toe_top),
        (center_x + toe_half, y_toe, z_toe_top),
    ]


def _append_boot(vertices, faces, center_x):
    start = len(vertices)
    vertices.extend(_boot_vertices_for_side(center_x))
    # bottom, top, inner, outer, heel, toe
    faces.extend([
        (start + 0, start + 2, start + 3, start + 1),
        (start + 4, start + 5, start + 7, start + 6),
        (start + 0, start + 4, start + 6, start + 2),
        (start + 1, start + 3, start + 7, start + 5),
        (start + 0, start + 1, start + 5, start + 4),
        (start + 2, start + 6, start + 7, start + 3),
    ])
    return start, start + 8


def _replace_boot_geometry(boots):
    armature = bpy.data.objects.get("FL_HUMANOID_V1")
    if armature is None:
        raise RuntimeError("V47.3 armature missing while creating boots")

    # Preserve the black boot material BEFORE replacing the mesh datablock.
    old_material = boots.data.materials[0] if len(boots.data.materials) else None
    if old_material is None:
        old_material = _material("VIKTOR_V47_Boots_Black", (0.006, 0.008, 0.012), 0.42)

    vertices = []
    faces = []
    left_range = _append_boot(vertices, faces, 0.105)
    right_range = _append_boot(vertices, faces, -0.105)

    mesh = bpy.data.meshes.new("Viktor_Boots_Mesh_V47_3")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    mesh.materials.append(old_material)
    for polygon in mesh.polygons:
        polygon.material_index = 0
        polygon.use_smooth = True

    boots.data = mesh
    boots.parent = armature

    # Remove inherited modifiers from the copied body shell. Bevel the compact
    # wedge before skinning to avoid the disc/egg silhouette from V47.2.
    for modifier in list(boots.modifiers):
        boots.modifiers.remove(modifier)

    bpy.ops.object.select_all(action="DESELECT")
    boots.select_set(True)
    bpy.context.view_layer.objects.active = boots
    bevel = boots.modifiers.new(name="V47_3_Boot_Rounding", type="BEVEL")
    bevel.width = 0.012
    bevel.segments = 2
    bevel.affect = "EDGES"
    try:
        bpy.ops.object.modifier_apply(modifier=bevel.name)
    except Exception as exc:
        print("V47_3_BOOT_BEVEL_WARNING", repr(exc))

    # Bevel creates extra vertices, so assign groups afterwards by side.
    boots.vertex_groups.clear()
    left = boots.vertex_groups.new(name="LeftFoot")
    right = boots.vertex_groups.new(name="RightFoot")
    left_indices = [v.index for v in boots.data.vertices if v.co.x >= 0]
    right_indices = [v.index for v in boots.data.vertices if v.co.x < 0]
    left.add(left_indices, 1.0, "REPLACE")
    right.add(right_indices, 1.0, "REPLACE")
    _ensure_armature_modifier(boots, armature)

    boots["football_lab_attachment"] = "compact-tapered-football-boots"
    boots["football_lab_skinning"] = "foot-bone-rigid"
    boots["football_lab_art_revision"] = "V47.3"
    return boots


def create_v473_kit_and_hair(armature):
    shirt = _material("VIKTOR_V47_3_Shirt", (0.935, 0.945, 0.955), 0.82)
    sleeves = _material("VIKTOR_V47_3_Sleeves", (0.925, 0.938, 0.948), 0.83)
    shorts = _material("VIKTOR_V47_3_Shorts", (0.014, 0.027, 0.060), 0.77)
    socks = _material("VIKTOR_V47_3_Socks", (0.90, 0.915, 0.928), 0.84)
    boots_mat = _material("VIKTOR_V47_3_Boots", (0.006, 0.008, 0.012), 0.43)
    hair_mat = _material("VIKTOR_V47_3_Hair", (0.105, 0.060, 0.027), 0.91)

    _surface_shell("Viktor_Shirt", _crew_neck_shirt, shirt, outward=0.016, smooth_factor=0.018)
    _surface_shell("Viktor_Sleeves_Navy", _sleeves, sleeves, outward=0.013, smooth_factor=0.016)
    _surface_shell("Viktor_Shorts", _shorts, shorts, outward=0.014, smooth_factor=0.016)
    _surface_shell("Viktor_Socks", _socks, socks, outward=0.007, smooth_factor=0.010)
    boot_obj = _surface_shell("Viktor_Boots", _boot_seed, boots_mat, outward=0.004, smooth_factor=0.0, min_z=0.002)
    _replace_boot_geometry(boot_obj)
    return _hair_shell(armature, hair_mat)


# Replace the V47 base kit/hair hook directly. The V47.2 normalisation and the
# accepted V46/V47 animation pipeline remain untouched.
builder.add_hair = create_v473_kit_and_hair

builder.main()
