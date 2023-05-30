var vertexShaderText = 
[
'precision mediump float;',
'',
'attribute vec3 vertPosition;',
'attribute vec3 vertColor;',
'varying vec3 fragColor;',
'uniform mat4 mWorld;',
'uniform mat4 mView;',
'uniform mat4 mProj;',
'',
'void main()',
'{',
'  fragColor = vertColor;',
'  gl_Position = mProj * mView * mWorld * vec4(vertPosition, 1.0);',
'}'
].join('\n');

var fragmentShaderText =
[
'precision mediump float;',
'',
'varying vec3 fragColor;',
'void main()',
'{',
'  gl_FragColor = vec4(fragColor, 1.0);',
'}'
].join('\n');


function addVectors(a, b) {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}


var InitDemo = function () {
	console.log('This is working');

    var velocity = [0, 0, 0]; // The cube's velocity
    var gravity = [0, 0.002, 0]; // The gravity vector
    var bounceLoss = 0.7; // The amount of energy lost each bounce
    var cubeYPosition = 1; // The cube's y position
    
	var canvas = document.getElementById('game-surface');
	var gl = canvas.getContext('webgl');

	if (!gl) {
		console.log('WebGL not supported, falling back on experimental-webgl');
		gl = canvas.getContext('experimental-webgl');
	}

	if (!gl) {
		alert('Your browser does not support WebGL');
	}

	gl.clearColor(0.75, 0.85, 0.8, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);
	gl.frontFace(gl.CCW);
	gl.cullFace(gl.BACK);

	//
	// Create shaders for the cube
	// 
	var cubeVertexShader = gl.createShader(gl.VERTEX_SHADER);
	var cubeFragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

	gl.shaderSource(cubeVertexShader, vertexShaderText);
	gl.shaderSource(cubeFragmentShader, fragmentShaderText);

	gl.compileShader(cubeVertexShader);
	if (!gl.getShaderParameter(cubeVertexShader, gl.COMPILE_STATUS)) {
		console.error('ERROR compiling vertex shader!', gl.getShaderInfoLog(cubeVertexShader));
		return;
	}

	gl.compileShader(cubeFragmentShader);
	if (!gl.getShaderParameter(cubeFragmentShader, gl.COMPILE_STATUS)) {
		console.error('ERROR compiling fragment shader!', gl.getShaderInfoLog(cubeFragmentShader));
		return;
	}

	var program = gl.createProgram();
	gl.attachShader(program, cubeVertexShader);
	gl.attachShader(program, cubeFragmentShader);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.error('ERROR linking program!', gl.getProgramInfoLog(program));
		return;
	}
	gl.validateProgram(program);
	if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
		console.error('ERROR validating program!', gl.getProgramInfoLog(program));
		return;
	}

    // Create shaders for the floor
    var groundVertexShader = gl.createShader(gl.VERTEX_SHADER);
    var groundFragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(groundVertexShader, vertexShaderText);
    gl.shaderSource(groundFragmentShader, fragmentShaderText);

    gl.compileShader(groundVertexShader);
    if (!gl.getShaderParameter(groundVertexShader, gl.COMPILE_STATUS)) {
        console.error('ERROR compiling vertex shader!', gl.getShaderInfoLog(groundVertexShader));
        return;
    }

    gl.compileShader(groundFragmentShader);
    if (!gl.getShaderParameter(groundFragmentShader, gl.COMPILE_STATUS)) {
        console.error('ERROR compiling fragment shader!', gl.getShaderInfoLog(groundFragmentShader));
        return;
    }

    var groundProgram = gl.createProgram();
    gl.attachShader(groundProgram, groundVertexShader);
    gl.attachShader(groundProgram, groundFragmentShader);
    gl.linkProgram(groundProgram);
    if (!gl.getProgramParameter(groundProgram, gl.LINK_STATUS)) {
        console.error('ERROR linking program!', gl.getProgramInfoLog(groundProgram));
        return;
    }
    gl.validateProgram(groundProgram);
    if (!gl.getProgramParameter(groundProgram, gl.VALIDATE_STATUS)) {
        console.error('ERROR validating program!', gl.getProgramInfoLog(groundProgram));
        return;
    }


	//
	// Create buffer
	//
	var cubeVertices = 
	[ // X, Y, Z           R, G, B
		// Top
		-1.0, 1.0, -1.0,   0.5, 0.5, 0.5,
		-1.0, 1.0, 1.0,    0.5, 0.5, 0.5,
		1.0, 1.0, 1.0,     0.5, 0.5, 0.5,
		1.0, 1.0, -1.0,    0.5, 0.5, 0.5,

		// Left
		-1.0, 1.0, 1.0,    0.75, 0.25, 0.5,
		-1.0, -1.0, 1.0,   0.75, 0.25, 0.5,
		-1.0, -1.0, -1.0,  0.75, 0.25, 0.5,
		-1.0, 1.0, -1.0,   0.75, 0.25, 0.5,

		// Right
		1.0, 1.0, 1.0,    0.25, 0.25, 0.75,
		1.0, -1.0, 1.0,   0.25, 0.25, 0.75,
		1.0, -1.0, -1.0,  0.25, 0.25, 0.75,
		1.0, 1.0, -1.0,   0.25, 0.25, 0.75,

		// Front
		1.0, 1.0, 1.0,    1.0, 0.0, 0.15,
		1.0, -1.0, 1.0,    1.0, 0.0, 0.15,
		-1.0, -1.0, 1.0,    1.0, 0.0, 0.15,
		-1.0, 1.0, 1.0,    1.0, 0.0, 0.15,

		// Back
		1.0, 1.0, -1.0,    0.0, 1.0, 0.15,
		1.0, -1.0, -1.0,    0.0, 1.0, 0.15,
		-1.0, -1.0, -1.0,    0.0, 1.0, 0.15,
		-1.0, 1.0, -1.0,    0.0, 1.0, 0.15,

		// Bottom
		-1.0, -1.0, -1.0,   0.5, 0.5, 1.0,
		-1.0, -1.0, 1.0,    0.5, 0.5, 1.0,
		1.0, -1.0, 1.0,     0.5, 0.5, 1.0,
		1.0, -1.0, -1.0,    0.5, 0.5, 1.0,
	];

	var cubeIndices =
	[
		// Top
		0, 1, 2,
		0, 2, 3,

		// Left
		5, 4, 6,
		6, 4, 7,

		// Right
		8, 9, 10,
		8, 10, 11,

		// Front
		13, 12, 14,
		15, 14, 12,

		// Back
		16, 17, 18,
		16, 18, 19,

		// Bottom
		21, 20, 22,
		22, 20, 23
	];

    // ground plain/surface vertices
    var groundVertices =
    [ // X, Y, Z           R, G, B
        // Top
        -1.0, -1.0, -1.0,   0.5, 0.5, 0.5,
        -1.0, -1.0, 1.0,    0.5, 0.5, 0.5,
        1.0, -1.0, 1.0,     0.5, 0.5, 0.5,
        1.0, -1.0, -1.0,    0.5, 0.5, 0.5,
    ];


    // ground plain/surface indices
    var groundIndices =
    [
        // Top
        0, 1, 2,
        0, 2, 3,
    ];
    
	var cubeVertexBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBufferObject);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeVertices), gl.STATIC_DRAW);

	var cubeIndexBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBufferObject);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndices), gl.STATIC_DRAW);

    var groundVertexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, groundVertexBufferObject);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(groundVertices), gl.STATIC_DRAW);

    var groundIndexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, groundIndexBufferObject);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(groundIndices), gl.STATIC_DRAW);

    //  Create texture for the cube
	var cubePositionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
	var cubeColorAttribLocation = gl.getAttribLocation(program, 'vertColor');
	gl.vertexAttribPointer(
		cubePositionAttribLocation, // Attribute location
		3, // Number of elements per attribute
		gl.FLOAT, // Type of elements
		gl.FALSE,
		6 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
		0 // Offset from the beginning of a single vertex to this attribute
	);
	gl.vertexAttribPointer(
		cubeColorAttribLocation, // Attribute location
		3, // Number of elements per attribute
		gl.FLOAT, // Type of elements
		gl.FALSE,
		6 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
		3 * Float32Array.BYTES_PER_ELEMENT // Offset from the beginning of a single vertex to this attribute
	);

	gl.enableVertexAttribArray(cubePositionAttribLocation);
	gl.enableVertexAttribArray(cubeColorAttribLocation);


    //  Create texture for the ground
    var groundPositionAttribLocation = gl.getAttribLocation(groundProgram, 'vertPosition');
    var groundColorAttribLocation = gl.getAttribLocation(groundProgram, 'vertColor');

    gl.vertexAttribPointer(
        groundPositionAttribLocation,
        3,
        gl.FLOAT,
        gl.FALSE,
        6 * Float32Array.BYTES_PER_ELEMENT,
        0
    );
    gl.vertexAttribPointer(
        groundColorAttribLocation,
        3,
        gl.FLOAT,
        gl.FALSE,
        6 * Float32Array.BYTES_PER_ELEMENT,
        3 * Float32Array.BYTES_PER_ELEMENT
    );
    gl.enableVertexAttribArray(groundPositionAttribLocation);
    gl.enableVertexAttribArray(groundColorAttribLocation);


	// Tell OpenGL state machine which program should be active.
	gl.useProgram(program);

	var matWorldUniformLocation = gl.getUniformLocation(program, 'mWorld');
	var matViewUniformLocation = gl.getUniformLocation(program, 'mView');
	var matProjUniformLocation = gl.getUniformLocation(program, 'mProj');

	var cubeWorldMatrix = new Float32Array(16);
    var groundWorldMatrix = new Float32Array(16);
	var viewMatrix = new Float32Array(16);
	var projMatrix = new Float32Array(16);
	mat4.identity(cubeWorldMatrix);
    mat4.identity(groundWorldMatrix);
	mat4.lookAt(viewMatrix, [0, 0, -8], [0, 0, 0], [0, 1, 0]);
	mat4.perspective(projMatrix, glMatrix.toRadian(45), canvas.clientWidth / canvas.clientHeight, 0.1, 1000.0);

	gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, cubeWorldMatrix);
    gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, groundWorldMatrix);
	gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
	gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);

	var xRotationMatrix = new Float32Array(16);
	var yRotationMatrix = new Float32Array(16);

	//
	// Main render loop
	//
	var identityMatrix = new Float32Array(16);
	mat4.identity(identityMatrix);
	var angle = 0;
    var loop = function () {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
        velocity = addVectors(velocity, gravity);
        cubeYPosition += velocity[1];
    
        // If the cube hits the "floor"...
        if (cubeYPosition < -1) { // The cube's bottom is at Y = -1
            cubeYPosition = -1; // Move the cube back to the floor
            velocity[1] *= -bounceLoss; // Reflect and dampen the velocity
        }
    
        angle = performance.now() / 1000 / 6 * 2 * Math.PI;
        mat4.rotate(yRotationMatrix, identityMatrix, angle, [0, 1, 0]);
        mat4.rotate(xRotationMatrix, identityMatrix, angle / 4, [1, 0, 0]);
        mat4.mul(cubeWorldMatrix, yRotationMatrix, xRotationMatrix);
    
        // Position the cube above the ground
        mat4.translate(cubeWorldMatrix, cubeWorldMatrix, [0, cubeYPosition, 0]);
    
        // Render cube
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBufferObject);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBufferObject);
        gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, cubeWorldMatrix);
        gl.drawElements(gl.TRIANGLES, cubeIndices.length, gl.UNSIGNED_SHORT, 0);
    
        // Render ground
        gl.useProgram(groundProgram);
        gl.bindBuffer(gl.ARRAY_BUFFER, groundVertexBufferObject);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, groundIndexBufferObject);
        gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, groundWorldMatrix);
        gl.drawElements(gl.TRIANGLES, groundIndices.length, gl.UNSIGNED_SHORT, 0);
    
        requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    
    
};