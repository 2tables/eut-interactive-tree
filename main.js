async function getInfo(){
    res = await fetch("./data/baseplates.json");
    data = await res.json();
    baseplates = data;
    res = await fetch("./data/nodes.json");
    data = await res.json();
    nodes = data;
    return {baseplates: baseplates["baseplates"], nodes: nodes["nodes"]};
}
async function bridge(){
    info = await getInfo();
    for(const baseplate of info.baseplates){
        await loadImage(baseplate.image);
    }
    render();
}

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let view = {x: 0, y: 0, zoom: 1};
let isDragging = false;

images = {};
function loadImage(url){
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
function renderNode(node){
    ctx.fillStyle = info.baseplates[node.baseplate].color;
    ctx.fillRect(node.x + view.x, node.y + view.y, 10, 10);
}

function render(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(images[info.baseplates[0].image], view.x, view.y);
    renderNode(info.nodes[0]);
    requestAnimationFrame(render);
}

bridge();

canvas.addEventListener("mousedown", function(e){
    isDragging = true;
    canvas.style.cursor = "grabbing";
});

window.addEventListener("mousemove", function(e){
    if (!isDragging) return;

    const dx = e.movementX;
    const dy = e.movementY;
    view.x -= dx;
    view.y -= dy;
});

function stopDragging(){
    isDragging = false;
    canvas.style.cursor = "grab";
}

window.addEventListener("mouseup", stopDragging);
canvas.addEventListener("mouseleave", stopDragging);

document.body.addEventListener("wheel", function(e){
    view.x += e.deltaX;
    view.y += e.deltaY;
});

canvas.style.cursor = "grab";


window.addEventListener("resize", function(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});