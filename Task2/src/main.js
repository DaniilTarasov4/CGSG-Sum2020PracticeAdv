import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import particleVertex from './particle.vert';
import particleFragment from './particle.frag';
import heightmapVertex from './heightmap.vert';
import heightmapFragment from './heightmap.frag';

import heightmap from '../bin/landscape/heightmap2.jpg';
import dirt from '../bin/landscape/dirt-512.jpg';
import sand from '../bin/landscape/sand-512.jpg';
import grass from '../bin/landscape/grass-512.jpg';
import rock from '../bin/landscape/rock-512.jpg';
import snow from '../bin/landscape/snow-512.jpg';
import watertex from '../bin/landscape/water-512.jpg';
import particle from '../bin/cloud.png';

import './styles.css';

let container, stats, controls;
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
let scene;
let renderer;
const meshes = [];
// let lamp1;
let time;
let angle = 0;
let speed = 0;
let PressedKeys = {};
const Canvas = document.getElementById('Canvas');
let Model;
let HeightData;
let Mesh;
let Light;
const exhaust = [];
const numOfParticles = 50;
let CameraTarget;

const clock = new THREE.Clock();

window.addEventListener('resize', onWindowResize, false);
document.addEventListener('resize', onWindowResize, false);

function KeyDown (event) {
  if (PressedKeys === undefined) {
    PressedKeys = {};
  }
  PressedKeys[event.keyCode] = true;
}

function KeyUp (event) {
  if (PressedKeys === undefined) {
    PressedKeys = {};
  }
  PressedKeys[event.keyCode] = false;
}

function GetKey (key) {
  return PressedKeys[key];
}

function Control () {
  if (time % 1 === 0) {
    return;
  }
  if (GetKey(87)) {
    if (GetKey(65)) {
      if (angle === undefined) {
        angle = 0;
      }
      angle += 0.01;
      ModelRotate(angle);
    } else {
      if (GetKey(68)) {
        if (angle === undefined) {
          angle = 0;
        }
        angle -= 0.01;
        ModelRotate(angle);
      }
    }
    if (angle === undefined) {
      angle = 0;
    }
    if (speed < 0) {
      speed += 0.005;
    }
    speed += 0.001;
    WheelsRotate(0.2);
  } else {
    if (GetKey(83)) {
      if (GetKey(68)) {
        if (angle === undefined) {
          angle = 0;
        }
        angle += 0.01;
        ModelRotate(angle);
      } else {
        if (GetKey(65)) {
          if (angle === undefined) {
            angle = 0;
          }
          angle -= 0.01;
          ModelRotate(angle);
        }
      }
      if (angle === undefined) {
        angle = 0;
      }
      if (speed > 0) {
        speed -= 0.005;
      }
      speed -= 0.001;
      WheelsRotate(-0.2);
    } else {
      if (speed === 0) {
        return;
      }
      if (Math.abs(speed) < 0.07) {
        speed = 0;
        return;
      }
      if (speed > 0) {
        if (GetKey(65)) {
          if (angle === undefined) {
            angle = 0;
          }
          angle += 0.01;
          ModelRotate(angle);
        } else {
          if (GetKey(68)) {
            if (angle === undefined) {
              angle = 0;
            }
            angle -= 0.01;
            ModelRotate(angle);
          }
        }
        speed -= 0.005;
      } else {
        if (GetKey(68)) {
          if (angle === undefined) {
            angle = 0;
          }
          angle += 0.01;
          ModelRotate(angle);
        } else {
          if (GetKey(65)) {
            if (angle === undefined) {
              angle = 0;
            }
            angle -= 0.01;
            ModelRotate(angle);
          }
        }
        speed += 0.005;
      }
    }
  }
  ModelMove(Math.sin(angle) * speed, Math.cos(angle) * speed);
}

function WheelsRotate (deg) {
  meshes[14].rotation.x += deg;
  meshes[17].rotation.x += deg;
  meshes[18].rotation.x += deg;
  meshes[21].rotation.x += deg;
  meshes[22].rotation.x += deg;
  meshes[25].rotation.x += deg;
  meshes[26].rotation.x += deg;
  meshes[29].rotation.x += deg;
}

function ModelRotate (deg) {
  Model.scene.rotation.y = deg;
}

function ModelMove (p1, p2) {
  Model.scene.position.x += p1;
  camera.position.x += p1;
  Model.scene.position.z += p2;
  camera.position.z += p2;

  ModelUpdate();
}

function GetLandPos (p1, p2) {
  return 2048 * (1024 + p2) + 1024 + p1;
}

function GetAngle (vec1, vec2) {
  const t = vec1.x * vec2.x + vec1.y * vec2.y + vec1.z * vec2.z;
  const a = t / (vec1.length() * vec2.length());

  return Math.acos(a);
}

// Fix it
function ModelUpdate () {
  if (HeightData === undefined) {
    return;
  }

  const Pos = Model.scene.position;
  const PosX = Pos.x;
  const PosZ = Pos.z;
  const Dx = Math.abs(PosX % 1);
  const Dz = Math.abs(PosZ % 1);
  let val =
  HeightData[GetLandPos(Math.floor(PosX), Math.floor(PosZ))] * Dx * Dz +
  HeightData[GetLandPos(Math.floor(PosX), Math.ceil(PosZ))] * Dx * (1 - Dz) +
  HeightData[GetLandPos(Math.ceil(PosX), Math.floor(PosZ))] * (1 - Dx) * Dz +
  HeightData[GetLandPos(Math.ceil(PosX), Math.ceil(PosZ))] * (1 - Dx) * (1 - Dz);
  val *= 3;

  const d = Model.scene.position.y - val;

  Model.scene.position.y = val;
  camera.position.y -= d;
}

function onWindowResize () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  Canvas.width = window.innerWidth;
  Canvas.height = window.innerHeight;

  animate();
}

function ParticleInit (place, name, x, y, z) {
  const prtTexture = new THREE.TextureLoader().load(name);
  prtTexture.wrapS = prtTexture.wrapT = THREE.RepeatWrapping;

  for (let i = 0; i < numOfParticles; i++) {
    const uniforms = {
      prtTexture: { type: 't', value: prtTexture },
      alpha: { type: 'f', value: 0.0 }
    };
    const material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: particleVertex,
      fragmentShader: particleFragment,
      side: THREE.DoubleSide
    });
    material.depthWrite = false;
    material.transparent = true;
    const cloud = new THREE.Sprite(material);
    cloud.position.x = x;
    cloud.position.y = y;
    cloud.position.z = z;
    cloud.material.opacity = Math.random() / 10;
    place.push(cloud);
    scene.add(cloud);
  }
}

// Add lamps
function ModelLoad () {
  const loader = new GLTFLoader();
  loader.load('../bin/scene.gltf', function (object) {
    Model = object;

    Model.scene.traverse(function (object) {
      if (object.isMesh) {
        meshes.push(object);
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    scene.add(Model.scene);
    Model.castShadow = true;
    Model.recieveShadow = true;
    ModelUpdate();
    ParticleInit(exhaust, particle, 1.2, 0.7, -0.7);
  }, undefined, function (error) {
    alert(error);
  });
}

function GenerateLandscape () {
  const loader = new THREE.ImageLoader();

  loader.load(heightmap, function (img) {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 2048;
    const context = canvas.getContext('2d');
    const size = 2048 * 2048;
    const data = new Float32Array(size);

    context.drawImage(img, 0, 0);

    for (let i = 0; i < size; i++) {
      data[i] = 0;
    }

    const imgd = context.getImageData(0, 0, 2048, 2048);
    const pix = imgd.data;

    let k = 0;
    for (let i = 0, n = pix.length; i < n; i += (4)) {
      const all = pix[i] + pix[i + 1] + pix[i + 2];
      data[k++] = all / 30;
    }

    HeightData = data;

    const geoPlane = new THREE.PlaneBufferGeometry(2050, 2050, 2047, 2047);
    geoPlane.rotateX(-Math.PI / 2);

    const vert = geoPlane.attributes.position.array;

    for (let i = 0, k = 0, j = vert.length; i < j; i++, k += 3) {
      vert[k + 1] = data[i] * 3;
    }

    const bumpTexture = new THREE.TextureLoader().load(heightmap);
    bumpTexture.wrapS = bumpTexture.wrapT = THREE.RepeatWrapping;

    const dirtTexture = new THREE.TextureLoader().load(dirt);
    dirtTexture.wrapS = dirtTexture.wrapT = THREE.RepeatWrapping;

    const sandyTexture = new THREE.TextureLoader().load(sand);
    sandyTexture.wrapS = sandyTexture.wrapT = THREE.RepeatWrapping;

    const grassTexture = new THREE.TextureLoader().load(grass);
    grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;

    const rockyTexture = new THREE.TextureLoader().load(rock);
    rockyTexture.wrapS = rockyTexture.wrapT = THREE.RepeatWrapping;

    const snowyTexture = new THREE.TextureLoader().load(snow);
    snowyTexture.wrapS = snowyTexture.wrapT = THREE.RepeatWrapping;

    const heightMapUniforms = {
      bumpTexture: { type: 't', value: bumpTexture },
      dirtTexture: { type: 't', value: dirtTexture },
      sandyTexture: { type: 't', value: sandyTexture },
      grassTexture: { type: 't', value: grassTexture },
      rockyTexture: { type: 't', value: rockyTexture },
      snowyTexture: { type: 't', value: snowyTexture }
    };

    const material = new THREE.ShaderMaterial({
      uniforms: heightMapUniforms,
      vertexShader: heightmapVertex,
      fragmentShader: heightmapFragment,
      side: THREE.DoubleSide
    });

    Mesh = new THREE.Mesh(geoPlane, material);
    Mesh.receiveShadow = true;
    // Mesh.castShadow = true;

    var Pos = camera.position;
    var PosX = Pos.x;
    var PosZ = Pos.z;
    var val = HeightData[GetLandPos(Math.round(PosX), Math.round(PosZ))];
    val *= 3;
    camera.position.y = val;

    scene.add(Mesh);
  },
  undefined, function () {
    alert('An error in heightmap load happened.');
  }
  );
}

function LightCreate () {
  // Light = new THREE.HemisphereLight(0xffffff, 0xffffff);
  // Light.position.set(0, 200, 0);
  // scene.add(Light);

  Light = new THREE.DirectionalLight(0xffffff, 1);
  Light.position.set(0, 100, 0);
  Light.target.position.set(0, 0, 0);
  Light.shadow.camera.far = 500;
  Light.shadow.camera.near = 0.5;
  Light.shadow.camera.top = 5;
  Light.shadow.camera.bottom = -5;
  Light.shadow.camera.left = -5;
  Light.shadow.camera.right = 5;
  Light.shadow.bias = -0.005;
  Light.castShadow = true;
  scene.add(Light);
}

function InitWater (height) {
  const geoPlane = new THREE.PlaneGeometry(2048, 2048, 1, 1);
  const waterTex = new THREE.TextureLoader().load(watertex);
  waterTex.wrapS = waterTex.wrapT = THREE.RepeatWrapping;
  waterTex.repeat.set(5, 5);
  const waterMat = new THREE.MeshBasicMaterial({ map: waterTex, transparent: true, opacity: 0.40 });
  const water = new THREE.Mesh(geoPlane, waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.y = height;
  scene.add(water);
}

function init () {
  time = 50;
  document.addEventListener('keydown', KeyDown);
  document.addEventListener('keyup', KeyUp);
  // camera.position.y = 5;

  container = document.createElement('div');
  document.body.appendChild(container);

  scene = new THREE.Scene();
  scene.background = new THREE.Color();
  // scene.fog = new THREE.Fog(0xa0a0a0, 200, 1000);

  const grid = new THREE.GridHelper(2000, 20, 0x000000, 0x000000);
  grid.material.opacity = 0.2;
  grid.material.transparent = true;
  scene.add(grid);

  ModelLoad();
  LightCreate();
  GenerateLandscape();
  // InitWater(-30);

  renderer = new THREE.WebGLRenderer({ canvas: Canvas }); // , antialias: true
  renderer.shadowMapEnabled = true;
  renderer.shadowMapSoft = true;
  renderer.shadowMapType = THREE.PCFSoftShadowMap;
  renderer.shadowCameraNear = 3;
  renderer.shadowCameraFar = camera.far;
  renderer.shadowCameraFov = 50;
  renderer.shadowMapBias = 0.0039;
  renderer.shadowMapDarkness = 0.5;
  renderer.shadowMapWidth = 1024;
  renderer.shadowMapHeight = 1024;

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 100, 0);
  controls.update();

  stats = new Stats();
  container.appendChild(stats.dom);

  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
}

function SetSky () {
  var y, w;

  if (time < 25 || time >= 175) {
    y = (100.0 - Math.abs(100.0 - time)) / 25.0;
  } else {
    y = 1;
  }
  if (time >= 25 && time < 175) {
    w = (75.0 - Math.abs(100.0 - time)) / 50.0;
    if (w > 1) {
      w = 1;
    }
  } else {
    w = 0;
  }
  Light.color.r = (y * 200.0 + w * 55.0) / 255.0;
  Light.color.g = (y * 120.0 + w * 135.0) / 255.0;
  Light.color.b = (y * 50.0 + w * 205.0) / 255.0;

  scene.background = Light.color;
}

function SetCameraTarget (target) {
  if (CameraTarget === undefined) {
    CameraTarget = new THREE.Vector3(target.x, target.y, target.z);
    camera.lookAt(CameraTarget);
    return;
  }
  CameraTarget.x += (target.x - CameraTarget.x) * 0.5;
  CameraTarget.y += (target.y - CameraTarget.y) * 0.05;
  CameraTarget.z += (target.z - CameraTarget.z) * 0.5;
  camera.lookAt(CameraTarget);
}

function UpdateScene (now) {
  if (Model !== undefined) {
    const pos = Model.scene.position;

    exhaust.forEach(function (prt) {
      prt.lookAt(camera.position);
      if (prt.material.uniforms.alpha.value <= 0) {
        prt.position.set(pos.x, pos.y, pos.z);
        if (speed !== 0) {
          prt.material.uniforms.alpha.value = Math.random() / 2;
        } else {
          prt.position.set(0, 0, 0);
        }
      } else {
        prt.material.uniforms.alpha.value -= 0.01;
        if (prt.material.uniforms.alpha.value < 0) {
          prt.material.uniforms.alpha.value = 0;
        }
        prt.position.y += now * 100;
      }
    });

    Light.target.position.set(pos.x, pos.y, pos.z);
    Light.position.set(pos.x + (time - 100) * 5, pos.y + 100, pos.z);
    // Light.position.set(Model.scene.position.x, Model.scene.position.y + Math.cos(Math.PI * 2 * time / 200) * 10, Model.scene.position.z + Math.sin(Math.PI * 2 * time / 200) * 10 * Math.sign(time - 200 / 2));
    // Light.target.position.set(Model.scene.position.x, Model.scene.position.y, Model.scene.position.z);
    Light.target.updateMatrixWorld();
    SetCameraTarget(Model.scene.position);
  }
}

function animate () {
  requestAnimationFrame(animate);

  time += clock.getDelta();
  if (time >= 200) {
    time = 0;
  }
  SetSky();
  Control();
  UpdateScene(clock.getDelta());
  renderer.render(scene, camera);
  stats.update();
}

init();
onWindowResize();
animate();
