import * as THREE from '//cdn.skypack.dev/three@0.132?min'
import { OrbitControls } from '//cdn.skypack.dev/three@0.132/examples/jsm/controls/OrbitControls?min'
import { EffectComposer } from '//cdn.skypack.dev/three@0.132/examples/jsm/postprocessing/EffectComposer?min'
import { RenderPass } from '//cdn.skypack.dev/three@0.132/examples/jsm/postprocessing/RenderPass?min'
import { UnrealBloomPass } from '//cdn.skypack.dev/three@0.132/examples/jsm/postprocessing/UnrealBloomPass?min'
import { Curves } from '//cdn.skypack.dev/three@0.132/examples/jsm/curves/CurveExtras?min'
import { Strip } from '//cdn.jsdelivr.net/gh/ycw/three-strip@0.1.8/build/three-strip.js'

//// main

const renderer = new THREE.WebGLRenderer({ antialias: true });
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 2, .1, 100);
const controls = new OrbitControls(camera, renderer.domElement);

camera.position.set(0, 0, 2);
controls.enableDamping = true;
controls.autoRotate = true;

const light = new THREE.DirectionalLight();
scene.add(light);

Strip.THREE = THREE;

//// pts ( pluck from attrib pos )
const curve0 = new Curves.TorusKnot(1);
const strip0 = new Strip(curve0, 200, 1, (i, I) => i / I * Math.PI * 2 * 10);
const pts = [];
const aPo = strip0.geometry.attributes.position;
for (let i = 0, I = aPo.count; i < I; i += 2) {
  pts.push(new THREE.Vector3(aPo.getX(i), aPo.getY(i), aPo.getZ(i)));
}
pts.push(pts[0]);

//// params
const len = pts.length * 3 / 4 | 0;
const seg = 200;
const radius = (i, I) => Math.pow(i % 20 / 20, 4) * 0.2;

//// strip
const curve = new THREE.CatmullRomCurve3(pts.slice(0, len));
const strip = new Strip(curve, seg, radius, 0, Strip.UvFns[1]);

//// bake
const strips = [];
const ps = [];
for (let i = 0; i < (pts.length); ++i) {
  ps.length = 0;
  for (let j = 0; j < len; ++j) {
    ps.push(pts[(i + j) % pts.length]);
  }
  const curve = new THREE.CatmullRomCurve3(ps);
  strips.push(new Strip(curve, seg, radius, 0));
}

//// mesh - photo by Alfred Kenneally (https://unsplash.com/photos/5PJmsAqM_Nw)
const url0 = 'https://images.unsplash.com/photo-1630775004628-15ab875b9620?ixid=MnwxMjA3fDB8MHxlZGl0b3JpYWwtZmVlZHwzNnx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=60';
const tex0 = new THREE.TextureLoader().load(url0);
tex0.wrapS = tex0.wrapT = THREE.RepeatWrapping;
tex0.repeat.set(50, 1);
const mat = new THREE.MeshLambertMaterial({
  alphaMap: tex0, alphaTest: .5,
  map: tex0, side: THREE.DoubleSide,
  emissive: 'red', emissiveIntensity: 1 // <- tint frm g to r
});
const mesh = new THREE.Mesh(strip.geometry, mat);
scene.add(mesh);

//// render ( stop mo )
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(), 1, 1, .4));

let t0 = 0, i = 0;
renderer.setAnimationLoop((t) => {
  composer.render();
  controls.update();
  if (t - t0 > 100) {
    i = (t / 1e2) % (strips.length) | 0;
    strip.geometry.setAttribute('position', strips[i].geometry.attributes.position);
    t0 = t;
  }
});

//// view
function resize(w, h, dpr = devicePixelRatio) {
  renderer.setPixelRatio(dpr);
  renderer.setSize(w, h, false);
  composer.setPixelRatio(dpr);
  composer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
addEventListener('resize', () => resize(innerWidth, innerHeight));
dispatchEvent(new Event('resize'));
document.body.prepend(renderer.domElement);