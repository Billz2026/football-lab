"""Run the Viktor V46 authoring module with the corrected rigid hair skin.

The first technical export proved the body/rig/animations were valid, but a
bone-parented hair object inherited the head translation on top of world-space
hair coordinates. That made the imported asset bounds ~3.48 m tall. The hair
is now kept in armature/world space and weighted 100% to the Head bone through
an Armature modifier, so it deforms with the head without double translation.
"""

import importlib.util
import os

import bpy
from mathutils import Vector


MODULE_PATH = os.path.join(os.path.dirname(__file__), "build-viktor-v46.py")
spec = importlib.util.spec_from_file_location("football_lab_viktor_builder", MODULE_PATH)
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


def corrected_add_hair(armature):
    hair_mat = builder.make_material("VIKTOR_Hair", (0.30, 0.23, 0.12), 0.76)
    verts = []
    faces = []
    rings = 7
    segments = 28
    centre = Vector((0, -0.012, 1.705))
    rx, ry, rz = 0.108, 0.098, 0.132

    for ring in range(rings + 1):
        theta = (ring / rings) * 1.18
        for segment in range(segments):
            phi = 2 * builder.math.pi * segment / segments
            # Slightly irregular silhouette so the cap reads as short textured hair
            # rather than a perfect helmet at normal gameplay distance.
            texture = 1.0 + 0.035 * builder.math.sin(phi * 5.0 + ring * 0.7)
            verts.append((
                centre.x + rx * texture * builder.math.sin(theta) * builder.math.cos(phi),
                centre.y + ry * texture * builder.math.sin(theta) * builder.math.sin(phi),
                centre.z + rz * texture * builder.math.cos(theta),
            ))

    for ring in range(rings):
        for segment in range(segments):
            a = ring * segments + segment
            b = ring * segments + (segment + 1) % segments
            c = (ring + 1) * segments + (segment + 1) % segments
            d = (ring + 1) * segments + segment
            faces.append((a, b, c, d))

    mesh = bpy.data.meshes.new("Viktor_Hair_Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()

    hair = bpy.data.objects.new("Viktor_Hair", mesh)
    bpy.context.collection.objects.link(hair)
    hair.data.materials.append(hair_mat)

    # Do not bone-parent world-space geometry. A full Head vertex group plus an
    # Armature modifier gives correct rigid head following without adding the
    # head-bone translation twice.
    head_group = hair.vertex_groups.new(name="Head")
    head_group.add(list(range(len(mesh.vertices))), 1.0, "REPLACE")
    armature_modifier = hair.modifiers.new(name="FL_Hair_Skin", type="ARMATURE")
    armature_modifier.object = armature
    armature_modifier.use_vertex_groups = True

    hair["football_lab_attachment"] = "head-hair"
    hair["football_lab_skinning"] = "head-bone-100pct"
    return hair


builder.add_hair = corrected_add_hair
builder.main()
