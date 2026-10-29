import Lenis from 'lenis';
import { RoboticsScene } from './scene.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Studio Three.js Robotics Scene
  const canvas = document.getElementById('webgl-canvas');
  const roboticsScene = new RoboticsScene(canvas);

  // 2. Preloader & Digital Twin Sync
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

  // Safety fallback
  setTimeout(() => {
    if (preloader) {
      preloader.classList.add('hidden');
      preloader.style.display = 'none';
    }
  }, 1200);

  // 3. Lenis Smooth Scroll
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1.0,
    touchMultiplier: 2.0
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // Synchronize Lenis scroll with 3D scene camera waypoints
  lenis.on('scroll', (e) => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? e.scroll / maxScroll : 0;
    roboticsScene.setScrollProgress(progress);
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

  // 4. Tool Matrix Switcher (Section 3)
  const toolData = {
    laser: {
      name: '20 kW Fiber Laser Cladding Head',
      desc: 'Continuous powder-feed laser deposition and deep-penetration structural seam joining. Active optical pyrometry adjusts power in real-time.',
      meta1: 'Wavelength: 1,070 nm',
      meta2: 'Duty Cycle: 100% Continuous'
    },
    clamp: {
      name: '45-Ton Heavy Forging Clamp',
      desc: 'Synchronized servo-hydraulic dual-jaw grip engineered for manipulating red-hot steel ingots and heavy castings through forging cycles.',
      meta1: 'Clamping Force: 22,000 Nm',
      meta2: 'Thermal Rating: 1,200°C Direct Contact'
    },
    plasma: {
      name: 'High-Definition Plasma Arc Torch',
      desc: 'Precision bevel and structural slicing of armor-grade alloy plates up to 120 mm thickness with sub-millimeter kerf width control.',
      meta1: 'Gas Mixture: O2 / N2 Dual Gas',
      meta2: 'Cut Speed: Up to 3.2 m/min'
    },
    milling: {
      name: 'High-Torque 5-Axis Milling Spindle',
      desc: 'High-speed finishing spindle for robotic post-weld deburring, turbine surface machining, and precision valve seat truing.',
      meta1: 'Spindle Speed: 30,000 RPM',
      meta2: 'Interface: HSK-A63 Direct Drive'
    }
  };

  const toolPills = document.querySelectorAll('.tool-pill');
  const toolNameEl = document.getElementById('tool-name');
  const toolDescEl = document.getElementById('tool-desc');
  const toolMetaEl = document.getElementById('tool-meta');

  toolPills.forEach(pill => {
    pill.addEventListener('click', () => {
      toolPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const data = toolData[pill.dataset.tool];
      if (data && toolNameEl && toolDescEl && toolMetaEl) {
        toolNameEl.textContent = data.name;
        toolDescEl.textContent = data.desc;
        toolMetaEl.innerHTML = `<span>${data.meta1}</span><span>${data.meta2}</span>`;
      }
    });
  });

  // 5. Hardware Deployment Configurator (Section 6)
  const basePrice = 1250000;
  const config = {
    chassis: { name: 'Foundry Pad (Static)', price: 0, time: 0 },
    tool: { name: '20 kW Fiber Laser', price: 220000, time: 1 },
    ai: { name: 'Dual Jetson AGX Orin + LiDAR', price: 120000, time: 1 }
  };

  function updateConfigSummary() {
    const total = basePrice + config.chassis.price + config.tool.price + config.ai.price;
    const leadTime = 9 + config.chassis.time + config.tool.time + config.ai.time;

    const sumChassis = document.getElementById('sum-chassis');
    const sumTool = document.getElementById('sum-tool');
    const sumAi = document.getElementById('sum-ai');
    const sumTime = document.getElementById('sum-time');
    const sumTotal = document.getElementById('sum-total');

    if (sumChassis) sumChassis.textContent = config.chassis.name;
    if (sumTool) sumTool.textContent = config.tool.name;
    if (sumAi) sumAi.textContent = config.ai.name;
    if (sumTime) sumTime.textContent = `${leadTime} Weeks`;
    if (sumTotal) sumTotal.textContent = `$${total.toLocaleString()}`;
  }

  function bindOptionGroup(containerId, configKey) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const buttons = container.querySelectorAll('.opt-btn');

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        config[configKey] = {
          name: btn.textContent.trim(),
          price: parseInt(btn.dataset.price || '0', 10),
          time: parseInt(btn.dataset.time || '0', 10)
        };

        updateConfigSummary();
      });
    });
  }

  bindOptionGroup('opt-chassis', 'chassis');
  bindOptionGroup('opt-tool', 'tool');
  bindOptionGroup('opt-ai', 'ai');
  updateConfigSummary();

  // 6. Engineering Requisition Form
  const form = document.getElementById('pilot-form');
  const successEl = document.getElementById('form-success');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (successEl) {
        successEl.style.display = 'block';
      }
      form.reset();
    });
  }
});
