#version 300 es
precision mediump float;

#define PI 3.14159265359
#define MEDIUMP_FLT_MAX    65504.0
#define MEDIUMP_FLT_MIN    0.00006103515625
#define saturateMediump(x) min(x, MEDIUMP_FLT_MAX)

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

float DistributionGGX(vec3 N, vec3 H, float roughness) {
    vec3 NxH = cross(N, H);
    float oneMinusNoHSquared = dot(NxH, NxH);
    float NoH = max(dot(N, H), 0.0);
    float a = NoH * roughness;
    float k = roughness / (oneMinusNoHSquared + a * a);
    float d = k * k * (1.0 / PI);
    return min(d, MEDIUMP_FLT_MAX);
}

float GeometrySchlickGGX(float NdotV, float roughness){
    float r = (roughness + 1.0);
    float k = (r*r) / 8.0;

    float nom   = NdotV;
    float denom = NdotV * (1.0 - k) + k;
    //	return saturateMediump(nom / denom,MEDIUMP_FLT_MAX);
    return min(nom / denom, MEDIUMP_FLT_MAX);
}

float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float ggx2 = GeometrySchlickGGX(NdotV, roughness);
    float ggx1 = GeometrySchlickGGX(NdotL, roughness);
    //	saturateMediump(ggx1 * ggx2,MEDIUMP_FLT_MAX);
    return min(ggx1 * ggx2, MEDIUMP_FLT_MAX);
}

vec3 fresnelSchlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}

vec3 fresnelSchlickRoughness(float cosTheta, vec3 F0, float roughness) {
    return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow(1.0 - cosTheta, 5.0);
}

vec3 EnvDFGLazarov(vec3 specularColor, float gloss, float ndotv) {
    //# [ Lazarov 2013, "Getting More Physical in Call of Duty: Black Ops II" ]
    //# Adaptation to fit our G term.
    vec4 p0 = vec4(0.5745, 1.548, -0.02397, 1.301);
    vec4 p1 = vec4(0.5753, -0.2511, -0.02066, 0.4755);
    vec4 t = gloss * p0 + p1;
    float bias = clamp(t.x * min(t.y, exp2(-7.672 * ndotv)) + t.z, 0.0, 1.0);
    float delta = clamp(t.w, 0.0, 1.0);
    float scale = delta - bias;
    bias *= clamp(50.0 * specularColor.y, 0.0, 1.0);
    return specularColor * scale + bias;
}

void main() {
    float metallic = texture(u_metallicMap, v_texcoord).r;
    float roughness = texture(u_roughnessMap, v_texcoord).r;
    float ao = texture(u_aoMap, v_texcoord).r;
    vec3 albedo = texture(u_texture, v_texcoord).rgb;

    vec3 N = normalize(v_normal);// todo: get from normal map

    vec3 V = normalize(u_cameraPos - v_fragPos);
    vec3 R = reflect(-V, N);

    vec3 F0 = vec3(0.04);
    F0 = mix(F0, albedo, metallic);

    vec3 Lo = vec3(0.0);

    // directional light
    {
        vec3 L = normalize(-u_lightDirection);
        vec3 H = normalize(V + L);
        vec3 radiance = vec3(300.0);// direction light color

        float NDF = DistributionGGX(N, H, roughness);
        float G = GeometrySmith(N, V, L, roughness);
        vec3 F = fresnelSchlick(clamp(dot(H, V), 0.0, 1.0), F0);

        vec3 nominator = NDF * G * F;
        float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0);
        vec3 specular = nominator / max(denominator, 0.001);

        vec3 kS = F;
        vec3 kD = vec3(1.0) - kS;
        kD *= 1.0 - metallic;

        float ndotl = max(dot(N, L), 0.0);
        Lo += (kD * albedo / PI + specular) * radiance * ndotl;
    }

    vec3 ambient = vec3(0.1) * albedo * ao;
    vec3 color = ambient + Lo;

    // HDR tonemapping
    color = color / (color + vec3(1.0));

    // gamma correct
    color = pow(color, vec3(1.0/2.2));

    outColor = vec4(color, 1.0);
}