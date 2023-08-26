export function setupGL(canvas) {
    const gl = canvas.getContext('webgl2');
    if (!gl) {
        alert('Unable to initialize WebGL. Your browser or machine may not support it.');
        return null;
    }
    resizeCanvasToDisplaySize(canvas)

    window.addEventListener('resize', (e) => {
        resizeCanvasToDisplaySize(canvas)
    })

    return gl;
}

function resizeCanvasToDisplaySize(canvas) {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const pixelRatio = window.devicePixelRatio;
    const needResize = canvas.width !== width * pixelRatio || canvas.height !== height * pixelRatio;
    if (needResize) {
        canvas.width = width * pixelRatio;
        canvas.height = height * pixelRatio;
    }
}

export function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source.trim());
    gl.compileShader(shader)
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

export function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }
    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}