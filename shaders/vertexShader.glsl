uniform sampler2D displacementTexture;
uniform float uHeightScale;
varying vec3 vNormal;
varying vec2 vUV;
void main(){
  vec4 bumpData = texture2D(displacementTexture,uv);
  vec3 newPosition = position + normal*uHeightScale*bumpData.r;
  vec4 finalPosition = (projectionMatrix * modelViewMatrix * vec4(newPosition,1.0)) ;
  gl_Position = finalPosition;
  vNormal = normal;
  vUV = uv;
}