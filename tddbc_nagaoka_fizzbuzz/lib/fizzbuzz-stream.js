var stream = require('stream');
var util   = require('util');

function FizzBuzzStream (max) {
    stream.Stream.call(this);

    this.readable = true;
    this.writable = true;
    this.buf = [];

    this.once('close', function () {
       var data; while (data = this.buf.shift()) {
            this.emit('data', data);
        }

        this.ended = true;
        this.readable = false;
        this.writable = false;

        this.emit('end');
    }.bind(this));

    this.pause();
}
util.inherits(FizzBuzzStream, stream.Stream);

FizzBuzzStream.prototype.grep = function (data) {
    return (typeof data !== 'undefined' && data !== null);
};
FizzBuzzStream.prototype.map = function (data) {
    var n = Number(data);
    return n % 15 === 0 ? 'FizzBuzz' :
           n %  3 === 0 ? 'Fizz' :
           n %  5 === 0 ? 'Buzz' : data;
};
FizzBuzzStream.prototype.destroy = function () {
    if (this.ended) return;

    this.emit('close');
};
FizzBuzzStream.prototype.end = function (data, enc) {
    if (this.ended) return;
    this.write(data, enc);
    this.destroy();
};
FizzBuzzStream.prototype.write = function (data, enc) {
    if (this.ended) return;
    if (! this.writable) return;

    var d = this.map(data);
    this.grep(d) && this.buf.push(d);

    this.resume();

    process.nextTick(function () {
        if (! this.ended) this.emit('drain');
    }.bind(this));

    return false;
};
FizzBuzzStream.prototype.resume = function () {
    if (this.ended) return;

    var that = this, _resume = function () {
        process.nextTick(function () {
            if (that.paused || ! that.readable || ! that.buf || that.buf.length === 0) return;

            var data = that.buf.shift();
            that.emit('data', data);

            _resume();
        });
    };

    delete this.paused;

    _resume();
};
FizzBuzzStream.prototype.pause = function () {
    if (this.ended) return;
    this.paused = true;
};

module.exports.FizzBuzzStream = FizzBuzzStream;

