varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vViewVector;
varying vec3 vPosition;
void main(){
  vec3 newPosition = position ;
  vec4 finalPosition = (projectionMatrix * modelViewMatrix * vec4(newPosition,1.0)) ;
  gl_Position = finalPosition;
  vNormal = normal;
  vUv = uv;
  vViewVector = position - cameraPosition;
  vPosition = newPosition;
}