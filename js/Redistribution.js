//------------------------------------------------------------------------------
// Theses function are used to redistribute data located in the range 0-1
// They take all the data and rearrange them and purturbe them slightly so that
// they fit a particular distrubution function. For example you can use these
// to push all the data points closer to 1 so that there are few points near 0
// each redistribution function has different properties.
//
// Properties of these functions
// the domain is (0-1) for the range (0-1)
// in this range the function is one to one
// f(0) == 0 and f(1) == 1

Redist = {};

Redist.identity = function(x) {
    return x;
}

Redist.inverse = function(x) {
    return 1 - x;
}

Redist.exp = function(x, amm=1, inc=true) {
    if (inc) {
        var nom = 1 - Math.exp(-amm * x);
        var denom = 1 - Math.exp(-amm);
    } else {
        var nom = Math.exp(amm * x) - 1;
        var denom = Math.exp(amm) - 1;
    }

    return nom / denom;
}

// Power Function eg sqrt qubrt
Redist.pow = function(x, amm=2, inc=true, skewDown=true) {
    if (inc) {
        if (skewDown) {
            return Math.pow(x, 1 / amm);
        } else{
            return 1 - Math.pow(1 - x, 3);
        }
    } else {
        if (skewDown) {
            return Math.pow(x, amm);
        } else{
            return 1 - Math.pow(1 - x, 1 / amm);
        }
    }
}

// trig functions

// Descretizes a continious function
Redist.step = function(x, steps=10) {
    return Math.floor(steps * x) / steps;
}