import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import vertexShader from "./shaders/plane/vertexShader.glsl";
import fragmentShader from "./shaders/plane/fragmentShader.glsl";

import { GUI } from "lil-gui";

const clock = new THREE.Clock();
clock.start();
const gui = new GUI();

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

//Handle Resize
window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  //Update Camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  //Update Renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  1000
);
scene.add(camera);
camera.position.z = 30;

// const ambientLight = new THREE.AmbientLight(0xffffff, 1);
// scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(0, 0, 150);
// pointLight.lookAt(new THREE.Vector3(0, 0, 0));
// pointLight.castShadow = true;
// pointLight.shadow.camera.near = 90;
// pointLight.shadow.camera.far = 210;
// pointLight.shadow.normalBias = 0.5;
// pointLight.shadow.mapSize.width = 1024 * 2;
// pointLight.shadow.mapSize.height = 1024 * 2;

scene.add(pointLight);

const planeGeometry = new THREE.PlaneBufferGeometry(40, 40, 80, 80);
const planeMaterial = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  side: THREE.DoubleSide,
  transparent: true,
  uniforms: {
    uTime: {
      value: clock.elapsedTime,
    },
  },
});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
// plane.position.y = -5;
// plane.rotation.x = Math.PI / 2;
scene.add(plane);
console.log(plane);

// const pgui = gui.addFolder("Point Light");
// pgui.add(pointLight.position, "x").min(0).max(150).step(0.1);
// pgui.add(pointLight.position, "y").min(0).max(150).step(0.1);
// pgui.add(pointLight.position, "z").min(0).max(150).step(0.1);
// pgui.add(pointLight.shadow.camera, "near").min(0).max(150).step(0.1);
// pgui.add(pointLight.shadow.camera, "far").min(0).max(300).step(0.1);

// const pLightHelper = new THREE.PointLightHelper(pointLight, 1);
// scene.add(pLightHelper);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
// renderer.shadowMap.enabled = true;
// renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  clock.getElapsedTime();
  planeMaterial.uniforms.uTime.value = clock.elapsedTime;
  renderer.render(scene, camera);
}
animate();
