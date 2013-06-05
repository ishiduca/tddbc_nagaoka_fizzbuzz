(function (BASIC_TEST) {
    var path = require('path');

    var QUnit  = require(path.join( __dirname, 'qunit/helper')).QUnit;

    var CountStream = require(path.join(
                      __dirname, '../lib/count-stream')).CountStream;
    var FizzBuzzStream = require(path.join(
                      __dirname, '../lib/fizzbuzz-stream')).FizzBuzzStream;


    BASIC_TEST(CountStream,    {QUnit: QUnit, name: "CountStream"});
    BASIC_TEST(FizzBuzzStream, {QUnit: QUnit, name: "FizzBuzzStream"});

})(function (Stream, opt) {
    var is  = opt.QUnit.strictEqual;
    var mod = opt.QUnit.module;

    test('exists Stream', function () {
        ok(Stream, 'exists "' + opt.name + '"');
        ok(Stream.prototype instanceof require('stream').Stream
          , '"' + opt.name + '" \'s prototype instanceof "stream.Stream"'
        );
    });

});

