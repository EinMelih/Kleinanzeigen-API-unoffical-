const fs = require('fs');
const path = require('path');

function ensureDir(p) {
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function emailToSlug(email) {
    return String(email).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function randomDelay(min = 1000, max = 5000) {
    return new Promise(resolve => setTimeout(resolve, Math.random() * (max - min) + min));
}

async function humanMouseMove(page, targetSelector) {
    const boundingBox = await page.evaluate((sel) => {
        const elem = document.querySelector(sel);
        if (elem) {
            const rect = elem.getBoundingClientRect();
            return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        }
        return null;
    }, targetSelector);

    if (boundingBox) {
        const startX = Math.random() * 500 + 100;
        const startY = Math.random() * 500 + 100;
        await page.mouse.move(startX, startY);
        await page.mouse.move(
            boundingBox.x + (Math.random() * 20 - 10),
            boundingBox.y + (Math.random() * 20 - 10),
            { steps: 20 + Math.floor(Math.random() * 10) }
        );
    }
}

async function humanType(page, selector, text) {
    await page.focus(selector);
    for (const char of text) {
        await page.keyboard.type(char, { delay: Math.random() * 100 + 50 });
        if (Math.random() < 0.1) await randomDelay(200, 500);
    }
}

module.exports = { ensureDir, emailToSlug, randomDelay, humanMouseMove, humanType };
