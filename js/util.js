// *****************************************************************************
// This file is ment to be used as a series of utility function that are added
// on top of the javascript framework. They are intended to make writing
// some javascript functionality easier. Some functions extend existing
// functionality and containers and others are used in their own context.
// This file is intended to be used for a dumping ground for useful functions
// that don't seem to have another practical location

// *****************************************************************************
// ********** Development Functions ********************************************

// A quick option for calling the console.log function
function print(args) {
  console.log(args)
}

// *****************************************************************************
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
// http://stackoverflow.com/questions/1374126/how-to-extend-an-existing-javascript-array-with-another-array

Array.prototype.extend = function(arr) {
  Array.prototype.push.apply(this, arr);
}

//------------------------------------------------------------------------------

Array.prototype.extendNew = function(arr) {
  for (var i = 0, l = arr.length; i < l; i++) {
    if (has(arr, i) && !this.contains(arr[i])) {
      this.push(arr[i]);
    }
  }
}

// Searches through the array and looks at the array element property to
// see if it matches value
Array.prototype.findProp = function(value, prop) {
  for (var i = 0, l = this.length; i < l; i++) {
    var ele = this[i];
    if (has(ele, prop) && ele[prop] == value) {
      return i;
    }
  }
  return -1;
}

// *****************************************************************************
// *********** Utility Functions ***********************************************

// Used for testing if an object contains a particular property
// http://stackoverflow.com/questions/7174748/javascript-object-detection-dot-syntax-versus-in-keyword/7174775#7174775
function has(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

//------------------------------------------------------------------------------

var Util = {};

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
// Not Using This One (But it is an option)
// http://stackoverflow.com/questions/11142884/fast-way-to-get-the-min-max-values-among-properties-of-object
//
// http://stackoverflow.com/questions/27376295/getting-key-with-the-highest-value-from-object
// Returns the key of the min/max element of the object
// params:
//  obj (Object): Javascript object
// returns (Key): The key of the min/max element of the input object

Util.objMax = function(obj) {
  return Object.keys(obj).reduce(function(a, b){ return obj[a] > obj[b] ? a : b });
}

Util.objMin = function(obj) {
  return Object.keys(obj).reduce(function(a, b){ return obj[a] < obj[b] ? a : b });
}

//------------------------------------------------------------------------------
// Comparison function to compare by property name

Util.propComp = function(prop) {
  return function(a, b) {
    return a[prop] - b[prop];
  }
}

//------------------------------------------------------------------------------
// https://stackoverflow.com/questions/11409895/whats-the-most-elegant-way-to-cap-a-number-to-a-segment
// Returns a number whose value is limited to the given range.
//
// param {Number} min The lower boundary of the output range
// param {Number} max The upper boundary of the output range
// @returns A number in the range [min, max]
// @type Number

Util.clamp = function(num, min, max) {
  return Math.min(Math.max(num, min), max);
};

//------------------------------------------------------------------------------
// Hexidecimal linear color interpolation by rosszurowski
// https://gist.github.com/rosszurowski/67f04465c424a9bc0dae
//
// @param {string} a : starting color
// @param {string} b : ending color
// @param {Number} amount : a float from 0.0 to 1.0
// @returns {string} : the hexidecimal interpolation from a to b by amount

Util.lerpColor = function(a, b, amount) {
  if (amount === undefined || amount == null || amount > 1.0 || amount < 0.0) {
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
