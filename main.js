import * as THREE from 'three'
// import * as kokomi from "kokomi.js"
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { TextureLoader } from 'three'
import { Reflector } from 'three/addons/objects/Reflector.js';
import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js'
import { Refractor } from 'three/addons/objects/Refractor.js'
import { WaterRefractionShader } from 'three/addons/shaders/WaterRefractionShader.js'
import { Water } from 'three/addons/objects/Water2.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'

const scene = new THREE.Scene()
scene.background = new THREE.Color('#e1e1e1')
// scene.background = new THREE.Color('#000')

// lights

const spotLightIntensivity = 0.8
const spotLightColor = 0xbeb8b1
const spotLightAngle = Math.PI/8

// lamp
// rgb(249, 229, 189)

const rLight1 = new THREE.RectAreaLight('rgb(85, 184, 255)', 150, 19.1, 0.2)
rLight1.position.set(0, 8.066, -9.1)
rLight1.rotation.set((90 * Math.PI) / 180, (180 * Math.PI) / 180, 0)
scene.add(rLight1)

// const rectLightHelper = new RectAreaLightHelper( rLight1 )
// rLight1.add( rectLightHelper )

const lampGeomentry = new THREE.BoxGeometry(19.1, 0.2, 0.2)
const lampMaterial = new THREE.MeshStandardMaterial({
    color: 'rgb(85, 184, 255)',
    emissive: 'rgb(85, 184, 255)',
    emissiveIntensity: 10
});
const lamp = new THREE.Mesh( lampGeomentry, lampMaterial );
lamp.position.set(0, 8.066, -9.1)
scene.add( lamp )

// textrures
const txLoader = new TextureLoader()

const brickTexture = txLoader.load('/assets/textures/brick-normal2.jpg')
brickTexture.center = new THREE.Vector2(0.5, 0.5)
brickTexture.repeat.set(5, 8)
brickTexture.wrapS = THREE.RepeatWrapping
brickTexture.wrapT = THREE.RepeatWrapping
brickTexture.rotation = (90 * Math.PI) / 180

// floor textures
const asphaltRoughes = txLoader.load('/assets/textures/asphalt-pbr01/roughness.jpg')
asphaltRoughes.wrapS = THREE.RepeatWrapping
asphaltRoughes.wrapT = THREE.RepeatWrapping

const asphaltOpacity = txLoader.load('/assets/textures/asphalt-pbr01/opacity.jpg')
asphaltOpacity.wrapS = THREE.RepeatWrapping
asphaltOpacity.wrapT = THREE.RepeatWrapping

const asphaltNormal = txLoader.load('/assets/textures/asphalt-pbr01/normal.png')
asphaltNormal.wrapS = THREE.RepeatWrapping
asphaltNormal.wrapT = THREE.RepeatWrapping

// shutter textures
const shutterDiffuse = txLoader.load('/assets/textures/door/shutter-Diffuse.png')
shutterDiffuse.flipY = !1

const shutterGlossiness = txLoader.load('/assets/textures/door/shutter-Glossiness.png')
shutterGlossiness.flipY = !1

const shutterNormal = txLoader.load('/assets/textures/door/shutter-Normal.png')
shutterNormal.flipY = !1

// top cover textures
const topCoverDiffuse = txLoader.load('/assets/textures/door/top-cover-Diffuse.png')

// side cover textures
const sideCoverDiffuse = txLoader.load('/assets/textures/door/side-cover-Diffuse.png')

const rainNormal = txLoader.load('/assets/textures/rain-normal.png')

const vertexShader = `
uniform mat4 textureMatrix;

varying vec2 vUv;
varying vec4 vMirrorCoord;
varying vec3 vWorldPosition;

// https://tympanus.net/codrops/2019/10/29/real-time-multiside-refraction-in-three-steps/
vec4 getWorldPosition(mat4 modelMat,vec3 pos){
    vec4 worldPosition=modelMat*vec4(pos,1.);
    return worldPosition;
}

void main(){
    vec3 p=position;
    
    gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
    
    vUv=uv;
    vMirrorCoord=textureMatrix*vec4(p,1.);
    vWorldPosition=getWorldPosition(modelMatrix,p).xyz;
}
`;

const fragmentShader = `
// https://stackoverflow.com/questions/13501081/efficient-bicubic-filtering-code-in-glsl
vec4 sampleBicubic(float v){
    vec4 n=vec4(1.,2.,3.,4.)-v;
    vec4 s=n*n*n;
    vec4 o;
    o.x=s.x;
    o.y=s.y-4.*s.x;
    o.z=s.z-4.*s.y+6.*s.x;
    o.w=6.-o.x-o.y-o.z;
    return o;
}

vec4 sampleBicubic(sampler2D tex,vec2 st,vec2 texResolution){
    vec2 pixel=1./texResolution;
    st=st*texResolution-.5;
    
    vec2 fxy=fract(st);
    st-=fxy;
    
    vec4 xcubic=sampleBicubic(fxy.x);
    vec4 ycubic=sampleBicubic(fxy.y);
    
    vec4 c=st.xxyy+vec2(-.5,1.5).xyxy;
    
    vec4 s=vec4(xcubic.xz+xcubic.yw,ycubic.xz+ycubic.yw);
    vec4 offset=c+vec4(xcubic.yw,ycubic.yw)/s;
    
    offset*=pixel.xxyy;
    
    vec4 sample0=texture(tex,offset.xz);
    vec4 sample1=texture(tex,offset.yz);
    vec4 sample2=texture(tex,offset.xw);
    vec4 sample3=texture(tex,offset.yw);
    
    float sx=s.x/(s.x+s.y);
    float sy=s.z/(s.z+s.w);
    
    return mix(mix(sample3,sample2,sx),mix(sample1,sample0,sx),sy);
}

// With original size argument
vec4 packedTexture2DLOD(sampler2D tex,vec2 uv,int level,vec2 originalPixelSize){
    float floatLevel=float(level);
    vec2 atlasSize;
    atlasSize.x=floor(originalPixelSize.x*1.5);
    atlasSize.y=originalPixelSize.y;
    // we stop making mip maps when one dimension == 1
    float maxLevel=min(floor(log2(originalPixelSize.x)),floor(log2(originalPixelSize.y)));
    floatLevel=min(floatLevel,maxLevel);
    // use inverse pow of 2 to simulate right bit shift operator
    vec2 currentPixelDimensions=floor(originalPixelSize/pow(2.,floatLevel));
    vec2 pixelOffset=vec2(
        floatLevel>0.?originalPixelSize.x:0.,
        floatLevel>0.?currentPixelDimensions.y:0.
    );
    // "minPixel / atlasSize" samples the top left piece of the first pixel
    // "maxPixel / atlasSize" samples the bottom right piece of the last pixel
    vec2 minPixel=pixelOffset;
    vec2 maxPixel=pixelOffset+currentPixelDimensions;
    vec2 samplePoint=mix(minPixel,maxPixel,uv);
    samplePoint/=atlasSize;
    vec2 halfPixelSize=1./(2.*atlasSize);
    samplePoint=min(samplePoint,maxPixel/atlasSize-halfPixelSize);
    samplePoint=max(samplePoint,minPixel/atlasSize+halfPixelSize);
    return sampleBicubic(tex,samplePoint,originalPixelSize);
}

vec4 packedTexture2DLOD(sampler2D tex,vec2 uv,float level,vec2 originalPixelSize){
    float ratio=mod(level,1.);
    int minLevel=int(floor(level));
    int maxLevel=int(ceil(level));
    vec4 minValue=packedTexture2DLOD(tex,uv,minLevel,originalPixelSize);
    vec4 maxValue=packedTexture2DLOD(tex,uv,maxLevel,originalPixelSize);
    return mix(minValue,maxValue,ratio);
}

// https://www.shadertoy.com/view/4djSRW
float hash12(vec2 p){
    vec3 p3=fract(vec3(p.xyx)*.1031);
    p3+=dot(p3,p3.yzx+19.19);
    return fract((p3.x+p3.y)*p3.z);
}

vec2 hash22(vec2 p){
    vec3 p3=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973));
    p3+=dot(p3,p3.yzx+19.19);
    return fract((p3.xx+p3.yz)*p3.zy);
}

// https://gist.github.com/companje/29408948f1e8be54dd5733a74ca49bb9
float map(float value,float min1,float max1,float min2,float max2){
    return min2+(value-min1)*(max2-min2)/(max1-min1);
}

uniform vec3 color;
uniform sampler2D tDiffuse;
varying vec2 vUv;
varying vec4 vMirrorCoord;
varying vec3 vWorldPosition;

uniform sampler2D uRoughnessTexture;
uniform sampler2D uNormalTexture;
uniform sampler2D uOpacityTexture;
uniform vec2 uTexScale;
uniform vec2 uTexOffset;
uniform float uDistortionAmount;
uniform float uBlurStrength;
uniform float iTime;
uniform float uRainCount;
uniform vec2 uMipmapTextureSize;

#define MAX_RADIUS 1
#define DOUBLE_HASH 0

void main(){
    vec2 p=vUv;
    vec2 texUv=p*uTexScale;
    texUv+=uTexOffset;
    float floorOpacity=texture(uOpacityTexture,texUv).r;
    vec3 floorNormal=texture(uNormalTexture,texUv).rgb*2.-1.;
    floorNormal=normalize(floorNormal);
    float roughness=texture(uRoughnessTexture,texUv).r;
    
    vec2 reflectionUv=vMirrorCoord.xy/vMirrorCoord.w;
    
    // https://www.shadertoy.com/view/ldfyzl
    vec2 rippleUv=75.*p*uTexScale;
    
    vec2 p0=floor(rippleUv);
    
    float rainStrength=map(uRainCount,0.,10000.,3.,.5);
    if(rainStrength==3.){
        rainStrength=50.;
    }
    
    vec2 circles=vec2(0.);
    for(int j=-MAX_RADIUS;j<=MAX_RADIUS;++j)
    {
        for(int i=-MAX_RADIUS;i<=MAX_RADIUS;++i)
        {
            vec2 pi=p0+vec2(i,j);
            #if DOUBLE_HASH
            vec2 hsh=hash22(pi);
            #else
            vec2 hsh=pi;
            #endif
            vec2 p=pi+hash22(hsh);
            
            float t=fract(.8*iTime+hash12(hsh));
            vec2 v=p-rippleUv;
            float d=length(v)-(float(MAX_RADIUS)+1.)*t+(rainStrength*.1*t);
            
            float h=1e-3;
            float d1=d-h;
            float d2=d+h;
            float p1=sin(31.*d1)*smoothstep(-.6,-.3,d1)*smoothstep(0.,-.3,d1);
            float p2=sin(31.*d2)*smoothstep(-.6,-.3,d2)*smoothstep(0.,-.3,d2);
            circles+=.5*normalize(v)*((p2-p1)/(2.*h)*(1.-t)*(1.-t));
        }
    }
    circles/=float((MAX_RADIUS*2+1)*(MAX_RADIUS*2+1));
    
    float intensity=.05*floorOpacity;
    vec3 n=vec3(circles,sqrt(1.-dot(circles,circles)));
    
    vec2 rainUv=intensity*n.xy;
    
    vec2 finalUv=reflectionUv+floorNormal.xy*uDistortionAmount-rainUv;
    
    float level=roughness*uBlurStrength;
    
    vec3 col=packedTexture2DLOD(tDiffuse,finalUv,level,uMipmapTextureSize).rgb;
    
    gl_FragColor=vec4(col,1.);
    
    // vec4 base=texture2DProj(tDiffuse,vec4(finalUv,1.,1.));
    // gl_FragColor=vec4(base.rgb,1.);
}
`;

let geometry, material;

geometry = new THREE.CircleGeometry( 40, 64 );
const groundMirror = new Reflector( geometry, {
    clipBias: 0.003,
    textureWidth: window.innerWidth * window.devicePixelRatio,
    textureHeight: window.innerHeight * window.devicePixelRatio,
    color: 0xb5b5b5
} );
groundMirror.position.y = 0.5
groundMirror.rotateX( - Math.PI / 2 )
groundMirror.material.uniforms = {
    uNormalTexture: {
        value: asphaltNormal,
      },
      uOpacityTexture: {
        value: asphaltOpacity,
      },
      uRoughnessTexture: {
        value: asphaltRoughes,
      },
      uRainCount: {
        value: 10,
      },
      uTexScale: {
        value: new THREE.Vector2(1, 4),
      },
      uTexOffset: {
        value: new THREE.Vector2(1, -0.5),
      },
      uDistortionAmount: {
        value: 0.25,
      },
      uBlurStrength: {
        value: 8,
      },
      uMipmapTextureSize: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
}
groundMirror.material.vertexShader = vertexShader
groundMirror.material.fragmentShader = fragmentShader
scene.add( groundMirror )

console.log(groundMirror)

// Central
// const pLight1 = new THREE.PointLight('rgb(189, 229, 249)', .1, 17, .8)
// pLight1.position.y = 2.3
// scene.add(pLight1)

// const pLight1Helper = new THREE.PointLightHelper(pLight1)
// scene.add(pLight1Helper)

// Top ambient
const pLight2 = new THREE.PointLight('rgb(189, 229, 249)', 20, 30)
pLight2.position.y = 30
pLight2.position.z = 0
scene.add(pLight2)

// MY LIGHT
const spotLight = new THREE.SpotLight(spotLightColor, spotLightIntensivity, 0, spotLightAngle)
spotLight.position.set(0, 100, 0)
scene.add(spotLight)

const helperLight = new THREE.SpotLightHelper(spotLight)
scene.add(helperLight)

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 )

const renderer = new THREE.WebGLRenderer({alpha: true, antialias: true})
renderer.shadowMap.enabled = true
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.outputColorSpace = THREE.LinearSRGBColorSpace
renderer.toneMapping = THREE.ReinhardToneMapping
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls( camera, renderer.domElement )

camera.position.set( 0, 1, 10 )
controls.update()



// model
const gtlfLoader = new GLTFLoader()
const url = '/assets/models/scene.glb'
gtlfLoader.load(url, gltf => {
    const root = gltf.scene

    root.traverse(child => {
        if (child.type === 'Mesh') {

            // console.log(child)

            if (child.name === 'walls') {
                child.material = new THREE.MeshPhongMaterial({
                    color: new THREE.Color("rgb(73, 73, 73)"),
                    normalMap: brickTexture,
                    normalScale: new THREE.Vector2(0.5, 0.5),
                    shininess: 50
                })
            }

            if (child.name === 'floor') {

                

				// const waterGeometry = new THREE.PlaneGeometry( 60, 60 )

				// const water = new Water(waterGeometry, {
				// 	scale: 1,
				// 	textureWidth: 1024,
				// 	textureHeight: 1024,
                //     flowMap: asphaltNormal,
				// })

				// water.position.y = 0.01;
				// water.rotation.x = Math.PI * - 0.5;
				// scene.add( water )

                // child.material = new THREE.ShaderMaterial({
                //     uniforms: {
                //         uBlurStrength: {value: 6.3},
                //         uDiffuse: {value: null},
                //         uDistortionAmount: {value: 0.1},
                //         uMipmapTextureSize: {value: new THREE.Vector2(960, 100)},
                //         uNormalTexture: {value: asphaltNormal},
                //         uOpacityTexture: {value: asphaltOpacity},
                //         uRoughnessTexture: {value: asphaltRoughes},
                //         uTexScale: {value: new THREE.Vector2(1.38, 4.07)},
                        // uTexture: {value: rainNormal},
                        // uRainCount: {value: 2000},
                        // uTime: {value: 236},
                        // uTextureMatrix: {
                        //     value: {
                        //         elements: [
                        //             -0.22211520908501786,
                        //             -0.11459721405228997,
                        //             -0.22930908264590286,
                        //             -0.22919442810457988,
                        //             0.033524893525413005,
                        //             -0.6768219095099023,
                        //             0.07076431399569552,
                        //             0.07072893183869766,
                        //             -0.46015427455785834,
                        //             -0.5372906695906712,
                        //             -0.9712932137007475,
                        //             -0.970807567093897,
                        //             4.606895512492968,
                        //             3.1090655113895247,
                        //             8.674987790478738,
                        //             9.1706502965835
                        //         ]
                        //     }
                        // }

                //     },
                //     vertexShader: document.getElementById('vertexshader').textContent,
                //     fragmentShader: document.getElementById('fragmentshader').textContent,
                // })

                // console.log(child.material)
            }

            if (child.name === 'shutter') {
                child.material = new THREE.MeshPhysicalMaterial({
                    map: shutterDiffuse,
                    roughnessMap: shutterGlossiness,
                    normalMap: shutterNormal,
                    reflectivity: 0.8,
                    roughness: 0.5,
                    metalness: 0.3,
                    specularIntensity: 0.5
                })

                
            }

            if (child.name === 'top-cover') {
                child.material = new THREE.MeshPhysicalMaterial({
                    map: topCoverDiffuse,
                    reflectivity: 0.7,
                    metalness: 0.2,
                    specularIntensity: 0.5
                })
            }

            if (child.name === 'side-cover') {
                child.material = new THREE.MeshPhysicalMaterial({
                    map: sideCoverDiffuse,
                    reflectivity: 0.7,
                    metalness: 0.2,
                    specularIntensity: 0.5
                })
            }
        }
    })

    scene.add(root)
})

function animate() {

	requestAnimationFrame( animate )
    controls.update()
	renderer.render( scene, camera )
    
}
animate()

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()

    renderer.setSize(window.innerWidth, window.innerHeight)
})