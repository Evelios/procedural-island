//------------------------------------------------------------------------------
// This file is a module to the map.js function
// The purpose of this module is to generate moisture
// It does this by creating rivesr that run out to the ocean and by generating
// a moisture map by using this distance from the rivers

var Moisture = {};

//------------------------------------------------------------------------------
// Uses the downslopes information to generate rivers that flow downhill
// This is done by picking random corner points that are not ocean and are
// within elevation criteria, then follow the point downstream to the minnimum

Moisture.createRivers = function(map) {
    // Tunable Paramater
    var numRivers = (map.width + map.height) / 4;

  while (numRivers--) {
    var corner = map.corners[[Util.randInt(0, map.corners.length)]];

    // Criteria for river startpoint including elevation thresholding
    if (corner.ocean || corner.elevation < 0.3 ||
        corner.elevation > 0.9) {
      continue;
    }

    while(!corner.coast && corner != corner.downslope) {
      var edge = map.edgeLookupFromCorners(corner, corner.downslope);
      edge.river = (edge.river || 0) + 1;
      corner.river = (corner.river || 0) + 1;
      // There is double counting here but this effects the outcome of the
      // moisture calculations for the other corners in the next step
      corner.downslope.river = (corner.downslope.river || 0) + 1;
      corner = corner.downslope;
    }
  }
}

//------------------------------------------------------------------------------
// Simulate river errosion by decreasing the corner elevation at the rivers
// The elevation is decreased more by larger rivers

Moisture.errodeRivers = function(map) {
    // The errosion rate must be near 0
    var errosionRate = 0.05;

    // Contains all the locations that have already been processed
    var centers = {};
    var adjacent = {};

    for (var i = 0; i < map.corners.length; i++) {
        var corner = map.corners[i];

        if (corner.river && !corner.water) {
            corner.elevation *= 1 - (errosionRate * Math.min(corner.river, 3));

            for (var k = 0; k < corner.touches.length; k++) {
                var center = corner.touches[k];
                if (!center.water && !centers[center.position.asKey()]) {
                    centers[center.position.asKey()] = center;
                    centers.elevation *= 1 - (errosionRate / 2 * Math.min(corner.river, 3));
                }
            }
            for (var k = 0; k < corner.adjacent.length; k++) {
                var adj = corner.adjacent[k];
                if (!adj.water && !adjacent[adj.position.asKey()]) {
                    adjacent[adj.position.asKey] = adjacent;
                    adjacent.elevation *= 1 - (errosionRate / 3 * Math.min(corner.river, 3));
                }
            }
        }
    }
}

//------------------------------------------------------------------------------
// This function reassigns the lake elevations to make a flat lake
// It works by setting the elevation of a lake to it's lowest point

Moisture.fixLakeElevation = function(map) {
  var queue = [];

  // Fix the cortner elevations
  for (var i = 0; i < map.corners.length; i++) {
    var corner = map.corners[i];

    if (corner.water && !corner.ocean) {
      queue.push(corner);
    }
  }

  while (queue.length != 0) {
    var corner = queue.shift();

    for (var i = 0; i < corner.adjacent.length; i++) {
      var adj = corner.adjacent[i];

      if (corner.water && adj.elevation < corner.elevation) {
        corner.elevation = adj.elevation;
        queue.push(corner);
      }
    }
  }

  // Fix the center elevations
  for (var i = 0; i < map.centers.length; i++) {
    var center = map.centers[i];

    if (center.water && !center.ocean) {
      center.elevation = center.corners[1].elevation
    }
  }
}

//------------------------------------------------------------------------------
// Corner moisture is based on the distance a tile is from fresh water, being
// lakes and rivers.

Moisture.assignCornerMoisture = function(map) {

  // Fresh water
    var queue = []

  for (var i = 0; i < map.corners.length; i++) {
    var corner = map.corners[i];

    if ((corner.water || corner.river > 0) && !corner.ocean) {
      corner.moisture = corner.river > 0 ?
                Math.min(3.0, (0.2 * corner.river)) : 1.0;
      queue.push(corner);
    } else {
      corner.moisture = 0.0;
    }
  }

  while(queue.length > 0) {
    var corner = queue.shift();
    var newMoisture;

    for (var i = 0; i < corner.adjacent.length; i++) {
      var adj = corner.adjacent[i];
      newMoisture = corner.moisture * 0.9;
      if (newMoisture > adj.moisture) {
        adj.moisture = newMoisture;
        queue.push(adj);
      }
    }
  }

  // Salt water
  for (var i = 0; i < map.corners.length; i++) {
    var corner = map.corners[i];
    if (corner.ocean || corner.coast) {
      corner.moisture = 1.0;
    }
  }
}

//------------------------------------------------------------------------------
// Redestribute moisture to be linearly distributed. This gives an even
// distribution of moist and arid tiles.

Moisture.redistributeMoisture = function(locations) {
  locations.sort(Util.propComp('moisture'));
  for (var i = 0, l = locations.length; i < l; i++) {
    locations[i].moisture = i / l;
  }
}

