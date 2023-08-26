#version 300 es
in vec3 a_position;
in vec2 a_texcoord;
in vec3 a_normal;

uniform mat4 u_worldMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;

out vec2 v_texcoord;
out vec3 v_normal;
out vec3 v_fragPos;
out mat4 v_worldMatrix;

void main() {
    v_texcoord = a_texcoord;
    v_worldMatrix = u_worldMatrix;

    v_normal = mat3(transpose(inverse(u_worldMatrix))) * a_normal;
    v_fragPos = vec3(u_worldMatrix * vec4(a_position, 1.0));

    gl_Position = u_projectionMatrix * u_viewMatrix * u_worldMatrix * vec4(a_position, 1.0);
}