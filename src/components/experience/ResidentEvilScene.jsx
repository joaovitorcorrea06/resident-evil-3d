import { useEffect, useLayoutEffect, useRef } from 'react';
import { useAnimations, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import sceneUrl from '../../../3d-model/resident_evil_1_dining_room_baked.glb?url';

const ZOMBIE_NODE_NAME = '1Zombie.001_177';
const FIRE_NODE_NAME = '8x8_Fire_243';

const scratchBox = new THREE.Box3();
const scratchSize = new THREE.Vector3();
const scratchCenter = new THREE.Vector3();
const scratchPosition = new THREE.Vector3();

function toArray(object3D) {
  if (!object3D) {
    return null;
  }

  object3D.getWorldPosition(scratchPosition);
  return scratchPosition.toArray();
}

function extractSceneAnchors(root) {
  root.updateWorldMatrix(true, true);

  const zombie = root.getObjectByName(ZOMBIE_NODE_NAME);
  const fire = root.getObjectByName(FIRE_NODE_NAME);

  scratchBox.setFromObject(root);

  return {
    zombieName: ZOMBIE_NODE_NAME,
    fireName: FIRE_NODE_NAME,
    zombiePosition: toArray(zombie),
    firePosition: toArray(fire),
    bounds: {
      min: scratchBox.min.toArray(),
      max: scratchBox.max.toArray(),
    },
    center: scratchBox.getCenter(scratchCenter).toArray(),
    size: scratchBox.getSize(scratchSize).toArray(),
  };
}

function configureMaterials(root) {
  root.traverse((object) => {
    if (!object.isMesh || !object.material) {
      return;
    }

    object.castShadow = false;
    object.receiveShadow = false;

    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];

    for (const material of materials) {
      if (material.map) {
        material.map.colorSpace = THREE.SRGBColorSpace;
      }

      material.metalness = 0;
      material.roughness = 1;

      if (material.name === '8x8.001') {
        material.emissiveIntensity = 1.2;
      }

      material.needsUpdate = true;
    }
  });
}

export default function ResidentEvilScene({ onSceneReady }) {
  const root = useRef();
  const { scene, animations } = useGLTF(sceneUrl);
  const { actions } = useAnimations(animations, root);

  useLayoutEffect(() => {
    configureMaterials(scene);
  }, [scene]);

  useEffect(() => {
    for (const action of Object.values(actions)) {
      if (!action) {
        continue;
      }

      action.reset();
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.fadeIn(0.35);
      action.play();
    }

    return () => {
      for (const action of Object.values(actions)) {
        action?.stop();
      }
    };
  }, [actions]);

  useEffect(() => {
    if (!root.current) {
      return;
    }

    onSceneReady?.(extractSceneAnchors(root.current));
  }, [onSceneReady, scene]);

  return (
    <group ref={root}>
      <ambientLight intensity={0.35} color="#f7f0e4" />
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(sceneUrl);
