"""Football Lab V47 Viktor Kane art rebuild.

V46 proved the production skinned-GLB runtime. V47 keeps that technical contract
and the accepted strike clips, but rebuilds Viktor's visual read around the
actual gameplay camera: tall elite English striker, lean athletic mass, mature
head silhouette, short light-brown hair that follows the scalp, restrained PBR
materials and separate fitted football kit surfaces.

This is an original Football Lab character. The visual brief is archetypal
rather than a likeness copy of any real person.
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

TARGET_HEIGHT = 1.88
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
            print("V47_SHAPEKEY_CLEAN_WARNING", repr(exc))

    for obj in list(bpy.data.objects):
        if obj is not body:
            bpy.data.objects.remove(obj, do_unlink=True)
    return body


def _recenter_and_ground(body):
    minimum, maximum = builder.mesh_world_bounds(body)
    body.location.x -= (minimum.x + maximum.x) * 0.5
    body.location.y -= (minimum.y + maximum.y) * 0.5
    body.location.z -= minimum.z
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)


def striker_normalise_body(body):
    bpy.ops.object.select_all(action="DESELECT")
    body.select_set(True)
    bpy.context.view_layer.objects.active = body
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)

    minimum, maximum = builder.mesh_world_bounds(body)
    source_height = maximum.z - minimum.z
    if source_height <= 0.1:
        raise RuntimeError(f"Invalid Viktor source height {source_height}")

    scale = TARGET_HEIGHT / source_height
    body.scale = (scale, scale, scale)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    _recenter_and_ground(body)

    minimum, maximum = builder.mesh_world_bounds(body)
    height = maximum.z - minimum.z

    # V47 silhouette pass. V46 was too broad through the waist/thighs and read
    # as a stocky generic avatar. Keep footballer mass, but create a cleaner
    # 1.88 m centre-forward silhouette: narrow waist, controlled shoulders,
    # athletic thighs/calves and a slightly longer/narrower head read.
    for vertex in body.data.vertices:
        z = (vertex.co.z - minimum.z) / max(height, 1e-6)
        x = vertex.co.x
        y = vertex.co.y

        width = 1.0
        depth = 1.0
        if z < 0.06:          # feet
            width, depth = 0.96, 0.93
        elif z < 0.285:       # calves
            width, depth = 0.985, 0.985
        elif z < 0.47:        # thighs
            width, depth = 1.018, 1.025
        elif z < 0.57:        # pelvis / waist
            width, depth = 0.975, 0.995
        elif z < 0.70:        # lower torso / ribs
            width, depth = 1.012, 1.010
        elif z < 0.79:        # upper chest / shoulder girdle
            width, depth = 1.035, 1.020
        elif z < 0.825:       # neck transition
            width, depth = 0.985, 1.005
        else:                 # head: less round, slightly deeper mature profile
            width, depth = 0.955, 1.025

        vertex.co.x = x * width
        vertex.co.y = y * depth

        # Reduce the oversized hand read from gameplay distance while retaining
        # the original anatomical topology and skinning compatibility.
        if 0.56 <= z <= 0.72 and abs(vertex.co.x) > 0.59:
            side = 1.0 if vertex.co.x > 0 else -1.0
            wrist_x = side * 0.59
            vertex.co.x = wrist_x + (vertex.co.x - wrist_x) * 0.82
            hand_centre_z = 1.205
            vertex.co.z = hand_centre_z + (vertex.co.z - hand_centre_z) * 0.88
            vertex.co.y *= 0.90

        # Define the lower jaw/chin more strongly without trying to copy a
        # specific real person's face. This only affects the mature silhouette.
        if 0.815 <= z < 0.875:
            vertex.co.x *= 0.975
            if vertex.co.y < -0.015:
                vertex.co.y *= 1.018

    body.data.update()

    # One applied subdivision level removes the angular/toy silhouette seen on
    # mobile while keeping the production GLB comfortably inside its file cap.
    try:
        modifier = body.modifiers.new(name="V47_Silhouette_Subdivision", type="SUBSURF")
        modifier.subdivision_type = "CATMULL_CLARK"
        modifier.levels = 1
        modifier.render_levels = 1
        bpy.context.view_layer.objects.active = body
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    except Exception as exc:
        print("V47_SUBDIVISION_WARNING", repr(exc))

    for polygon in body.data.polygons:
        polygon.use_smooth = True
    body.data.update()

    # Subdivision can move extremities by a few millimetres. Re-normalise to
    # the exact contract after smoothing.
    minimum, maximum = builder.mesh_world_bounds(body)
    final_height = maximum.z - minimum.z
    if final_height <= 0.1:
        raise RuntimeError("V47 body collapsed during silhouette pass")
    body.scale = (TARGET_HEIGHT / final_height,) * 3
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    _recenter_and_ground(body)

    minimum, maximum = builder.mesh_world_bounds(body)
    final_height = maximum.z - minimum.z
    centre = (minimum + maximum) * 0.5
    if abs(final_height - TARGET_HEIGHT) > 0.008:
        raise RuntimeError(f"V47 Viktor height drifted: {final_height}")
    if abs(centre.x) > 0.03 or abs(centre.y) > 0.03 or abs(minimum.z) > 0.01:
        raise RuntimeError(
            f"V47 origin failed: centre=({centre.x:.3f},{centre.y:.3f}), ground={minimum.z:.3f}"
        )

    body["football_lab_visual_archetype"] = "elite-english-striker"
    body["football_lab_art_revision"] = "V47"
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
    width = 256
    height = 256
    image = bpy.data.images.new("VIKTOR_V47_Skin_BaseColor", width=width, height=height, alpha=False)
    pixels = []
    # Neutral fair-light skin; less orange than V46 and intentionally restrained
    # at gameplay distance.
    base = (0.66, 0.455, 0.345)
    for y in range(height):
        v = y / max(1, height - 1)
        for x in range(width):
            u = x / max(1, width - 1)
            pore = (
                0.010 * math.sin(u * 83.0 + v * 41.0)
                + 0.006 * math.sin(u * 167.0 - v * 113.0)
                + 0.004 * math.cos(u * 47.0 + v * 137.0)
            )
            warm = 0.004 * math.sin(v * math.pi)
            pixels.extend((
                max(0.0, min(1.0, base[0] + pore + warm)),
                max(0.0, min(1.0, base[1] + pore * 0.70 + warm * 0.4)),
                max(0.0, min(1.0, base[2] + pore * 0.48)),
                1.0,
            ))
    image.pixels.foreach_set(pixels)
    image.pack()
    return image


def skin_only_material(body):
    _ensure_body_uv(body)
    body.data.materials.clear()

    skin = bpy.data.materials.new("VIKTOR_V47_Skin")
    skin.use_nodes = True
    nodes = skin.node_tree.nodes
    links = skin.node_tree.links
    nodes.clear()

    output = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    texture = nodes.new("ShaderNodeTexImage")
    texture.image = _make_skin_texture()
    texture.interpolation = "Linear"

    bsdf.inputs["Roughness"].default_value = 0.72
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.22
    if "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = 0.0

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


def _surface_shell(name, predicate, material, outward, smooth_factor=0.02, subdivide=False, min_z=None):
    body = bpy.data.objects.get("Viktor_Kane_Body")
    if body is None:
        raise RuntimeError("V47 Viktor body missing while creating garment surface")

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
        raise RuntimeError(f"V47 garment {name} has no faces")
    shell["football_lab_fitted_surface"] = True
    shell["football_lab_art_revision"] = "V47"
    return shell


def _refine_boot_shape(boots):
    # V46's foot shell looked oversized from the rear gameplay camera. Keep the
    # anatomical foot position but tighten the boot around each foot.
    for vertex in boots.data.vertices:
        side = 1.0 if vertex.co.x >= 0 else -1.0
        anchor_x = side * 0.105
        vertex.co.x = anchor_x + (vertex.co.x - anchor_x) * 0.93
        vertex.co.y *= 0.92
        vertex.co.z = 0.006 + (vertex.co.z - 0.006) * 0.94
        if vertex.co.z < 0.002:
            vertex.co.z = 0.002
    boots.data.update()


def _create_scalp_hair(armature, material):
    body = bpy.data.objects.get("Viktor_Kane_Body")
    if body is None:
        raise RuntimeError("V47 body missing while creating hair")

    # A close scalp-conforming shell replaces the V46 rounded hair cap. The
    # front hairline sits higher than the sides/back, producing a mature short
    # light-brown cut rather than a helmet/dome silhouette.
    def hairline(point):
        if point.z < 1.625:
            return False
        if point.y < -0.018:  # front of head
            threshold = 1.715 + min(0.035, abs(point.x) * 0.12)
        elif point.y > 0.035:  # back
            threshold = 1.635
        else:  # sides
            threshold = 1.655 + max(0.0, 0.055 - abs(point.x)) * 0.18
        return point.z >= threshold

    hair = _surface_shell(
        "Viktor_Hair",
        hairline,
        material,
        outward=0.0075,
        smooth_factor=0.012,
        subdivide=False,
    )
    hair["football_lab_attachment"] = "scalp-conforming-short-light-brown-hair"
    hair["football_lab_skinning"] = "inherited-head-skinning"
    return hair


def create_v47_kit_and_hair(armature):
    # Cloth is deliberately more matte than V46. The legacy object name
    # Viktor_Sleeves_Navy is retained for the production verifier, but the
    # sleeves are now clean white to avoid the toy-like blue-arm read.
    shirt_white = builder.make_material("VIKTOR_V47_Shirt_White", (0.94, 0.95, 0.955), 0.79)
    sleeve_white = builder.make_material("VIKTOR_V47_Sleeve_White", (0.925, 0.94, 0.95), 0.80)
    shorts_navy = builder.make_material("VIKTOR_V47_Shorts_Navy", (0.018, 0.035, 0.075), 0.74)
    socks_white = builder.make_material("VIKTOR_V47_Socks_White", (0.91, 0.925, 0.935), 0.82)
    boots_black = builder.make_material("VIKTOR_V47_Boots_Black", (0.008, 0.010, 0.014), 0.46)
    hair_brown = builder.make_material("VIKTOR_V47_Hair_LightBrown", (0.24, 0.16, 0.085), 0.88)

    def shirt(point):
        if not 0.965 <= point.z <= 1.545:
            return False
        # Narrower waist, broader chest: garment silhouette follows a real
        # fitted football shirt instead of a rectangular torso cut.
        t = max(0.0, min(1.0, (point.z - 0.965) / (1.545 - 0.965)))
        limit = 0.34 + 0.20 * (t ** 0.75)
        return abs(point.x) <= limit

    def sleeves(point):
        return 1.18 <= point.z <= 1.475 and 0.27 <= abs(point.x) <= 0.565

    def shorts(point):
        return 0.685 <= point.z <= 1.015 and abs(point.x) <= 0.37

    def socks(point):
        return 0.105 <= point.z <= 0.505

    def boots(point):
        return point.z <= 0.168

    _surface_shell("Viktor_Shirt", shirt, shirt_white, outward=0.018, smooth_factor=0.02, subdivide=False)
    _surface_shell("Viktor_Sleeves_Navy", sleeves, sleeve_white, outward=0.014, smooth_factor=0.018, subdivide=False)
    _surface_shell("Viktor_Shorts", shorts, shorts_navy, outward=0.016, smooth_factor=0.018, subdivide=False)
    _surface_shell("Viktor_Socks", socks, socks_white, outward=0.008, smooth_factor=0.012, subdivide=False)
    boot_shell = _surface_shell("Viktor_Boots", boots, boots_black, outward=0.006, smooth_factor=0.010, subdivide=False, min_z=0.002)
    _refine_boot_shape(boot_shell)
    return _create_scalp_hair(armature, hair_brown)


def create_v47_animations(armature):
    # Keep the accepted V46 approach/plant/strike mechanics. Only refine the
    # idle presentation so the model reads less like a mannequin before input.
    actions = original_create_animations(armature)
    idle = bpy.data.actions.get("idle")
    if idle is not None:
        armature.animation_data.action = idle
        builder.pose_key(
            armature,
            1,
            {
                "Chest": (2.4, 0.0, 0.0),
                "Hips": (-1.0, 0.0, 0.0),
                "LeftUpperArm": (6.0, -2.0, -4.5),
                "RightUpperArm": (-6.0, 2.0, 4.5),
                "LeftLowerArm": (8.0, 0.0, 0.0),
                "RightLowerArm": (-8.0, 0.0, 0.0),
            },
            {},
        )
        builder.pose_key(
            armature,
            12,
            {
                "Chest": (3.0, 0.0, 0.4),
                "Hips": (-1.2, 0.0, -0.3),
                "LeftUpperArm": (6.5, -2.0, -4.0),
                "RightUpperArm": (-6.5, 2.0, 4.0),
                "LeftLowerArm": (9.0, 0.0, 0.0),
                "RightLowerArm": (-9.0, 0.0, 0.0),
            },
            {},
        )
        builder.pose_key(
            armature,
            24,
            {
                "Chest": (2.4, 0.0, 0.0),
                "Hips": (-1.0, 0.0, 0.0),
                "LeftUpperArm": (6.0, -2.0, -4.5),
                "RightUpperArm": (-6.0, 2.0, 4.5),
                "LeftLowerArm": (8.0, 0.0, 0.0),
                "RightLowerArm": (-8.0, 0.0, 0.0),
            },
            {},
        )
        armature.animation_data.action = idle
    return actions


def add_v47_metadata(body, armature):
    original_add_metadata(body, armature)
    body["football_lab_build"] = "47.0.0"
    body["football_lab_character"] = "viktor-kane"
    body["football_lab_visual_archetype"] = "elite-english-striker"
    body["football_lab_art_revision"] = "V47"
    armature["football_lab_build"] = "47.0.0"
    armature["football_lab_art_revision"] = "V47"


def guarded_export_glb(path):
    allowed = {"Viktor_Kane_Body", "Viktor_Hair", "FL_HUMANOID_V1", *KIT_MESHES}
    for obj in list(bpy.data.objects):
        if obj.name not in allowed:
            print("V47_EXPORT_PRUNE", obj.name, obj.type)
            bpy.data.objects.remove(obj, do_unlink=True)

    meshes = [obj for obj in bpy.data.objects if obj.type == "MESH"]
    armatures = [obj for obj in bpy.data.objects if obj.type == "ARMATURE"]
    expected_meshes = {"Viktor_Kane_Body", "Viktor_Hair", *KIT_MESHES}
    if {obj.name for obj in meshes} != expected_meshes:
        raise RuntimeError(f"Unexpected V47 Viktor export meshes: {[obj.name for obj in meshes]}")
    if [obj.name for obj in armatures] != ["FL_HUMANOID_V1"]:
        raise RuntimeError(f"Unexpected V47 armatures: {[obj.name for obj in armatures]}")

    for mesh in meshes:
        if mesh.find_armature() is None and not any(mod.type == "ARMATURE" for mod in mesh.modifiers):
            raise RuntimeError(f"V47 mesh lost skinning: {mesh.name}")

    original_export(path)


original_create_animations = builder.create_animations
original_add_metadata = builder.add_metadata
original_export = builder.export_glb

builder.isolate_body = clean_isolate_body
builder.normalise_body = striker_normalise_body
builder.assign_kit_materials = skin_only_material
builder.add_hair = create_v47_kit_and_hair
builder.create_animations = create_v47_animations
builder.add_metadata = add_v47_metadata
builder.export_glb = guarded_export_glb
builder.main()
