// Multi-page Navigation (same tabs, but each tab is its own HTML file now)
const navLinks = document.querySelectorAll('.nav-links li');
const pathDisplay = document.querySelector('.path');

const SECTION_TO_FILE = {
    about: 'about.html',
    projects: 'projects.html',
    research: 'research.html',
    photos: 'photos.html',
    classes: 'classes.html',
    contact: 'contact.html',
};

const currentSection = document.body.getAttribute('data-section') || 'about';

// Highlight active tab
navLinks.forEach(link => {
    const s = link.getAttribute('data-section');
    if (s === currentSection) link.classList.add('active');
    else link.classList.remove('active');
});

// Update path label (keeps original default feel for About)
if (pathDisplay) {
    pathDisplay.textContent = (currentSection === 'about') ? `~/laksh` : `~/laksh/${currentSection}`;
}

// Clicking a tab navigates to that page
navLinks.forEach(link => {
    link.addEventListener('click', function () {
        const targetSection = this.getAttribute('data-section');
        const href = SECTION_TO_FILE[targetSection] || 'about.html';
        window.location.href = href;
    });
});

// Bubble Generation and Interaction
const bubbleContainer = document.getElementById('bubbleContainer');

// --- Spawn rate control state ---
const bubbleRateSlider = document.getElementById('bubbleRate');
const bubbleRateValue = document.getElementById('bubbleRateValue');

// base timing + caps (matches your current feel, but adjustable)
const BASE_INTERVAL_MS = 2500;     // your current interval
const MIN_INTERVAL_MS  = 100;      // fastest spawn when slider maxed
const MAX_BUBBLES_MIN  = 6;        // minimum cap when slider at 0
const MAX_BUBBLES_MAX  = 22;       // maximum cap when slider at 100

let spawnIntervalId = null;
let spawnIntervalMs = BASE_INTERVAL_MS;
let maxBubbles = 12;               // your current cap

function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

function applySpawnRate(percent) {
    // percent: 0..100
    const p = clamp(percent, 0, 100) / 100;

    // Higher = faster spawns (interval decreases)
    spawnIntervalMs = Math.round(BASE_INTERVAL_MS - p * (BASE_INTERVAL_MS - MIN_INTERVAL_MS));

    // Higher = allow more bubbles
    maxBubbles = Math.round(MAX_BUBBLES_MIN + p * (MAX_BUBBLES_MAX - MAX_BUBBLES_MIN));

    // Update UI text
    if (bubbleRateValue) bubbleRateValue.textContent = `${Math.round(p * 100)}%`;

    // Restart spawner with new timing
    if (spawnIntervalId) clearInterval(spawnIntervalId);
    spawnIntervalId = setInterval(() => {
        if (bubbleContainer.children.length < maxBubbles) {
            createBubble();
        }
    }, spawnIntervalMs);
}

if (bubbleRateSlider) {
    // Initial set from slider value
    applySpawnRate(parseInt(bubbleRateSlider.value, 10));

    bubbleRateSlider.addEventListener('input', (e) => {
        applySpawnRate(parseInt(e.target.value, 10));
    });
}

function createPixelBubble(size) {
    // Create canvas for pixel art
    const canvas = document.createElement('canvas');
    const pixelSize = 4; // Size of each pixel block
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - pixelSize;

    // Consistent blue/indigo variations with transparency (no pink)
    const blueShades = [
        'rgba(99, 102, 241, 0.22)',  // indigo - main
        'rgba(165, 180, 252, 0.35)', // indigo-200 - shine
        'rgba(59, 130, 246, 0.18)',  // blue - edge
        'rgba(224, 231, 255, 0.45)', // indigo-100 - highlight
    ];

    // Draw pixel bubble
    for (let y = 0; y < size; y += pixelSize) {
        for (let x = 0; x < size; x += pixelSize) {
            const dx = x + pixelSize/2 - centerX;
            const dy = y + pixelSize/2 - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= radius) {
                // Create shine effect on top-left
                const shineX = centerX - radius * 0.3;
                const shineY = centerY - radius * 0.3;
                const shineDx = x + pixelSize/2 - shineX;
                const shineDy = y + pixelSize/2 - shineY;
                const shineDistance = Math.sqrt(shineDx * shineDx + shineDy * shineDy);

                let color;
                if (shineDistance < radius * 0.25) {
                    color = blueShades[3]; // brightest for shine
                } else if (shineDistance < radius * 0.4) {
                    color = blueShades[1]; // lighter for shine area
                } else if (distance < radius * 0.7) {
                    color = blueShades[0]; // main indigo
                } else {
                    color = blueShades[2]; // edge
                }

                ctx.fillStyle = color;
                ctx.fillRect(x, y, pixelSize, pixelSize);
            }
        }
    }

    return canvas.toDataURL();
}

function createBubble() {
    const bubble = document.createElement('div');
    bubble.className = 'bubble';

    // Random size between 32px and 96px (multiples of pixel size work best)
    const size = Math.floor((Math.random() * 16 + 8)) * 4;
    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;

    // Create pixel art bubble
    const bubbleImg = createPixelBubble(size);
    bubble.style.backgroundImage = `url(${bubbleImg})`;
    bubble.style.backgroundSize = 'contain';

    // Random horizontal position
    const left = Math.random() * 100;
    bubble.style.left = `${left}%`;

    // Random animation duration
    const duration = (size / 32) * 8 + Math.random() * 4;
    bubble.style.animationDuration = `${duration}s`;

    // Random horizontal drift
    const drift = (Math.random() - 0.5) * 200;
    bubble.style.setProperty('--drift', `${drift}px`);

    // Add to container
    bubbleContainer.appendChild(bubble);

    // Store bubble data for proximity detection
    bubble.dataset.popped = 'false';

    // Remove bubble after animation completes
    setTimeout(() => {
        if (bubble.parentNode) {
            bubble.remove();
        }
    }, duration * 1000);
}

// Track mouse position
let mouseX = -1000;
let mouseY = -1000;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

// Check bubble proximity to cursor
function checkBubbleProximity() {
    const bubbles = bubbleContainer.querySelectorAll('.bubble:not(.popping)');

    bubbles.forEach(bubble => {
        if (bubble.dataset.popped === 'true') return;

        const rect = bubble.getBoundingClientRect();
        const bubbleCenterX = rect.left + rect.width / 2;
        const bubbleCenterY = rect.top + rect.height / 2;

        const dx = mouseX - bubbleCenterX;
        const dy = mouseY - bubbleCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Pop if cursor is within 60px of bubble center
        const popDistance = 60;
        if (distance < popDistance) {
            bubble.dataset.popped = 'true';

            // Freeze bubble position before popping
            bubble.style.left = rect.left + 'px';
            bubble.style.top = rect.top + 'px';
            bubble.style.transform = 'none';

            bubble.classList.add('popping');

            setTimeout(() => {
                bubble.remove();
            }, 350);
        }
    });
}


// Check proximity every frame
function animate() {
    checkBubbleProximity();
    requestAnimationFrame(animate);
}
animate();

// Create initial bubbles
for (let i = 0; i < 8; i++) {
    setTimeout(() => createBubble(), i * 1000);
}

// If slider isn't present for some reason, fall back to old behavior.
if (!bubbleRateSlider) {
    setInterval(() => {
        if (bubbleContainer.children.length < 12) {
            createBubble();
        }
    }, 2500);
}
