from pathlib import Path

path = Path("scripts/build-viktor-v46.py")
text = path.read_text()
start_marker = '        "plant": ['
end_marker = '    }\n    created = []'
start = text.find(start_marker)
end = text.find(end_marker, start)
if start < 0 or end < 0:
    raise SystemExit("Viktor kick clip block not found")

replacement = '''        "plant": [
            (1, {"LeftUpperLeg": (10, 0, 0), "LeftLowerLeg": (8, 0, 0), "RightUpperLeg": (-12, 0, 0), "RightLowerLeg": (26, 0, 0), "Chest": (5, 0, -2)}, {}),
            (14, {"LeftUpperLeg": (-6, 0, 0), "LeftLowerLeg": (12, 0, 0), "LeftFoot": (-3, 0, 0), "RightUpperLeg": (22, -2, 2), "RightLowerLeg": (48, 0, 0), "Chest": (6, 0, -3), "Hips": (1, 0, -2)}, {}),
            (24, {"LeftUpperLeg": (-8, 0, 0), "LeftLowerLeg": (13, 0, 0), "LeftFoot": (-4, 0, 0), "RightUpperLeg": (36, -3, 3), "RightLowerLeg": (65, 0, 0), "Chest": (7, -1, -5), "Hips": (2, 0, -4)}, {}),
        ],
        "windup": [
            (1, {"LeftUpperLeg": (-8, 0, 0), "LeftLowerLeg": (13, 0, 0), "LeftFoot": (-4, 0, 0), "RightUpperLeg": (36, -3, 3), "RightLowerLeg": (65, 0, 0), "Chest": (7, -1, -5), "Hips": (2, 0, -4), "LeftUpperArm": (12, -4, -14), "RightUpperArm": (-16, 3, 16)}, {}),
            (14, {"LeftUpperLeg": (-9, 0, 0), "LeftLowerLeg": (14, 0, 0), "RightUpperLeg": (50, -4, 4), "RightLowerLeg": (82, 0, 0), "Chest": (8, -2, -6), "Hips": (2, 0, -4), "LeftUpperArm": (18, -5, -20), "RightUpperArm": (-22, 4, 22)}, {}),
            (24, {"LeftUpperLeg": (-9, 0, 0), "LeftLowerLeg": (14, 0, 0), "RightUpperLeg": (58, -5, 5), "RightLowerLeg": (88, 0, 0), "Chest": (9, -3, -7), "Hips": (2, 0, -5), "LeftUpperArm": (20, -6, -22), "RightUpperArm": (-24, 5, 24)}, {}),
        ],
        "contact": [
            (1, {"LeftUpperLeg": (-9, 0, 0), "LeftLowerLeg": (14, 0, 0), "LeftFoot": (-4, 0, 0), "RightUpperLeg": (45, -4, 4), "RightLowerLeg": (75, 0, 0), "Chest": (8, -2, -5), "Hips": (2, 0, -4), "LeftUpperArm": (16, -4, -18), "RightUpperArm": (-20, 4, 20)}, {}),
            (12, {"LeftUpperLeg": (-8, 0, 0), "LeftLowerLeg": (12, 0, 0), "LeftFoot": (-5, 0, 0), "RightUpperLeg": (-18, -2, -2), "RightLowerLeg": (2, 0, 0), "RightFoot": (-6, 0, 0), "Chest": (10, 1, 3), "Hips": (2, 0, 2), "LeftUpperArm": (-6, 0, 14), "RightUpperArm": (14, 0, -18)}, {}),
            (24, {"LeftUpperLeg": (-7, 0, 0), "LeftLowerLeg": (11, 0, 0), "RightUpperLeg": (-42, 1, -3), "RightLowerLeg": (12, 0, 0), "RightFoot": (-4, 0, 0), "Chest": (12, 1, 6), "Hips": (2, 0, 4), "LeftUpperArm": (-12, 0, 20), "RightUpperArm": (20, 0, -24)}, {}),
        ],
        "follow-through": [
            (1, {"LeftUpperLeg": (-7, 0, 0), "LeftLowerLeg": (11, 0, 0), "RightUpperLeg": (-42, 1, -3), "RightLowerLeg": (12, 0, 0), "Chest": (12, 1, 6), "Hips": (2, 0, 4), "LeftUpperArm": (-12, 0, 20), "RightUpperArm": (20, 0, -24)}, {}),
            (12, {"LeftUpperLeg": (-6, 0, 0), "LeftLowerLeg": (10, 0, 0), "RightUpperLeg": (-58, 3, -5), "RightLowerLeg": (22, 0, 0), "Chest": (12, 2, 8), "Hips": (2, 0, 5), "LeftUpperArm": (-16, 0, 24), "RightUpperArm": (24, 0, -28)}, {}),
            (24, {"LeftUpperLeg": (-4, 0, 0), "LeftLowerLeg": (8, 0, 0), "RightUpperLeg": (-36, 2, -3), "RightLowerLeg": (34, 0, 0), "Chest": (8, 1, 5), "Hips": (1, 0, 3), "LeftUpperArm": (-10, 0, 16), "RightUpperArm": (16, 0, -20)}, {}),
        ],
        "recovery": [
            (1, {"RightUpperLeg": (-28, 1, -2), "RightLowerLeg": (30, 0, 0), "Chest": (7, 1, 4), "Hips": (1, 0, 3)}, {}),
            (12, {"RightUpperLeg": (-8, 0, 0), "RightLowerLeg": (15, 0, 0), "LeftUpperLeg": (-3, 0, 0), "Chest": (3, 0, 2), "Hips": (0, 0, 1)}, {}),
            (24, neutral, {}),
        ],
'''

updated = text[:start] + replacement + text[end:]
if updated == text:
    raise SystemExit("Viktor kick clip patch made no change")
path.write_text(updated)
