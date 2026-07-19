/* ==========================================================================
   ARKAND CARE — The Guide
   A small 3D Arkand "A" mark that gently travels down the side of every page
   as you scroll — a quiet companion that shows you where to read. It never
   writes anything; it simply moves, leans and nods toward the story.
   Falls back to a static mark, and stands perfectly still, when motion is
   reduced or WebGL is unavailable.
   ========================================================================== */

const GOLD = 0xb8892a;
const GOLD_LIGHT = 0xcca040;
const CREAM = 0xf1ead9;
const FOREST_DEEP = 0x122018;

function webglOK() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch (e) { return false; }
}

/** Build the extruded "A" (mirrors the logo geometry, cream + gold). */
function buildAMark(THREE) {
  const group = new THREE.Group();
  const S = 0.055, CX = 40, CY = 46;
  const pt = (x, y) => [(x - CX) * S, (CY - y) * S];
  const shapeFrom = (pts) => {
    const s = new THREE.Shape();
    pts.forEach(([x, y], i) => { const [wx, wy] = pt(x, y); i ? s.lineTo(wx, wy) : s.moveTo(wx, wy); });
    s.closePath();
    return s;
  };
  const ex = { depth: 0.3, bevelEnabled: true, bevelThickness: 0.045, bevelSize: 0.04, bevelSegments: 3, curveSegments: 5 };
  const creamMat = new THREE.MeshStandardMaterial({ color: CREAM, roughness: 0.6, metalness: 0.06 });
  const goldMat = new THREE.MeshStandardMaterial({ color: GOLD, roughness: 0.3, metalness: 0.9, emissive: 0x2a1d06, emissiveIntensity: 0.4 });
  const parts = [
    [shapeFrom([[2, 86], [40, 8], [44, 16], [20, 86]]), creamMat],
    [shapeFrom([[78, 86], [40, 8], [36, 16], [60, 86]]), creamMat],
    [shapeFrom([[36, 16], [40, 8], [44, 16]]), goldMat],
    [shapeFrom([[9, 51.5], [71, 51.5], [71, 55], [9, 55]]), goldMat],
  ];
  parts.forEach(([shape, mat]) => {
    const m = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, ex), mat);
    m.position.z = -ex.depth / 2;
    group.add(m);
  });
  return group;
}

/**
 * Initialise the guide inside `wrap` (a small fixed element).
 * Returns a controller: { nudge(dir), setPaused(bool), destroy() } or null.
 */
export async function initCompanion(wrap, { onReady } = {}) {
  if (!wrap || !webglOK()) return null;

  let THREE;
  try { THREE = await import('three'); } catch (e) { return null; }

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  wrap.appendChild(canvas);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch (e) { canvas.remove(); return null; }

  const size = () => Math.max(wrap.clientWidth || 96, 48);
  let s = size();
  renderer.setSize(s, s);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0, 7.4);

  scene.add(new THREE.AmbientLight(0xffe9c4, 0.6));
  const key = new THREE.DirectionalLight(0xffd98a, 1.4);
  key.position.set(2.5, 4, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x6a4a5e, 0.5);
  rim.position.set(-3, 1, -4);
  scene.add(rim);
  const glow = new THREE.PointLight(GOLD_LIGHT, 4, 6, 2);
  glow.position.set(0, 1.6, 1.6);
  scene.add(glow);

  const mark = buildAMark(THREE);
  scene.add(mark);

  // Interaction / animation state
  let targetLean = 0;    // set by scroll direction
  let lean = 0;
  let nudgeT = 0;        // countdown for a "nod"
  let nudgeDir = 1;
  let paused = false;
  let visible = true;
  let raf, ready = false, intro = 0;
  const clock = new THREE.Clock();

  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.01 });
  io.observe(wrap);

  const onResize = () => { s = size(); renderer.setSize(s, s); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); };
  window.addEventListener('resize', onResize);

  mark.scale.setScalar(0.2);

  let renderErrors = 0, torn = false;

  function tick() {
    if (torn) return;
    raf = requestAnimationFrame(tick);
    if (!visible || document.hidden) return;
    const t = clock.getElapsedTime();
    const dt = Math.min(clock.getDelta(), 0.05);

    // Gentle intro pop.
    if (intro < 1) {
      intro = Math.min(1, intro + dt * 1.6);
      const e = 1 - Math.pow(1 - intro, 3);
      mark.scale.setScalar(0.2 + 0.8 * e);
      if (!ready && intro > 0.3) { ready = true; onReady && onReady(); }
    }

    if (paused) {
      // Hold a calm, upright pose.
      mark.rotation.set(0, mark.rotation.y + (0 - mark.rotation.y) * 0.1, 0);
      renderSafe();
      return;
    }

    lean += (targetLean - lean) * 0.06;
    let nod = 0;
    if (nudgeT > 0) {
      nudgeT -= dt;
      nod = Math.sin((1 - Math.max(nudgeT, 0) / 0.7) * Math.PI) * 0.35 * nudgeDir;
    }

    mark.rotation.y = Math.sin(t * 0.5) * 0.35 + lean * 0.6;
    mark.rotation.x = -0.04 + lean * 0.5 + nod;
    mark.rotation.z = Math.sin(t * 0.4) * 0.03;
    mark.position.y = Math.sin(t * 0.9) * 0.05;
    glow.intensity = 3.4 + Math.sin(t * 1.4) * 1.1;

    renderSafe();
  }

  function renderSafe() {
    try { renderer.render(scene, camera); }
    catch (err) { if (++renderErrors > 2) controller.destroy(); }
  }
  tick();

  const controller = {
    // dir: +1 leaning/looking down, -1 up. Called when passing a section.
    nudge(dir = 1) { if (paused) return; nudgeDir = dir; nudgeT = 0.7; },
    // Lean set continuously from scroll velocity (-1..1).
    setLean(v) { targetLean = Math.max(-1, Math.min(1, v)); },
    setPaused(v) { paused = v; },
    destroy() {
      torn = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      io.disconnect();
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose && m.dispose());
      });
      renderer.dispose();
      canvas.remove();
    },
  };
  return controller;
}
