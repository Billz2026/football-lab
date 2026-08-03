const EPSILON = 1e-6;

function subtract(a, b) {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function cross(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
  };
}

function normalise(vector) {
  const length = Math.hypot(vector.x, vector.y, vector.z) || 1;
  return { x: vector.x / length, y: vector.y / length, z: vector.z / length };
}

export function cameraBasis(camera) {
  const forward = normalise(subtract(camera.target, camera.position));
  const worldUp = { x: 0, y: 1, z: 0 };
  const right = normalise(cross(forward, worldUp));
  const up = normalise(cross(right, forward));
  return { forward, right, up };
}

export function projectWorld(point, camera, viewport) {
  const basis = cameraBasis(camera);
  const relative = subtract(point, camera.position);
  const cameraX = dot(relative, basis.right);
  const cameraY = dot(relative, basis.up);
  const depth = dot(relative, basis.forward);
  const near = camera.near || 0.2;
  if (depth <= near) return { visible: false, depth };

  const fovRadians = (camera.fovY * Math.PI) / 180;
  const focal = (viewport.height / 2) / Math.tan(fovRadians / 2);
  const scale = focal / Math.max(depth, EPSILON);
  return {
    visible: true,
    x: viewport.width / 2 + cameraX * scale,
    y: viewport.height / 2 - cameraY * scale,
    depth,
    scale,
    focal
  };
}

export function projectSegment(a, b, camera, viewport) {
  const first = projectWorld(a, camera, viewport);
  const second = projectWorld(b, camera, viewport);
  if (!first.visible || !second.visible) return null;
  return { a: first, b: second };
}

export function projectedHeight(feet, heightMetres, camera, viewport) {
  const foot = projectWorld(feet, camera, viewport);
  const head = projectWorld({ ...feet, y: feet.y + heightMetres }, camera, viewport);
  if (!foot.visible || !head.visible) return null;
  return { foot, head, height: Math.max(1, foot.y - head.y), scale: foot.scale };
}
