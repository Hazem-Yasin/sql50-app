import * as THREE from "three";

/**
 * Pooled additive-blend particle system used for match sparks, reject shards
 * and ambient effects. One draw call, fixed capacity.
 */
export class ParticleSystem {
  public points: THREE.Points;
  private capacity: number;
  private positions: Float32Array;
  private colors: Float32Array;
  private baseColors: Float32Array;
  private velocities: Float32Array;
  private life: Float32Array;
  private maxLife: Float32Array;
  private gravity: number;
  private cursor = 0;
  /** Set true (e.g. reduced-motion) to suppress all bursts. */
  public disabled = false;

  constructor(capacity = 600, gravity = -9) {
    this.capacity = capacity;
    this.gravity = gravity;
    this.positions = new Float32Array(capacity * 3);
    this.colors = new Float32Array(capacity * 3);
    this.baseColors = new Float32Array(capacity * 3);
    this.velocities = new Float32Array(capacity * 3);
    this.life = new Float32Array(capacity);
    this.maxLife = new Float32Array(capacity).fill(1);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(this.positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(this.colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.28,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    // Park every particle far away until emitted
    for (let i = 0; i < capacity; i++) this.positions[i * 3 + 1] = -999;
  }

  /** Radial burst of particles at a world position. */
  burst(origin: THREE.Vector3, color: number, count = 40, speed = 5, spread = 1): void {
    if (this.disabled) return;
    const c = new THREE.Color(color);
    for (let n = 0; n < count; n++) {
      const i = this.cursor;
      this.cursor = (this.cursor + 1) % this.capacity;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const s = speed * (0.4 + Math.random() * 0.6);
      this.positions[i * 3] = origin.x + (Math.random() - 0.5) * spread;
      this.positions[i * 3 + 1] = origin.y + (Math.random() - 0.5) * 0.4;
      this.positions[i * 3 + 2] = origin.z + (Math.random() - 0.5) * spread;
      this.velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * s;
      this.velocities[i * 3 + 1] = Math.abs(Math.cos(phi)) * s + 1.5;
      this.velocities[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * s;
      this.baseColors[i * 3] = c.r;
      this.baseColors[i * 3 + 1] = c.g;
      this.baseColors[i * 3 + 2] = c.b;
      this.colors[i * 3] = c.r;
      this.colors[i * 3 + 1] = c.g;
      this.colors[i * 3 + 2] = c.b;
      this.maxLife[i] = 0.6 + Math.random() * 0.7;
      this.life[i] = this.maxLife[i];
    }
  }

  update(delta: number): void {
    let dirty = false;
    for (let i = 0; i < this.capacity; i++) {
      if (this.life[i] <= 0) continue;
      dirty = true;
      this.life[i] -= delta;
      const fade = Math.max(this.life[i] / this.maxLife[i], 0);
      this.velocities[i * 3 + 1] += this.gravity * delta;
      this.positions[i * 3] += this.velocities[i * 3] * delta;
      this.positions[i * 3 + 1] += this.velocities[i * 3 + 1] * delta;
      this.positions[i * 3 + 2] += this.velocities[i * 3 + 2] * delta;
      if (this.life[i] <= 0) {
        this.positions[i * 3 + 1] = -999;
      }
      // Fade by dimming colour (additive blending => dark = invisible)
      this.colors[i * 3] = this.baseColors[i * 3] * fade;
      this.colors[i * 3 + 1] = this.baseColors[i * 3 + 1] * fade;
      this.colors[i * 3 + 2] = this.baseColors[i * 3 + 2] * fade;
    }
    if (dirty) {
      this.points.geometry.attributes.position.needsUpdate = true;
      this.points.geometry.attributes.color.needsUpdate = true;
    }
  }

  dispose(): void {
    this.points.geometry.dispose();
    (this.points.material as THREE.Material).dispose();
  }
}

/**
 * Translucent scanner beam that sweeps across a row (left -> right) once.
 */
export class ScannerBeam {
  public mesh: THREE.Mesh;
  private elapsed = 0;
  private duration = 0.9;
  private active = false;
  private fromX = 0;
  private toX = 0;

  constructor() {
    const geo = new THREE.PlaneGeometry(0.35, 1.6);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.rotation.y = Math.PI / 2;
    this.mesh.visible = false;
  }

  /** Sweep across a row mesh's world-space width. */
  sweep(rowMesh: THREE.Object3D, width: number, color = 0x67e8f9): void {
    const p = new THREE.Vector3();
    rowMesh.getWorldPosition(p);
    this.mesh.position.set(p.x - width / 2, p.y + 0.2, p.z);
    this.fromX = p.x - width / 2;
    this.toX = p.x + width / 2;
    (this.mesh.material as THREE.MeshBasicMaterial).color.setHex(color);
    this.elapsed = 0;
    this.active = true;
    this.mesh.visible = true;
  }

  update(delta: number): void {
    if (!this.active) return;
    this.elapsed += delta;
    const t = Math.min(this.elapsed / this.duration, 1);
    this.mesh.position.x = this.fromX + (this.toX - this.fromX) * t;
    (this.mesh.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - Math.pow(t, 3));
    if (t >= 1) {
      this.active = false;
      this.mesh.visible = false;
    }
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
