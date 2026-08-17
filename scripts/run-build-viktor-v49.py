"""Football Lab Viktor V49 weighted-garment character rebuild.

V48 proved that repeated polygon-shell trimming cannot reach the requested lock
quality. V49 changes the construction method while preserving Viktor's proven
1.88 m proportions, FL_HUMANOID_V1 rig and seven canonical strike clips.

Key architecture:
- keep the accepted V48.4 body/head sculpt, fitted shirt, shorts, socks, hair,
  KANE 10 identity and animation set;
- replace triangle-cut sleeves with purpose-built clean upper-arm garment tubes;
- replace anatomical-foot boot shells with purpose-built football boot volumes;
- transfer skin weights from the nearest Viktor body surface to every new
  garment/boot vertex before armature deformation;
- tuck anatomical foot vertices inside the new shoes so bare toes cannot bleed
  through under any camera angle;
- add restrained eyeball/iris geometry joined into the authorised body mesh and
  weighted to Head, so Viktor no longer reads as an eyeless mannequin.

Viktor Kane remains an original Football Lab character: a tall, mature English
number-nine archetype, not a direct likeness of a real player.
"""

import math
import os

import bpy
from mathutils import Vector

BASE_PATH = os.path.join(os.path.dirname(__file__), "run-build-viktor-v48-4.py")
with open(BASE_PATH, "r", encoding="utf-8") as handle:
    source = handle.read()

marker = "builder.main()"
if marker not in source:
    raise RuntimeError("V48.4 builder entry point not found")

v484 = {
    "__file__": BASE_PATH,
    "__name__": "football_lab_v48_4_base",
}
exec(compile(source.rsplit(marker, 1)[0], BASE_PATH, "exec"), v484)

builder = v484["builder"]
v483 = v484["v483"]
v48_globals = v484["v48_globals"]
_material = v48_globals["_material"]
base_add_metadata = builder.add_metadata
base_create_surfaces = v483["create_v483_kit_hair_face"]


def _mesh_object(name, vertices, faces, material):
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    mesh.materials.append(material)
    for polygon in mesh.polygons:
        polygon.material_index = 0
        polygon.use_smooth = True
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj


def _transfer_body_weights(target, body, armature):
    # Create destination groups by name, then let Blender interpolate the
    # nearest body-surface skinning weights onto the new manufactured mesh.
    for source_group in body.vertex_groups:
        if target.vertex_groups.get(source_group.name) is None:
            target.vertex_groups.new(name=source_group.name)

    transfer = target.modifiers.new(name="V49_WeightTransfer", type="DATA_TRANSFER")
    transfer.object = body
    transfer.use_vert_data = True
    transfer.data_types_verts = {"VGROUP_WEIGHTS"}
    transfer.vert_mapping = "POLYINTERP_NEAREST"
    transfer.layers_vgroup_select_src = "ALL"
    transfer.layers_vgroup_select_dst = "NAME"
    transfer.mix_mode = "REPLACE"
    transfer.mix_factor = 1.0

    bpy.ops.object.select_all(action="DESELECT")
    target.select_set(True)
    bpy.context.view_layer.objects.active = target
    bpy.ops.object.modifier_apply(modifier=transfer.name)

    # Guard against silent transfer failure before adding the armature.
    missing = []
    for vertex in target.data.vertices:
        total = sum(item.weight for item in vertex.groups)
        if total < 0.01:
            missing.append(vertex.index)
    if missing:
        raise RuntimeError(
            f"V49 weight transfer failed on {target.name}: {len(missing)} unweighted vertices; "
            f"sample={missing[:12]}"
        )

    modifier = target.modifiers.new(name="V49_Armature", type="ARMATURE")
    modifier.object = armature
    target.parent = armature
    target["football_lab_skinning"] = "nearest-body-weight-transfer"
    return target


def _arm_frame(side):
    shoulder = Vector((side * 0.19, 0.0, 1.42))
    elbow = Vector((side * 0.47, 0.0, 1.34))
    axis = (elbow - shoulder).normalized()
    depth_axis = Vector((0.0, 1.0, 0.0))
    vertical_axis = axis.cross(depth_axis).normalized()
    return shoulder, elbow, axis, depth_axis, vertical_axis


def _clean_sleeves(body, armature):
    vertices = []
    faces = []
    segments = 24
    ring_ts = (-0.10, 0.10, 0.35, 0.62, 0.70)

    for side in (1.0, -1.0):
        shoulder, elbow, axis, depth_axis, vertical_axis = _arm_frame(side)
        length = (elbow - shoulder).length
        start = len(vertices)
        for ring_index, t in enumerate(ring_ts):
            # Football sleeve: broad at shoulder, clean taper to the upper-arm cuff.
            blend = max(0.0, min(1.0, (t + 0.10) / 0.80))
            radius_depth = 0.101 * (1.0 - blend) + 0.083 * blend
            radius_vertical = 0.108 * (1.0 - blend) + 0.087 * blend
            centre = shoulder + axis * (t * length)
            for section in range(segments):
                angle = 2.0 * math.pi * section / segments
                point = (
                    centre
                    + depth_axis * (math.cos(angle) * radius_depth)
                    + vertical_axis * (math.sin(angle) * radius_vertical)
                )
                vertices.append(tuple(point))

        rings = len(ring_ts)
        for ring in range(rings - 1):
            for section in range(segments):
                nxt = (section + 1) % segments
                a = start + ring * segments + section
                b = start + ring * segments + nxt
                c = start + (ring + 1) * segments + nxt
                d = start + (ring + 1) * segments + section
                faces.append((a, b, c, d))

    material = _material("VIKTOR_V49_Sleeves", (0.79, 0.815, 0.835), 0.69)
    sleeves = _mesh_object("Viktor_Sleeves_Navy", vertices, faces, material)
    _transfer_body_weights(sleeves, body, armature)
    sleeves["football_lab_attachment"] = "purpose-built-weight-transferred-short-sleeves"
    sleeves["football_lab_art_revision"] = "V49"
    return sleeves


def _boot_profile(t):
    # Heel -> toe centreline. Dimensions are intentionally slim and rounded.
    keys = [
        (0.00,  0.055, 0.078, 0.052, 0.064),
        (0.15,  0.018, 0.073, 0.056, 0.062),
        (0.32, -0.045, 0.064, 0.061, 0.055),
        (0.52, -0.108, 0.054, 0.068, 0.048),
        (0.72, -0.172, 0.044, 0.070, 0.039),
        (0.88, -0.225, 0.035, 0.061, 0.030),
        (1.00, -0.258, 0.030, 0.041, 0.022),
    ]
    for index in range(len(keys) - 1):
        a = keys[index]
        b = keys[index + 1]
        if a[0] <= t <= b[0]:
            span = max(1e-6, b[0] - a[0])
            u = (t - a[0]) / span
            return tuple(a[i] * (1.0 - u) + b[i] * u for i in range(1, 5))
    return keys[-1][1:]


def _clean_boots(body, armature):
    vertices = []
    faces = []
    sections = 24
    rings = 13

    for side in (1.0, -1.0):
        centre_x = side * 0.105
        start = len(vertices)
        for ring in range(rings):
            t = ring / (rings - 1)
            y, centre_z, width, height = _boot_profile(t)
            for section in range(sections):
                angle = 2.0 * math.pi * section / sections
                # Slightly flatten the sole while retaining a smooth rounded upper.
                x = centre_x + width * math.cos(angle)
                z = centre_z + height * math.sin(angle)
                if z < 0.004:
                    z = 0.004
                vertices.append((x, y, z))

        for ring in range(rings - 1):
            for section in range(sections):
                nxt = (section + 1) % sections
                a = start + ring * sections + section
                b = start + ring * sections + nxt
                c = start + (ring + 1) * sections + nxt
                d = start + (ring + 1) * sections + section
                faces.append((a, b, c, d))

        # Close heel and toe caps for a manufactured shoe silhouette.
        heel = tuple(start + section for section in reversed(range(sections)))
        toe_start = start + (rings - 1) * sections
        toe = tuple(toe_start + section for section in range(sections))
        faces.append(heel)
        faces.append(toe)

    material = _material("VIKTOR_V49_Boots", (0.004, 0.006, 0.009), 0.34)
    boots = _mesh_object("Viktor_Boots", vertices, faces, material)
    _transfer_body_weights(boots, body, armature)
    boots["football_lab_attachment"] = "purpose-built-weight-transferred-football-boots"
    boots["football_lab_boot_silhouette"] = "closed-slim-rounded-football-shoe"
    boots["football_lab_art_revision"] = "V49"
    return boots


def _tuck_feet_inside_boots(body):
    # The body must retain grounded vertices for the production contract, but
    # every anatomical forefoot vertex can live safely inside the manufactured
    # shoe. This prevents toe/skin bleed without changing the skeleton.
    for vertex in body.data.vertices:
        p = vertex.co
        if p.z > 0.185:
            continue
        side = 1.0 if p.x >= 0.0 else -1.0
        centre_x = side * 0.105
        local_x = p.x - centre_x

        if p.y < 0.045:
            p.x = centre_x + local_x * 0.64
            if p.y < -0.030:
                p.y = max(p.y, -0.228)
            if p.z > 0.010:
                p.z = 0.007 + (p.z - 0.007) * 0.70
        # Preserve a tiny grounded heel/sole strip so authoritative body bounds
        # stay at exactly the established 1.88 m character height.
        if p.z < 0.006:
            p.z = 0.0

    body.data.update()
    body["football_lab_hidden_foot_tuck"] = True
    return body


def _front_surface_y(body, x, z, dx=0.025, dz=0.020):
    candidates = [
        vertex.co.y
        for vertex in body.data.vertices
        if abs(vertex.co.x - x) <= dx
        and abs(vertex.co.z - z) <= dz
        and vertex.co.y < 0.0
    ]
    return min(candidates) if candidates else -0.090


def _add_eye_piece(body, armature, name, location, scale, material):
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=16,
        ring_count=8,
        location=location,
    )
    eye = bpy.context.active_object
    eye.name = name
    eye.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    eye.data.materials.append(material)
    for polygon in eye.data.polygons:
        polygon.use_smooth = True

    # Eye pieces move rigidly with the head, matching facial anatomy. They are
    # joined into Viktor_Kane_Body before export, preserving the strict mesh-node
    # contract while retaining their material slots and Head weights.
    group = eye.vertex_groups.new(name="Head")
    group.add([vertex.index for vertex in eye.data.vertices], 1.0, "REPLACE")
    modifier = eye.modifiers.new(name="V49_Eye_Armature", type="ARMATURE")
    modifier.object = armature
    eye.parent = armature

    bpy.ops.object.select_all(action="DESELECT")
    body.select_set(True)
    eye.select_set(True)
    bpy.context.view_layer.objects.active = body
    bpy.ops.object.join()
    body.name = "Viktor_Kane_Body"
    body.data.name = "Viktor_Kane_Body_Mesh"
    return body


def _add_integrated_eyes(body, armature):
    sclera = _material("VIKTOR_V49_Eye_Sclera", (0.58, 0.56, 0.52), 0.42)
    iris = _material("VIKTOR_V49_Eye_Iris", (0.035, 0.027, 0.018), 0.44)

    for x in (-0.037, 0.037):
        z = 1.740
        front_y = _front_surface_y(body, x, z)
        body = _add_eye_piece(
            body,
            armature,
            f"V49_Eye_{x:+.3f}",
            (x, front_y - 0.0020, z),
            (0.0125, 0.0055, 0.0063),
            sclera,
        )
        body = _add_eye_piece(
            body,
            armature,
            f"V49_Iris_{x:+.3f}",
            (x, front_y - 0.0068, z - 0.0002),
            (0.0040, 0.0022, 0.0040),
            iris,
        )

    body["football_lab_integrated_eyes"] = True
    return body


def _darken_hair(hair):
    for material in hair.data.materials:
        if not material:
            continue
        material.diffuse_color = (0.055, 0.027, 0.012, 1.0)
        if material.use_nodes:
            bsdf = next((node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
            if bsdf is not None:
                bsdf.inputs["Base Color"].default_value = (0.055, 0.027, 0.012, 1.0)
                bsdf.inputs["Roughness"].default_value = 0.82
    hair["football_lab_hair_finish"] = "dark-mature-short-crop"
    return hair


def create_v49_character_surfaces(armature):
    # Build the last accepted inherited surfaces first, then replace only the
    # two pieces whose topology cannot be polished by triangle trimming.
    hair = base_create_surfaces(armature)
    body = bpy.data.objects.get("Viktor_Kane_Body")
    if body is None:
        raise RuntimeError("V49 body missing after base surface creation")

    for name in ("Viktor_Sleeves_Navy", "Viktor_Boots"):
        old = bpy.data.objects.get(name)
        if old is not None:
            bpy.data.objects.remove(old, do_unlink=True)

    _clean_sleeves(body, armature)
    _clean_boots(body, armature)
    _tuck_feet_inside_boots(body)
    _add_integrated_eyes(body, armature)
    _darken_hair(hair)

    body["football_lab_character_rebuild"] = "weighted-manufactured-garments"
    body["football_lab_art_revision"] = "V49"
    return hair


def add_v49_metadata(body, armature):
    base_add_metadata(body, armature)
    body["football_lab_build"] = "49.0.0"
    body["football_lab_art_revision"] = "V49"
    body["football_lab_weight_transferred_sleeves"] = True
    body["football_lab_weight_transferred_boots"] = True
    body["football_lab_hidden_foot_tuck"] = True
    body["football_lab_integrated_eyes"] = True
    body["football_lab_floating_overlay_geometry"] = False
    armature["football_lab_build"] = "49.0.0"
    armature["football_lab_art_revision"] = "V49"


builder.add_hair = create_v49_character_surfaces
builder.add_metadata = add_v49_metadata
builder.main()
