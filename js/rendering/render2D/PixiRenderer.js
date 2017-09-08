PixiRenderer = function(divID) {

    this.renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.view);
    // document.getElementById(divID).appendChild(this.renderer.view);

    this.renderer.view.style.position = "absolute";
    this.renderer.view.style.display = "block";
    // this.renderer.autoResize = true;
    this.renderer.backgroundColor = Util.strToHex(DefaultColors.ocean);

    this.stage = new PIXI.Container();
}

PixiRenderer.prototype.render = function(map, params) {

    this.stage.removeChildren();


    var colorFn;

    // Render a particular map type
    if (params.map == 'Biome') {
        if (params.draw3d) {
            colorFn = MapColoring.biomeElevationColoring;
        } else {
            colorFn = MapColoring.biomeColoring;    
        }
    } else if (params.map == 'Geological Provinces') {
        colorFn = MapColoring.geoProvinceColoring;
    } else if (params.map == 'Elevation') {
        colorFn = MapColoring.elevationColoring;
    } else if (params.map == 'Moisture') {
        colorFn = MapColoring.moistureColoring;
    } else if (params.map == 'Temperature') {
        colorFn = MapColoring.temperatureColoring;
    } else if (params.map == 'Living Conditions') {
        colorFn = MapColoring.livingConditionsColoring;
    } else if (params.map == 'White') {
        colorFn = MapColoring.white;
    } else {
        print(data.render.map + ' is not found.');
    }

    this.renderPolygons(map, colorFn);

    if (params.towns) {
        this.renderTowns(map);
    }

    this.renderEdges(map, params);

    if (params.plateBoundaries) {
        this.renderPlates(map);
    }

    if (params.wind) {
        this.renderWind(map);
    }

    this.renderer.render(this.stage);
}


//------------------------------------------------------------------------------
// Polygon Rendering
//------------------------------------------------------------------------------

PixiRenderer.prototype.renderPolygons = function(map, colorFn) {
    for (var i = 0; i < map.centers.length; i++) {
        var center = map.centers[i];
        var color = colorFn(center);

        var polyPath = [];
        for (var k = 0; k < center.corners.length; k++) {
            var cornerPos = center.corners[k].position;
            polyPath.push(new PIXI.Point(cornerPos.x, cornerPos.y));
        }

        var polygon = new PIXI.Graphics();
        polygon.beginFill(color);
        polygon.drawPolygon(polyPath);
        polygon.endFill();

        this.stage.addChild(polygon);
    }
}


//------------------------------------------------------------------------------
// Edge Rendering
//------------------------------------------------------------------------------

PixiRenderer.prototype.renderEdges = function(map, params) {
    for (var i = 0; i < map.edges.length; i++) {
        var edge = map.edges[i];

        // Run through the different edge drawing possibilities
        // Long term I don't think this is the best place for this
        if (params.rivers && edge.river) {

            var line = new PIXI.Graphics();
            line.lineStyle(Math.sqrt(edge.river), Util.strToHex(DefaultColors.water), 1);
            line.moveTo(edge.v0.position.x, edge.v0.position.y);
            line.lineTo(edge.v1.position.x, edge.v1.position.y);
            this.stage.addChild(line);

        } else if (params.coast && edge.coast) {

            var line = new PIXI.Graphics();
            line.lineStyle(2, Util.strToHex(DefaultColors.lightGray), 1);
            line.moveTo(edge.v0.position.x, edge.v0.position.y);
            line.lineTo(edge.v1.position.x, edge.v1.position.y);
            this.stage.addChild(line);
        }
    }
}


//------------------------------------------------------------------------------
// Overlays
//------------------------------------------------------------------------------

PixiRenderer.prototype.renderTowns = function(map) {
    for (var i = 0; i < map.towns.length; i++) {
        var town = map.towns[i];
        var color = MapColoring.towns();

        var polyPath = [];
        for (var k = 0; k < town.corners.length; k++) {
            var cornerPos = town.corners[k].position;
            polyPath.push(new PIXI.Point(cornerPos.x, cornerPos.y));
        }

        var polygon = new PIXI.Graphics();
        polygon.beginFill(color);
        polygon.drawPolygon(polyPath);
        polygon.endFill();

        this.stage.addChild(polygon);
    }
}

PixiRenderer.prototype.renderPlates = function(map) {
    for (var i = 0; i < map.plates.edges.length; i++) {
        var edge = map.plates.edges[i];

        var line = new PIXI.Graphics();
        line.lineStyle(2, Util.strToHex(DefaultColors.black), 1);
        line.moveTo(edge.v0.position.x, edge.v0.position.y);
        line.lineTo(edge.v1.position.x, edge.v1.position.y);
        this.stage.addChild(line);
    }

    for (var i = 0; i < map.boundaries.length; i++) {
        var boundary = map.boundaries[i];

        var color;
        if (boundary.type == "convergent") {
            color = DefaultColors.convergent;
        } else if (boundary.type == "divergent") {
            color = DefaultColors.divergent;
        } else if (boundary.type == "transform") {
            color = DefaultColors.transform;
        } else {
            color = DefaultColors.Magenta;
        }

        var line = new PIXI.Graphics();
        line.lineStyle(2, Util.strToHex(color), 1);
        line.moveTo(boundary.p1.x, boundary.p1.y);
        line.lineTo(boundary.p2.x, boundary.p2.y);
        this.stage.addChild(line);
    }
}

PixiRenderer.prototype.renderWind = function(map) {
    var size = 7;

    for (var i = 0; i < map.centers.length; i++) {
        var center = map.centers[i];
        var pos = center.position;

        var line = new PIXI.Graphics();
        line.lineStyle(2, Util.strToHex(DefaultColors.black), 1);
        line.moveTo(pos.x, pos.y);
        line.lineTo(pos.x + center.wind.x * size, pos.y + center.wind.y * size);
        line.drawCircle(pos.x + center.wind.x * size, pos.y + center.wind.y * size, 1);
        this.stage.addChild(line);
    }
}