<div align="center">
  <h1>Resident Evil 3D</h1>
  <p>
    A cinematic 3D web experience inspired by the iconic Resident Evil atmosphere,
    built as a front-end showcase with scroll-driven storytelling, real-time scene
    rendering, and procedural ambient audio.
  </p>

  <p>
    <a href="https://github.com/joaovitorcorrea06/resident-evil-3d">Repository</a>
    ·
    <a href="#-quick-start">Quick Start</a>
    ·
    <a href="#-features">Features</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/React-19-111111?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 19" />
    <img src="https://img.shields.io/badge/Vite-7-111111?style=for-the-badge&logo=vite&logoColor=646CFF" alt="Vite 7" />
    <img src="https://img.shields.io/badge/Three.js-0.179-111111?style=for-the-badge&logo=three.js&logoColor=FFFFFF" alt="Three.js" />
    <img src="https://img.shields.io/badge/R3F-Experience-111111?style=for-the-badge&logo=render&logoColor=FFFFFF" alt="React Three Fiber" />
  </p>
</div>

## 📋 Table of Contents

1. 🤖 [Introduction](#-introduction)
2. ⚙️ [Tech Stack](#️-tech-stack)
3. 🔋 [Features](#-features)
4. 🤸 [Quick Start](#-quick-start)
5. 🗂️ [Project Structure](#️-project-structure)
6. 🧠 [Technical Highlights](#-technical-highlights)
7. 🚀 [More](#-more)

## 🤖 Introduction

**Resident Evil 3D** is a personal front-end showcase project designed to recreate
the tension of classic survival horror inside the browser.

Instead of a traditional landing page, this project delivers a cinematic sequence:
the camera moves through a 3D environment as the user scrolls, text chapters fade in
and out like story beats, and a custom ambient soundscape gradually reinforces the
scene.

This project was built to highlight strengths in:

- immersive front-end experiences
- 3D rendering for the web
- motion-driven UI storytelling
- creative JavaScript interaction design
- polished visual atmosphere and presentation

> This is a fan-made study inspired by the Resident Evil universe and is not affiliated with Capcom.

## ⚙️ Tech Stack

- React 19
- Vite 7
- Three.js
- React Three Fiber
- Drei
- GSAP
- Leva
- Web Audio API
- CSS3

## 🔋 Features

👉 **Scroll-driven cinematic progression** with a custom camera path moving through the scene.

👉 **3D Resident Evil-inspired environment** rendered from a baked `.glb` model.

👉 **Narrative overlay system** with timed story chapters, hero messaging, and atmospheric transitions.

👉 **Procedural ambient audio** generated with the Web Audio API, including room tone, drone layers, and fireplace emphasis.

👉 **Adaptive camera layouts** tuned separately for desktop and mobile viewports.

👉 **Reduced motion support** for users who prefer a softer animated experience.

👉 **Sound persistence** using `localStorage` so mute state remains consistent between visits.

👉 **Loading management and preloading** for a smoother first render.

👉 **Model inspection tooling** through a dedicated `analyze:glb` script.

## 🤸 Quick Start

Follow these steps to run the project locally.

### Prerequisites

Make sure you have the following installed:

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) 18+
- [npm](https://www.npmjs.com/)

### Clone the repository

```bash
git clone https://github.com/joaovitorcorrea06/resident-evil-3d.git
cd resident-evil-3d
```

### Install dependencies

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

### Build for production

```bash
npm run build
```

### Analyze the 3D model

```bash
npm run analyze:glb
```

## 🗂️ Project Structure

```text
resident-evil-3d/
├── 3d-model/
│   └── resident_evil_1_dining_room_baked.glb
├── scripts/
│   └── analyze-glb.mjs
├── src/
│   ├── components/experience/
│   ├── config/
│   ├── hooks/
│   ├── story/
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── package.json
└── vite.config.js
```

## 🧠 Technical Highlights

### 3D Scene Pipeline

The main scene is loaded with `useGLTF`, configured with custom material treatment,
and rendered through a fixed full-screen canvas using React Three Fiber.

### Camera Direction by Scroll

The navigation experience is controlled by a custom curve-based camera path.
Separate layouts for desktop and mobile make the sequence feel intentional across devices.

### Storytelling Layer

The text overlay is synchronized with scroll progress, allowing each section to appear
at precise moments while visual effects such as vignette, tint, glow, and grain evolve with the scene.

### Audio Atmosphere

Ambient sound is synthesized in the browser with oscillators, filters, noise buffers,
and scheduled note/chord progression instead of relying on a static background track.

## 🚀 More

This repository is part of a portfolio-oriented body of work focused on interactive,
visual, and technically expressive front-end projects.

If you want to explore more of my work:

- GitHub Profile: [@joaovitorcorrea06](https://github.com/joaovitorcorrea06)
- Repository: [resident-evil-3d](https://github.com/joaovitorcorrea06/resident-evil-3d)

