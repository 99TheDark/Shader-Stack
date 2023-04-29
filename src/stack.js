fetch("../shaders/shader.vert")
    .then(file => file.text())
    .then(text => ShaderPass.VERTEX_SHADER = text);

class ShaderStackArgumentException extends Error {
    constructor(str) {
        super(str);
        this.name = "ShaderStackArgumentException";
    }
}

class ShaderPassArgumentException extends Error {
    constructor(str) {
        super(str);
        this.name = "ShaderPassArgumentException";
    }
}

class ShaderPass {
    static VERTEX_SHADER = null;
    static TEXTURE_DATA = new Float32Array([
        -1, -1, 0, 0,
        1, -1, 1, 0,
        -1, 1, 0, 1,
        1, 1, 1, 1
    ]);
    static TEXTURE_INDICES = new Uint16Array([
        0, 1, 2,
        1, 2, 3
    ]);

    constructor(gl, vert, frag) {
        this.canvas = gl.canvas;
        this.gl = gl;

        [this.width, this.height] = [canvas.width, canvas.height];

        this.vertSource = vert;
        this.fragSource = frag;

        this.vert = gl.createShader(gl.VERTEX_SHADER);
        this.frag = gl.createShader(gl.FRAGMENT_SHADER);

        gl.shaderSource(this.vert, vert);
        gl.shaderSource(this.frag, frag);

        gl.compileShader(this.vert);
        gl.compileShader(this.frag);

        if(!gl.getShaderParameter(this.vert, gl.COMPILE_STATUS))
            throw "Error compiling vertex shader.\n\n" + gl.getShaderInfoLog(this.vert);
        if(!gl.getShaderParameter(this.frag, gl.COMPILE_STATUS))
            throw "Error compiling fragment shader.\n\n" + gl.getShaderInfoLog(this.frag);

        const program = this.program = gl.createProgram();

        gl.attachShader(program, this.vert);
        gl.attachShader(program, this.frag);

        gl.linkProgram(program);

        if(!gl.getProgramParameter(program, gl.LINK_STATUS))
            throw "Error linking program.\n\n" + gl.getProgramInfoLog(program);

        gl.validateProgram(program);
        if(!gl.getProgramParameter(program, gl.VALIDATE_STATUS))
            throw "Error validating program.\n\n" + gl.getProgramInfoLog(program);
    }
}

class ShaderStack {
    constructor(canvas) {
        if(arguments.length != 1) throw new ShaderStackArgumentException(`Invalid argument count: One argument expected,  ${arguments.length} given.`);
        if(!(canvas instanceof HTMLCanvasElement)) throw new ShaderStackArgumentException(`'${canvas}' is not a HTMLCanvasElement`);

        this.initialization = performance.now();

        this.canvas = canvas;
        const gl = this.gl = canvas.getContext("webgl2");
        this.fs = Float32Array.BYTES_PER_ELEMENT;

        [this.width, this.height] = [canvas.width, canvas.height]

        this.empty = new Uint8ClampedArray(this.width * this.height * 4);

        this.buffer = gl.createFramebuffer();
        this.texture = gl.createTexture();

        // Bind texture
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.activeTexture(gl.TEXTURE0);

        gl.viewport(0, 0, this.width, this.height);

        this.shaders = [];
        this.waiting = [];
        this.loading = [];

        this.mouseX = 0;
        this.mouseY = 0;

        canvas.addEventListener("mousemove", e => {
            const rect = canvas.getBoundingClientRect();

            [this.mouseX, this.mouseY] = [e.clientX - rect.left, e.clientY - rect.top];
        });
    }
    addRaw(shader) {
        this.shaders.push(new ShaderPass(this.gl, ShaderPass.VERTEX_SHADER, shader));
    }
    async add(source) {
        let idx = this.loading.length;
        this.loading.push(idx);

        const file = await fetch(source);
        const text = await file.text();
        this.addRaw(text);

        this.loading.splice(this.loading.indexOf(idx), 1);

        if(this.loading.length == 0) {
            this.waiting.forEach(resolve => resolve());
            this.waiting.length = 0;
        }
    }
    async ready() {
        let promise = new Promise(resolve => this.waiting.push(resolve));
        await promise;

        return performance.now() - this.initialization;
    }
    run() {
        let start = performance.now();

        const gl = this.gl;
        const fs = this.fs;

        this.shaders.forEach((pass, i) => {
            const program = pass.program;

            gl.useProgram(program);

            // Maybe move this over?
            const tri = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, tri);
            gl.bufferData(gl.ARRAY_BUFFER, ShaderPass.TEXTURE_DATA, gl.STATIC_DRAW);

            const index = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, ShaderPass.TEXTURE_INDICES, gl.STATIC_DRAW);

            const posAttribLocation = gl.getAttribLocation(program, "vertPos");
            const uvAttribLocation = gl.getAttribLocation(program, "vertUV");

            gl.vertexAttribPointer(
                posAttribLocation,
                2,
                gl.FLOAT,
                gl.FALSE,
                4 * fs,
                0
            );
            gl.vertexAttribPointer(
                uvAttribLocation,
                2,
                gl.FLOAT,
                gl.FALSE,
                4 * fs,
                2 * fs
            );

            gl.enableVertexAttribArray(posAttribLocation);
            gl.enableVertexAttribArray(uvAttribLocation);

            const sizeUniformLocation = gl.getUniformLocation(program, "size");
            gl.uniform2i(sizeUniformLocation, this.width, this.height);

            const aspectUniformLocation = gl.getUniformLocation(program, "aspect");
            let invmag = 1 / Math.sqrt(this.width * this.width + this.height * this.height);
            gl.uniform2f(aspectUniformLocation, this.width * invmag, this.height * invmag);

            const timeUniformLocation = gl.getUniformLocation(program, "time");
            gl.uniform1f(timeUniformLocation, (performance.now() - this.initialization) / 1000);

            // gl.bindFramebuffer(gl.FRAMEBUFFER, this.buffer);
            // gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);

            /*let buffer = new Uint8ClampedArray(this.width * this.height * 4);
            gl.readPixels(0, 0, this.width, this.height, gl.RGBA, gl.UNSIGNED_BYTE, buffer);

            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, new ImageData(buffer, this.width, this.height));

            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.activeTexture(gl.TEXTURE0);*/

            if(i == this.shaders.length - 1) {
                gl.bindFramebuffer(gl.FRAMEBUFFER, this.buffer);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
            } 

            gl.clearColor(1, 1, 1, 1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            gl.drawElements(
                gl.TRIANGLES,
                6,
                gl.UNSIGNED_SHORT,
                0
            );
        });

        return performance.now() - start;
    }
}