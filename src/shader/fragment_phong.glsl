#version 300 es
precision mediump float;

// 纹理
uniform sampler2D u_texture;
uniform sampler2D u_normalMap;
uniform sampler2D u_metallicMap;
uniform sampler2D u_roughnessMap;
uniform sampler2D u_aoMap;

uniform vec3 u_lightDirection;
uniform vec3 u_cameraPos;

in vec2 v_texcoord;
in vec3 v_normal;
in vec3 v_fragPos;
in mat4 v_worldMatrix;

out vec4 outColor;

void main() {
    vec4 baseColor = texture(u_texture, v_texcoord);
    outColor = baseColor;
}