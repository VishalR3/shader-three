import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import roughnessShader from "./shaders/roughnessFragment.glsl";
import mapShader from "./shaders/mapFragment.glsl";
// import normalShader from "./shaders/normalFragment.glsl";
import vertexShader from "./shaders/vertexShader.glsl";
import fragmentShader from "./shaders/fragmentShader.glsl";
import gsap from "gsap";
// import { GUI } from "lil-gui";

const clock = new THREE.Clock();
clock.start();
// const gui = new GUI();
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};
let PARAMS = {
  pointR: 150,
  pointTheta: Math.PI / 2,
  pointSi: Math.PI / 2,
  ambientLightIntensity: 0.15,
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

// Generate Clouds

const cloudGroup = new THREE.Group();

const generateClouds = () => {
  let cGem = new THREE.SphereBufferGeometry(1, 8, 8);
  let cMat = new THREE.MeshPhongMaterial({
    color: 0xdddddd,
  });
  let cloudCount = 50;
  let shapeCount = 500;
  for (let i = 0; i < cloudCount; i++) {
    let si = Math.random() * 2 * Math.PI;
    let theta = Math.random() * Math.PI;
    let center = new THREE.Vector3(
      60 * Math.sin(theta) * Math.sin(si),
      60 * Math.cos(theta),
      60 * Math.sin(theta) * Math.cos(si)
    );
    for (let j = 0; j < Math.floor(Math.random() * shapeCount); j++) {
      let cMesh = new THREE.Mesh(cGem, cMat);
      // cMesh.castShadow = true;
      cMesh.position.x =
        53 *
        Math.sin(theta + (Math.random() - 0.5) * 0) *
        Math.sin(si + (Math.random() - 0.5) * 0.1);
      cMesh.position.y = 53 * Math.cos(theta + (Math.random() - 0.5) * 0.1);
      cMesh.position.z =
        53 *
        Math.sin(theta + (Math.random() - 0.5) * 0.1) *
        Math.cos(si + (Math.random() - 0.5) * 0.1);

      // scene.add(cMesh);
      cloudGroup.add(cMesh);
    }
  }
};

const scene = new THREE.Scene();
// scene.add(cloudGroup);
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  1000
);
scene.add(camera);

//Lights
const ambientLight = new THREE.AmbientLight(
  0xffffff,
  PARAMS.ambientLightIntensity
);
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
//Sun
const sunGeometry = new THREE.SphereBufferGeometry(10);
const sunMaterial = new THREE.MeshStandardMaterial({
  color: 0xfc9601,
  emissive: 0xfc9601,
  emissiveIntensity: 1,
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

//Point Light GUI
// const pgui = gui.addFolder("Point Light");
// pgui.add(PARAMS, "ambientLightIntensity").min(0).max(1).step(0.01);
// pgui.add(PARAMS, "pointR").min(0).max(300).step(1);
// pgui.add(PARAMS, "pointTheta").min(0).max(Math.PI).step(0.001);
// pgui
//   .add(PARAMS, "pointSi")
//   .min(0)
//   .max(Math.PI * 2)
//   .step(0.001);
// pgui.add(pointLight.shadow.camera, "near").min(0).max(150).step(0.1);
// pgui.add(pointLight.shadow.camera, "far").min(0).max(300).step(0.1);
// pgui.add(sunMaterial, "emissiveIntensity").min(0).max(500).step(1);
// pgui.addColor(sunMaterial, "color");

//Objects
const textureLoader = new THREE.TextureLoader();
const seaTexture = textureLoader.load("./gebco_bathy.5400x2700_8bit.jpg");

const earthTexture = textureLoader.load("./world.200411.3x5400x2700.jpg");
const displacementTexture = textureLoader.load(
  "./gebco_08_rev_elev_5400x2700.png"
);
const planetRadius = 50;
const atmRadius = 60;
const geometry = new THREE.SphereBufferGeometry(planetRadius, 360 * 2, 180 * 2);
const material = new THREE.MeshStandardMaterial({
  map: earthTexture,
  displacementMap: displacementTexture,
  displacementScale: 4.0,
  roughness: 0.5,
});
// const material = new THREE.MeshStandardMaterial({
//   map: seaTexture,
//   displacementMap: seaTexture,
//   displacementScale: 4.0,
//   roughness: 0.5,
// });
material.userData = {
  seaTexture: {
    value: seaTexture,
  },
  // seaNormal: {
  //   value: seaNormal,
  // },
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
  shader.uniforms.uSeaDepthIntensity = material.userData.uSeaDepthIntensity;
  shader.uniforms.uSeaDarkColor = material.userData.uSeaDarkColor;
  shader.uniforms.uSeaLightColor = material.userData.uSeaLightColor;
  shader.uniforms.uSeaLevel = material.userData.uSeaLevel;
  shader.uniforms.seaTexture = material.userData.seaTexture;

  //prepend the input to the shader
  shader.fragmentShader =
    `uniform sampler2D seaTexture;
uniform float uSeaLevel;
uniform float uSeaDepthIntensity;
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
};
//GuI
// gui.add(material, "metalness").min(0).max(1).step(0.01);
// gui.add(material, "roughness").min(0).max(1).step(0.01);
// gui.add(material, "displacementScale").min(0).max(20).step(0.01);
// gui
//   .add(material.userData.uSeaLevel, "value")
//   .min(-4000)
//   .max(0)
//   .step(1)
//   .name("uSeaLevel");
// gui
//   .add(material.userData.uSeaDepthIntensity, "value")
//   .min(-3.0)
//   .max(5.0)
//   .step(0.01)
//   .name("uSeaDepthIntensity");
// gui.addColor(material.userData.uSeaLightColor, "value").name("uSeaLightColor");
// gui.addColor(material.userData.uSeaDarkColor, "value").name("uSeaDarkColor");

const sphere = new THREE.Mesh(geometry, material);
sphere.castShadow = true;
sphere.receiveShadow = true;
scene.add(sphere);

//Camera Responsiveness
camera.position.z = 100;
if (window.innerWidth < 500) {
  gsap.to(camera.position, {
    duration: 5,
    z: 160,
  });
  gsap.to(PARAMS, {
    duration: 5,
    pointR: 170,
  });
}

// generateClouds();
// scene.add(cloudGroup);

const atmGeometry = new THREE.SphereBufferGeometry(atmRadius, 36 * 5, 18 * 5);
const atmMaterial = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  transparent: true,
  uniforms: {
    uTime: {
      value: clock.elapsedTime,
    },
    planetCentre: {
      value: sphere.position,
    },
    atmRadius: {
      value: atmRadius,
    },
    planetRadius: {
      value: planetRadius,
    },
    tDepth: {
      value: null,
    },
    tDiffuse: {
      value: null,
    },
    cameraNear: { value: camera.near },
    cameraFar: { value: camera.far },
    numInScatteringPoints: { value: 10.0 },
    numOpticalDepthPoints: { value: 10.0 },
    densityFallOff: {
      value: 4.0,
    },
    lightsPosition: {
      value: pointLight.position,
    },
    scatteringStrength: {
      value: 3.8,
    },
    displacementTexture: {
      value: displacementTexture,
    },
  },
});
const atmosphere = new THREE.Mesh(atmGeometry, atmMaterial);
scene.add(atmosphere);

// Atmosphere GUI
// const atmGui = gui.addFolder("Atmosphere");
// atmGui
//   .add(atmMaterial.uniforms.atmRadius, "value")
//   .min(45)
//   .max(100)
//   .step(0.1)
//   .name("Atmosphere Radius");
// atmGui
//   .add(atmMaterial.uniforms.numInScatteringPoints, "value")
//   .min(1)
//   .max(40)
//   .step(1)
//   .name("numScatteringPoints");
// atmGui
//   .add(atmMaterial.uniforms.numOpticalDepthPoints, "value")
//   .min(1)
//   .max(40)
//   .step(1)
//   .name("numOpticalDepthPoints");
// atmGui
//   .add(atmMaterial.uniforms.densityFallOff, "value")
//   .min(-20)
//   .max(40)
//   .step(0.1)
//   .name("DensityFallOff");
// atmGui
//   .add(atmMaterial.uniforms.scatteringStrength, "value")
//   .min(-10)
//   .max(50)
//   .step(0.1)
//   .name("scatteringStrength");

//Stars

generateStars();
// generateClouds();

const renderer = new THREE.WebGLRenderer({
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  // preCamera.position.copy(camera.position);
  // preCamera.rotation.copy(camera.rotation);
  clock.getElapsedTime();
  sphere.rotation.y += 0.005;
  // cloudGroup.rotation.y -= 0.01;
  // cloudGroup.rotation.x += 0.005;
  // cloudGroup.rotation.z += 0.005;
  PARAMS.pointTheta += clock.elapsedTime * 0.0005;
  PARAMS.pointSi += clock.elapsedTime * 0.00000005;
  pointLight.position.x =
    PARAMS.pointR * Math.cos(PARAMS.pointSi) * Math.sin(PARAMS.pointTheta);
  pointLight.position.y = PARAMS.pointR * Math.cos(PARAMS.pointTheta);
  pointLight.position.z =
    PARAMS.pointR * Math.sin(PARAMS.pointSi) * Math.sin(PARAMS.pointTheta);
  ambientLight.intensity = PARAMS.ambientLightIntensity;
  sun.position.copy(pointLight.position);
  atmMaterial.uniforms.lightsPosition.value = pointLight.position;
  // atmMaterial.uniforms.tDiffuse.value = target.texture;
  // atmMaterial.uniforms.tDepth.value = target.depthTexture;
  renderer.render(scene, camera);
}
animate();

// function setupRenderTarget() {
//   if (target) target.dispose();
//   target = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
//   target.texture.format = THREE.RGBFormat;
//   target.texture.minFilter = THREE.NearestFilter;
//   target.texture.magFilter = THREE.NearestFilter;
//   target.texture.generateMipmaps = false;
//   target.stencilBuffer = false;
//   target.depthBuffer = true;
//   target.depthTexture = new THREE.DepthTexture();
//   target.depthTexture.format = THREE.DepthFormat;
// }
// function setupPre() {
//   // Setup pre processing stage
//   preCamera = new THREE.PerspectiveCamera(
//     75,
//     sizes.width / sizes.height,
//     0.1,
//     1000
//   );
//   preCamera.position.z = 100;
//   preScene = new THREE.Scene();
//   preScene.add(sphere);
//   preScene.add(ambientLight);
// }

function generateStars() {
  const starsGeometry = new THREE.SphereBufferGeometry(1);
  const starsMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
  });
  let starsCount = 500;
  for (let i = 0; i < starsCount; i++) {
    let si = Math.random() * 2 * Math.PI;
    let theta = Math.random() * Math.PI;
    let center = new THREE.Vector3(
      1000 * Math.sin(theta) * Math.sin(si),
      1000 * Math.cos(theta),
      1000 * Math.sin(theta) * Math.cos(si)
    );
    // let center = new THREE.Vector3(
    //   Math.random() * 500 - 250,
    //   Math.random() * 500 - 250,
    //   -(Math.random() * 500 + 250)
    // );
    let starMesh = new THREE.Mesh(starsGeometry, starsMaterial);
    starMesh.position.copy(center);
    scene.add(starMesh);
  }
}
