"""V47.2 targeted hair-envelope correction.

V47.1's explicit cropped-hair geometry solved the disappearing-scalp problem,
but the production verifier correctly rejected the crown because it reached
1.893 m on a 1.88 m character. This pass preserves the V47.1 body, kit, boots,
rig and animations and only reshapes the hair volume so it stays visibly short
at gameplay distance while remaining inside the production envelope.
"""

import os

import bpy

BASE_PATH = os.path.join(os.path.dirname(__file__), "run-build-viktor-v47-1.py")
with open(BASE_PATH, "r", encoding="utf-8") as handle:
    source = handle.read()

marker = "builder.main()"
if marker not in source:
    raise RuntimeError("V47.1 builder entry point not found")

# V47.1 itself executes the V47 base builder inside a nested dictionary named
# `namespace`. Functions such as create_v47_kit_and_hair() retain that nested
# dictionary as their globals. We therefore need both levels here: the outer
# namespace owns V47.1's correction helpers, while base_globals owns the V47
# kit function that actually resolves `_create_scalp_hair` at runtime.
v471_globals = {
    "__file__": BASE_PATH,
    "__name__": "football_lab_v47_1_base",
}
exec(compile(source.rsplit(marker, 1)[0], BASE_PATH, "exec"), v471_globals)

builder = v471_globals["builder"]
base_globals = v471_globals["namespace"]
_ellipsoid_mesh = v471_globals["_ellipsoid_mesh"]
_ensure_armature_modifier = v471_globals["_ensure_armature_modifier"]


def v472_scalp_hair(armature, material):
    bsdf = material.node_tree.nodes.get("Principled BSDF") if material.use_nodes else None
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (0.12, 0.07, 0.032, 1.0)
        bsdf.inputs["Roughness"].default_value = 0.90

    vertices = []
    faces = []

    # Main cropped crown. Lower centre + slightly deeper radius extends the
    # sides/back down toward the scalp while keeping the highest point below
    # 1.89 m. Expected top is ~1.883 m and lower edge ~1.715 m.
    _ellipsoid_mesh(
        vertices,
        faces,
        centre=(0.0, 0.012, 1.755),
        radii=(0.105, 0.100, 0.128),
        rings=9,
        segments=24,
        top_fraction=0.60,
    )

    # Shallow front volume preserves the cropped frontal silhouette without a
    # helmet/dome read. Expected top is ~1.879 m.
    _ellipsoid_mesh(
        vertices,
        faces,
        centre=(0.0, -0.052, 1.795),
        radii=(0.092, 0.055, 0.084),
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
    hair["football_lab_art_revision"] = "V47.2"
    return hair


# `create_v47_kit_and_hair` was defined in the nested V47 base namespace, so
# replace the symbol there. The V47.1 body/boot corrections remain active via
# builder.normalise_body and the outer helper patching already performed when
# the V47.1 prefix executed above.
base_globals["_create_scalp_hair"] = v472_scalp_hair

builder.main()
