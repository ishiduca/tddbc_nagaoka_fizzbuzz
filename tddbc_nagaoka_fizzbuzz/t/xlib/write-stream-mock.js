var stream = require('stream')
  , util   = require('util')
;

function WriteStreamMock (option) {
    stream.Stream.call(this);

    option || (option = {});

    this.writable = true;
    this.buf = (option.buf || []);

    this.on('error', function (err) {
        this.writable = false;
    }.bind(this));

    this.once('close', function _destroy () {
        this.writable = false;
        this.closed   = true;
        option.delete_buf === true && (delete this.buf);
    }.bind(this));
}

util.inherits(WriteStreamMock, stream.Stream);

var wp = WriteStreamMock.prototype;
wp.write = function (data, enc) {
    if (! this.writable) return;

    if (! this.buf) this.buf = [];
    this.buf.push(data);

    process.nextTick(function () {
        this.writable && this.emit('drain');
    }.bind(this));

    return false;
};
wp.end = function (data, enc) {
    if (! this.writable) return;

    this.writable = false;

    typeof data !== 'undefined' && data !== null && this.write(data, enc);

    this.destroy();
};
wp.destroy = function () {
    this.closed || this.emit('close');
};

module.exports = WriteStreamMock;
