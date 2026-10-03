import * as THREE from 'three';
import type { Square } from '../chess/types';

// Returns a function that finds the board square under a mouse event,
// whether the ray hits a tile or a piece.
export function createPicker(camera: THREE.Camera, canvas: HTMLCanvasElement, targets: THREE.Object3D[]){
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    return (event: MouseEvent): Square | null => {
        const rect = canvas.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);

        for(const hit of raycaster.intersectObjects(targets, true)){
            // A loaded model is a tree of meshes; walk up to whatever carries the square.
            for(let object: THREE.Object3D | null = hit.object; object; object = object.parent){
                const square: Square | undefined = object.userData.square;
                if(square) return {...square};
            }
        }
        return null;
    };
}
