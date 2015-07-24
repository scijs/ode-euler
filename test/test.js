'use strict';

var euler = require('../lib');
var assert = require('chai').assert;

describe("euler integration", function() {

  var integrator, f, y0;

  beforeEach(function() {
    f = function(dydt, y) {
      dydt[0] = -y[1];
      dydt[1] =  y[0];
    };

    y0 = new Float64Array([1,0]);

    integrator = euler( f, y0, 0, 1 );
  });

  it("takes a single timestep",function() {
    integrator.step();
    assert.closeTo( integrator.y[0], 1, 1e-4 );
    assert.closeTo( integrator.y[1], 1, 1e-4 );
  });

  it("takes multiple timesteps",function() {
    integrator.steps(2);
    assert.closeTo(integrator.y[0], 0, 1e-4 );
    assert.closeTo(integrator.y[1], 2, 1e-4);
  });

});

describe("euler integration with binding of extra data", function() {

  var integrator, f, y0;

  beforeEach(function() {

    var data = {
      scale: 2
    }

    f = function(dydt, y) {
      dydt[0] = -y[1] * this.scale;
      dydt[1] =  y[0] * this.scale;
    }.bind(data);

    y0 = new Float64Array([1,0]);

    integrator = euler( f, y0, 0, 1 );
  });

  it("takes a single timestep",function() {
    integrator.step();
    assert.closeTo( integrator.y[0], 1, 1e-4 );
    assert.closeTo( integrator.y[1], 2, 1e-4 );
  });

  it("takes multiple timesteps",function() {
    integrator.steps(2);
    assert.closeTo(integrator.y[0], -3, 1e-4 );
    assert.closeTo(integrator.y[1],  4, 1e-4);
  });

});
