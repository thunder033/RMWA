#version 120
//an attribute will receive data from a buffer
attribute vec2 a_position;

//starting point
void main() {
gl_Position = vec4(a_position, 0, 1);
}