var http = require('http');
import cheerio from 'cheerio';
import yaml from 'js-yaml';
import fs from 'fs';

var express = require('express');
var app = express();

const config = yaml.safeLoad(fs.readFileSync(__dirname + '/config.yml', 'utf8'));
const associations = JSON.stringify(config, null, 4);
console.log(associations);

console.log('args: ' + process.argv);

const getScript = (url) => {
  return new Promise((resolve, reject) => {
    const http = require('http'),
      https = require('https');

    let client = http;

    if (url.toString().indexOf("https") === 0) {
      client = https;
    }



    client.get(url, (resp) => {
      let data = '';

      // A chunk of data has been recieved.
      resp.on('data', (chunk) => {
        data += chunk;
      });

      // The whole response has been received. Print out the result.
      resp.on('end', () => {
        resolve(data);
      });

    }).on("error", (err) => {
      reject(err);
    });
  });
};


app.get('/', function (req, res) {
  getScript(config.site).then(data => {
    res.send(data)
  });
});

app.get('/s', (req, res) => {
  getScript({
    header: [{ 'refer': config.site }],
    hostname: config.host,
    path: req.originalUrl,
  }).then(data => {
    const $ = cheerio.load(data);
    const lists = $('.c-container h3 a')
    lists.each((i, el) => {
      const element = $(el);

      config.keywords.forEach(ass => {
        if (element.text().indexOf(ass.key) != -1) {
          element.attr('href', ass.value);
          console.log(`attach: ${element.text()}  ----> ${ass.value}`);
        }
      })

    })
    res.send($.html())
  }).catch((err) => {
    console.log(err);
  });
})

if (process.argv.length <= 2) {
  console.log('请指定配置文件地址');
}
else {
  app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
  });
}