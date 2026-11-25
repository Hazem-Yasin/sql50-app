/**
 * Tiny WebAudio sound engine for the 3D viewer. Lazy-initialised on first
 * play (browsers require a user gesture), no assets needed.
 */
export type SfxKind = "scan" | "match" | "reject" | "result";

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, endFreq: number, duration: number, type: OscillatorType, gain: number): void {
  const ac = getCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  const now = ac.currentTime;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
  g.gain.setValueAtTime(gain, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(g).connect(ac.destination);
  osc.start(now);
  osc.stop(now + duration);
}

export function playSfx(kind: SfxKind): void {
  switch (kind) {
    case "scan":
      tone(300, 900, 0.35, "sine", 0.05);
      break;
    case "match":
      tone(520, 520, 0.12, "triangle", 0.08);
      setTimeout(() => tone(780, 780, 0.2, "triangle", 0.08), 110);
      break;
    case "reject":
      tone(220, 70, 0.3, "sawtooth", 0.05);
      break;
    case "result":
      tone(660, 990, 0.18, "sine", 0.06);
      break;
  }
}
