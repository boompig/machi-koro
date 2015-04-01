var mc = require("./machi_koro_ctrl.js");
var fs = require("fs");

// command-line invocation of MachiKoro
var scope = {};
var ctrl = new mc.MachiKoroCtrl(scope);

var oldWeights = JSON.parse(fs.readFileSync("./weights.js"));

ctrl.weights = oldWeights;
ctrl.initGame();

ctrl.playGame();

var wp = ctrl.getCurrentPlayer();
wp.feedbackCardWeights();

oldWeights[wp.stratGroup] = wp.cardWeights;
fs.writeFileSync("./weights.js", JSON.stringify(oldWeights, null, 4));
// console.log(oldWeights);
console.log(wp.cardWeights);