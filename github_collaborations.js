var https = require("https");
var userName='BetaNYC';
var options = {
host :"api.github.com",
path : '/users/'+userName+'/repos',
method : 'GET',
headers: {'User-Agent':'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)'}
};

var request = https.request(options, function(response){
var body = '';
response.on('data',function(chunk){
    body+=chunk;
});
response.on('end',function(){
    var json = JSON.parse(body);
    var repos =[];
    json.forEach(function(repo){
        repos.push({
            name : repo.name,
            description : repo.description
        });
    });
    console.log('the repos are  '+ JSON.stringify(repos, null, '\t'));
});

});
request.on('error', function(e) {
console.error('and the error is '+e);
});
request.end();


//	
