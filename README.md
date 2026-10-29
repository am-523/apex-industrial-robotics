# APEX-09 TITAN // 40-Ton Heavy Industrial Robotics & Autonomous Fabrication Matrix

An ultra-premium, interactive 3D web experience for **APEX-09 TITAN** — an autonomous 40-ton robotic kinematic manipulator and automated fabrication platform built for foundry environments, high-mass forge manipulation, and continuous 20 kW laser cladding.

Live local development port: `http://localhost:5177/`

---

## 🌟 Key Features

1. **Photorealistic 3D Industrial Scene (Three.js r186)**
   - **40-Ton Heavy Industrial Mech Robot** (`mech.glb` - 6.8 MB) with high-detail PBR metallic armor, hydraulic joints, and gantry fixtures.
   - **Autonomous Aerial Companion Drone** (`drone.glb` - 4.4 MB) with rotating quad-rotors and active directional searchlight targeting workpieces.
   - **Foundry Bay Marking Floor** with procedural hazard stripes, turntable circle, and world-space grid projection.
   - **Dynamic Laser Welding Sparks & Atmospheric Metallic Dust** particle systems.
   - **AgX Tone Mapping & Soft Shadows** tuned for rich specular highlights and deep gunmetal tones.

2. **Cinematic Scroll Choreography & 3D Waypoints**
   - **Hero (0% Scroll)**: Colossal front-facing low-angle reveal of the full 40-ton matrix.
   - **Act 01 // Kinematics (20% Scroll)**: Camera zooms into the 12,000 Nm planetary cycloidal shoulder actuators (Right-aligned narrative).
   - **Act 02 // Edge Autonomy (40% Scroll)**: Close inspection of the LiDAR sensor turret and companion drone link (Left-aligned narrative).
   - **Act 03 // Modular End-Effectors (60% Scroll)**: Focus on the manipulator hands and 20 kW fiber laser tool (Right-aligned narrative).
   - **Act 04 // Harsh Environment (75% Scroll)**: Low-angle view of the hydro-pneumatic titanium bogie suspension (Left-aligned narrative).
   - **Act 05 // Specification Matrix (90% Scroll)**: Full-width engineering data table.
   - **Act 06 // Interactive Configurator (95% Scroll)**: Interactive 3D deployment customizer with real-time price & lead-time calculation.

3. **Design System & Aesthetics**
   - **Apple 2026/2027 Liquid Glass UI**: Multi-layered frosted glass with high-index refractive bevels, specular reflections, and subtle chromatic glow.
   - **Strict Alternating Left / Right Layout** to preserve full visual clearance of the 3D robotics model.
   - **Live Industrial HUD Telemetry**: Real-time continuous jitter readouts for Hydraulic PSI (~3,480 PSI), Core Temperature (~64.2°C), Edge Inference Latency (~1.18 ms), and Kinematic Load.
   - **Interactive 3D Hotspots**: Projected world-space markers that track robot joints and focus camera upon click.

4. **Performance & Architecture**
   - **Vite 5** lightning-fast bundler with zero-runtime bloat.
   - **Lenis Smooth Scroll** with custom cubic easing curves.
   - **MeshoptDecoder** acceleration for zero-lag 3D mesh decompression.
   - **Responsive Breakpoints** with custom mobile frosted cards.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested on Node v22)
- npm or pnpm

### Installation
```bash
# Clone the repository
git clone https://github.com/am-523/apex-industrial-robotics.git
cd apex-industrial-robotics

# Install dependencies
npm install

# Start development server
npm run dev
# Server will start on http://localhost:5177/
```

### Production Build
```bash
npm run build
npm run preview
```

---

## 🛠️ Tech Stack
- **Three.js** `r186.1` (WebGL 3D engine, AgX Tone Mapping, PCFSoftShadowMap)
- **GLTFLoader + MeshoptDecoder** (Optimized 3D asset pipeline)
- **Lenis** `^1.3.26` (Hardware-accelerated smooth scrolling)
- **GSAP** `^3.15.0` (Camera tweening and choreography)
- **Vite** `^5.4.2` (Modern frontend tooling)

---

## 📄 License
MIT License. Built for advanced industrial automation showcases.
