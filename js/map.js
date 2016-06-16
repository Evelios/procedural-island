var Map = function(width, height, numPoints, pointSeed, mapSeed) {

	this.width = width;
	this.height = height;
	this.numPoints = numPoints;
	this.pSeed = pointSeed;
	this.mseed = mapSeed || Math.random();

	noise.seed(this.mseed);

	this.water = '#3366CC';
	this.land = '#99CC99';

	this.generateMap();
}

//------------------------------------------------------------------------------

Map.prototype.generateMap = function() {

	this.generatePolygons();
	this.generateTectonicPlates();

	this.generateLandShape();
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

Map.prototype.generatePolygons = function() {

	// Tuneable parameter
	var relaxations = 4;

	var diagram = this.generateDiagram(this.generateRandomPoints(), relaxations);

	this.centers = diagram.centers;
	this.corners = diagram.corners;
	this.edges = diagram.edges;
}


//------------------------------------------------------------------------------

Map.prototype.generateTectonicPlates = function() {

	// Tuneable parameter
	var numPlates = 10;

	var platePositions = [];

	// Calculate the starting plate positions
	while(numPlates--) {
		var plate = this.centers[Util.randInt(0, this.centers.length)];
		platePositions.pushNew(plate.position);
	}

	// Create the voronoi diagram of the points
	this.plates = this.generateDiagram(platePositions, 1);

	// Assign a random movement direction to the plates;
	for (var i = 0; i < this.plates.centers.length; i++) {
		var plate = this.plates.centers[i];
		var direction = new Vector(Util.randRange(-1, 1), Util.randRange(-1, 1));
		direction = direction.normalize();
		plate.direction = direction;
	}

	// Determine the motion at the plate edge
	for (var i = 0; i < this.plates.edges.length; i++) {
		var edge = this.plates.edges[i];
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
// Helper function to create the land tiles
// return (bool): true if position is land, false otherwise

Map.prototype.perlinIslandShape = function(pos) {
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

Map.prototype.generateLandShape = function() {

	for (var i = 0; i < this.centers.length; i++) {
		var center = this.centers[i];
		center.water = !this.perlinIslandShape(center.position);
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

		if (center.water) {
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
		var cell = this.plates.centers[i];
		var color = Util.hexToRgb(Util.randHexColor(), 0.5);
		// this.drawCell(cell, screen, color);

		var arrow = cell.position.add(cell.direction.multiply(50));
		Draw.line(screen, cell.position, arrow, 'black', 3);
		Draw.point(screen, cell.position, 'red');
	}

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

		Draw.point(screen, edge.midpoint, 'red');
	}
}

//------------------------------------------------------------------------------

Map.prototype.drawDiagram = function(screen, delaunay) {
	// Draw Edges
	for (var i = 0; i < this.edges.length; i++) {
		var edge = this.edges[i];
		var d0 = edge.d0.position;
		var d1 = edge.d1.position;
		var v0 = edge.v0.position;
		var v1 = edge.v1.position;

		// Draw Voronoi Diagram
		Draw.line(screen, v0, v1, 'blue');

		if (delaunay) {
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
