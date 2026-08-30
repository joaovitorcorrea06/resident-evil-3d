import { useEffect, useMemo, useRef } from 'react';
import { Line, OrbitControls, Text } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { button, useControls } from 'leva';
import * as THREE from 'three';
import { DEBUG_ENABLED } from '../../config/debug';
import {
  DEFAULT_DEBUG_CAMERA,
  DEFAULT_MOBILE_DEBUG_CAMERA,
} from '../../config/cameraPath';

const DEBUG = DEBUG_ENABLED;

function dampingFactor(delta, smoothness) {
  return 1 - Math.exp(-delta * smoothness);
}

function Marker({ color, label, position }) {
  if (!position) {
    return null;
  }

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <Text
        anchorX="center"
        anchorY="bottom"
        color={color}
        fontSize={0.22}
        outlineColor="#030303"
        outlineWidth={0.02}
        position={[0, 0.38, 0]}
      >
        {label}
      </Text>
    </group>
  );
}

function PathMarker({ color, index, label, position }) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <Text
        anchorX="center"
        anchorY="bottom"
        color={color}
        fontSize={0.16}
        outlineColor="#030303"
        outlineWidth={0.02}
        position={[0, 0.24, 0]}
      >
        {`${label} ${index + 1}`}
      </Text>
    </group>
  );
}

export default function CameraDebug({
  anchors,
  cameraPoints,
  progressRef,
  reduceMotion,
  targetPoints,
}) {
  const camera = useThree((state) => state.camera);
  const orbitControls = useRef(null);
  const isMobile =
    typeof window !== 'undefined' ? window.innerWidth < 900 : false;
  const defaults = isMobile
    ? DEFAULT_MOBILE_DEBUG_CAMERA
    : DEFAULT_DEBUG_CAMERA;

  const targetVector = useMemo(() => new THREE.Vector3(), []);
  const positionVector = useMemo(() => new THREE.Vector3(), []);
  const lookAtMatrix = useMemo(() => new THREE.Matrix4(), []);
  const targetRef = useRef(new THREE.Vector3(...defaults.target));

  const [debugValues, setDebug] = useControls('Debug Camera', () => ({
    overrideCamera: false,
    orbit: false,
    showHelpers: true,
    showPath: true,
    fov: {
      value: defaults.fov,
      min: 20,
      max: 70,
      step: 0.5,
    },
    posX: {
      value: defaults.position[0],
      min: -20,
      max: 20,
      step: 0.05,
    },
    posY: {
      value: defaults.position[1],
      min: -2,
      max: 10,
      step: 0.05,
    },
    posZ: {
      value: defaults.position[2],
      min: -20,
      max: 20,
      step: 0.05,
    },
    targetX: {
      value: defaults.target[0],
      min: -20,
      max: 20,
      step: 0.05,
    },
    targetY: {
      value: defaults.target[1],
      min: -2,
      max: 10,
      step: 0.05,
    },
    targetZ: {
      value: defaults.target[2],
      min: -20,
      max: 20,
      step: 0.05,
    },
    logPose: button(() => {
      const target = orbitControls.current?.target ?? targetRef.current;
      const payload = {
        position: camera.position.toArray().map((value) => Number(value.toFixed(3))),
        target: target.toArray().map((value) => Number(value.toFixed(3))),
        fov: Number(camera.fov.toFixed(2)),
      };

      console.log('Debug camera pose', payload);
    }),
  }));

  useEffect(() => {
    if (!DEBUG || !anchors) {
      return;
    }

    console.table({
      zombie: anchors.zombiePosition?.map((value) => Number(value.toFixed(3))).join(', '),
      fire: anchors.firePosition?.map((value) => Number(value.toFixed(3))).join(', '),
      center: anchors.center?.map((value) => Number(value.toFixed(3))).join(', '),
    });
  }, [anchors]);

  useFrame((_, delta) => {
    if (!DEBUG) {
      return;
    }

    if (!debugValues.overrideCamera && !debugValues.orbit) {
      return;
    }

    camera.fov = debugValues.fov;
    camera.updateProjectionMatrix();

    if (debugValues.orbit) {
      targetRef.current.copy(orbitControls.current?.target ?? targetRef.current);
      return;
    }

    positionVector.set(debugValues.posX, debugValues.posY, debugValues.posZ);
    targetVector.set(debugValues.targetX, debugValues.targetY, debugValues.targetZ);
    targetRef.current.copy(targetVector);

    const smoothness = reduceMotion ? 8 : 11;
    const alpha = dampingFactor(delta, smoothness);

    camera.position.lerp(positionVector, alpha);

    lookAtMatrix.lookAt(camera.position, targetVector, camera.up);
    const nextRotation = new THREE.Quaternion().setFromRotationMatrix(lookAtMatrix);
    camera.quaternion.slerp(nextRotation, alpha);
  });

  useEffect(() => {
    if (!DEBUG || !anchors) {
      return;
    }

    setDebug({
      targetX: anchors.center?.[0] ?? defaults.target[0],
      targetY: anchors.center?.[1] ?? defaults.target[1],
      targetZ: anchors.center?.[2] ?? defaults.target[2],
    });
  }, [anchors, defaults, setDebug]);

  if (!DEBUG) {
    return null;
  }

  return (
    <>
      <OrbitControls
        ref={orbitControls}
        enableDamping
        dampingFactor={0.08}
        enabled={debugValues.orbit}
      />

      {debugValues.showHelpers ? (
        <>
          <axesHelper args={[1.5]} />
          <Marker color="#d61f1f" label="Zombie" position={anchors?.zombiePosition} />
          <Marker color="#ff9f1c" label="Fire" position={anchors?.firePosition} />
          <Marker color="#c7d3dd" label="Center" position={anchors?.center} />
          {debugValues.showPath && cameraPoints?.length ? (
            <>
              <Line color="#6bc5ff" lineWidth={1} points={cameraPoints} />
              {cameraPoints.map((point, index) => (
                <PathMarker
                  key={`camera-${index}`}
                  color="#6bc5ff"
                  index={index}
                  label="Cam"
                  position={point}
                />
              ))}
            </>
          ) : null}
          {debugValues.showPath && targetPoints?.length ? (
            <>
              <Line color="#80ed99" lineWidth={1} points={targetPoints} />
              {targetPoints.map((point, index) => (
                <PathMarker
                  key={`target-${index}`}
                  color="#80ed99"
                  index={index}
                  label="Look"
                  position={point}
                />
              ))}
            </>
          ) : null}
          <Marker
            color="#6bc5ff"
            label="Target"
            position={[
              debugValues.targetX,
              debugValues.targetY,
              debugValues.targetZ,
            ]}
          />
          <Text
            anchorX="left"
            anchorY="top"
            color="#f2ede6"
            fontSize={0.2}
            position={[-7.4, 6.2, 0]}
          >
            {`progress ${progressRef.current.current.toFixed(3)}`}
          </Text>
        </>
      ) : null}
    </>
  );
}
