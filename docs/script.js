const canvas = document.getElementById("canvas");
const fps = document.getElementById("fps");

[canvas.width, canvas.height] = [innerWidth, innerHeight];

const shader = new ShaderStack(canvas);
shader.add("../shaders/shader.frag");
shader.add("../shaders/edges.frag");
shader.add("../shaders/gamma.frag");

const draw = function() {
    let time = shader.run();
    fps.innerText = `${Math.round(1000 / time)}fps`;

    // requestAnimationFrame(draw);
};

shader.ready()
    .then(() => requestAnimationFrame(draw))