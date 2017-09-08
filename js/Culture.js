// This file is a module to the map.js function

var Culture = {};

Culture.assignCulture = function(map) {
	Culture.assignCornerLivingConditions(map);
	map.assignPolygonAverage('livingCondition');

	Culture.createTowns(map);
}

//------------------------------------------------------------------------------
// Favorable conditions are low elevation, moderate temperature and high moisture

Culture.assignCornerLivingConditions = function(map) {
	for (var i = 0; i < map.corners.length; i++) {
		var corner = map.corners[i];

		if (corner.water || corner.coast) {
			corner.livingCondition = 0;
			continue;
		}

		// All variables should be in the range from 0 - 1,
		// with 0 being not favorable and 1 being the most hospitable
		var m = corner.moisture;

		var t = corner.temperature < 0.5 ? corner.temperature : 1 - corner.temperature;
		t *= 2;

		var e = 1 - corner.elevation;

		corner.livingCondition = Redist.pow(m / 3 + t / 3 + e / 3, 2, false);
	}
}

//------------------------------------------------------------------------------
// Pick a number of random positions for a town to be created. If the tile is a
// land tile, make a roll to see if the town is created. Check the roll against
// the living conditions of that tile. If the roll succeed, create a town there

Culture.createTowns = function(map) {
	var numTowns = 200;

	map.towns = [];

	while (numTowns--) {
		var center = map.centers[ Util.randInt(0, map.centers.length) ];
		if (center.water || center.town) continue;

		var settlementRoll = Math.sqrt(Util.rand());
		if (settlementRoll < center.livingCondition) {
			var townTile = Culture.livingCondMaxima(center);
			townTile.town = true;
			map.towns.push(townTile);
			// map.towns.push(center);
		}
	}
}

Culture.livingCondMaxima = function(center) {
	var searchTile;
	var best = center;

	var maxima = false;
	while(searchTile != best) {
		searchTile = best;
		for (var i = 0; i < searchTile.neighbors.length; i++) {
			neighbor = searchTile.neighbors[i];
			if (neighbor.livingCondition > best.livingCondition) {
				best = neighbor;
			}
		}
	}

	return best;
}