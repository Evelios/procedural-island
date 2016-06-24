data = {};

colors = {};

function main() {

  // Grab the div hook and insert a blank html canvas
  var div = document.getElementById('jsHook');
  var canvas = document.createElement('canvas');
  div.appendChild(canvas);

  var size = 500;
  canvas.height = 400;
  canvas.width = 800;
  data.height = canvas.height;
  data.width = canvas.width;

  data.numPoints = 1000;
  data.pointSeed = 0;
  data.mapSeed = 0;

  var backgroundColor = 'white';
  var screen = canvas.getContext('2d');
  data.screen = screen;

  colors.water = '#66B2FF';
	colors.land = '#99CC99';
	colors.mountain = '#CCFFFF';
	colors.coast = '#EBE0C0';
	colors.ocean = '#0066CC';

  // Plate Boundaries
  colors.convergent = '#FF0000';
  colors.transform = '#00FF00';
  colors.divergent = '#0000FF';

	// Geo Provinces
	colors.oceanCrust = '#99CCFF';
	colors.craton = '#FF99FF';
	colors.orogen = '#66FFB2';
	colors.basin = '#9999FF';

	colors.black = '#000000';
	colors.white = '#FFFFFF';
	colors.gray = '#A0A0A0';

  // Clear the data.screen
  data.screen.fillStyle = colors.white;
  data.screen.fillRect(0, 0, canvas.width, canvas.height);

  setUp();

  generateRandom();
}

function setUp() {
  var form = document.getElementById('form');
  var elements = form.elements;

  for ( var i = 0; i < form.elements.length; i++ ) {
    var e = elements[i];
    if (e.name != 'pointSeed' || e.name != 'mapSeed') {
      elements[i].onchange = function() {
        update();
      }
    }
  }
}

function update() {
  readForm();
  render();
}

function readForm() {
  var form = document.getElementById('form');
  var elements = form.elements;

  for ( var i = 0; i < form.elements.length; i++ ) {
    var e = form.elements[i];
    var value = e.type == 'checkbox' ? e.checked : e.value;
    var name = e.name;

    if (e.type == 'radio') {
      if (e.checked) {
        data[name] = value;
      }
    } else {
      data[name] = value;
    }

  }
}

// Generation Functions

function generateRandom() {

  var pointSeed = Util.randInt(0, Number.MAX_SAFE_INTEGER);
  document.getElementById('pointSeed').value = pointSeed;

  var mapSeed = Util.randInt(0, Number.MAX_SAFE_INTEGER);
  document.getElementById('mapSeed').value = mapSeed;

  createMap(pointSeed, mapSeed);
}

function generate() {

  var pointSeed = parseInt(document.getElementById('pointSeed').value) || 0;
  var mapSeed = parseInt(document.getElementById('mapSeed').value) || 0;

  createMap(pointSeed, mapSeed);
}

function createMap(pointSeed, mapSeed) {
 data.map = new Map(data.width, data.height, data.numPoints, pointSeed, mapSeed);
  update();
}

// Render Functions

function render() {

  if (data.drawMap == 'biome') {
    drawMap();
  } else if (data.drawMap == 'groProvinces') {
    drawGeoProvinces();
  } else if (data.drawMap == 'elevation') {
    drawElevation();
  } else if (data.drawMap == 'moisture') {
    drawMoisture();
  } else {
    print('something went wrong');
  }

  if (data.diagram) {
    drawDiagram();
  }
  if (data.plates) {
    drawPlates();
  }
  if (data.boundaries) {
    drawPlateBoundaries();
  }
  if (data.plateTypes) {
    drawPlateTypes();
  }
}

//------------------------------------------------------------------------------
//
//        DDDD     RRRR      AAA     W         W
//        D  DD    R   R    A   A    W         W
//        D   DD   RRRR     AAAAA     WW  W  WW
//        D  DD    R  RR   AA   AA     W WWW W
//        DDDD     R   R   A     A     WW   WW
//
//------------------------------------------------------------------------------



//------------------------------------------------------------------------------

function drawCell(cell, color) {
	var points = []
	for (var i = 0; i < cell.corners.length; i++) {
		points.push(cell.corners[i].position);
	}
	Draw.polygon(data.screen, points, color, true);
}

//------------------------------------------------------------------------------

function drawMap() {
	for (var i = 0; i < data.map.centers.length; i++) {
		var center = data.map.centers[i];
		var color;

		if (center.ocean) {
			color =  colors.ocean;
		} else if(center.coast) {
			color =  colors.coast;
		} else if(center.water) {
			color = colors.water;
		} else {
			color = Util.lerpColor(colors.land, colors.mountain, center.elevation);
		}

		drawCell(center, color);
	}

	for (var k = 0; k < data.map.edges.length; k++) {
		var edge = data.map.edges[k];

		if (edge.river) {
			Draw.line(data.screen, edge.v0.position, edge.v1.position,
				colors.water, Math.sqrt(edge.river));
		}
	}
}

//------------------------------------------------------------------------------
// Draw tectonic plates

function drawPlates() {
	for (var i = 0; i < data.map.plates.centers.length; i++) {
		var plate = data.map.plates.centers[i];
		var color = Util.hexToRgb(Util.randHexColor(), 0.5);

		for (var j = 0; j < plate.tiles.length; j++) {
			var tile = plate.tiles[j];
			drawCell(tile, color);
		}
	}
}

//------------------------------------------------------------------------------
// Draws the ocean and continental plates colored in with their direction

function drawPlateTypes() {
	for (var i = 0; i < data.map.plates.centers.length; i++) {
		var plate = data.map.plates.centers[i];
		var color = Util.hexToRgb(Util.randHexColor(), 0.5);

		// Draw Oceanic and Continental plates
		var plateColor;
		if (plate.plateType < 0.5) {
			plateColor = Util.hexToRgb(colors.water, 0.5);
		} else {
			plateColor = Util.hexToRgb(colors.land, 0.5);
		}
		drawCell(plate, plateColor)

		var arrow = plate.position.add(plate.direction.multiply(50));
		Draw.arrow(data.screen, plate.position, arrow, 'black', 3);
	}
}

//------------------------------------------------------------------------------
// Draws the plate boundaries with their boundary type colored in

function drawPlateBoundaries() {

	for (var i = 0; i < data.map.plates.edges.length; i++) {
		var edge = data.map.plates.edges[i];

		var arrow = edge.midpoint.add(edge.direction.multiply(30));

		if (edge.boundaryType != null) {
			var edgeColor;
			if (edge.boundaryType < 1.0) {
				edgeColor = Util.lerpColor(colors.convergent, colors.transform, edge.boundaryType);
			} else {
				edgeColor = Util.lerpColor(colors.transform, colors.divergent, edge.boundaryType - 1);
			}
			Draw.line(data.screen, edge.v0.position, edge.v1.position, edgeColor, 3);
		} else {
			Draw.line(data.screen, edge.v0.position, edge.v1.position, colors.gray, 3);
		}
	}
}

//------------------------------------------------------------------------------
// Draw geological provinces

function drawGeoProvinces() {
  drawMap();

	for (var i = 0; i < data.map.centers.length; i++) {
		var center = data.map.centers[i];

    var color;
		if (center.geoProvince == 'ocean') {
			color = colors.oceanCrust;
		} else if (center.geoProvince == 'craton') {
			color = colors.craton;
		} else if (center.geoProvince == 'orogen') {
			color = colors.orogen;
		} else if (center.geoProvince == 'basin') {
			color = colors.basin;
		} else {
			color = 'black';
		}

    color = Util.hexToRgb(color, 0.5);
		drawCell(center, color)
 	}
}

//------------------------------------------------------------------------------
// Draw elevation

function drawElevation() {
	for (var i = 0; i < data.map.centers.length; i++) {
		var center = data.map.centers[i];
		var color = Util.lerpColor(colors.black, colors.white, center.elevation);
		drawCell(center, color);
	}

	for (var i = 0; i < data.map.edges.length; i++) {
		var edge = data.map.edges[i];
		var v0 = edge.v0;
		var v1 = edge.v1;
		if (v0.coast && v1.coast && (edge.d0.ocean || edge.d1.ocean) && (!edge.d0.water || !edge.d1.water)) {
			Draw.line(data.screen, v0.position, v1.position, colors.gray, 1);
		}
	}
}

//------------------------------------------------------------------------------
// Draw moisture

function drawMoisture() {
	for (var i = 0; i < data.map.centers.length; i++) {
		var center = data.map.centers[i];
		var color = Util.lerpColor(colors.coast,colors.land, center.moisture);
		drawCell(center, color);
	}

	for (var i = 0; i < data.map.edges.length; i++) {
		var edge = data.map.edges[i];
		var v0 = edge.v0;
		var v1 = edge.v1;
		if (v0.coast && v1.coast && (edge.d0.ocean || edge.d1.ocean) && (!edge.d0.water || !edge.d1.water)) {
			Draw.line(data.screen, v0.position, v1.position, colors.coast);
		}
	}
}

//------------------------------------------------------------------------------
// Draw the voronoi diagram

function drawDiagram(delaunay) {
	// Draw Edges
	for (var i = 0; i < data.map.edges.length; i++) {
		var edge = data.map.edges[i];
		var d0 = edge.d0.position;
		var d1 = edge.d1 ? edge.d1.position : null;
		var v0 = edge.v0.position;
		var v1 = edge.v1.position;

		// Draw Voronoi Diagram
		Draw.line(data.screen, v0, v1, 'blue');

		if (delaunay && d1) {
		// Draw Delaunay Diagram
		Draw.line(data.screen, d0, d1, 'yellow')
	  	}
	}

	// Draw Center Points
	for (var i = 0; i < data.map.centers.length; i++) {
		var center = data.map.centers[i];
		var pos = center.position;
		Draw.point(data.screen, pos, 'red');
	}

	// Draw Corners
	for (var i = 0; i < data.map.corners; i++) {
		var corner = data.map.corners[i]
		var pos = corner.position;
		Draw.point(data.screen, pos, 'green')
	}
}
