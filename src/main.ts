import * as THREE from 'three'; 
import './style.css';
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, 
                                window.innerWidth / window.innerHeight,
                                0.1, 100);
const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
camera.position.set(0,8,8);
camera.lookAt(0,0,0);

let lastTime = 0;

const geometry = new THREE.BoxGeometry(1, 0.2, 1);
const light    = new THREE.MeshBasicMaterial({color: 0xeeeed2});
const dark     = new THREE.MeshBasicMaterial({color: 0x769656});

function color(i: number, j: number){
    if((i + j) % 2 == 0){
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
        scene.add(mesh);
    }
}

function animate(time: number){
    const dt = (time - lastTime) / 1000;
    lastTime = time;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
requestAnimationFrame(animate);


