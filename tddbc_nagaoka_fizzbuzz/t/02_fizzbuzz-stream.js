(function (BASIC_TEST) {
    var path = require('path');

    var QUnit  = require(path.join( __dirname, 'qunit/helper')).QUnit;
    var WSMock = require(path.join( __dirname, 'xlib/write-stream-mock'));

    var CountStream = require(path.join(
                      __dirname, '../lib/count-stream')).CountStream;
    var FizzBuzzStream = require(path.join(
                      __dirname, '../lib/fizzbuzz-stream')).FizzBuzzStream;

    BASIC_TEST(CountStream, FizzBuzzStream, {QUnit: QUnit, WSMock: WSMock});


})(function (CountStream, FizzBuzzStream, opt) {
    var is  = opt.QUnit.strictEqual;
    var mod = opt.QUnit.module;

    mod('count16.pipe(fizzbuzz).pipe(writeStream)', {
        setup: function () {
            this.count = new CountStream(16);
            this.fizz  = new FizzBuzzStream;
            this.ws    = new opt.WSMock;
            this.list  = ('1 2 Fizz 4 Buzz Fizz 7 8 Fizz Buzz 11 Fizz 13 14 FizzBuzz 16').split(' ');
        }
    });

    asyncTest('', function () {
        var count = this.count;
        var fizz  = this.fizz;
        var ws    = this.ws;
        var list  = this.list;

        count.pipe(fizz).pipe(ws);

        fizz.on('end', function () {
            deepEqual(ws.buf, list, JSON.stringify(list));
            deepEqual(fizz.buf, [], JSON.stringify(fizz.buf));
            start();
        });

        count.resume();
    });

    mod('back pressure', {
        setup: function () {
            var stream = require('stream');
            var s = this.s = new stream.Stream;
            s.readable = true;
            s.count = 0; s.max = 16;
            s.resume = function () {
                if (! this.readable) return;

                this.paused = null;

                var that = this, loop = function () {
                    setTimeout(function () {
                        if ((that.count += 1) > that.max) {
                            return that.destroy();
                        }
                        that.emit('data', that.count.toString());
                        loop();
                    }, 100);
                };

                process.nextTick(function () { loop(); });

                return false;
            };
            s.puase = function () {
                if (! this.readable) return;
                this.paused = true;
            };
            s.destroy = function () {
                if (! this.readable) return;
                this.emit('close');
                this.readable = false;
            };
            s.once('close', function () {
                if (! this.readable) return;
                this.emit('end');
                this.readable = false;
            });
            s.once('end', function () {
                if (! this.readable) return;
                this.readable = false;
            });
        }
    });
    asyncTest('use Timer', function () {
        var fizzbuzz = new FizzBuzzStream;
        var actual = [];

        this.s.pipe(fizzbuzz);

        fizzbuzz.on('data', function (s) { actual.push(s); });
        fizzbuzz.on('end', function () {
            deepEqual( actual
              , ('1 2 Fizz 4 Buzz Fizz 7 8 Fizz Buzz 11 Fizz 13 14 FizzBuzz 16').split(' ')
              , actual.join(', ')
            );
            start();
        });

        this.s.resume();
    });

});

