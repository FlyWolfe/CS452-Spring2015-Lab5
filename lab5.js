//Mathew Sherry
//4-29-2015
var elt;

var canvas;
var gl;

var program;

var NumVertices  = 36;

var pointsArray = [];
var normalsArray = [];

var framebuffer;

var direction = 0;

var flag = false;

var color = new Uint8Array(4);

//I made the vertices go through each other and create this really cool optical illusion :D
var vertices = [
        vec4( 0.0, 0.0,  0.5, 1.0 ),
        vec4( -0.5,  0.5,  0.5, 1.0 ),
        vec4( 0.5,  0.5,  0.5, 1.0 ),
        vec4( 0.0, -0.5,  0.5, 1.0 ),
        vec4( 1.0, 0.0, -0.5, 1.0 ),
        vec4( -0.5,  0.5, -0.5, 1.0 ),
        vec4( 0.5,  0.5, -0.5, 1.0 ),
        vec4( 0.5, -0.5, -0.5, 1.0 ),
    ];

var lightPosition = vec4(1.0, 1.0, 1.0, 0.0 );
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 0.0, 0.8, 1.0, 1.0);
var materialSpecular = vec4( 0.0, 0.8, 1.0, 1.0 );
var materialShininess = 100.0;

var ctm;
var ambientColor, diffuseColor, specularColor;
var modelView, projection;
var viewerPos;
var program;

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = xAxis;

var theta = [45.0, 45.0, 45.0];

var thetaLoc;

var Index = 0;

var red;
var black;
var light;
var thetaShadow;
var m;
var fcolor;

function quad(a, b, c, d) {

     var t1 = subtract(vertices[b], vertices[a]);
     var t2 = subtract(vertices[c], vertices[b]);
     var normal = cross(t1, t2);
     var normal = vec3(normal);
     normal = normalize(normal);

     pointsArray.push(vertices[a]); 
     normalsArray.push(normal); 
     pointsArray.push(vertices[b]); 
     normalsArray.push(normal); 
     pointsArray.push(vertices[c]); 
     normalsArray.push(normal);   
     pointsArray.push(vertices[a]);  
     normalsArray.push(normal); 
     pointsArray.push(vertices[c]); 
     normalsArray.push(normal); 
     pointsArray.push(vertices[d]); 
     normalsArray.push(normal);    
}


function colorCube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}


window.onload = function init() {
    canvas = document.getElementById( "gl-canvas" );
    
    var ctx = canvas.getContext("experimental-webgl", {preserveDrawingBuffer: true});
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    elt = document.getElementById("test");

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.5, 0.5, 0.5, 1.0 );
    
	gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    
    var texture = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 512, 512, 0, 
       gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.generateMipmap(gl.TEXTURE_2D);

// Allocate a frame buffer object

   framebuffer = gl.createFramebuffer();
   gl.bindFramebuffer( gl.FRAMEBUFFER, framebuffer);


// Attach color buffer
   gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
   
   
   fColor = gl.getUniformLocation(program, "fColor");
   
	red = vec4(1.0, 0.0, 0.0, 1.0);
    black = vec4(0.0, 0.0, 0.0, 1.0);
	light = vec3(0.0, 2.0, 0.0);
   
   // matrix for shadow projection
    m = mat4();
    m[3][3] = 0;
    m[3][1] = -1/light[1];
   
   
gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    colorCube();

    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );
    
    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );
    
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    thetaLoc = gl.getUniformLocation(program, "theta");
    
    viewerPos = vec3(0.0, 0.0, -20.0 );

    projection = ortho(-1, 1, -1, 1, -100, 100);
    
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular); 
    
	
	document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;
    
    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),
       flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),
       flatten(diffuseProduct) );
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), 
       flatten(specularProduct) );	
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), 
       flatten(lightPosition) );
       
    gl.uniform1f(gl.getUniformLocation(program, 
       "shininess"),materialShininess);
    
    gl.uniformMatrix4fv( gl.getUniformLocation(program, "projectionMatrix"),
       false, flatten(projection));
          
    render();
}

function handleKeyDown(event) {
	flag = true;
    if (event.keyCode == 37) //LEFT
	{
		direction = 1; //Negative direction
    	axis = yAxis;  
    } else if (event.keyCode == 38) //UP
	{
		direction = 1;
    	axis = xAxis;  
    } else if (event.keyCode == 39) //RIGHT
	{
		direction = 0; //Positive direction
    	axis = yAxis;  
    } else if (event.keyCode == 40) //DOWN
	{
		direction = 0;
    	axis = xAxis;  
    }			
}

function handleKeyUp(event) {
	flag = false;
}

var render = function(){
    gl.clear( gl.COLOR_BUFFER_BIT );
    if(flag && direction == 0) theta[axis] += 2.0;
	else if (flag && direction == 1) theta[axis] -= 2.0;
    modelView = mat4();
    modelView = mult(modelView, rotate(theta[xAxis], [1, 0, 0] ));
    modelView = mult(modelView, rotate(theta[yAxis], [0, 1, 0] ));
    
    
    gl.uniformMatrix4fv( gl.getUniformLocation(program,"modelViewMatrix"), false, flatten(modelView) );

    gl.uniform1i(gl.getUniformLocation(program, "i"),0);
   // gl.drawArrays( gl.TRIANGLES, 0, 36 );
    
	
		// send color and matrix for square then render
	
	//gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );
	gl.uniform4fv(fColor, flatten(red));
	gl.drawArrays(gl.TRIANGLES, 0, 36);
	
	
	// rotate light source
	
	light[0] = Math.sin(thetaShadow);
	light[2] = Math.cos(thetaShadow);
	
	// model-view matrix for shadow then render

	modelView = mult(modelView, translate(light[0], light[1], light[2]));
	modelView = mult(modelView, m);
	modelView = mult(modelView, translate(-light[0], -light[1], 
	   -light[2]));

	// send color and matrix for shadow
	
	gl.uniformMatrix4fv( gl.getUniformLocation(program,"modelViewMatrix"), false, flatten(modelView) );
	//gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelView) );
	gl.uniform4fv(fColor, flatten(black));
	gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
	
	

    requestAnimFrame(render);
}
