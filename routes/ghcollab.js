var async = require('async');
var GitHubApi = require("github");
var d3 = require("d3");
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

  Need a loading component.
  Turn this into a library.
*/

(function(){
  var github;
  //  internal dictionary for side-panel view
  var contributors = {};
  var visualization_data = {
                              name: "flare",
                              children: []
                           };

  //  Helper function to process items asynchronously.
  var processRepos = function(repos, username, res){
    var asyncRepos = [];

    repos.forEach(function(r){
      //  Need to set the children of the user's node to the user's repositories.
      visualization_data.children[0].children.push({
        name: r.name,
        type: "repository",
        children: []
      });
      asyncRepos.push(function(callback){
        getBranches(r.name, username, callback);
      });
    });

    async.parallel(asyncRepos, function(err, results){
      if(err){
        throw err;
      }
      else{
        processBranches(results, username, res);        
      }
    });
  };

  var getBranches = function(repository, username, callback){
    github.repos.getBranches({
      user: username,
      repo: repository
    }, function(err, data){
      if(err){
        throw err;
      }
      else{
        async.map(data, function(d, callback){
            d.repository = repository;
            callback(null, d);
          }, function(err, newResults){
            callback(null, newResults);
        }); 
      }
    });
  };

  var processBranches = function(repos, username, res){
    var asyncBranches = [];

    repos.forEach(function(x){
      //  For each repository's array of branches, get more intricate data for each.
      x.forEach(function(y){
        var selectedRepo = visualization_data.children[0].children.filter(function(d){
            return d.name === y.repository;
          });

          selectedRepo[0].children.push({
            name: y.name,
            children: []
          })

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

      // console.log("Number of Repos: ", results.length);

      var userRepos = visualization_data.children[0].children;

      // console.log("Number of Repos: ", userRepos.length);

      async.map(results, function(repo, callback){
        //  Need to set the children of each user's repository to the contributors and their number of contributions. (Assumption: none of the contributors share the same name...)
        var repository = repo[0].repository;
        var branch = repo[0].branch;

        var contributions = d3.nest()
                              .key(function(d){
                                return d.commit.committer.name;
                              })
                              .rollup(function(v){
                                return v.length;
                              })
                              .entries(repo);

        console.log('\n\n\nContributions\n\n\n', contributions);

        var selectedRepo = visualization_data.children[0].children.filter(function(d){
            return d.name === repository; 
        });

        var selectedBranch = selectedRepo[0].children.filter(function(d){
          return d.name === branch;
        });

        console.log('SelectedBranch:', selectedBranch);

        selectedBranch[0].children.push(contributions);

        // if(specificRepo.children)
        //   specificRepo.children.push(contributions);
        // else
        //   specificRepo.children = contributions;

        // console.log(visualization_data.children[0].children);

        callback(null, repo);

      }, function(err, addedData){
        console.log('\n\n\n Contributor information \n\n\n', visualization_data);
        //  Need to process the results before rendering the webpage with JSON.
        res.render('account', {title: 'GitHub Visualization', info: JSON.stringify(visualization_data, null, '\t') });
      });

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
        // console.log("\n\n\n This is some data. \n\n\n\n", data[0].commit);
        //  Must compile a list of contributors.
        async.each(data, function(d, cb){
          var email = d.commit.committer.email;
          if(!(email in contributors)){
            contributors[email] = { 
                                    repos: {}, 
                                    avatar_url: ((d.author !== null) ? d.author.avatar_url : null), 
                                    login: ((d.author !== null) ? d.author.login : null),
                                    name: d.commit.committer.name
                                  };
          }
          if(email in contributors && repository in contributors[email]["repos"]){
            var targetRepo = contributors[email]["repos"][repository];
            targetRepo["commits"].push({
              branch: branch,
              message: d.commit.message,
              date: d.commit.committer.date
            });
            targetRepo["count"]++;
          }
          else{
            contributors[email]["repos"][repository] = { 
                                                         commits: [{
                                                           branch: branch,
                                                           message: d.commit.message,
                                                           date: d.commit.committer.date
                                                         }],
                                                         count: 1
                                                       };
          }
          cb();
        }, function(err){
            if(err){
              throw err;
            }
            else{
              //  Must send back both contributors and results.
              async.map(data, function(d, callback){
                  d.repository = repository;
                  d.branch = branch;
                  callback(null, d);
                }, function(err, newResults){
                  callback(null, newResults);
              });
            }
          }
        );
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
  function GitHubCollaborations(body, res){
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
    this.res = res;

    visualization_data.children.push({
      name: body.name,
      username: body.username,
      children: []
    });
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
        processRepos(repositories, this.username, this.res);
      }.bind(this));
    }
    else{
      github.repos.getFromOrg({
        org: this.username
      }, function(err, repositories){
        if(err) throw err;
        processRepos(repositories, this.username, this.res);
      }.bind(this));
    }
  };

  module.exports = GitHubCollaborations;
})();

