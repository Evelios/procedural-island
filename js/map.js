var Map = function(width, height, numPoints, pointSeed, mapSeed) {

	this.lakeThreshold = 0.3; // Fraction of water corners for water polygon

	this.width = width;
	this.height = height;
	this.numPoints = numPoints;
	this.pSeed = pointSeed;
	this.mseed = mapSeed || Math.random();

	noise.seed(this.mseed);

	this.water = '#66B2FF';
	this.land = '#99CC99';
	this.coast = '#EBE0C0';
	this.ocean = '#0066CC';

	this.generateMap();
}

//------------------------------------------------------------------------------

Map.prototype.generateMap = function() {

	this.generatePolygons();

	this.assignOceanCoastAndLand();

	// this.generateTectonicPlates();
}

//------------------------------------------------------------------------------
// Helper function to generate random points for creating the diagram

Map.prototype.generateRandomPoints = function() {
	var points = [];
	for (var i = 0; i < this.numPoints; i++) {
		var x = Util.randIntInclusive(0, this.width);
		var y = Util.randIntInclusive(0, this.height);
		var point = new Vector(x, y);
		points.push(point);
	}
	return points;
}

//------------------------------------------------------------------------------
// Helper function to create a diagram

Map.prototype.generateDiagram = function(points, relaxations) {

	var bbox = { xl: 0, xr: this.width, yt: 0, yb: this.height };

	return diagram = new Diagram(points, bbox, relaxations);
}

//------------------------------------------------------------------------------
// Helper function to create diagram
// Lloyd relaxation helped to create uniformity among polygon centers,
// this creates uniformity among polygon corners
// This breakes the voronoi diagram properties

Map.prototype.improveCorners = function() {

	var newCorners = [];

	// Calculate new corner positions
	for (var i = 0; i < this.corners.length; i++) {
		var corner = this.corners[i];

		if (corner.border) {
			newCorners[i] = corner.position;
		} else {
			var newPos = Vector.zero();

			for (var k = 0; k < corner.touches.length; k++) {
				var neighbor = corner.touches[k];
				newPos = newPos.add(neighbor.position);
			}

			newPos = newPos.divide(corner.touches.length);
			newCorners[i] = newPos;
		}
	}

	// Assign new corner positions
	for (var i = 0; i < this.corners.length; i++) {
		var corner = this.corners[i];
		corner.position = newCorners[i];
	}

	// Recompute edge midpoints
	for (var j = 0; j < this.edges.length; j++) {
		var edge = this.edges[j];

		if (edge.v0 && edge.v1) {
			edge.midpoint = Vector.midpoint(edge.v0.position, edge.v1.position);
		}
	}

	// Resort the corners into clockwise ordered corners
	for (var i = 0; i <this.centers.length; i++) {
		var center = this.centers[i];
		var comp = Util.comparePolyPoints(center);
		center.corners.sort(comp);
  	}
}

//------------------------------------------------------------------------------

Map.prototype.generatePolygons = function() {

	// Tuneable parameter
	var relaxations = 4;

	var diagram = this.generateDiagram(this.generateRandomPoints(), relaxations);

	this.centers = diagram.centers;
	this.corners = diagram.corners;
	this.edges = diagram.edges;

	this.improveCorners();
}
//------------------------------------------------------------------------------
// Helper function for the island shape functions

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
  var threshold = 0.2;
  var scaleFactor = 10;

  var height = (noise.perlin2(pos.x / this.width * scaleFactor,
                              pos.y / this.height * scaleFactor) + 1) / 2;

  var gradient = this.gradient(pos);
  height -= gradient * gradient;
  return height > threshold;
}

Map.prototype.prelinLandShape = function(pos) {
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

Map.prototype.assignOceanCoastAndLand = function() {

	// Assign corner type water
	for (var i = 0; i < this.corners.length; i++) {
		var corner = this.corners[i];
		corner.water = !this.prelinLandShape(corner.position);
		corner.ocean = false;
	}

	var queue = [];

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

	// Flood fill and assign ocean's
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

Map.prototype.generateTectonicPlates = function() {

	// Tuneable parameters
	var numPlates = 15;
	var numRelaxations = 1;

	var platePositions = [];

	// Calculate the starting plate positions
	while(numPlates--) {
		var plate = this.centers[Util.randInt(0, this.centers.length)];
		platePositions.pushNew(plate.position);
	}

	// Create the voronoi diagram of the points
	this.plates = this.generateDiagram(platePositions, numRelaxations);

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
}

//------------------------------------------------------------------------------

Map.prototype.drawCell = function(cell, screen, color) {
	var points = []
	for (var i = 0; i < cell.corners.length; i++) {
		points.push(cell.corners[i].position);
	}
	Draw.polygon(screen, points, color, true);
}

//------------------------------------------------------------------------------

Map.prototype.drawColor = function(screen) {
	screen.fillStyle = this.water;
 	screen.fillRect(0, 0, this.width, this.height);

	for (var i = 0; i < this.centers.length; i++) {
		var center = this.centers[i];
		var color;

		if (center.ocean) {
			color = this.ocean;
		} else if(center.coast) {
			color = this.coast; 
		} else if(center.water) {
			color = this.water;
		} else {
			color = this.land;
		}

		this.drawCell(center, screen, color);
	}
}

//------------------------------------------------------------------------------
// Draw tectonic plates

Map.prototype.drawPlates = function(screen) {
	for (var i = 0; i < this.plates.centers.length; i++) {
		var plate = this.plates.centers[i];
		var color = Util.hexToRgb(Util.randHexColor(), 0.25);

		// Draw Oceanic and Continental plates
		// var plateColor;
		// if (plate.plateType < 0.5) {
		// 	plateColor = Util.hexToRgb(this.water, 0.5);
		// } else {
		// 	plateColor = Util.hexToRgb(this.land, 0.5);
		// }
		// this.drawCell(plate, screen, plateColor)


		for (var j = 0; j < plate.tiles.length; j++) {
			var tile = plate.tiles[j];
			this.drawCell(tile, screen, color);
		}

		var arrow = plate.position.add(plate.direction.multiply(50));
		// Draw.line(screen, plate.position, arrow, 'black', 3);
		// Draw.point(screen, plate.position, 'red');
	}
}

Map.prototype.drawPlateBoundaries = function(screen) {

	for (var i = 0; i < this.plates.edges.length; i++) {
		var edge = this.plates.edges[i];

		var arrow = edge.midpoint.add(edge.direction.multiply(30));
		// Draw.line(screen, edge.midpoint, arrow, 'yellow', 3);

		// if (edge.direction.magnitude() < 1) {
		// 	Draw.line(screen, edge.v0.position, edge.v1.position, 'yellow', 3);
		// }

		if (edge.boundaryType != null) {
			var edgeColor;
			if (edge.boundaryType < 1.0) {
				edgeColor = Util.lerpColor('#FF0000', '#00FF00', edge.boundaryType);
			} else {
				edgeColor = Util.lerpColor('#00FF00', '#0000FF', edge.boundaryType - 1);
			}
			Draw.line(screen, edge.v0.position, edge.v1.position, edgeColor, 3);
		} else {
			Draw.line(screen, edge.v0.position, edge.v1.position, '#A0A0A0', 3);
		}

		// Draw.point(screen, edge.midpoint, 'red');
	}
}

//------------------------------------------------------------------------------

Map.prototype.drawDiagram = function(screen, delaunay) {
	// Draw Edges
	for (var i = 0; i < this.edges.length; i++) {
		var edge = this.edges[i];
		var d0 = edge.d0.position;
		var d1 = edge.d1 ? edge.d1.position : null;
		var v0 = edge.v0.position;
		var v1 = edge.v1.position;

		// Draw Voronoi Diagram
		Draw.line(screen, v0, v1, 'blue');

		if (delaunay && d1) {
		// Draw Delaunay Diagram
		Draw.line(screen, d0, d1, 'yellow')
	  	}
	}

	// Draw Center Points
	for (var i = 0; i < this.centers.length; i++) {
		var center = this.centers[i];
		var pos = center.position;
		Draw.point(screen, pos, 'red');
	}

	// Draw Corners
	for (var i = 0; i < this.corners; i++) {
		var corner = this.corners[i]
		var pos = corner.position;
		Draw.point(screen, pos, 'green')
	}
}
