
//Ship class
//Ship class
var Ship = function() {
	var self = {
		pos: {x: 0, y: 0},
		destPos: {x: 0, y: 0},
		isMoving: false,
		speed: 1,
	}

	self.toString = function() {
		return {
			pos: {x: self.pos.x, y: self.pos.y},
			destPos: {x: self.destPos.x, y: self.destPos.y},
			isMoving: self.isMoving,
			speed: self.speed,
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
		if(self.ship.isMoving) {
			var diffX = self.ship.destPos.x - self.ship.pos.x;
			var diffY = self.ship.destPos.y - self.ship.pos.y;
			var distance = Math.sqrt(diffX * diffX + diffY * diffY);
			if(distance <= 2) { //fix bug
				self.ship.pos.x = self.ship.destPos.x;
				self.ship.pos.y = self.ship.destPos.y;
				self.ship.isMoving = false;
			} else {
				self.ship.pos.x += (diffX / distance) * self.ship.speed;
				self.ship.pos.y += (diffY / distance) * self.ship.speed;
			}
		}
	}

	self.toString = function() {
		return {id: self.id, ship: self.ship.toString()};
	}

	return self;
}


function main() {
	/* Setup express and file communication */
	var express = require('express');
	var app = express();
	var serv = require('http').Server(app);

	app.get('/', function(req, res) {
		res.sendFile(__dirname + '/client/index.html');
	});

	//This will make client able to request any file in client folder.
	app.use('/client', express.static(__dirname + '/client'));

	serv.listen(2000);

	console.log("Server started.");

	var io = require('socket.io') (serv, {});

	io.sockets.on('connection', OnPlayerConnect);

	/* INTERVAL FUNCTIONS */
	setInterval(clientCommunication, 1000/25);
	setInterval(update, 1000/25);
}

function clientCommunication() {
	var playerUpdatePackage = createPlayerUpdatePackage();

	for(var i in PLAYER_LIST) {
		var socket = PLAYER_LIST[i].socket;
		socket.emit('serverUpdate', {playerUpdate: playerUpdatePackage});
	}
}

function createPlayerUpdatePackage() {
	var playerUpdatePackage = [];

	for(var i in PLAYER_LIST) {
		var player = PLAYER_LIST[i];
		playerUpdatePackage.push(player.toString());
	}

	return playerUpdatePackage;
}

function createPlayerInitialLoadPackage() {
	var playerInitialLoadPackage = [];

	for(var i in PLAYER_LIST) {
		var player = PLAYER_LIST[i];
		playerInitialLoadPackage.push(player.toString());
	}

	return playerInitialLoadPackage;
}

function update() {
	for(var i in PLAYER_LIST) {
		PLAYER_LIST[i].update();
	}
}

/* EVENTS */
function OnPlayerConnect(socket) {
	console.log("Player connected");
	var player = Player(Math.random(), socket);

	/* Send load data about all players
	 * and info about the new player
	 */
	var playerInitialLoadPackage = createPlayerInitialLoadPackage();
	var newPlayerLoadPackage = player.toString();
	socket.emit('initialLoad', {player: newPlayerLoadPackage, playerLoad: playerInitialLoadPackage});
	

	/* Send load data about new player to all other players
	 */
	for(var i in PLAYER_LIST) {
		PLAYER_LIST[i].socket.emit('playerConnect', {player: newPlayerLoadPackage});
	}

	//Add new player to the list of players
	PLAYER_LIST[player.id] = player;

	socket.on('disconnect', function() {
		OnPlayerDisconnect(player);
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

function OnPlayerDisconnect(player) {
	console.log("Player disconnect");
	var playerId = player.id;
	delete PLAYER_LIST[playerId];
	sendDisconnectMessage(playerId);
}

function sendDisconnectMessage(id) {
	for(var i in PLAYER_LIST) {
		var socket = PLAYER_LIST[i].socket;
		socket.emit('playerDisconnect', {id: id});
	}
}

main();