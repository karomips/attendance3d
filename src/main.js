import * as THREE from 'three';
import './style.css';

const employees = [
  { id: 1, name: 'Maya Chen', role: 'Product design', activity: 'Sketching flows', initials: 'MC', color: '#ff9d5c', room: 'Studio 01', active: true, since: '08:42' },
  { id: 2, name: 'Jon Bell', role: 'Engineering', activity: 'Building release', initials: 'JB', color: '#62d6c8', room: 'Studio 01', active: true, since: '08:57' },
  { id: 3, name: 'Ari Santos', role: 'Operations', activity: 'Team stand-up', initials: 'AS', color: '#c59bff', room: 'Studio 02', active: true, since: '09:11' },
  { id: 4, name: 'Leila Okafor', role: 'Marketing', activity: 'Writing campaign', initials: 'LO', color: '#f4d35e', room: 'Studio 02', active: false, since: '--:--' },
  { id: 5, name: 'Noah Williams', role: 'Engineering', activity: 'Code review', initials: 'NW', color: '#78a8ff', room: 'Studio 03', active: false, since: '--:--' },
  { id: 6, name: 'Priya Kapoor', role: 'Finance', activity: 'Reviewing reports', initials: 'PK', color: '#ff769d', room: 'Studio 03', active: true, since: '09:04' },
  { id: 7, name: 'Eli Turner', role: 'Customer success', activity: 'Client call', initials: 'ET', color: '#70db7c', room: 'Studio 04', active: false, since: '--:--' },
];

const app = document.querySelector('#app');
app.innerHTML = `
  <div class="app-shell">
    <header class="topbar">
      <div class="brand"><span class="brand-mark">H</span><div><strong>FormOne VA</strong><small>OFFICE FLOOR PLAN</small></div></div>
      <div class="topbar-center"><span class="live-dot"></span><span>Live Office Map</span><span class="divider"></span><span id="clock">09:32:18</span></div>
      <div class="top-actions"><button class="icon-button" aria-label="Notifications">⌁<span class="notification-dot"></span></button><div class="admin-avatar">AD</div><span class="admin-name">Avery Dalton</span><span class="chevron">⌄</span></div>
    </header>
    <main class="main-layout">
      <section class="workspace">
        <div class="workspace-head"><div><span class="eyebrow">FLOOR PLAN / HQ LEVEL 04</span><h2>Executive office layout</h2></div><div class="workspace-tools"><div class="legend"><span><i class="legend-dot present"></i>Present</span><span><i class="legend-dot room"></i>Room</span></div><button class="view-button"><span>◈</span> Isometric <span>⌄</span></button></div></div>
        <div class="scene-wrap"><div id="scene"></div><div class="scene-overlay"><span class="scene-tag"><i class="live-dot"></i> AUTO REFRESH 30S</span><span class="scene-help">Drag to orbit · scroll to zoom</span></div><div class="floor-label">LEVEL 04 <span>·</span> NORTH WING</div></div>
      </section>
    </main>
  </div>
`;

const list = document.querySelector('#employee-list');
let pendingArrivalId = null;
let pendingDepartureId = null;
function renderEmployees() {
  if (list) {
    list.innerHTML = employees.map(employee => `
      <button class="employee-row ${employee.active ? 'is-active' : ''}" data-id="${employee.id}">
        <span class="person-avatar" style="--avatar-color:${employee.color}">${employee.initials}<i></i></span>
        <span class="person-info"><strong>${employee.name}</strong><small>${employee.role}</small></span>
        <span class="presence-info"><b>${employee.active ? 'IN' : 'OUT'}</b><small>${employee.active ? employee.since : 'Away'}</small></span>
        <span class="row-arrow">›</span>
      </button>
    `).join('');
    document.querySelectorAll('.employee-row').forEach(row => row.addEventListener('click', () => toggleEmployee(Number(row.dataset.id))));
  }

  const active = employees.filter(employee => employee.active).length;
  const activeCount = document.querySelector('#active-count');
  const awayCount = document.querySelector('#away-count');
  const onsiteStat = document.querySelector('#onsite-stat');
  const roomsStat = document.querySelector('#rooms-stat');
  if (activeCount) activeCount.textContent = active;
  if (awayCount) awayCount.textContent = `${employees.length - active} away`;
  if (onsiteStat) onsiteStat.textContent = String(active).padStart(2, '0');
  if (roomsStat) roomsStat.textContent = String(active).padStart(2, '0');
  renderScene(pendingArrivalId, pendingDepartureId);
  pendingArrivalId = null;
  pendingDepartureId = null;
}

function toggleEmployee(id) {
  const employee = employees.find(item => item.id === id);
  employee.active = !employee.active;
  employee.since = employee.active ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--';
  pendingArrivalId = employee.active ? employee.id : null;
  pendingDepartureId = employee.active ? null : employee.id;
  renderEmployees();
}

let scene, camera, renderer, officeGroup, animatedPeople = [], arrivals = [], orbit = { x: 0, y: 0.9, down: false, px: 0, py: 0 };
function initScene() {
  const mount = document.querySelector('#scene');
  scene = new THREE.Scene();
  scene.background = new THREE.Color('#dfece8');
  camera = new THREE.OrthographicCamera(-21, 21, 11, -11, 0.1, 140);
  camera.position.set(0, 17, 30);
  camera.lookAt(0, 0, 0);
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(mount.clientWidth, mount.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  mount.appendChild(renderer.domElement);
  scene.add(new THREE.HemisphereLight('#ffffff', '#b8cec7', 2.25));
  const sun = new THREE.DirectionalLight('#fff8e8', 3.6);
  sun.position.set(-4, 12, 6); sun.castShadow = true; scene.add(sun);
  officeGroup = new THREE.Group(); scene.add(officeGroup);
  mount.addEventListener('pointerdown', event => { orbit.down = true; orbit.px = event.clientX; orbit.py = event.clientY; });
  window.addEventListener('pointerup', () => { orbit.down = false; });
  window.addEventListener('pointermove', event => { if (!orbit.down) return; orbit.x += (event.clientX - orbit.px) * 0.008; orbit.y = THREE.MathUtils.clamp(orbit.y + (event.clientY - orbit.py) * 0.005, 0.45, 1.5); orbit.px = event.clientX; orbit.py = event.clientY; });
  mount.addEventListener('wheel', event => { const zoom = event.deltaY > 0 ? 1.06 : 0.94; camera.zoom = THREE.MathUtils.clamp(camera.zoom * zoom, .7, 1.5); camera.updateProjectionMatrix(); });
  window.addEventListener('resize', () => { const aspect = mount.clientWidth / mount.clientHeight; camera.left = -11 * aspect; camera.right = 11 * aspect; camera.updateProjectionMatrix(); renderer.setSize(mount.clientWidth, mount.clientHeight); });
  renderScene(); animate();
}

function makeRoom(x, z, employee, roomType = 'workspace') {
  const occupied = !!employee?.active;
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const styles = {
    ceo: { floor: '#efe4d0', wall: '#f7f2eb', accent: '#d39e66', desk: '#8d5a3d', trim: '#5a4338', label: '#5d433a' },
    coo: { floor: '#ddeaf1', wall: '#f3f7f8', accent: '#88b7d6', desk: '#8a5e49', trim: '#425d70', label: '#3f6179' },
    manager: { floor: '#e7efd9', wall: '#f7f4ee', accent: '#a9c38d', desk: '#8a6647', trim: '#425947', label: '#3d5d46' },
    meeting: { floor: '#efe0c9', wall: '#f7efe8', accent: '#d07a59', desk: '#bf7e5d', trim: '#6a564c', label: '#5b453f' },
    bathroom: { floor: '#d6edf3', wall: '#f2f9fb', accent: '#9ec9d9', desk: '#dbeef2', trim: '#4e6d77', label: '#4e6d77' },
    lobby: { floor: '#e5edea', wall: '#f4f5f1', accent: '#c9b98d', desk: '#d9c9b4', trim: '#6e7c7a', label: '#526a63' },
    workspace: { floor: occupied ? '#edf3ee' : '#f0f4f2', wall: '#f6f3f0', accent: '#d9b46f', desk: '#b9805b', trim: '#4e6368', label: '#40615d' }
  };

  const palette = styles[roomType] || styles.workspace;
  const width = roomType === 'meeting' ? 6.2 : roomType === 'bathroom' ? 4.4 : roomType === 'lobby' ? 8.4 : 5.9;
  const depth = roomType === 'meeting' ? 4.7 : roomType === 'bathroom' ? 3.1 : roomType === 'lobby' ? 5.2 : 3.8;

  const floor = new THREE.Mesh(new THREE.BoxGeometry(width, 0.18, depth), new THREE.MeshStandardMaterial({ color: palette.floor, roughness: 0.84 }));
  floor.position.y = 0.09; floor.receiveShadow = true; group.add(floor);

  const wallMaterial = new THREE.MeshStandardMaterial({ color: palette.wall, roughness: 0.75 });
  const back = new THREE.Mesh(new THREE.BoxGeometry(width - 0.45, 0.72, 0.1), wallMaterial); back.position.set(0, 0.48, -(depth / 2) + 0.15); group.add(back);
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.95, depth - 0.35), wallMaterial); leftWall.position.set(-(width / 2) + 0.15, 0.55, 0); group.add(leftWall);
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.95, depth - 0.35), wallMaterial); rightWall.position.set((width / 2) - 0.15, 0.55, 0); group.add(rightWall);

  if (roomType === 'bathroom') {
    const sink = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.26, 0.42), new THREE.MeshStandardMaterial({ color: '#dfeef4', roughness: 0.38 })); sink.position.set(1.15, 0.52, 0.7); group.add(sink);
    const toilet = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.36, 0.58), new THREE.MeshStandardMaterial({ color: '#f7fbfd', roughness: 0.42 })); base.position.y = 0.24; toilet.add(base);
    const tank = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.44, 0.2), new THREE.MeshStandardMaterial({ color: '#e3edf2', roughness: 0.42 })); tank.position.set(0, 0.62, -0.12); toilet.add(tank);
    toilet.position.set(-1.2, 0, 0.16); group.add(toilet);
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.66, 0.04), new THREE.MeshStandardMaterial({ color: '#d9edf4', emissive: '#c7eaf2', emissiveIntensity: 0.16 })); mirror.position.set(-0.1, 1.15, -(depth / 2) + 0.18); group.add(mirror);
  } else if (roomType === 'meeting') {
    const table = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.12, 1.35), new THREE.MeshStandardMaterial({ color: '#c5825f', roughness: 0.55 })); table.position.set(0, 0.84, 0.2); group.add(table);
    for (let i = 0; i < 6; i += 1) {
      const chair = new THREE.Group();
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.38), new THREE.MeshStandardMaterial({ color: '#7d645d', roughness: 0.8 })); seat.position.y = 0.28; chair.add(seat);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.08), new THREE.MeshStandardMaterial({ color: '#886f63', roughness: 0.74 })); back.position.set(0, 0.5, -0.12); chair.add(back);
      chair.position.set(-1.05 + (i % 3) * 1.1, 0, -0.6 + Math.floor(i / 3) * 1.1);
      group.add(chair);
    }
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.72, 0.06), new THREE.MeshStandardMaterial({ color: '#edf4f5', roughness: 0.55 })); board.position.set(0, 1.28, -(depth / 2) + 0.18); group.add(board);
  } else if (roomType === 'lobby') {
    const counter = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.85, 0.75), new THREE.MeshStandardMaterial({ color: '#d8d5cc', roughness: 0.62 })); counter.position.set(0, 0.42, 0.7); group.add(counter);
    const desk = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.65), new THREE.MeshStandardMaterial({ color: '#d4baa0', roughness: 0.56 })); desk.position.set(0, 0.82, 0.15); group.add(desk);
    const chair = new THREE.Group();
    const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.12, 0.42), new THREE.MeshStandardMaterial({ color: '#4a4e66', roughness: 0.82 })); chairSeat.position.y = 0.32; chair.add(chairSeat);
    const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.52, 0.08), new THREE.MeshStandardMaterial({ color: '#485d68', roughness: 0.76 })); chairBack.position.set(0, 0.58, -0.12); chair.add(chairBack);
    chair.position.set(0, 0, 1.14); group.add(chair);
    const sofa = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 0.8), new THREE.MeshStandardMaterial({ color: '#d9c7b0', roughness: 0.8 })); sofa.position.set(-2.2, 0.28, 1.2); group.add(sofa);
    const plant = new THREE.Group();
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.28, 12), new THREE.MeshStandardMaterial({ color: '#c7785a', roughness: 0.7 })); pot.position.set(2.2, 0.22, -1.0); plant.add(pot);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.55, 6), new THREE.MeshStandardMaterial({ color: '#4d8d5b', roughness: 0.8 })); stem.position.set(2.2, 0.64, -1.0); plant.add(stem);
    group.add(plant);
  } else {
    const desk = new THREE.Mesh(new THREE.BoxGeometry(roomType === 'ceo' || roomType === 'coo' ? 1.9 : 1.45, 0.12, 0.75), new THREE.MeshStandardMaterial({ color: palette.desk, roughness: 0.58 })); desk.position.set(0, 0.82, 0.15); group.add(desk);
    const chair = new THREE.Group(); chair.position.set(0, 0, 0.8);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.42), new THREE.MeshStandardMaterial({ color: '#3d4f5f', roughness: 0.82 })); seat.position.y = 0.32; chair.add(seat);
    const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.56, 0.08), new THREE.MeshStandardMaterial({ color: '#2d4250', roughness: 0.75 })); chairBack.position.set(0, 0.58, -0.12); chair.add(chairBack);
    group.add(chair);
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.52, 12), new THREE.MeshStandardMaterial({ color: '#d2bd94', roughness: 0.5 })); lamp.position.set(1.18, 1.1, 0.2); group.add(lamp);
    const plant = new THREE.Group();
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.14, 0.24, 12), new THREE.MeshStandardMaterial({ color: '#c7785a', roughness: 0.7 })); pot.position.set(-1.75, 0.2, -0.7); plant.add(pot);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.52, 6), new THREE.MeshStandardMaterial({ color: '#4b8d5e', roughness: 0.8 })); stem.position.set(-1.75, 0.6, -0.7); plant.add(stem);
    group.add(plant);
  }

  const windowFrame = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 0.04), new THREE.MeshStandardMaterial({ color: palette.trim, roughness: 0.45 })); windowFrame.position.set(1.45, 1.24, -(depth / 2) + 0.18); group.add(windowFrame);
  const windowLight = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.54, 0.045), new THREE.MeshStandardMaterial({ color: '#8cbad7', emissive: '#214858', emissiveIntensity: 0.6, roughness: 0.25 })); windowLight.position.set(1.45, 1.24, -(depth / 2) + 0.2); group.add(windowLight);

  const art = new THREE.Mesh(new THREE.BoxGeometry(roomType === 'bathroom' ? 0.95 : 0.7, roomType === 'bathroom' ? 0.5 : 0.72, 0.04), new THREE.MeshStandardMaterial({ color: palette.accent, roughness: 0.65 })); art.position.set(-1.2, 1.12, -(depth / 2) + 0.2); group.add(art);

  const labelText = roomType === 'ceo' ? 'CEO OFFICE' : roomType === 'coo' ? 'COO OFFICE' : roomType === 'manager' ? 'MANAGER OFFICE' : roomType === 'meeting' ? 'MEETING ROOM' : roomType === 'bathroom' ? 'BATHROOM' : roomType === 'lobby' ? 'LOBBY' : 'WORKSPACE';
  const label = makeLabel(employee?.name && roomType === 'workspace' ? employee.name : labelText, palette.label); label.position.set(-1.55, 1.7, -(depth / 2) + 0.15); label.scale.setScalar(roomType === 'bathroom' ? 0.38 : 0.42); group.add(label);
  return group;
}


function makeDesk(x, z, woodColor, style = 0) {
  const desk = new THREE.Group(); desk.position.set(x, 0, z);
  const wood = new THREE.MeshStandardMaterial({ color: woodColor, roughness: .58 }); const metal = new THREE.MeshStandardMaterial({ color: '#28383d', roughness: .38 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(style === 1 ? 1.9 : 1.65, .12, .7), wood); top.position.y = .82; top.castShadow = true; desk.add(top);
  [-.62, .62].forEach(legX => { const leg = new THREE.Mesh(new THREE.BoxGeometry(.08, .72, .08), metal); leg.position.set(legX, .42, 0); leg.castShadow = true; desk.add(leg); });
  const monitor = new THREE.Mesh(new THREE.BoxGeometry(style === 2 ? .82 : .62, style === 2 ? .28 : .38, .06), new THREE.MeshStandardMaterial({ color: '#26353a', emissive: '#1d5653', emissiveIntensity: .55, roughness: .25 })); monitor.position.set(style === 1 ? -.22 : 0, 1.1, -.08); monitor.castShadow = true; desk.add(monitor);
  if (style === 1) { const secondMonitor = monitor.clone(); secondMonitor.position.x = .42; secondMonitor.scale.set(.65, .85, 1); desk.add(secondMonitor); }
  const monitorStand = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .2, 8), metal); monitorStand.position.set(0, .9, -.08); desk.add(monitorStand);
  const keyboard = new THREE.Mesh(new THREE.BoxGeometry(.48, .025, .18), new THREE.MeshStandardMaterial({ color: '#c3b8a0', roughness: .5 })); keyboard.position.set(0, .9, .2); desk.add(keyboard);
  const lamp = new THREE.Group(); const lampStem = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .32, 8), metal); lampStem.position.set(.58, 1.0, .02); lampStem.rotation.z = -.2; lamp.add(lampStem); const lampShade = new THREE.Mesh(new THREE.ConeGeometry(.13, .16, 12, 1, true), new THREE.MeshStandardMaterial({ color: '#e6c879', emissive: '#6d5424', emissiveIntensity: .7, side: THREE.DoubleSide })); lampShade.position.set(.62, 1.16, .02); lamp.add(lampShade); desk.add(lamp);
  desk.add(makeChair(0, .82, style)); return desk;
}

function makeChair(x, z, style = 0) {
  const chair = new THREE.Group(); chair.position.set(x, 0, z); const fabric = new THREE.MeshStandardMaterial({ color: ['#354d55', '#496f69', '#71566b'][style], roughness: .82 }); const metal = new THREE.MeshStandardMaterial({ color: '#1b282e', roughness: .38 });
  const back = new THREE.Mesh(new THREE.BoxGeometry(.48, .62, .1), fabric); back.position.set(0, .62, .12); back.castShadow = true; chair.add(back);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(.52, .12, .48), fabric); seat.position.y = .32; seat.castShadow = true; chair.add(seat);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(.035, .05, .28, 8), metal); post.position.y = .16; chair.add(post);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(.26, .26, .035, 8), metal); base.position.y = .02; chair.add(base); return chair;
}

function makePlant(x, z) {
  const plant = new THREE.Group(); plant.position.set(x, 0, z); const pot = new THREE.Mesh(new THREE.CylinderGeometry(.19, .15, .25, 12), new THREE.MeshStandardMaterial({ color: '#c27757', roughness: .7 })); pot.position.y = .22; pot.castShadow = true; plant.add(pot);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .55, 6), new THREE.MeshStandardMaterial({ color: '#47775c', roughness: .8 })); stem.position.y = .55; plant.add(stem);
  const leafMaterial = new THREE.MeshStandardMaterial({ color: '#63a978', roughness: .72 }); [-.13, .13, 0].forEach((leafX, index) => { const leaf = new THREE.Mesh(new THREE.SphereGeometry(.13, 8, 6), leafMaterial); leaf.scale.set(.65, 1.35, .35); leaf.position.set(leafX, .72 + index * .04, index === 1 ? .06 : -.03); leaf.rotation.z = leafX * 2; plant.add(leaf); }); return plant;
}

function makeEntranceAndParking(entranceX, totalWidth) {
  const group = new THREE.Group(); const glass = new THREE.MeshStandardMaterial({ color: '#78b9bd', transparent: true, opacity: .48, roughness: .2 }); const frame = new THREE.MeshStandardMaterial({ color: '#355b59', roughness: .35 });
  const door = new THREE.Mesh(new THREE.BoxGeometry(.9, 2.25, .08), glass); door.position.set(entranceX, 1.12, -1.58); group.add(door);
  [-.5, .5].forEach(offset => { const post = new THREE.Mesh(new THREE.BoxGeometry(.08, 2.45, .1), frame); post.position.set(entranceX + offset, 1.22, -1.58); group.add(post); });
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.9, .12, .7), frame); canopy.position.set(entranceX, 2.35, -1.42); group.add(canopy);
  const parking = new THREE.Mesh(new THREE.BoxGeometry(totalWidth + 2.2, .035, 2.7), new THREE.MeshStandardMaterial({ color: '#aebfbd', roughness: .9 })); parking.position.set(0, .02, 4.15); group.add(parking);
  for (let index = 0; index <= Math.ceil(totalWidth / 2.6); index += 1) { const line = new THREE.Mesh(new THREE.BoxGeometry(.05, .012, 2.2), new THREE.MeshBasicMaterial({ color: '#f4e7ad' })); line.position.set(-totalWidth / 2 - .4 + index * 2.6, .05, 4.15); group.add(line); }
  const sign = makeLabel('MAIN ENTRANCE', '#355b59'); sign.position.set(entranceX, 2.7, -1.5); sign.scale.setScalar(.48); group.add(sign); return group;
}

function makeCar(color) {
  const car = new THREE.Group(); const bodyMaterial = new THREE.MeshStandardMaterial({ color, roughness: .42 }); const dark = new THREE.MeshStandardMaterial({ color: '#25373b', roughness: .28 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(.95, .28, 1.55), bodyMaterial); body.position.y = .3; body.castShadow = true; car.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(.72, .28, .72), new THREE.MeshStandardMaterial({ color: '#78a8aa', transparent: true, opacity: .82, roughness: .2 })); cabin.position.set(0, .56, -.05); cabin.castShadow = true; car.add(cabin);
  [-.38, .38].forEach(x => { [-.5, .5].forEach(z => { const wheel = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, .08, 12), dark); wheel.rotation.z = Math.PI / 2; wheel.position.set(x, .16, z); car.add(wheel); }); }); return car;
}

function makeNeighborBuildings(width, depth) {
  const skyline = new THREE.Group();
  const buildingColors = ['#c4d8d5', '#b8cdcb', '#d3e1df', '#afc7c5'];
  const positions = [-width / 2 + 1.3, -width / 2 + 4.7, 0, width / 2 - 4.7, width / 2 - 1.3];
  positions.forEach((x, index) => {
    const height = 2.7 + (index % 3) * .7; const building = new THREE.Group(); building.position.set(x, height / 2 - .08, -depth / 2 - 3.2);
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.45, height, 1.7), new THREE.MeshStandardMaterial({ color: buildingColors[index % buildingColors.length], roughness: .9 })); body.castShadow = true; building.add(body);
    for (let row = 0; row < 3; row += 1) for (let column = 0; column < 3; column += 1) { const window = new THREE.Mesh(new THREE.BoxGeometry(.28, .25, .025), new THREE.MeshStandardMaterial({ color: '#f7df9a', emissive: '#a78943', emissiveIntensity: .25, roughness: .35 })); window.position.set((column - 1) * .58, -height / 2 + .65 + row * .62, .87); building.add(window); }
    skyline.add(building);
  });
  return skyline;
}

function makeLabel(text, color) {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 80; const ctx = canvas.getContext('2d'); ctx.font = 'bold 30px Arial'; ctx.fillStyle = color; ctx.fillText(text.toUpperCase(), 10, 48); const texture = new THREE.CanvasTexture(canvas); const material = new THREE.SpriteMaterial({ map: texture, transparent: true }); const sprite = new THREE.Sprite(material); sprite.scale.set(2.5, 0.4, 1); return sprite;
}

function makePersonLabel(employee) {
  const canvas = document.createElement('canvas'); canvas.width = 720; canvas.height = 170;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(11, 24, 29, .92)'; ctx.roundRect(8, 8, 704, 154, 18); ctx.fill();
  ctx.strokeStyle = employee.color; ctx.globalAlpha = .75; ctx.lineWidth = 3; ctx.roundRect(8, 8, 704, 154, 18); ctx.stroke(); ctx.globalAlpha = 1;
  ctx.fillStyle = '#f1f7f4'; ctx.font = '700 32px Manrope, Arial'; ctx.fillText(employee.name, 30, 51);
  ctx.fillStyle = employee.color; ctx.font = '600 23px Manrope, Arial'; ctx.fillText(employee.activity, 30, 87);
  ctx.fillStyle = '#a8b9b6'; ctx.font = '500 19px DM Mono, monospace'; ctx.fillText(`IN ${employee.since}  /  ${employee.role}`, 30, 126);
  const texture = new THREE.CanvasTexture(canvas); texture.minFilter = THREE.LinearFilter;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false })); sprite.scale.set(3.15, .74, 1); sprite.renderOrder = 5; return sprite;
}

function makePerson(employee, x, z) {
  const group = new THREE.Group(); group.position.set(x, 0.18, z); group.userData.phase = Math.random() * Math.PI * 2;
  const material = new THREE.MeshStandardMaterial({ color: employee.color, roughness: 0.48 }); const skin = new THREE.MeshStandardMaterial({ color: '#e7b38e', roughness: 0.7 }); const dark = new THREE.MeshStandardMaterial({ color: '#172129', roughness: .7 });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.23, 0.48, 5, 8), material); torso.position.y = 0.82; torso.castShadow = true; group.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12), skin); head.position.y = 1.48; head.castShadow = true; group.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.245, 12, 8, 0, Math.PI * 2, 0, Math.PI * .55), dark); hair.position.set(0, 1.56, -0.02); hair.castShadow = true; group.add(hair);
  const armGeometry = new THREE.CapsuleGeometry(.065, .3, 4, 6); [-1, 1].forEach(side => { const arm = new THREE.Mesh(armGeometry, skin); arm.position.set(side * .27, .88, .01); arm.rotation.z = side * -.25; arm.castShadow = true; arm.name = 'arm'; group.add(arm); });
  const legGeometry = new THREE.CapsuleGeometry(.075, .3, 4, 6); [-1, 1].forEach(side => { const leg = new THREE.Mesh(legGeometry, dark); leg.position.set(side * .1, .34, .02); leg.castShadow = true; group.add(leg); });
  const feet = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.25), dark); feet.position.set(0, 0.17, 0.05); feet.castShadow = true; group.add(feet);
  const badge = makePersonLabel(employee); badge.position.y = 2.38; group.add(badge);
  const glow = new THREE.Mesh(new THREE.RingGeometry(.32, .38, 24), new THREE.MeshBasicMaterial({ color: employee.color, transparent: true, opacity: .38, side: THREE.DoubleSide })); glow.rotation.x = -Math.PI / 2; glow.position.y = .12; group.add(glow);
  animatedPeople.push(group); return group;
}

function renderScene(arrivingId = null, departingId = null) {
  if (!officeGroup) return;
  officeGroup.clear();
  animatedPeople = [];
  arrivals = [];

  const roomDefs = [
    { type: 'ceo', x: -18, z: 0, employee: employees[0] },
    { type: 'coo', x: -10.5, z: 0, employee: employees[1] },
    { type: 'manager', x: -3.6, z: 0, employee: employees[2] },
    { type: 'manager', x: 3.8, z: 0, employee: employees[3] },
    { type: 'meeting', x: 11.1, z: 0, employee: employees[4] },
    { type: 'bathroom', x: 18.8, z: 0, employee: employees[5] },
    { type: 'lobby', x: 0, z: 4.8, employee: employees[6] }
  ];

  roomDefs.forEach((room) => {
    const roomGroup = makeRoom(room.x, room.z, room.employee, room.type);
    officeGroup.add(roomGroup);

    if (room.employee && room.employee.active && room.type !== 'bathroom' && room.type !== 'lobby') {
      const person = makePerson(room.employee, room.x, room.z + 0.15);
      person.position.y = 0.22;
      officeGroup.add(person);
      animatedPeople.push(person);
    }

    if (room.employee && room.employee.id === arrivingId) {
      const person = makePerson(room.employee, 0, 2.1); person.userData.arriving = true; person.visible = false; officeGroup.add(person);
      const car = makeCar(room.employee.color); car.position.set(room.x, 0, 5.8); officeGroup.add(car);
      arrivals.push({ car, person, startX: 0, targetX: room.x, elapsed: 0, phase: 'arrival-drive' });
    }

    if (room.employee && room.employee.id === departingId) {
      const person = makePerson(room.employee, room.x, room.z + 0.15); person.userData.arriving = true; officeGroup.add(person);
      const car = makeCar(room.employee.color); car.position.set(room.x, 0, 4.2); officeGroup.add(car);
      arrivals.push({ car, person, startX: room.x, targetX: 0, elapsed: 0, phase: 'departure-walk', parkingX: room.x });
    }
  });

  officeGroup.add(makeEntranceAndParking(0, 42));
  const base = new THREE.Mesh(new THREE.BoxGeometry(44, 0.08, 12.5), new THREE.MeshStandardMaterial({ color: '#b7cbc7', roughness: 1 })); base.position.set(0, -0.05, 1.4); base.receiveShadow = true; officeGroup.add(base);
  const corridor = new THREE.Mesh(new THREE.BoxGeometry(38, .035, 1.2), new THREE.MeshStandardMaterial({ color: '#e3cda9', roughness: .88 })); corridor.position.set(0, .015, 2.2); corridor.receiveShadow = true; officeGroup.add(corridor);
  const hallRunner = new THREE.Mesh(new THREE.BoxGeometry(34, .012, .24), new THREE.MeshStandardMaterial({ color: '#86b8aa', roughness: .92 })); hallRunner.position.set(0, .04, 2.2); officeGroup.add(hallRunner);
}

function animate(time = 0) { requestAnimationFrame(animate); officeGroup.rotation.y += (orbit.x - officeGroup.rotation.y) * 0.06; animatedPeople.forEach(person => { const wave = Math.sin(time * .0022 + person.userData.phase); if (!person.userData.arriving) { person.position.y = .18 + wave * .025; person.rotation.z = wave * .012; } person.children.filter(child => child.name === 'arm').forEach((arm, index) => { arm.rotation.x = wave * (index ? -.16 : .16); }); const glow = person.children.find(child => child.geometry?.type === 'RingGeometry'); if (glow) glow.material.opacity = .26 + (wave + 1) * .08; }); arrivals.forEach(arrival => { arrival.elapsed += .016; if (arrival.phase === 'arrival-drive') { const progress = Math.min(arrival.elapsed / 1.15, 1); arrival.car.position.z = THREE.MathUtils.lerp(6, 2.8, progress); if (progress === 1) { arrival.phase = 'arrival-door'; arrival.elapsed = 0; } } else if (arrival.phase === 'arrival-door') { const progress = Math.min(arrival.elapsed / .8, 1); arrival.car.position.x = THREE.MathUtils.lerp(arrival.targetX, 0, progress); arrival.car.position.z = THREE.MathUtils.lerp(2.8, 2.1, progress); if (progress === 1) { arrival.phase = 'walk'; arrival.elapsed = 0; arrival.car.visible = false; arrival.person.visible = true; } } else if (arrival.phase === 'walk') { const progress = Math.min(arrival.elapsed / 2.6, 1); arrival.person.position.x = THREE.MathUtils.lerp(0, arrival.targetX, progress); arrival.person.position.z = THREE.MathUtils.lerp(1.6, -.25, progress); if (progress === 1) { arrival.phase = 'done'; arrival.person.userData.arriving = false; } } else if (arrival.phase === 'departure-walk') { const progress = Math.min(arrival.elapsed / 2.5, 1); arrival.person.position.x = THREE.MathUtils.lerp(arrival.parkingX, 0, progress); arrival.person.position.z = THREE.MathUtils.lerp(-.25, 1.6, progress); if (progress === 1) { arrival.phase = 'departure-car'; arrival.elapsed = 0; } } else if (arrival.phase === 'departure-car') { const progress = Math.min(arrival.elapsed / 1.4, 1); arrival.person.position.x = THREE.MathUtils.lerp(0, arrival.parkingX, progress); arrival.person.position.z = THREE.MathUtils.lerp(1.6, 4.15, progress); if (progress === 1) { arrival.phase = 'departure-drive'; arrival.elapsed = 0; arrival.person.visible = false; } } else if (arrival.phase === 'departure-drive') { const progress = Math.min(arrival.elapsed / 1.2, 1); arrival.car.position.z = THREE.MathUtils.lerp(4.15, 6.5, progress); if (progress === 1) arrival.phase = 'done'; } }); renderer.render(scene, camera); }

function updateClock() { document.querySelector('#clock').textContent = new Date().toLocaleTimeString([], { hour12: false }); }
initScene(); renderEmployees(); updateClock(); setInterval(updateClock, 1000);
