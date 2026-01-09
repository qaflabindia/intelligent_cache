# Intelligent Cache <img src="icons/icon48.png" align="center" width="32" height="32">

![Version](https://img.shields.io/badge/version-1.0-blue)
![License: CC BY 4.0](https://img.shields.io/badge/License-CC_BY_4.0-lightgrey.svg)
![Status](https://img.shields.io/badge/status-active-success)

**Intelligent Cache** is a powerful Chrome extension that helps developers and QA engineers visualize whether web resources (images, videos, SVGs, and backgrounds) are being loaded from the **Live Network** or from the **Local Cache**.

## ✨ Features

- **Visual Indicators**: Adds non-intrusive dots to elements to show their loading status.
  - 🟢 **Green Dot**: Resource loaded from **Live / Network**.
  - 🔵 **Blue Dot**: Resource loaded from **Local / Cache**.
- **Broad Support**: Works on:
  - `<img>` tags (including `srcset` and `picture` elements)
  - `<video>` tags
  - `<svg>` elements
  - Elements with `background-image`
- **Smart Positioning**: intelligently places indicators to avoid breaking layouts, even on complex sites like LinkedIn or Apple.com.
- **Real-time Updates**: Automatically detects and processes new content loaded via AJAX/SPA navigation.

## 🚀 Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/qaflabindia/intelligent_cache.git
    ```
2.  **Open Chrome Extensions**:
    - Navigate to `chrome://extensions/` in your browser.
    - Enable **Developer mode** in the top right corner.
3.  **Load Unpacked**:
    - Click **Load unpacked**.
    - Select the directory where you cloned this repository.
4.  **Pin the Extension**:
    - Click the jigsaw puzzle icon in the Chrome toolbar.
    - Pin **Intelligent Cache** for easy access.

## 🛠️ Usage

Simply browse the web as usual!
- When you visit a page (e.g., Apple, LinkedIn, or any media-heavy site), look for the small colored dots on images and videos.
- **Green** means it was just fetched from the server.
- **Blue** means it was served from your browser's cache.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the [Creative Commons Attribution 4.0 International License (CC BY 4.0)](http://creativecommons.org/licenses/by/4.0/).
