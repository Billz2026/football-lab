"""Football Lab Viktor V47.4 boot-skinning correction.

V47.3 fixed the cropped hair and crew-neck shirt, but its deterministic boot
meshes detached during the animated strike because rigid Foot weighting did not
share the body mesh's bind-space skinning. V47.4 keeps every accepted V47.3 art
and animation change and rebuilds only the boots as fitted anatomical foot
shells copied from Viktor's already-correct skinned body. This guarantees the
boots inherit the same bind matrices and deformation as the feet.
"""

import os

import bpy

BASE_PATH = os.path.join(os.path.dirname(__file__), "run-build-viktor-v47-3.py")
with open(BASE_PATH, "r", encoding="utf-8") as handle:
    source = handle.read()

marker = "builder.main()"
if marker not in source:
    raise RuntimeError("V47.3 builder entry point not found")

v473_globals = {
    "__file__": BASE_PATH,
    "__name__": "football_lab_v47_3_base",
}
exec(compile(source.rsplit(marker, 1)[0], BASE_PATH, "exec"), v473_globals)

builder = v473_globals["builder"]
_surface_shell = v473_globals["_surface_shell"]
_material = v473_globals["_material"]
_crew_neck_shirt = v473_globals["_crew_neck_shirt"]
_sleeves = v473_globals["_sleeves"]
_shorts = v473_globals["_shorts"]
_socks = v473_globals["_socks"]
_hair_shell = v473_globals["_hair_shell"]


def _anatomical_boot_seed(point):
    # Include the complete anatomical foot and the lowest ankle transition so
    # skin cannot show around the heel/toe when the strike clips flex the foot.
    return point.z <= 0.185


def _shape_inherited_boots(boots):
    # Because this shell is copied from the skinned body, all original vertex
    # groups and inverse-bind behaviour remain intact. Only small bind-pose
    # silhouette changes are applied here; they deform with the same bones.
    for vertex in boots.data.vertices:
        side = 1.0 if vertex.co.x >= 0.0 else -1.0
        centre_x = side * 0.105

        # Slightly tighten width around each foot rather than creating the
        # oversized V47.2/V47.3 footwear silhouette.
        vertex.co.x = centre_x + (vertex.co.x - centre_x) * 0.965

        # Extend only the forward/toe half a few millimetres for a football-boot
        # profile. Keep heel and ankle unchanged so the shell stays registered
        # to the anatomical foot during plant/contact/follow-through.
        if vertex.co.y < -0.045:
            vertex.co.y = -0.045 + (vertex.co.y + 0.045) * 1.045

        # Keep the sole clear of the pitch without lifting the whole foot.
        if vertex.co.z < 0.003:
            vertex.co.z = 0.003

    boots.data.update()
    for polygon in boots.data.polygons:
        polygon.use_smooth = True
    boots["football_lab_attachment"] = "inherited-skinned-football-boots"
    boots["football_lab_skinning"] = "body-bind-space-inherited"
    boots["football_lab_art_revision"] = "V47.4"
    return boots


def create_v474_kit_and_hair(armature):
    # Keep the accepted V47.3 clothing/hair treatment exactly; replace only the
    # boot construction method.
    shirt = _material("VIKTOR_V47_4_Shirt", (0.935, 0.945, 0.955), 0.82)
    sleeves = _material("VIKTOR_V47_4_Sleeves", (0.925, 0.938, 0.948), 0.83)
    shorts = _material("VIKTOR_V47_4_Shorts", (0.014, 0.027, 0.060), 0.77)
    socks = _material("VIKTOR_V47_4_Socks", (0.90, 0.915, 0.928), 0.84)
    boots_mat = _material("VIKTOR_V47_4_Boots_Black", (0.004, 0.005, 0.008), 0.40)
    hair_mat = _material("VIKTOR_V47_4_Hair", (0.105, 0.060, 0.027), 0.91)

    _surface_shell("Viktor_Shirt", _crew_neck_shirt, shirt, outward=0.016, smooth_factor=0.018)
    _surface_shell("Viktor_Sleeves_Navy", _sleeves, sleeves, outward=0.013, smooth_factor=0.016)
    _surface_shell("Viktor_Shorts", _shorts, shorts, outward=0.014, smooth_factor=0.016)
    _surface_shell("Viktor_Socks", _socks, socks, outward=0.007, smooth_factor=0.010)

    boots = _surface_shell(
        "Viktor_Boots",
        _anatomical_boot_seed,
        boots_mat,
        outward=0.012,
        smooth_factor=0.008,
        subdivide=False,
        min_z=0.002,
    )
    _shape_inherited_boots(boots)
    return _hair_shell(armature, hair_mat)


builder.add_hair = create_v474_kit_and_hair
builder.main()
