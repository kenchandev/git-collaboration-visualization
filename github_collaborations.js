

var GitHubApi = require("github");

var github = new GitHubApi({
    // required
    version: "3.0.0",
    // optional
    debug: true,
    protocol: "https",
    host: "api.github.com", // should be api.github.com for GitHub
    // pathPrefix: "/api/v3", // for some GHEs; none for GitHub
    timeout: 5000,
    headers: {
      // "user-agent": "github-collaboration-visualization"
      'User-Agent':'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)'
    }
});

github.authenticate({
    type: "oauth",
    key: "cb0a3f3bc50ae1771b0d",
    secret: "a11810e8ce3a00fa21b01e11ec70e7234a369abd"
})

// github.user.getFollowingFromUser({
//     // optional:
//     // headers: {
//     //     "cookie": "blahblah"
//     // },
//     user: "betanyc",
//     // repo: "AnnotationWebTool"
// }, function(err, res) {
//   if (err) throw err;
//     console.log(JSON.stringify(res, null, '\t'));
// });

// github.repos.getFromUser({
//   user: 'betanyc'
// }, function(err, res){
//   if(err) throw err;
//   console.log(JSON.stringify(res, null, '\t'));
// })

// github.repos.getContributors({
//   user: 'betanyc',
//   repo: 'nyc-open-government-timeline'
// }, function(err, res){
//   if(err) throw err;
//   console.log(JSON.stringify(res, null, '\t'));
// })

github.repos.getCollaborators({
  user: 'kenchan23',
  repo: 'js-mapreduce'
}, function(err, res){
  if(err) throw err;
  console.log(JSON.stringify(res, null, '\t'));
})

// var https = require("https");
// var userName = 'BetaNYC';
// var repositoryName = 'nyc-crime-map';

// //  GET /users/:username/repos
// //  List public repositories for the specified user.

// //  GET /orgs/:org/repos
// //  List repositories for the specified org.

// var entityOptions = {
//                 host :"api.github.com",
//                 // path : '/users/' + userName + '/repos',
//                 path: '/repos/' + userName + '/' + repositoryName + '/collaborators',
//                 method : 'GET',
//                 headers: {'User-Agent':'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)'}
//               };
// var repos =[];

// var requestProjects = https.request(entityOptions, function(response){
//   var projectBody = '';
  
//   response.on('data', function(projectChunk){
//     // console.log('Body!', chunk);
//     projectBody+=projectChunk;
//   });

//   response.on('end', function(){
//     // console.log(body);
//     var projectJSON = JSON.parse(projectBody);
    
//     console.log(projectJSON);

//     // projectJSON.forEach(function(repo){
//     //   repos.push(repo);
//     // });

//     // repos.forEach(function(repo){
//     //   var repoOptions = {
//     //             host :"api.github.com",
//     //             path : '/repos/' + userName + '/' + repo.name + '/collaborators',
//     //             method : 'GET',
//     //             headers: {'User-Agent':'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)'}
//     //   };

//     //   var requestCollab = https.request(repoOptions, (function(response){
//     //     var collabBody = '';

//     //     response.on('data', function(collabChunk){
//     //       collabBody += collabChunk;
//     //     }); 

//     //     response.on('end', function(){
//     //       var collabJSON = JSON.parse(collabBody);
//     //       var collabs = [];

//     //       collabJSON.forEach(function(collab){
//     //         collabs.push(collab);
//     //       });

//     //       console.log(JSON.stringify(collabs, null, '\t'));
//     //     });
//     //   })(response));
//     // });

//     // console.log('the repos are  '+ JSON.stringify(repos, null, '\t'));     
    
//   });
// });
  
// requestProjects.on('error', function(e){
//   console.error('and the error is '+e);
// });

// requestProjects.end();

    
      


// // /*

// //   Provided:
// //     Organization / User
// //   Given:
// //     Collaboration Information
// //     Information About Each Collaborator
// // */	
