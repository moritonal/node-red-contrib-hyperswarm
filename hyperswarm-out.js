const hyperswarm = require('hyperswarm');
const crypto = require('crypto');

module.exports = function (RED) {

	function HyperswarmPipeNodeOut(config) {

		RED.nodes.createNode(this, config);

		this.status({ fill: "red", shape: "ring", text: "disconnected" });

		const swarm = hyperswarm();

		const prepareMessage = (device) => {
			return {
				payload: device
			};
		};

		const topic = crypto.createHash('sha256')
			.update(config.peerIdOut)
			.digest();

		swarm.join(topic, {
			lookup: true,
			announce: true
		});

		swarm.on('connection', (socket, info) => {

			if (info.client == false)
				return;

			this.status({
				fill: "green",
				shape: "dot",
				text: `connected to ${info.peer.host}:${info.peer.port}`
			});

			socket.on("data", (arg) => {

				console.log("Received", arg);

				var payload = arg.toString('utf8');

				this.send(prepareMessage(payload));
			});

			socket.on("close", () => {

				console.log("Socket closed out");

				this.status({ fill: "red", shape: "ring", text: "closed" });
			});

			this.on("close", (done) => {

				swarm.leave(topic, () => {
					done();
				});
			});
		});
	}

	RED.nodes.registerType("hyperswarm-out", HyperswarmPipeNodeOut);
}