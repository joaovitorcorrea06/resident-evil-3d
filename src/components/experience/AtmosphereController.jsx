import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const fogColor = new THREE.Color();

function smoothStep(edge0, edge1, value) {
  const t = THREE.MathUtils.clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export default function AtmosphereController({ progressRef, reduceMotion }) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);

  useFrame((_, delta) => {
    const progress = progressRef.current.current;
    const intro = 1 - smoothStep(0.05, 0.18, progress);
    const fireplace = smoothStep(0.46, 0.68, progress);
    const finale = smoothStep(0.78, 0.97, progress);

    const exposureTarget =
      0.8 + fireplace * 0.13 - finale * 0.08 - intro * 0.04;
    gl.toneMappingExposure = THREE.MathUtils.damp(
      gl.toneMappingExposure,
      exposureTarget,
      reduceMotion ? 3.5 : 4.6,
      delta,
    );

    if (scene.fog) {
      fogColor
        .setRGB(
          0.02 + fireplace * 0.015 + finale * 0.01,
          0.02 + fireplace * 0.008,
          0.02 + fireplace * 0.004,
        );

      scene.fog.color.lerp(fogColor, 1 - Math.exp(-delta * 4.5));
      scene.fog.near = THREE.MathUtils.damp(
        scene.fog.near,
        13 + fireplace * 3 - finale * 1.5,
        4.4,
        delta,
      );
      scene.fog.far = THREE.MathUtils.damp(
        scene.fog.far,
        32 + fireplace * 4 - finale * 3,
        4.4,
        delta,
      );
    }
  });

  return null;
}
