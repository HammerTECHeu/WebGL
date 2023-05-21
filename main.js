//A falling square with shadows and a light source that can be moved with the mouse using WebGL without the use of any libraries.

//Create the WebGL context and set up the canvas
const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');
gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black
gl.clear(gl.COLOR_BUFFER_BIT);

//Initialize square's position
let positionSquare1 = [0.0, 1.5];
let positionSquare2 = [0.2, 1.0];
let velocitySquare1 = [0.0, -0.01];  // Falling down
let velocitySquare2 = [0.0, -0.01];  // Falling down
let rotationAngleSquare1 = 0;
let rotationAngleSquare2 = 0;



const verticesSquare1 = [
    0.0, 0.0, 0.0, 
    0.0, 0.5, 0.0,
    0.5, 0.5, 0.0,
    0.5, 0.0, 0.0
];
const indicesSquare1 = [
    0, 1, 2,
    0, 2, 3
];

const verticesSquare2 = [
    0.0, 0.0, 0.1,
    0.0, 0.5, 0.1,
    0.5, 0.5, 0.1,
    0.5, 0.0, 0.1
];
const indicesSquare2 = indicesSquare1;

//Creating a surface
const groundVertices = [
    -1.0, -1.0,  0.0,  // Bottom left corner
    -1.0, -0.8,  0.0,  // Top left corner
     1.0, -0.8,  0.0,  // Top right corner
     1.0, -1.0,  0.0   // Bottom right corner
];

const groundIndices = [
    0, 1, 2,
    0, 2, 3
];








//Creating the shaders
const vertexShaderCode = `
    attribute vec3 coordinates;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;

    void main(void) {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(coordinates, 1.0);
    }`;

const fragmentShaderCode = `
    precision mediump float;
    uniform vec4 uColor;

    void main(void) {
        gl_FragColor = uColor;
    }`;



//Compiling the shaders
const vertexShader = gl.createShader(gl.VERTEX_SHADER); // Create a vertex shader object
gl.shaderSource(vertexShader, vertexShaderCode); // Attach vertex shader source code
gl.compileShader(vertexShader); // Compile the vertex shader

const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER); // Create fragment shader object
gl.shaderSource(fragmentShader, fragmentShaderCode); // Attach fragment shader source code
gl.compileShader(fragmentShader); // Compile the fragment shader


//Creating the shader program
const shaderProgram = gl.createProgram(); // Create a shader program object to store the combined shader program
gl.attachShader(shaderProgram, vertexShader); // Attach a vertex shader
gl.attachShader(shaderProgram, fragmentShader); // Attach a fragment shader
gl.linkProgram(shaderProgram); // Link both the programs
// Check for errors
if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error('Could not initialize shaders');
}
if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(vertexShader));
}
if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(fragmentShader));
}
gl.useProgram(shaderProgram);
const colorLocation = gl.getUniformLocation(shaderProgram, 'uColor');

//Creating the buffer for the first square
const vertexBufferSquare1 = gl.createBuffer(); 
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferSquare1);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesSquare1), gl.STATIC_DRAW);

const indexBufferSquare1 = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBufferSquare1);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indicesSquare1), gl.STATIC_DRAW);

//Creating the buffer for the second square
const vertexBufferSquare2 = gl.createBuffer(); 
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferSquare2);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesSquare2), gl.STATIC_DRAW);

const indexBufferSquare2 = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBufferSquare2);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indicesSquare2), gl.STATIC_DRAW);

//Creating the buffer for the surface
const groundVertexBuffer = gl.createBuffer(); // Create a buffer object
gl.bindBuffer(gl.ARRAY_BUFFER, groundVertexBuffer); // Bind the buffer object to target
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(groundVertices), gl.STATIC_DRAW); // Write data into the buffer object

const groundIndexBuffer = gl.createBuffer(); // Create a buffer object
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, groundIndexBuffer); // Bind the buffer object to target
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(groundIndices), gl.STATIC_DRAW); // Write data into the buffer object


//Assigning the buffer to the shader program
const coordinatesVar = gl.getAttribLocation(shaderProgram, 'coordinates'); // Get the attribute location
gl.vertexAttribPointer(coordinatesVar, 3, gl.FLOAT, false, 0, 0); // Point an attribute to the currently bound VBO and specify its format  
gl.enableVertexAttribArray(coordinatesVar); // Enable the attribute

//Create a depth texture and frame buffer for the shadow map
const depthTextureSize = 1024; // Size of the depth texture
const depthTexture = gl.createTexture(); // Create a texture object
gl.bindTexture(gl.TEXTURE_2D, depthTexture); // Bind the texture object to the target
gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, depthTextureSize, depthTextureSize, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null); // Specify the texture object

const depthFramebuffer = gl.createFramebuffer(); // Create a framebuffer object
gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer); // Bind the framebuffer object to the target
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0); // Attach the texture object to the framebuffer object

//Render the scene from the light's point of view into the shadow map
gl.viewport(0, 0, depthTextureSize, depthTextureSize); // Set the viewport to the size of the depth texture
gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer); // Bind the framebuffer object to the target


//Animate the squares
let startTime = Date.now(); 

function animate() {
    const currentTime = Date.now(); // Time of the current frame
    const deltaTime = currentTime - startTime; // Time since the last frame

    gl.viewport(0, 0, canvas.width, canvas.height); // Set the viewport to the size of the canvas

    gl.clearColor(0.0, 0.0, 0.0, 1.0); // Set the clear color to black
    gl.clearDepth(1.0); // Set the clear depth to 1.0 (all pixels are at maximum distance)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clear the color buffer bit and the depth buffer bit
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); // Bind the framebuffer object to the targetr bit

    gl.enable(gl.DEPTH_TEST); // Enable depth testing

    const modelViewMatrixGround = createMat4(); // Create a model view matrix for the ground



    positionSquare1[0] += velocitySquare1[0];
    positionSquare1[1] += velocitySquare1[1];
    positionSquare2[0] += velocitySquare2[0];
    positionSquare2[1] += velocitySquare2[1];

    const sizeSquare1 = [0.5, 0.5];  // width and height of the first square
    const sizeSquare2 = [0.4, 0.4];  // width and height of the second square

    let dx = positionSquare1[0] - positionSquare2[0];
    let dy = positionSquare1[1] - positionSquare2[1];
    let combinedHalfWidths = sizeSquare1[0] / 2 + sizeSquare2[0] / 2;
    let combinedHalfHeights = sizeSquare1[1] / 2 + sizeSquare2[1] / 2;
    
    if (Math.abs(dx) < combinedHalfWidths && Math.abs(dy) < combinedHalfHeights) {
        // Collision detected. Now we'll "bounce" the squares off each other by reversing their velocities.
        velocitySquare1[0] = -velocitySquare1[0];
        velocitySquare1[1] = -velocitySquare1[1];
        velocitySquare2[0] = -velocitySquare2[0];
        velocitySquare2[1] = -velocitySquare2[1];
    
        // Resolve overlap and rotate squares (simple version: move squares away from each other along the x axis)
        let overlapX = combinedHalfWidths - Math.abs(dx);
        if (dx > 0) {
            positionSquare1[0] += overlapX/2;
            positionSquare2[0] -= overlapX/2;
        } else {
            positionSquare1[0] -= overlapX/2;
            positionSquare2[0] += overlapX/2;
        }
    
        // Add a slight rotation to each square on collision
        rotationAngleSquare1 += 0.1;  // You can adjust the value to change rotation intensity
        rotationAngleSquare2 += 0.1;  // You can adjust the value to change rotation intensity
    }
    
    
    

    if (positionSquare1[0] < -1 || positionSquare1[0] > 1) {
        velocitySquare1[0] = -velocitySquare1[0];
    }
    if (positionSquare1[1] < -1 || positionSquare1[1] > 1) {
        velocitySquare1[1] = -velocitySquare1[1];
    }
    if (positionSquare2[0] < -1 || positionSquare2[0] > 1) {
        velocitySquare2[0] = -velocitySquare2[0];
    }
    if (positionSquare2[1] < -1 || positionSquare2[1] > 1) {
        velocitySquare2[1] = -velocitySquare2[1];
    }
    


    let projectionMatrix = orthoMat4(createMat4(), -1, 1, -1, 1, -1, 1);
    const projectionMatrixVar = gl.getUniformLocation(shaderProgram, 'projectionMatrix');
    const modelViewMatrixVar = gl.getUniformLocation(shaderProgram, 'modelViewMatrix');

    // Translate and rotate the first square to the current position
    let modelViewMatrixSquare1 = createMat4();
    translateMat4(modelViewMatrixSquare1, modelViewMatrixSquare1, positionSquare1);
    rotateZMat4(modelViewMatrixSquare1, modelViewMatrixSquare1, rotationAngleSquare1);

    // First Square Rendering
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferSquare1);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBufferSquare1);
    gl.vertexAttribPointer(coordinatesVar, 3, gl.FLOAT, false, 0, 0);
    gl.uniform4f(colorLocation, 1.0, 0.0, 0.0, 1.0);  // Red color
    gl.uniformMatrix4fv(modelViewMatrixVar, false, new Float32Array(modelViewMatrixSquare1));
    gl.uniformMatrix4fv(projectionMatrixVar, false, new Float32Array(projectionMatrix));
    gl.drawElements(gl.TRIANGLES, indicesSquare1.length, gl.UNSIGNED_SHORT, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    // Translate and rotate the second square to the current position
    let modelViewMatrixSquare2 = createMat4();
    translateMat4(modelViewMatrixSquare2, modelViewMatrixSquare2, positionSquare2);
    rotateZMat4(modelViewMatrixSquare2, modelViewMatrixSquare2, rotationAngleSquare2);

    // Second Square Rendering
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferSquare2);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBufferSquare2);
    gl.vertexAttribPointer(coordinatesVar, 3, gl.FLOAT, false, 0, 0);
    gl.uniform4f(colorLocation, 1.0, 1.0, 0.0, 1.0);  // Yellow color
    gl.uniformMatrix4fv(modelViewMatrixVar, false, new Float32Array(modelViewMatrixSquare2));
    gl.uniformMatrix4fv(projectionMatrixVar, false, new Float32Array(projectionMatrix));
    gl.drawElements(gl.TRIANGLES, indicesSquare2.length, gl.UNSIGNED_SHORT, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    // Ground Rendering
    gl.bindBuffer(gl.ARRAY_BUFFER, groundVertexBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, groundIndexBuffer);
    gl.vertexAttribPointer(coordinatesVar, 3, gl.FLOAT, false, 0, 0);
    gl.uniform4f(colorLocation, 0.0, 0.0, 1.0, 1.0);  // Blue color
    gl.uniformMatrix4fv(modelViewMatrixVar, false, new Float32Array(modelViewMatrixGround));
    gl.uniformMatrix4fv(projectionMatrixVar, false, new Float32Array(projectionMatrix));
    gl.drawElements(gl.TRIANGLES, groundIndices.length, gl.UNSIGNED_SHORT, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    startTime = currentTime;
    requestAnimationFrame(animate);
}

animate();    






