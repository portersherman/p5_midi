const DAMPING_FACTOR = 0.975;
const DELTA_T = 0.1;
const MASS = 25;
const RANGE = 87;
const BACKGROUND = 0;
const BASE_VEL = 0.0005;

const dots = [];

function setup() {
	createCanvas(windowWidth, windowHeight);
	background(255);

	let boundingBox = windowWidth < windowHeight ? windowWidth : windowHeight;

	for (let i = 0; i < RANGE + 1; i++) {
		let dotColor = lerpColor(color("#42f5dd"), color("#f54269"), i / RANGE);
		let dot = new Orbiter(windowWidth / 2, windowHeight / 2, ((boundingBox / 2 - 100) / RANGE) * (i + 1), -Math.PI / 2, dotColor, (i + 1) / (RANGE * 5000) + BASE_VEL);
		dots.push(dot);
	}

	const socket = io();

	socket.on("connect", () => {
		console.log("connected");
	});

	socket.on("note_on", data => {
		dots[data["note"] - 21].applyForce(data["velocity"]);
	});

	socket.on("note_off", data => {
		dots[data["note"] - 21].damp(0.5);
	});
}

function draw() {
	clear();
	background(BACKGROUND);
	dots.forEach(dot => {
		dot.update();
		dot.damp(DAMPING_FACTOR);
		dot.draw();
	})
}

class Orbiter {
	constructor(cx, cy, r, a, c, baseVel) {
		this.cx = cx;
		this.cy = cy;
		this.r = r;
		this.a = a;
		this.av = 0;
		this.aa = 0;
		this.mass = MASS;
		this.f = 0;
		this.c = c;
		this.baseVel = baseVel;
		this.aBuffer = []
	}

	applyForce(f) {
		this.f = f;
	}

	damp(factor) {
		this.av = this.av * factor;
	}

	update() {
		this.aa = this.f / this.mass;
		this.av = this.baseVel + this.av + this.aa * DELTA_T;
		this.a = this.a + this.av * DELTA_T;
		this.f = 0;

		this.aBuffer.push(this.a);
		if (this.aBuffer.length > 50) {
			this.aBuffer.shift()
		}
	}

	draw() {
		noFill();
		stroke(this.c);

		if (this.aBuffer.length > 0 && this.aBuffer[0] < this.a && this.a - this.aBuffer[0] > 0.001) {
			arc(this.cx, this.cy, this.r * 2, this.r * 2, this.aBuffer[0], this.a, OPEN);
		}

		let px = this.cx + Math.cos(this.a) * this.r;
		let py = this.cy + Math.sin(this.a) * this.r;

		fill(this.c);
		noStroke();
		ellipse(px, py, this.mass / 5);
	}
}