import * as THREE from 'three';
import './style.css';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);
camera.position.set(0,8,8);
camera.lookAt(0,0,0);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(5, 10, 7);
dirLight.castShadow = true;
scene.add(dirLight);

const geometry = new THREE.BoxGeometry(1, 0.2, 1);
const light = new THREE.MeshStandardMaterial({color: 0xeeeed2});
const dark = new THREE.MeshStandardMaterial({color: '#4287f5'});

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
