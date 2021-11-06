import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import vertexShader from "./shaders/vertexShader.glsl";
import fragmentShader from "./shaders/fragmentShader.glsl";
import roughnessShader from "./shaders/roughnessFragment.glsl";
import mapShader from "./shaders/mapFragment.glsl";
import normalShader from "./shaders/normalFragment.glsl";
import { GUI } from "lil-gui";

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

const textureLoader = new THREE.TextureLoader();
const earthTexture = textureLoader.load("./world.200411.3x21600x10800.jpg");
const seaTexture = textureLoader.load("./gebco_bathy.5400x2700_8bit.jpg");
const displacementTexture = textureLoader.load(
  "./gebco_08_rev_elev_21600x10800.png"
);
const seaNormal = textureLoader.load("./seaNormal.jpg");

const geometry = new THREE.SphereBufferGeometry(50, 360 * 2, 180 * 2);
const material = new THREE.MeshStandardMaterial({
  map: earthTexture,
  displacementMap: displacementTexture,
  displacementScale: 4.0,
  roughness: 0.5,
});
material.userData = {
  seaTexture: {
    value: seaTexture,
  },
  seaNormal: {
    value: seaNormal,
  },
  uSeaLevel: {
    value: -1538.0,
  },
  uSeaDepthIntensity: {
    value: 0.6,
  },
  uSeaLightColor: {
    value: new THREE.Color(0x7fccea),
  },
  uSeaDarkColor: {
    value: new THREE.Color(0x253e92),
  },
};

material.onBeforeCompile = (shader) => {
  console.log(shader.fragmentShader);
  shader.uniforms.uSeaDepthIntensity = material.userData.uSeaDepthIntensity;
  shader.uniforms.uSeaDarkColor = material.userData.uSeaDarkColor;
  shader.uniforms.uSeaLightColor = material.userData.uSeaLightColor;
  shader.uniforms.uSeaLevel = material.userData.uSeaLevel;
  shader.uniforms.seaTexture = material.userData.seaTexture;
  shader.uniforms.seaNormal = material.userData.seaNormal;
  //prepend the input to the shader
  shader.fragmentShader =
    `uniform sampler2D seaTexture;
uniform float uSeaLevel;
uniform float uSeaDepthIntensity;
uniform sampler2D seaNormal;
uniform vec3 uSeaDarkColor;
uniform vec3 uSeaLightColor;\n` + shader.fragmentShader;
  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <map_fragment>",
    mapShader
  );
  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <roughnessmap_fragment>",
    roughnessShader
  );
  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <normal_fragment_maps>",
    normalShader
  );
};
//GuI
gui.add(material, "metalness").min(0).max(1).step(0.01);
gui.add(material, "roughness").min(0).max(1).step(0.01);
gui.add(material, "displacementScale").min(0).max(20).step(0.01);
gui
  .add(material.userData.uSeaLevel, "value")
  .min(-4000)
  .max(0)
  .step(1)
  .name("uSeaLevel");
gui
  .add(material.userData.uSeaDepthIntensity, "value")
  .min(-3.0)
  .max(5.0)
  .step(0.01)
  .name("uSeaDepthIntensity");
gui.addColor(material.userData.uSeaLightColor, "value").name("uSeaLightColor");
gui.addColor(material.userData.uSeaDarkColor, "value").name("uSeaDarkColor");

const sphere = new THREE.Mesh(geometry, material);
sphere.castShadow = true;
sphere.receiveShadow = true;
scene.add(sphere);

camera.position.z = 100;

const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(150, 0, 150);
pointLight.lookAt(new THREE.Vector3(0, 0, 0));
pointLight.castShadow = true;
pointLight.shadow.camera.near = 90;
pointLight.shadow.camera.far = 210;
pointLight.shadow.normalBias = 0.5;
pointLight.shadow.mapSize.width = 1024 * 2;
pointLight.shadow.mapSize.height = 1024 * 2;

scene.add(pointLight);
const pgui = gui.addFolder("Point Light");
pgui.add(pointLight.position, "x").min(0).max(150).step(0.1);
pgui.add(pointLight.position, "y").min(0).max(150).step(0.1);
pgui.add(pointLight.position, "z").min(0).max(150).step(0.1);
pgui.add(pointLight.shadow.camera, "near").min(0).max(150).step(0.1);
pgui.add(pointLight.shadow.camera, "far").min(0).max(300).step(0.1);

const pLightHelper = new THREE.PointLightHelper(pointLight, 1);
scene.add(pLightHelper);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(sizes.width, sizes.height);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

const clock = new THREE.Clock();
clock.start();

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  clock.getElapsedTime();
  sphere.rotation.y += 0.005;
  pointLight.position.x = 150 * Math.sin(clock.elapsedTime);
  pointLight.position.z = 150 * Math.cos(clock.elapsedTime);
  renderer.render(scene, camera);
}
animate();
