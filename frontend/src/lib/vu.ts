// VU meter ballistics, shared by every theme.
//
// A real VU meter is a moving-coil needle: a mass on a spring with damping.
// It takes about 300 ms to reach a steady reading and overshoots slightly.
// Deflection is proportional to signal voltage, not to decibels, which is why
// the scale is cramped at the low end and 0 VU sits about 70% of the way across.

const OMEGA = 16; // natural frequency, rad/s
const ZETA = 0.8; // damping ratio
const ZERO_VU = 0.7079; // needle position of 0 VU, as a fraction of the sweep to +3
const STALE_MS = 1000;

type Channel = { pos: number; vel: number; target: number };
type Listener = (left: number, right: number) => void;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

class VuEngine {
  private left: Channel = { pos: 0, vel: 0, target: 0 };
  private right: Channel = { pos: 0, vel: 0, target: 0 };
  private listeners = new Set<Listener>();
  private frame = 0;
  private lastFrame = 0;
  private lastPush = 0;

  /** Input level (dBFS) that reads as 0 VU. Follows the music slowly. */
  reference = -30;
  /** Below this level (dBFS) the input counts as silence. */
  silence = -55;

  /** Feed a new pair of RMS levels in dBFS. */
  push(leftDb: number, rightDb: number) {
    const now = performance.now();
    const dt = this.lastPush ? Math.min(1, (now - this.lastPush) / 1000) : 0;
    this.lastPush = now;

    // The amp's pre-out follows the volume knob, so there is no fixed level
    // that means "0 VU". Track it: loud passages pull the reference up within
    // a couple of seconds, and it drifts back down very slowly.
    const loudest = Math.max(leftDb, rightDb);
    if (Number.isFinite(loudest) && loudest > this.silence) {
      if (loudest > this.reference - 3) {
        this.reference += (loudest + 3 - this.reference) * (1 - Math.exp(-dt / 1.5));
      } else {
        this.reference -= 0.05 * dt;
      }
      this.reference = clamp(this.reference, -50, -6);
    }

    this.left.target = this.deflection(leftDb);
    this.right.target = this.deflection(rightDb);
  }

  private deflection(db: number) {
    if (!Number.isFinite(db) || db <= this.silence) return 0;
    return Math.min(1.05, ZERO_VU * Math.pow(10, (db - this.reference) / 20));
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    if (!this.frame) {
      this.lastFrame = performance.now();
      this.frame = requestAnimationFrame(this.step);
    }
    return () => {
      this.listeners.delete(listener);
      if (!this.listeners.size && this.frame) {
        cancelAnimationFrame(this.frame);
        this.frame = 0;
      }
    };
  }

  private step = (now: number) => {
    const dt = clamp((now - this.lastFrame) / 1000, 0, 0.05);
    this.lastFrame = now;
    if (now - this.lastPush > STALE_MS) {
      this.left.target = 0;
      this.right.target = 0;
    }
    this.advance(this.left, dt);
    this.advance(this.right, dt);
    this.listeners.forEach((listener) => listener(this.left.pos, this.right.pos));
    this.frame = requestAnimationFrame(this.step);
  };

  private advance(ch: Channel, dt: number) {
    ch.vel += (OMEGA * OMEGA * (ch.target - ch.pos) - 2 * ZETA * OMEGA * ch.vel) * dt;
    ch.pos += ch.vel * dt;
    // The needle rests on end stops just outside the printed scale.
    if (ch.pos < 0) {
      ch.pos = 0;
      ch.vel = 0;
    } else if (ch.pos > 1.03) {
      ch.pos = 1.03;
      ch.vel = 0;
    }
  }
}

export const vu = new VuEngine();
