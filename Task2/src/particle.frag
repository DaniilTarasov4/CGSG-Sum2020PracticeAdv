uniform sampler2D prtTexture;
uniform float alpha;

varying vec2 pos;

void main()
{
	vec4 color = texture2D(prtTexture, pos);
	color.a = color.r * alpha;
	gl_FragColor = color;
}