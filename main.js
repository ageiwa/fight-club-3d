import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { TextureLoader } from 'three'
import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js'

const scene = new THREE.Scene()
scene.background = new THREE.Color('#e1e1e1')

// lights

const spotLightIntensivity = 0.8
const spotLightColor = 0xbeb8b1
const spotLightAngle = Math.PI/8

// lamp
// rgb(249, 229, 189)

const rLight1 = new THREE.RectAreaLight('rgb(85, 184, 255)', 66, 19.1, 0.2)
rLight1.position.set(0, 8.066, -10.1)
rLight1.rotation.set((90 * Math.PI) / 180, (180 * Math.PI) / 180, 0)
scene.add(rLight1)

// Central
const pLight1 = new THREE.PointLight('rgb(189, 229, 249)', .1, 17, .8)
pLight1.position.y = 2.3
scene.add(pLight1)

// Top ambient
const pLight2 = new THREE.PointLight('rgb(189, 229, 249)', 2, 30)
pLight2.position.y = 30
pLight2.position.z = 0
scene.add(pLight2)

const rectLightHelper = new RectAreaLightHelper( rLight1 )
rLight1.add( rectLightHelper )

// MY LIGHT
// const spotLight = new THREE.SpotLight(spotLightColor, spotLightIntensivity, 0, spotLightAngle)
// spotLight.position.set(0, 100, 0)
// scene.add(spotLight)

// const helperLight = new THREE.SpotLightHelper(spotLight)
// scene.add(helperLight)

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 )

const renderer = new THREE.WebGLRenderer({alpha: true, antialias: true})
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls( camera, renderer.domElement )

camera.position.set( 0, 1, 10 )
controls.update()

// textrures
const txLoader = new TextureLoader()

const brickTexture = txLoader.load('/assets/textures/brick-normal2.jpg')
brickTexture.center = new THREE.Vector2(0.5, 0.5)
brickTexture.repeat.set(5, 8)
brickTexture.wrapS = THREE.RepeatWrapping
brickTexture.wrapT = THREE.RepeatWrapping
brickTexture.rotation = (90 * Math.PI) / 180

// floor textures
const asphaltRoughes = txLoader.load('/assets/textures//asphalt-pbr01/roughness.jpg')
asphaltRoughes.wrapS = THREE.RepeatWrapping
asphaltRoughes.wrapT = THREE.RepeatWrapping

const asphaltOpacity = txLoader.load('/assets/textures//asphalt-pbr01/opacity.jpg')
asphaltOpacity.wrapS = THREE.RepeatWrapping
asphaltOpacity.wrapT = THREE.RepeatWrapping

const asphaltNormal = txLoader.load('/assets/textures//asphalt-pbr01/normal.png')
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
                // console.log(child)
                // child.material = new THREE.MeshPhongMaterial({
                //     color: new THREE.Color("rgb(200, 200, 200)"),
                //     normalMap: asphaltNormal,
                //     map: asphaltRoughes,
                //     shininess: 50,
                //     reflectivity: 0.8,
                //     roughness: 0.5,
                //     metalness: 0.3,
                //     specularIntensity: 0.5
                // })

                // child.material = new THREE.ShaderMaterial({
                    // uniforms: {
                    //     uBlurStrength: {value: 6.3},
                    //     uDiffuse: {value: null},
                    //     uDistortionAmount: {value: 0.1065},
                    //     uMipmapTextureSize: {value: new THREE.Vector2(1200, 98)},
                    //     uNormalTexture: {value: asphaltNormal},
                    //     uOpacityTexture: {value: asphaltOpacity},
                    //     uRainCount: {value: 0},
                    //     uRoughnessTexture: {value: asphaltRoughes},
                    //     uTexScale: {value: new THREE.Vector2(1.38, 4.07)},
                    //     uTexture: {value: asphaltNormal},
                    //     uTextureMatrix: {value: {
                    //         elements: [
                    //             -0.24087545008513545,
                    //             -0.1578764294123152,
                    //             -0.31591081423174655,
                    //             -0.31575285882463067,
                    //             0.033524097819854125,
                    //             -0.6764646672876552,
                    //             0.07122857577037917,
                    //             0.07119296148249397,
                    //             -0.4455410918551935,
                    //             -0.5266614370141302,
                    //             -0.9466401628630969,
                    //             -0.9461668427816653,
                    //             4.621507103784515,
                    //             3.1204092284105576,
                    //             8.700569364865757,
                    //             9.196219080183322
                    //         ]
                    //     }},
                    //     uTime: {value: 1333}
                    // },
                    // vertexShader: document.getElementById('fragment-shader').textContent,
                    // fragmentShader: document.getElementById('fragment-shader').textContent,
                // })

                child.material = new THREE.MeshPhysicalMaterial({
                    normalMap: asphaltNormal,
                    color: new THREE.Color("rgb(150, 150, 150)"),
                })

                console.log(child)
                // child.material = [asphaltRoughes, asphaltOpacity, asphaltNormal]
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