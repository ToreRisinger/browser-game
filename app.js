
//Classes
var Player = function(id, socket) {
	var self = {
		position: {x: 0, y: 0},
		id: id,
		isMoving: false,
		destPosition: {x: 0, y: 0},
		socket: socket,
	}
	Player.list[id] = self;
	return self;
}
Player.list = {};

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
	setInterval(logic, 1000/25);
}

function clientCommunication() {
	var posPackage = [];

	for(var i in Player.list) {
		var player = Player.list[i];
		posPackage.push({id: player.id, 
			x: player.position.x, 
			y: player.position.y, 
			isMoving: player.isMoving,
			destX: player.destPosition.x,
			destY: player.destPosition.y});
	}

	for(var i in Player.list) {
		var socket = Player.list[i].socket;
		socket.emit('playerPositions', posPackage);
	}
}

function logic() {
	for(var i in Player.list) {
		var player = Player.list[i];
		if(player.isMoving) {
			var diffX = player.destPosition.x - player.position.x;
			var diffY = player.destPosition.y - player.position.y;

			var length = Math.sqrt(diffX * diffX + diffY * diffY);
			if(length <= 1) {
				player.position.x = player.destPosition.x;
				player.position.y = player.destPosition.y;
				player.isMoving = false;
			} else {
				player.position.x += diffX / length;
				player.position.y += diffY / length;
			}
		}
	}
}

/* EVENTS */
function OnPlayerConnect(socket) {
	console.log("Player connected");
	var player = Player(Math.random(), socket);

	socket.emit('playerId', { id: player.id});

	socket.on('disconnect', function() {
		OnPlayerDisconnect(player);
	});

	socket.on('shipMoveRequest', function(data) {
		var player = Player.list[data.id];
		if(player) {
			if(data.x != player.position.x || data.y != player.position.y) {
				player.isMoving = true;
				player.destPosition.x = data.x;
				player.destPosition.y = data.y;
			}
		}
	});
}

function OnPlayerDisconnect(player) {
	console.log("Player disconnect");
	delete Player.list[player.id];
}

main();