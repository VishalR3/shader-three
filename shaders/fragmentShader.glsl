uniform sampler2D earthTexture;
uniform sampler2D seaTexture;
uniform float uSeaDepthIntensity;
uniform float uSeaLevel;
uniform vec3 uSeaLightColor;
uniform vec3 uSeaDarkColor;
varying vec3 vNormal;
varying vec2 vUV;

void main(){
  vec4 bump = texture2D(seaTexture,vUV);
  vec4 color = texture2D(earthTexture,vUV);
  // vec4 color = bump;
  float heightMin = -10894.0;
  float heightMax = 7891.0;
  float heightMetres = heightMin + (heightMax-heightMin)*bump.r;
  if(heightMetres< uSeaLevel){
  float mixRatio = pow((heightMetres - uSeaLevel)/(heightMin-uSeaLevel),uSeaDepthIntensity);
    vec4 darkSeaColor = mix(color,vec4(uSeaDarkColor,1.0),0.5);
    color = mix(vec4(uSeaLightColor,1.0),darkSeaColor,mixRatio);
  }
  gl_FragColor = color;
}