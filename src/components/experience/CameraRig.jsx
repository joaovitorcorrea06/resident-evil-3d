import { useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { buildCameraPathLayout } from '../../config/cameraPath';

const lookAtMatrix = new THREE.Matrix4();
const nextQuaternion = new THREE.Quaternion();
const sampledPosition = new THREE.Vector3();
const sampledTarget = new THREE.Vector3();
const finalFocusVector = new THREE.Vector3();

function smoothStep(edge0, edge1, value) {
  const t = THREE.MathUtils.clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export default function CameraRig({ anchors, progressRef, reduceMotion }) {
  const camera = useThree((state) => state.camera);
  const isMobile =
    typeof window !== 'undefined' ? window.innerWidth < 900 : false;

  const layout = useMemo(
    () => buildCameraPathLayout({ anchors, isMobile }),
    [anchors, isMobile],
  );

  useFrame((state, delta) => {
    const progressState = progressRef.current;
    const pathEasing = reduceMotion ? 3.6 : 5.2;

    progressState.current = THREE.MathUtils.damp(
      progressState.current,
      progressState.target,
      pathEasing,
      delta,
    );

    const pathProgress = THREE.MathUtils.clamp(progressState.current, 0, 0.9995);
    const introTurn = smoothStep(0.035, 0.18, pathProgress);
    const positionProgress =
      pathProgress < 0.22
        ? THREE.MathUtils.lerp(0, pathProgress, introTurn)
        : pathProgress;

    layout.positionCurve.getPointAt(positionProgress, sampledPosition);
    layout.targetCurve.getPointAt(pathProgress, sampledTarget);
    finalFocusVector.fromArray(layout.finalFocus);

    const catchup = Math.abs(progressState.target - progressState.current);
    const normalizedVelocity = THREE.MathUtils.clamp(
      progressState.velocity / 1800,
      0,
      1,
    );
    const travelEnergy = THREE.MathUtils.clamp(
      catchup * 14 + normalizedVelocity * 0.55,
      0,
      1,
    );

    progressState.walking = THREE.MathUtils.damp(
      progressState.walking,
      travelEnergy,
      reduceMotion ? 5 : 7,
      delta,
    );

    if (!reduceMotion) {
      const time = state.clock.elapsedTime;
      const startTurn = 1 - smoothStep(0.08, 0.2, pathProgress);
      const finalLock = smoothStep(0.8, 0.96, pathProgress);
      const walkScale =
        progressState.walking * (1 - startTurn) * (1 - finalLock * 0.65);
      const walkX = Math.cos(time * 1.18) * 0.011 * walkScale;
      const walkY = Math.sin(time * 2.24) * 0.019 * walkScale;
      const walkZ = Math.sin(time * 1.48) * 0.006 * walkScale;

      sampledPosition.x += walkX;
      sampledPosition.y += walkY;
      sampledPosition.z += walkZ;

      sampledTarget.x += walkX * 0.28;
      sampledTarget.y += walkY * 0.12;
      sampledTarget.z += walkZ * 0.22;
    }

    const finalFocus = smoothStep(0.8, 0.98, pathProgress);
    sampledTarget.lerp(finalFocusVector, finalFocus * 0.38);

    camera.position.copy(sampledPosition);
    const baseFov = isMobile ? 42 : 36;
    const endFov = isMobile ? 38.5 : 32.5;
    camera.fov = THREE.MathUtils.damp(
      camera.fov,
      THREE.MathUtils.lerp(baseFov, endFov, finalFocus),
      reduceMotion ? 4.5 : 6.2,
      delta,
    );
    camera.updateProjectionMatrix();
    lookAtMatrix.lookAt(camera.position, sampledTarget, camera.up);
    nextQuaternion.setFromRotationMatrix(lookAtMatrix);

    camera.quaternion.slerp(
      nextQuaternion,
      1 - Math.exp(-delta * (reduceMotion ? 7 : 9)),
    );
  }, 0);

  return null;
}
