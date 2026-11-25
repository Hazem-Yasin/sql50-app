import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { disposeObject3D } from "./mesh-generators";

export interface SceneManagerOptions {
  container: HTMLDivElement;
  onAnimate?: (delta: number) => void;
}

export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public controls: OrbitControls;
  public composer: EffectComposer;
  public bloomPass: UnrealBloomPass;
  
  private container: HTMLDivElement;
  private animationFrameId: number | null = null;
  private clock: THREE.Clock;
  private onAnimateCallback?: (delta: number) => void;
  private isDisposed = false;
  private isVisible = true;
  private cameraTween: {
    fromPos: THREE.Vector3;
    toPos: THREE.Vector3;
    fromTarget: THREE.Vector3;
    toTarget: THREE.Vector3;
    elapsed: number;
    duration: number;
  } | null = null;
  private visibilityObserver: IntersectionObserver | null = null;

  // Root group for all dynamic SQL entities (tables, rows, join lines, output platform)
  public worldGroup: THREE.Group;

  constructor(options: SceneManagerOptions) {
    this.container = options.container;
    this.onAnimateCallback = options.onAnimate;
    this.clock = new THREE.Clock();

    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b0f19); // Dark navy studio backdrop
    this.scene.fog = new THREE.FogExp2(0x0b0f19, 0.015);

    // 2. Camera setup
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 500;
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 18, 28);

    // 3. Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 3b. Post-processing: MSAA target keeps edges smooth, bloom adds real glow
    const pixelRatio = this.renderer.getPixelRatio();
    const target = new THREE.WebGLRenderTarget(width * pixelRatio, height * pixelRatio, {
      type: THREE.HalfFloatType,
      samples: 4,
    });
    this.composer = new EffectComposer(this.renderer, target);
    this.composer.setPixelRatio(pixelRatio);
    this.composer.setSize(width, height);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.55, 0.6, 0.85);
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(new OutputPass());

    // 4. Orbit Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05; // Prevent camera clipping beneath floor
    this.controls.minDistance = 8;
    this.controls.maxDistance = 60;
    this.controls.target.set(0, 2, 0);

    // 5. Lighting
    this.initLights();

    // 6. Environment Grid
    this.initEnvironment();

    // 7. World Entity Group
    this.worldGroup = new THREE.Group();
    this.scene.add(this.worldGroup);

    // 8. Start Render Loop
    this.start();
  }

  private initLights(): void {
    // Ambient fill
    const ambientLight = new THREE.AmbientLight(0xd0e0ff, 0.7);
    this.scene.add(ambientLight);

    // Main Key Light
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(15, 25, 20);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 80;
    keyLight.shadow.camera.left = -25;
    keyLight.shadow.camera.right = 25;
    keyLight.shadow.camera.top = 25;
    keyLight.shadow.camera.bottom = -25;
    keyLight.shadow.bias = -0.0005;
    this.scene.add(keyLight);

    // Soft Cyan Rim/Fill Light
    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    fillLight.position.set(-20, 15, -10);
    this.scene.add(fillLight);

    // Subtle Indigo Uplight
    const upLight = new THREE.PointLight(0x6366f1, 1.2, 40);
    upLight.position.set(0, 1, 0);
    this.scene.add(upLight);
  }

  private initEnvironment(): void {
    // Studio Datum Floor Grid
    const gridHelper = new THREE.GridHelper(60, 60, 0x334155, 0x1e293b);
    gridHelper.position.y = 0;
    this.scene.add(gridHelper);

    // Radial floor plane receiving soft shadows
    const shadowPlaneGeo = new THREE.PlaneGeometry(60, 60);
    const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.4 });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.01;
    shadowPlane.receiveShadow = true;
    this.scene.add(shadowPlane);
  }

  public resize(): void {
    if (this.isDisposed || !this.container) return;
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 500;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);
  }

  public resetCamera(): void {
    this.tweenCamera(new THREE.Vector3(0, 18, 28), new THREE.Vector3(0, 2, 0));
  }

  public focusOnPosition(target: THREE.Vector3, distance = 16): void {
    this.tweenCamera(
      new THREE.Vector3(target.x, target.y + distance * 0.6, target.z + distance),
      target.clone()
    );
  }

  /** Smoothly moves the camera and orbit target (ease-in-out, ~0.8s). */
  private tweenCamera(toPos: THREE.Vector3, toTarget: THREE.Vector3, duration = 0.8): void {
    this.cameraTween = {
      fromPos: this.camera.position.clone(),
      toPos,
      fromTarget: this.controls.target.clone(),
      toTarget,
      elapsed: 0,
      duration,
    };
  }

  private updateCameraTween(delta: number): void {
    const tw = this.cameraTween;
    if (!tw) return;
    tw.elapsed += delta;
    const t = Math.min(tw.elapsed / tw.duration, 1);
    const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    this.camera.position.lerpVectors(tw.fromPos, tw.toPos, e);
    this.controls.target.lerpVectors(tw.fromTarget, tw.toTarget, e);
    if (t >= 1) this.cameraTween = null;
  }

  private start(): void {
    // Pause the render loop while the canvas is scrolled off-screen
    if (typeof IntersectionObserver !== "undefined") {
      this.visibilityObserver = new IntersectionObserver((entries) => {
        this.isVisible = entries.some((e) => e.isIntersecting);
        if (this.isVisible) this.clock.getDelta(); // discard the paused gap
      });
      this.visibilityObserver.observe(this.container);
    }

    const loop = () => {
      if (this.isDisposed) return;
      this.animationFrameId = requestAnimationFrame(loop);
      if (!this.isVisible) return;

      const delta = Math.min(this.clock.getDelta(), 0.1);
      this.updateCameraTween(delta);
      this.controls.update();
      
      if (this.onAnimateCallback) {
        this.onAnimateCallback(delta);
      }

      this.composer.render();
    };
    loop();
  }

  public dispose(): void {
    this.isDisposed = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    this.controls.dispose();
    this.composer.dispose();
    this.renderer.dispose();

    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }

    this.visibilityObserver?.disconnect();
    this.visibilityObserver = null;

    // Dispose geometries, materials and label textures (meshes, sprites, lines)
    disposeObject3D(this.scene);
  }
}
