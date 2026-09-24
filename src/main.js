import * as THREE from 'three';
import './style.css';

const employees = [
  { id: 1, name: 'Maya Chen', role: 'Product design', initials: 'MC', color: '#ff9d5c', room: 'Studio 01', active: true, since: '08:42' },
  { id: 2, name: 'Jon Bell', role: 'Engineering', initials: 'JB', color: '#62d6c8', room: 'Studio 01', active: true, since: '08:57' },
  { id: 3, name: 'Ari Santos', role: 'Operations', initials: 'AS', color: '#c59bff', room: 'Studio 02', active: true, since: '09:11' },
  { id: 4, name: 'Leila Okafor', role: 'Marketing', initials: 'LO', color: '#f4d35e', room: 'Studio 02', active: false, since: '--:--' },
  { id: 5, name: 'Noah Williams', role: 'Engineering', initials: 'NW', color: '#78a8ff', room: 'Studio 03', active: false, since: '--:--' },
  { id: 6, name: 'Priya Kapoor', role: 'Finance', initials: 'PK', color: '#ff769d', room: 'Studio 03', active: true, since: '09:04' },
  { id: 7, name: 'Eli Turner', role: 'Customer success', initials: 'ET', color: '#70db7c', room: 'Studio 04', active: false, since: '--:--' },
];

const app = document.querySelector('#app');
app.innerHTML = `
  <div class="app-shell">
    <header class="topbar">
      <div class="brand"><span class="brand-mark">H</span><div><strong>HAVEN</strong><small>ATTENDANCE CONTROL</small></div></div>
      <div class="topbar-center"><span class="live-dot"></span><span>LIVE OFFICE MAP</span><span class="divider"></span><span id="clock">09:32:18</span></div>
      <div class="top-actions"><button class="icon-button" aria-label="Notifications">⌁<span class="notification-dot"></span></button><div class="admin-avatar">AD</div><span class="admin-name">Avery Dalton</span><span class="chevron">⌄</span></div>
    </header>
    <main class="main-layout">
      <aside class="sidebar">
        <div class="sidebar-heading"><div><span class="eyebrow">TODAY / MON 14 OCT</span><h1>People</h1></div><button class="filter-button">All <span>⌄</span></button></div>
        <div class="summary-row"><span><i class="status-dot online"></i><b id="active-count">4</b> active</span><span id="away-count">3 away</span></div>
        <div class="employee-list" id="employee-list"></div>
        <button class="add-button"><span>+</span> Add employee</button>
        <div class="sidebar-footer"><span class="sync-icon">↻</span><span>Last sync <b>just now</b></span><span class="sync-status"></span></div>
      </aside>
      <section class="workspace">
        <div class="workspace-head"><div><span class="eyebrow">FLOOR PLAN / HQ LEVEL 04</span><h2>Office presence</h2></div><div class="workspace-tools"><div class="legend"><span><i class="legend-dot present"></i>Present</span><span><i class="legend-dot room"></i>Room</span></div><button class="view-button"><span>◈</span> Isometric <span>⌄</span></button></div></div>
        <div class="scene-wrap"><div id="scene"></div><div class="scene-overlay"><span class="scene-tag"><i class="live-dot"></i> AUTO REFRESH 30S</span><span class="scene-help">Drag to orbit · scroll to zoom</span></div><div class="floor-label">LEVEL 04 <span>·</span> NORTH WING</div></div>
        <div class="bottom-stats"><div><span class="stat-label">ON SITE</span><strong id="onsite-stat">04</strong><small>of 07 employees</small></div><div><span class="stat-label">ROOMS IN USE</span><strong id="rooms-stat">03</strong><small id="room-subtitle">of 04 rooms</small></div><div><span class="stat-label">FIRST ARRIVAL</span><strong>08:42</strong><small>Maya Chen</small></div><div><span class="stat-label">SYNC HEALTH</span><strong class="health">100%</strong><small>All systems normal</small></div></div>
      </section>
    </main>
  </div>
`;

const list = document.querySelector('#employee-list');
function renderEmployees() {
  list.innerHTML = employees.map(employee => `
    <button class="employee-row ${employee.active ? 'is-active' : ''}" data-id="${employee.id}">
      <span class="person-avatar" style="--avatar-color:${employee.color}">${employee.initials}<i></i></span>
      <span class="person-info"><strong>${employee.name}</strong><small>${employee.role}</small></span>
      <span class="presence-info"><b>${employee.active ? 'IN' : 'OUT'}</b><small>${employee.active ? employee.since : 'Away'}</small></span>
      <span class="row-arrow">›</span>
    </button>
  `).join('');
  document.querySelectorAll('.employee-row').forEach(row => row.addEventListener('click', () => toggleEmployee(Number(row.dataset.id))));
  const active = employees.filter(employee => employee.active).length;
  document.querySelector('#active-count').textContent = active;
  document.querySelector('#away-count').textContent = `${employees.length - active} away`;
  document.querySelector('#onsite-stat').textContent = String(active).padStart(2, '0');
  document.querySelector('#rooms-stat').textContent = String(new Set(employees.filter(employee => employee.active).map(employee => employee.room)).size).padStart(2, '0');
  renderScene();
}

function toggleEmployee(id) {
  const employee = employees.find(item => item.id === id);
  employee.active = !employee.active;
  employee.since = employee.active ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--';
  renderEmployees();
}

let scene, camera, renderer, officeGroup, orbit = { x: 0.62, y: 0.9, down: false, px: 0, py: 0 };
function initScene() {
  const mount = document.querySelector('#scene');
  scene = new THREE.Scene();
  scene.background = new THREE.Color('#101820');
  camera = new THREE.PerspectiveCamera(34, mount.clientWidth / mount.clientHeight, 0.1, 100);
  camera.position.set(8.3, 8.4, 10.4);
  camera.lookAt(0, 0, 0);
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(mount.clientWidth, mount.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  mount.appendChild(renderer.domElement);
  scene.add(new THREE.HemisphereLight('#dcecff', '#18232b', 2.2));
  const sun = new THREE.DirectionalLight('#fff5dc', 4);
  sun.position.set(-4, 12, 6); sun.castShadow = true; scene.add(sun);
  officeGroup = new THREE.Group(); scene.add(officeGroup);
  mount.addEventListener('pointerdown', event => { orbit.down = true; orbit.px = event.clientX; orbit.py = event.clientY; });
  window.addEventListener('pointerup', () => { orbit.down = false; });
  window.addEventListener('pointermove', event => { if (!orbit.down) return; orbit.x += (event.clientX - orbit.px) * 0.008; orbit.y = THREE.MathUtils.clamp(orbit.y + (event.clientY - orbit.py) * 0.005, 0.45, 1.5); orbit.px = event.clientX; orbit.py = event.clientY; });
  mount.addEventListener('wheel', event => { camera.position.multiplyScalar(event.deltaY > 0 ? 1.06 : 0.94); camera.position.clampLength(8, 18); });
  window.addEventListener('resize', () => { camera.aspect = mount.clientWidth / mount.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(mount.clientWidth, mount.clientHeight); });
  renderScene(); animate();
}

function makeRoom(x, z, label, occupied) {
  const group = new THREE.Group(); group.position.set(x, 0, z);
  const floor = new THREE.Mesh(new THREE.BoxGeometry(4.9, 0.18, 3.4), new THREE.MeshStandardMaterial({ color: occupied ? '#263c45' : '#202d35', roughness: 0.84 }));
  floor.position.y = 0.09; floor.receiveShadow = true; group.add(floor);
  const wallMaterial = new THREE.MeshStandardMaterial({ color: '#53646b', roughness: 0.8 });
  const back = new THREE.Mesh(new THREE.BoxGeometry(4.9, 2.15, 0.16), wallMaterial); back.position.set(0, 1.1, -1.62); group.add(back);
  const side = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.15, 3.4), wallMaterial); side.position.set(-2.37, 1.1, 0); group.add(side);
  const deskMaterial = new THREE.MeshStandardMaterial({ color: '#b5764d', roughness: 0.65 });
  [-1.2, 1.2].forEach(xPos => { const desk = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.13, 0.65), deskMaterial); desk.position.set(xPos, 0.82, 0.15); desk.castShadow = true; group.add(desk); });
  const roomText = makeLabel(label, occupied ? '#b7f4d7' : '#89989d'); roomText.position.set(-2.12, 2.05, -1.5); roomText.scale.setScalar(0.55); group.add(roomText);
  return group;
}

function makeLabel(text, color) {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 80; const ctx = canvas.getContext('2d'); ctx.font = 'bold 30px Arial'; ctx.fillStyle = color; ctx.fillText(text.toUpperCase(), 10, 48); const texture = new THREE.CanvasTexture(canvas); const material = new THREE.SpriteMaterial({ map: texture, transparent: true }); const sprite = new THREE.Sprite(material); sprite.scale.set(2.5, 0.4, 1); return sprite;
}

function makePerson(employee, x, z) {
  const group = new THREE.Group(); group.position.set(x, 0.18, z); const material = new THREE.MeshStandardMaterial({ color: employee.color, roughness: 0.55 }); const skin = new THREE.MeshStandardMaterial({ color: '#e7b38e', roughness: 0.7 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.48, 4, 8), material); body.position.y = 0.78; body.castShadow = true; group.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), skin); head.position.y = 1.42; head.castShadow = true; group.add(head);
  const feet = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.22), new THREE.MeshStandardMaterial({ color: '#172129' })); feet.position.set(0, 0.22, 0.03); feet.castShadow = true; group.add(feet);
  const tag = makeLabel(employee.initials, '#ffffff'); tag.position.y = 1.86; tag.scale.setScalar(0.36); group.add(tag); return group;
}

function renderScene() {
  if (!officeGroup) return;
  officeGroup.clear();
  const rooms = [...new Set(employees.map(employee => employee.room))];
  rooms.forEach((roomName, index) => {
    const x = (index % 2) * 5.35 - 2.7; const z = Math.floor(index / 2) * 4.15 - 2.1; const roomEmployees = employees.filter(employee => employee.room === roomName); const room = makeRoom(x, z, roomName, roomEmployees.some(employee => employee.active)); officeGroup.add(room);
    roomEmployees.filter(employee => employee.active).forEach((employee, personIndex) => { const px = personIndex % 2 ? 1.05 : -1.05; const pz = personIndex > 1 ? 0.8 : -0.25; room.add(makePerson(employee, px, pz)); });
  });
  const totalWidth = rooms.length > 1 ? 10.8 : 5.4; const totalDepth = Math.ceil(rooms.length / 2) * 4.15; const base = new THREE.Mesh(new THREE.BoxGeometry(totalWidth, 0.08, totalDepth), new THREE.MeshStandardMaterial({ color: '#17252a', roughness: 1 })); base.position.set(0, -0.05, 0); base.receiveShadow = true; officeGroup.add(base);
  const grid = new THREE.GridHelper(Math.max(totalWidth, totalDepth), 12, '#3c5457', '#24383d'); grid.position.y = 0.01; officeGroup.add(grid);
}

function animate() { requestAnimationFrame(animate); officeGroup.rotation.y += (orbit.x - officeGroup.rotation.y) * 0.06; renderer.render(scene, camera); }

function updateClock() { document.querySelector('#clock').textContent = new Date().toLocaleTimeString([], { hour12: false }); }
initScene(); renderEmployees(); updateClock(); setInterval(updateClock, 1000);
