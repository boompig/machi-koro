const mc = require("./machi_koro_ctrl.js");

/**
 * Initialize the controller with the given weights
 *
 * @param {Array} players - Array of player names to use
 */
function getController (weights, logLevel) {
	// command-line invocation of MachiKoro
	let scope = {};
	let ctrl = new mc.MachiKoroCtrl(scope);
	if (weights) {
		ctrl.weights = weights;
	}
	if (logLevel) {
		ctrl.setLogLevel(logLevel);
	}

	ctrl.playerNames = Object.keys(weights);

	ctrl.initGame();
	return ctrl;
}

exports.getController = getController;