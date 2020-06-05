#version 300 es
precision highp float;

uniform float uTime;
uniform vec4 Edges;
uniform sampler2D Sampler;
uniform float p1, p2;
uniform vec3 InColor;
uniform bool IsTexture;

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

  C.x = p1 * cos(uTime);
  C.y = p2 * sin(uTime);

  n = Julia(Z, C);
  
  if (IsTexture)
    OutColor = texture(Sampler, vec2(n / 255.0, 0.5));
  else
    OutColor = vec4((InColor.x / 255.0) * n / 255.0, (InColor.y / 255.0) * n / 255.0, (InColor.z / 255.0) * n / 255.0, 1);
}