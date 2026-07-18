/* ==========================================================================
   ARKAND CARE — Hero 3D
   A warm, slowly-rotating extruded "A" mark with gold light catching the apex
   and crossbar, floating in soft golden dust motes. Responds gently to scroll
   and mouse. Falls back to a static branded panel when WebGL is unavailable,
   the device is low-powered, or the visitor prefers reduced motion.
   ========================================================================== */

// Brand colours
const FOREST = 0x1b3028;
const FOREST_DEEP = 0x122018;
const GOLD = 0xb8892a;
const GOLD_LIGHT = 0xcca040;
const CREAM = 0xfaf8f4;

/**
 * Detect whether we should attempt the 3D scene at all.
 * We bail early on reduced-motion, missing WebGL, or clearly low-powered
 * devices so nobody gets a janky experience.
 */
function shouldRender3D() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;

  // Very small memory / low core-count devices → keep it calm & static.
  const mem = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  if (mem <= 2 || cores <= 2) return false;

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    return !!gl;
  } catch (e) {
    return false;
  }
}

/**
 * Build the geometric "A" as a group of extruded shapes, mirroring the logo:
 *   - two forest-green strokes rising to a peak
 *   - a gold apex triangle
 *   - a gold crossbar
 * SVG viewBox is 0 0 80 88 (y-down); we flip Y and centre it.
 */
async function buildAMark(THREE) {
  const group = new THREE.Group();
  const S = 0.06; // scale from SVG units to world units
  const CX = 40, CY = 46; // centring offsets (approx visual centre)

  // Convert an SVG point [x, y] into a centred, Y-flipped world point.
  const pt = (x, y) => [(x - CX) * S, (CY - y) * S];

  const makeShape = (points) => {
    const shape = new THREE.Shape();
    points.forEach(([x, y], i) => {
      const [wx, wy] = pt(x, y);
      if (i === 0) shape.moveTo(wx, wy);
      else shape.lineTo(wx, wy);
    });
    shape.closePath();
    return shape;
  };

  const extrudeOpts = {
    depth: 0.34,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.045,
    bevelSegments: 4,
    curveSegments: 6,
  };

  // Strokes — the brand's cream logo variant, for dark forest backgrounds.
  // A soft warm cream that catches the golden light with dignity.
  const forestMat = new THREE.MeshStandardMaterial({
    color: 0xf1ead9,
    roughness: 0.62,
    metalness: 0.05,
  });
  // Gold accents — metallic, catching the warm light
  const goldMat = new THREE.MeshStandardMaterial({
    color: GOLD,
    roughness: 0.28,
    metalness: 0.92,
    emissive: 0x2a1d06,
    emissiveIntensity: 0.4,
  });

  const leftStroke = makeShape([[2, 86], [40, 8], [44, 16], [20, 86]]);
  const rightStroke = makeShape([[78, 86], [40, 8], [36, 16], [60, 86]]);
  const apex = makeShape([[36, 16], [40, 8], [44, 16]]);
  const bar = makeShape([[9, 51.5], [71, 51.5], [71, 55], [9, 55]]);

  const meshes = [
    new THREE.Mesh(new THREE.ExtrudeGeometry(leftStroke, extrudeOpts), forestMat),
    new THREE.Mesh(new THREE.ExtrudeGeometry(rightStroke, extrudeOpts), forestMat),
    new THREE.Mesh(new THREE.ExtrudeGeometry(apex, extrudeOpts), goldMat),
    new THREE.Mesh(new THREE.ExtrudeGeometry(bar, extrudeOpts), goldMat),
  ];

  meshes.forEach((m) => group.add(m));

  // Centre the extrusion depth on Z.
  group.children.forEach((m) => (m.position.z = -extrudeOpts.depth / 2));

  return group;
}

/** Soft, slowly drifting dust motes — warm light in a room. */
function buildMotes(THREE, count) {
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  const colors = new Float32Array(count * 3);
  const palette = [
    new THREE.Color(GOLD_LIGHT),
    new THREE.Color(GOLD),
    new THREE.Color(CREAM),
  ];

  for (let i = 0; i < count; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 12;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 9;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1;
    speeds[i] = 0.02 + Math.random() * 0.06;
    const c = palette[Math.floor(Math.random() * palette.length)];
    colors[i * 3 + 0] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  // Round, soft sprite drawn to a small canvas texture.
  const tex = new THREE.CanvasTexture(makeMoteTexture());
  if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.PointsMaterial({
    size: 0.14,
    map: tex,
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geo, mat);
  points.userData.speeds = speeds;
  return points;
}

function makeMoteTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,0.95)');
  g.addColorStop(0.3, 'rgba(255,236,190,0.7)');
  g.addColorStop(1, 'rgba(255,236,190,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return c;
}

/**
 * Initialise the hero scene inside `wrap`. Returns a small controller with a
 * `destroy()` method, or null if 3D could not start (caller keeps fallback).
 */
export async function initHero3D(wrap, { onReady, onFallback } = {}) {
  if (!wrap || !shouldRender3D()) return null;

  let THREE;
  try {
    THREE = await import('three');
  } catch (e) {
    return null; // library failed to load → graceful fallback stays
  }

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  wrap.appendChild(canvas);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
  } catch (e) {
    canvas.remove();
    return null;
  }

  const getSize = () => ({ w: wrap.clientWidth || window.innerWidth, h: wrap.clientHeight || window.innerHeight });
  let { w, h } = getSize();

  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(FOREST_DEEP, 6, 14);

  const camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 100);
  camera.position.set(0, 0.2, 9.6);

  // --- Lighting: warm, soft, dignified ---
  const ambient = new THREE.AmbientLight(0xffe9c4, 0.5);
  scene.add(ambient);

  // Key light — warm gold, catches the apex & crossbar
  const key = new THREE.DirectionalLight(0xffd98a, 1.25);
  key.position.set(3, 5, 5);
  scene.add(key);

  // Rim / fill from behind in fig tone for depth
  const rim = new THREE.DirectionalLight(0x6a4a5e, 0.6);
  rim.position.set(-4, 2, -5);
  scene.add(rim);

  // A gentle gold point light that lives near the apex
  const apexGlow = new THREE.PointLight(GOLD_LIGHT, 6, 6, 2);
  apexGlow.position.set(0, 2.2, 1.5);
  scene.add(apexGlow);

  // --- Build the mark & motes ---
  const aMark = await buildAMark(THREE);
  scene.add(aMark);

  const moteCount = Math.min(w < 700 ? 90 : 160, 200);
  const motes = buildMotes(THREE, moteCount);
  scene.add(motes);

  // Interaction state
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let scrollY = 0;
  let reduced = false;

  const onPointerMove = (e) => {
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    pointer.tx = nx;
    pointer.ty = ny;
  };
  const onScroll = () => { scrollY = window.scrollY || 0; };

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });

  const onResize = () => {
    ({ w, h } = getSize());
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  };
  window.addEventListener('resize', onResize);

  // Pause rendering when the hero is off-screen (perf & battery).
  let visible = true;
  const io = new IntersectionObserver(
    ([entry]) => { visible = entry.isIntersecting; },
    { threshold: 0.01 }
  );
  io.observe(wrap);

  // Fade the mark in on first frame.
  aMark.scale.setScalar(0.86);
  let intro = 0;

  const clock = new THREE.Clock();
  let raf;
  let ready = false;

  const positionsAttr = motes.geometry.getAttribute('position');
  const speeds = motes.userData.speeds;

  // If rendering throws (e.g. a flaky software rasteriser), we don't want to
  // spam errors — after a couple of failures we tear down and let the static
  // branded fallback take over gracefully.
  let renderErrors = 0;
  let torn = false;

  function tick() {
    if (torn) return;
    raf = requestAnimationFrame(tick);
    if (!visible) return;

    const t = clock.getElapsedTime();
    const dt = Math.min(clock.getDelta(), 0.05);

    // Ease pointer for silky, warm motion.
    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;

    // Intro scale-in.
    if (intro < 1) {
      intro = Math.min(1, intro + dt * 0.9);
      const e = 1 - Math.pow(1 - intro, 3);
      aMark.scale.setScalar(0.86 + 0.14 * e);
      if (!ready && intro > 0.15) {
        ready = true;
        onReady && onReady();
      }
    }

    // Slow, dignified rotation + gentle scroll and mouse response.
    const scrollNorm = scrollY / (window.innerHeight || 800);
    aMark.rotation.y = t * 0.16 + pointer.x * 0.5;
    aMark.rotation.x = -0.05 + pointer.y * 0.22 + Math.sin(t * 0.5) * 0.04;
    aMark.position.y = 0.15 + Math.sin(t * 0.7) * 0.08 - scrollNorm * 1.2;
    aMark.rotation.z = Math.sin(t * 0.35) * 0.02;

    // Apex glow breathes softly.
    apexGlow.intensity = 5 + Math.sin(t * 1.3) * 1.6;

    // Drift the motes gently upward, wrapping around.
    for (let i = 0; i < speeds.length; i++) {
      let y = positionsAttr.getY(i) + speeds[i] * dt;
      let x = positionsAttr.getX(i) + Math.sin(t * 0.3 + i) * 0.0016;
      if (y > 4.6) y = -4.6;
      positionsAttr.setY(i, y);
      positionsAttr.setX(i, x);
    }
    positionsAttr.needsUpdate = true;
    motes.rotation.y = pointer.x * 0.1;

    // Parallax the camera subtly with the pointer.
    camera.position.x += (pointer.x * 0.4 - camera.position.x) * 0.04;
    camera.position.y += (0.2 - pointer.y * 0.3 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);

    try {
      renderer.render(scene, camera);
    } catch (err) {
      if (++renderErrors > 2) {
        onFallback && onFallback();
        controller.destroy();
      }
    }
  }

  // Controller for teardown (used on error recovery or reduced-motion toggle).
  const controller = {
    destroy() {
      torn = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      io.disconnect();
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m) => { if (m.map) m.map.dispose && m.map.dispose(); m.dispose && m.dispose(); });
        }
      });
      renderer.dispose();
      canvas.remove();
    },
  };

  tick();
  return controller;
}
