data = {};

// Color Assignments
colors = {};

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
  data.width = 800;
  data.height = 400;

  data.numPoints = 1000;

  data.maxSeed = 65536;
  data.pointSeed = 0;
  data.mapSeed = 0;
  data.currPSeed = data.pointSeed;
  data.currMSeed = data.pointMap;
  randSeeds();

  // Rendering Properties
  data.render = {};
  data.render.mapTypes = ['Biome', 'Geological Provinces','Elevation', 'Moisture',
    'Temperature', 'Living Conditions'];
  data.render.map = data.render.mapTypes[0];

  data.render.draw3d = true;
  data.render.rivers = true;
  data.render.smooth = false;
  data.render.polygon = false;
  data.render.coast = false;
  data.render.plateBoundaries = false;
  data.render.towns = false;

  setUp3d();



  setUpGUI();

  // Run the map generator
  generate();

}

//------------------------------------------------------------------------------
// Initilize the gui with all the tuneable parameters

function setUpGUI() {
  var gui = new dat.GUI();

  var functions = {
    'Generate Map': generate,
    'Generate Random': generateRandom,
  };

  gui.add(functions, 'Generate Map');
  gui.add(functions, 'Generate Random');

  var paramsFolder = gui.addFolder('Parameters');

  paramsFolder.add(data, 'pointSeed').name('Point Seed');
  paramsFolder.add(data, 'mapSeed').name('Map Seed');
  paramsFolder.add(data, 'numPoints').name('Number of Points');
  paramsFolder.add(data, 'width').name('Width');
  paramsFolder.add(data, 'height').name('Height');

  var rendFolder = gui.addFolder('Rendering');

  rendFolder.add(data.render, 'map', data.render.mapTypes).name('Map Types').onChange(render);
  rendFolder.add(data.render, 'draw3d').name('Draw 3D').onChange(render);
  rendFolder.add(data.render, 'rivers').name('Rivers').onChange(render);
  rendFolder.add(data.render, 'smooth').name('Smooth').onChange(render);
  rendFolder.add(data.render, 'polygon').name('Polygon').onChange(render);
  rendFolder.add(data.render, 'coast').name('Coast').onChange(render);
  // rendFolder.add(data.render, 'plateBoundaries').name('Plate Boundaries').onChange(render);
  // rendFolder.add(data.render, 'towns').name('Towns').onChange(render);
}

//------------------------------------------------------------------------------
// Generation Functions

function randSeeds() {
  data.pointSeed = Util.randInt(0, data.maxSeed);
  data.mapSeed = Util.randInt(0, data.maxSeed);
}

function generateRandom() {
  randSeeds();
  createMap();
}

function generate() {
  createMap();
}

function createMap() {
  data.currPSeed = data.pointSeed;
  data.currMSeed = data.mapSeed;
  // Create map
  data.map = new Map(data.width, data.height, data.numPoints,
    data.pointSeed, data.mapSeed);
  // Run map modules
  Culture.assignCulture(data.map);
  render();
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

//------------------------------------------------------------------------------
// Render Functions

function render() {

  updateRendererProperties();

  // Render a particular map type
  if (data.render.map == 'Biome') {
    draw3d(biomeColoring);
  } else if (data.render.map == 'Geological Provinces') {
    draw3d(geoProvinceColoring);
  } else if (data.render.map == 'Elevation') {
    draw3d(elevationColoring);
  } else if (data.render.map == 'Moisture') {
    draw3d(moistureColoring);
  } else if (data.render.map == 'Temperature') {
    draw3d(temperatureColoring);
  } else if (data.render.map == 'Living Conditions') {
    draw3d(livingConditionsColoring);
  } else {
    print(data.render.map + ' is not found.');
  }

  // Render map overlays
  if (data.render.plateBoundaries) {
    drawEdges(data.map.plates.edges, plateBoundarieColoring);
  }
}

//------------------------------------------------------------------------------
// Set up the WebGL renderer and necessary renderin objects for displaying
// the map

function setUp3d() {
  // Init
  data.scene = new THREE.Scene();

  data.camera = new THREE.OrthographicCamera(data.width, 0 , data.height, 0, 1, 1000);

  data.camera.up = new THREE.Vector3(0, 0, 1);

  // Rotate the camera to be in line with the 2D space
  data.camera.rotation.z = Math.PI;

  data.camera.position.set(data.width, data.height, 200);

  data.renderer = new THREE.WebGLRenderer( { antialias: true } );
  data.renderer.setSize(data.width, data.height);
  var div = document.getElementById('jsHook');
  div.appendChild(data.renderer.domElement);

  // Lights
  data.ambient = new THREE.AmbientLight( 0xffffff , 0.421 );

  data.light3d = new THREE.DirectionalLight( 0xffffff, 1 );
	data.light3d.position.set( 1, 1, -1);
  data.light3d.castShadow = true;

  data.light3dFill = new THREE.DirectionalLight( 0xffffff, 0.25 );
  data.light3dFill.position.set( -1, 1, -1);
  data.light3dFill.castShadow = true;

  data.light2d = new THREE.DirectionalLight( 0xffffff );
  data.light2d.position.set(0, 0, -1);

  data.removeableItems = [];
}

function updateRendererProperties() {
  data.renderer.setSize(data.width, data.height);
  data.camera.position.set(data.width, data.height, 200);
  data.camera.left = data.width;
  data.camera.top = data.height;
  data.camera.updateProjectionMatrix();
}

//------------------------------------------------------------------------------
// Functions called to add different lighting setups to the scene

function light2d() {
  addToScene(data.light2d);
}

function light3d() {
  addToScene(data.light3d);
  // addToScene(data.light3dFill);
  addToScene(data.ambient);
}

//------------------------------------------------------------------------------
// Function to render the WebGL scene

function renderScene() {
  data.renderer.render( data.scene, data.camera );
}

//------------------------------------------------------------------------------

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

function draw3d(colorFn) {
  // Remove all the old objects in the scene
  clean();

  // Show either a 3D or 2D representation of the map
  var eleScale;
  if (data.render.draw3d) {
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
  terrainGeo.computeVertexNormals();

  var terrainMat = new THREE.MeshPhongMaterial (
    {
      color: 0xffffff,
      // shading: THREE.FlatShading,
      vertexColors: THREE.VertexColors
    }
  );

  if (!data.render.smooth) {
    terrainMat.shading = THREE.FlatShading;
  }

  var terrain = new THREE.Mesh(terrainGeo, terrainMat);
  addToScene(terrain);

  // Draw the rivers and coast border
  if (data.render.rivers || data.render.coast) {
    var riverGeom = new THREE.Geometry();

    var coastGeom = new THREE.Geometry();

    for (var i = 0;  i < data.map.edges.length; i++) {
      var edge = data.map.edges[i];
      var v0 = edge.v0;
      var v1 = edge.v1;
      if (data.render.rivers && edge.river) {
        riverGeom.vertices.push(
          new THREE.Vector3(v0.position.x, v0.position.y, v0.elevation * eleScale * 1.1 + 0.1),
          new THREE.Vector3(v1.position.x, v1.position.y, v1.elevation * eleScale * 1.1 + 0.1)
        );
      } else if (data.render.coast && edge.coast) {
        coastGeom.vertices.push(
          new THREE.Vector3(v0.position.x, v0.position.y, 0.1),
          new THREE.Vector3(v1.position.x, v1.position.y, 0.1)
        );
      }
    }
    if (data.render.rivers) {
      var riverMat = new THREE.LineBasicMaterial( { color: colors.water, linewidth: 3 } );
      var rivers = new THREE.LineSegments(riverGeom, riverMat);
      addToScene(rivers);
    }
    if (data.render.coast) {
      var coastMat = new THREE.LineBasicMaterial( { color: colors.lightGray, linewidth: 3 } );
      var coast = new THREE.LineSegments(coastGeom, coastMat);
      addToScene(coast);
    }
  }

  renderScene();
}

//------------------------------------------------------------------------------
function drawTiles(tiles, colorFn) {
  var eleScale = 0;
  if (data.render.draw3d) {
    eleScale = 50;
  }

  // Create the terrain mesh from the data.map object
  var geometry = new THREE.Geometry();
  var vert = 0;

  for (var i = 0; i < tiles.length; i++) {
    var center = tiles[i];

    for (var k = 0; k < center.corners.length; k++) {
      var c1 = center.corners[k];
      var c2 = center.corners[(k+1) % center.corners.length];

      geometry.vertices.push(
        new THREE.Vector3(center.position.x, center.position.y, center.elevation * eleScale),
        new THREE.Vector3(c1.position.x, c1.position.y, c1.elevation * eleScale),
        new THREE.Vector3(c2.position.x, c2.position.y, c2.elevation * eleScale)
      );

      var face = new THREE.Face3(vert, vert+1, vert+2);
      // Get colors from the color function
      var vertColors = colorFn(center, c1, c2);
      face.vertexColors = vertColors;

      geometry.faces.push(face);
      vert += 3;
    }
  }
  geometry.mergeVertices();
  geometry.computeFaceNormals();

  var material = new THREE.MeshPhongMaterial (
    {
      color: 0xffffff,
      shading: THREE.FlatShading,
      vertexColors: THREE.VertexColors
    }
  );

  var mesh = new THREE.Mesh(geometry, material);
  addToScene(mesh);
}

//------------------------------------------------------------------------------
function drawEdges(edges, colorFn) {
  var eleScale = 0;
  if (data.render.draw3d) {
    eleScale = 50;
  }
  var geometry = new THREE.Geometry();

  for (var i = 0;  i < edges.length; i++) {
    var edge = edges[i];
    var v0 = edge.v0;
    var v1 = edge.v1;
    var e1 = v0.elevation >= 0 ? v0.elevation * eleScale * 1.1 + 0.1 : 75;
    var e2 = v1.elevation >= 0 ? v1.elevation * eleScale * 1.1 + 0.1 : 75;

    geometry.vertices.push(
      new THREE.Vector3(v0.position.x, v0.position.y, e1),
      new THREE.Vector3(v1.position.x, v1.position.y, e2)
    );
    // geometry.colors.extend(colorFn(edge));
  }
  var material = new THREE.LineBasicMaterial(
    {
      color: colors.white,
      // vertexColors: THREE.VertexColors,
      linewidth: 3
    }
  );
  var mesh = new THREE.LineSegments(geometry, material);
  addToScene(mesh);
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
    if (!data.render.polygon) {
      return [
        new THREE.Color( Util.lerpColor(low, high, center[prop]) ),
        new THREE.Color( Util.lerpColor(low, high, c1[prop]) ),
        new THREE.Color( Util.lerpColor(low, high, c2[prop]) )
      ];
    } else {
      var color = new THREE.Color( Util.lerpColor(low, high, center[prop]) );
      return [color, color, color];
    }
  };
  return colorFn
}

//------------------------------------------------------------------------------
//        Map Colorings
//------------------------------------------------------------------------------

// Polygon Colorings

function biomeColoring(center, c1, c2) {
  if (data.render.polygon || center.ocean && (!c1.ocean || !c2.ocean)) {
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
  if (data.render.polygon || center.ocean && (!c1.ocean || !c2.ocean)) {
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

// Edge colorings

function plateBoundarieColoring(edge) {
  var color;
  color = colors.good;
  // if (edge.boundaryType < 1) {
  //   color = Util.lerpColor(colors.convergent, colors.transform, edge.boundaryType);
  // } else {
  //   color = Util.lerpColor(colors.divergent, colors.transform, edge.boundaryType - 1);
  // }
  var threeColor = new THREE.Color(color);
  return [threeColor, threeColor];
}

//------------------------------------------------------------------------------
//        Map Overlays
//------------------------------------------------------------------------------



function addTowns() {

}
