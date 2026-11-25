"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { SceneManager } from "./SceneManager";
import { ConceptScenario } from "./concept-scenarios";
import { buildDotsModel, DotsModel } from "./dots-layout";

const VERT = `
attribute float aSize;
attribute float aAlpha;
attribute vec3 aColor;
uniform float uScale;
varying float vAlpha;
varying vec3 vColor;
void main() {
  vAlpha = aAlpha;
  vColor = aColor;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * uScale / -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

const FRAG = `
varying float vAlpha;
varying vec3 vColor;
void main() {
  float d = length(gl_PointCoord - vec2(0.5));
  if (d > 0.5) discard;
  float core = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(vColor * (0.6 + core * 1.4), vAlpha * (0.35 + core * 0.65));
}`;

interface DotsViewerProps {
  scenario: ConceptScenario;
}

export function DotsViewer({ scenario }: DotsViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stepRef = useRef(0);
  const modelRef = useRef<DotsModel | null>(null);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [hover, setHover] = useState<{ label: string; source: string; x: number; y: number } | null>(null);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setStep((s) => {
        if (s >= scenario.steps.length - 1) {
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 2200);
    return () => window.clearInterval(id);
  }, [playing, scenario.steps.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const model = buildDotsModel(scenario);
    modelRef.current = model;
    const n = model.dots.length;

    const pos = new Float32Array(n * 3);
    const size = new Float32Array(n);
    const alpha = new Float32Array(n);
    const color = new Float32Array(n * 3);
    // Start every dot at its step-0 state so the first frame is already laid out
    model.states[0].forEach((s, i) => {
      pos.set([s.x, s.y, s.z], i * 3);
      size[i] = s.size;
      alpha[i] = s.alpha;
      color.set(s.color, i * 3);
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    geo.setAttribute("aAlpha", new THREE.BufferAttribute(alpha, 1));
    geo.setAttribute("aColor", new THREE.BufferAttribute(color, 3));
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: { uScale: { value: 600 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;

    const manager = new SceneManager({
      container,
      onAnimate: (delta) => {
        // Convert world-space dot size to pixels: drawing-buffer height / (2 * tan(fov / 2)).
        // Uses the container (not `manager`) because this callback also runs once
        // inside the SceneManager constructor, before `manager` is assigned.
        // FOV 45 matches SceneManager's camera. The 2.5 factor makes dots clearly visible.
        const bufH = container.clientHeight * Math.min(window.devicePixelRatio || 1, 2);
        mat.uniforms.uScale.value = (bufH / (2 * Math.tan((45 * Math.PI) / 360))) * 2.5;

        // Ease every dot toward its target for the current step
        const targets = model.states[Math.min(stepRef.current, model.states.length - 1)];
        const k = 1 - Math.exp(-delta * 4.5);
        for (let i = 0; i < n; i++) {
          const t = targets[i];
          pos[i * 3] += (t.x - pos[i * 3]) * k;
          pos[i * 3 + 1] += (t.y - pos[i * 3 + 1]) * k;
          pos[i * 3 + 2] += (t.z - pos[i * 3 + 2]) * k;
          size[i] += (t.size - size[i]) * k;
          alpha[i] += (t.alpha - alpha[i]) * k;
          for (let c = 0; c < 3; c++) color[i * 3 + c] += (t.color[c] - color[i * 3 + c]) * k;
        }
        geo.attributes.position.needsUpdate = true;
        geo.attributes.aSize.needsUpdate = true;
        geo.attributes.aAlpha.needsUpdate = true;
        geo.attributes.aColor.needsUpdate = true;
      },
    });
    manager.worldGroup.add(points);

    // Hover: nearest visible dot to the pointer in screen space
    const canvas = manager.renderer.domElement;
    const v = new THREE.Vector3();
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      let best = -1;
      let bestD = 18;
      for (let i = 0; i < n; i++) {
        if (alpha[i] < 0.2) continue;
        v.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]).project(manager.camera);
        const d = Math.hypot((v.x * 0.5 + 0.5) * rect.width - mx, (-v.y * 0.5 + 0.5) * rect.height - my);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      if (best < 0) {
        setHover((prev) => (prev ? null : prev));
        return;
      }
      const info = model.dots[best];
      setHover({ label: info.label, source: info.source, x: mx, y: my });
    };
    const onLeave = () => setHover(null);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    const onResize = () => manager.resize();
    window.addEventListener("resize", onResize);

    return () => {
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", onResize);
      manager.dispose();
    };
  }, [scenario]);

  const current = scenario.steps[Math.min(step, scenario.steps.length - 1)];

  return (
    <div className="sql3d-container">
      <div className="sql3d-header">
        <div className="sql3d-title-group">
          <span className="sql3d-status-dot" />
          <h3 className="sql3d-title">Dots view: {scenario.title}</h3>
        </div>
      </div>
      <div className="sql3d-viewport" style={{ position: "relative" }}>
        <div ref={containerRef} className="sql3d-canvas-wrap" />
        {hover && (
          <div
            style={{
              position: "absolute",
              left: hover.x + 14,
              top: hover.y + 14,
              pointerEvents: "none",
              background: "rgba(2,6,23,0.9)",
              border: "1px solid #334155",
              borderRadius: 6,
              padding: "4px 8px",
              fontSize: "0.78rem",
              fontFamily: "ui-monospace, monospace",
              color: "#e2e8f0",
            }}
          >
            <span style={{ color: "#38bdf8" }}>{hover.source}</span>: {hover.label}
          </div>
        )}
      </div>
      <div className="sql3d-narration-box">
        <div className="sql3d-narration-header">
          <h4 className="sql3d-step-title">{current.title}</h4>
          {current.sqlSnippet && <code className="sql3d-sql-snippet">{current.sqlSnippet}</code>}
        </div>
        <p className="sql3d-narration-text">{current.narration}</p>
      </div>
      <div className="sql3d-controls-bar">
        <div className="sql3d-btn-group">
          <button className="sql3d-btn" onClick={() => setStep(0)}>
            Restart
          </button>
          <button className="sql3d-btn" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
            Prev
          </button>
          <button className="sql3d-btn sql3d-btn-primary" onClick={() => setPlaying((p) => !p)}>
            {playing ? "Pause" : "Play"}
          </button>
          <button
            className="sql3d-btn"
            disabled={step >= scenario.steps.length - 1}
            onClick={() => setStep((s) => Math.min(scenario.steps.length - 1, s + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
