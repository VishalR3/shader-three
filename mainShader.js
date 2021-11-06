import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import vertexShader from "./shaders/vertexShader.glsl";
import fragmentShader from "./shaders/fragmentShader.glsl";
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

const geometry = new THREE.SphereBufferGeometry(50, 360, 180);
const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    earthTexture: {
      value: earthTexture,
    },
    displacementTexture: {
      value: displacementTexture,
    },
    seaTexture: {
      value: seaTexture,
    },
    uSeaLevel: {
      value: -1538.0,
    },
    uHeightScale: {
      value: 4.0,
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
  },
});
//GuI
gui
  .add(material.uniforms.uSeaLevel, "value")
  .min(-4000.0)
  .max(0.0)
  .step(1.0)
  .name("uSeaLevel");
gui
  .add(material.uniforms.uHeightScale, "value")
  .min(-10.0)
  .max(30.0)
  .step(0.1)
  .name("uHeightScale");
gui
  .add(material.uniforms.uSeaDepthIntensity, "value")
  .min(-3.0)
  .max(5.0)
  .step(0.01)
  .name("uSeaDepthIntensity");
gui.addColor(material.uniforms.uSeaLightColor, "value").name("uSeaLightColor");
gui.addColor(material.uniforms.uSeaDarkColor, "value").name("uSeaDarkColor");

const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

camera.position.z = 100;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(sizes.width, sizes.height);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  sphere.rotation.y += 0.005;
  renderer.render(scene, camera);
}
animate();
