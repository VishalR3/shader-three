#include <packing>
uniform float uTime;
uniform vec3 planetCentre;
uniform float atmRadius;
uniform float planetRadius;
varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vViewVector;
uniform float cameraNear;
uniform float cameraFar;
uniform float numInScatteringPoints;
uniform float numOpticalDepthPoints;
uniform float densityFallOff;
uniform vec3 lightsPosition;
uniform float scatteringStrength;
// uniform sampler2D tDiffuse;
// uniform sampler2D tDepth;
uniform sampler2D displacementTexture;
varying vec3 vPosition;
			
#define FLT_MAX 3.402823466e+38
#define M_PI 3.14159265358979323846

float readDepth( sampler2D depthSampler, vec2 coord ) {
	float fragCoordZ = texture2D( depthSampler, coord ).x;
	float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
	// return viewZToPerspectiveDepth(viewZ,cameraNear,cameraFar);
	return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
	// return viewZ;
}

vec2 raySphere( vec3 sphereCentre, float sphereRadius,vec3 rayOrigin, vec3 rayDir){
	vec3 offset = rayOrigin - sphereCentre;
	float a = 1.0;
	float b = 2.0*dot(offset,rayDir);
	float c = dot(offset,offset) - sphereRadius*sphereRadius;
	float d = b*b - 4.0*a*c;
	if(d>0.0){
		float s = sqrt(d);
		float dstToSphereNear = max(0.0,(-b-s)/(2.0*a));
		float dstToSphereFar = (-b+s)/(2.0*a);

		if(dstToSphereFar>=0.0){
			return vec2(dstToSphereNear,dstToSphereFar-dstToSphereNear);
		}
	}

	return vec2(FLT_MAX, 0);
}

vec3 getScatteringCoefficients(){
	vec3 wavelengths = vec3(700, 530, 440);
	float sR = pow(400.0 / wavelengths.x, 4.0)*scatteringStrength;
	float sG = pow(400.0 / wavelengths.y, 4.0)*scatteringStrength;
	float sB = pow(400.0 / wavelengths.z, 4.0)*scatteringStrength;
	return vec3(sR, sG, sB);
}

float densityAtPoint(vec3 densitySamplePoint){
	float heightAboveSurface = length(densitySamplePoint-planetCentre) - planetRadius;
	float height01 = heightAboveSurface/(atmRadius-planetRadius);
	float localDensity = exp(-height01*densityFallOff)*(1.0-height01);
	return localDensity;
}

float opticalDepth(vec3 rayOrigin, vec3 rayDir, float rayLength){
	vec3 densitySamplePoint = rayOrigin;
	float stepSize = rayLength/(numOpticalDepthPoints-1.0);
	float opticalDepth = 0.0;
	for(float i = 0.0;i<numOpticalDepthPoints;i++){
		float localDensity = densityAtPoint(densitySamplePoint);
		opticalDepth+=localDensity*stepSize;
		densitySamplePoint+=rayDir*stepSize;
	}
	return opticalDepth;
}

vec4 calculateLight(vec3 rayOrigin,vec3 rayDir, float rayLength,vec3 originalColor){
	vec4 finalLight = vec4(0.0);
	float alphaLight = 0.0;
	vec3 inScatterPoint = rayOrigin;
	float stepSize = rayLength/(numInScatteringPoints-1.0);
	vec3 inScatteredLight = vec3(0.0);
	float viewRayOpticalDepth = 0.0;
	vec3 sCoefficients = getScatteringCoefficients();
	for(float i = 0.0;i<numInScatteringPoints;i++){
	vec3 dirToSun = normalize(-vec3(inScatterPoint - lightsPosition));
		float sunRayLength = raySphere(planetCentre,atmRadius, inScatterPoint, dirToSun).y;
		float sunRayOpticalDepth  = opticalDepth(inScatterPoint,dirToSun,sunRayLength);
		viewRayOpticalDepth  = opticalDepth(inScatterPoint,-rayDir,stepSize*i);
		#define line1 1
		float transmittanceCoef = exp(-(sunRayOpticalDepth+viewRayOpticalDepth));
		vec3 transmittance = transmittanceCoef*sCoefficients;

		float localDensity = densityAtPoint(inScatterPoint);
		#define line2 2
		alphaLight += localDensity*transmittanceCoef*stepSize;
		inScatteredLight+= localDensity*transmittance*sCoefficients*stepSize;
		inScatterPoint+=rayDir*stepSize;
	}
	#define line3 3
	float originalColTransmittance = exp(-viewRayOpticalDepth);
	finalLight.rgb =  inScatteredLight;
	finalLight.a = alphaLight;
	return finalLight;
}


void main(){
  // vec4 color = vec4(vec3(1.0),perlin(vUv,50.0,uTime));
	// float viewZ = readDepth(tDepth,vUv);
	// float sceneDepth = (viewZ)*length(vViewVector);
	// vec4 displacementTex = texture2D(displacementTexture,vUv);
	// float depthTex = displacementTex.b*4.0;
	vec4 color = vec4(1.0);
	vec3 rayOrigin = cameraPosition;
	vec3 rayDir = normalize(vViewVector);
	vec2 hitInfo  = raySphere(planetCentre,atmRadius,rayOrigin,rayDir);

	vec2 dstToOcean  = raySphere(planetCentre, planetRadius,rayOrigin,rayDir);
	float dstToSurface = dstToOcean.x ;
	float dstToAtmosphere = hitInfo.x;
	float dstThroughAtmosphere =min(hitInfo.y,dstToSurface-dstToAtmosphere);
	vec4 originalColor = vec4(vec3(dstThroughAtmosphere/(atmRadius*2.0)),1.0);
	if(dstThroughAtmosphere>0.0){
		const float epsilon  =0.000001;
		vec3 pointInAtmosphere = rayOrigin+rayDir*(dstToAtmosphere);
		vec4 light = calculateLight(pointInAtmosphere,rayDir,dstThroughAtmosphere,originalColor.xyz);
		originalColor =  vec4(light);
	}
	color = originalColor;

	gl_FragColor = color;
	// gl_FragColor.rgb = vec3( sceneDepth );
	// gl_FragColor.a = 1.0;
}