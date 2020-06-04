import { mat4 } from 'gl-matrix';
import * as dat from 'dat.gui';

import vxShaderStr from './main.vert';
import fsShaderStr from './main.frag';

let gl;
let Tex;
let shaderProgram;
let squareVertexPositionBuffer;
const mvMatrix = mat4.create();
const pMatrix = mat4.create();
let timeMs = Date.now();
const startTime = Date.now();
let Zoom = 0.5;
let MousePos = [0.0, 0.0];
let IsClick = false;
let IsTexture = true;
let p1 = -0.4;
let p2 = 0.6;
const Edges =
{
  left: -1,
  right: 1,
  bottom: -1,
  top: 1
};

function initGL (canvas) {
  try {
    gl = canvas.getContext('webgl2');
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
  } catch (e) {
  }
  if (!gl) {
    alert('Could not initialize WebGL');
  }
}

function getShader (gl, type, str) {
  let shader;
  shader = gl.createShader(type);

  gl.shaderSource(shader, str);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}

function initShaders () {
  const fragmentShader = getShader(gl, gl.FRAGMENT_SHADER, fsShaderStr);
  const vertexShader = getShader(gl, gl.VERTEX_SHADER, vxShaderStr);

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Could not initialize shaders');
  }

  gl.useProgram(shaderProgram);

  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, 'uPMatrix');
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, 'uMVMatrix');
  shaderProgram.uTime = gl.getUniformLocation(shaderProgram, 'uTime');
  shaderProgram.Zoom = gl.getUniformLocation(shaderProgram, 'Zoom');
  shaderProgram.Edges = gl.getUniformLocation(shaderProgram, 'Edges');
  shaderProgram.p1 = gl.getUniformLocation(shaderProgram, 'p1');
  shaderProgram.p2 = gl.getUniformLocation(shaderProgram, 'p2');
  shaderProgram.IsTexture = gl.getUniformLocation(shaderProgram, 'IsTexture');
}

function setUniforms () {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
  gl.uniform1f(shaderProgram.Zoom, Zoom);
  gl.uniform1f(shaderProgram.uTime, timeMs);
  gl.uniform4f(shaderProgram.Edges, Edges.left, Edges.right, Edges.bottom, Edges.top);
  gl.uniform1f(shaderProgram.p1, p1);
  gl.uniform1f(shaderProgram.p2, p2);
  gl.uniform1ui(shaderProgram.IsTexture, IsTexture);
}

function initBuffers () {
  squareVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
  const vertices = [
    1.0, 1.0, 0.0,
    -1.0, 1.0, 0.0,
    1.0, -1.0, 0.0,
    -1.0, -1.0, 0.0
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  squareVertexPositionBuffer.itemSize = 3;
  squareVertexPositionBuffer.numItems = 4;
}

function drawScene () {
  timeMs = (Date.now() - startTime) / 1000;
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  mat4.perspective(pMatrix, 45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);
  mat4.identity(mvMatrix);
  mat4.translate(mvMatrix, mvMatrix, [0.0, 0.0, -1.0]);

  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  setUniforms();
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
}

function isPowerOf2 (value) {
  return (value & (value - 1)) === 0;
}

function loadTexture (url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  const pixel = new Uint8Array([0, 0, 255, 255]);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

  const image = new Image();
  image.onload = function () {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };
  image.src = url;

  return texture;
}

function tick () {
  window.requestAnimationFrame(tick);
  drawScene();
  // console.log('tick' + new Date());
}

var ObjGen = function () {
  this.p1 = -0.4;
  this.p2 = 0.6;
  this.IsTexture = true;
};

function createBorders (Pos, Scroll) {
  let Scale = 1;

  if (Scroll > 0) { Scale *= 1 + 0.5 * Scroll / 100; } else { Scale /= 1 - 0.5 * Scroll / 100; }

  Zoom = Scale;

  const newLeft = Edges.left + Pos.x / 500.0 * (Edges.right - Edges.left) * (1 - Scale);
  const newBottom = Edges.bottom + Pos.y / 500.0 * (Edges.top - Edges.bottom) * (1 - Scale);
  const newRight = newLeft + (Edges.right - Edges.left) * Scale;
  const newTop = newBottom + (Edges.top - Edges.bottom) * Scale;

  Edges.left = newLeft;
  Edges.right = newRight;
  Edges.bottom = newBottom;
  Edges.top = newTop;
}

function webGLStart () {
  const canvas = document.getElementById('webglCanvas');

  function getMousePos (canvas, param) {
    const rect = canvas.getBoundingClientRect();

    return {
      x: param.clientX - rect.left,
      y: param.clientY - rect.top
    };
  }

  canvas.addEventListener('mousedown', (param) => {
    MousePos = getMousePos(canvas, param);
    IsClick = true;
  }, false);

  canvas.addEventListener('mousemove', (param) => {
    if (IsClick === true) {
      const PrevPos = MousePos;

      MousePos = getMousePos(canvas, param);
      document.getElementById('webglCanvas').style.cursor = 'move';

      const newLeft = Edges.left + -(MousePos.x - PrevPos.x) / 500.0 * (Edges.right - Edges.left);
      const newBottom = Edges.bottom + (MousePos.y - PrevPos.y) / 500.0 * (Edges.top - Edges.bottom);
      const newRight = newLeft + (Edges.right - Edges.left);
      const newTop = newBottom + (Edges.top - Edges.bottom);

      Edges.left = newLeft;
      Edges.right = newRight;
      Edges.bottom = newBottom;
      Edges.top = newTop;
    }
  }, false);

  canvas.addEventListener('mouseup', (param) => {
    if (IsClick === true) {
      document.getElementById('webglCanvas').style.cursor = 'default';
      IsClick = false;
    }
  }, false);

  canvas.addEventListener('wheel', (param) => {
    MousePos = getMousePos(canvas, param);
    const MPos = { x: MousePos.x, y: 800 - MousePos.y };
    createBorders(MPos, param.deltaY / 10.0);
  }, false);

  const gui = new dat.GUI();
  const Params = new ObjGen();
  const contrParam1 = gui.add(Params, 'p1');
  const contrParam2 = gui.add(Params, 'p2');
  const contrParam3 = gui.add(Params, 'IsTexture');

  contrParam1.onChange(function (value) {
    p1 = value;
  });
  contrParam2.onChange(function (value) {
    p2 = value;
  });
  contrParam3.onChange(function (value) {
    IsTexture = value;
  });

  initGL(canvas);
  Tex = loadTexture('./src/tex.jpg');
  initShaders();
  initBuffers();

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  tick();
}

document.addEventListener('DOMContentLoaded', webGLStart);
