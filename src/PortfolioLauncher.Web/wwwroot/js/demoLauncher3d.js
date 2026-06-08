import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/loaders/GLTFLoader.js';

let renderer;
let scene;
let camera;
let cube;
let character;
let mixer;
let clock;
let frameId;
let resizeObserver;
let dotNetRef;
let walkUntil = 0;
let walkStart = 0;
let walkBones = {};

export async function startDemoLauncher(canvasId) {
    const canvas = document.getElementById(canvasId);

    if (!canvas) {
        return;
    }

    stopDemoLauncher();

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 1.2, 5.2);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(2, 3, 4);
    scene.add(keyLight);
    scene.add(new THREE.AmbientLight(0x8ec5ff, 1.35));

    const fillLight = new THREE.DirectionalLight(0x7dd3fc, 1.2);
    fillLight.position.set(-3, 2, 2);
    scene.add(fillLight);

    clock = new THREE.Clock();
    await loadCharacterModel('./models/witch.glb');

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

    mixer = undefined;
    clock = undefined;
    walkUntil = 0;
    walkStart = 0;
    walkBones = {};

    if (character) {
        disposeObject(character);
        character = undefined;
    }

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

export async function loadCharacterModel(url = './models/witch.glb') {
    const loader = new GLTFLoader();

    try {
        const gltf = await loader.loadAsync(url);
        character = gltf.scene;
        prepareCharacter(character);
        scene.add(character);

        if (gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(character);
            const walkClip = findClip(gltf.animations, ['walk', 'run', 'move']);
            if (walkClip) {
                const action = mixer.clipAction(walkClip);
                action.play();
                action.paused = true;
                character.userData.walkAction = action;
            }
        }
    } catch {
        cube = createPlaceholderCube();
        scene.add(cube);
    }
}

export function playDemoAction(_demoKey) {
    const now = performance.now() / 1000;
    walkStart = now;
    walkUntil = now + 1.8;

    const action = character?.userData?.walkAction;
    if (action) {
        action.reset();
        action.paused = false;
        action.play();
    }
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
    if (!renderer || !scene || !camera) {
        return;
    }

    const delta = clock?.getDelta() ?? 0.016;
    mixer?.update(delta);

    if (cube) {
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.014;
    }

    updateProceduralWalk();
    renderer.render(scene, camera);
    frameId = requestAnimationFrame(render);
}

function prepareCharacter(model) {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const targetHeight = 3;
    const scale = targetHeight / Math.max(size.y, 0.001);

    model.scale.setScalar(scale);
    model.position.set(-center.x * scale, -box.min.y * scale - 1.45, -center.z * scale);
    model.rotation.y = Math.PI * 0.08;

    model.traverse((node) => {
        if (node.isMesh) {
            node.frustumCulled = false;
        }

        if (node.isBone) {
            walkBones[node.name] = node;
            node.userData.baseRotation = node.rotation.clone();
        }
    });
}

function updateProceduralWalk() {
    if (!character || !walkUntil) {
        return;
    }

    const now = performance.now() / 1000;
    const active = now < walkUntil;
    const progress = Math.min(Math.max((now - walkStart) / Math.max(walkUntil - walkStart, 0.001), 0), 1);
    const fade = active ? Math.sin(progress * Math.PI) : 0;
    const step = Math.sin(now * 9.5) * fade;
    const counterStep = Math.sin(now * 9.5 + Math.PI) * fade;

    setBoneRotation('J_Bip_L_UpperLeg', step * 0.42, 0, 0);
    setBoneRotation('J_Bip_R_UpperLeg', counterStep * 0.42, 0, 0);
    setBoneRotation('J_Bip_L_LowerLeg', Math.max(counterStep, 0) * 0.5, 0, 0);
    setBoneRotation('J_Bip_R_LowerLeg', Math.max(step, 0) * 0.5, 0, 0);
    setBoneRotation('J_Bip_L_UpperArm', counterStep * 0.28, 0, 0);
    setBoneRotation('J_Bip_R_UpperArm', step * 0.28, 0, 0);

    character.position.y += (Math.abs(step) * 0.025 * fade) - (character.userData.lastWalkBob ?? 0);
    character.userData.lastWalkBob = Math.abs(step) * 0.025 * fade;
    character.rotation.z = step * 0.025;

    if (!active) {
        resetWalkPose();
        walkUntil = 0;
    }
}

function setBoneRotation(name, x, y, z) {
    const bone = walkBones[name];

    if (!bone?.userData.baseRotation) {
        return;
    }

    bone.rotation.set(
        bone.userData.baseRotation.x + x,
        bone.userData.baseRotation.y + y,
        bone.userData.baseRotation.z + z
    );
}

function resetWalkPose() {
    Object.values(walkBones).forEach((bone) => {
        if (bone.userData.baseRotation) {
            bone.rotation.copy(bone.userData.baseRotation);
        }
    });

    if (character) {
        character.position.y -= character.userData.lastWalkBob ?? 0;
        character.userData.lastWalkBob = 0;
        character.rotation.z = 0;
        character.userData.walkAction?.stop();
    }
}

function findClip(clips, names) {
    return clips.find((clip) => names.some((name) => clip.name.toLowerCase().includes(name)));
}

function disposeObject(object) {
    object.traverse((child) => {
        child.geometry?.dispose?.();

        if (Array.isArray(child.material)) {
            child.material.forEach((material) => material.dispose?.());
        } else {
            child.material?.dispose?.();
        }
    });
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
