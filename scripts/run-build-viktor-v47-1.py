"""Targeted V47.1 Viktor visual correction.

The first V47 gameplay capture improved the torso/kit read but exposed two
unacceptable authoring defects: the fitted scalp shell disappeared at gameplay
distance and the body-derived boot shell collapsed inside one foot. This pass
keeps the verified V47 body/kit/animation pipeline and replaces those two
surfaces with deterministic skinned geometry. It also trims the lower-body
silhouette slightly for a taller centre-forward read.
"""

import math
import os

import bpy

BASE_PATH = os.path.join(os.path.dirname(__file__), "run-build-viktor-v47.py")
with open(BASE_PATH, "r", encoding="utf-8") as handle:
    source = handle.read()

marker = "builder.main()"
if marker not in source:
    raise RuntimeError("V47 base builder entry point not found")

# Execute the V47 definitions and monkey patches without starting Blender export.
namespace = {
    "__file__": BASE_PATH,
    "__name__": "football_lab_v47_base",
}
exec(compile(source.rsplit(marker, 1)[0], BASE_PATH, "exec"), namespace)

builder = namespace["builder"]
base_normalise = namespace["striker_normalise_body"]


def v471_normalise_body(body):
    body = base_normalise(body)
    minimum, maximum = builder.mesh_world_bounds(body)
    height = maximum.z - minimum.z

    # V47 was still a little heavy through the legs from the rear mobile camera.
    # Keep elite-footballer mass while creating a longer, cleaner striker read.
    for vertex in body.data.vertices:
        z = (vertex.co.z - minimum.z) / max(height, 1e-6)
        if 0.07 <= z < 0.285:       # calves
            vertex.co.x *= 0.965
            vertex.co.y *= 0.975
        elif 0.285 <= z < 0.47:     # thighs
            vertex.co.x *= 0.975
            vertex.co.y *= 0.982
        elif 0.47 <= z < 0.57:      # hips / waist transition
            vertex.co.x *= 0.985
    body.data.update()
    body["football_lab_art_revision"] = "V47.1"
    return body


def _ellipsoid_mesh(vertices, faces, centre, radii, rings=8, segments=18, top_fraction=1.0):
    start = len(vertices)
    cx, cy, cz = centre
    rx, ry, rz = radii
    max_theta = math.pi * top_fraction
    for ring in range(rings + 1):
        theta = max_theta * ring / rings
        sin_t = math.sin(theta)
        cos_t = math.cos(theta)
        for segment in range(segments):
            phi = 2.0 * math.pi * segment / segments
            vertices.append((
                cx + rx * sin_t * math.cos(phi),
                cy + ry * sin_t * math.sin(phi),
                cz + rz * cos_t,
            ))
    for ring in range(rings):
        for segment in range(segments):
            a = start + ring * segments + segment
            b = start + ring * segments + (segment + 1) % segments
            c = start + (ring + 1) * segments + (segment + 1) % segments
            d = start + (ring + 1) * segments + segment
            faces.append((a, b, c, d))
    return start, len(vertices)


def _ensure_armature_modifier(obj, armature):
    for modifier in list(obj.modifiers):
        if modifier.type == "ARMATURE":
            modifier.object = armature
            return
    modifier = obj.modifiers.new(name="Armature", type="ARMATURE")
    modifier.object = armature


def v471_scalp_hair(armature, material):
    # Darker light-brown so the short cut remains readable against skin in the
    # real mobile camera. The shape is deliberately low-profile, not a helmet.
    bsdf = material.node_tree.nodes.get("Principled BSDF") if material.use_nodes else None
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (0.12, 0.07, 0.032, 1.0)
        bsdf.inputs["Roughness"].default_value = 0.90

    vertices = []
    faces = []

    # Main short crown: flattened oval, extending down the back/sides.
    # A second shallow front volume gives a natural cropped front rather than
    # the perfectly spherical V46 hair-cap silhouette.
    _ellipsoid_mesh(
        vertices,
        faces,
        centre=(0.0, 0.012, 1.775),
        radii=(0.105, 0.100, 0.118),
        rings=9,
        segments=24,
        top_fraction=0.60,
    )
    _ellipsoid_mesh(
        vertices,
        faces,
        centre=(0.0, -0.052, 1.805),
        radii=(0.092, 0.055, 0.072),
        rings=7,
        segments=20,
        top_fraction=0.54,
    )

    mesh = bpy.data.meshes.new("Viktor_Hair_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    for polygon in mesh.polygons:
        polygon.use_smooth = True

    hair = bpy.data.objects.new("Viktor_Hair", mesh)
    bpy.context.collection.objects.link(hair)
    hair.data.materials.append(material)
    hair.parent = armature
    _ensure_armature_modifier(hair, armature)
    group = hair.vertex_groups.new(name="Head")
    group.add(list(range(len(vertices))), 1.0, "REPLACE")
    hair["football_lab_attachment"] = "cropped-light-brown-volume"
    hair["football_lab_skinning"] = "Head:1.0"
    hair["football_lab_art_revision"] = "V47.1"
    return hair


def v471_boot_geometry(boots):
    armature = bpy.data.objects.get("FL_HUMANOID_V1")
    if armature is None:
        raise RuntimeError("V47.1 armature missing while rebuilding boots")

    vertices = []
    faces = []
    ranges = []

    # One deterministic rounded boot per foot. The dimensions are deliberately
    # smaller than V46 while fully enclosing the anatomical foot so no bare-foot
    # skin can show through at the normal rear camera angle.
    for side, x in (("LeftFoot", 0.105), ("RightFoot", -0.105)):
        start, end = _ellipsoid_mesh(
            vertices,
            faces,
            centre=(x, -0.135, 0.074),
            radii=(0.092, 0.165, 0.072),
            rings=8,
            segments=18,
            top_fraction=1.0,
        )
        ranges.append((side, start, end))

    mesh = bpy.data.meshes.new("Viktor_Boots_Mesh_V47_1")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    for polygon in mesh.polygons:
        polygon.use_smooth = True

    boots.data = mesh
    boots.parent = armature
    _ensure_armature_modifier(boots, armature)
    boots.vertex_groups.clear()
    for bone_name, start, end in ranges:
        group = boots.vertex_groups.new(name=bone_name)
        group.add(list(range(start, end)), 1.0, "REPLACE")

    boots["football_lab_attachment"] = "deterministic-football-boots"
    boots["football_lab_skinning"] = "foot-bone-rigid"
    boots["football_lab_art_revision"] = "V47.1"
    return boots


# The V47 functions resolve these helpers through their shared globals dict, so
# replacing the entries here upgrades hair/boots without duplicating the proven
# shirt, shorts, socks, rig or strike-animation authoring logic.
namespace["_create_scalp_hair"] = v471_scalp_hair
namespace["_refine_boot_shape"] = v471_boot_geometry
namespace["striker_normalise_body"] = v471_normalise_body
builder.normalise_body = v471_normalise_body

builder.main()
