//------------------------------------------------------------------------------
//
//        DDDD     RRRR      AAA     W         W       333333    DDDD
//        D  DD    R   R    A   A    W         W      33    33   D   DD
//        D   DD   RRRR     AAAAA     WW  W  WW            33    D    DD
//        D  DD    R  RR   AA   AA     W WWW W        33    33   D   DD
//        DDDD     R   R   A     A     WW   WW         333333    DDDDD
//
//------------------------------------------------------------------------------
// Call in the main file by calling
// Draw3D.setUp3d(data);
// generating the map and then calling
// Draw3D.render(data);
// This needs to be cleaned up to get rid of dependencies with the main file
//------------------------------------------------------------------------------

Draw3D = {}

//------------------------------------------------------------------------------
// Render Functions

Draw3D.render = function(data) {

  Draw3D.updateRendererProperties(data);

  // Render a particular map type
  if (data.render.map == 'Biome') {
    Draw3D.draw3d(Draw3D.biomeColoring);
  } else if (data.render.map == 'Geological Provinces') {
    Draw3D.draw3d(Draw3D.geoProvinceColoring);
  } else if (data.render.map == 'Elevation') {
    Draw3D.draw3d(Draw3D.elevationColoring);
  } else if (data.render.map == 'Moisture') {
    Draw3D.draw3d(Draw3D.moistureColoring);
  } else if (data.render.map == 'Temperature') {
    Draw3D.draw3d(Draw3D.temperatureColoring);
  } else if (data.render.map == 'Living Conditions') {
    Draw3D.draw3d(Draw3D.livingConditionsColoring);
  } else if (data.render.map == 'White') {
    Draw3D.draw3d(Draw3D.white);
  } else {
    print(data.render.map + ' is not found.');
  }

  // Render map overlays
  if (data.render.windVectors) {
    Draw3D.showWindVectors(data);
  }

  if (data.render.plateBoundaries) {
    Draw3D.drawEdges(data.map.plates.edges, plateBoundarieColoring);
  }
}

//------------------------------------------------------------------------------
// Set up the WebGL renderer and necessary renderin objects for displaying
// the map

Draw3D.setUp3d = function(data) {
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

Draw3D.updateRendererProperties = function(data) {
  data.renderer.setSize(data.width, data.height);
  data.camera.position.set(data.width, data.height, 200);
  data.camera.left = data.width;
  data.camera.top = data.height;
  data.camera.updateProjectionMatrix();
}

//------------------------------------------------------------------------------
// Functions called to add different lighting setups to the scene

Draw3D.light2d = function(data) {
  Draw3D.addToScene(data, data.light2d);
}

Draw3D.light3d = function(data) {
  Draw3D.addToScene(data, data.light3d);
  // addToScene(data.light3dFill);
  Draw3D.addToScene(data, data.ambient);
}

//------------------------------------------------------------------------------
// Function to render the WebGL scene

Draw3D.renderScene = function(data) {
  data.renderer.render( data.scene, data.camera );
}

//------------------------------------------------------------------------------

// Removing old items from the scene
// http://stackoverflow.com/questions/37762961/three-js-proper-removing-object-from-scene-still-reserved-in-heap
Draw3D.clean = function(data) {
  if (data.removeableItems.length > 0 ) {
    data.removeableItems.forEach(function(v,i) {
       v.parent.remove(v);
    });
    data.removeableItems = null;
    data.removeableItems = [];
  }
}

Draw3D.addToScene = function(data, obj) {
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

Draw3D.draw3d = function(colorFn) {
  // Remove all the old objects in the scene
  Draw3D.clean(data);

  // Show either a 3D or 2D representation of the map
  var eleScale;
  if (data.render.draw3d) {
    Draw3D.light3d(data);
    eleScale = 50;
  } else {
    Draw3D.light2d(data);
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
  Draw3D.addToScene(data, terrain);

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
      var riverMat = new THREE.LineBasicMaterial( { color: DefaultColors.water, linewidth: 3 } );
      var rivers = new THREE.LineSegments(riverGeom, riverMat);
      Draw3D.addToScene(data, rivers);
    }
    if (data.render.coast) {
      var coastMat = new THREE.LineBasicMaterial( { color: DefaultColors.lightGray, linewidth: 3 } );
      var coast = new THREE.LineSegments(coastGeom, coastMat);
      Draw3D.addToScene(data, coast);
    }
  }

  Draw3D.renderScene(data);
}

//------------------------------------------------------------------------------
Draw3D.drawEdges = function(edges, colorFn) {
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
      color: DefaultColors.white,
      // vertexColors: THREE.VertexColors,
      linewidth: 3
    }
  );
  var mesh = new THREE.LineSegments(geometry, material);
  Draw3D.addToScene(data, mesh);
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

Draw3D.rampColoring = function(low, high, prop) {
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

Draw3D.biomeColoring = function(center, c1, c2) {
  if (data.render.polygon || center.ocean && (!c1.ocean || !c2.ocean)) {
    var color = new THREE.Color(DefaultColors[center.biome]);
    return [color, color, color];
  }
  return [
    new THREE.Color(DefaultColors[center.biome]),
    new THREE.Color(DefaultColors[c1.biome]),
    new THREE.Color(DefaultColors[c2.biome])
  ];
}

Draw3D.geoProvinceColoring = function(center, c1, c2) {
  if (data.render.polygon || center.ocean && (!c1.ocean || !c2.ocean)) {
    var color = new THREE.Color(DefaultColors[center.geoProvince]);
    return [color, color, color];
  }
  return [
    new THREE.Color(DefaultColors[center.geoProvince]),
    new THREE.Color(DefaultColors[c1.geoProvince]),
    new THREE.Color(DefaultColors[c2.geoProvince])
  ];
}

Draw3D.elevationColoring = Draw3D.rampColoring(DefaultColors.black, DefaultColors.white, 'elevation');

Draw3D.moistureColoring = Draw3D.rampColoring(DefaultColors.coast, DefaultColors.land, 'moisture');

Draw3D.temperatureColoring = Draw3D.rampColoring(DefaultColors.cold, DefaultColors.hot, 'temperature');

Draw3D.livingConditionsColoring = Draw3D.rampColoring(DefaultColors.bad, DefaultColors.good, 'livingCondition');

Draw3D.white = function(center, c1, c2) {
  return [new THREE.Color(), new THREE.Color(), new THREE.Color()];
}

// Edge colorings

Draw3D.plateBoundarieColoring = function(edge) {
  var color;
  color = DefaultColors.good;
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

Draw3D.showWindVectors = function() {

  var windGeom = new THREE.Geometry();
  vert = 0;

  for (i = 0; i < data.map.corners.length; i++) {
    var corner = data.map.corners[i];
    var pos = corner.position;

    var perpVectors = corner.wind.perpendiculars();

    var p1 = Vector.add(pos, (perpVectors[0].multiply(4)));
    var p2 = Vector.add(pos, (perpVectors[1].multiply(4)));
    var p3 = Vector.add(pos, (corner.wind.multiply(10)));

    windGeom.vertices.push(
      new THREE.Vector3(p1.x, p1.y, 50),
      new THREE.Vector3(p2.x, p2.y, 50),
      new THREE.Vector3(p3.x, p3.y, 50)
    );

    var face = new THREE.Face3(vert, vert+1, vert+2);
    face.vertColors = [new THREE.Color(255, 255, 255),
                       new THREE.Color(255, 255, 255),
                       new THREE.Color(255, 255, 255)];

    windGeom.faces.push(face);
    vert += 3;
  }
  windGeom.computeFaceNormals();
  windGeom.computeVertexNormals();

  var windMat = new THREE.MeshNormalMaterial (
    {
      shading: THREE.FlatShading
    }
  );

  var windMesh = new THREE.Mesh(windGeom, windMat);
  Draw3D.addToScene(data, windMesh);

  print(windMesh)
}

Draw3D.addTowns = function() {

}