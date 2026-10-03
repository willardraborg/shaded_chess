import * as THREE from 'three';
import { pieceMaterials } from './assets';
import type { PieceModels } from './assets';
import type { Board, Piece, Square } from '../chess/types';

const TILE_SIZE = 1;
const TILE_HEIGHT = 0.2;
const BOARD_TOP = TILE_HEIGHT / 2;
const PIECE_SCALE = 0.8;
const LIFTED_Y = 0.35;
const HIGHLIGHT_Y = BOARD_TOP + 0.01;
const MARKER_Y = BOARD_TOP + 0.02;

export function squareToWorld(square: Square){
    return {
        x: (square.col - 3.5) * TILE_SIZE,
        z: (3.5 - square.row) * TILE_SIZE,
    };
}

// Draws a Board. The model is the source of truth: call sync() with the
// current board after every move and the meshes are rearranged to match.
export class BoardView {
    // Everything that can be clicked; each tile and piece carries userData.square.
    readonly pickables: THREE.Object3D[];

    private readonly pieces = new THREE.Group();
    private readonly meshes = new Map<Piece, THREE.Object3D>();
    private readonly highlight: THREE.Mesh;
    private readonly markers = new THREE.Group();
    private readonly models: PieceModels;
    private board: Board;
    private selected: Square | null = null;

    constructor(scene: THREE.Scene, models: PieceModels, board: Board){
        this.models = models;
        this.board = board;
        const tiles = createTiles();
        this.highlight = createHighlight();
        scene.add(tiles, this.pieces, this.highlight, this.markers);
        this.pickables = [tiles, this.pieces];
        this.sync(board);
    }

    sync(board: Board){
        this.board = board;
        const onBoard = new Set<Piece>();
        for(let row = 0; row <= 7; row++){
            for(let col = 0; col <= 7; col++){
                const piece = this.board[row][col];
                if(!piece) continue;
                onBoard.add(piece);
                const mesh = this.meshFor(piece);
                const {x, z} = squareToWorld({row, col});
                mesh.position.set(x, BOARD_TOP, z);
                mesh.userData.square = {row, col};
            }
        }
        for(const [piece, mesh] of this.meshes){
            if(onBoard.has(piece)) continue;
            this.pieces.remove(mesh);
            this.meshes.delete(piece);
        }
        this.selected = null;
        this.highlight.visible = false;
        this.markers.clear();
    }

    // Lifts the piece on `square`, highlights the square and tints the squares it can
    // move to: green for a move, red for a capture. null puts the piece back down.
    select(square: Square | null, targets: Square[] = []){
        if(this.selected) this.pieceMeshAt(this.selected)?.position.setY(BOARD_TOP);
        this.selected = square;
        this.highlight.visible = square !== null;
        this.markers.clear();
        if(!square) return;

        this.pieceMeshAt(square)?.position.setY(LIFTED_Y);
        const {x, z} = squareToWorld(square);
        this.highlight.position.set(x, HIGHLIGHT_Y, z);

        for(const target of targets){
            const capture = this.board[target.row][target.col] !== null;
            const marker = new THREE.Mesh(tileOverlayGeometry, capture ? captureMaterial : moveMaterial);
            const {x, z} = squareToWorld(target);
            marker.position.set(x, MARKER_Y, z);
            marker.rotation.x = -Math.PI / 2;
            this.markers.add(marker);
        }
    }

    private pieceMeshAt(square: Square){
        const piece = this.board[square.row][square.col];
        return piece ? this.meshes.get(piece) : undefined;
    }

    private meshFor(piece: Piece){
        let mesh = this.meshes.get(piece);
        if(!mesh){
            mesh = this.createPieceMesh(piece);
            this.meshes.set(piece, mesh);
            this.pieces.add(mesh);
        }
        return mesh;
    }

    private createPieceMesh(piece: Piece){
        const mesh = this.models.get(piece.type)!.clone();
        const material = pieceMaterials[piece.color];
        mesh.traverse((child) => {
            if(child instanceof THREE.Mesh){
                child.material = material;
                child.castShadow = true;
            }
        });
        mesh.scale.setScalar(PIECE_SCALE);
        if(piece.color === 'black') mesh.rotation.y = Math.PI;
        // The knight model's head points along -x; turn it to face the opponent.
        if(piece.type === 'knight') mesh.rotation.y = piece.color === 'white' ? -Math.PI / 2 : Math.PI / 2;
        return mesh;
    }
}

function createTiles(){
    const tiles = new THREE.Group();
    const geometry = new THREE.BoxGeometry(TILE_SIZE, TILE_HEIGHT, TILE_SIZE);
    const light = new THREE.MeshStandardMaterial({color: 0xeeeed2});
    const dark = new THREE.MeshStandardMaterial({color: 0x56647f});

    for(let row = 0; row <= 7; row++){
        for(let col = 0; col <= 7; col++){
            // a1 (row 0, col 0) is a dark square.
            const mesh = new THREE.Mesh(geometry, (row + col) % 2 === 0 ? dark : light);
            const {x, z} = squareToWorld({row, col});
            mesh.position.set(x, 0, z);
            mesh.receiveShadow = true;
            mesh.userData.square = {row, col};
            tiles.add(mesh);
        }
    }
    return tiles;
}

// Shared by every marker; markers are cheap meshes recreated on each selection.
const tileOverlayGeometry = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);
const moveMaterial = new THREE.MeshBasicMaterial({color: 0x5cc26a, transparent: true, opacity: 0.5, depthWrite: false});
const captureMaterial = new THREE.MeshBasicMaterial({color: 0xe0534a, transparent: true, opacity: 0.55, depthWrite: false});

function createHighlight(){
    const highlight = new THREE.Mesh(
        new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE),
        new THREE.MeshBasicMaterial({color: 0xf6d55c, transparent: true, opacity: 0.5, depthWrite: false})
    );
    highlight.rotation.x = -Math.PI / 2;
    highlight.visible = false;
    return highlight;
}
