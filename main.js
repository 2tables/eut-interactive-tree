/*
hello programmer, feel free to contribute
enabling debug mode is helpful
*/
let debug = false;
/*
don't forget to turn it off before your pull request

note: it is recommended to use a local server since chromium doesn't like fetching local files
my main recommendation is to use python's default http.server module

IN CMD:
python3 -m http.server 8000

IN BROWSER:
https://localhost:8000
*/
async function getInfo() {
    const baseplatesResponse = await fetch("./data/baseplates.json");
    const baseplatesData = await baseplatesResponse.json();
    const nodesResponse = await fetch("./data/nodes.json");
    const nodesData = await nodesResponse.json();

    return {
        baseplates: baseplatesData.baseplates || [],
        nodes: nodesData.nodes || []
    };
}
let currentKey = null;
async function bridge() {
    try {
        info = await getInfo();
    } catch (error) {
        console.warn("Unable to load tree data, continuing with an empty fallback.", error);
        info = { baseplates: [], nodes: [] };
    }

    for (const baseplate of info.baseplates) {
        try {
            await loadImage(baseplate.image);
        } catch (error) {
            console.warn(`Unable to load image: ${baseplate.image}`, error);
        }
    }
}

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const debugInfoElement = document.getElementById("debug-info");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let isCtrl = false;
let view = { x: 0, y: 0, zoom: 1 };
let isDragging = false;
let info = { baseplates: [], nodes: [] };
const images = {};
let frameRequest = null;

function loadImage(url) {
    return new Promise((resolve, reject) => {
        if (images[url]) {
            resolve(images[url]);
            return;
        }
        const img = new Image();
        img.onload = () => {
            images[url] = img;
            resolve(img);
        };
        img.onerror = reject;
        img.src = url;
    });
}

function parseRichText(text) {
    const lines = text.split("\n");
    const tagRegex = /<(\/?)(b|i)>/gi;
    const parsedLines = [];

    for (const line of lines) {
        const segments = [];
        let lastIndex = 0;
        let bold = false;
        let italic = false;
        let match;

        while ((match = tagRegex.exec(line)) !== null) {
            if (match.index > lastIndex) {
                segments.push({ text: line.slice(lastIndex, match.index), bold, italic });
            }

            const [, closing, tag] = match;
            if (closing) {
                if (tag === "b") {
                    bold = false;
                } else if (tag === "i") {
                    italic = false;
                }
            } else if (tag === "b") {
                bold = true;
            } else if (tag === "i") {
                italic = true;
            }

            lastIndex = tagRegex.lastIndex;
        }

        if (lastIndex < line.length) {
            segments.push({ text: line.slice(lastIndex), bold, italic });
        }

        parsedLines.push(segments);
    }

    return parsedLines;
}

function drawRichText(text, x, y, options = {}) {
    const lines = parseRichText(text);
    if (lines.length === 0) {
        return;
    }

    const {
        align = "left",
        baseline = "top",
        stroke = false,
        strokeStyle = "black",
        lineWidth = 3,
        fillStyle = "white",
        lineHeight = 1.2
    } = options;

    const originalFont = ctx.font;
    const originalFillStyle = ctx.fillStyle;
    const originalStrokeStyle = ctx.strokeStyle;
    const originalLineWidth = ctx.lineWidth;
    const originalTextAlign = ctx.textAlign;
    const originalTextBaseline = ctx.textBaseline;

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    const lineSize = parseFloat(originalFont) * lineHeight;
    let offsetY = 0;
    let startY = y;

    if (baseline === "top") {
        startY = y + lineSize / 2;
    } else if (baseline === "bottom") {
        startY = y - (lines.length - 1) * lineSize - lineSize / 2;
    } else if (baseline === "middle") {
        startY = y - ((lines.length - 1) * lineSize) / 2;
    }

    for (const line of lines) {
        let lineWidthTotal = 0;
        for (const segment of line) {
            ctx.font = `${segment.bold ? "bold " : ""}${segment.italic ? "italic " : ""}${originalFont}`.trim();
            lineWidthTotal += ctx.measureText(segment.text).width;
        }

        let drawX = x;
        if (align === "center") {
            drawX = x - lineWidthTotal / 2;
        } else if (align === "right") {
            drawX = x - lineWidthTotal;
        }

        let cursorX = drawX;
        for (const segment of line) {
            ctx.font = `${segment.bold ? "bold " : ""}${segment.italic ? "italic " : ""}${originalFont}`.trim();
            ctx.fillStyle = fillStyle;

            if (stroke) {
                ctx.strokeStyle = strokeStyle;
                ctx.lineWidth = lineWidth;
                ctx.strokeText(segment.text, cursorX, startY + offsetY);
            }

            ctx.fillText(segment.text, cursorX, startY + offsetY);
            cursorX += ctx.measureText(segment.text).width;
        }

        offsetY += lineSize;
    }

    ctx.font = originalFont;
    ctx.fillStyle = originalFillStyle;
    ctx.strokeStyle = originalStrokeStyle;
    ctx.lineWidth = originalLineWidth;
    ctx.textAlign = originalTextAlign;
    ctx.textBaseline = originalTextBaseline;
}

function renderNode(node) {
    const pos = calculatePosition(node);
    const baseplate = info.baseplates.find((plate) => plate.name === node.baseplate) || info.baseplates[0];
    const color = baseplate ? baseplate.color : "#ffffff";

    ctx.strokeStyle = "black";
    ctx.lineWidth = 2 * view.zoom;
    ctx.fillStyle = color;
    ctx.strokeRect(pos.x, pos.y, 200 * view.zoom, 100 * view.zoom);
    ctx.fillRect(pos.x, pos.y, 200 * view.zoom, 100 * view.zoom);
    ctx.fillStyle = darkenColor(color, 50);
    ctx.fillRect(pos.x + (5 * view.zoom), pos.y + (25 * view.zoom), 190 * view.zoom, 50 * view.zoom);
    ctx.fillStyle = "white";
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.lineWidth = 3 * view.zoom;
    ctx.strokeText(`#${node.id} (${node.maxlevel})`, pos.x + (5 * view.zoom), pos.y + (5 * view.zoom));
    ctx.fillText(`#${node.id} (${node.maxlevel})`, pos.x + (5 * view.zoom), pos.y + (5 * view.zoom));
    ctx.textBaseline = "bottom";
    ctx.strokeText(node.effect, pos.x + (5 * view.zoom), pos.y + (95 * view.zoom));
    ctx.fillText(node.effect, pos.x + (5 * view.zoom), pos.y + (95 * view.zoom));
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.strokeText(node.name, pos.x + (195 * view.zoom), pos.y + (5 * view.zoom));
    ctx.fillText(node.name, pos.x + (195 * view.zoom), pos.y + (5 * view.zoom));
    ctx.textBaseline = "bottom";
    ctx.strokeText("Maxed!", pos.x + (195 * view.zoom), pos.y + (95 * view.zoom));
    ctx.fillText("Maxed!", pos.x + (195 * view.zoom), pos.y + (95 * view.zoom));
    drawRichText(node.desc, pos.x + (100 * view.zoom), pos.y + (50 * view.zoom), {
        align: "center",
        baseline: "middle",
        stroke: true,
        strokeStyle: "black",
        lineWidth: 3 * view.zoom,
        fillStyle: "white"
    });
}

function render() {
    ctx.font = `${12 * view.zoom}px SourceSansPro`;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    const backgroundPlate = info.baseplates[0];
    if (backgroundPlate && backgroundPlate.image && images[backgroundPlate.image]) {
        ctx.drawImage(images[backgroundPlate.image], view.x, view.y, 2048 * view.zoom, 2048 * view.zoom);
    }

    if (debug) {
        renderDebug();
    } else if (debugInfoElement) {
        debugInfoElement.style.display = "none";
    }

    for (let i = 0; i < info.nodes.length; i++) {
        const node = info.nodes[i];
        for (let j = 0; j < (node.children || []).length; j++) {
            const childId = node.children[j];
            const child = info.nodes.find(n => n.id == childId);
            if (child) {
                const parentPos = calculatePosition(node);
                const childPos = calculatePosition(child);
                ctx.strokeStyle = "black";
                ctx.lineWidth = 10 * view.zoom;
                ctx.beginPath();
                ctx.moveTo(parentPos.x + (100 * view.zoom), parentPos.y + (50 * view.zoom));
                ctx.lineTo(childPos.x + (100 * view.zoom), childPos.y + (50 * view.zoom));
                ctx.stroke();
            }
        }
        for (let j = 0; j < (node.parents || []).length; j++) {
            const parentId = node.parents[j];
            const parent = info.nodes.find(n => n.id == parentId);
            if (parent) {
                const parentPos = calculatePosition(parent);
                const childPos = calculatePosition(node);
                ctx.strokeStyle = "black";
                ctx.lineWidth = 10 * view.zoom;
                ctx.beginPath();
                ctx.moveTo(parentPos.x + (100 * view.zoom), parentPos.y + (50 * view.zoom));
                ctx.lineTo(childPos.x + (100 * view.zoom), childPos.y + (50 * view.zoom));
                ctx.stroke();
            }
        }
    }
    for (let i = 0; i < info.nodes.length; i++) {
        renderNode(info.nodes[i]);
    }

    frameRequest = requestAnimationFrame(render);
}

function renderDebug() {
    const debugText = `View: (${view.x.toFixed(2)}, ${view.y.toFixed(2)}) Zoom: ${view.zoom.toFixed(2)}\nCurrent Key: ${currentKey}`;
    if (debugInfoElement) {
        debugInfoElement.textContent = debugText;
        debugInfoElement.style.display = "block";
        return undefined;
    }
    ctx.font = `${12 * view.zoom}px SourceSansPro`;
    ctx.fillStyle = "black";
    ctx.fillText(`View: (${view.x.toFixed(2)}, ${view.y.toFixed(2)}) Zoom: ${view.zoom.toFixed(2)}`, 10, 20);
    ctx.fillText(`Current Key: ${currentKey}`, 10, 60);

    
}

function startRenderLoop() {
    if (frameRequest !== null) {
        return;
    }
    frameRequest = requestAnimationFrame(render);
}

startRenderLoop();
bridge();

canvas.addEventListener("mousedown", function () {
    isDragging = true;
    canvas.style.cursor = "grabbing";
});

window.addEventListener("mousemove", function (e) {
    if (!isDragging) return;

    const dx = e.movementX;
    const dy = e.movementY;
    view.x += dx;
    view.y += dy;
});

function stopDragging() {
    isDragging = false;
    canvas.style.cursor = "grab";
}

window.addEventListener("mouseup", stopDragging);
canvas.addEventListener("mouseleave", stopDragging);

//function zoom()
document.body.addEventListener("wheel", function (e) {
    e.preventDefault();
    if (isCtrl) {
        const zoomDelta = Math.sign(e.deltaY) * -0.1;
        zoomAtCenter(zoomDelta);
        return undefined;
    }

    view.x += e.deltaX;
    view.y += e.deltaY;
}, { passive: false });

canvas.style.cursor = "grab";

window.addEventListener("resize", function () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

function zoomAtCenter(delta) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const worldX = (centerX - view.x) / view.zoom;
    const worldY = (centerY - view.y) / view.zoom;

    view.zoom = Math.max(0.2, Math.min(5, view.zoom + delta));
    view.x = centerX - worldX * view.zoom;
    view.y = centerY - worldY * view.zoom;
}

function darkenColor(hex, amount) {
    hex = hex.replace("#", "");
    let num = parseInt(hex, 16);
    let r = (num >> 16) - amount;
    let g = ((num >> 8) & 0x00FF) - amount;
    let b = (num & 0x0000FF) - amount;

    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function isModifierKey(e) {
    return [
        "ControlLeft",
        "ControlRight",
        "MetaLeft",
        "MetaRight"
    ].includes(e.code) || e.key === "Control" || e.key === "Meta";
}

document.body.addEventListener("keydown", function (e) {
    if (isModifierKey(e)) {
        isCtrl = true;
    } else if (e.ctrlKey || e.metaKey) {
        isCtrl = true;
    }
    currentKey = e.key;
});

document.body.addEventListener("keyup", function (e) {
    if (isModifierKey(e)) {
        isCtrl = false;
    } else if (!e.ctrlKey && !e.metaKey) {
        isCtrl = false;
    }
    currentKey = null;
});

window.addEventListener("blur", function () {
    isCtrl = false;
    currentKey = null;
});

function calculatePosition(node) {
    const pos = node.pos || { x: node.x || 0, y: node.y || 0 };
    return {
        x: pos.x * view.zoom + view.x,
        y: pos.y * view.zoom + view.y
    };
}