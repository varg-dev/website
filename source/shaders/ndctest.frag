
precision lowp float;

@import ./facade.frag;


#if __VERSION__ == 100
    #define fragColor gl_FragColor
#else
    layout(location = 0) out vec4 fragColor;
#endif


uniform sampler2D u_source;

varying vec2 v_uv;


void main()
{
    vec4 source = texture(u_source, v_uv);
	fragColor = vec4(source.rgb, 1.0);
}
