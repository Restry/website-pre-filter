'use strict';

var _cheerio = require('cheerio');

var _cheerio2 = _interopRequireDefault(_cheerio);

var _jsYaml = require('js-yaml');

var _jsYaml2 = _interopRequireDefault(_jsYaml);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var http = require('http');


var express = require('express');
var app = express();

var config = _jsYaml2.default.safeLoad(_fs2.default.readFileSync(__dirname + '/config.yml', 'utf8'));
var associations = JSON.stringify(config, null, 4);
console.log(associations);

console.log('args: ' + process.argv);

var getScript = function getScript(url) {
  return new Promise(function (resolve, reject) {
    var http = require('http'),
        https = require('https');

    var client = http;

    if (url.toString().indexOf("https") === 0) {
      client = https;
    }

    client.get(url, function (resp) {
      var data = '';

      // A chunk of data has been recieved.
      resp.on('data', function (chunk) {
        data += chunk;
      });

      // The whole response has been received. Print out the result.
      resp.on('end', function () {
        resolve(data);
      });
    }).on("error", function (err) {
      reject(err);
    });
  });
};

app.get('/', function (req, res) {
  getScript(config.site).then(function (data) {
    res.send(data);
  });
});

app.get('/s', function (req, res) {
  getScript({
    header: [{ 'refer': config.site }],
    hostname: config.host,
    path: req.originalUrl
  }).then(function (data) {
    var $ = _cheerio2.default.load(data);
    var lists = $('.c-container h3 a');
    lists.each(function (i, el) {
      var element = $(el);

      config.keywords.forEach(function (ass) {
        if (element.text().indexOf(ass.key) != -1) {
          element.attr('href', ass.value);
          console.log('attach: ' + element.text() + '  ----> ' + ass.value);
        }
      });
    });
    res.send($.html());
  }).catch(function (err) {
    console.log(err);
  });
});

if (process.argv.length <= 2) {
  console.log('请指定配置文件地址');
} else {
  app.listen(process.argv[2], function () {
    console.log('app listening on port ' + process.argv[2] + '!');
  });
}