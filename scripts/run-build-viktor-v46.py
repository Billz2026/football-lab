"""Production authoring wrapper for Viktor Kane V46.

This wrapper keeps the validated Blender Studio CC0 realistic male body/rig
pipeline, but replaces the first-pass painted-on kit with separate skinned
football garment shells. The goal is a cleaner human silhouette at gameplay
scale without changing Football Lab physics or the animation contract.
"""

import importlib.util
import os

import bmesh
import bpy
from mathutils import Vector

MODULE_PATH = os.path.join(os.path.dirname(__file__), "build-viktor-v46.py")
spec = importlib.util.spec_from_file_location("football_lab_viktor_builder", MODULE_PATH)
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)

KIT_MESHES = {
    "Viktor_Shirt",
    "Viktor_Sleeves_Navy",
    "Viktor_Shorts",
    "Viktor_Socks",
    "Viktor_Boots",
}


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

    world_matrix = body.matrix_world.copy()
    body.parent = None
    body.matrix_world = world_matrix

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


def skin_only_material(body):
    body.data.materials.clear()
    skin = builder.make_material("VIKTOR_Skin", (0.62, 0.43, 0.33), 0.72)
    body.data.materials.append(skin)
    for polygon in body.data.polygons:
        polygon.material_index = 0
    body.data.update()


def _face_centre(face):
    count = max(1, len(face.verts))
    return Vector((
        sum(v.co.x for v in face.verts) / count,
        sum(v.co.y for v in face.verts) / count,
        sum(v.co.z for v in face.verts) / count,
    ))


def _shell_from_body(name, predicate, material, outward=0.008, min_z=None):
    body = bpy.data.objects.get("Viktor_Kane_Body")
    if body is None:
        raise RuntimeError("Viktor body missing while creating kit shell")

    shell = body.copy()
    shell.data = body.data.copy()
    shell.name = name
    shell.data.name = f"{name}_Mesh"
    bpy.context.collection.objects.link(shell)

    shell.data.materials.clear()
    shell.data.materials.append(material)
    for polygon in shell.data.polygons:
        polygon.material_index = 0

    bm = bmesh.new()
    bm.from_mesh(shell.data)
    bm.normal_update()

    remove_faces = [face for face in bm.faces if not predicate(_face_centre(face))]
    if remove_faces:
        bmesh.ops.delete(bm, geom=remove_faces, context="FACES")
    loose_edges = [edge for edge in bm.edges if not edge.link_faces]
    if loose_edges:
        bmesh.ops.delete(bm, geom=loose_edges, context="EDGES")
    loose_verts = [vertex for vertex in bm.verts if not vertex.link_faces]
    if loose_verts:
        bmesh.ops.delete(bm, geom=loose_verts, context="VERTS")

    bm.normal_update()
    for vertex in bm.verts:
        vertex.co += vertex.normal * outward
        if min_z is not None and vertex.co.z < min_z:
            vertex.co.z = min_z
    bm.to_mesh(shell.data)
    bm.free()
    shell.data.update()

    if not shell.data.polygons:
        raise RuntimeError(f"Kit shell {name} has no faces")
    shell["football_lab_kit_shell"] = True
    return shell


def _create_football_kit():
    white = builder.make_material("VIKTOR_Kit_White", (0.90, 0.925, 0.95), 0.62)
    navy = builder.make_material("VIKTOR_Kit_Navy", (0.018, 0.045, 0.09), 0.58)
    navy_accent = builder.make_material("VIKTOR_Sleeve_Navy", (0.022, 0.058, 0.12), 0.56)
    sock_white = builder.make_material("VIKTOR_Sock_White", (0.87, 0.90, 0.92), 0.66)
    boot_black = builder.make_material("VIKTOR_Boot_Black", (0.012, 0.016, 0.022), 0.43)

    def shirt(p):
        z = p.z
        x = abs(p.x)
        torso = 0.96 <= z <= 1.48 and x <= 0.31
        upper_arm = 1.18 <= z <= 1.46 and 0.25 <= x <= 0.50
        neck_hole = z >= 1.425 and x <= 0.115
        return (torso or upper_arm) and not neck_hole

    def sleeves(p):
        return 1.19 <= p.z <= 1.46 and 0.255 <= abs(p.x) <= 0.49

    def shorts(p):
        return 0.70 <= p.z <= 1.015 and abs(p.x) <= 0.285

    def socks(p):
        return 0.12 <= p.z <= 0.49 and abs(p.x) <= 0.18

    def boots(p):
        return p.z <= 0.155 and abs(p.x) <= 0.22

    _shell_from_body("Viktor_Shirt", shirt, white, outward=0.009)
    _shell_from_body("Viktor_Sleeves_Navy", sleeves, navy_accent, outward=0.012)
    _shell_from_body("Viktor_Shorts", shorts, navy, outward=0.010)
    _shell_from_body("Viktor_Socks", socks, sock_white, outward=0.008)
    _shell_from_body("Viktor_Boots", boots, boot_black, outward=0.010, min_z=0.002)


def corrected_add_hair(armature):
    _create_football_kit()

    hair_mat = builder.make_material("VIKTOR_Hair", (0.34, 0.25, 0.13), 0.78)
    verts = []
    faces = []
    rings = 9
    segments = 32
    centre = Vector((0, -0.006, 1.785))
    rx, ry, rz = 0.117, 0.107, 0.095

    for ring in range(rings + 1):
        theta = (ring / rings) * 1.40
        for segment in range(segments):
            phi = 2 * builder.math.pi * segment / segments
            texture = 1.0 + 0.028 * builder.math.sin(phi * 7.0 + ring * 0.85)
            verts.append((
                centre.x + rx * texture * builder.math.sin(theta) * builder.math.cos(phi),
                centre.y + ry * texture * builder.math.sin(theta) * builder.math.sin(phi),
                min(1.879, centre.z + rz * texture * builder.math.cos(theta)),
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
    allowed = {"Viktor_Kane_Body", "Viktor_Hair", "FL_HUMANOID_V1", *KIT_MESHES}
    for obj in list(bpy.data.objects):
        if obj.name not in allowed:
            print("VIKTOR_EXPORT_PRUNE", obj.name, obj.type)
            bpy.data.objects.remove(obj, do_unlink=True)

    meshes = [obj for obj in bpy.data.objects if obj.type == "MESH"]
    armatures = [obj for obj in bpy.data.objects if obj.type == "ARMATURE"]
    expected_meshes = {"Viktor_Kane_Body", "Viktor_Hair", *KIT_MESHES}
    if {obj.name for obj in meshes} != expected_meshes:
        raise RuntimeError(f"Unexpected Viktor export meshes: {[obj.name for obj in meshes]}")
    if [obj.name for obj in armatures] != ["FL_HUMANOID_V1"]:
        raise RuntimeError(f"Unexpected Viktor export armatures: {[obj.name for obj in armatures]}")

    builder_original_export(path)


builder_original_export = builder.export_glb
builder.isolate_body = clean_isolate_body
builder.normalise_body = clean_normalise_body
builder.assign_kit_materials = skin_only_material
builder.add_hair = corrected_add_hair
builder.export_glb = guarded_export_glb
builder.main()
