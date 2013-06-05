var stream = require('stream');
var util   = require('util');

function CountStream (max) {
    stream.Stream.call(this);

    if (typeof max !== 'number'   ||
        parseInt(max, 10) !== max ||
        max <= 0
    ) {
        throw new TypeError('"max" must be "Integer Number" and over "0"');
    }

    this.max   = max;
    this.count = 0;

    this.readable = true;

    this.once('close', function () {
        this.readable = false;
        this.emit('end');
    }.bind(this));

    this.on('error', function () {
        this.readable = false;
    }.bind(this));
}

util.inherits(CountStream, stream.Stream);

CountStream.prototype.resume = function () {
    var that = this;
    var count = function () {
        process.nextTick(function () {
            if (that.paused || ! that.readable) return;
            if (that.count >= that.max) return that.destroy();

            that.emit('data', (that.count += 1).toString());
            count();
        });
    };

    delete this.paused;
    count();
};
CountStream.prototype.pause = function () {
    if (! this.readable) return;
    this.paused = true;
};
CountStream.prototype.destroy = function () {
    if (! this.readable) return;
    this.emit('close');
};

module.exports = function (c) { return new CountStream(c) };
module.exports.CountStream = CountStream;
