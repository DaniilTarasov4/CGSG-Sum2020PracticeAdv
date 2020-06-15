import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

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
import dirtparticle from '../bin/dirt.png';

import './styles.css';

let container, stats, controls;
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
let scene;
let renderer;
const meshes = [];
// let lamp1;
let time;
let angle = 0;
let PressedKeys = {};
const Canvas = document.getElementById('Canvas');
let Model;
let HeightData;
let Mesh;
let Light;
const exhaust = [];
const wheel1 = []; const wheel2 = []; const wheel3 = []; const wheel4 = [];
const numOfParticles = 50;

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
      angle += 0.005;
      if (angle > 360) {
        angle = angle - 360;
      }
      ModelRotate(angle);
    } else {
      if (GetKey(68)) {
        if (angle === undefined) {
          angle = 0;
        }
        angle -= 0.005;
        if (angle < 0) {
          angle = 360 + angle;
        }
        ModelRotate(angle);
      }
    }
    if (angle === undefined) {
      angle = 0;
    }
    ModelMove(Math.sin(angle), Math.cos(angle));
    WheelsRotate(0.05);
  } else {
    if (GetKey(83)) {
      if (GetKey(65)) {
        if (angle === undefined) {
          angle = 0;
        }
        angle += 0.005;
        if (angle > 360) {
          angle = angle - 360;
        }
        ModelRotate(angle);
      } else {
        if (GetKey(68)) {
          if (angle === undefined) {
            angle = 0;
          }
          angle -= 0.005;
          if (angle < 0) {
            angle = 360 + angle;
          }
          ModelRotate(angle);
        }
      }
      if (angle === undefined) {
        angle = 0;
      }
      ModelMove(-Math.sin(angle), -Math.cos(angle));
      WheelsRotate(-0.05);
    }
  }
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

function ModelUpdate () {
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

function ParticleInit () {
  const loader = new THREE.TextureLoader();

  loader.load(dirtparticle, function (texture) {
    const cloudGeom = new THREE.PlaneBufferGeometry(1, 1);
    const cloudMaterial = new THREE.MeshLambertMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide
    });

    for (let i = 0; i < numOfParticles; i++) {
      const cloud = new THREE.Mesh(cloudGeom, cloudMaterial);
      cloud.position.x = Model.scene.position.x + 1.15;
      cloud.position.y = Model.scene.position.y + 0.5;
      cloud.position.z = Model.scene.position.z - 0.1;
      cloud.material.opacity = Math.random();
      wheel1.push(cloud);
      scene.add(cloud);
    }
  });

  loader.load(dirtparticle, function (texture) {
    const cloudGeom = new THREE.PlaneBufferGeometry(1, 1);
    const cloudMaterial = new THREE.MeshLambertMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide
    });

    for (let i = 0; i < numOfParticles; i++) {
      const cloud = new THREE.Mesh(cloudGeom, cloudMaterial);
      cloud.position.x = Model.scene.position.x + 1.15;
      cloud.position.y = Model.scene.position.y + 0.5;
      cloud.position.z = Model.scene.position.z + 1.7;
      cloud.material.opacity = Math.random();
      wheel2.push(cloud);
      scene.add(cloud);
    }
  });

  loader.load(dirtparticle, function (texture) {
    const cloudGeom = new THREE.PlaneBufferGeometry(1, 1);
    const cloudMaterial = new THREE.MeshLambertMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide
    });

    for (let i = 0; i < numOfParticles; i++) {
      const cloud = new THREE.Mesh(cloudGeom, cloudMaterial);
      cloud.position.x = Model.scene.position.x + 2.1;
      cloud.position.y = Model.scene.position.y + 0.5;
      cloud.position.z = Model.scene.position.z - 0.1;
      cloud.material.opacity = Math.random();
      wheel3.push(cloud);
      scene.add(cloud);
    }
  });

  loader.load(dirtparticle, function (texture) {
    const cloudGeom = new THREE.PlaneBufferGeometry(1, 1);
    const cloudMaterial = new THREE.MeshLambertMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide
    });

    for (let i = 0; i < numOfParticles; i++) {
      const cloud = new THREE.Mesh(cloudGeom, cloudMaterial);
      cloud.position.x = Model.scene.position.x + 2.1;
      cloud.position.y = Model.scene.position.y + 0.5;
      cloud.position.z = Model.scene.position.z + 1.7;
      cloud.material.opacity = Math.random();
      wheel4.push(cloud);
      scene.add(cloud);
    }
  });

  loader.load(particle, function (texture) {
    const cloudGeom = new THREE.PlaneBufferGeometry(1, 1);
    const cloudMaterial = new THREE.MeshLambertMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide
    });

    for (let i = 0; i < numOfParticles; i++) {
      const cloud = new THREE.Mesh(cloudGeom, cloudMaterial);
      cloud.position.x = Model.scene.position.x + 1.2;
      cloud.position.y = Model.scene.position.y + 0.7;
      cloud.position.z = Model.scene.position.z - 0.7;
      cloud.material.opacity = Math.random();
      exhaust.push(cloud);
      scene.add(cloud);
    }
  });
}

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
    ModelUpdate();
    ParticleInit();
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

  Light = new THREE.DirectionalLight(0xffffff);
  Light.position.set(0, 200, 100);
  Light.castShadow = true;
  Light.shadow.camera.top = 180;
  Light.shadow.camera.bottom = -100;
  Light.shadow.camera.left = -120;
  Light.shadow.camera.right = 120;
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
  time = 0;
  document.addEventListener('keydown', KeyDown);
  document.addEventListener('keyup', KeyUp);
  camera.position.y = 5;

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

  renderer = new THREE.WebGLRenderer({ canvas: Canvas, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMapSoft = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowCameraNear = 3;
  renderer.shadowCameraFar = camera.far;
  renderer.shadowCameraFov = 50;
  renderer.shadowMapBias = 0.0039;
  renderer.shadowMapDarkness = 0.5;
  renderer.shadowMapWidth = 2048;
  renderer.shadowMapHeight = 2048;
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 100, 0);
  controls.update();

  stats = new Stats();
  container.appendChild(stats.dom);

  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
}

function SetSky () {
  if (time < 100) {
    scene.background.r = time / 100;
    scene.background.g = time / 100;
    scene.background.b = time / 100;
    Light.intensity = time / 100;
  } else {
    scene.background.r = 1 - (time - 100) / 100;
    scene.background.g = 1 - (time - 100) / 100;
    scene.background.b = 1 - (time - 100) / 100;
    Light.intensity = 1 - (time - 100) / 100;
  }
  Light.position.set(Model.getX, Model.getY + Math.cos(Math.PI * 2 * time / 200) * 10, Model.getZ + Math.sin(Math.PI * 2 * time / 200) * 10 * Math.sign(time - 200 / 2));
  Light.target.position.set(Model.getX, Model.getY, Model.getZ);
}

function UpdateScene (now) {
  if (Model !== undefined) {
    const pos = Model.scene.position;

    if (GetKey(83) || GetKey(87)) {
      wheel1.forEach(function (prt) {
        prt.material.opacity -= now / 10000;
        prt.position.y += now / 5000;
        prt.lookAt(camera.position);
        if (prt.material.opacity <= 0) {
          prt.material.opacity = 0.55;
          prt.position.set(
            Model.scene.position.x + Math.random() / 10 + 1.15,
            Model.scene.position.y + Math.random() / 10 + 0.5,
            Model.scene.position.z + Math.random() / 10 - 0.1);
        }
      });

      wheel2.forEach(function (prt) {
        prt.material.opacity -= now / 10000;
        prt.position.y += now / 5000;
        prt.lookAt(camera.position);
        if (prt.material.opacity <= 0) {
          prt.material.opacity = 0.55;
          prt.position.set(
            Model.scene.position.x + Math.random() / 10 + 1.15,
            Model.scene.position.y + Math.random() / 10 + 0.5,
            Model.scene.position.z + Math.random() / 10 + 1.7);
        }
      });

      wheel3.forEach(function (prt) {
        prt.material.opacity -= now / 10000;
        prt.position.y += now / 5000;
        prt.lookAt(camera.position);
        if (prt.material.opacity <= 0) {
          prt.material.opacity = 0.55;
          prt.position.set(
            Model.scene.position.x + Math.random() / 10 + 2.1,
            Model.scene.position.y + Math.random() / 10 + 0.5,
            Model.scene.position.z + Math.random() / 10 - 0.1);
        }
      });

      wheel4.forEach(function (prt) {
        prt.material.opacity -= now / 10000;
        prt.position.y += now / 5000;
        prt.lookAt(camera.position);
        if (prt.material.opacity <= 0) {
          prt.material.opacity = 0.55;
          prt.position.set(
            Model.scene.position.x + Math.random() / 10 + 2.1,
            Model.scene.position.y + Math.random() / 10 + 0.5,
            Model.scene.position.z + Math.random() / 10 + 1.7);
        }
      });
    }

    exhaust.forEach(function (prt) {
      prt.material.opacity -= now / 10000;
      prt.position.y += now / 5000;
      prt.lookAt(camera.position);
      if (prt.material.opacity <= 0) {
        prt.material.opacity = 0.55;
        prt.position.set(
          Model.scene.position.x + Math.random() / 10 + 1.2,
          Model.scene.position.y + Math.random() / 10 + 0.7,
          Model.scene.position.z + Math.random() / 10 - 0.7);
      }
    });

    Light.target.position.set(pos.x, pos.y - 100, pos.z);
    Light.position.set(pos.x, pos.y + 100, pos.z);
    Light.target.updateMatrixWorld();
    camera.lookAt(Model.scene.position);
  }
}

function animate (now) {
  now *= 0.001;

  requestAnimationFrame(animate);
  time += 0.1;
  if (time >= 200) {
    time = 0;
  }
  SetSky();
  Control();
  UpdateScene(now);
  renderer.render(scene, camera);
  stats.update();
}

init();
onWindowResize();
animate();
