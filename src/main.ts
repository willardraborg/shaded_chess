import * as THREE from 'three';
import './style.css';
import { createInitialBoard, squareToWorld } from './board';
import type { Board } from './board';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { Piece, PieceType } from './board';

const board: Board = createInitialBoard();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true});

// Render at least 2x the screen resolution; the browser scales it down, smoothing small details (supersampling).
renderer.setPixelRatio(Math.max(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
camera.position.set(0,8,8);
camera.lookAt(0,0,0);

// Soft studio-style light from every direction, so the pieces get gentle shading and reflections.
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.35;

const dirLight = new THREE.DirectionalLight(0xfff4e5, 1.4);
dirLight.position.set(5, 10, 7);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.left = -6;
dirLight.shadow.camera.right = 6;
dirLight.shadow.camera.top = 6;
dirLight.shadow.camera.bottom = -6;
dirLight.shadow.bias = -0.0005;
dirLight.shadow.normalBias = 0.02;
scene.add(dirLight);

const pieceTypes: PieceType[] = ['pawn', 'rook', 'knight', 'bishop',
'queen', 'king'];
const loader = new GLTFLoader();

const models = new Map<PieceType, THREE.Object3D>();
await Promise.all(pieceTypes.map(async (type) => {
    const gltf = await loader.loadAsync(`/models/${type}.glb`);
    models.set(type, gltf.scene);
}));

// Soft base with a thin glossy clearcoat on top, like lacquered wood.
const whiteMaterial = new THREE.MeshPhysicalMaterial({color: 0xcfc2a8,
roughness: 0.5, clearcoat: 0.2, clearcoatRoughness: 0.25, side: THREE.DoubleSide});
const blackMaterial = new THREE.MeshPhysicalMaterial({color: 0x2a3550,
roughness: 0.5, clearcoat: 0.2, clearcoatRoughness: 0.25, side: THREE.DoubleSide});

function createPieceMesh(piece: Piece){
    const mesh = models.get(piece.type)!.clone();
    const material = piece.color == 'white' ? whiteMaterial : blackMaterial;
    mesh.traverse((child) => {
        if(child instanceof THREE.Mesh){
            child.material = material;
            child.castShadow = false;
        }
    });
    return mesh;
}

const pieceMeshes: (THREE.Object3D | null)[][] = [];

for(let row = 0; row <= 7; row++){
    pieceMeshes.push([]);
    for(let col = 0; col <= 7; col++){
        const piece = board[row][col];
        if(!piece){
            pieceMeshes[row].push(null);
            continue;
        }
        const mesh = createPieceMesh(piece);
        const {x, z} = squareToWorld(row, col);
        mesh.position.set(x, 0.1, z);
        mesh.scale.setScalar(0.8);
        if(piece.color == 'black') mesh.rotation.y = Math.PI;
        // The knight model's head points along -x; turn it to face the opponent.
        if(piece.type == 'knight') mesh.rotation.y = piece.color == 'white' ? -Math.PI / 2 : Math.PI / 2;
        scene.add(mesh);
        pieceMeshes[row].push(mesh);
    }
}

const geometry = new THREE.BoxGeometry(1, 0.2, 1);
const light = new THREE.MeshStandardMaterial({color: 0xeeeed2});
const dark = new THREE.MeshStandardMaterial({color: 0x56647f});

function color(i: number, j: number){
    if((i+j) % 2 == 0){
        return light;
    } else{
        return dark;
    }
}

for(let i = 0; i <= 7; i++){
    for(let j = 0; j <= 7; j++){
        const material = color(i,j);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = i - 3.5;
        mesh.position.z = j - 3.5;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
    }
}

let lastTime = 0;

function animate(time: number){
    const dt = (time - lastTime) / 1000;
    lastTime = time;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
