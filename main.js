async function getInfo(){
    res = await fetch("./data/baseplates.json");
    data = await res.json();
    baseplates = data;
    res = await fetch("./data/nodes.json");
    data = await res.json();
    nodes = data;
    return {baseplates: baseplates, nodes: nodes};
}
async function bridge(){
    info = await getInfo();
    render();
}

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let view = {x: 0, y: 0, zoom: 1};
let isDragging = false;

function render(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "#000000";
    ctx.fillRect(-view.x, -view.y, 100, 100);
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
