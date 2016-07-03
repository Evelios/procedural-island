data = {};

colors = {};
// Color Assignments

// Others
colors.black = '#000000';
colors.white = '#FFFFFF';
colors.gray = '#A0A0A0';
colors.lightGray = '#E0E0E0';
colors.magenta = '#FF00FF';
colors.bad = '#FF6666'
colors.good = '#33FF33'

// Genaric Biomes
colors.water = '#74BBFD';
colors.land = '#99CC99';
colors.mountain = '#CCFFFF';
colors.coast = '#EBE0C0';
colors.ocean = '#4864DB';

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
colors.marsh = '#37B596';
colors.ice = '#BDFFFF';
colors.beach = '#F8EFBD';
colors.snow = '#FFF3FC';
colors.tundra ='#B9D271';
colors.bare = '#B5AD8B';
colors.taiga = '#A8C95F';
colors.shrubland = '#A3CA7C';
colors['temperate desert'] = '#E8DF91';
colors['temperate rainforest'] = '#45B33B';
colors['temperate deciduous'] = '#7BC16E';
colors.grassland = '#ADD37D';
colors['tropical rainforest'] = '#23A336';
colors['tropical seasonal forest'] = '#57BB57';
colors['subtropic desert'] = '#F4EEA4';

//------------------------------------------------------------------------------
// Main Function Call

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

  // data.fov = 60;

  var backgroundColor = 'white';
  var screen = canvas.getContext('2d');
  data.screen = screen;

  setUp3d();

  // Run the map generator

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
  // Create map
  data.map = new Map(data.width, data.height, data.numPoints, pointSeed, mapSeed);
  // Run map modules
  Culture.assignCulture(data.map);
  update();
}

// Render Functions

function render() {

  if (data.drawMap == 'color') {
    drawMap();
    draw3d(true, true, false, biomeColoring);
  } else if (data.drawMap == 'biome') {
    drawBiomes();
    draw3d(false, true, false, biomeColoring);
  } else if (data.drawMap == 'groProvinces') {
    drawGeoProvinces();
    draw3d(false, false, true, geoProvinceColoring);
  } else if (data.drawMap == 'elevation') {
    draw3d(false, false, true, elevationColoring);
    drawElevation();
  } else if (data.drawMap == 'moisture') {
    drawMoisture();
    draw3d(false, false, true, moistureColoring);
  } else if (data.drawMap == 'temperature') {
    drawTemperature();
    draw3d(false, false, true, temperatureColoring);
  } else if (data.drawMap == 'livingCondition') {
    drawLivingCondition();
    draw3d(false, false, true, livingConditionsColoring);
  } else if (data.drawMap == 'render') {
    draw3d(true, true, false, biomeColoring);
  } else {
    print(data.drawMap + ' is not found.');
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
  if (data.towns) {
    drawTowns();
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

function drawTowns() {
  for (var i = 0; i < data.map.towns.length; i++) {
    var tile = data.map.towns[i];
    drawCell(tile, Util.randHexColor());
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
// Draw Culture living conditions

function drawLivingCondition() {
  for (var i = 0; i < data.map.centers.length; i++) {
		var center = data.map.centers[i];
		var color = Util.lerpColor(colors.bad, colors.good, center.livingCondition);
		drawCell(center, color);
	}

	for (var i = 0; i < data.map.edges.length; i++) {
		var edge = data.map.edges[i];
		var v0 = edge.v0;
		var v1 = edge.v1;
		if (v0.coast && v1.coast && (edge.d0.ocean || edge.d1.ocean) && (!edge.d0.water || !edge.d1.water)) {
			Draw.line(data.screen, v0.position, v1.position, colors.good);
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
//        DDDD     RRRR      AAA     W         W       333333    DDDD
//        D  DD    R   R    A   A    W         W      33    33   D   DD
//        D   DD   RRRR     AAAAA     WW  W  WW            33    D    DD
//        D  DD    R  RR   AA   AA     W WWW W        33    33   D   DD
//        DDDD     R   R   A     A     WW   WW         333333    DDDDD
//
//------------------------------------------------------------------------------

function setUp3d() {
  // Init
  data.scene = new THREE.Scene();

  data.camera = new THREE.OrthographicCamera(data.width, 0 , data.height, 0, 1, 1000);

  // Rotate the camera to be in line with the 2D space
  data.camera.rotation.z = Math.PI;

  data.camera.position.x = data.width;
  data.camera.position.y = data.height;
  data.camera.position.z = 100;
  // camera.position.z = cameraHeight;


  data.renderer = new THREE.WebGLRenderer( { antialias: true } );
  data.renderer.setSize(data.width, data.height);
  var div = document.getElementById('jsHook');
  div.appendChild(data.renderer.domElement);

  // Lights
  data.ambient = new THREE.AmbientLight( 0xffffff , 0.3 );

  data.light3d = new THREE.DirectionalLight( 0xffffff );
	data.light3d.position.set( 1, 1, -1);
  data.light3d.castShadow = true;

  data.light2d = new THREE.DirectionalLight( 0xffffff );
  data.light2d.position.set(0, 0, -1);

  data.removeableItems = [];

  setUpGUI();
}

function setUpGUI() {
  // var gui = new DAT.GUI({
  //   height : 5 * 32 - 1
  // });

  // var params = {
  //   'Point Seed' : data.pSeed,
  //   'Map Seed' : data.mSeed,
  //   'Number of Points': data.numPoints,
  //   'Width': data.width,
  //   'Height': data.height
  // };

  // gui.add(params, 'Point Seed');
  // gui.add(params, 'Map Seed');
}

function light2d() {
  addToScene(data.light2d);
}

function light3d() {
  addToScene(data.light3d);
  addToScene(data.ambient);
}

function renderScene() {
  data.renderer.render( data.scene, data.camera );
}

// Removing old items from the scene
// http://stackoverflow.com/questions/37762961/three-js-proper-removing-object-from-scene-still-reserved-in-heap
function clean() {
  if (data.removeableItems.length > 0 ) {
    data.removeableItems.forEach(function(v,i) {
       v.parent.remove(v);
    });
    data.removeableItems = null;
    data.removeableItems = [];
  }
}

function addToScene(obj) {
  data.scene.add(obj);
  data.removeableItems.push(obj);
}

//------------------------------------------------------------------------------
// Helper function used to render the map using Three js and WebGL
// Clears the screen and renders to the active screen renderer according to the
// input parameters and coloring function
//
// params:
//  r3d (Bool): Render in 3D if true, else render flat 2D representation
//  drawRivers (Bool): Param to determine if rivers are drawn
//  drawCoast (Bool): Param to determine if the coast is outlined
//  colorFn (function): function that determines the vertex colors
//    function(center, corner1, corner2):
//      returns [center color, c1 color, c2 color] (THREE.Color)

function draw3d(r3d, drawRivers, drawCoast, colorFn) {
  // Remove all the old objects in the scene
  clean();

  // Show either a 3D or 2D representation of the map
  var eleScale;
  if (r3d) {
    light3d();
    eleScale = 50;
  } else {
    light2d();
    eleScale = 0;
  }

  // Create the terrain mesh from the data.map object
  var terrainGeo = new THREE.Geometry();
  var vert = 0;

  for (var i = 0; i < data.map.centers.length; i++) {
    var center = data.map.centers[i];

    for (var k = 0; k < center.corners.length; k++) {
      var c1 = center.corners[k];
      var c2 = center.corners[(k+1) % center.corners.length];

      terrainGeo.vertices.push(
        new THREE.Vector3(center.position.x, center.position.y, center.elevation * eleScale),
        new THREE.Vector3(c1.position.x, c1.position.y, c1.elevation * eleScale),
        new THREE.Vector3(c2.position.x, c2.position.y, c2.elevation * eleScale)
      );

      var face = new THREE.Face3(vert, vert+1, vert+2);
      // Get colors from the color function
      var vertColors = colorFn(center, c1, c2);
      face.vertexColors = vertColors;

      terrainGeo.faces.push(face);
      vert += 3;
    }
  }
  terrainGeo.mergeVertices();
  terrainGeo.computeFaceNormals();

  var terrainMat = new THREE.MeshPhongMaterial (
    {
      color: 0xffffff,
      shading: THREE.FlatShading,
      vertexColors: THREE.VertexColors
    }
  );

  var terrain = new THREE.Mesh(terrainGeo, terrainMat);
  addToScene(terrain);

  // Draw the rivers and coast border
  if (drawRivers || drawCoast) {
    var riverVert = 0;
    var riverGeom = new THREE.Geometry();

    var coastVert = 0;
    var coastGeom = new THREE.Geometry();

    for (var i = 0;  i < data.map.edges.length; i++) {
      var edge = data.map.edges[i];
      var v0 = edge.v0;
      var v1 = edge.v1;
      if (drawRivers && edge.river) {
        riverGeom.vertices.push(
          new THREE.Vector3(v0.position.x, v0.position.y, v0.elevation * eleScale),
          new THREE.Vector3(v1.position.x, v1.position.y, v1.elevation * eleScale)
        );
      } else if (drawCoast && edge.coast) {
        coastGeom.vertices.push(
          new THREE.Vector3(v0.position.x, v0.position.y, v0.elevation * eleScale),
          new THREE.Vector3(v1.position.x, v1.position.y, v1.elevation * eleScale)
        );
      }
    }
    if (drawRivers) {
      var riverMat = new THREE.LineBasicMaterial( { color: colors.water, linewidth: 3 } );
      var rivers = new THREE.LineSegments(riverGeom, riverMat);
      addToScene(rivers);
    }
    if (drawCoast) {
      var coastMat = new THREE.LineBasicMaterial( { color: colors.lightGray, linewidth: 3 } );
      var coast = new THREE.LineSegments(coastGeom, coastMat);
      addToScene(coast);
    }

  }

  renderScene();
}

//------------------------------------------------------------------------------
// Helper function for map coloring
// Returns a function for that terrain rendering function that colors a map from
// low color to high color based on a property that should be a
// range from 0 to 1
//
// params:
//    low (String): Hex color for the low color range
//    high (String): Hex color for the high color range
//    prop (String): Property to base the coloring range on
//
// returns: (function) the coloring function to be sent to the terrain rendering

function rampColoring(low, high, prop) {
  function colorFn(center, c1, c2) {
    return [
      new THREE.Color( Util.lerpColor(low, high, center[prop]) ),
      new THREE.Color( Util.lerpColor(low, high, c1[prop]) ),
      new THREE.Color( Util.lerpColor(low, high, c2[prop]) )
    ];
  };
  return colorFn
}

function biomeColoring(center, c1, c2) {
  if (center.ocean && (!c1.ocean || !c2.ocean)) {
    var color = new THREE.Color(colors[center.biome]);
    return [color, color, color];
  }
  return [
    new THREE.Color(colors[center.biome]),
    new THREE.Color(colors[c1.biome]),
    new THREE.Color(colors[c2.biome])
  ];
}

function geoProvinceColoring(center, c1, c2) {
  if (center.ocean && (!c1.ocean || !c2.ocean)) {
    var color = new THREE.Color(colors[center.geoProvince]);
    return [color, color, color];
  }
  return [
    new THREE.Color(colors[center.geoProvince]),
    new THREE.Color(colors[c1.geoProvince]),
    new THREE.Color(colors[c2.geoProvince])
  ];
}

elevationColoring = rampColoring(colors.black, colors.white, 'elevation');

moistureColoring = rampColoring(colors.coast, colors.land, 'moisture');

temperatureColoring = rampColoring(colors.cold, colors.hot, 'temperature');

livingConditionsColoring = rampColoring(colors.bad, colors.good, 'livingCondition');
