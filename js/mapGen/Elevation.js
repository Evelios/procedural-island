// This file is a module to the map.js function
// The purpose of this module is to generate elevation data from the
// given geological provinces and land data

var Elevation = {};

//------------------------------------------------------------------------------
// Corner elevations are based upon the distance from the coast in three
// step values, for the three different geological provinces.
// The largest step value is for the orogen province, medium for the cratorn,
// and the smallest for the basin and lake tiles. Oceans are assigned an
// elevation of 0.

Elevation.assignCornerElevations = function(map) {
    var queue = [];

    for (var i = 0; i < map.corners.length; i++) {
        var corner = map.corners[i];

        if (corner.border) {
            corner.elevation = 0.0;
            queue.push(corner);
        } else {
            corner.elevation = Infinity;
        }
    }

    // Travere the graph moving away from the border. Increase elevation by small
    // ammount if tile is a land, and a large ammount if tile is in the orogen.
    // Elevation does not increase in basins or lakes
    while(queue.length > 0) {
        var corner = queue.shift();

        // Used for filling algorithm not to get stuck in infinite loop
        var epsilon = 0.0125;
        // Small step used for land tiles
        var delta = 0.025;
        // Normal step
        var step = 1.0;


        for (var i = 0; i < corner.adjacent.length; i++) {
            var adj = corner.adjacent[i];

            var newElevation = epsilon + corner.elevation;
            if (!corner.water && !adj.water && adj.geoProvince != 'basin') {
                if (adj.geoProvince == 'orogen') {
                    newElevation += step;
                } else {
                    newElevation += delta;
                }
            }
            // If map point has changed, add it to the queue so that it and its
            // neighbors can be processed
            if (newElevation < adj.elevation) {
                adj.elevation = newElevation;
                queue.push(adj);
            }
        }
    }

    // Assign elevations to non-land corners
  for (var i = 0; i < map.corners.length; i++) {
    var corner = map.corners[i];
    if (corner.ocean || corner.coast) {
      corner.elevation = 0.0;
    }
  }
}

//------------------------------------------------------------------------------
// Redistribute elevations so that lower elevations are more common than higher
// elevations. Speciffically, we want the elevation X to have frequency (1 - x)
// To do this we will sort the corners, then set each corner to its desired
// elevation

Elevation.redistributeElevations = function(locations) {
  // scaleFactor increases the mountain area so that is is more visible
  var scaleFactor = 1.1;
  locations.sort(Util.propComp('elevation'));
  for (i = 0; i < locations.length; i++) {
    // Let y(x) be the total area that we want at elevation <= x.
    // We want the higher elevations to occur less than lower
    // ones, and set the area to be y(x) = 1 - (1-x)^2.
    y = i / (locations.length - 1);
    // Now we have to solve for x, given the known y.
    //  *  y = 1 - (1-x)^2
    //  *  y = 1 - (1 - 2x + x^2)
    //  *  y = 2x - x^2
    //  *  x^2 - 2x + y = 0
    // From this we can use the quadratic equation to get:
    x = Math.sqrt(scaleFactor) - Math.sqrt(scaleFactor * (1 - y) );
    if (x > 1.0) {
      x = 1.0;
    }

    locations[i].elevation = x;
  }
}

//------------------------------------------------------------------------------
// For every corner we calculate its downslope. That is a pointer that
// refrences to the corner that is at a lower elevation than itself, if there
// is no downslope point, the pointer points to itself

Elevation.calculateDownslopes = function(map) {
    for (var i = 0; i < map.corners.length; i++) {
    var corner = map.corners[i];
    var downslope = corner;

    for (var k = 0; k < corner.adjacent.length; k++) {
      var adj = corner.adjacent[k];

      if (adj.elevation < downslope.elevation) {
        downslope = adj;
      }
    }
    corner.downslope = downslope;
  }
}