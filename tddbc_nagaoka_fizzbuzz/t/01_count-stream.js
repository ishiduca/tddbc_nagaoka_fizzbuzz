(function (BASIC_TEST) {
    var path = require('path');

    var QUnit  = require(path.join( __dirname, 'qunit/helper')).QUnit;
    var WSMock = require(path.join( __dirname, 'xlib/write-stream-mock'));

    var CountStream = require(path.join(
                      __dirname, '../lib/count-stream')).CountStream;

    BASIC_TEST(CountStream,  {QUnit: QUnit, WSMock: WSMock});

})(function (CountStream, opt) {
    var is  = opt.QUnit.strictEqual;
    var mod = opt.QUnit.module;

    mod('不適切な引数が与えられた時、エラーを吐くか');
    test('new CountStream( arg )', function () {
        var err = /Integer Number/;
        [ null, 0, 1.1, "1" ].forEach(function (arg) {
            throws(function () { new CountStream(arg) }, err);
        });
        throws(function () { new CountStream }, err, 'undefined の場合、エラー');
    });

    mod('適切な引数が与えられた時、インスタンスを生成するか');
    test('インスタンスを生成するか', function () {
      ok(new CountStream(99));
    });
    test('インスタンスの初期プロパティは期待通りか', function () {
        var countStream = new CountStream(99);
        is( countStream.max, 99, "countStream.max === 99");
        is( countStream.count, 0, "countStream.count === 0");
        ok( countStream.readable, "countStream.readable === true");
    });

    mod('適切なタイミングで readable === false になるか', {
        setup: function () { this.countStream = new CountStream(1) }
    });
    test('.destroy()', function () {
        ok( this.countStream.readable);
        this.countStream.destroy();
        ok( ! this.countStream.readable);
    });
    test('.emit("close")', function () {
        ok( this.countStream.readable);
        this.countStream.emit("close");
        ok( ! this.countStream.readable);
    });
    test('.emit("error")', function () {
        ok( this.countStream.readable);
        this.countStream.emit("error");
        ok( ! this.countStream.readable);
    });

    mod('カウントが出来るか', {
        setup: function () {
            this.countStream = new CountStream(10);
            this.writeStream = new opt.WSMock;
        }
    });
    asyncTest('"no use pipe" で 1~10 までカウントできるか', function () {
        var countStream = this.countStream;
        var writeStream = this.writeStream;

        countStream.on('data', function (s) {
            if (false === writeStream.write(s) && countStream.pause) {
                countStream.pause();
            }
        });
        countStream.once('end', function () {
            deepEqual(writeStream.buf, ("1 2 3 4 5 6 7 8 9 10").split(" "), JSON.stringify(writeStream.buf));

            start();
        });
        writeStream.on('drain', function () { countStream.resume(); });

        countStream.resume();
    });
    asyncTest('"use pipe" で 1~10 までカウントできるか', function () {
        var countStream = this.countStream;
        var writeStream = this.writeStream;

        countStream.once('end', function () {
            deepEqual( writeStream.buf, ("1 2 3 4 5 6 7 8 9 10").split(" "), JSON.stringify(writeStream.buf));

            start();
        });

        countStream.pipe(writeStream);
        countStream.resume();
    });
    asyncTest('5までカウントした後、.pause() できるか', function () {
        var countStream = this.countStream;
        var writeStream = this.writeStream;

        countStream.pipe(writeStream);

        countStream.on('data', function (s) {
            if (s === '5') {
                countStream.pause();
                deepEqual( writeStream.buf, ('1 2 3 4 5').split(" ")
                  , JSON.stringify(writeStream.buf));

                start();
            }
        });

        countStream.resume();
    });

});

