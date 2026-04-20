# 🌌 Waifu Vault v2.0

<div align="center">
  <img src="https://img.shields.io/badge/Version-2.0.0-blueviolet?style=for-the-badge" alt="Version" />
  <img src="https://img.shields.io/badge/React-2024-61DAFB?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Vite-Ready-646CFF?style=for-the-badge&logo=vite" alt="Vite" />
</div>

---

## 🌟 Overview

**Waifu Vault** is a high-fidelity, modern web application designed for exploring and discovering high-quality character art and media across multiple popular image boards. With a focus on **Premium UX**, **Dynamic Interactivity**, and **Universal Theming**, it provides a centralized gateway to millions of images with high-performance filtering and content management.

## ✨ Key Features

### 🎨 Premium User Interface
- **Dynamic Home Page**: A search-engine inspired landing page with a central repository feel.
- **Hero Carousel**: An auto-scrolling, high-fidelity gallery carousel that intuitively adapts its content to your safety preferences.
- **Micro-Animations**: Smooth transitions, hover scaling, and progress bar loaders powered by optimized CSS and React state.

### 🌓 Universal Theming
- **Global Light/Dark Mode**: A complete theme system that adapts every component (Sidebar, Modals, Grids, etc.) to your preferred aesthetic.
- **Glassmorphism**: Modern backdrop-blur effects and translucent layers for a "premium" software feel.

### 🔒 Safety & NSFW Controls
- **NSFW State Management**: A global safety toggle that gates restricted content behind confirmation modals.
- **Smart Filtering**: Automatic rating application (e.g., `-rating:explicit`) across Booru sources when safety mode is enabled.

### 🚀 High-Performance Search
- **Multi-Source Fetching**: Seamless integration with **Waifu.im**, **Gelbooru**, **Danbooru**, **Rule34**, **Konachan**, and **Yandere**.
- **CORS Proxy Integration**: Optimized image loading bypass for sources with strict hotlinking protections like Danbooru.
- **Advanced Filtering**: Categorize by tags, content types (Images, GIFs, Videos), and specific API sources.

## 🛠️ Technology Stack

- **Framework**: [React](https://reactjs.org/) (TypeScript)
- **Bundler**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: Context API (Auth, Theme, NSFW)
- **Icons**: [Heroicons](https://heroicons.com/) / Custom SVG
- **Animations**: CSS Keyframes + Framer-inspired React transitions

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+)
- **npm** or **yarn**

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/raphawestim/Waifu_valt_Project.git
   cd Waifu_valt_Project
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env.local` file (optional for basic use, but recommended for API keys).

4. **Run Development Server:**
   ```bash
   npm run dev
   ```

## 📸 Screenshots

> [!TIP]
> This project features a fully responsive design. Try it on desktop for the full "Vault Explorer" experience!

| Home Page (Dark) | Explorer View (Light) | NSFW Gate |
| :---: | :---: | :---: |
| ✨ *Elegant Search* | 🖼️ *Dynamic Grid* | 🚨 *Safety First* |

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests to enhance the vault.

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">
  <sub>Built with ❤️ by the Waifu Vault Team</sub>
</div>
