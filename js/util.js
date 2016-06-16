var Util = {};

// ********** Development Functions ********************************************

// A quick option for calling the console.log function
function print(args) {
  console.log(args)
}

// ********** Structures *******************************************************

var Vector = function(x, y) {
  // A 2d vector object

  this.x = x;
  this.y = y;

  this.add = function(other) {
    return new Vector(this.x + other.x, this.y + other.y);
  };

  this.subtract = function(other) {
    return new Vector(this.x - other.x, this.y - other.y);
  }

  this.multiply = function(scalar) {
    return new Vector(this.x * scalar, this.y * scalar);
  }

  this.divide = function(scalar) {
    return new Vector(this.x / scalar, this.y / scalar);
  }

  this.dot = function(other) {
      return this.x * other.x + this.y * other.y;
  }

  this.magnitude = function() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  this.normalize = function() {
    return this.divide(this.magnitude());
  }

  this.midpoint = function(other) {
    return new Vector((this.x + other.x) / 2, (this.y + other.y) / 2);
  }

  // Returns an array representation of x and y
  // which can be used as keys in a hash
  this.asKey = function() {
    return [x, y];
  }
}

Vector.proj = function(a, b) {
  return b.multiply(a.dot(b) / Math.pow(b.magnitude(), 2) );
}


// Return the angle between two vectors in radians
Vector.angle = function(a, b) {
  return acos(a.dot(b) / (a.magnitude() * b.magnitude()));
}
//------------------------------------------------------------------------------

Vector.distance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return Math.sqrt(dx*dx + dy*dy);
}

// ********** Modifier Functions ***********************************************

// Checks to see if an object is in the array
Array.prototype.contains = function(obj) {
  return this.indexOf(obj) > -1;
}

//------------------------------------------------------------------------------
// Adds an object only if it is unique
Array.prototype.pushNew = function(obj) {
  if (!this.contains(obj)) {
    this.push(obj);
  }
}

//------------------------------------------------------------------------------

Array.prototype.extend = function(arr) {
  Array.push.apply(this, arr);
}

//------------------------------------------------------------------------------

Array.prototype.extendNew = function(arr) {
  for (var i = 0, l = arr.length; i < l; i++) {
    if (has(arr, i) && !this.contains(arr[i])) {
      this.push(arr[i]);
    }
  }
}


// *********** Utility Functions ***********************************************

// Used for testing if an object contains a particular property
// http://stackoverflow.com/questions/7174748/javascript-object-detection-dot-syntax-versus-in-keyword/7174775#7174775
function has(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

//------------------------------------------------------------------------------
// Returns a random number between 0 (inclusive) and 1 (exclusive
Util.rand = function() {
  return Math.random();
}

//------------------------------------------------------------------------------
// Returns a random number between min (included) and max(excluded)
Util.randRange = function(min, max) {
  return Math.random() * (max - min) + min;
}

//------------------------------------------------------------------------------
// Returns a random integer from min (included) to max (excluded)
Util.randInt = function(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

//------------------------------------------------------------------------------
// Returns a random integer from min (included) to max (included)
Util.randIntInclusive = function(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

//------------------------------------------------------------------------------
// Generates a random hexidecimal color
// http://www.paulirish.com/2009/random-hex-color-code-snippets/
Util.randHexColor = function() {
  return '#' + Math.floor(Math.random() * 16777215).toString(16);
}

//------------------------------------------------------------------------------
// Comparison function for sorting polygon points in clockwise order
// assuming a convex polygon
// http://stackoverflow.com/questions/6989100/sort-points-in-clockwise-order
Util.comparePolyPoints = function(c) {
  var center = c.position;
  return function(p1, p2) {
    var a = p1.position, b = p2.position;

    if (a.x - center.x >= 0 && b.x - center.x < 0)
      return -1;
    if (a.x - center.x < 0 && b.x - center.x >= 0)
      return 1;
    if (a.x - center.x == 0 && b.x - center.x == 0) {
      if (a.y - center.y >= 0 || b.y - center.y >= 0) {
        if (a.y > b.y) {
          return -1;
        } else {
          return 1;
        }
      }
      if (b.y > a.y) {
        return -1;
      } else {
        return 1;
      }
    }

    // compute the cross product of vectors (center -> a) x (center -> b)
    var det = (a.x - center.x) * (b.y - center.y) - (b.x - center.x) * (a.y - center.y);
    if (det < 0)
        return -1;
    if (det > 0)
        return 1;

    // points a and b are on the same line from the center
    // check which point is closer to the center
    var d1 = (a.x - center.x) * (a.x - center.x) + (a.y - center.y) * (a.y - center.y);
    var d2 = (b.x - center.x) * (b.x - center.x) + (b.y - center.y) * (b.y - center.y);
  if (d1 > d2) {
    return -1;
  } else {
    return 1;
  }

  }
}

//------------------------------------------------------------------------------
// Comparison function to compare by property name

Util.propComp = function(prop) {
  return function(a, b) {
    return a[prop] - b[prop];
  }
}

//------------------------------------------------------------------------------
// Hexidecimal linear color interpolation by rosszurowski
// https://gist.github.com/rosszurowski/67f04465c424a9bc0dae
//
// @param {string} a : starting color
// @param {string} b : ending color
// @param {Number} amount : a float from 0.0 to 1.0
// @returns {string} : the hexidecimal interpolation from a to b by amount

Util.lerpColor = function(a, b, amount) {
  if (amount === undefined || amount == null || amount > 1.0) {
    return '#FF00FF';
  }

  var ah = parseInt(a.replace(/#/g, ''), 16),
      ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
      bh = parseInt(b.replace(/#/g, ''), 16),
      br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,
      rr = ar + amount * (br - ar),
      rg = ag + amount * (bg - ag),
      rb = ab + amount * (bb - ab);

  return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1);
}

//------------------------------------------------------------------------------
// Hexidecimal to rgba color converter
//
// @param {string}: hex color
// @param {Number}: float value from 0 to 1 contaiing the alpha value
// @returns {string}: string representation of the rgb value with added aplha

Util.hexToRgb = function(hex, a) {
  var h = parseInt(hex.replace(/#/g, ''), 16);
  var r = h >> 16;
  var g = h >> 8 & 0xff;
  var b = h & 0xff;
  if (a === undefined) {
    return Util.rgb(r, g, b);
  }
  return Util.rgba(r, g, b, a);
}

//------------------------------------------------------------------------------
// Converts rgb values into a string representation of the rgb value

Util.rgb = function(r, g, b) {
  var r = Math.floor(r);
  var g = Math.floor(g);
  var b = Math.floor(b);
  return ['rgb(', r, ',', g, ',', b, ')'].join('');
}

//------------------------------------------------------------------------------
// Converts rgb values into a string representation of the rgba value

Util.rgba = function(r, g, b, a) {
  var r = Math.floor(r);
  var g = Math.floor(g);
  var b = Math.floor(b);
  if (a < 0.0) a = 0.0;
  if (a > 1.0) a = 1.0;
  return ['rgba(', r, ',', g, ',', b, ',', a, ')'].join('');
}

//------------------------------------------------------------------------------
// RGB color to hexidecimal color converter
// http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb


Util.rgbToHex = function(r, g, b) {
  function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
}
