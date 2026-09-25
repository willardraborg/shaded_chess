import * as THREE from 'three'; 
import './style.css';
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, 
                                window.innerWidth / window.innerHeight,
                                0.1, 100);
const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
camera.position.z = 5;

const geometry = new THREE.BoxGeometry(1,1,1);
const material = new THREE.MeshNormalMaterial();
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

let lastTime = 0;
const speed = 1;

function animate(time: number){
    const dt = (time - lastTime) / 1000;
    lastTime = time;
    cube.rotation.x += speed * dt;
    cube.rotation.y += speed * dt;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
requestAnimationFrame(animate);


