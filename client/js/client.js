
//Ship class
var Ship = function() {
	var self = {
		pos: {x: 0, y: 0},
		destPos: {x: 0, y: 0},
		isMoving: false,
		speed: 1,
	}

	self.updateShip = function(shipData) {
		self.pos = shipData.pos;
		self.destPos = shipData.destPos;
		self.isMoving = shipData.isMoving;
		self.speed = shipData.speed;
	}

	self.getNrOfModules = function(modules) {
		var count = 0;
		for(x = 0; x < modules.length; x++) {
			for(y = 0; y < modules[x].length; y++) {
				if(modules[x][y] == 1) {
					count++;
				}
			}
		}
		return count;
	}

	self.loadShip = function(shipData) {
		self.pos = shipData.pos;
		self.destPos = shipData.destPos;
		self.isMoving = shipData.isMoving;
		self.speed = shipData.speed;
		self.mainModule = shipData.mainModule;
		self.modules = shipData.modules;
		self.nrOfModules = self.getNrOfModules(self.modules);
		self.graphics_buffer = graphics.createAndGetBuffer(self);
	}

	return self;
}

//Player class
var Player = function(id) {
	var self = {
		id: id,
		skills: {ship_command:  	{name: "Ship command", level: 1},
				weapons:			{name: "Weapons", level: 2},
				mining:				{name: "Mining", level: 3},
				hull_structure: 	{name: "Hull structure", level: 4},
				energy_shield: 		{name: "Energy shield", level: 5},
				sensors:   			{name: "Sensors", level: 6},
				engine: 			{name: "Engine", level: 7},
				energy_grid: 		{name: "Energy grid", level: 8},
				accuracy: 			{name: "Accuracy", level: 9},
				astroids: 			{name: "Astroid", level: 10},
		},
	}

	self.ship = Ship();
	
	self.updatePlayer = function(playerData) {
		self.ship.updateShip(playerData.ship);
	}

	self.loadPlayer = function(playerData) {
		self.id = playerData.id;
		self.ship.loadShip(playerData.ship);
	}

	return self;
}

//Server class
var Server = function() {
	var self = {
		
	}
	self.socket = io();

	//EVENTS
	self.OnPlayerDisconnect = function(data) {
		delete PLAYER_LIST[data.id];
	}

	self.OnPlayerConnect = function(data) {
		var newPlayer = Player(data.player.id);
		newPlayer.loadPlayer(data.player);
		PLAYER_LIST[data.player.id] = newPlayer;
	}

	self.OnPlayerUpdate = function(data) {
		var playerUpdate = data.playerUpdate;
		for(var i = 0; i < playerUpdate.length; i++) {
			if(PLAYER_LIST[playerUpdate[i].id] != undefined) {
				PLAYER_LIST[playerUpdate[i].id].updatePlayer(playerUpdate[i]);
			}
		}
	}

	self.connect = function() {
		self.socket.on('initialLoad', function(data) {
			thisPlayer = Player(data.player.id);
			thisPlayer.loadPlayer(data.player);
			PLAYER_LIST[thisPlayer.id] = thisPlayer;

			var playerLoad = data.playerLoad;
			for(var i = 0; i < playerLoad.length; i++) {
				var player = Player(playerLoad[i].id);
				player.loadPlayer(playerLoad[i]);
				PLAYER_LIST[player.id] = player;
			}
			
			self.startListen();
		});
	}

	self.startListen = function() {
		self.socket.on('playerDisconnect', self.OnPlayerDisconnect);
		self.socket.on('playerConnect', self.OnPlayerConnect);
		self.socket.on('playerUpdate', self.OnPlayerUpdate);
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

	self.update = function() {
		//Update camera position
		if(camera.followPlayer) {
	    	self.x = thisPlayer.ship.pos.x;
	    	self.y = thisPlayer.ship.pos.y;
	    }
	}

	return self;
}

//Gui class
var Gui = function() {
	var self = {
		display_ship_builder: false,
	}
	
	self.createGui = function() {
		var xElement = document.getElementById("coord_display_x");
		var yElement = document.getElementById("coord_display_y");

		var xNode = document.createTextNode("");
		var yNode = document.createTextNode("");

		xElement.appendChild(xNode);
		yElement.appendChild(yNode);

		self.coord_display_x = xNode;
		self.coord_display_y = yNode;

		//ship builder
		self.ship_builder = {};
		self.ship_builder.ship_builder_button = document.getElementById("ship_builder_button");
		self.ship_builder.ship_builder_window = document.getElementById("ship_builder_window");
		self.ship_builder.ship_builder_window_title = document.getElementById("ship_builder_window_title");
		self.ship_builder.isOpen = false;

		//Ship statistics
		self.ship_statistics = {};
		self.ship_statistics.ship_statistics_button = document.getElementById("ship_statistics_button");
		self.ship_statistics.ship_statistics_window = document.getElementById("ship_statistics_window");
		self.ship_statistics.ship_statistics_window_title = document.getElementById("ship_statistics_window_title");
		self.ship_statistics.isOpen = false;
		
		//Map
		self.map = {};
		self.map.map_button = document.getElementById("map_button");
		self.map.map_window = document.getElementById("map_window");
		self.map.map_window_title = document.getElementById("map_window_title");
		self.map.isOpen = false;

		//Skills
		self.skills = {};
		self.skills.skills_button = document.getElementById("skills_button");
		self.skills.skills_window = document.getElementById("skills_window");
		self.skills.skills_window_title = document.getElementById("skills_window_title");
		self.skills.isOpen = false;
	}

	self.addActionListeners = function() {
		canvas.addEventListener("click", self.onMoveAction, false);
		self.ship_builder.ship_builder_button.addEventListener("click", self.onPressShipBuilderButton, false);
		self.ship_statistics.ship_statistics_button.addEventListener("click", self.onPressShipStatisticsButton, false);
		self.map.map_button.addEventListener("click", self.onPressMapButton, false);
		self.skills.skills_button.addEventListener("click", self.onPressSkillsButton, false);
	}

	self.update = function() {
		if(thisPlayer != undefined) {
			self.coord_display_x.nodeValue = Math.floor(thisPlayer.ship.pos.x);
			self.coord_display_y.nodeValue = Math.floor(thisPlayer.ship.pos.y);
		}
	}

	self.closeAllWindows = function() {
		self.ship_builder.isOpen = false;
		self.ship_builder.ship_builder_window.style.display = "none";

		self.ship_statistics.isOpen = false;
		self.ship_statistics.ship_statistics_window.style.display = "none";

		self.map.isOpen = false;
		self.map.map_window.style.display = "none";

		self.skills.isOpen = false;
		self.skills.skills_window.style.display = "none";
	}

	//Actions
	self.onMoveAction = function(event) {
		var x = (event.pageX - canvas.width / 2) + camera.x;
		var y = ((event.pageY - canvas.height / 2) * -1) + camera.y;
		server.sendPlayerAction("shipMoveRequest", {id: thisPlayer.id, x: x, y: y});
	}

	self.onPressShipBuilderButton = function(event) {
		if(self.ship_builder.isOpen) {
			self.ship_builder.ship_builder_window.style.display = "none";
			self.ship_builder.isOpen = false;
		} else {
			self.closeAllWindows();
			self.ship_builder.ship_builder_window.style.display = "block";
			self.ship_builder.isOpen = true;
		}
	}

	self.onPressShipStatisticsButton = function(event) {
		if(self.ship_statistics.isOpen) {
			self.ship_statistics.ship_statistics_window.style.display = "none";
			self.ship_statistics.isOpen = false;
		} else {
			self.closeAllWindows();
			self.ship_statistics.ship_statistics_window.style.display = "block";
			self.ship_statistics.isOpen = true;
		}
	}

	self.onPressMapButton = function(event) {
		if(self.map.isOpen) {
			self.map.map_window.style.display = "none";
			self.map.isOpen = false;
		} else {
			self.closeAllWindows();
			self.map.map_window.style.display = "block";
			self.map.isOpen = true;
		}
	}

	self.onPressSkillsButton = function(event) {
		if(self.skills.isOpen) {
			self.skills.skills_window.style.display = "none";
			self.skills.isOpen = false;
		} else {
			self.closeAllWindows();
			self.skills.skills_window.style.display = "block";
			self.skills.isOpen = true;
		}
	}

	return self;
}

//Graphics class
var Graphics = function(canvas) {
	var self = {
		canvas: canvas,
	}

	self.init = function() {
		self.gl = self.canvas.getContext("webgl", { antialias: true });
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

		var square_gl_buffer = gl.createBuffer();
		var line_gl_buffer = gl.createBuffer();

		var square_vertices = [
			0.5, -0.5,
			0.5, 0.5,
			-0.5, 0.5,
			0.5, -0.5,
			-0.5, 0.5,
			-0.5, -0.5,
		];

		var line_vertices = [
			0.0, 1.0,
		];

		gl.bindBuffer(gl.ARRAY_BUFFER, square_gl_buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(square_vertices), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, line_gl_buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(line_vertices), gl.DYNAMIC_DRAW);

		self.program = program;
		self.vertexAttributeLocation = vertexAttributeLocation;
		self.resolutionUniformLocation = resolutionUniformLocation;
		self.translationUniformLocation = translationUniformLocation;
		self.scalingUniformLocation = scalingUniformLocation;
		self.rotationUniformLocation = rotationUniformLocation;
		self.colorUniformLocation = colorUniformLocation;
		self.square_gl_buffer = square_gl_buffer;
		self.line_gl_buffer = line_gl_buffer;
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

	self.resize = function(gl) {
		// Lookup the size the browser is displaying the canvas.
		var displayWidth  = gl.canvas.clientWidth;
		var displayHeight = gl.canvas.clientHeight;

		// Check if the canvas is not the same size.
		if (gl.canvas.width  != displayWidth ||
		  gl.canvas.height != displayHeight) {

			// Make the canvas the same size
			gl.canvas.width  = displayWidth;
			gl.canvas.height = displayHeight;
		}
	}

	self.render = function() {
		var gl = self.gl;
		self.resize(gl);
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
		gl.clearColor(0, 0, 0, 1);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.useProgram(self.program);


		gl.enableVertexAttribArray(self.vertexAttributeLocation);
		gl.uniform2f(self.resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

		self.renderDestination();
		self.renderAllShips();
	}

	self.renderAllShips = function() {
		var gl = self.gl;

	    self.renderShip(
    		thisPlayer.ship,
			{x:10, y:10}, 
			{r:1, g:0, b:0},
		);

	    for(var i in PLAYER_LIST) {
			var player = PLAYER_LIST[i];
	    	self.renderShip(
	    		player.ship,
				{x:10, y:10}, 
				{r:1, g:0, b:0},
			);
		}
	}

	self.renderDestination = function() {
		var gl = self.gl;

		//Draw destination
		if(thisPlayer.ship.isMoving) {
			//Render line
			self.renderLine(
				{x: thisPlayer.ship.pos.x, y: thisPlayer.ship.pos.y},
				{x: thisPlayer.ship.destPos.x, y: thisPlayer.ship.destPos.y},
				{r:0, g:0.3, b:0}
			);
			
			self.renderSquare(
				{x: thisPlayer.ship.destPos.x, y: thisPlayer.ship.destPos.y},
				{x:5, y:5}, 
				{r:0, g:1, b:0},
			);
		}
	}

	self.renderShip = function(ship, scaling, color) {
		var gl = self.gl;

		if(ship.graphics_buffer != undefined) {
			gl.bindBuffer(gl.ARRAY_BUFFER, ship.graphics_buffer);
		    gl.vertexAttribPointer(graphics.vertexAttributeLocation, 2, gl.FLOAT, false, 0, 0);

			var translationMatrix = self.translation(ship.pos.x - camera.x + graphics.gl.canvas.width / 2, 
				ship.pos.y - camera.y + graphics.gl.canvas.height / 2);

			var rotationMatrix = self.rotation(0);
			var scalingMatrix = self.scaling(scaling.x, scaling.y)

			gl.uniformMatrix3fv(graphics.translationUniformLocation, false, translationMatrix);
			gl.uniformMatrix3fv(graphics.rotationUniformLocation, false, rotationMatrix);
			gl.uniformMatrix3fv(graphics.scalingUniformLocation, false, scalingMatrix);
			gl.uniform3f(graphics.colorUniformLocation, color.r, color.g, color.b);

			gl.drawArrays(gl.TRIANGLES, 0, 6);
		}	
	}

	self.renderSquare = function(pos, scaling, color) {
		var gl = self.gl;

		gl.bindBuffer(gl.ARRAY_BUFFER, graphics.square_gl_buffer);
	    gl.vertexAttribPointer(graphics.vertexAttributeLocation, 2, gl.FLOAT, false, 0, 0);

		var translationMatrix = self.translation(pos.x - camera.x + graphics.gl.canvas.width / 2, 
			pos.y - camera.y + graphics.gl.canvas.height / 2);

		var rotationMatrix = self.rotation(0);
		var scalingMatrix = self.scaling(scaling.x, scaling.y)

		gl.uniformMatrix3fv(graphics.translationUniformLocation, false, translationMatrix);
		gl.uniformMatrix3fv(graphics.rotationUniformLocation, false, rotationMatrix);
		gl.uniformMatrix3fv(graphics.scalingUniformLocation, false, scalingMatrix);
		gl.uniform3f(graphics.colorUniformLocation, color.r, color.g, color.b);

		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}

	self.renderLine = function(startPos, endPos, color) {
		var gl = self.gl;

		var line_vertices = [
			startPos.x, startPos.y,
			endPos.x, endPos.y,
		];

		gl.bindBuffer(gl.ARRAY_BUFFER, self.line_gl_buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(line_vertices), gl.DYNAMIC_DRAW);
    	gl.vertexAttribPointer(graphics.vertexAttributeLocation, 2, gl.FLOAT, false, 0, 0);

		var translationMatrix = self.translation((graphics.gl.canvas.width / 2) - camera.x, 
			(graphics.gl.canvas.height / 2) - camera.y);

		var rotationMatrix = self.rotation(0);
		var scalingMatrix = self.scaling(1, 1)

		gl.uniformMatrix3fv(graphics.translationUniformLocation, false, translationMatrix);
		gl.uniformMatrix3fv(graphics.rotationUniformLocation, false, rotationMatrix);
		gl.uniformMatrix3fv(graphics.scalingUniformLocation, false, scalingMatrix);
		gl.uniform3f(graphics.colorUniformLocation, color.r, color.g, color.b);

		gl.drawArrays(gl.LINES, 0, 2);
	}

	self.createAndGetBuffer = function(ship) {
		var gl = self.gl;
		var buffer = gl.createBuffer();

		var square_vertices = [
			0.5, -0.5,
			0.5, 0.5,
			-0.5, 0.5,
			0.5, -0.5,
			-0.5, 0.5,
			-0.5, -0.5,
		];

		var ship_vertices = [];

		//Add main module
		for(i = 0; i < square_vertices.length; i++) {
			ship_vertices.push(square_vertices[i]);
		}

		/*
		for(x = 0; x < ship.modules.length; x++) {
			for(y = 0; y < ship.modules[x].length; y++) {
				for(i = 0; i < 6; i++) {
					if(ship.modules[x][y] == 1) {
						ship_vertices.push(square_vertices[i*2] + x - mainModule_x);
						ship_vertices.push(square_vertices[(i*2) + 1] + y - mainModule_y);
					}
				}
			}
		}
		*/

		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ship_vertices), gl.STATIC_DRAW);

		return buffer;
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

//Game class
var Game = function() {
	self = {

	}

	return self;
}

//Global variables
var canvas = document.getElementById("canvas");

var server = Server();
var camera = Camera();
var gui = Gui();
var graphics = Graphics(canvas);
var game = Game();

var PLAYER_LIST = {};
var thisPlayer = Player(-1);

function main() {

	//Start listening on server
	server.connect();

	//Initialize graphics
	graphics.init();

	//Setup gui
	gui.createGui();
	gui.addActionListeners();

	//Start game
	setInterval(update, 1000/25);
	setInterval(render, 1000/25);
}

function update() {
	gui.update();
	camera.update();
}

function render() {
	graphics.render();
}

main();