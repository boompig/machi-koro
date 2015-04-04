// var fadeToggleDice = function () {
// 	return {
// 		link: function (scope, elem, attrs) {
// 			scope.$watch(attrs.uiFadeToggle, function (newVal, oldVal) {
// 				if (newVal === oldVal) return;
// 				elem[newVal ? "fadeIn" : "fadeOut"](1000);
// 			});
// 		}
// 	}
// };

var app = angular.module("MachiKoroSimul", [])
				.controller("MachiKoroCtrl", MachiKoroCtrl);
				// .directive("uiFadeToggle", fadeToggleDice);