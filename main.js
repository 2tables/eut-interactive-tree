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

function renderNode(node) {
    const pos = calculatePosition(node);
    const baseplate = info.baseplates.find((plate) => plate.name === node.baseplate) || info.baseplates[0];
    const color = baseplate ? baseplate.color : "#ffffff";

    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.fillStyle = color;
    ctx.strokeRect(pos.x, pos.y, 200 * view.zoom, 100 * view.zoom);
    ctx.fillRect(pos.x, pos.y, 200 * view.zoom, 100 * view.zoom);
    ctx.fillStyle = darkenColor(color, 50);
    ctx.fillRect(pos.x + (5 * view.zoom), pos.y + (25 * view.zoom), 190 * view.zoom, 50 * view.zoom);
    ctx.fillStyle = "white";
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.lineWidth = 3;
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
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeText(node.desc, pos.x + (100 * view.zoom), pos.y + (50 * view.zoom));
    ctx.fillText(node.desc, pos.x + (100 * view.zoom), pos.y + (50 * view.zoom));
}

function render() {
    ctx.font = "12px SourceSansPro";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    const backgroundPlate = info.baseplates[0];
    if (backgroundPlate && backgroundPlate.image && images[backgroundPlate.image]) {
        ctx.drawImage(images[backgroundPlate.image], view.x, view.y);
    }

    if (debug) {
        renderDebug();
    } else if (debugInfoElement) {
        debugInfoElement.style.display = "none";
    }

    for (let i = 0; i < info.nodes.length; i++) {
        renderNode(info.nodes[i]);
    }

    frameRequest = requestAnimationFrame(render);
}

function renderDebug() {
    const debugText = `View: (${view.x.toFixed(2)}, ${view.y.toFixed(2)}) Zoom: ${view.zoom.toFixed(2)}\nCurrent Key: ${currentKey}`;

    ctx.font = "12px SourceSansPro";
    ctx.fillStyle = "white";
    ctx.fillRect(5, 5, 300, 80);
    ctx.fillStyle = "black";
    ctx.fillText(`View: (${view.x.toFixed(2)}, ${view.y.toFixed(2)}) Zoom: ${view.zoom.toFixed(2)}`, 10, 20);
    ctx.fillText(`Current Key: ${currentKey}`, 10, 60);

    if (debugInfoElement) {
        debugInfoElement.textContent = debugText;
        debugInfoElement.style.display = "block";
    }
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
    view.x += dx * view.zoom;
    view.y += dy * view.zoom;
});

function stopDragging() {
    isDragging = false;
    canvas.style.cursor = "grab";
}

window.addEventListener("mouseup", stopDragging);
canvas.addEventListener("mouseleave", stopDragging);

document.body.addEventListener("wheel", function (e) {
    if(isCtrl){
        view.zoom += e.deltaY;
    }    

    view.x += e.deltaX * view.zoom;
    view.y += e.deltaY * view.zoom;
});

canvas.style.cursor = "grab";

window.addEventListener("resize", function () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

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

document.body.addEventListener("keydown", function (e) {
    if (e.key === "Control") {
        isCtrl = true;
    }
    currentKey = e.key;
});

document.body.addEventListener("keyup", function (e) {
    if (e.key === "Control") {
        isCtrl = false;
    }
});

function calculatePosition(node) {
    const pos = node.pos || { x: node.x || 0, y: node.y || 0 };
    return {
        x: pos.x + view.x * view.zoom,
        y: pos.y + view.y * view.zoom
    };
}