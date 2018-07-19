
//Ship class
var Ship = function() {
	var self = {
		pos: {x: 0, y: 0},
		destPos: {x: 0, y: 0},
		isMoving: false,
		speed: 1,
		mainModule: {pos: {x: 0, y: 0}},
	}

	self.modules = [];
	self.modules[0] = [];
	self.modules[1] = [];
	self.modules[0][0] = 1;
	self.modules[0][1] = 1;
	self.modules[1][0] = 1;
	self.modules[1][1] = 0;

	self.update = function() {
		if(self.isMoving) {
			var diffX = self.destPos.x - self.pos.x;
			var diffY = self.destPos.y - self.pos.y;
			var distance = Math.sqrt(diffX * diffX + diffY * diffY);
			if(distance <= 2) { //fix bug
				self.pos.x = self.destPos.x;
				self.pos.y = self.destPos.y;
				self.isMoving = false;
			} else {
				self.pos.x += (diffX / distance) * self.speed;
				self.pos.y += (diffY / distance) * self.speed;
			}
		}
	}

	self.createInitialLoadString = function() {
		return {
			pos: {x: self.pos.x, y: self.pos.y},
			destPos: {x: self.destPos.x, y: self.destPos.y},
			isMoving: self.isMoving,
			speed: self.speed,
			mainModule: self.mainModule,
			modules: self.modules,
		};
	}

	self.createUpdateString = function() {
		return {
			pos: {x: self.pos.x, y: self.pos.y},
			destPos: {x: self.destPos.x, y: self.destPos.y},
			isMoving: self.isMoving,
		};
	}

	return self;
}

PLAYER_LIST = {};

//Player class
var Player = function(id, socket) {
	var self = {
		id: id,
		socket: socket,
	}

	self.ship = Ship();

	self.update = function() {
		self.ship.update();
	}

	self.createInitialLoadString = function() {
		return {id: self.id, ship: self.ship.createInitialLoadString()};
	}

	self.createUpdateString = function() {
		return {id: self.id, ship: self.ship.createUpdateString()};
	}

	return self;
}

var NetworkCommunication = function() {
	var self = {

	}

	self.createPlayerUpdatePackage = function() {
		var playerUpdatePackage = [];

		for(var i in PLAYER_LIST) {
			var player = PLAYER_LIST[i];
			playerUpdatePackage.push(player.createUpdateString());
		}

		return playerUpdatePackage;
	}

	self.createPlayerInitialLoadPackage = function() {
		var playerInitialLoadPackage = [];

		for(var i in PLAYER_LIST) {
			var player = PLAYER_LIST[i];
			playerInitialLoadPackage.push(player.createInitialLoadString());
		}

		return playerInitialLoadPackage;
	}

	self.updateClients = function() {
		var playerUpdatePackage = self.createPlayerUpdatePackage();

		for(var i in PLAYER_LIST) {
			var socket = PLAYER_LIST[i].socket;
			socket.emit('playerUpdate', {playerUpdate: playerUpdatePackage});
		}
	}

	//EVENTS

	self.OnPlayerConnect = function(socket) {
		console.log("Player connected");
		var player = Player(Math.random(), socket);

		/* Send load data about all players
		 * and info about the new player
		 */
		var playerInitialLoadPackage = self.createPlayerInitialLoadPackage();
		var newPlayerLoadPackage = player.createInitialLoadString();
		socket.emit('initialLoad', {player: newPlayerLoadPackage, playerLoad: playerInitialLoadPackage});
		

		/* Send load data about new player to all other players
		 */
		for(var i in PLAYER_LIST) {
			PLAYER_LIST[i].socket.emit('playerConnect', {player: newPlayerLoadPackage});
		}

		//Add new player to the list of players
		PLAYER_LIST[player.id] = player;


		socket.on('disconnect', function() {
			console.log("Player disconnect");
			var playerId = player.id;
			delete PLAYER_LIST[playerId];
			for(var i in PLAYER_LIST) {
				var socket = PLAYER_LIST[i].socket;
				socket.emit('playerDisconnect', {id: playerId});
			}
		});

		socket.on('shipMoveRequest', function(data) {
			var player = PLAYER_LIST[data.id];
			if(player) {
				if(data.x != player.ship.pos.x || data.y != player.ship.pos.y) {
					player.ship.isMoving = true;
					player.ship.destPos.x = data.x;
					player.ship.destPos.y = data.y;
				}
			}
		});
	}
	//EVENTS END

	self.startListenOnClients = function(serv) {
		self.io = require('socket.io') (serv, {});
		self.io.sockets.on('connection', self.OnPlayerConnect);
	}

	return self;
}

function main() {
	var express = require('express');
	var app = express();
	var serv = require('http').Server(app);
	app.get('/', function(req, res) {
		res.sendFile(__dirname + '/client/index.html');
	});
	app.use('/client', express.static(__dirname + '/client'));
	serv.listen(2000);
	console.log("Server started.");

	var networkCommunication = NetworkCommunication();
	networkCommunication.startListenOnClients(serv);


	/* INTERVAL FUNCTIONS */
	setInterval(networkCommunication.updateClients, 1000/25);
	setInterval(update, 1000/25);
}

function update() {
	for(var i in PLAYER_LIST) {
		PLAYER_LIST[i].update();
	}
}

main();