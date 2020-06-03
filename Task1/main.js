'use strict';

const vxShaderStr = `#version 300 es
in vec3 aVertexPosition;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

void main(void)
{
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
}
`;

const fsShaderStr = `#version 300 es
precision highp float;

uniform float uTime;
uniform vec4 Edges;
uniform sampler2D Sampler;

out vec4 OutColor;

vec2 vec2addvec2(vec2 a, vec2 b)
{
    return vec2(a.x + b.x, a.y + b.y);
}

vec2 vec2mulvec2(vec2 a, vec2 b)
{
    return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

float vec2abs(vec2 a)
{
    return sqrt(a.x * a.x + a.y * a.y);
}

float Julia(vec2 Z, vec2 C)
{
  float n = 0.0;
  vec2 Z0 = Z;

  while (n < 255.0 && vec2abs(Z) < 4.0)
  {
    Z = vec2addvec2(vec2mulvec2(Z, Z), C);
    n++;
  }

  return n;
}

void main(void)
{
  float n;
  vec2 Z, C;
  vec2 xy = Edges.xz + gl_FragCoord.xy / 500.0 * (Edges.yw - Edges.xz);
  
  Z.x = xy.x;
  Z.y = xy.y;

  C.x = -0.4 * cos(uTime);
  C.y = 0.6 * sin(uTime);

  n = Julia(Z, C);

  OutColor = texture(Sampler, vec2(n / 255.0, 0.5));
}
`;

let gl;
let Tex;
let shaderProgram;
let squareVertexPositionBuffer;
let mvMatrix = mat4.create();
let pMatrix = mat4.create();
let timeMs = Date.now();
let startTime = Date.now();
let Zoom = 0.5;
let MousePos = [0.0, 0.0];
let TransPos = [0.0, 0.0];
let IsClick = false;
let Color = '#FF0000';
let Edges =
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
  let fragmentShader = getShader(gl, gl.FRAGMENT_SHADER, fsShaderStr);
  let vertexShader = getShader(gl, gl.VERTEX_SHADER, vxShaderStr);

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
  shaderProgram.Sampler = gl.getUniformLocation(shaderProgram, 'Sampler');
}

function setUniforms () {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
  gl.uniform1f(shaderProgram.Zoom, Zoom);
  gl.uniform1f(shaderProgram.uTime, timeMs);
  gl.uniform4f(shaderProgram.Edges, Edges.left, Edges.right, Edges.bottom, Edges.top);
}

function initBuffers () {
  squareVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
  let vertices = [
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

  mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
  mat4.identity(mvMatrix);
  mat4.translate(mvMatrix, [-3.0, 0.0, -2.0]);
  mat4.translate(mvMatrix, [3.0, 0.0, 0.0]);

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
  }
  image.src = url;

  return texture;
}

function tick () {
  window.requestAnimationFrame(tick);
  drawScene();
  // console.log('tick' + new Date());
}

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
      let MPos = {x:MousePos.x, y:800 - MousePos.y};
      createBorders(MPos, param.deltaY / 10.0);
    }, false);

  initGL(canvas);
  Tex = loadTexture('tex.jpg');
  initShaders();
  initBuffers();

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  tick();
}