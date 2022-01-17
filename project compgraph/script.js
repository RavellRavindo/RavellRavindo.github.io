import * as THREE from './three.js-master/build/three.module.js';

let camera, scene, renderer; 
let lastTime;
let stack;
let temp;
let gameOver;
const cubeHeight = 2; 
const cubeSize = 2;

const scoreElement = document.getElementById("score");
const startBtnElement = document.getElementById("startBtn");
const gameOverElement = document.getElementById("gameOver");

function init() {
    temp = true;
    gameOver = false;
    lastTime = 0;
    stack = [];

    const ASPECT = window.innerWidth / window.innerHeight;

    camera = new THREE.PerspectiveCamera(45, ASPECT, 1, 100);
    camera.position.set(10, 5, 10);
    camera.lookAt(0, 0, 0);

    // skybox
    const loader2 = new THREE.CubeTextureLoader();
    const texture2 = loader2.load([
    'assets/bay_ft.jpg',
    'assets/bay_bk.jpg',
    'assets/bay_up.jpg',
    'assets/bay_dn.jpg',
    'assets/bay_rt.jpg',
    'assets/bay_lf.jpg',
    ]);

    scene = new THREE.Scene();
    scene.background = texture2;

    // cube awal
    addLayer(0, 0, cubeSize, cubeSize);

    // cube selanjutnya
    addLayer(-20, 0, cubeSize, cubeSize, "x");

    // ambientLight
    const ambientLight = new THREE.AmbientLight(0xffffff,0.6);
    scene.add(ambientLight);

    // directionalLight
    const dirLight = new THREE.DirectionalLight(0xffffff,0.6);
    dirLight.position.set(10, 20, 0);
    scene.add(dirLight);

    // plane
    const loader = new THREE.TextureLoader();
    const texture = loader.load('./assets/rumput.png');
    const geometry = new THREE.PlaneGeometry(100, 100);
    const material = new THREE.MeshPhongMaterial({ map: texture, side: THREE.DoubleSide });
    const plane = new THREE.Mesh(geometry, material);
    plane.position.set(0, -6, 0);
    plane.rotation.set(Math.PI / 2, 0, Math.PI / 3);
    plane.receiveShadow = true;
    scene.add(plane);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animation);
    document.body.appendChild(renderer.domElement);
}

// START GAME function
function startGame() {
    temp = false;
    gameOver = false;
    lastTime = 0;
    stack = [];
 
    if (startBtnElement) startBtnElement.style.display = "none";
    if (gameOverElement) gameOverElement.style.display = "none";
    if (scoreElement) scoreElement.innerText = 0;

    if (scene) {
        // Menghapus Mesh di scene
        while (scene.children.find((c) => c.type == "Mesh")) {
            const mesh = scene.children.find((c) => c.type == "Mesh");
            scene.remove(mesh);
        }

        // cube awal
        addLayer(0, 0, cubeSize, cubeSize);

        // cube selanjutnya
        addLayer(-20, 0, cubeSize, cubeSize, "x");

        // plane geometry
        const loader = new THREE.TextureLoader();
        const texture = loader.load('./assets/rumput.png');
        const geometry = new THREE.PlaneGeometry(100, 100);
        const material = new THREE.MeshPhongMaterial({ map: texture, side: THREE.DoubleSide });
        const plane = new THREE.Mesh(geometry, material);
        plane.position.set(0, -6, 0);
        plane.rotation.set(Math.PI / 2, 0, Math.PI / 3);
        plane.receiveShadow = true;
        scene.add(plane);
    }

    if (camera) {

        camera.position.set(10, 5, 10);
        camera.lookAt(0, 0, 0);
    }
}

// ADDLAYER function
function addLayer(x, z, width, depth, direction) {
    const y = cubeHeight * stack.length; 
    const layer = generateCube(x, y, z, width, depth);
    layer.direction = direction;

    stack.push(layer);
}

// GENERATECUBE function
function generateCube(x, y, z, width, depth) {
    const geometry = new THREE.BoxGeometry(width, cubeHeight, depth);
    const color = THREE.MathUtils.randInt(0, 0xffffff)
    const material = new THREE.MeshLambertMaterial({ color: color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);

    scene.add(mesh);

    return {
        threejs: mesh,
        width,
        depth
    };
}

window.addEventListener("mousedown", eventHandler);
window.addEventListener("keydown", function(event) {
    if (event.key == "R" || event.key == "r") {
        event.preventDefault();
        startGame();
        return;
    }
});

// EVENTHANDLER function
function eventHandler() {
    if (temp) startGame();
    else overlap();
  }
  
// OVERLAP function
function overlap() {
    if (gameOver) return;
  
    const topLayer = stack[stack.length - 1];
    const previousLayer = stack[stack.length - 2];
    const direction = topLayer.direction;
    const size = direction == "x" ? topLayer.width : topLayer.depth;
    const delta = topLayer.threejs.position[direction] - previousLayer.threejs.position[direction];
    const overhangSize = Math.abs(delta);
    const overlapSize = size - overhangSize;
  
    if (overlapSize > 0) {

      const directionX = direction == "x" ? topLayer.threejs.position.x : -10;
      const directionZ = direction == "z" ? topLayer.threejs.position.z : -10;
      const nextDirection = direction == "x" ? "z" : "x";
  
      if (scoreElement) scoreElement.innerText = stack.length - 1;
      addLayer(directionX, directionZ, cubeSize, cubeSize, nextDirection);
    } else {
      gameOver = true;
      if (gameOverElement && !temp) gameOverElement.style.display = "flex";
    }
  }

// ANIMATION function
function animation(time) {
    if (lastTime) {
        const timePassed = time - lastTime;
        const speed = 0.030;

        const topLayer = stack[stack.length - 1];
        const previousLayer = stack[stack.length - 2];

        const cubeMove = !gameOver && (!temp || (temp && topLayer.threejs.position[topLayer.direction] < previousLayer.threejs.position[topLayer.direction]));
                
        if (cubeMove) {
    
            topLayer.threejs.position[topLayer.direction] += speed * timePassed;
            if (topLayer.threejs.position[topLayer.direction] > 10) {
                gameOver = true;
                if (gameOverElement && !temp) gameOverElement.style.display = "flex";
            }
        } else {
            if (temp) {
                overlap();
              }
        }

        if (camera.position.y < cubeHeight * (stack.length - 4) + 6) {
            camera.position.y += speed * timePassed;
        }
        renderer.render(scene, camera);
    }
    lastTime = time;
}

window.addEventListener("resize", () => {
    const aspect = window.innerWidth / window.innerHeight;
    const width = 10;
    const height = width / aspect;

    camera.top = height / 2;
    camera.bottom = height / -2;

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.render(scene, camera);
});

window.onload = () => {
    init();
}