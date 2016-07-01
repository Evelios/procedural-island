var Map = function(width, height, numPoints, pointSeed, mapSeed) {

	// Tuneable parameters
	this.lakeThreshold = 0.3; // Fraction of water corners for water polygon

	// Function that dictates land vs. water tiles
	this.islandShape = this.perlinIslandShape;

	this.width = width;
	this.height = height;
	this.numPoints = numPoints;
	this.mSeed = mapSeed || Util.rand();
	this.pSeed = pointSeed || Util.rand();

	// Set seed values for the map
	noise.seed(this.mSeed);
	Math.seedrandom(this.pSeed);

	this.generateMap();
}

//------------------------------------------------------------------------------
// Meta function of the map generator, this holds all the sub functions that
// get called to make the map

Map.prototype.generateMap = function() {

	var start, end;

	start = new Date().getTime();
	// Diagram
	this.generateTiles();
	end = new Date().getTime();
	print(end - start)

	// Create Provinces
	this.assignOceanCoastAndLand();
	this.generateTectonicPlates();
	this.assignCornerGeoProvinces();
	this.assignPolygonGeoProvinces();

	// Elevations
	this.assignCornerElevations();
	this.redistributeElevations(this.landCorners());
	this.assignPolygonElevations();

	// Assign Moisture
  this.calculateDownslopes();
  this.createRivers();
	this.assignCornerMoisture();
	this.redistributeMoisture(this.landCorners());
	this.assignPolygonMoisture();

	// Temperature
	this.assignCornerTemperatures();
	this.assignPolygonTemperatures();

	// Biomes
	this.assignCornerBiomes();
	this.assignCenterBiomes();
}

//------------------------------------------------------------------------------
// Helper function to get list representations of the map data
//
// returns (list<Corners>): All land corners from the diagram
Map.prototype.landCorners = function() {
  var locations = [];
  for (var i = 0; i < this.corners.length; i++) {
    var corner = this.corners[i];
    if (!corner.ocean && !corner.coast) {
      locations.push(corner);
    }
  }
  return locations;
}

//------------------------------------------------------------------------------
// Helper function to get the edge that contains the two corner points
//
// params:
//	c1 (Corner): The first possible corner connected to an edge
//	c2 (Corner): The second possible corner connected to an edge
//
// returns (Edge): Returns the edge connected to the two corners,
// 	otherwise returns null

Map.prototype.edgeLookupFromCorners = function(c1, c2) {
  var edge;
  for (var i = 0, l = this.edges.length; i <l; i++) {
    edge = this.edges[i];
    if ((edge.v0 == c1 && edge.v1 == c2) || (edge.v1 == c1 && edge.v0 == c2)) {
      return edge;
    }
  }
  return null;
}

//------------------------------------------------------------------------------
// Helper function to generate random points for creating the diagram
//
// params:
// 		length (Number): length of the list to be generated
//
// return (list<Vector>): a list of random points of {length}

Map.prototype.generateRandomPoints = function(length) {
	var points = [];
	for (var i = 0; i < length; i++) {
		var x = Util.randIntInclusive(0, this.width);
		var y = Util.randIntInclusive(0, this.height);
		var point = new Vector(x, y);
		points.push(point);
	}
	return points;
}

//------------------------------------------------------------------------------
// Helper function to create a voronoi diagram from input points
//
// params:
//		points (list<Vector>): list of points to generate a voronoi diagram
//		relaxations (Number): number Lloyd ralaxations to preform on the
//			voronoi diagram
//
// return (Diagram): PAN connected voronoi diagram form the input points that
//		have been relaxed {relaxations} times

Map.prototype.generateDiagram = function(points, relaxations) {

	var bbox = { xl: 0, xr: this.width, yt: 0, yb: this.height };

	return diagram = new Diagram(points, bbox, relaxations);
}

//------------------------------------------------------------------------------
// Generates the map tiles that are to be used as the basis of the map
// The tiles are PAN connected relaxed voronoi diagram with relaxes corners

Map.prototype.generateTiles = function() {

	// Tuneable parameter
	var relaxations = 4;

	var points = this.generateRandomPoints(this.numPoints);
	var diagram = this.generateDiagram(points, relaxations);

	this.centers = diagram.centers;
	this.corners = diagram.corners;
	this.edges = diagram.edges;
}
//------------------------------------------------------------------------------
// Helper function for the island shape functions
//
// This function returns the distance away from the center of the map creating
// a gradient falloff function from the center of the map
//
// params:
//		pos (Vector): the location to be check for the gradient value
//
// return: (Number): The distance from the edge of the map

// This function needs fixing? The value is range limited to 0-1

Map.prototype.gradient = function(pos) {
  var center = new Vector(this.width / 2, this.height / 2);
  var size = new Vector(this.width, this.height);
  var deltaVector = pos.subtract(center);
  var normalized = new Vector(deltaVector.x / center.x, deltaVector.y / center.y);
  var delta = normalized.magnitude();
  return delta;
}

// Helper function to create the land tiles
// return (bool): true if position is land, false otherwise
Map.prototype.perlinIslandShape = function(pos) {
	// Tuneable parameters
  var threshold = 0.1;
  var scaleFactor = 10;

  var height = (noise.perlin2(pos.x / this.width * scaleFactor,
                              pos.y / this.height * scaleFactor) + 1) / 2;

  var gradient = this.gradient(pos);
  height -= gradient * gradient;
  return height > threshold;
}

Map.prototype.perlinLandShape = function(pos) {
	// Tuneable parameters
	var scaleFactor = 3;
		var threshold = 0.5;

	var height1 = noise.perlin2(pos.x / this.width * scaleFactor,
								pos.y / this.height * scaleFactor);
	height1 = (height1 + 1) / 2;
	var height2 = noise.perlin2((pos.x + this.width) / this.width * scaleFactor,
								(pos.y + this.height) / this.height * scaleFactor);
	height2 = (height2 + 1) / 2;

	var height = (height1 + height2) / 2;

	return height > threshold;
}

//------------------------------------------------------------------------------
// This function assigns the values of ocean, water (!land), and coast to
// center tiles and corner points. Ocean tiles are water tiles that are
// connected to the border of the map. Coast tiles are tiles that have a
// neighbors that are ocean tiles and land tiles


Map.prototype.assignOceanCoastAndLand = function() {

	// Assign corner type water
	for (var i = 0; i < this.corners.length; i++) {
		var corner = this.corners[i];
		corner.water = !this.islandShape(corner.position);
		corner.ocean = false;
	}

	var queue = [];

	// Assign border corners and centers to ocean tiles
	// and add the center tiles to the queue for ocean flood filling
	for (var i = 0; i < this.centers.length; i++) {
		var center = this.centers[i];

		var numWater = 0;
		for (var k = 0; k < center.corners.length; k++) {
			var corner = center.corners[k];

			if (corner.border) {
				center.border = true;
				center.ocean = true;
				corner.water = true;
				queue.push(center);
			}
			if (corner.water) {
				numWater += 1;
			}
		}

		center.water = (center.ocean ||
			 numWater >= center.corners.length * this.lakeThreshold);
		center.ocean = false;
	}

	// Flood fill and assign ocean value to center positions
	while (queue.length > 0) {
		var center = queue.shift();
		for (var j = 0; j < center.neighbors.length; j++) {
			var neighbor = center.neighbors[j];
			if (neighbor.water && !neighbor.ocean) {
				neighbor.ocean = true;
				queue.push(neighbor);
			}
		}
	}

	// Set the polygon attribute coast based on its neighbors
	// If it has at least one ocean and at least one land neighbor
	// Then is is a coastal polygon
	for (var i = 0; i < this.centers.length; i++) {
		var center = this.centers[i];
		var numOcean = 0;
		var numLand = 0;
		for (var k = 0; k < center.neighbors.length; k++) {
			var neighbor = center.neighbors[k];
			numOcean += neighbor.ocean;
			numLand += !neighbor.water;
		}

		center.coast = numOcean > 0 && numLand > 0;
	}

	// Set the corner attrubtes based on the computed polygo attributes.
	// If all polygons connected to this corner are ocean, then it's ocean
	// If all are land, then it's land, otherwise it is a coast
	for (var k = 0; k < this.corners.length; k++) {
		var corner = this.corners[k];

		var numOcean = 0;
		var numLand = 0;

		for (var i = 0; i < corner.touches.length; i++) {
			var neighbor = corner.touches[i];

			numOcean += neighbor.ocean;
			numLand += !neighbor.water;
		}

		corner.ocean = numOcean == corner.touches.length;
		corner.coast = numOcean > 0 && numLand  > 0;
		corner.water = corner.border ||
			((numLand != corner.touches.length) && !corner.coast);
	}

}

//------------------------------------------------------------------------------
// Creates the plates that are used for calculating the geological provinces
// Plates are another voronoi diagram layed on top of the polygon tile map
// Plates can be either oceanic or continental plates depending on whichever
// majority of tiles that it encompases. Plate movement direction is calculated
// by having all plates move towards continiental plates and away from oceanic
// plates. The boundary type is then determined by the relative direction of
// the plates. There are three boundary types, convergent, divergent, and
// transform.


Map.prototype.generateTectonicPlates = function() {

	// Tuneable parameters
	var numPlates = 20;
	var numRelaxations = 1;

	var points = this.generateRandomPoints(numPlates);

	// Create the voronoi diagram of the points
	this.plates = this.generateDiagram(points, numRelaxations);

	for (var i = 0; i < this.plates.centers.length; i++) {
		var plate = this.plates.centers[i];
		plate.tiles = []
	}

	// Assign map polygons to their corresponding plates
	for (var i = 0; i < this.centers.length; i++) {
		var tile = this.centers[i];

		var minDistance = Infinity;
		var minIndex = -1;
		// Find closest plate to the current point
		for (var k = 0; k < this.plates.centers.length; k++) {
			var plate = this.plates.centers[k];

			var distance = Vector.distance(tile.position, plate.position);
			if (distance < minDistance) {
				minDistance = distance;
				minIndex = k;
			}
		}
		this.plates.centers[minIndex].tiles.push(tile);
	}

	// Determine if the plate is an oceanic plate or a continental plate
	// plateType goes from 0 to 1 from oceanic to continental
	for (var i = 0; i < this.plates.centers.length; i++) {
		var plate = this.plates.centers[i];
		var plateType = 0;

		for (var j = 0; j < plate.tiles.length; j++) {
			var tile = plate.tiles[j];
			// Need to fix this so it only counts oceans, although it doesn't make
			// that big of a difference
			plateType += tile.water ? 0 : 1;
		}
		plateType /= plate.tiles.length;
		plate.plateType = plateType;
	}

	// Determine the plates movement direction
	// Plates want to move towards continental plates and away from
	// oceanic plates
	for (var i = 0; i < this.plates.centers.length; i++) {
		var plate = this.plates.centers[i];

		var direction = Vector.zero();

		for (var j = 0; j < plate.neighbors.length; j++) {
			var neighbor = plate.neighbors[j];

			var neighborDirection = neighbor.position.subtract(plate.position).normalize();
			var plateDirection = (neighbor.plateType * 2) - 1;
			if (plate.plateType > 0.5) {
				plateDirection *= -1;
			}

			var neighborInfluence = neighborDirection.multiply(plateDirection);

			direction = direction.add(neighborInfluence);
		}
		plate.direction = direction.normalize();
	}

	// Determine the motion at the plate edge
	// assigns boundaryType
	// Value range of 0 - 2
	// 0 : convergent
	// 1 : transform
	// 2 : divergent
	for (var i = 0; i < this.plates.edges.length; i++) {
		var edge = this.plates.edges[i];
		if (!edge.d1) {
			edge.direction = Vector.zero();
			continue;
		}
		var d0 = edge.d0.direction;
		var d1 = edge.d1.direction;
		var direction = d0.add(d1);

		edge.direction = direction;

		edge.boundaryType = null;

		// There is a good boundary at this edge
		if (direction.magnitude() <= 1.0) {

			// I think it could be easier and simpler to Calculate
			// the angle between r and d0 than to use projections

			var r = edge.d0.position.subtract(edge.d1.position);
			r = r.normalize();
			var nr = r.multiply(-1);

			var pd0 = Vector.proj(d0, r);
			var x1 = pd0.add(r);


			var pd1 = Vector.proj(d1, nr);
			var x2 = pd1.add(nr);

			// Calculate the average
			var boundary = (x1.magnitude() + x2.magnitude()) / 2;

			edge.boundaryType = boundary;
		}
	}

	this.boundaries = [];

	// Collect Boundaries
	for (var i = 0; i < this.plates.edges.length; i++) {
		var edge = this.plates.edges[i];

		if (edge.boundaryType) {
			var boundary = {
				p1 : edge.v0.position,
				p2 : edge.v1.position,
				type : ''
			};

			if (edge.boundaryType < 0.6) {
				boundary.type = 'convergent';
			} else if (edge.boundaryType > 1.4) {
				boundary.type = 'divergent';
			} else {
				boundary.type = 'transform';
			}
			this.boundaries.push(boundary);
		}
	}
}

//------------------------------------------------------------------------------

Map.prototype.assignCornerGeoProvinces = function() {

	// new Seed for the geo province map
	noise.seed(Util.rand());

	// Assign Geological Province: craton, orogen, basin, ocean
	// By default ocean is ocean and not ocean (including lakes) is craton
	for (var i = 0; i < this.corners.length; i++) {
		var corner = this.corners[i];

		if (corner.ocean) {
			corner.geoProvince = 'ocean';
			continue;
		} else {
			corner.geoProvince = 'craton';
		}

		if (corner.geoProvince == 'craton') { // Avoids reasigning of provinces

			// Noise in the boundaries of the provinces
			var x = corner.position.x;
			var y = corner.position.y;
			var scale = 10;
			var noiseOffset = 20 * noise.perlin2(x * scale / this.width, y * scale / this.height);

			for (var k = 0; k < this.boundaries.length; k++) {
				var boundary = this.boundaries[k];

				var distToBoundary = Vector.distToSeg(corner.position,
					boundary.p1, boundary.p2);
				var distToEndpoint = Math.min(
					Vector.distance(corner.position, boundary.p1),
					Vector.distance(corner.position, boundary.p2) );

				var orogenDistance = 40 + noiseOffset;
				var basinDistance = 60 + noiseOffset;
				var divBasinDistance = 30;

				if (boundary.type == 'convergent') {
					if (distToBoundary < orogenDistance) {
						corner.geoProvince = 'orogen';
						break;
					} else if (!corner.coast && distToBoundary < basinDistance) {
						corner.geoProvince = 'basin';
					}
				} else if (boundary.type == 'divergent') {
					if (distToBoundary < divBasinDistance) {
						corner.geoProvince = 'basin';
					}
				}
			}
		}
	}
}

//------------------------------------------------------------------------------

Map.prototype.assignPolygonGeoProvinces = function() {
	// Polygon is the most common province of all its corners
	for (var i = 0; i < this.centers.length; i++) {
		var center = this.centers[i];

		if (center.ocean) {
			center.geoProvince = 'ocean';
			continue;
		}

		var counts = {};

		for (var k = 0; k < center.corners.length; k++) {
			var corner = center.corners[k];
			var province = corner.geoProvince;

			if (!has(counts, province)) {
				counts[province] = 0;
			}

			if (!center.ocean || province == 'ocean') {
				counts[province] += 1;
			}
		}

		center.geoProvince = Util.objMax(counts);
	}
}

//------------------------------------------------------------------------------

Map.prototype.assignCornerElevations = function() {
	var queue = [];

	for (var i = 0; i < this.corners.length; i++) {
		var corner = this.corners[i];

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
		var epsilon = 0.001;
		// Small step used for land tiles
		var delta = 0.1;
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
			// If this point has changed, add it to the queue so that it and its
			// neighbors can be processed
			if (newElevation < adj.elevation) {
				adj.elevation = newElevation;
				queue.push(adj);
			}
		}
	}

	// Assign elevations to non-land corners
  for (var i = 0; i < this.corners.length; i++) {
    var corner = this.corners[i];
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
Map.prototype.redistributeElevations = function(locations) {
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
    x = Math.sqrt(scaleFactor) - Math.sqrt(scaleFactor*(1 - y));
    if (x > 1.0) {
      x = 1.0;
    }

    locations[i].elevation = x;
  }
}

//------------------------------------------------------------------------------

Map.prototype.assignPolygonElevations = function() {

  for (var i = 0; i < this.centers.length; i++) {
    var center = this.centers[i];
    var sumElevation = 0.0;

    for (var k = 0; k < center.corners.length; k++) {
      var corner = center.corners[k];
      sumElevation += corner.elevation;
    }

    center.elevation = sumElevation / center.corners.length;
  }
}

//------------------------------------------------------------------------------
// For every corner we calculate its downslope. That is a pointer that
// refrences to the corner that is at a lower elevation than itself, if there
// is no downslope point, the pointer points to itself

Map.prototype.calculateDownslopes = function() {
	for (var i = 0; i < this.corners.length; i++) {
    var corner = this.corners[i];
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

//------------------------------------------------------------------------------
// Uses the downslopes information to generate rivers that flow downhill
// This is done by picking random corner points that are not ocean and are
// within elevation criteria, then follow the point downstream to the minnimum

Map.prototype.createRivers = function() {
	// Tunable Paramater
	var numRivers = (this.width + this.height) / 4;

  while (numRivers--) {
    var corner = this.corners[[Util.randInt(0, this.corners.length)]];

    // Criteria for river startpoint including elevation thresholding
    if (corner.ocean || corner.elevation < 0.3 ||
        corner.elevation > 0.9) {
      continue;
    }

    while(!corner.coast && corner != corner.downslope) {
      var edge = this.edgeLookupFromCorners(corner, corner.downslope);
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

Map.prototype.assignCornerMoisture = function() {

  // Fresh water
	var queue = []

  for (var i = 0; i < this.corners.length; i++) {
    var corner = this.corners[i];

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
  for (var i = 0; i < this.corners.length; i++) {
    var corner = this.corners[i];
    if (corner.ocean || corner.coast) {
      corner.moisture = 1.0;
    }
  }
}

//------------------------------------------------------------------------------
// Redestribute moisture to be evenly destributed

Map.prototype.redistributeMoisture = function(locations) {
  locations.sort(Util.propComp('moisture'));
  for (var i = 0, l = locations.length; i < l; i++) {
    locations[i].moisture = i / l;
  }
}

//------------------------------------------------------------------------------
// Polygon moisture is just the average of the moistures at the corners

Map.prototype.assignPolygonMoisture = function() {
  for (var i = 0; i < this.centers.length; i++) {
    var center = this.centers[i];

    var sumMoisture = 0.0;
    for (var k = 0; k < center.corners.length; k++) {
      var corner = center.corners[k];
      if (corner.moisture > 1.0) {
        corner.moisture = 1.0;
      }
      sumMoisture += corner.moisture;
    }

    center.moisture = sumMoisture / center.corners.length;
  }
}

//------------------------------------------------------------------------------
// Helper function to assign the moisture of all the corners

Map.prototype.getTemperature = function(point) {

	function turbulance(x, y, size) {
		var initialSize = size;
		var value = 0;
		while (size >= 1) {
			value += noise.perlin2(x / size, y / size) * size;
			size /= 2;
		}
		return value / initialSize;
	}

	var x = point.x / this.width;
	var y = point.y / this.height;

	var xPeriod = this.temp.xPeriod;
	var yPeriod = 1;
	var turbPower = 1;
	var turbSize = 32;
	var scaleFactor = 100;

	var xy = xPeriod * x + yPeriod * y;

	noise.seed(this.temp.t1Seed);
	var turb = turbPower * turbulance(x * scaleFactor, y * scaleFactor, turbSize);

	var transform = this.temp.transform;
	var translation = this.temp.translation;

	// var intensity = (-Math.cos(xy * (2 * Math.PI + transform) + translation + turb) + 1) / 2;
	var intensity = 1 - Math.abs(Math.cos(xy * (Math.PI + transform) + translation + turb));

	noise.seed(this.temp.seed);
	var variability = turbPower * turbulance(x * scaleFactor, y * scaleFactor, turbSize);
	variability = (variability + 1) / 2;

	var result = intensity;

	return result;
}

//------------------------------------------------------------------------------

Map.prototype.assignCornerTemperatures = function() {

	// Initilize parameters for the temperature function
	this.temp = {}

	this.temp.seed = Util.rand();

	this.temp.xPeriod = Util.randRange(-0.2, 0.2);

	this.temp.transform = Util.randRange(-Math.PI, 0);
	var halfTransf = this.temp.transform / 2;
	// Center the transform and move across the possible period of the function
	// The outputs are skewed towards the center of the range
	this.temp.translation = -halfTransf +// Util.randRange(-halfTransf, halfTransf);
		// Math.cbrt(Util.randRange(-Math.pow(halfTransf, 3), Math.pow(halfTransf, 3)));
		Math.pow(Util.randRange(-Math.cbrt(halfTransf), Math.cbrt(halfTransf)), 3);

	// Get individual polygon temperatures

	for (var i = 0; i < this.corners.length; i++) {
		var corner = this.corners[i];

		var temp = this.getTemperature(corner.position);
		corner.temperature = temp * (0.66 + (1 - corner.elevation) / 3);
	}
}

//------------------------------------------------------------------------------
// Polygon temperature is the average of it's corner temperatures

Map.prototype.assignPolygonTemperatures = function() {
	for (var i = 0; i < this.centers.length; i++) {
		var center = this.centers[i];

		var sum = 0;
		for (var k = 0; k < center.corners.length; k++) {
			var corner = center.corners[k];

			sum += corner.temperature
		}

		center.temperature = sum / center.corners.length;
	}
}

//------------------------------------------------------------------------------
// Get the biome based on the elevation and temperature data in the polygon

Map.prototype.getBiome = function(center) {
	var moisture = center.moisture;
	var temp = center.temperature;

	if (center.ocean) {
		return 'ocean';
	} else if (center.water) {
		if (temp > 0.8) {
			return 'marsh';
		} else if (temp < 0.1) {
			return 'ice';
		} else {
			return 'water';
		}
	} else if (center.coast) {
		return 'beach';
	} else if (temp < 0.25) {
		if (moisture > 0.5) return 'snow';
		else if (moisture > 0.17) return 'tundra';
		else return 'bare';
	} else if (temp < 0.5) {
		if (moisture > 0.67) return 'taiga';
		else if (moisture > 0.33) return 'shrubland';
		else return 'temperate desert';
	} else if (temp < 0.75) {
		if (moisture > 0.83) return 'temperate rainforest';
		else if (moisture > 0.5) return 'temperate deciduous';
		else if (moisture > 0.17) return 'grassland';
		else return 'temperate desert';
	} else {
		if (moisture > 0.67) return 'tropical rainforest';
		else if (moisture > 0.33) return 'tropical seasonal forest';
		else if (moisture > 0.17) return 'grassland';
		else return 'subtropic desert';
	}
}

//------------------------------------------------------------------------------

Map.prototype.assignCornerBiomes = function() {
	for (var i = 0; i < this.corners.length; i++) {
		var corner = this.corners[i];

		corner.biome = this.getBiome(corner);
	}
}

//------------------------------------------------------------------------------

Map.prototype.assignCenterBiomes = function() {
	for (var i = 0; i < this.centers.length; i++) {
		var center = this.centers[i];

		center.biome = this.getBiome(center);
	}
}
