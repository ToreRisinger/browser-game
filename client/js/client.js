
//Player class
var Player = function(id) {
	var self = {
		position: {x: 0, y: 0},
		id: id,
		isMoving: false,
		destPosition: {x: 0, y: 0},
	}
	return self;
}

//Server class
var Server = function() {
	var self = {
		
	}
	self.socket = io();

	self.connect = function() {
		self.socket.on('playerId', function(data) {
			thisPlayerId = data.id;
			self.startListen();
		});
	}

	self.startListen = function() {
		self.socket.on('playerPositions', function(data) {
			for(var i = 0; i < data.length; i++) {
				var playerId = data[i].id;
				if(playerId == thisPlayerId) {
					thisPlayer = Player(playerId);
					thisPlayer.position.x = data[i].x;
					thisPlayer.position.y = data[i].y;
					thisPlayer.isMoving = data[i].isMoving;
					thisPlayer.destPosition.x = data[i].destX;
					thisPlayer.destPosition.y = data[i].destY;
				} else {
					PLAYER_LIST = {};
					var player = Player(playerId);
					player.position.x = data[i].x;
					player.position.y = data[i].y;
					player.isMoving = data[i].isMoving;
					player.destPosition.x = data[i].destX;
					player.destPosition.y = data[i].destY;
					PLAYER_LIST[player.id] = player;
				}
			}
		});
	}

	self.sendPlayerAction = function(actionName, data) {
		self.socket.emit(actionName, data);
	};
	
	return self;
}

//Camera class
var Camera = function() {
	var self = {
		followPlayer: true,
		x: 0,
		y: 0,
	}
	return self;
}

//Gui class
var Gui = function() {
	var self = {

	}
	
	self.createGui = function() {
		var xElement = document.getElementById("overlay_player_x");
		var yElement = document.getElementById("overlay_player_y");

		var xNode = document.createTextNode("");
		var yNode = document.createTextNode("");

		xElement.appendChild(xNode);
		yElement.appendChild(yNode);

		self.overlay_player_x = xNode;
		self.overlay_player_y = yNode;
	}

	self.updateGui = function() {
		self.overlay_player_x.nodeValue = thisPlayer.position.x;
		self.overlay_player_y.nodeValue = thisPlayer.position.y;
	}

	self.addActionListeners = function() {
		canvas.addEventListener("click", self.onMoveAction, false);
	}

	//Actions
	self.onMoveAction = function(event) {
		var x = (event.pageX - canvas.width / 2) + camera.x;
		var y = ((event.pageY - canvas.height / 2) * -1) + camera.y;
		server.sendPlayerAction("shipMoveRequest", {id: thisPlayerId, x: x, y: y});
	}

	return self;
}

//Graphics class
var Graphics = function(canvas) {
	var self = {
		canvas: canvas,
	}

	self.init = function() {
		self.gl = canvas.getContext("webgl");
		var gl = self.gl;

		var vertexShaderSource = document.getElementById("2d-vertex-shader").text;
		var fragmentShaderSource = document.getElementById("2d-fragment-shader").text

		var vertexShader = self.createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
		var fragmentShader = self.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

		var program = self.createProgram(gl, vertexShader, fragmentShader);

		var vertexAttributeLocation = gl.getAttribLocation(program, "a_vertex");
		var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
		var translationUniformLocation = gl.getUniformLocation(program, "u_translation");
		var scalingUniformLocation = gl.getUniformLocation(program, "u_scaling");
		var rotationUniformLocation = gl.getUniformLocation(program, "u_rotation");
		var colorUniformLocation = gl.getUniformLocation(program, "u_color");

		var positionBuffer = gl.createBuffer();

		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

		var vertices = [
			0.5, -0.5,
			0.5, 0.5,
			-0.5, 0.5,
			0.5, -0.5,
			-0.5, 0.5,
			-0.5, -0.5,
		];

		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

		self.program = program;
		self.vertexAttributeLocation = vertexAttributeLocation;
		self.resolutionUniformLocation = resolutionUniformLocation;
		self.translationUniformLocation = translationUniformLocation;
		self.scalingUniformLocation = scalingUniformLocation;
		self.rotationUniformLocation = rotationUniformLocation;
		self.colorUniformLocation = colorUniformLocation;
		self.positionBuffer = positionBuffer;
	}

	self.createShader = function(gl, type, source) {
		var shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
		if(!success) {
			console.log(gl.getShaderInfoLog(shader));
			gl.deleteShader(shader);
		}

		return shader;
	}

	self.createProgram = function(gl, vertexShader, fragmentShader) {
		var program = gl.createProgram();
		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);
		gl.linkProgram(program);
		var success = gl.getProgramParameter(program, gl.LINK_STATUS);
		if(!success) {
			console.log(gl.getProgramInfoLog(program));
			gl.deleteProgram(program);
		}

		return program;
	}

	self.resize = function() {
		// Lookup the size the browser is displaying the canvas.
		var displayWidth  = canvas.clientWidth;
		var displayHeight = canvas.clientHeight;

		// Check if the canvas is not the same size.
		if (canvas.width  != displayWidth ||
		  canvas.height != displayHeight) {

		// Make the canvas the same size
		canvas.width  = displayWidth;
		canvas.height = displayHeight;
		}
	}

	self.drawScene = function() {
		var gl = self.gl;
		self.resize(gl.canvas);
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
		gl.clearColor(0, 0, 0, 1);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.useProgram(graphics.program);

		gl.enableVertexAttribArray(graphics.vertexAttributeLocation);

		// Bind the position buffer.
	    gl.bindBuffer(gl.ARRAY_BUFFER, graphics.positionBuffer);
	     
	    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
	    var size = 2;          // 2 components per iteration
	    var type = gl.FLOAT;   // the data is 32bit floats
	    var normalize = false; // don't normalize the data
	    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
	    var offset = 0;        // start at the beginning of the buffer
	    gl.vertexAttribPointer(graphics.vertexAttributeLocation, size, type, normalize, stride, offset);

	    var primitiveType = gl.TRIANGLES;
	    var offset = 0;
	    var count = 6;

	    if(camera.followPlayer) {
	    	camera.x = thisPlayer.position.x;
	    	camera.y = thisPlayer.position.y;
	    }

		gl.uniform2f(graphics.resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

		//Draw destination
		if(thisPlayer.isMoving) {
			self.drawObject(thisPlayer.destPosition.x, 
				thisPlayer.destPosition.y,
				{x:5, y:5}, 
				{x:0, y:1, z:0},
			);
		}

	    //Draw this player
	    self.drawObject(thisPlayer.position.x, 
				thisPlayer.position.y,
				{x:10, y:10}, 
				{x:1, y:0, z:0},
			);

	    for(var i in PLAYER_LIST) {
			var player = PLAYER_LIST[i];
	    	self.drawObject(player.position.x, 
				player.position.y,
				{x:10, y:10}, 
				{x:1, y:0, z:0},
				);
		}
	}

	self.drawObject = function(x, y, scaling, color) {
		var gl = self.gl;
		var translationMatrix = self.translation(x - camera.x + graphics.gl.canvas.width / 2, 
			y - camera.y + graphics.gl.canvas.height / 2);

		var rotationMatrix = self.rotation(0);
		var scalingMatrix = self.scaling(scaling.x, scaling.y)

		gl.uniformMatrix3fv(graphics.translationUniformLocation, false, translationMatrix);
		gl.uniformMatrix3fv(graphics.rotationUniformLocation, false, rotationMatrix);
		gl.uniformMatrix3fv(graphics.scalingUniformLocation, false, scalingMatrix);
		gl.uniform3f(graphics.colorUniformLocation, color.x, color.y, color.z);

		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}

	self.translation = function(tx, ty) {
	    return [
	      1, 0, 0,
	      0, 1, 0,
	      tx, ty, 1,
	    ];
  	}
 
  	self.rotation =  function(angleInRadians) {
	    var c = Math.cos(angleInRadians);
	    var s = Math.sin(angleInRadians);
	    return [
	      c,-s, 0,
	      s, c, 0,
	      0, 0, 1,
	    ];
  	}
 
	self.scaling = function(sx, sy) {
		return [
		  sx, 0, 0,
		  0, sy, 0,
		  0, 0, 1,
		];
	}

	self.multiply = function(a, b) {
	    var a00 = a[0 * 3 + 0];
	    var a01 = a[0 * 3 + 1];
	    var a02 = a[0 * 3 + 2];
	    var a10 = a[1 * 3 + 0];
	    var a11 = a[1 * 3 + 1];
	    var a12 = a[1 * 3 + 2];
	    var a20 = a[2 * 3 + 0];
	    var a21 = a[2 * 3 + 1];
	    var a22 = a[2 * 3 + 2];
	    var b00 = b[0 * 3 + 0];
	    var b01 = b[0 * 3 + 1];
	    var b02 = b[0 * 3 + 2];
	    var b10 = b[1 * 3 + 0];
	    var b11 = b[1 * 3 + 1];
	    var b12 = b[1 * 3 + 2];
	    var b20 = b[2 * 3 + 0];
	    var b21 = b[2 * 3 + 1];
	    var b22 = b[2 * 3 + 2];
	    return [
	      b00 * a00 + b01 * a10 + b02 * a20,
	      b00 * a01 + b01 * a11 + b02 * a21,
	      b00 * a02 + b01 * a12 + b02 * a22,
	      b10 * a00 + b11 * a10 + b12 * a20,
	      b10 * a01 + b11 * a11 + b12 * a21,
	      b10 * a02 + b11 * a12 + b12 * a22,
	      b20 * a00 + b21 * a10 + b22 * a20,
	      b20 * a01 + b21 * a11 + b22 * a21,
	      b20 * a02 + b21 * a12 + b22 * a22,
	    ];
  	}

  	return self;
}


//Global variables
var canvas = document.getElementById("canvas");

var server = Server();
var camera = Camera();
var gui = Gui();
var graphics = Graphics(canvas);

var PLAYER_LIST = {};
var thisPlayer = Player(-1);
var thisPlayerId = 0;

function main() {

	//Start listening on server
	server.connect();
	graphics.init();

	gui.createGui();
	gui.addActionListeners();

	setInterval(graphics.drawScene, 1000/25);
	setInterval(gui.updateGui, 1000/25);
}

main();