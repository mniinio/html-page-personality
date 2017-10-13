module.exports = function(companyName) {
  var GoogleSearch = require('google-search');
  var googleSearch = new GoogleSearch({
    key: 'AIzaSyAPZwcjy85JTuMv5c0F_jXRgLJG3RZLCW8',
    cx: '001864198109172589445:oezg-r3yyzw'
  });


  googleSearch.build({
    q: companyName + 'about us',
    lr: 'lang_en'
  }, function(error, response) {
    console.log(response);
  });
}
