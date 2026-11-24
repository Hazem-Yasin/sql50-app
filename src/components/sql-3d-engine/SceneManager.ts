import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export interface SceneManagerOptions {
  container: HTMLDivElement;
  onAnimate?: (delta: number) => void;
}

export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public controls: OrbitControls;
  
  private container: HTMLDivElement;
  private animationFrameId: number | null = null;
  private clock: THREE.Clock;
  private onAnimateCallback?: (delta: number) => void;
  private isDisposed = false;

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
  }

  public resetCamera(): void {
    this.camera.position.set(0, 18, 28);
    this.controls.target.set(0, 2, 0);
    this.controls.update();
  }

  public focusOnPosition(target: THREE.Vector3, distance = 16): void {
    this.controls.target.copy(target);
    this.camera.position.set(target.x, target.y + distance * 0.6, target.z + distance);
    this.controls.update();
  }

  private start(): void {
    const loop = () => {
      if (this.isDisposed) return;
      this.animationFrameId = requestAnimationFrame(loop);
      
      const delta = this.clock.getDelta();
      this.controls.update();
      
      if (this.onAnimateCallback) {
        this.onAnimateCallback(delta);
      }

      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  public dispose(): void {
    this.isDisposed = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    this.controls.dispose();
    this.renderer.dispose();

    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }

    // Traverse and dispose materials and geometries in scene
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else if (obj.material) {
          obj.material.dispose();
        }
      }
    });
  }
}
