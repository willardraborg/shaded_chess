import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PIECE_TYPES } from '../chess/types';
import type { PieceColor, PieceType } from '../chess/types';

export type PieceModels = Map<PieceType, THREE.Object3D>;

export async function loadPieceModels(): Promise<PieceModels> {
    const loader = new GLTFLoader();
    const models: PieceModels = new Map();
    await Promise.all(PIECE_TYPES.map(async (type) => {
        const gltf = await loader.loadAsync(`${import.meta.env.BASE_URL}models/${type}.glb`);
        models.set(type, gltf.scene);
    }));
    return models;
}

const pieceMaterialOptions = {roughness: 0.5, clearcoat: 0.2, clearcoatRoughness: 0.25, side: THREE.DoubleSide};

export const pieceMaterials: Record<PieceColor, THREE.Material> = {
    white: new THREE.MeshPhysicalMaterial({color: 0xcfc2a8, ...pieceMaterialOptions}),
    black: new THREE.MeshPhysicalMaterial({color: 0x2a3550, ...pieceMaterialOptions}),
};
