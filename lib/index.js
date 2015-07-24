'use strict'

var dtypeOf = require('compute-dtype')
var getCtor = require('compute-array-constructors')

module.exports = integratorFactory

var Integrator = function Integrator( dydt, y, t, dt ) {
  var ctor, dtype

  // Bind variables to this:
  this.dydt = dydt
  this.y = y
  this.n = this.y.length
  this.dt = dt
  this.t = t

  // Create a scratch array into which we compute the derivative:
  dtype = dtypeOf( y )
  ctor = getCtor( dtype )
  this.yp = new ctor( this.n )
}

Integrator.prototype.step = function() {

  this.dydt( this.dydt, this.y, this.t )

  for(var i=0; i<this.n; i++) {
    this.y[i] += this.dydt[i] * this.dt
  }

  this.t += this.dt
  return this
}

Integrator.prototype.steps = function( n ) {
  for(var step=0; step<n; step++) {
    this.step()
  }
  return this
}

function integratorFactory( dydt, y, t, dt) {
  var integrator = new Integrator( dydt, y, t, dt)
  return integrator
}
