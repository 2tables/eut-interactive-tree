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

async function bridge() {
    info = await getInfo();
    for (const baseplate of info.baseplates) {
        await loadImage(baseplate.image);
    }
    render();
}

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let view = { x: 0, y: 0, zoom: 1 };
let isDragging = false;
let info = { baseplates: [], nodes: [] };
const images = {};

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
    const pos = node.pos || { x: node.x || 0, y: node.y || 0 };
    const baseplate = info.baseplates.find((plate) => plate.name === node.baseplate) || info.baseplates[0];
    const color = baseplate ? baseplate.color : "#ffffff";

    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.fillStyle = color;
    ctx.strokeRect(pos.x + view.x, pos.y + view.y, 200, 100);
    ctx.fillRect(pos.x + view.x, pos.y + view.y, 200, 100);
    ctx.fillStyle = darkenColor(color, 50);
    ctx.fillRect(pos.x + view.x + 5, pos.y + view.y + 25, 190, 50);
    ctx.fillStyle = "white";
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.lineWidth = 3;
    ctx.strokeText(`#${node.id} (${node.maxlevel})`, pos.x + view.x + 5, pos.y + view.y + 5);
    ctx.fillText(`#${node.id} (${node.maxlevel})`, pos.x + view.x + 5, pos.y + view.y + 5);
    ctx.strokeText(node.name, pos.x + view.x + 195, pos.y + view.y + 5);
    ctx.fillText(node.name, pos.x + view.x + 195, pos.y + view.y + 5);
    ctx.textBaseline = "bottom";
    ctx.strokeText("Maxed!", pos.x + view.x + 195, pos.y + view.y + 95);
    ctx.fillText("Maxed!", pos.x + view.x + 195, pos.y + view.y + 95);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeText(node.desc, pos.x + view.x + 100, pos.y + view.y + 50);
    ctx.fillText(node.desc, pos.x + view.x + 100, pos.y + view.y + 50);
}

function render() {
    ctx.font = "12px SourceSansPro";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(images[info.baseplates[0].image], view.x, view.y);
    for(let i = 0; i < info.nodes.length; i++){
        renderNode(info.nodes[i]);
    }

    requestAnimationFrame(render);
}

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

document.body.addEventListener("wheel", function (e) {
    view.x += e.deltaX;
    view.y += e.deltaY;
});

canvas.style.cursor = "grab";

window.addEventListener("resize", function () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});