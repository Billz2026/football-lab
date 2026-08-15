"""Run the Viktor V46 authoring module with production-clean source transforms.

The Blender Studio asset bundle lays its catalogue meshes out in world space and
keeps modelling helpers/modifiers on the source objects. Football Lab needs a
single character centred on the origin before skinning, otherwise those library
layout transforms get baked into the GLB and the rig is metres away from the
body.
"""

import importlib.util
import os

import bpy
from mathutils import Vector

MODULE_PATH = os.path.join(os.path.dirname(__file__), "build-viktor-v46.py")
spec = importlib.util.spec_from_file_location("football_lab_viktor_builder", MODULE_PATH)
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


def clean_isolate_body(source):
    bpy.ops.object.select_all(action="DESELECT")
    source.hide_set(False)
    source.hide_viewport = False
    source.hide_render = False
    source.select_set(True)
    bpy.context.view_layer.objects.active = source
    bpy.ops.object.duplicate()

    body = bpy.context.active_object
    body.name = "Viktor_Kane_Body"
    body.data = body.data.copy()

    # Preserve the current visible object transform while severing any asset
    # catalogue hierarchy. The subsequent normaliser deliberately removes the
    # library-grid translation and grounds the body at Football Lab origin.
    world_matrix = body.matrix_world.copy()
    body.parent = None
    body.matrix_world = world_matrix

    # Source modelling modifiers/drivers are authoring helpers, not runtime
    # character data. Leaving them attached can pull hidden dependency meshes
    # into the export and makes automatic skinning non-deterministic.
    for modifier in list(body.modifiers):
        body.modifiers.remove(modifier)
    for constraint in list(body.constraints):
        body.constraints.remove(constraint)
    if body.animation_data:
        body.animation_data_clear()
    if body.data.animation_data:
        body.data.animation_data_clear()

    if body.data.shape_keys:
        try:
            bpy.context.view_layer.objects.active = body
            body.select_set(True)
            bpy.ops.object.shape_key_remove(all=True, apply_mix=True)
        except Exception as exc:
            print("VIKTOR_SHAPEKEY_CLEAN_WARNING", repr(exc))

    # Delete every other source-library object. Production GLB ownership starts
    # from this clean mesh; the Football Lab armature and hair are added later.
    for obj in list(bpy.data.objects):
        if obj is not body:
            bpy.data.objects.remove(obj, do_unlink=True)

    print(
        "VIKTOR_SOURCE_CLEAN",
        body.name,
        "location=", tuple(round(v, 5) for v in body.location),
        "rotation=", tuple(round(v, 5) for v in body.rotation_euler),
        "scale=", tuple(round(v, 5) for v in body.scale),
    )
    return body


def clean_normalise_body(body):
    bpy.ops.object.select_all(action="DESELECT")
    body.select_set(True)
    bpy.context.view_layer.objects.active = body

    # Bake source rotation/scale but not its catalogue position yet.
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    minimum, maximum = builder.mesh_world_bounds(body)
    source_height = maximum.z - minimum.z
    if source_height <= 0.1:
        raise RuntimeError(f"Invalid Viktor source height {source_height}")

    uniform_scale = builder.TARGET_HEIGHT / source_height
    body.scale = (uniform_scale, uniform_scale, uniform_scale)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    minimum, maximum = builder.mesh_world_bounds(body)
    centre_x = (minimum.x + maximum.x) * 0.5
    centre_y = (minimum.y + maximum.y) * 0.5
    body.location.x -= centre_x
    body.location.y -= centre_y
    body.location.z -= minimum.z
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)

    # Football-specific mass pass. Width/depth only: target height and ground
    # contact remain invariant.
    minimum, maximum = builder.mesh_world_bounds(body)
    height = maximum.z - minimum.z
    for vertex in body.data.vertices:
        z = (vertex.co.z - minimum.z) / max(height, 1e-6)
        width = 1.0
        depth = 1.0
        if 0.56 <= z <= 0.78:
            width, depth = 1.085, 1.055
        elif 0.47 <= z < 0.56:
            width, depth = 1.035, 1.045
        elif 0.28 <= z < 0.47:
            width, depth = 1.07, 1.07
        elif 0.09 <= z < 0.28:
            width, depth = 1.045, 1.045
        vertex.co.x *= width
        vertex.co.y *= depth
    body.data.update()

    minimum, maximum = builder.mesh_world_bounds(body)
    final_height = maximum.z - minimum.z
    centre = (minimum + maximum) * 0.5
    print(
        "VIKTOR_NORMALISED",
        "min=", tuple(round(v, 5) for v in minimum),
        "max=", tuple(round(v, 5) for v in maximum),
        "centre=", tuple(round(v, 5) for v in centre),
        "height=", round(final_height, 5),
    )
    if abs(final_height - builder.TARGET_HEIGHT) > 0.01:
        raise RuntimeError(f"Viktor height drifted during normalisation: {final_height}")
    if abs(centre.x) > 0.03 or abs(centre.y) > 0.03 or abs(minimum.z) > 0.01:
        raise RuntimeError(
            f"Viktor origin normalisation failed: centre=({centre.x:.3f},{centre.y:.3f}), ground={minimum.z:.3f}"
        )
    return body


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

    head_group = hair.vertex_groups.new(name="Head")
    head_group.add(list(range(len(mesh.vertices))), 1.0, "REPLACE")
    armature_modifier = hair.modifiers.new(name="FL_Hair_Skin", type="ARMATURE")
    armature_modifier.object = armature
    armature_modifier.use_vertex_groups = True

    hair["football_lab_attachment"] = "head-hair"
    hair["football_lab_skinning"] = "head-bone-100pct"
    return hair


def guarded_export_glb(path):
    # Nothing except the authored character is allowed into production export.
    allowed = {"Viktor_Kane_Body", "Viktor_Hair", "FL_HUMANOID_V1"}
    for obj in list(bpy.data.objects):
        if obj.name not in allowed:
            print("VIKTOR_EXPORT_PRUNE", obj.name, obj.type)
            bpy.data.objects.remove(obj, do_unlink=True)

    meshes = [obj for obj in bpy.data.objects if obj.type == "MESH"]
    armatures = [obj for obj in bpy.data.objects if obj.type == "ARMATURE"]
    if {obj.name for obj in meshes} != {"Viktor_Kane_Body", "Viktor_Hair"}:
        raise RuntimeError(f"Unexpected Viktor export meshes: {[obj.name for obj in meshes]}")
    if [obj.name for obj in armatures] != ["FL_HUMANOID_V1"]:
        raise RuntimeError(f"Unexpected Viktor export armatures: {[obj.name for obj in armatures]}")

    builder_original_export(path)


builder_original_export = builder.export_glb
builder.isolate_body = clean_isolate_body
builder.normalise_body = clean_normalise_body
builder.add_hair = corrected_add_hair
builder.export_glb = guarded_export_glb
builder.main()
