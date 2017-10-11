var textract = require('textract');
var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
//  var qs = require('querystring'); // "querystring library
var fs = require('fs');
var jquery = require('json-query');
var mydata = require('./data.json');

var app = express();
var port = 3000;
require('dotenv').config();

// simple GET method starts here ->
app.get('/api/simpleget', function(req,res) {

  var data;
  if (req.query.companyname == null) {
    adr = false;
    res.type('text/plain');
    res.set('Content-Length', Buffer.byteLength('set url query parameter'));
    res.status(200).send('set companyname query parameter');
  } else {
      console.log(mydata);
      var value = mydata.companies[1].name;
      value = jquery('companies[name=nokia].url', {
        rootContext: mydata
      }).value
  }
  console.log(value);
  if (req.query.url == null) {
    adr = false;
    res.type('text/plain');
    res.set('Content-Length', Buffer.byteLength('set url query parameter'));
    res.status(200).send('set url query parameter');
  } else {
    adr = req.query.url;
    var url = require('url');
    //var adr = 'https://en.wikipedia.org/wiki/Node.js';
    var q = url.parse(adr, true);

    console.log(q);
    var config = { 'preserveLineBreaks': false }
    textract.fromUrl(q,  function( error, text ) {
      console.log(text);
      var datetime = new Date();
      var data = { 'contentItems': [{
        'content': text,
        'contenttype': 'text/plain',
        'language': 'en',
        'created': Date.parse(datetime)
        }]
      }

      personalityinsights(data).then(respond => {
        res.type('application/json');
        res.set('Content-Length', Buffer.byteLength(respond));
        res.status(200).send(respond);
      });

    });
  }

  const personalityinsights = function(data) {
    // var username = user_name;
    // var password = password;
    // console.log(username);

    var username = process.env.IBM_USER_NAME; // Your client id
    var password = process.env.IBM_PASSWORD; // Your secret
    console.log(username);
    console.log(password);
    uri = 'https://gateway-fra.watsonplatform.net/personality-insights/api/v3/profile?version=2016-10-20&consumption_preferences=true&raw_scores=true';

    // console.log(data);
    var options = {
      'method': 'POST',
      'uri': uri,
      'headers': {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + new Buffer(username + ':' + password).toString('base64')
      },
      'body': JSON.stringify(data)
    };
    console.log(options);
    return new Promise(function(resolve, reject) {
      request(options,function(error, response, body) {
        if (error) {
          resolve(error.message)
        } else {
          jsonContent = JSON.parse(body);
          message = JSON.stringify(jsonContent);
        }
        resolve(message)
      });
    });
  };

});

console.log('Listening on ' + port);
app.listen(process.env.PORT || port);
