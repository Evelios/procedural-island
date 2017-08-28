// This file is a module to the map.js function
// The purpose of this function is to generate landforms from a point
// distribution

var LandForms = {};

//------------------------------------------------------------------------------
// This function assigns the values of ocean, water (!land), and coast to
// center tiles and corner points. Ocean tiles are water tiles that are
// connected to the border of the map. Coast tiles are tiles that have a
// neighbors that are ocean tiles and land tiles

LandForms.assignOceanCoastAndLand = function(map) {

    // Assign corner type water
    for (var i = 0; i < map.corners.length; i++) {
        var corner = map.corners[i];
        corner.water = !map.islandShape(corner.position);
        corner.ocean = false;
    }

    var queue = [];

    // Assign border corners and centers to ocean tiles
    // and add the center tiles to the queue for ocean flood filling
    for (var i = 0; i < map.centers.length; i++) {
        var center = map.centers[i];

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
             numWater >= center.corners.length * map.lakeThreshold);
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
    for (var i = 0; i < map.centers.length; i++) {
        var center = map.centers[i];
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
    for (var k = 0; k < map.corners.length; k++) {
        var corner = map.corners[k];

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

    // Assign coast value to edge tiles
    for (var i = 0; i < map.edges.length; i++) {
        var edge = map.edges[i];
        edge.coast = edge.v0.coast && edge.v1.coast &&
            (edge.d0.ocean || edge.d1.ocean) &&
            (!edge.d0.water || !edge.d1.water);
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

LandForms.generateTectonicPlates = function(map) {

    // Tuneable parameters
    var numPlates = 20;
    var numRelaxations = 1;

    var points = map.generateRandomPoints(numPlates);

    // Create the voronoi diagram of the points
    map.plates = map.generateDiagram(points, numRelaxations);

    for (var i = 0; i < map.plates.centers.length; i++) {
        var plate = map.plates.centers[i];
        plate.tiles = []
    }

    // Assign map polygons to their corresponding plates
    for (var i = 0; i < map.centers.length; i++) {
        var tile = map.centers[i];

        var minDistance = Infinity;
        var minIndex = -1;
        // Find closest plate to the current point
        for (var k = 0; k < map.plates.centers.length; k++) {
            var plate = map.plates.centers[k];

            var distance = Vector.distance(tile.position, plate.position);
            if (distance < minDistance) {
                minDistance = distance;
                minIndex = k;
            }
        }
        map.plates.centers[minIndex].tiles.push(tile);
    }

    // Determine if the plate is an oceanic plate or a continental plate
    // plateType goes from 0 to 1 from oceanic to continental
    for (var i = 0; i < map.plates.centers.length; i++) {
        var plate = map.plates.centers[i];
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
    for (var i = 0; i < map.plates.centers.length; i++) {
        var plate = map.plates.centers[i];

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
    for (var i = 0; i < map.plates.edges.length; i++) {
        var edge = map.plates.edges[i];
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

    map.boundaries = [];

    // Collect Boundaries
    for (var i = 0; i < map.plates.edges.length; i++) {
        var edge = map.plates.edges[i];

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
            map.boundaries.push(boundary);
        }
    }
}

//------------------------------------------------------------------------------
// Assign Geological Provinces based off the plate boundaries
// 'orogen' provinces are located near convergen boundaries.
// 'basin' provinces are located just outside orogen boundaries and near
//  convergent land boundaries
// 'craton' provinces are all the other land tiles
// 'ocean' provinces are allt the ocean tiles

LandForms.assignCornerGeoProvinces = function(map) {

    // new Seed for the geo province map
    noise.seed(Util.rand());

    // Assign Geological Province: craton, orogen, basin, ocean
    // By default ocean is ocean and not ocean (including lakes) is craton
    for (var i = 0; i < map.corners.length; i++) {
        var corner = map.corners[i];

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
            var noiseOffset = 40 * noise.perlin2(x * scale / map.width, y * scale / map.height);

            for (var k = 0; k < map.boundaries.length; k++) {
                var boundary = map.boundaries[k];

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
// Assign polygon geological provinces based on which province is most common
// among the tiles corner provinces

LandForms.assignPolygonGeoProvinces = function(map) {
    // Polygon is the most common province of all its corners
    for (var i = 0; i < map.centers.length; i++) {
        var center = map.centers[i];

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
