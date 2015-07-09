var https = require("https");
var userName = 'BetaNYC';

//  GET /users/:username/repos
//  List public repositories for the specified user.

//  GET /orgs/:org/repos
//  List repositories for the specified org.

var entityOptions = {
                host :"api.github.com",
                path : '/users/' + userName + '/repos',
                method : 'GET',
                headers: {'User-Agent':'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)'}
              };
var repos =[];

var requestProjects = https.request(entityOptions, function(response){
  var projectBody = '';
  
  response.on('data', function(projectChunk){
    // console.log('Body!', chunk);
    projectBody+=projectChunk;
  });

  response.on('end', function(){
    // console.log(body);
    var projectJSON = JSON.parse(projectBody);
    
    projectJSON.forEach(function(repo){
      repos.push({
        name : repo.name,
        description : repo.description
      });
    });

    repos.forEach(function(repo){
      var repoOptions = {
                host :"api.github.com",
                path : '/repos/' + userName + '/' + repo.name + '/collaborators',
                method : 'GET',
                headers: {'User-Agent':'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)'}
      };

      var requestCollab = https.request(repoOptions, (function(response){
        var collabBody = '';

        response.on('data', function(collabChunk){
          collabBody += collabChunk;
        }); 

        response.on('end', function(){
          var collabJSON = JSON.parse(collabBody);
          var collabs = [];

          collabJSON.forEach(function(collab){
            collabs.push(collab);
          });

          console.log(JSON.stringify(collabs, null, '\t'));
        });
      })(response));
    });

    console.log('the repos are  '+ JSON.stringify(repos, null, '\t'));     
    
  });
});
  
requestProjects.on('error', function(e){
  console.error('and the error is '+e);
});

requestProjects.end();

    
      


// });


//	
