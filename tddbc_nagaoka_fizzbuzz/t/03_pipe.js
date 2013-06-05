(function (BASIC_TEST) {
    var path = require('path');

    BASIC_TEST( require(path.join( __dirname, '../lib/count-stream')).CountStream
              , require(path.join( __dirname, '../lib/fizzbuzz-stream')).FizzBuzzStream
              , require(path.join( __dirname, './xlib/write-stream-mock'))
              , require(path.join( __dirname, 'qunit/helper')).QUnit
    );

})(function BASIC_TEST (CountStream, FizzBuzzStream, WriteStream, QUnit) {

    asyncTest('count.pipe(writeMock);', function () {
        var count = new CountStream(16);
        var writeMock = new WriteStream;
        var expectation = ('1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16').split(' ');

        writeMock.on('close', function () {
            deepEqual(writeMock.buf, expectation, JSON.stringify(writeMock.buf));
            start();
        });
        count.pipe(writeMock);
        count.resume();
    });

    asyncTest('count.pipe(fizzbuzz).pipe(writeMock);', function () {
        var count = new CountStream(16);
        var writeMock = new WriteStream;
        var expectation = ('1 2 Fizz 4 Buzz Fizz 7 8 Fizz Buzz 11 Fizz 13 14 FizzBuzz 16').split(' ');

        writeMock.on('close', function () {
            deepEqual(writeMock.buf, expectation, JSON.stringify(writeMock.buf));
            start();
        });
        count.pipe(new FizzBuzzStream).pipe(writeMock);
        count.resume();
    });

    asyncTest('count.pipe(fizzbuzz).pipe(writeMock);', function () {
        var count = new CountStream(16);
        var writeMock = new WriteStream;
        var expectation = ('1 2 Fizz 4 Buzz Fizz 7 8 Fizz Buzz 11 Fizz 13 14 FizzBuzz 16').split(' ');

        writeMock.on('close', function () {
            deepEqual(writeMock.buf, expectation, JSON.stringify(writeMock.buf));
            start();
        });
        count.pipe(new FizzBuzzStream).pipe(writeMock);
        count.resume();
    });

    asyncTest('timer.pipe(fizzbuzz).pipe(writeMock)', function () {
        var fizzbuzz  = new FizzBuzzStream;
        var writeMock = new WriteStream;
        var timer     = new (require('stream').Stream);
        timer.readable = true;
        timer.count    = 0;
        timer.finish   = 16;

        var expectation = ('1 2 Fizz 4 Buzz Fizz 7 8 Fizz Buzz 11 Fizz 13 14 FizzBuzz 16').split(' ');

        timer.resume = function () {
            if (! this.readable) return;

            this.iv = setInterval(function () {
                (this.count >= this.finish)
                  ? this.destroy()
                  : this.emit('data', (this.count += 1).toString());
            }.bind(this), 10);

        };
        timer.destroy = function () {
            if (! this.readable) return;

            this.readable = false;
            clearInterval( this.iv ); delete this.iv;

            this.emit('close');
        };
        timer.pause = function () {
            if (! this.readable) return;

            clearInterval( this.iv ); delete this.iv;
        }
        timer.once('close', function () { this.emit('end'); }.bind(timer));
        timer.on('error',   function (er) { this.destroy(); }.bind(timer));

        timer.pause();

        timer.pipe(fizzbuzz).pipe(writeMock);

        writeMock.once('close', function () {
            deepEqual(writeMock.buf, expectation, JSON.stringify(writeMock.buf));
            start();
        });

        timer.resume();
    });

    asyncTest('count.pipe(fizzbuzz).pipe(delay)', function () {
        var expectation = ('1 2 Fizz 4 Buzz Fizz 7 8 Fizz Buzz 11 Fizz 13 14 FizzBuzz 16').split(' ');
        var count    = new CountStream(16);
        var fizzbuzz = new FizzBuzzStream;
        var delay    = new (require('stream').Stream);

        delay.buf = [];
        delay.writable = true;

        delay.write = function (data) {
            if (! this.writable) return;
            typeof data !== 'undefined' && data !== null && this.buf.push(data);

            setTimeout(function () {
                if (this.writable) this.emit('drain');
            }.bind(this), 100);

            return false;
        };
        delay.end = function (data) {
            if (! this.writable) return;

            this.write(data);

            this.destroy();
        };
        delay.destroy = function () {
            if (! this.writable) return;

            this.writable = false;
            this.emit('close');
        };

        count.pipe(fizzbuzz).pipe(delay);

        delay.on('close', function () {
            deepEqual(delay.buf, expectation, JSON.stringify(delay.buf));
            start();
        });

        count.resume();

    });

});
