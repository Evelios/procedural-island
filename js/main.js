data = {};

colors = {};

function main() {

  // Grab the div hook and insert a blank html canvas
  var div = document.getElementById('jsHook');
  var canvas = document.createElement('canvas');
  div.appendChild(canvas);

  canvas.id = 'canvas';
  canvas.height = 400;
  canvas.width = 800;
  data.canvas = canvas;
  data.height = canvas.height;
  data.width = canvas.width;
  document.getElementById('height').value = data.height;
  document.getElementById('width').value = data.width;

  data.numPoints = 1000;
  document.getElementById('numPoints').value = data.numPoints;

  data.maxSeed = 65536;
  data.pointSeed = 0;
  data.mapSeed = 0;

  var backgroundColor = 'white';
  var screen = canvas.getContext('2d');
  data.screen = screen;

  // Others
  colors.black = '#000000';
  colors.white = '#FFFFFF';
  colors.gray = '#A0A0A0';
  colors.lightGray = '#E0E0E0';
  colors.magenta = 'FF00FF';

  // Genaric Biomes
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

  // Temperatures
  colors.hot = '#FF9933';
  colors.cold = '#66B2FF';

  // Biomes
  // ocean already decalred
  colors.marsh = '#36692F';
  colors.ice = '#CCFFFF';
  colors.beach = '#FFF7D0';
  colors.snow = '#FFF3FC';
  colors.tundra ='#B7C06F';
  colors.bare = '#B5AD8B';
  colors.taiga = '#8FA75A';
  colors.shrubland = '#93A66C';
  colors['temperate desert'] = '#D9D272';
  colors['temperate rainforest'] = '#2B9736';
  colors['temperate deciduous'] = '#549449';
  colors['tropical rainforest'] = '#36972B';
  colors['tropical seasonal forest'] = '#5E9D5E';
  colors.grassland = '#A3C974';
  colors['subtropic desert'] = '#FFF799';



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
    if (e.type != 'Number') {
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
    var value = parseInt(value) ? parseInt(value) : value;
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

  var pointSeed = Util.randInt(0, data.maxSeed);
  document.getElementById('pointSeed').value = pointSeed;

  var mapSeed = Util.randInt(0, data.maxSeed);
  document.getElementById('mapSeed').value = mapSeed;

  createMap(pointSeed, mapSeed);
}

function generate() {

  var pointSeed = parseInt(document.getElementById('pointSeed').value) || 0;
  var mapSeed = parseInt(document.getElementById('mapSeed').value) || 0;

  createMap(pointSeed, mapSeed);
}

function createMap(pointSeed, mapSeed) {
  data.canvas.height = data.height;
  data.canvas.width = data.width;
  data.map = new Map(data.width, data.height, data.numPoints, pointSeed, mapSeed);
  update();
}

// Render Functions

function render() {

  if (data.drawMap == 'color') {
    drawMap();
  } else if (data.drawMap == 'biome') {
    drawBiomes();
  } else if (data.drawMap == 'groProvinces') {
    drawGeoProvinces();
  } else if (data.drawMap == 'elevation') {
    drawElevation();
  } else if (data.drawMap == 'moisture') {
    drawMoisture();
  } else if (data.drawMap == 'temperature') {
    drawTemperature();
  } else if (data.drawMap == '3d') {
    draw3d();
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
  if (data.provinces) {
    drawProvinces();
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

function drawProvinces() {
  for (var i = 0; i < data.map.plates.centers.length; i++) {
		var plate = data.map.plates.centers[i];
		var color = Util.hexToRgb(Util.randHexColor(), 0.25);

		for (var j = 0; j < plate.tiles.length; j++) {
			var tile = plate.tiles[j];
      if (!tile.ocean) {
        drawCell(tile, color);
      }
		}
	}
}

//------------------------------------------------------------------------------
// Draw geological provinces

function drawGeoProvinces() {
  drawMap();

	for (var i = 0; i < data.map.centers.length; i++) {
		var center = data.map.centers[i];
    var color = colors[center.geoProvince];
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
		var color = Util.lerpColor(colors.coast, colors.land, center.moisture);
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
// Draw temperature

function drawTemperature() {
  for (var i = 0; i < data.map.centers.length; i++) {
		var center = data.map.centers[i];
		var color = Util.lerpColor(colors.cold, colors.hot, center.temperature);
		drawCell(center, color);
	}

	for (var i = 0; i < data.map.edges.length; i++) {
		var edge = data.map.edges[i];
		var v0 = edge.v0;
		var v1 = edge.v1;
		if (v0.coast && v1.coast && (edge.d0.ocean || edge.d1.ocean) && (!edge.d0.water || !edge.d1.water)) {
			Draw.line(data.screen, v0.position, v1.position, colors.lightGray);
		}
	}
}

//------------------------------------------------------------------------------

function drawBiomes() {
  for (var i = 0; i < data.map.centers.length; i++) {
		var center = data.map.centers[i];
    var biome = center.biome;
		var color = colors[biome];
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

//------------------------------------------------------------------------------
//
//             333333    DDDD
//            33    33   D   DD
//                 33    D    DD
//            33    33   D   DD
//             333333    DDDDD
//
//------------------------------------------------------------------------------
// 3D Functions are stored here

function draw3d() {

  // Init
  var scene = new THREE.Scene();
  var camera = new THREE.OrthographicCamera(data.width / -2, data.width / 2,
    data.height / 2, data.height / -2, 1, 1000);
  var renderer = new THREE.WebGLRenderer();
  renderer.setSize(data.width, data.height);
  var div = document.getElementById('jsHook');
  div.appendChild(renderer.domElement);

  // Lights
  var ambient = new THREE.AmbientLight( 0x404040 );
  scene.add(ambient);
  var light = new THREE.DirectionalLight( 0xffffff );
	light.position.set( -1, 1, 2  );
  light.castShadow = true;
  scene.add(light);

  // Create Terrain
  var geometry = new THREE.Geometry();
  var i = 0;

  for (var i = 0; i < data.map.centers.length; i++) {
    var center = data.map.centers[i];
    for (var k = 0; k < center.corners.length - 1; k++) {
      var c1 = center.corners[k];
      var c2 = center.corners[k+1];

      geometry.vertices.push(
        new THREE.Vector3(c1.position.x, c1.position.y),// c1.elevation),
        new THREE.Vector3(c2.position.x, c2.position.y),// c2.elevation),
        new THREE.Vector3(center.position.x, center.position.y)//, center.elevation)
      );

      geometry.faces.push( new THREE.Face3(i, i+1, i+2) );
      i += 3;
    }
  }
  geometry.mergeVertices();
  print(geometry);
  // geometry.computeFaceNormals();
  // geometry.computeBoundingSphere();
  // geometry.normalize();

  var material = new THREE.MeshPhongMaterial(
    {
      color: 0x00ff00,
      shading: THREE.FlatShading
    }
  );

  var terrain = new THREE.Mesh(geometry, material);
  scene.add(terrain);

  var geom = new THREE.BoxGeometry( 1, 2, 1 );
  var mat = new THREE.MeshPhongMaterial( { color: 0x00ff00 } );
  var cube = new THREE.Mesh( geom, mat );
  scene.add( cube );

  cube.rotation.x += 20;
  cube.rotation.y += 15;

  camera.position.z = 500;

  function render() {
    requestAnimationFrame( render );
    renderer.render( scene, camera );
  }
  render();
}
