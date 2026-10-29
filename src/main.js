import Lenis from 'lenis';
import { RoboticsScene } from './scene.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Three.js Robotics Scene
  const canvas = document.getElementById('webgl-canvas');
  const roboticsScene = new RoboticsScene(canvas);

  // 2. Preloader & Loading Animation
  const preloader = document.getElementById('preloader');
  const loaderFill = document.getElementById('loader-fill');
  const loaderPercent = document.getElementById('loader-percent');

  window.addEventListener('model-loading-progress', e => {
    const pct = Math.min(99, e.detail);
    if (loaderFill) loaderFill.style.width = `${pct}%`;
    if (loaderPercent) loaderPercent.textContent = pct;
  });

  window.addEventListener('model-loaded', () => {
    if (loaderFill) loaderFill.style.width = '100%';
    if (loaderPercent) loaderPercent.textContent = '100';
    setTimeout(() => {
      if (preloader) {
        preloader.classList.add('hidden');
        preloader.style.display = 'none';
      }
    }, 100);
  });

  // Fallback in case loading event is delayed
  setTimeout(() => {
    if (preloader) {
      preloader.classList.add('hidden');
      preloader.style.display = 'none';
    }
  }, 1000);

  // 3. Initialize Lenis Smooth Scroll
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1.0,
    touchMultiplier: 2.0
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // Synchronize Lenis scroll with 3D scene camera choreography
  lenis.on('scroll', (e) => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? e.scroll / maxScroll : 0;
    roboticsScene.setScrollProgress(progress);

    // Dynamically modulate kinematic load indicator based on scroll velocity
    const speed = Math.abs(e.velocity || 0);
    const dynamicLoad = Math.min(98.5, 38.0 + speed * 12).toFixed(1);
    const loadEl = document.getElementById('hud-load');
    if (loadEl) loadEl.textContent = `${dynamicLoad}%`;
  });

  // Smooth scroll for nav anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        lenis.scrollTo(targetEl, { offset: -40, duration: 1.4 });
      }
    });
  });

  // 4. Real-time Telemetry Random Fluctuations (Living Industrial HUD)
  const psiEl = document.getElementById('hud-psi');
  const tempEl = document.getElementById('hud-temp');
  const latencyEl = document.getElementById('hud-latency');

  setInterval(() => {
    if (psiEl) {
      const basePsi = 3480;
      const jitter = Math.floor(Math.random() * 24 - 12);
      psiEl.textContent = `${(basePsi + jitter).toLocaleString()} PSI`;
    }

    if (tempEl) {
      const baseTemp = 64.2;
      const jitter = (Math.random() * 0.6 - 0.3).toFixed(1);
      tempEl.textContent = `${(baseTemp + parseFloat(jitter)).toFixed(1)}°C [STABLE]`;
    }

    if (latencyEl) {
      const baseLat = 1.18;
      const jitter = (Math.random() * 0.08 - 0.04).toFixed(2);
      latencyEl.textContent = `${(baseLat + parseFloat(jitter)).toFixed(2)} ms`;
    }
  }, 1800);

  // 5. Interactive Tool Switcher (Section 3)
  const toolButtons = document.querySelectorAll('.tool-option-btn');
  toolButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      toolButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const toolType = btn.dataset.tool;
      // Trigger camera adjustment or spark focus based on chosen tool
      if (toolType === 'laser') {
        roboticsScene.focusOnHotspot('hs-hand');
      } else if (toolType === 'gripper') {
        roboticsScene.focusOnHotspot('hs-hand');
      } else if (toolType === 'plasma') {
        roboticsScene.focusOnHotspot('hs-arm');
      } else if (toolType === 'milling') {
        roboticsScene.focusOnHotspot('hs-hand');
      }
    });
  });

  // 6. Interactive 3D Hotspot Clicks
  const hotspotElements = document.querySelectorAll('.hotspot-marker');
  hotspotElements.forEach(hsEl => {
    hsEl.addEventListener('click', () => {
      roboticsScene.focusOnHotspot(hsEl.id);
    });
  });

  // 7. Interactive Configurator Logic
  const basePrice = 1250000;
  const configState = {
    chassis: { name: 'Foundry Heavy Pad', price: 0, time: 0 },
    tool: { name: '20 kW Laser Cladding', price: 220000, time: 1 },
    ai: { name: 'Dual Orin + Solid-State LiDAR', price: 120000, time: 1 },
    service: { name: 'Enterprise 3-Yr SLA', price: 50000, time: 0 }
  };

  function updateConfigSummary() {
    const total = basePrice + configState.chassis.price + configState.tool.price + configState.ai.price + configState.service.price;
    const baseLeadTime = 10;
    const totalTime = baseLeadTime + configState.chassis.time + configState.tool.time + configState.ai.time;

    const summaryChassis = document.getElementById('summary-chassis');
    const summaryTool = document.getElementById('summary-tool');
    const summaryAi = document.getElementById('summary-ai');
    const summaryTime = document.getElementById('summary-time');
    const summaryTotal = document.getElementById('summary-total');

    if (summaryChassis) summaryChassis.textContent = configState.chassis.name;
    if (summaryTool) summaryTool.textContent = configState.tool.name;
    if (summaryAi) summaryAi.textContent = configState.ai.name;
    if (summaryTime) summaryTime.textContent = `${totalTime} WEEKS`;
    if (summaryTotal) summaryTotal.textContent = `$${total.toLocaleString()}`;
  }

  function bindConfigGroup(groupId, stateKey, nameMap) {
    const container = document.getElementById(groupId);
    if (!container) return;
    const pills = container.querySelectorAll('.config-pill');

    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        const val = pill.dataset.val;
        const price = parseInt(pill.dataset.price || '0', 10);
        const time = parseInt(pill.dataset.time || '0', 10);

        configState[stateKey] = {
          name: nameMap[val] || pill.textContent.trim(),
          price,
          time
        };

        updateConfigSummary();
      });
    });
  }

  bindConfigGroup('cfg-chassis', 'chassis', {
    static: 'Foundry Heavy Pad (Static)',
    rail: 'Linear Gantry Rail (+18m)',
    tracked: 'Heavy Tracked AGV Base'
  });

  bindConfigGroup('cfg-tool', 'tool', {
    laser: '20 kW Fiber Laser Weld Head',
    clamp: '45-Ton Forging Clamp',
    hybrid: 'Dual Laser + Clamp Hybrid'
  });

  bindConfigGroup('cfg-ai', 'ai', {
    orin: 'Dual NVIDIA Isaac Orin + LiDAR',
    swarm: 'Orin + Aerial Drone Scout Link'
  });

  bindConfigGroup('cfg-service', 'service', {
    standard: 'Enterprise 3-Yr SLA (4h Repair)',
    critical: 'Mission Critical 5-Yr Unlimited'
  });

  updateConfigSummary();

  // 8. Form Submission Feedback
  const form = document.getElementById('deployment-form');
  const feedback = document.getElementById('form-feedback');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (feedback) {
        feedback.style.display = 'block';
        feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      form.reset();
    });
  }
});
