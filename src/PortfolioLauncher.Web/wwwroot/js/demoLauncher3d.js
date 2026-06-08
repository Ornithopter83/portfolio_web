import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';

let renderer;
let scene;
let camera;
let cube;
let frameId;
let resizeObserver;
let dotNetRef;

export function startDemoLauncher(canvasId) {
    const canvas = document.getElementById(canvasId);

    if (!canvas) {
        return;
    }

    stopDemoLauncher();

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 4);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(2, 3, 4);
    scene.add(keyLight);
    scene.add(new THREE.AmbientLight(0x8ec5ff, 1.2));

    cube = createPlaceholderCube();
    scene.add(cube);

    resizeRenderer(canvas);
    resizeObserver = new ResizeObserver(() => resizeRenderer(canvas));
    resizeObserver.observe(canvas);

    render();
}

export function stopDemoLauncher() {
    if (frameId) {
        cancelAnimationFrame(frameId);
        frameId = undefined;
    }

    resizeObserver?.disconnect();
    resizeObserver = undefined;

    cube?.geometry?.dispose();
    cube?.material?.dispose();
    cube = undefined;

    renderer?.dispose();
    renderer = undefined;
    scene = undefined;
    camera = undefined;
}

export function registerEscapeClose(reference) {
    dotNetRef = reference;
    window.addEventListener('keydown', handleEscape);
}

export function unregisterEscapeClose() {
    window.removeEventListener('keydown', handleEscape);
    dotNetRef = undefined;
}

export async function loadCharacterModel(_url = './models/character.glb') {
    // Future hook: import GLTFLoader here and replace the placeholder cube.
}

function createPlaceholderCube() {
    const geometry = new THREE.BoxGeometry(1.35, 1.35, 1.35);
    const material = new THREE.MeshStandardMaterial({
        color: 0x2dd4bf,
        metalness: 0.35,
        roughness: 0.28
    });

    return new THREE.Mesh(geometry, material);
}

function render() {
    if (!renderer || !scene || !camera || !cube) {
        return;
    }

    cube.rotation.x += 0.01;
    cube.rotation.y += 0.014;
    renderer.render(scene, camera);
    frameId = requestAnimationFrame(render);
}

function resizeRenderer(canvas) {
    const width = Math.max(canvas.clientWidth, 1);
    const height = Math.max(canvas.clientHeight, 1);

    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
}

function handleEscape(event) {
    if (event.key === 'Escape' && dotNetRef) {
        dotNetRef.invokeMethodAsync('CloseFromEscape');
    }
}
