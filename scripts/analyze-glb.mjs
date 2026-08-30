import fs from 'node:fs';
import path from 'node:path';

const glbPath = path.resolve(
  process.cwd(),
  '3d-model/resident_evil_1_dining_room_baked.glb',
);

const buffer = fs.readFileSync(glbPath);

function parseGlb(source) {
  if (source.toString('utf8', 0, 4) !== 'glTF') {
    throw new Error('Invalid GLB file.');
  }

  const length = source.readUInt32LE(8);
  let offset = 12;
  let json = null;
  let bin = null;

  while (offset < length) {
    const chunkLength = source.readUInt32LE(offset);
    offset += 4;

    const chunkType = source.toString('utf8', offset, offset + 4);
    offset += 4;

    const chunkData = source.slice(offset, offset + chunkLength);
    offset += chunkLength;

    if (chunkType === 'JSON') {
      json = JSON.parse(chunkData.toString('utf8').replace(/\0+$/u, ''));
    }

    if (chunkType.startsWith('BIN')) {
      bin = chunkData;
    }
  }

  return { json, bin };
}

function buildAnalyzer(document, binary) {
  const componentTypes = {
    5121: Uint8Array,
    5123: Uint16Array,
    5125: Uint32Array,
    5126: Float32Array,
  };

  const componentCounts = {
    SCALAR: 1,
    VEC2: 2,
    VEC3: 3,
    VEC4: 4,
  };

  const accessors = document.accessors ?? [];
  const bufferViews = document.bufferViews ?? [];

  function readAccessor(index) {
    const accessor = accessors[index];
    const bufferView = bufferViews[accessor.bufferView];
    const ArrayType = componentTypes[accessor.componentType];
    const componentCount = componentCounts[accessor.type];
    const byteOffset =
      (bufferView.byteOffset ?? 0) + (accessor.byteOffset ?? 0);

    return new ArrayType(
      binary.buffer,
      binary.byteOffset + byteOffset,
      accessor.count * componentCount,
    );
  }

  return { readAccessor };
}

const { json, bin } = parseGlb(buffer);
const analyzer = buildAnalyzer(json, bin);

const nodes = json.nodes ?? [];
const meshes = json.meshes ?? [];
const materials = json.materials ?? [];
const animations = json.animations ?? [];
const sceneIndex = json.scene ?? 0;
const sceneRoots = json.scenes?.[sceneIndex]?.nodes ?? [];

function composeMatrix(node) {
  if (node.matrix) {
    return node.matrix;
  }

  const translation = node.translation ?? [0, 0, 0];
  const rotation = node.rotation ?? [0, 0, 0, 1];
  const scale = node.scale ?? [1, 1, 1];
  const [x, y, z, w] = rotation;

  const x2 = x + x;
  const y2 = y + y;
  const z2 = z + z;

  const xx = x * x2;
  const xy = x * y2;
  const xz = x * z2;
  const yy = y * y2;
  const yz = y * z2;
  const zz = z * z2;
  const wx = w * x2;
  const wy = w * y2;
  const wz = w * z2;

  return [
    (1 - (yy + zz)) * scale[0],
    (xy + wz) * scale[0],
    (xz - wy) * scale[0],
    0,
    (xy - wz) * scale[1],
    (1 - (xx + zz)) * scale[1],
    (yz + wx) * scale[1],
    0,
    (xz + wy) * scale[2],
    (yz - wx) * scale[2],
    (1 - (xx + yy)) * scale[2],
    0,
    translation[0],
    translation[1],
    translation[2],
    1,
  ];
}

function multiplyMatrices(a, b) {
  const output = new Array(16).fill(0);

  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      for (let index = 0; index < 4; index += 1) {
        output[column * 4 + row] += a[index * 4 + row] * b[column * 4 + index];
      }
    }
  }

  return output;
}

function transformPoint(matrix, point) {
  const [x, y, z] = point;

  return [
    matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12],
    matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13],
    matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14],
  ];
}

function primitiveBounds(primitive) {
  const accessor = json.accessors?.[primitive.attributes.POSITION];

  if (!accessor?.min || !accessor?.max) {
    return null;
  }

  return {
    min: accessor.min,
    max: accessor.max,
  };
}

function mergeBounds(a, b) {
  if (!a) {
    return b;
  }

  if (!b) {
    return a;
  }

  return {
    min: a.min.map((value, index) => Math.min(value, b.min[index])),
    max: a.max.map((value, index) => Math.max(value, b.max[index])),
  };
}

function transformBounds(bounds, matrix) {
  const corners = [
    [bounds.min[0], bounds.min[1], bounds.min[2]],
    [bounds.max[0], bounds.min[1], bounds.min[2]],
    [bounds.min[0], bounds.max[1], bounds.min[2]],
    [bounds.max[0], bounds.max[1], bounds.min[2]],
    [bounds.min[0], bounds.min[1], bounds.max[2]],
    [bounds.max[0], bounds.min[1], bounds.max[2]],
    [bounds.min[0], bounds.max[1], bounds.max[2]],
    [bounds.max[0], bounds.max[1], bounds.max[2]],
  ].map((point) => transformPoint(matrix, point));

  const transformed = {
    min: [Infinity, Infinity, Infinity],
    max: [-Infinity, -Infinity, -Infinity],
  };

  for (const corner of corners) {
    for (let axis = 0; axis < 3; axis += 1) {
      transformed.min[axis] = Math.min(transformed.min[axis], corner[axis]);
      transformed.max[axis] = Math.max(transformed.max[axis], corner[axis]);
    }
  }

  return transformed;
}

const worldMatrices = new Array(nodes.length);

function visitNode(index, parentMatrix = null) {
  const worldMatrix = parentMatrix
    ? multiplyMatrices(parentMatrix, composeMatrix(nodes[index]))
    : composeMatrix(nodes[index]);

  worldMatrices[index] = worldMatrix;

  for (const childIndex of nodes[index].children ?? []) {
    visitNode(childIndex, worldMatrix);
  }
}

for (const rootIndex of sceneRoots) {
  visitNode(rootIndex);
}

const worldNodes = nodes.map((node, index) => {
  let bounds = null;

  if (node.mesh !== undefined) {
    for (const primitive of meshes[node.mesh]?.primitives ?? []) {
      bounds = mergeBounds(bounds, primitiveBounds(primitive));
    }
  }

  return {
    index,
    name: node.name ?? '',
    mesh: node.mesh,
    children: node.children ?? [],
    position: transformPoint(worldMatrices[index], [0, 0, 0]),
    bounds: bounds ? transformBounds(bounds, worldMatrices[index]) : null,
  };
});

const sceneBounds = worldNodes.reduce(
  (accumulator, node) => mergeBounds(accumulator, node.bounds),
  null,
);

function findNodes(fragment) {
  return worldNodes.filter((node) =>
    node.name.toLowerCase().includes(fragment.toLowerCase()),
  );
}

function printNodeTree(index, depth = 0) {
  const node = nodes[index];
  const prefix = '  '.repeat(depth);

  console.log(
    `${prefix}- ${index}: ${node.name ?? '(unnamed)'} mesh:${node.mesh ?? '-'} children:${(node.children ?? []).length}`,
  );

  for (const childIndex of node.children ?? []) {
    printNodeTree(childIndex, depth + 1);
  }
}

console.log('Asset summary');
console.log(
  JSON.stringify(
    {
      fileSizeMB: Number((buffer.length / 1024 / 1024).toFixed(2)),
      nodes: nodes.length,
      meshes: meshes.length,
      materials: materials.length,
      animations: animations.length,
      defaultScene: sceneIndex,
    },
    null,
    2,
  ),
);

console.log('\nScene bounds');
console.log(JSON.stringify(sceneBounds, null, 2));

console.log('\nMaterials');
materials.forEach((material, index) => {
  console.log(
    index,
    material.name ?? '(unnamed)',
    JSON.stringify({
      baseColorTexture:
        material.pbrMetallicRoughness?.baseColorTexture?.index ?? null,
      emissiveFactor: material.emissiveFactor ?? null,
      alphaMode: material.alphaMode ?? 'OPAQUE',
      doubleSided: Boolean(material.doubleSided),
    }),
  );
});

console.log('\nAnimation summary');
animations.forEach((animation, index) => {
  let minTime = Infinity;
  let maxTime = -Infinity;

  for (const channel of animation.channels) {
    const sampler = animation.samplers[channel.sampler];
    const timeValues = analyzer.readAccessor(sampler.input);

    for (const value of timeValues) {
      minTime = Math.min(minTime, value);
      maxTime = Math.max(maxTime, value);
    }
  }

  console.log(
    JSON.stringify(
      {
        index,
        name: animation.name ?? '(unnamed)',
        duration: Number((maxTime - minTime).toFixed(3)),
        channels: animation.channels.length,
      },
      null,
      2,
    ),
  );
});

console.log('\nInteresting nodes');
for (const fragment of ['Zombie', 'Fire', 'Window', 'Barry']) {
  console.log(`\n${fragment}`);

  for (const node of findNodes(fragment)) {
    console.log(
      JSON.stringify(
        {
          index: node.index,
          name: node.name,
          position: node.position.map((value) => Number(value.toFixed(3))),
          bounds:
            node.bounds && {
              min: node.bounds.min.map((value) => Number(value.toFixed(3))),
              max: node.bounds.max.map((value) => Number(value.toFixed(3))),
            },
        },
        null,
        2,
      ),
    );
  }
}

const zombieRoot = nodes.findIndex((node) => node.name === '1Zombie.001_177');
const fireRoot = nodes.findIndex((node) => node.name === '8x8_Fire_243');

console.log('\nZombie subtree');
printNodeTree(zombieRoot);

console.log('\nFire subtree');
printNodeTree(fireRoot);
