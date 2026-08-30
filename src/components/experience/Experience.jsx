import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
import * as THREE from 'three';
import {
  DEFAULT_DEBUG_CAMERA,
  DEFAULT_MOBILE_DEBUG_CAMERA,
} from '../../config/cameraPath';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import AtmosphereController from './AtmosphereController';
import CameraRig from './CameraRig';
import LoadingScreen from './LoadingScreen';
import ResidentEvilScene from './ResidentEvilScene';

function getInitialCamera(isReducedMotion) {
  if (typeof window !== 'undefined' && window.innerWidth < 900) {
    return DEFAULT_MOBILE_DEBUG_CAMERA;
  }

  return isReducedMotion
    ? DEFAULT_MOBILE_DEBUG_CAMERA
    : DEFAULT_DEBUG_CAMERA;
}

export default function Experience({ progressRef }) {
  const [anchors, setAnchors] = useState(null);
  const reduceMotion = useReducedMotion();
  const initialCamera = getInitialCamera(reduceMotion);
  const isMobile =
    typeof window !== 'undefined' ? window.innerWidth < 900 : false;

  return (
    <div className="canvas-shell">
      <Canvas
        camera={{
          position: initialCamera.position,
          fov: initialCamera.fov,
          near: 0.1,
          far: 120,
        }}
        dpr={[1, isMobile ? 1.2 : 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 0.9;
          gl.setClearColor('#030303');
        }}
      >
        <color attach="background" args={['#030303']} />
        <fog attach="fog" args={['#050505', 15, 34]} />
        <Suspense fallback={null}>
          <ResidentEvilScene onSceneReady={setAnchors} />
          <AtmosphereController progressRef={progressRef} reduceMotion={reduceMotion} />
          <CameraRig
            anchors={anchors}
            progressRef={progressRef}
            reduceMotion={reduceMotion}
          />
          <Preload all />
        </Suspense>
      </Canvas>
      <LoadingScreen />
    </div>
  );
}
