const midi = require("midi");
const prompt = require("prompt-sync")({sigint: true});
const express = require("express");
const socket = require("socket.io");
const open = require('open');
require('dotenv').config();

const input = new midi.Input();
const portCount = input.getPortCount();

if (portCount === 0) {
	console.log("connect a midi input device and restart");
	return;
}

for (let i = 0; i < input.getPortCount(); i++) {
	console.log(i, ":", input.getPortName(i));
}

const inputPort = !!process.env.INPUT_PORT ?
	parseInt(process.env.INPUT_PORT) :
	parseInt(prompt("\nselect port [0-" + (input.getPortCount() - 1) + "]: "));

console.log("\ninput index:", inputPort);

input.openPort(inputPort);
input.ignoreTypes(false, false, false);

let sockets = [];

let io = socket(server);
io.on("connection", socket => {
	console.log("connect:", socket.id);
	sockets.push(socket);
	console.log("socket count:", sockets.length);

	socket.on("disconnect", () => {
		console.log("disconnect:", socket.id)
		sockets.splice(sockets.indexOf(socket));
	});
});

input.on('message', (deltaTime, message) => {
	if (message[0] === 144) {
		console.log("note on:", message[1], message[2]);
		sockets.forEach(socket => {
			socket.emit("note_on", {
				"note": message[1],
				"velocity": message[2]
			});
		});
	}

	if (message[0] === 128) {
		console.log("note off:", message[1], message[2]);
		sockets.forEach(socket => {
			socket.emit("note_off", {
				"note": message[1],
				"velocity": message[2]
			});
		});
	}
});

let app = express();

let server = app.listen(3000);
app.use(express.static("public"));

open("http://localhost:3000");

