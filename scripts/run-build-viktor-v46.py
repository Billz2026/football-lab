"""Production authoring wrapper for Viktor Kane V46.

This pass keeps the validated realistic male body, FL_HUMANOID_V1 rig and seven
football clips, while fixing the two remaining gameplay-camera defects:
1) flat/plastic skin, by embedding a subtle UV skin base-colour texture and
   physically restrained rough/specular response into the GLB; and
2) bald-looking hair, by replacing the painted scalp shell with an actual
   short, skinned, irregular blond hair volume weighted 100% to the Head bone.
"""

import importlib.util
import math
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

    scale = builder.TARGET_HEIGHT / source_height
    body.scale = (scale, scale, scale)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    minimum, maximum = builder.mesh_world_bounds(body)
    body.location.x -= (minimum.x + maximum.x) * 0.5
    body.location.y -= (minimum.y + maximum.y) * 0.5
    body.location.z -= minimum.z
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)

    minimum, maximum = builder.mesh_world_bounds(body)
    height = maximum.z - minimum.z
    for vertex in body.data.vertices:
        z = (vertex.co.z - minimum.z) / max(height, 1e-6)
        width = depth = 1.0
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
    if abs(final_height - builder.TARGET_HEIGHT) > 0.01:
        raise RuntimeError(f"Viktor height drifted during normalisation: {final_height}")
    if abs(centre.x) > 0.03 or abs(centre.y) > 0.03 or abs(minimum.z) > 0.01:
        raise RuntimeError(
            f"Viktor origin normalisation failed: centre=({centre.x:.3f},{centre.y:.3f}), ground={minimum.z:.3f}"
        )
    return body


def _ensure_body_uv(body):
    if body.data.uv_layers:
        return
    bpy.ops.object.select_all(action="DESELECT")
    body.select_set(True)
    bpy.context.view_layer.objects.active = body
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=1.15192, island_margin=0.02)
    bpy.ops.object.mode_set(mode="OBJECT")


def _make_skin_texture():
    width = 128
    height = 128
    image = bpy.data.images.new("VIKTOR_Skin_BaseColor", width=width, height=height, alpha=False)
    pixels = []
    base = (0.57, 0.365, 0.255)
    for y in range(height):
        v = y / max(1, height - 1)
        for x in range(width):
            u = x / max(1, width - 1)
            # Very small deterministic variation: enough to stop the skin
            # reading as a single plastic colour at gameplay distance, but not
            # enough to look dirty/freckled or reveal UV seams.
            pore = (
                0.012 * math.sin(u * 91.0 + v * 37.0)
                + 0.008 * math.sin(u * 173.0 - v * 119.0)
                + 0.006 * math.cos(u * 53.0 + v * 149.0)
            )
            warm = 0.006 * math.sin(v * math.pi)
            r = max(0.0, min(1.0, base[0] + pore + warm))
            g = max(0.0, min(1.0, base[1] + pore * 0.72 + warm * 0.45))
            b = max(0.0, min(1.0, base[2] + pore * 0.55))
            pixels.extend((r, g, b, 1.0))
    image.pixels.foreach_set(pixels)
    image.pack()
    return image


def skin_only_material(body):
    _ensure_body_uv(body)
    body.data.materials.clear()

    skin = bpy.data.materials.new("VIKTOR_Skin")
    skin.use_nodes = True
    nodes = skin.node_tree.nodes
    links = skin.node_tree.links
    nodes.clear()

    output = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    texture = nodes.new("ShaderNodeTexImage")
    texture.image = _make_skin_texture()
    texture.interpolation = "Linear"

    bsdf.inputs["Roughness"].default_value = 0.66
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.28
    if "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = 0.015

    links.new(texture.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(bsdf.outputs["BSDF"], output.inputs["Surface"])

    body.data.materials.append(skin)
    for polygon in body.data.polygons:
        polygon.material_index = 0
    body.data.update()


def _face_centre(face):
    count = max(1, len(face.verts))
    return Vector((
        sum(vertex.co.x for vertex in face.verts) / count,
        sum(vertex.co.y for vertex in face.verts) / count,
        sum(vertex.co.z for vertex in face.verts) / count,
    ))


def _surface_shell(name, predicate, material, outward, smooth_factor=0.045, subdivide=False, min_z=None):
    body = bpy.data.objects.get("Viktor_Kane_Body")
    if body is None:
        raise RuntimeError("Viktor body missing while creating fitted surface")

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
    loose_vertices = [vertex for vertex in bm.verts if not vertex.link_faces]
    if loose_vertices:
        bmesh.ops.delete(bm, geom=loose_vertices, context="VERTS")

    if subdivide and bm.edges:
        bmesh.ops.subdivide_edges(bm, edges=list(bm.edges), cuts=1, use_grid_fill=True)

    bm.normal_update()
    if smooth_factor > 0 and bm.verts:
        bmesh.ops.smooth_vert(
            bm,
            verts=list(bm.verts),
            factor=smooth_factor,
            use_axis_x=True,
            use_axis_y=True,
            use_axis_z=True,
        )
        bm.normal_update()

    for vertex in bm.verts:
        vertex.co += vertex.normal * outward
        if min_z is not None and vertex.co.z < min_z:
            vertex.co.z = min_z

    bm.to_mesh(shell.data)
    bm.free()
    shell.data.update()
    for polygon in shell.data.polygons:
        polygon.use_smooth = True

    if not shell.data.polygons:
        raise RuntimeError(f"Fitted surface {name} has no faces")
    shell["football_lab_fitted_surface"] = True
    return shell


def _create_short_hair_volume(armature, material):
    # Short textured crop: the crown sits below Viktor's 1.880 m body-height
    # contract, while the back/sides reach lower than the front hairline.
    centre = Vector((0.0, -0.004, 1.785))
    radius_x = 0.118
    radius_y = 0.108
    radius_z = 0.094
    rings = 12
    segments = 40

    verts = [(centre.x, centre.y, 1.879)]
    faces = []

    for ring in range(1, rings + 1):
        fraction = ring / rings
        for segment in range(segments):
            phi = 2.0 * math.pi * segment / segments
            front = max(0.0, -math.sin(phi))
            back = max(0.0, math.sin(phi))
            theta_max = 2.03 + 0.13 * back - 0.24 * front + 0.035 * math.cos(phi * 2.0)
            theta = fraction * theta_max
            texture = (
                1.0
                + 0.020 * math.sin(phi * 9.0 + fraction * 8.0)
                + 0.009 * math.sin(phi * 19.0 - fraction * 5.0)
            )
            x = centre.x + radius_x * texture * math.sin(theta) * math.cos(phi)
            y = centre.y + radius_y * texture * math.sin(theta) * math.sin(phi)
            z = min(1.879, centre.z + radius_z * math.cos(theta))
            verts.append((x, y, z))

    # Crown fan.
    for segment in range(segments):
        b = 1 + segment
        c = 1 + (segment + 1) % segments
        faces.append((0, b, c))

    # Ring quads.
    for ring in range(rings - 1):
        row_a = 1 + ring * segments
        row_b = 1 + (ring + 1) * segments
        for segment in range(segments):
            a = row_a + segment
            b = row_a + (segment + 1) % segments
            c = row_b + (segment + 1) % segments
            d = row_b + segment
            faces.append((a, b, c, d))

    mesh = bpy.data.meshes.new("Viktor_Hair_Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    for polygon in mesh.polygons:
        polygon.use_smooth = True

    hair = bpy.data.objects.new("Viktor_Hair", mesh)
    bpy.context.collection.objects.link(hair)
    hair.data.materials.append(material)

    head_group = hair.vertex_groups.new(name="Head")
    head_group.add(list(range(len(mesh.vertices))), 1.0, "REPLACE")
    modifier = hair.modifiers.new(name="FL_Hair_Skin", type="ARMATURE")
    modifier.object = armature
    modifier.use_vertex_groups = True

    hair["football_lab_attachment"] = "skinned-short-blond-hair-volume"
    hair["football_lab_skinning"] = "head-bone-100pct"
    return hair


def create_fitted_kit_and_hair(armature):
    white = builder.make_material("VIKTOR_Kit_White", (0.91, 0.93, 0.95), 0.62)
    navy = builder.make_material("VIKTOR_Kit_Navy", (0.018, 0.045, 0.09), 0.57)
    sleeve_navy = builder.make_material("VIKTOR_Sleeve_Navy", (0.022, 0.060, 0.125), 0.55)
    sock_white = builder.make_material("VIKTOR_Sock_White", (0.88, 0.905, 0.925), 0.65)
    boot_black = builder.make_material("VIKTOR_Boot_Black", (0.010, 0.014, 0.020), 0.43)
    blond = builder.make_material("VIKTOR_Hair", (0.56, 0.39, 0.15), 0.84)

    def shirt(point):
        return 0.955 <= point.z <= 1.585 and abs(point.x) <= 0.555

    def sleeves(point):
        return 1.145 <= point.z <= 1.455 and 0.285 <= abs(point.x) <= 0.590

    def shorts(point):
        return 0.675 <= point.z <= 1.025 and abs(point.x) <= 0.38

    def socks(point):
        return 0.105 <= point.z <= 0.515

    def boots(point):
        return point.z <= 0.170

    _surface_shell("Viktor_Shirt", shirt, white, outward=0.012, smooth_factor=0.035, subdivide=True)
    _surface_shell("Viktor_Sleeves_Navy", sleeves, sleeve_navy, outward=0.020, smooth_factor=0.04, subdivide=True)
    _surface_shell("Viktor_Shorts", shorts, navy, outward=0.014, smooth_factor=0.035, subdivide=True)
    _surface_shell("Viktor_Socks", socks, sock_white, outward=0.012, smooth_factor=0.025, subdivide=True)
    _surface_shell("Viktor_Boots", boots, boot_black, outward=0.014, smooth_factor=0.018, subdivide=True, min_z=0.002)
    return _create_short_hair_volume(armature, blond)


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
builder.add_hair = create_fitted_kit_and_hair
builder.export_glb = guarded_export_glb
builder.main()
