var fs = require('fs');
var path = require('path');
var samplePath = path.join(__dirname, '..', 'sample_data', 'test.json');

exports.retrieve = function(req, res){
  fs.readFile(samplePath, 'utf8', function(err, data){
    if(err){
      console.log(err);
    }
    else{
      // data = JSON.parse(data);
      res.json(JSON.parse(data));
    }
  });
}

