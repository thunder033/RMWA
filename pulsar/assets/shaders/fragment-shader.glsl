#version 120

// fragment shaders don't hvae default precision, so define
// as mediump, "medium precision"
precision mediump float;

void main() {
// gl_FragColor is the outpout of the fragment
gl_FragColor = vec4(1, 0, 0.5, 1); //return magenta
}
