'use strict'

var euler = require('../lib')
  , assert = require('chai').assert
  , richardson = require('richardson-extrapolation')


var ctors = {
  'float32': Float32Array,
  'float64': Float64Array,
  'array': function(){ return arguments[0] }
}

Object.keys(ctors).forEach(function(dtype) {
  var ctor = ctors[dtype]

  describe('euler integration (' + dtype + ')', function() {

    describe('integration of one variable', function() {
      var integrator, f, y0, t0, n

      beforeEach(function() {
        f = function(dydt, y) { dydt[0] = -y[0] }
        t0 = 1.5
        y0 = new ctor([1])
        n = 100

        integrator = euler( y0, f, t0, 1/n )
      })

      it('creates work arrays of the same size as the input',function() {
        assert.equal( integrator._yp.constructor,  y0.constructor )
      })

      it('creates work arrays of the same type as the input',function() {
        assert.equal( integrator._yp.length,  y0.length )
      })

      it('takes multiple timesteps',function() {
        integrator.steps(n)
        assert.closeTo(integrator.y[0], Math.exp(-1), 1e-2 )
      })
    })


    describe('integration of two variables', function() {
      var integrator, f, y0, t0

      beforeEach(function() {
        f = function(dydt, y) {
          dydt[0] = -y[1]
          dydt[1] =  y[0]
        }

        t0 = 1.5
        y0 = new ctor([1,0])

        integrator = euler( y0, f, t0, 1 )
      })

      it('creates work arrays of the same size as the input',function() {
        assert.equal( integrator._yp.constructor,  y0.constructor )
      })

      it('creates work arrays of the same type as the input',function() {
        assert.equal( integrator._yp.length,  y0.length )
      })


      it("takes a single timestep",function() {
        integrator.step()
        assert.closeTo( integrator.y[0], 1, 1e-4 )
        assert.closeTo( integrator.y[1], 1, 1e-4 )
      })

      it("increments the time",function() {
        integrator.step()
        assert.closeTo( integrator.t, t0 + integrator.dt, 1e-4 )
        integrator.step()
        assert.closeTo( integrator.t, t0 + 2*integrator.dt, 1e-4 )
      })

      it("takes multiple timesteps",function() {
        integrator.steps(2)
        assert.closeTo(integrator.y[0], 0, 1e-4 )
        assert.closeTo(integrator.y[1], 2, 1e-4)
      })

    })

    describe('euler integration with binding of extra data (' + dtype + ')', function() {

      var integrator, f, y0

      beforeEach(function() {

        var data = {
          scale: 2
        }

        f = function(dydt, y) {
          dydt[0] = -y[1] * this.scale
          dydt[1] =  y[0] * this.scale
        }.bind(data)

        y0 = new ctor([1,0])

        integrator = euler( y0, f, 0, 1 )
      })

      it("takes a single timestep",function() {
        integrator.step()
        assert.closeTo( integrator.y[0], 1, 1e-4 )
        assert.closeTo( integrator.y[1], 2, 1e-4 )
      })

      it("takes multiple timesteps",function() {
        integrator.steps(2)
        assert.closeTo(integrator.y[0], -3, 1e-4 )
        assert.closeTo(integrator.y[1],  4, 1e-4)
      })

    })

    describe('convergence', function() {

      it('local truncation error is ~ O(h^2) in time', function() {
        // Integrate an exponential: dy/dt = -y  -->  y = exp(-t)
        var result = richardson(function(h) {
          var f = function(dydt, y) { dydt[0] = -y[0] }
          return euler( new ctor([1]), f, 0, h ).step().y[0] - Math.exp(-h)
        }, [0.06,0.01], { f: 0 } )

        assert.closeTo( result.n, 2, 1e-2, 'n ~ 2' )
      })


      it('local truncation error is order O(h^2)', function() {
        var result = richardson(function(h) {

          // Integrate along a sector of a circle:
          var f = function(dydt, y) { dydt[0] = -y[1]; dydt[1] =  y[0] }
          var i = euler( new ctor([1,0]), f, 0, h ).step()

          // Return the distance from the expected endpoint:
          return Math.sqrt( Math.pow(i.y[0]-Math.cos(h),2) + Math.pow(i.y[1]-Math.sin(h),2) )

        }, 2*Math.PI/100, { f: 0 } )

        assert.closeTo( result.n, 2, 1e-2, 'n ~ 2' )
      })

      it('total accumulated error is order O(h^1)', function() {

        var result = richardson(function(h) {

          // Integrate around a circle with this step size:
          var f = function(dydt, y) { dydt[0] = -y[1]; dydt[1] =  y[0] }
          var i = euler( new ctor([1,0]), f, 0, h ).steps( Math.floor(2*Math.PI/h + 0.5) )

          // Return the distance from the expected endpoint:
          return Math.sqrt( Math.pow(i.y[0]-1,2) + Math.pow(i.y[1],2) )

        }, 2*Math.PI/100, { f: 0 } )

        assert.closeTo( result.n, 1, 1e-1, 'n ~ 1' )
      })

      it('total accumulated error is order O(h^1) in all variables', function() {

        var result = richardson(function(h) {
          // Integrate around a circle at an accelerating rate
          var f = function(dydt, y, t) {
            var s =  Math.sin(t * Math.PI) * Math.PI / 2
            dydt[0] = -y[1]* 2 * Math.PI * s
            dydt[1] =  y[0]* 2 * Math.PI * s
          }
          var i = euler( new ctor([1,0]), f, 0, h ).steps( Math.floor(1/h+0.5))

          // Return the distance from the expected endpoint:
          return Math.sqrt( Math.pow(i.y[0]-1,2) + Math.pow(i.y[1],2) )

        }, 0.001, { f: 0 } )

        assert.closeTo( result.n, 1, 1e-2, 'n ~ 1' )
      })



    })

  })

})
