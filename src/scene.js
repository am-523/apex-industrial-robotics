import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

export class RoboticsScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.mech = null;
    this.drone = null;
    this.droneLight = null;
    this.sparks = null;
    this.clock = new THREE.Clock();

    // Studio-grade camera choreography (Subtle, cinematic, intentional)
    this.waypoints = [
      { camPos: new THREE.Vector3(2.0, 4.0, 11.2), target: new THREE.Vector3(-0.2, 3.8, 0), fov: 36 }, // Hero (offset to let robot shine on right/center)
      { camPos: new THREE.Vector3(4.5, 5.2, 6.8), target: new THREE.Vector3(0.8, 4.8, 0), fov: 32 },  // Kinematics (Focus on shoulder/torso joints)
      { camPos: new THREE.Vector3(-3.8, 6.0, 5.5), target: new THREE.Vector3(0, 5.8, 0), fov: 30 },  // Perception (Sensor dome & drone link)
      { camPos: new THREE.Vector3(3.2, 2.6, 6.0), target: new THREE.Vector3(0.5, 2.2, 0), fov: 32 },  // Tooling (Manipulator hands)
      { camPos: new THREE.Vector3(-3.2, 2.0, 7.5), target: new THREE.Vector3(-0.2, 2.8, 0), fov: 34 }, // Durability & Suspension
      { camPos: new THREE.Vector3(0, 4.8, 12.5), target: new THREE.Vector3(0, 4.0, 0), fov: 38 },   // Technical Matrix
      { camPos: new THREE.Vector3(1.5, 4.4, 11.0), target: new THREE.Vector3(0, 3.8, 0), fov: 36 }   // Configurator & Contact
    ];

    this.currentCamPos = this.waypoints[0].camPos.clone();
    this.currentTarget = this.waypoints[0].target.clone();
    this.scrollProgress = 0;
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    this.init();
  }

  init() {
    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0a0c10, 0.018);

    // 2. Camera setup
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(36, aspect, 0.1, 100);
    this.camera.position.copy(this.currentCamPos);
    this.camera.lookAt(this.currentTarget);

    // 3. Studio-grade Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.AgXToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. Photorealistic Industrial Lighting (No sci-fi cyan glows)
    this.setupLights();

    // 5. Studio Floor & Hangar Environment
    this.setupEnvironment();

    // 6. Natural Laser Welding Sparks (Physical, warm incandescent)
    this.setupSparks();

    // 7. Load 3D Models
    this.loadModels();

    // 8. Event listeners
    this.setupEvents();

    // 9. Start render loop
    this.animate();
  }

  setupLights() {
    // Studio skylight / ambient occlusion fill
    const hemi = new THREE.HemisphereLight(0xdde5f0, 0x111317, 1.4);
    this.scene.add(hemi);

    // Primary Overhead Key Spotlight (High CRI 5600K clean white)
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.set(5, 14, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0003;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 30;
    keyLight.shadow.camera.left = -8;
    keyLight.shadow.camera.right = 8;
    keyLight.shadow.camera.top = 10;
    keyLight.shadow.camera.bottom = -2;
    this.scene.add(keyLight);

    // Subtle Titanium Rim Light from back-left (Clean steel highlight)
    const rimLight = new THREE.DirectionalLight(0xb0c4de, 2.0);
    rimLight.position.set(-6, 9, -5);
    this.scene.add(rimLight);

    // Warm Foundry Under-Glow (Warm tungsten bounce from floor)
    const floorBounce = new THREE.PointLight(0xffa500, 18, 14, 1.5);
    floorBounce.position.set(0, 0.4, 1.5);
    this.scene.add(floorBounce);

    // Soft Front Fill
    const fillLight = new THREE.DirectionalLight(0x788fa6, 0.8);
    fillLight.position.set(-2, 3, 9);
    this.scene.add(fillLight);
  }

  setupEnvironment() {
    // Industrial Precision Epoxy Floor
    const floorSize = 40;
    const floorGeo = new THREE.PlaneGeometry(floorSize, floorSize);

    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 2048;
    floorCanvas.height = 2048;
    const ctx = floorCanvas.getContext('2d');

    // Deep matte charcoal epoxy
    ctx.fillStyle = '#0c0e12';
    ctx.fillRect(0, 0, 2048, 2048);

    // Ultra-clean architectural grid lines (Very faint, not arcade)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1.5;
    const step = 64;
    for (let x = 0; x <= 2048; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 2048);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, x);
      ctx.lineTo(2048, x);
      ctx.stroke();
    }

    // Clean industrial safety demarcation (Subtle matte yellow lines)
    const cx = 1024, cy = 1024;
    ctx.save();
    ctx.strokeStyle = 'rgba(235, 160, 20, 0.35)';
    ctx.lineWidth = 6;
    ctx.strokeRect(360, 360, 1328, 1328);

    // Turntable radial boundary
    ctx.beginPath();
    ctx.arc(cx, cy, 420, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = '500 24px "Inter", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.textAlign = 'center';
    ctx.fillText('BAY 09 — HEAVY KINEMATICS DOCK', cx, 330);
    ctx.restore();

    const floorTexture = new THREE.CanvasTexture(floorCanvas);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.42,
      metalness: 0.65
    });

    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.scene.add(floor);
  }

  setupSparks() {
    // Physical laser welding sparks (warm orange-white embers)
    const sparkCount = 90;
    const sparkGeo = new THREE.BufferGeometry();
    const sparkPositions = new Float32Array(sparkCount * 3);
    const sparkVelocities = [];

    for (let i = 0; i < sparkCount; i++) {
      sparkPositions[i * 3] = 0.9;
      sparkPositions[i * 3 + 1] = 2.2;
      sparkPositions[i * 3 + 2] = 0.5;
      sparkVelocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 2.2,
        Math.random() * 2.4 + 0.6,
        (Math.random() - 0.5) * 2.2
      ));
    }

    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: 0xffb74d,
      size: 0.055,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    this.sparks = new THREE.Points(sparkGeo, sparkMat);
    this.sparks.userData = { velocities: sparkVelocities, baseOrigin: new THREE.Vector3(0.9, 2.2, 0.5) };
    this.scene.add(this.sparks);
  }

  loadModels() {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);

    // 1. Load Main Industrial Mech
    loader.load(
      '/models/mech.glb',
      gltf => {
        this.mech = gltf.scene;

        const box = new THREE.Box3().setFromObject(this.mech);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        const scale = 7.5 / size.y;
        this.mech.scale.setScalar(scale);
        this.mech.position.x = -center.x * scale;
        this.mech.position.z = -center.z * scale;
        this.mech.position.y = -box.min.y * scale;

        this.mech.traverse(child => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              child.material.envMapIntensity = 1.1;
              child.material.roughness = Math.max(child.material.roughness, 0.28);
            }
          }
        });

        this.scene.add(this.mech);
        this.updateModelPosition(this.scrollProgress);

        window.dispatchEvent(new CustomEvent('model-loaded'));
      },
      xhr => {
        const percent = Math.round((xhr.loaded / (xhr.total || 7100000)) * 100);
        window.dispatchEvent(new CustomEvent('model-loading-progress', { detail: percent }));
      },
      err => {
        console.error('Error loading mech model:', err);
      }
    );

    // 2. Load Aerial Companion Drone
    loader.load(
      '/models/drone.glb',
      gltf => {
        this.drone = gltf.scene;
        const box = new THREE.Box3().setFromObject(this.drone);
        const size = box.getSize(new THREE.Vector3());
        const scale = 1.5 / size.y;
        this.drone.scale.setScalar(scale);
        this.drone.position.set(-3.2, 6.8, 2.5);

        this.drone.traverse(child => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Subtle inspection downlight (Clean neutral 4000K warm white)
        this.droneLight = new THREE.SpotLight(0xfff8ee, 30, 14, Math.PI / 7, 0.6, 1.2);
        this.droneLight.position.set(0, -0.2, 0);
        this.droneLight.target.position.set(0, -5, 0);
        this.drone.add(this.droneLight);
        this.drone.add(this.droneLight.target);

        this.scene.add(this.drone);
      },
      undefined,
      err => {
        console.error('Error loading drone model:', err);
      }
    );
  }

  setupEvents() {
    window.addEventListener('resize', () => this.onResize());

    window.addEventListener('mousemove', e => {
      this.mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener('touchmove', e => {
      if (e.touches.length > 0) {
        this.mouse.targetX = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
        this.mouse.targetY = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
      }
    }, { passive: true });
  }

  onResize() {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  setScrollProgress(progress) {
    this.scrollProgress = Math.max(0, Math.min(1, progress));
    this.updateCameraPath(this.scrollProgress);
    this.updateModelPosition(this.scrollProgress);
  }

  updateCameraPath(progress) {
    const segmentCount = this.waypoints.length - 1;
    const rawIndex = progress * segmentCount;
    const index = Math.floor(rawIndex);
    const fraction = rawIndex - index;

    const wpA = this.waypoints[index];
    const wpB = this.waypoints[Math.min(index + 1, segmentCount)];

    if (!wpA || !wpB) return;

    const ease = fraction * fraction * (3 - 2 * fraction);

    this.currentCamPos.lerpVectors(wpA.camPos, wpB.camPos, ease);
    this.currentTarget.lerpVectors(wpA.target, wpB.target, ease);
    const targetFov = THREE.MathUtils.lerp(wpA.fov, wpB.fov, ease);

    if (Math.abs(this.camera.fov - targetFov) > 0.1) {
      this.camera.fov = targetFov;
      this.camera.updateProjectionMatrix();
    }
  }

  updateModelPosition(progress) {
    if (!this.mech) return;
    const baseRot = Math.sin(progress * Math.PI) * 0.22;
    this.mech.rotation.y = baseRot;
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    // Restrained, premium mouse parallax
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.04;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.04;

    const parallaxX = this.mouse.x * 0.35;
    const parallaxY = this.mouse.y * 0.25;

    this.camera.position.x = this.currentCamPos.x + parallaxX;
    this.camera.position.y = this.currentCamPos.y + parallaxY;
    this.camera.position.z = this.currentCamPos.z;
    this.camera.lookAt(this.currentTarget);

    // Companion Drone gentle patrol orbit
    if (this.drone) {
      const droneRadius = 3.5;
      const droneSpeed = 0.38;
      this.drone.position.x = Math.sin(time * droneSpeed) * droneRadius;
      this.drone.position.z = Math.cos(time * droneSpeed) * (droneRadius * 0.75) + 1.0;
      this.drone.position.y = 6.4 + Math.sin(time * 1.5) * 0.18;
      this.drone.rotation.y = time * droneSpeed + Math.PI / 2;
      this.drone.rotation.z = Math.sin(time * 1.5) * 0.05;

      if (this.droneLight) {
        this.droneLight.target.position.set(0, 4.2, 0);
      }
    }

    // Laser Welding Sparks physics
    if (this.sparks) {
      const pos = this.sparks.geometry.attributes.position.array;
      const vel = this.sparks.userData.velocities;
      const origin = this.sparks.userData.baseOrigin;
      const count = vel.length;

      for (let i = 0; i < count; i++) {
        const idx = i * 3;
        pos[idx] += vel[i].x * delta;
        pos[idx + 1] += vel[i].y * delta;
        pos[idx + 2] += vel[i].z * delta;

        vel[i].y -= 9.8 * delta * 0.45;

        if (pos[idx + 1] <= 0 || Math.random() < 0.03) {
          pos[idx] = origin.x + (Math.random() - 0.5) * 0.15;
          pos[idx + 1] = origin.y + (Math.random() - 0.5) * 0.15;
          pos[idx + 2] = origin.z + (Math.random() - 0.5) * 0.15;
          vel[i].set(
            (Math.random() - 0.5) * 2.8,
            Math.random() * 2.2 + 0.6,
            (Math.random() - 0.5) * 2.8
          );
        }
      }
      this.sparks.geometry.attributes.position.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
  }
}
