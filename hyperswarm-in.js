const hyperswarm = require('hyperswarm');
const crypto = require('crypto');

module.exports = function (RED) {

	function HyperswarmPipeNodeIn(config) {

		RED.nodes.createNode(this, config);

		this.status({
			fill: "red",
			shape: "ring",
			text: "disconnected"
		});

		const topic = crypto.createHash('sha256')
			.update(config.peerID)
			.digest();

		const swarm = hyperswarm();

		const Connect = () => {

			swarm.join(topic, {
				lookup: true,
				announce: true
			});

			swarm.on('connection', (socket, info) => {

				socket.on("close", () => {

					console.log("Socket closed in");
				});

				if (info.client == false) {

					this.on("input", (msg) => {
						console.log("Writing");
						socket.write(msg.payload.toString());
					});
				}
				else {
					this.status({
						fill: "green",
						shape: "dot",
						text: `connected to ${info.peer.host}:${info.peer.port}`
					});
				}
			});
		}

		setTimeout(() => {
			Connect();
		}, 500);

		this.on("close", (done) => {

			swarm.leave(topic, () => {
				done();
			});
		});
	}

	RED.nodes.registerType("hyperswarm-in", HyperswarmPipeNodeIn);
}