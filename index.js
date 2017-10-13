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

app.get('/api/url2png', function(req,res) {

  const visualrecognition = function(data) {
    return new Promise(function(resolve, reject) {
      console.log('visual-recognition');
      if (data == 'url not found') {
        resolve(data);
      } else {
        var vrAPIkey = process.env.IBM_VR_API_KEY;
        var vrclassids = process.env.IBM_VR_CLASS_KEY;

        // var uri ='https://gateway-a.watsonplatform.net/visual-recognition/api/v3/classify?api_key='+vrAPIkey+'&version=2016-05-20&classifier_ids=' + vrclassids + '&url=' + data;
        //
        // var options = {
        //   'method': 'GET',
        //   'uri': uri,
        //   'headers': {
        //     'Content-Type': 'application/json'
        //   }
        // };

        var uri ='https://gateway-a.watsonplatform.net/visual-recognition/api/v3/classify?api_key='+vrAPIkey+'&version=2016-05-20&threshold=0&classifier_ids=' + vrclassids;
        var options = {
        'method': 'POST',
        'uri': uri,
        'headers': {
          'Content-Type': 'application/json'
        },
          'body': fs.createReadStream(data)
        };

        console.log('calling visual-recognition ');
        request(options,function(error, response, body) {
          if (error) {
            resolve(error.message)
          } else {
            console.log('response from visual-recognition');
            var jsonContent = JSON.parse(body);
            // var message = jsonContent.items[1].link;
            // console.log('result' + message);
            resolve(body)
          }
        });
      }
    });
  };

  const getimagefromurl = function(filename, companyname) {
    console.log('get image from url')
    var url2png = require('url2png')('P57D02ACF715955', 'S_0CB8D2ACC15A3');
    var options = {
      viewport : '1920x1080',
      say_cheese : true,
      protocol: 'http'
    }
    var adr = jquery('companies[name=' + companyname + '].url', {
      rootContext: mydata
    }).value
    //console.log(adr);
    console.log(adr);
    return new Promise(function(resolve, reject) {
      //Get the URL
      if (adr == "" | adr == null) {
        resolve('url not found');
      } else {
        console.log('get image ' + adr + ' ' + file);
        var url = url2png.buildURL(adr, options);
        console.log(url);
        // //...or download the image to a file
        url2png.readURL(adr, options).pipe(fs.createWriteStream(file));
        resolve(file);
      }
    });

  };


  if (req.query.deletefile == null) {
      var replacefile = false;
  } else {
    replacefile = req.query.deletefile;
  }

  var file = 'images/' + req.query.companyname + '.png';
  file = file.replace(' ','_');
  console.log(file);
  if (fs.existsSync(file) && replacefile === false) {
      // Do something
      console.log('file exists');
      visualrecognition(file).then(respond => {
        res.type('application/json');
        res.set('Content-Length', Buffer.byteLength(respond));
        res.status(200).send(respond);
      });

  } else {
    getimagefromurl(file, req.query.companyname).then(visualrecognition).then(respond => {
      res.type('application/json');
      res.set('Content-Length', Buffer.byteLength(respond));
      res.status(200).send(respond);
    });
  }

});

// simple GET method starts here ->
app.get('/api/simpleget', function(req,res) {
  console.log('app get');
  const personalityinsights = function(data) {

    console.log('personalityinsights');
    var username = process.env.IBM_USER_NAME; // Your client id
    var password = process.env.IBM_PASSWORD; // Your secret

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

    return new Promise(function(resolve, reject) {
      request(options,function(error, response, body) {
        if (error) {
          resolve(error.message)
        } else {
          var jsonContent = JSON.parse(body);

          var returnJson = {};
          var key = 'needs';
          returnJson[key] = [];
          var returnRaw = false;
          var data = {};

          for (var index in jsonContent.needs){
            if (jsonContent.needs[index].name == null) {
              data = {};
            } else {
              data = {
                'trait_id': jsonContent.needs[index].trait_id,
                'name': jsonContent.needs[index].name,
                'percentile': jsonContent.needs[index].percentile,
                'raw_score': jsonContent.needs[index].raw_score
              }
            }
            returnJson[key].push(data);
          }

          if (returnRaw == true) {
            message = JSON.stringify(jsonContent)
          } else {
            message = JSON.stringify(returnJson);
          }
        }
        resolve(message)
      });
    });
  };

  const googlesearchapi = function (companynameref) {
    console.log('searching google');
    var gkey = process.env.GOOGLE_API_KEY; // Your client id
    var gcxkey = process.env.GOOGLE_CX_KEY; // Your secret

    var uri = 'https://www.googleapis.com/customsearch/v1?q=' + companynameref + '+about+us&cx=' + gcxkey + '&hl=en&lr=lang_en&key='+gkey;
    var options = {
      'method': 'GET',
      'uri': uri,
      'headers': {
        'Content-Type': 'application/json'
      }
    };
    return new Promise(function(resolve, reject) {
      request(options,function(error, response, body) {
        if (error) {
          resolve(error.message)
        } else {
          var jsonContent = JSON.parse(body);
          var message = jsonContent.items[1].link;
          console.log('result from google' + message);
          resolve(message)
        }
      });
    });
  };

  const parseurldata = function (data) {
    console.log('parsing url data');
    return new Promise(function(resolve, reject) {
      var url = require('url');
      var q = url.parse(data, true);

      var config = { 'preserveLineBreaks': false }
      textract.fromUrl(q,  function( error, text ) {
        //console.log(text);
        var datetime = new Date();
        var data = { 'contentItems': [{
          'content': text,
          'contenttype': 'text/plain',
          'language': 'en',
          'created': Date.parse(datetime)
          }]
        }
        resolve(data);
      });

    });
  }

  if (req.query.companyname == null) {
    var adr = '';
    res.type('text/plain');
    res.set('Content-Length', Buffer.byteLength('set companyname query parameter'));
    res.status(200).send('set companyname query parameter');
  } else {
    console.log(req.query.companyname);
    var adr = jquery('companies[name=' + req.query.companyname + '].url2', {
      rootContext: mydata
    }).value
    console.log('address from file: ' + adr);
    if (adr == "" | adr == null) {
      console.log('search google');
      //adr = searchGoogleAdr(req.query.companyname);
      googlesearchapi(req.query.companyname).then(parseurldata).then(personalityinsights).then(respond => {
        res.type('application/json');
        res.set('Content-Length', Buffer.byteLength(respond));
        res.status(200).send(respond);
      });
    } else {
      parseurldata(adr).then(personalityinsights).then(respond => {
        res.type('application/json');
        res.set('Content-Length', Buffer.byteLength(respond));
        res.status(200).send(respond);
      });
    }

  }

});

console.log('Listening on ' + port);
app.listen(process.env.PORT || port);
