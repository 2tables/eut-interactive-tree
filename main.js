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

view = {x: 0, y: 0, zoom: 1}

function render(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "#000000"
    ctx.fillRect(-x, -y, 100, 100);
    requestAnimationFrame(render);
}
render();

document.body.addEventListener("wheel", function(e){
    view.x += e.deltaX;
    view.y += e.deltaY;
})
