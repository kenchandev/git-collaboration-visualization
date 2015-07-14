var async = require('async');
var GitHubApi = require("github");

/*
  Todo List:

  
  Sample Data...
  { 
    _id: 55a02caa2b6decc88492bc9e,
    oauthID: number,
    name: string,
    username: string,
    type: string,
    created: date,
    __v: number,
    accessToken: string 
  }
  
  /repos/:owner/:repo/branches/:branch

*/

(function(){
  var github;

  //  Helper function to process items asynchronously.
  var processRepos = function(repos, username){
    var asyncRepos = [];

    repos.forEach(function(r){
      asyncRepos.push(function(callback){
        getBranches(r.name, username, callback);
      });
    });

    async.parallel(asyncRepos, function(err, results){
      if(err){
        throw err;
      }
      else{
        processBranches(results, username);        
      }
    });
  };

  var processBranches = function(repos, username){
    var asyncBranches = [];

    repos.forEach(function(x){
      //  For each repository's array of branches, get more intricate data for each.
      x.forEach(function(y){
        asyncBranches.push(function(callback){
          getSingleBranchCommits(y.repository, username, y.name, y.commit.sha, callback);
        });
      });
    });

    async.parallel(asyncBranches, function(err, results){
      if(err){
        console.log(err);
        // res.render('account', { info: 'Nothing Found Here.'});
      }

      results.forEach(function(repos){
        console.log(repos.length);
        // repos.forEach(function(repo){
        //   console.log('\n\n', repo);
        // })
      })
      //  Need to process the results before rendering the webpage with JSON.
      return results;
    });
  };

  var getBranches = function(repository, username, callback){
    var addRepo = function(d, callback){
      d.repository = repository;
      callback(null, d);
    };

    github.repos.getBranches({
      user: username,
      repo: repository
    }, function(err, data){
      if(err){
        throw err;
      }
      else{
        async.map(data, addRepo, function(err, newResults){
          callback(null, newResults);
        }); 
      }
    });
  };

  //  http://stackoverflow.com/questions/9179828/github-api-retrieve-all-commits-for-all-branches-for-a-repo
  var getSingleBranchCommits = function(repository, username, branch, sha, callback){
    github.repos.getCommits({
      user: username,
      repo: repository,
      sha: sha,
      until: new Date().toISOString(),
      per_page: 100   //  Last 100 commits.
    }, function(err, data){
      if(err){
        throw err;
      }
      else{
        callback(null, data);
      }
    });
  }

  //  Get contribution statistics.
  var getStats = function(repository, username, callback){
    github.repos.getStatsContributors({
      user: username,
      repo: repository
    }, function(err, data){
      if(err){
        throw err;
      }
      else{
        if(Array.isArray(data)){
          var modifiedData = data.map(function(d){
            d.repository = repository;
            return d;
          });
          callback(null, modifiedData);
        }
        else{
          callback(null, data);
        }
      }
    });
  };

  //  Initialize GitHub API access.
  function GitHubCollaborations(body){
    github = new GitHubApi({
      version: "3.0.0",
      debug: true,
      protocol: "https",
      host: "api.github.com",
      timeout: 5000,
      headers: {
        'User-Agent':'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)'
      }
    });

    this.name = body.name;
    this.type = body.type;
    this.username = body.username;
    this.accessToken = body.accessToken;
  };

  //  Authenticate the user.
  GitHubCollaborations.prototype.authenticate = function(){
    github.authenticate({
      type: "oauth",
      token: this.accessToken
    });
  };

  //  Grab all the repositories for a particular user/organization.
  GitHubCollaborations.prototype.getRepositories = function(){
    //  Determine if the user is an organization or a general user.
    if(this.type === 'User'){
      github.repos.getFromUser({
        user: this.username
      }, function(err, repositories){
        if(err) throw err;
        processRepos(repositories, this.username);
      }.bind(this));
    }
    else{
      github.repos.getFromOrg({
        org: this.username
      }, function(err, repositories){
        if(err) throw err;
        processRepos(repositories, this.username);
      }.bind(this));
    }
  };

  module.exports = GitHubCollaborations;
})();

