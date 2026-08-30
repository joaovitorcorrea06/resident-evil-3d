import * as THREE from 'three';

export const SCROLL_STAGE_HEIGHT_VH = 620;

export const DEFAULT_DEBUG_CAMERA = {
  position: [-4.45, 1.78, 8.85],
  target: [-6.15, 1.92, 10.55],
  fov: 36,
};

export const DEFAULT_MOBILE_DEBUG_CAMERA = {
  position: [-4.05, 2.02, 8.25],
  target: [-5.55, 2.08, 9.95],
  fov: 42,
};

const FALLBACK_ZOMBIE = [4.591, 0, 0.058];
const FALLBACK_FIRE = [3.731, 0.044, -3.406];

function vector3FromArray(values) {
  return new THREE.Vector3(values[0], values[1], values[2]);
}

function makePath(points) {
  return new THREE.CatmullRomCurve3(
    points.map(vector3FromArray),
    false,
    'catmullrom',
    0.4,
  );
}

function getAnchors(anchors) {
  return {
    zombie: anchors?.zombiePosition ?? FALLBACK_ZOMBIE,
    fire: anchors?.firePosition ?? FALLBACK_FIRE,
  };
}

export function buildCameraPathLayout({ anchors, isMobile }) {
  const { zombie, fire } = getAnchors(anchors);
  const zombieFocus = [zombie[0], zombie[1] + 1.38, zombie[2] + 0.05];
  const fireFocus = [fire[0], fire[1] + 0.95, fire[2] + 0.42];

  const desktopPositionPoints = [
    [-4.45, 1.78, 8.85],
    [-4.42, 1.78, 8.8],
    [-4.18, 1.79, 8.45],
    [-3.2, 1.8, 7.45],
    [-1.65, 1.78, 6.45],
    [0.15, 1.7, 4.25],
    [1.15, 1.64, 1.65],
    [2.45, 1.58, -1.45],
    [3.15, 1.55, -2.45],
    [2.55, 1.6, -0.55],
  ];

  const desktopTargetPoints = [
    [-6.15, 1.92, 10.55],
    [-5.9, 1.92, 10.2],
    [-4.6, 1.9, 8.55],
    [-2.55, 1.88, 6.15],
    [-0.3, 1.86, 3.85],
    [1.15, 1.82, 0.6],
    [2.25, 1.72, -0.85],
    fireFocus,
    [zombieFocus[0] - 0.22, zombieFocus[1] - 0.18, zombieFocus[2] - 1.1],
    zombieFocus,
    zombieFocus,
  ];

  const mobilePositionPoints = [
    [-4.05, 2.02, 8.25],
    [-4.02, 2.02, 8.18],
    [-3.78, 2.04, 7.85],
    [-2.85, 2.06, 6.9],
    [-1.25, 2.08, 5.55],
    [1.2, 2.04, 2.05],
    [2.1, 1.95, -0.95],
    [2.45, 1.9, -1.55],
    [2.2, 1.96, -0.25],
  ];

  const mobileTargetPoints = [
    [-5.55, 2.08, 9.95],
    [-5.25, 2.08, 9.6],
    [-4.15, 2.04, 8.15],
    [-2.4, 2, 6.05],
    [-0.1, 1.95, 3.95],
    [2.55, 1.8, -0.45],
    [fireFocus[0] - 0.08, fireFocus[1] + 0.16, fireFocus[2] + 0.2],
    [zombieFocus[0] - 0.18, zombieFocus[1], zombieFocus[2] - 0.75],
    zombieFocus,
    zombieFocus,
  ];

  const positionPoints = isMobile
    ? mobilePositionPoints
    : desktopPositionPoints;
  const targetPoints = isMobile ? mobileTargetPoints : desktopTargetPoints;

  return {
    positionPoints,
    targetPoints,
    positionCurve: makePath(positionPoints),
    targetCurve: makePath(targetPoints),
    finalFocus: zombieFocus,
    fireplaceFocus: fireFocus,
  };
}
