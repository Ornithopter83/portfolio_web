import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

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
let animationActions = {};
let activeAction;
let pressedKeys = new Set();
let castingUntil = 0;

const moveSpeed = 1.35;
const modelForwardOffset = Math.PI;
const movementBounds = {
    minX: -1.7,
    maxX: 1.7,
    minZ: -1.15,
    maxZ: 1.15
};

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
    animationActions = {};
    activeAction = undefined;
    pressedKeys.clear();
    castingUntil = 0;

    window.removeEventListener('keydown', handleDemoKeyDown);
    window.removeEventListener('keyup', handleDemoKeyUp);

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
    window.addEventListener('keydown', handleDemoKeyDown);
    window.addEventListener('keyup', handleDemoKeyUp);
}

export function unregisterEscapeClose() {
    window.removeEventListener('keydown', handleEscape);
    window.removeEventListener('keydown', handleDemoKeyDown);
    window.removeEventListener('keyup', handleDemoKeyUp);
    dotNetRef = undefined;
    pressedKeys.clear();
}

export async function loadCharacterModel(url = './models/witch.glb') {
    const loader = new GLTFLoader();

    try {
        const gltf = await loader.loadAsync(url);
        character = gltf.scene;
        prepareCharacter(character);
        scene.add(character);

        setupAnimationActions(gltf.animations);
    } catch {
        cube = createPlaceholderCube();
        scene.add(cube);
    }
}

export function playDemoAction(_demoKey) {
    startCasting();
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

    updateKeyboardMovement(delta);
    updateProceduralWalk();
    updateActionState();
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
    model.rotation.y = modelForwardOffset;

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

function setupAnimationActions(clips) {
    if (!clips.length) {
        return;
    }

    mixer = new THREE.AnimationMixer(character);
    animationActions = {
        idle: createAction(findClip(clips, ['Idle', 'idle', 'stand', 'wait'])),
        walk: createAction(findClip(clips, ['Walk', 'walk', 'run', 'move'])),
        cast: createAction(findClip(clips, ['Cast_01', 'cast', 'spell', 'magic', 'attack']))
    };

    if (animationActions.cast) {
        animationActions.cast.loop = THREE.LoopOnce;
        animationActions.cast.clampWhenFinished = true;
    }

    if (animationActions.idle) {
        playAction(animationActions.idle, 0);
    }
}

function createAction(clip) {
    return clip ? mixer.clipAction(clip) : undefined;
}

function playAction(action, fadeSeconds = 0.15) {
    if (!action || activeAction === action) {
        return;
    }

    const previousAction = activeAction;
    activeAction = action;
    action.enabled = true;
    action.paused = false;
    action.reset();
    action.play();

    if (previousAction && fadeSeconds > 0) {
        previousAction.crossFadeTo(action, fadeSeconds, false);
    }
}

function updateKeyboardMovement(delta) {
    if (!character) {
        return;
    }

    const direction = new THREE.Vector3(
        (isPressed('d') ? 1 : 0) - (isPressed('a') ? 1 : 0),
        0,
        (isPressed('s') ? 1 : 0) - (isPressed('w') ? 1 : 0)
    );

    if (direction.lengthSq() === 0 || isCasting()) {
        return;
    }

    direction.normalize();
    character.position.x = THREE.MathUtils.clamp(
        character.position.x + direction.x * moveSpeed * delta,
        movementBounds.minX,
        movementBounds.maxX
    );
    character.position.z = THREE.MathUtils.clamp(
        character.position.z + direction.z * moveSpeed * delta,
        movementBounds.minZ,
        movementBounds.maxZ
    );
    character.rotation.y = Math.atan2(direction.x, direction.z) + modelForwardOffset;

    if (animationActions.walk) {
        playAction(animationActions.walk);
    } else {
        startProceduralWalk(0.2);
    }
}

function updateActionState() {
    if (!character) {
        return;
    }

    if (isCasting()) {
        return;
    }

    const moving = isPressed('w') || isPressed('a') || isPressed('s') || isPressed('d');
    if (moving && animationActions.walk) {
        playAction(animationActions.walk);
        return;
    }

    if (!moving && animationActions.idle) {
        playAction(animationActions.idle);
    }
}

function startCasting() {
    castingUntil = performance.now() / 1000 + 1.2;
    pressedKeys.clear();

    if (animationActions.cast) {
        playAction(animationActions.cast, 0.08);
        return;
    }

    startProceduralCast();
}

function isCasting() {
    return performance.now() / 1000 < castingUntil;
}

function startProceduralWalk(durationSeconds) {
    const now = performance.now() / 1000;
    walkStart = now;
    walkUntil = Math.max(walkUntil, now + durationSeconds);
}

function startProceduralCast() {
    startProceduralWalk(0.55);
    setBoneRotation('J_Bip_L_UpperArm', -0.75, 0, 0.25);
    setBoneRotation('J_Bip_R_UpperArm', -0.75, 0, -0.25);
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
        animationActions.walk?.stop();
    }
}

function findClip(clips, names) {
    const exactMatch = clips.find((clip) => names.some((name) => clip.name === name));

    if (exactMatch) {
        return exactMatch;
    }

    return clips.find((clip) => names.some((name) => clip.name.toLowerCase().includes(name.toLowerCase())));
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

function handleDemoKeyDown(event) {
    const key = event.key.toLowerCase();

    if (['w', 'a', 's', 'd', 'enter'].includes(key)) {
        event.preventDefault();
    }

    if (key === 'enter') {
        startCasting();
        return;
    }

    if (['w', 'a', 's', 'd'].includes(key)) {
        pressedKeys.add(key);
    }
}

function handleDemoKeyUp(event) {
    pressedKeys.delete(event.key.toLowerCase());
}

function isPressed(key) {
    return pressedKeys.has(key);
}
