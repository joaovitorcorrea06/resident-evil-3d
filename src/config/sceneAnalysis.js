export const SCENE_ANALYSIS = {
  assetPath: '3d-model/resident_evil_1_dining_room_baked.glb',
  fileSizeMB: 61.78,
  animations: [
    {
      name: 'Animation',
      duration: 5.317,
      channelCount: 531,
    },
  ],
  namedAnchors: {
    zombie: {
      name: '1Zombie.001_177',
      approximatePosition: [4.591, 0, 0.058],
    },
    fire: {
      name: '8x8_Fire_243',
      approximatePosition: [3.731, 0.044, -3.406],
    },
  },
  notes: [
    'The file contains 271 nodes, 12 meshes and 9 materials.',
    'The room entrance is not exposed by an obvious node name and needs visual validation in debug mode.',
    'The source includes baked-looking textures and an emissive fire material, so the scene should stay minimally lit.',
  ],
};
