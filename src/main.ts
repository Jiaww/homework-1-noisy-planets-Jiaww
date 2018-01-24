import {vec3} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Icosphere from './geometry/Icosphere';
import Square from './geometry/Square';
import Cube from './geometry/Cube';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
export const controls = {
  tesselations: 8,
  'Load Scene': loadScene, // A function pointer, essentially
  Color: [255, 0, 0],
  Color2: [0, 255, 255],  
  Shader: 'planet',
  CloudTrig: true,
  FunnyTrig: false,
  ScaleSpeed: 1.0,
  RotateSpeed: 1.0,
  Octave: 7.0,
  FloatSpeed: 1.0,
  FloatAmp: 1.0,
  OceanColor: [42, 159, 207, 1.0],
  OceanHeight: 1.0,
  CoastColor: [233, 200, 143, 1.0],
  CoastHeight: 0.02,
  FoliageColor: [0, 89, 27, 1.0], 
  TropicalColor: [168, 220, 15, 1.0], 
  MountainColor: [77, 56, 6, 1.0],
  SnowColor: [255, 255, 255, 1.0],
  SnowHeight: 1.10,
  PolarCapsAttitude: 1.1,
  TerrainExp: 0.63,
  TerrainSeed: 0.0,
  SunPositionX: 1.0,
  SunPositionY: 1.0,
  SunPositionZ: 1.0,
  SunColor: [255, 255, 232, 1.0],
  SunIntensity: 1.0,
};


let icosphere: Icosphere;
let square: Square;
let cube: Cube;

function loadScene() {
  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, controls.tesselations);
  icosphere.create();
  icosphere.loadTexture('envmap.jpg');
  square = new Square(vec3.fromValues(0, 0, 0));
  square.create();
  cube = new Cube(vec3.fromValues(0, 0, 0));
  cube.create();
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();
  gui.add(controls, 'tesselations', 0, 12).step(1);
  gui.add(controls, 'Load Scene');
  var planetSetting = gui.addFolder('Planet Setting');  
  planetSetting.addColor(controls, 'OceanColor');
  planetSetting.addColor(controls, 'SnowColor');
  planetSetting.addColor(controls, 'CoastColor');
  planetSetting.addColor(controls, 'MountainColor');
  planetSetting.addColor(controls, 'FoliageColor');
  planetSetting.addColor(controls, 'TropicalColor');
  planetSetting.add(controls, 'OceanHeight', 0.0, 1.50).step(0.01);
  planetSetting.add(controls, 'CoastHeight', 0.0, 0.04).step(0.01);
  planetSetting.add(controls, 'SnowHeight', 0.0, 2.00).step(0.01);
  planetSetting.add(controls, 'PolarCapsAttitude', 0.0, 2.0).step(0.01);
  planetSetting.add(controls, 'TerrainExp', 0.0, 1.0).step(0.01);
  planetSetting.add(controls, 'TerrainSeed', 0.0, 100.0).step(1.0);
  planetSetting.add(controls, 'Octave', 0.0, 10.0).step(1.0);

  var sunSetting = gui.addFolder('Sun Setting');
  sunSetting.add(controls, 'SunPositionX', -1.0, 1.0).step(0.1);
  sunSetting.add(controls, 'SunPositionY', -1.0, 1.0).step(0.1);
  sunSetting.add(controls, 'SunPositionZ', -1.0, 1.0).step(0.1);
  sunSetting.addColor(controls, 'SunColor');
  sunSetting.add(controls, 'SunIntensity', 0.0, 2.0).step(0.1);

  gui.add(controls, 'Shader', ['lambert', 'funny', 'perlin3D', 'perlin3D_BlinnPhong', 'planet'])
  gui.add(controls, 'CloudTrig')
  gui.add(controls, 'FunnyTrig')
  gui.add(controls, 'FloatSpeed', 0.0, 10.0).step(0.1);

  var otherSetting = gui.addFolder('Other Setting');  
  otherSetting.addColor(controls, 'Color');
  otherSetting.addColor(controls, 'Color2');
  otherSetting.add(controls, 'ScaleSpeed', 0.1, 10.0).step(0.1);
  otherSetting.add(controls, 'RotateSpeed', 0, 2.0).step(0.1);
  otherSetting.add(controls, 'FloatAmp', 0.0, 10.0).step(0.1);

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(0, 0, 5), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.0, 0.0, 0.00, 1);
  gl.enable(gl.DEPTH_TEST);

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
  ]);

  const funny = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/funny-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/funny-frag.glsl')),
  ]);

  const perlin3D = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/perlin3D-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/perlin3D-frag.glsl')),
  ]);

  const perlin3D_BP = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/perlin3D_BlinnPhong-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/perlin3D_BlinnPhong-frag.glsl')),
  ]);

  const planet = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/planet-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/planet-frag.glsl')),
  ]);

  const cloud = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/cloud-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/cloud-frag.glsl')),
  ]);
  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.FRONT);
    let shader;
    if (controls.Shader == 'lambert')
      shader = lambert;
    else if (controls.Shader == 'funny')
      shader = funny;
    else if (controls.Shader == 'perlin3D')
      shader = perlin3D;
    else if (controls.Shader == 'perlin3D_BlinnPhong')
      shader = perlin3D_BP;
    else if (controls.Shader == 'planet')
      shader = planet

    if (shader == planet){
      gl.disable(gl.BLEND);
      renderer.render(camera, shader, [icosphere,]);
      if (controls.CloudTrig){
        gl.enable(gl.BLEND);
        renderer.render(camera, cloud, [icosphere,]);
      }
    }
    else{
      renderer.render(camera, shader, [
      icosphere,
      //square,
      //cube,
    ]);
    }
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  // Start the render loop
  tick();
}

main();
