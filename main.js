async function getInfo(){
    res = await fetch("./baseplates.json");
    data = await res.json();
    baseplates = data;
    res = await fetch("./nodes.json");
    data = await res.json();
    nodes = data;
    return {baseplates: baseplates, nodes: nodes};
}
async function bridge(){
    info = await getInfo();
}
function render(){
    
}