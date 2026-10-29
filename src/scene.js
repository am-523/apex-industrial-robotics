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
    this.dust = null;
    this.clock = new THREE.Clock();
    
    // Camera waypoints for scroll acts
    this.waypoints = [
      { camPos: new THREE.Vector3(0, 4.2, 11.5), target: new THREE.Vector3(0, 4.0, 0), fov: 38 }, // Hero
      { camPos: new THREE.Vector3(4.8, 5.8, 6.2), target: new THREE.Vector3(1.2, 5.0, 0), fov: 34 }, // Kinematics (Shoulder/Arm)
      { camPos: new THREE.Vector3(-3.5, 6.5, 4.5), target: new THREE.Vector3(0, 6.2, 0), fov: 30 }, // Autonomy (Head / Sensor Dome)
      { camPos: new THREE.Vector3(3.2, 2.5, 5.5), target: new THREE.Vector3(0.8, 2.2, 0), fov: 34 }, // End-Effectors (Manipulator hands)
      { camPos: new THREE.Vector3(-4.8, 2.0, 7.5), target: new THREE.Vector3(0, 2.8, 0), fov: 36 }, // Harsh Environment
      { camPos: new THREE.Vector3(0, 5.5, 13.0), target: new THREE.Vector3(0, 4.2, 0), fov: 40 }, // Specs & Configurator
      { camPos: new THREE.Vector3(0, 4.5, 11.8), target: new THREE.Vector3(0, 4.0, 0), fov: 38 }  // CTA / Footer
    ];

    this.currentCamPos = this.waypoints[0].camPos.clone();
    this.currentTarget = this.waypoints[0].target.clone();
    this.scrollProgress = 0;
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.isManualOrbit = false;
    this.orbitAngles = { theta: 0, phi: 0 };
    this.scanY = 0;
    this.scanDirection = 1;

    // Hotspot positions in model space
    this.hotspots = [
      { id: 'hs-core', name: 'PLASMA REACTOR', pos: new THREE.Vector3(0, 4.8, 0.4), desc: '42 MW Solid-State Core with Liquid Helium Thermal Jacket' },
      { id: 'hs-arm', name: '6-AXIS KINEMATIC ACTUATOR', pos: new THREE.Vector3(2.4, 4.2, 0.5), desc: 'Planetary Cycloidal Reducer with 12,000 Nm Continuous Torque' },
      { id: 'hs-head', name: 'LIDAR SENSOR TURRET', pos: new THREE.Vector3(0, 6.8, 0.8), desc: 'Dual Solid-State 3D LiDAR with 360° Multi-Spectral Perception' },
      { id: 'hs-hand', name: 'RAPID TOOL COUPLER', pos: new THREE.Vector3(-2.2, 2.4, 0.6), desc: 'Automatic 3.5s Tool Changer with Optical Data Bus' },
      { id: 'hs-leg', name: 'HEAVY SHOCK DAMPENER', pos: new THREE.Vector3(1.3, 1.2, -0.2), desc: 'Hydro-Pneumatic Multi-Chamber Suspension Rated for 45 Tons' }
    ];

    this.init();
  }

  init() {
    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x06080b, 0.022);

    // 2. Camera setup
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 100);
    this.camera.position.copy(this.currentCamPos);
    this.camera.lookAt(this.currentTarget);

    // 3. Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.AgXToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. Lighting setup
    this.setupLights();

    // 5. Environment & Floor setup
    this.setupEnvironment();

    // 6. Particle Systems (Sparks & Metallic Dust)
    this.setupParticles();

    // 7. Load 3D Models
    this.loadModels();

    // 8. Event listeners
    this.setupEvents();

    // 9. Start render loop
    this.animate();
  }

  setupLights() {
    // Ambient / Hemisphere light for rich metallic reflections
    const hemi = new THREE.HemisphereLight(0xa5c4e8, 0x181c24, 1.8);
    this.scene.add(hemi);

    // Main Key Light from top-front
    const mainKey = new THREE.DirectionalLight(0xffffff, 3.8);
    mainKey.position.set(4, 12, 8);
    mainKey.castShadow = true;
    mainKey.shadow.mapSize.width = 2048;
    mainKey.shadow.mapSize.height = 2048;
    mainKey.shadow.bias = -0.0005;
    this.scene.add(mainKey);

    // Secondary Rim Light from behind
    const backRim = new THREE.DirectionalLight(0x6090d0, 2.5);
    backRim.position.set(-6, 8, -6);
    this.scene.add(backRim);

    // Amber Hazard Rim Light (Left)
    const amberRim = new THREE.PointLight(0xffa200, 60, 20, 1.2);
    amberRim.position.set(-5, 4, -2);
    this.scene.add(amberRim);

    // Cyan Sensor / Cyber Rim Light (Right)
    const cyanRim = new THREE.PointLight(0x00f0ff, 55, 22, 1.2);
    cyanRim.position.set(5, 5, 3);
    this.scene.add(cyanRim);

    // Fill Light from front low
    const fillLight = new THREE.DirectionalLight(0x80a0c0, 1.2);
    fillLight.position.set(0, 1, 9);
    this.scene.add(fillLight);
  }

  setupEnvironment() {
    // Industrial Grid Hangar Floor
    const floorSize = 40;
    const floorGeo = new THREE.PlaneGeometry(floorSize, floorSize, 64, 64);
    
    // Canvas texture for high-detail hazard markings & hex tiles
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 2048;
    floorCanvas.height = 2048;
    const ctx = floorCanvas.getContext('2d');

    // Base dark industrial concrete
    ctx.fillStyle = '#090b0e';
    ctx.fillRect(0, 0, 2048, 2048);

    // Subtle grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 2;
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

    // Heavy Foundry Bay Boundary (Hazard Stripes)
    const cx = 1024, cy = 1024;
    ctx.save();
    ctx.strokeStyle = '#ff9900';
    ctx.lineWidth = 14;
    ctx.strokeRect(300, 300, 1448, 1448);

    // Diagonal hazard stripes along the outer boundary
    ctx.fillStyle = '#ff9900';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CRANE CLEARANCE // 45-TON FOUNDRY BAY 09 // APEX-TITAN DOCK', cx, 280);
    ctx.fillText('WARNING: AUTOMATIC 6-AXIS OPERATION IN PROGRESS', cx, 1780);
    ctx.restore();

    // Central circular turntable marking
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, 480, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
    ctx.lineWidth = 4;
    ctx.setLineDash([20, 15]);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 260, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 160, 0, 0.4)';
    ctx.lineWidth = 6;
    ctx.setLineDash([40, 20]);
    ctx.stroke();
    ctx.restore();

    const floorTexture = new THREE.CanvasTexture(floorCanvas);
    floorTexture.wrapS = THREE.ClampToEdgeWrapping;
    floorTexture.wrapT = THREE.ClampToEdgeWrapping;

    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.35,
      metalness: 0.75,
      roughnessMap: floorTexture
    });

    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Turntable glowing ring
    const ringGeo = new THREE.RingGeometry(3.8, 3.86, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.02;
    this.scene.add(ringMesh);
  }

  setupParticles() {
    // 1. Floating metallic workshop dust
    const dustCount = 350;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount * 3; i += 3) {
      dustPositions[i] = (Math.random() - 0.5) * 16;
      dustPositions[i + 1] = Math.random() * 10;
      dustPositions[i + 2] = (Math.random() - 0.5) * 16;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0x88b0d0,
      size: 0.045,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending
    });
    this.dust = new THREE.Points(dustGeo, dustMat);
    this.scene.add(this.dust);

    // 2. Dynamic Laser Welding Sparks from the end-effector
    const sparkCount = 180;
    const sparkGeo = new THREE.BufferGeometry();
    const sparkPositions = new Float32Array(sparkCount * 3);
    const sparkVelocities = [];
    for (let i = 0; i < sparkCount; i++) {
      sparkPositions[i * 3] = 0.9;
      sparkPositions[i * 3 + 1] = 2.2;
      sparkPositions[i * 3 + 2] = 0.5;
      sparkVelocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 2.5,
        Math.random() * 2.8 + 0.5,
        (Math.random() - 0.5) * 2.5
      ));
    }
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: 0xffcc33,
      size: 0.065,
      transparent: true,
      opacity: 0.9,
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

        // Auto compute bounding box & scale appropriately
        const box = new THREE.Box3().setFromObject(this.mech);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        // Desired height ~8 units
        const scale = 7.5 / size.y;
        this.mech.scale.setScalar(scale);

        // Center on X and Z, set base touching floor (Y=0)
        this.mech.position.x = -center.x * scale;
        this.mech.position.z = -center.z * scale;
        this.mech.position.y = -box.min.y * scale;

        this.mech.traverse(child => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              child.material.envMapIntensity = 1.25;
              child.material.roughness = Math.max(child.material.roughness, 0.25);
            }
          }
        });

        this.scene.add(this.mech);
        this.updateModelPosition(this.scrollProgress);

        // Trigger UI event that model is loaded
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

    // 2. Load Companion Inspection Drone
    loader.load(
      '/models/drone.glb',
      gltf => {
        this.drone = gltf.scene;
        const box = new THREE.Box3().setFromObject(this.drone);
        const size = box.getSize(new THREE.Vector3());
        const scale = 1.6 / size.y;
        this.drone.scale.setScalar(scale);
        this.drone.position.set(-3.2, 6.8, 2.5);

        this.drone.traverse(child => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Add spotlight mounted under the drone
        this.droneLight = new THREE.SpotLight(0x00f0ff, 45, 15, Math.PI / 6, 0.5, 1.2);
        this.droneLight.position.set(0, -0.2, 0);
        this.droneLight.target.position.set(0, -6, 0);
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

    // Touch support for mobile parallax
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
    // Interpolate across waypoints array based on progress
    const segmentCount = this.waypoints.length - 1;
    const rawIndex = progress * segmentCount;
    const index = Math.floor(rawIndex);
    const fraction = rawIndex - index;

    const wpA = this.waypoints[index];
    const wpB = this.waypoints[Math.min(index + 1, segmentCount)];

    if (!wpA || !wpB) return;

    // Smooth cubic easing for waypoint interpolation
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
    // Subtle rotation or breathing posture based on scroll stage
    const baseRot = Math.sin(progress * Math.PI) * 0.28;
    this.mech.rotation.y = baseRot;
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    // 1. Mouse Parallax smoothing
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    // 2. Camera positioning with parallax offset
    const parallaxX = this.mouse.x * 0.45;
    const parallaxY = this.mouse.y * 0.35;

    this.camera.position.x = this.currentCamPos.x + parallaxX;
    this.camera.position.y = this.currentCamPos.y + parallaxY;
    this.camera.position.z = this.currentCamPos.z;
    this.camera.lookAt(this.currentTarget);

    // 3. Companion Drone hovering motion
    if (this.drone) {
      const droneRadius = 3.6;
      const droneSpeed = 0.45;
      this.drone.position.x = Math.sin(time * droneSpeed) * droneRadius;
      this.drone.position.z = Math.cos(time * droneSpeed) * (droneRadius * 0.8) + 1.2;
      this.drone.position.y = 6.2 + Math.sin(time * 1.8) * 0.25;
      this.drone.rotation.y = time * droneSpeed + Math.PI / 2;
      this.drone.rotation.z = Math.sin(time * 1.8) * 0.08;

      if (this.droneLight) {
        // Point drone spotlight at the mech's chest / core
        this.droneLight.target.position.set(0, 4.5, 0);
      }
    }

    // 4. Metallic dust float animation
    if (this.dust) {
      const pos = this.dust.geometry.attributes.position.array;
      for (let i = 1; i < pos.length; i += 3) {
        pos[i] += delta * 0.15;
        if (pos[i] > 10) pos[i] = 0;
      }
      this.dust.geometry.attributes.position.needsUpdate = true;
    }

    // 5. Laser Welding Sparks animation
    if (this.sparks) {
      const pos = this.sparks.geometry.attributes.position.array;
      const vel = this.sparks.userData.velocities;
      const origin = this.sparks.userData.baseOrigin;
      const sparkCount = vel.length;

      for (let i = 0; i < sparkCount; i++) {
        const idx = i * 3;
        pos[idx] += vel[i].x * delta;
        pos[idx + 1] += vel[i].y * delta;
        pos[idx + 2] += vel[i].z * delta;

        // Apply gravity to sparks
        vel[i].y -= 9.8 * delta * 0.5;

        // Reset spark when it hits the floor or dies
        if (pos[idx + 1] <= 0 || Math.random() < 0.02) {
          pos[idx] = origin.x + (Math.random() - 0.5) * 0.2;
          pos[idx + 1] = origin.y + (Math.random() - 0.5) * 0.2;
          pos[idx + 2] = origin.z + (Math.random() - 0.5) * 0.2;
          vel[i].set(
            (Math.random() - 0.5) * 3.2,
            Math.random() * 2.8 + 0.8,
            (Math.random() - 0.5) * 3.2
          );
        }
      }
      this.sparks.geometry.attributes.position.needsUpdate = true;
    }

    // 6. Update 3D Hotspot Screen Coordinates
    this.updateHotspotProjections();

    // 7. Render frame
    this.renderer.render(this.scene, this.camera);
  }

  updateHotspotProjections() {
    if (!this.mech) return;

    this.hotspots.forEach(hs => {
      const el = document.getElementById(hs.id);
      if (!el) return;

      // Transform local hotspot coordinate to world space
      const worldPos = hs.pos.clone().applyMatrix4(this.mech.matrixWorld);

      // Project to 2D screen coordinate
      const screenPos = worldPos.clone().project(this.camera);

      // Check if behind camera
      if (screenPos.z > 1) {
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
        return;
      }

      const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-(screenPos.y * 0.5) + 0.5) * window.innerHeight;

      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      el.style.opacity = '1';
      el.style.pointerEvents = 'auto';
    });
  }

  focusOnHotspot(hotspotId) {
    const hs = this.hotspots.find(h => h.id === hotspotId);
    if (!hs || !this.mech) return;

    const worldTarget = hs.pos.clone().applyMatrix4(this.mech.matrixWorld);
    const offset = new THREE.Vector3(2.5, 1.2, 3.8);

    this.currentTarget.copy(worldTarget);
    this.currentCamPos.copy(worldTarget.clone().add(offset));
  }
}
