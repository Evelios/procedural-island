var Map = function(width, height, numPoints, pointSeed, mapSeed) {

	// Tuneable parameters
	this.lakeThreshold = 0.3; // Fraction of water corners for water polygon
	this.graphRelaxations = 0;

	// Function that dictates land vs. water tiles
	this.islandShape = this.perlinIslandShape;

	// Point generation function
	this.pointFunction = this.generatePoissonPoints;

	this.width = width;
	this.height = height;
	this.numPoints = numPoints;
	this.mSeed = mapSeed || Util.rand();
	this.pSeed = pointSeed || Util.rand();

	// Set seed values for the map
	noise.seed(this.mSeed);
	Math.seedrandom(this.pSeed);
    this.generateSeedList(10);

    // Create the map
	this.generateMap();
}

//------------------------------------------------------------------------------
// Meta function of the map generator, this holds all the sub functions that
// get called to make the map

Map.prototype.generateMap = function() {

	var start, end;

	// Diagram
	this.generateTiles();

	// Land Forms
    this.useNextSeed();
	LandForms.assignOceanCoastAndLand(this);
	LandForms.generateTectonicPlates(this);
	LandForms.assignCornerGeoProvinces(this);
	LandForms.assignPolygonGeoProvinces(this);

	// Elevations
    this.useNextSeed();
	Elevation.assignCornerElevations(this);
	Elevation.redistributeElevations(this.landCorners());
	Elevation.calculateDownslopes(this);
	this.assignPolygonAverage('elevation');

	// Assign Moisture
    this.useNextSeed();
 	Moisture.createRivers(this);
	//Moisture.errodeRivers(this);     // adjusts elevation
	//Moisture.fixLakeElevation(this); // adjusts elevation
	Moisture.assignCornerMoisture(this);
	Moisture.redistributeMoisture(this.landCorners());
	this.assignPolygonAverage('moisture');

	// Temperature
    this.useNextSeed();
	Temperature.assignCornerTemperatures(this);
	this.assignPolygonAverage('temperature');

    // Weather
    Weather.assignCornerWindSpeed(this);

	// Biomes
	Biomes.assignCornerBiomes(this);
	Biomes.assignCenterBiomes(this);
}

//------------------------------------------------------------------------------
// Helper function for storing a list of seeds that can be initially generated
// This helps to preserve particular chunks of the procedural generation scheme
// so that each chunk runs the same given a particular seed without worying
// about what each process did before it

Map.prototype.generateSeedList = function(size) {
    this.seedList = [];
    for (i = 0; i < size; i++) {
        this.seedList.push(Util.randInt(0, Number.MAX_SAFE_INTEGER));
    }
}

//------------------------------------------------------------------------------
// Sets the next seed based on the seedlist. This is used to create a modular
// procedural section. This makes that section predictable based off of the
// initial map seed that was given

Map.prototype.useNextSeed = function() {
    var seed = this.seedList.pop();
    if (seed == undefined) {
        print("Ran out of stored seeds to use");
        return;
    }
    Math.seedrandom(seed);
}

//------------------------------------------------------------------------------
// Helper function to get list representations of the map data
// This function is used to get all the land corners in the diagram
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
// This function takes two corners and tries to find the edge that connects
// the two corners
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
// Helper function to generate poisson destributed points for creating the
// diagram. This creates blue noise randomness and does not require any
// relaxations of the voronoi diagram.
//
// params:
// 		length (Number): length of the list to be generated
//
// return (list<Vector>): a list of random points of approximately {length}
//	due to the nature of the Poisson point generation, it is not possible to
//	generate exactly a particular number of points

Map.prototype.generatePoissonPoints = function(length) {
	// This frequency gives and approximation to the correct number of points
	var freq = Math.sqrt(this.width * this.height / length / 1.7);
	var dist = freq;
	var sampler = new PoissonDiskSampler(this.width, this.height, freq, dist);
	var solution = sampler.sampleUntilSolution();
	return solution;
}

//------------------------------------------------------------------------------
// Helper function for the map object, it averages a property of the corners
// and assigns it to the polyon centers.
//
// params:
//		prop (String): The property that is being averaged to the polygon
//			the property must be a Number type to be averaged

Map.prototype.assignPolygonAverage = function(prop) {
	for (var i = 0; i < this.centers.length; i++) {
		var center = this.centers[i];

		var sum = 0;
		for (var k = 0; k < center.corners.length; k++) {
			var corner = center.corners[k];

			sum += corner[prop];
		}

		center[prop] = sum / center.corners.length;
	}
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

	var points = this.pointFunction(this.numPoints);

	var diagram = this.generateDiagram(points, this.graphRelaxations);

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

// This function needs fixing? The value should be range limited to 0-1

Map.prototype.gradient = function(pos) {
  var center = new Vector(this.width / 2, this.height / 2);
  var size = new Vector(this.width, this.height);
  var deltaVector = Vector.subtract(pos, center);
  var normalized = new Vector(deltaVector.x / center.x, deltaVector.y / center.y);
  var delta = normalized.magnitude();
  return delta;
}

//------------------------------------------------------------------------------
// Helper function to create the land tiles
// Creates an island shape based off of the perlin noise algorithm.
//
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

//------------------------------------------------------------------------------
// Helper function to create the land tiles
//	Creates land masses based off the perlin noise algorithm.
//
// return (bool): true if position is land, false otherwise

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