// Content Script for Intelligent Cache
// Updated: Fixes LinkedIn regression (Infinite loop + Layout breaking) + Maintains Apple support

let cacheMap = {};

// Initialize
chrome.runtime.sendMessage({ type: 'GET_TAB_CACHE_STATUS' }, (response) => {
    cacheMap = response || {};
    scanAndInject();
    startObserver();
});

chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'CACHE_UPDATE') {
        cacheMap[message.url] = message.status;
        scanAndInject();
    }
});

let scanTimeout = null;
const observer = new MutationObserver((mutations) => {
    let shouldScan = false;
    for (const mutation of mutations) {
        // IGNORE mutations to our own elements to prevent infinite loops
        if (mutation.target.classList && mutation.target.classList.contains('ic-dot')) continue;
        if (mutation.target.closest && mutation.target.closest('.ic-dot')) continue;

        if (mutation.type === 'childList' ||
            (mutation.type === 'attributes' && ['src', 'srcset', 'data-lazy', 'class', 'style'].includes(mutation.attributeName))) {
            shouldScan = true;
            break;
        }
    }
    if (shouldScan) {
        // Debounce real scan to avoid thrashing
        if (scanTimeout) clearTimeout(scanTimeout);
        scanTimeout = setTimeout(() => scanAndInject(), 200);
    }
});

function startObserver() {
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['src', 'srcset', 'style', 'data-lazy', 'class', 'data-picture-loaded']
    });
}

function scanAndInject() {
    // 1. Collect potential resource elements
    const candidates = document.querySelectorAll(`
        img, 
        video, 
        svg, 
        [style*="background-image"], 
        .elementor-background-overlay,
        .elementor-section,
        .elementor-column,
        [class*="background"],
        [class*="section"],
        [id*="background"],
        [data-inline-media]
    `);

    candidates.forEach(el => {
        // Optimization: Quick check
        if (!['IMG', 'VIDEO', 'SVG'].includes(el.tagName) && !el.style.backgroundImage) {
            const style = window.getComputedStyle(el);
            if (!style.backgroundImage || style.backgroundImage === 'none' || !style.backgroundImage.startsWith('url')) {
                return;
            }
        }

        const url = getResourceUrl(el);
        if (!url || !cacheMap[url]) return;

        injectDot(el, cacheMap[url]);
    });
}

function injectDot(el, status) {
    // 1. Determine the smart container
    const { container, isTightWrapper } = getSmartContainer(el);
    if (!container) return;

    // 2. Check for existing dot
    let dot = container.querySelector(`:scope > .ic-dot[data-source-tag="${el.tagName}"]`);

    if (!dot) {
        dot = document.createElement('div');
        dot.className = 'ic-dot';
        dot.setAttribute('data-source-tag', el.tagName);
        container.appendChild(dot);
    }

    // 3. Update Status
    const className = `ic-dot ic-dot-${status}`;
    if (dot.className !== className) {
        dot.className = className;
    }

    // 4. Position Logic
    if (isTightWrapper) {
        // Apple style: Container IS the bounding box of the media
        // We can trust 5,5.
        // Ensure container has positioning context if it's a tight wrapper we control/trust.
        // For Apple Picture/Video, forcing relative is usually safe.
        const style = window.getComputedStyle(container);
        if (style.position === 'static') {
            container.style.position = 'relative';
        }
        dot.style.top = '5px';
        dot.style.left = '5px';
    } else {
        // Loose Container (WordPress, LinkedIn, Standard Img)
        // We do NOT change container position to avoid breaking layouts (LinkedIn regression fix).

        const elRect = el.getBoundingClientRect();

        const style = window.getComputedStyle(container);
        if (style.position === 'static') {
            // Container is static. Dot is absolute.
            // Dot positions relative to the nearest positioned ancestor (offsetParent).
            const offsetParent = dot.offsetParent || document.body;
            const offsetRect = offsetParent.getBoundingClientRect();

            // Calculate position relative to the offsetParent
            const goalTop = elRect.top - offsetRect.top + 5;
            const goalLeft = elRect.left - offsetRect.left + 5;

            dot.style.top = `${goalTop}px`;
            dot.style.left = `${goalLeft}px`;
        } else {
            // Container IS positioned.
            const containerRect = container.getBoundingClientRect();
            const top = elRect.top - containerRect.top;
            const left = elRect.left - containerRect.left;
            dot.style.top = `${top + 5}px`;
            dot.style.left = `${left + 5}px`;
        }
    }
}

function getSmartContainer(el) {
    // Returns { container, isTightWrapper }

    // 1. PICTURE: Tight wrapper (Safe to force relative)
    if (el.tagName === 'IMG' && el.parentElement && el.parentElement.tagName === 'PICTURE') {
        return { container: el.parentElement, isTightWrapper: true };
    }

    // 2. Apple Video Wrapper: Tight wrapper
    if (el.tagName === 'VIDEO' && el.parentElement && el.parentElement.hasAttribute('data-inline-media')) {
        return { container: el.parentElement, isTightWrapper: true };
    }

    // 3. Backgrounds (Elementor, etc)
    if (['VIDEO', 'SVG'].includes(el.tagName) || el.style.backgroundImage || el.classList.contains('elementor-background-overlay')) {
        return { container: el, isTightWrapper: true };
    }

    // 4. Standard IMG / VOID elements: Loose wrapper (Parent)
    if (['IMG', 'INPUT', 'BR', 'HR', 'LEAF'].includes(el.tagName)) {
        return { container: el.parentElement, isTightWrapper: false };
    }

    // Default
    return { container: el, isTightWrapper: true };
}

function getResourceUrl(el) {
    if (el.tagName === 'IMG') {
        return el.currentSrc || el.src || el.getAttribute('data-src') || el.getAttribute('data-lazy-src');
    }
    if (el.tagName === 'VIDEO') {
        return el.currentSrc || el.src || (el.querySelector('source') ? el.querySelector('source').src : null);
    }
    if (el.tagName === 'SVG') {
        const use = el.querySelector('use');
        if (use) return use.getAttribute('xlink:href') || use.getAttribute('href');
        return null; // External SVG references
    }
    const style = window.getComputedStyle(el);
    const bg = style.backgroundImage;
    if (bg && bg !== 'none' && bg.indexOf('url') !== -1) {
        const match = bg.match(/url\s*\(\s*['"]?(.*?)['"]?\s*\)/);
        return match ? match[1] : null;
    }
    return null;
}
