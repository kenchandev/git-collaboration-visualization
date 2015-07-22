/**
 *
 *  Note: The amount of control flow happening in this script is overkill...
 *  Author: Ken Chan <ken.chan@nyu.edu>
 *
 **/

'use strict';

var async = require('async');
var GitHubApi = require('github');
var d3 = require('d3');
var _ = require('lodash');

var fs = require('fs');

//  Self-invoke anonymous function 
(function(){
  var startTime;

  var github;
  var contributors = {};  //  Internal dictionary to store data for side-panel.
  var visualization_data = { 
                             name: null,
                             username: null,
                             type: 'User',
                             children: [] 
                           };

  var GitHubCollaborations = function(body, res){
    startTime = new Date().getTime();

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

    this.name = visualization_data.name = body.name;
    this.type = visualization_data.type = body.type;
    this.username = visualization_data.username = body.username;
    this.accessToken = body.accessToken;
    this.res = res;
  };

  GitHubCollaborations.prototype.authenticate = function(){
    github.authenticate({
      type: "oauth",
      token: this.accessToken
    });
  };

  //  Grabs all repos and returns all information (branches, stargazers, etc.)
  GitHubCollaborations.prototype.getRepositories = function(){
    var pushAndProcess = function(repos, username, res){
      async.each(repos, function(r, callback){
          visualization_data.children.push({
            name: r.name,
            type: 'repository',
            total_commits: 0,
            total_watchers: 0,
            total_stargazers: 0,
            total_issues: 0,
            total_forks: 0,
            children: []
          });
          callback();
        }, function(err){
          if(err) console.log(err);
          processRepos(repos, username, res);
        });
    };

    //  Determine if the user is an organization or a general user.
    if(this.type === 'User'){
      github.repos.getFromUser({
        user: this.username
      }, function(err, repos){
        if(err) console.log(err);
        pushAndProcess(repos, this.username, this.res);
      }.bind(this));
    }
    else{
      github.repos.getFromOrg({
        org: this.username
      }, function(err, repos){
        if(err) console.log(err);
        pushAndProcess(repos, this.username, this.res);
      }.bind(this));
    }
  };

  var processRepos = function(repos, username, res){
    async.parallel([
        function(callback){  //  Get repo info on the number of watchers.
          getRepoInfo('watchers', repos, username, function(){
            callback(null, 'Finished watchers task.');
          });
        },
        function(callback){  //  Get repo info on the number of stargazers.
          getRepoInfo('stargazers', repos, username, function(){
            callback(null, 'Finished stargazers task.');
          });
        },
        function(callback){  //  Get repo info on the number of issues.
          getRepoInfo('issues', repos, username, function(){
            callback(null, 'Finished issues task.');
          });
        },
        function(callback){  //  Get repo info on the number of forks.
          getRepoInfo('forks', repos, username, function(){
            console.log('Finished forks task.');
            callback(null, 'Finished forks task.');
          });
        }, 
        function(callback){  //  Grab information on each branch within repo.
          async.waterfall([  //  Utilize the waterfall model to pipeline output.
            function(cb){
              getBranches(repos, username, function(results){
                cb(null, results);
              });
            },
            function(results, cb){
              processBranches(results, username, function(results){
                cb(null, results);
              });
            }
          ], function(err, results){
            callback(null, results);
          });
        }
      ], 
      function(err, results){
        //  visualization_data      ->  test.json
        //  results                 ->  example.json
        //  contributors            ->  viz.json
        var endTime = new Date().getTime();
        console.log('Elapsed Time: ', endTime - startTime);

        //  Build an API...

        // fs.writeFile('test.json', JSON.stringify(results, null, '\t'), function(err){
        //   if(err) throw err;
        //   console.log('It\'s saved!');
          res.render('account', {title: 'GitHub Visualization', info: JSON.stringify(contributors, null, '\t') });
          // res.sendfile(__dirname + '../views/visualization.html');
        // });
      }
    );
  };

  //  Helper function to find and retrieve repo inside children array at root level of visualization_data.
  var findRepo = function(repo, callback){
    async.filter(visualization_data.children, function(r, cb){
      return (r.name === repo) ? cb(true) : cb(false);
    }, function(repoRef){
      callback(repoRef[0]);
    });
  };

  //  Helper function to find and retrieve branch inside children array at repo level of visualization_data.
  var findBranch = function(repo, branch, callback){
    async.filter(repo.children, function(b, cb){
      return (b.name === branch) ? cb(true) : cb(false);
    }, function(branchRef){
      callback(branchRef[0]);
    });
  };

  var getBranches = function(repos, username, callback){
    var asyncRepos = [];

    _.forEach(repos, function(r){
      asyncRepos.push(function(cb){
        github.repos.getBranches({
          user: username,
          repo: r.name
        }, function(err, data){
          if(err) console.log(err);
          else{
            async.map(data, function(d, done){
                d.repository = r.name;
                done(null, d);
              }, function(err, results){
                cb(null, results);
            }); 
          }
        });
      });
    });

    async.parallel(asyncRepos, function(err, results){
      if(err) console.log(err);
      // processBranches(results, username, res);  
      callback(results);
    });
  };

  var processBranches = function(repos, username, callback){
    var asyncBranches = [];

    _.forEach(repos, function(branches){
      //  For each repository's array of branches, get more intricate data for each.
      _.forEach(branches, function(b){
        findRepo(b.repository, function(selectedRepo){
          selectedRepo.children.push({
            name: b.name,
            type: 'branch',
            children: null
          });

          asyncBranches.push(function(cb){
            getBranchInfo(b.repository, username, b.name, b.commit.sha, cb);
          });
        });
      });
    });

    async.parallel(asyncBranches, function(err, results){
      if(err) console.log(err);

      console.log('\n\n\n\n\nResults\n\n\n\n', results);

      async.map(results, function(repo, cb){
        var repository = repo[0].repository;
        var branch = repo[0].branch;
        var contributions = d3.nest()
                              .key(function(d){
                                return d.commit.author.name;
                              })
                              .rollup(function(v){
                                return v.length;
                              })
                              .entries(repo);

        findRepo(repository, function(selectedRepo){
          findBranch(selectedRepo, branch, function(selectedBranch){
            selectedBranch.children = contributions;

            _.forEach(contributions, function(d){
              selectedRepo.total_commits += d.values;
            });

            cb(null, results);
          });
        });
      }, function(err, finalData){
        if(err) console.log(err);
        callback(finalData);
      });
    });
  };

  var getBranchInfo = function(repo, username, branch, sha, callback){
    github.repos.getCommits({
        user: username,
        repo: repo,
        sha: sha,
        until: new Date().toISOString(),
        per_page: 100   //  Last 100 commits.
      }, function(err, data){
        if(err) console.log(err);
        //  Must compile a list of contributors.
        async.each(data, function(d, cb){
          //  E-mail addresses are unique. Hence, use as keys for dictionary.
          var email = d.commit.author.email;
          //  Make a new entry if the user doesn't exist within the dictionary of users.

          if(!(email in contributors)){
            contributors[email] = { 
                                    repos: {}, 
                                    avatar_url: null,
                                    followers: null, 
                                    following: null,
                                    location: null,
                                    email: null,
                                    company: null,
                                    html_url: null,
                                    followers_url: null,
                                    subscriptions_url: null,
                                    organizations_url: null,
                                    repos_url: null,
                                    type: null,
                                    login: null,
                                    name: d.commit.author.name
                                  };

            var contributor = contributors[email];
            var author = d.author;

            if(author !== null)
            {
              contributor.avatar_url = author.avatar_url;
              contributor.html_url = author.html_url;
              contributor.followers_url = author.followers_url;
              contributor.subscriptions_url = author.subscriptions_url;
              contributor.organizations_url = author.organizations_url;
              contributor.repos_url = author.repos_url;
              contributor.type = author.type;
              contributor.login = author.login;
            }
          }
          if(email in contributors && repo in contributors[email]["repos"]){
            var targetRepo = contributors[email]["repos"][repo];
            targetRepo["commits"].push({
              branch: branch,
              message: d.commit.message,
              date: d.commit.committer.date
            });
            targetRepo["count"]++;
          }
          else{
            contributors[email]["repos"][repo] = { 
                                                   commits: [{
                                                     branch: branch,
                                                     message: d.commit.message,
                                                     date: d.commit.author.date
                                                   }],
                                                   count: 1
                                                 };
          }
          cb();       
        }, function(err){
            if(err) console.log(err);

            var asyncFunctions = [];

            _.forEach(contributors, function(value, key){
              var contributor = contributors[key];

              if(contributor.login){
                asyncFunctions.push(function(cb){
                  github.user.getFrom({
                    user: contributor.login
                  }, function(err, user){
                    if(err) console.log(err);
                    // console.log(user);
                    contributor.followers = user.followers;
                    contributor.following = user.following;
                    contributor.location = (user.location) ? user.location : null;
                    contributor.email = (user.email) ? user.email : null;
                    contributor.company = (user.company) ? user.company : null;
                    cb(null, 'Got info on followers, location, etc.');
                  });
                });
              }
            });

            asyncFunctions.push(function(outerCB){
              //  Must send back both contributors and results.
              async.map(data, function(d, cb){
                  d.repository = repo;
                  d.branch = branch;
                  cb(null, d);
                }, function(err, info){
                  outerCB(null, info);
              });
            });

            async.parallel(asyncFunctions, function(err, results){
              console.log(results);
              callback(null, results[results.length - 1]);
            });
          }
        );
      });
  };

  var getRepoInfo = function(type, repos, username, callback){
    var asyncFunction;
    var asyncRepos = [];

    switch(type){
      case 'watchers':
        asyncFunction = function(repo, username, cb){
          github.repos.getWatchers({
            user: username,
            repo: repo
          }, function(err, results){
            if(err) console.log(err);
            findRepo(repo, function(selectedRepo){
              selectedRepo.total_watchers = results.length;
              cb(null, 'Got watchers count.');  
            });
          });
        };
        break;
      case 'stargazers':
        asyncFunction = function(repo, username, cb){
          github.repos.getStargazers({
            user: username,
            repo: repo
          }, function(err, results){
            if(err) console.log(err);
            findRepo(repo, function(selectedRepo){
              selectedRepo.total_stargazers = results.length;
              cb(null, 'Got stargazers count.');  
            });
          });
        };
        break;
      case 'issues':
        //  https://developer.github.com/v3/issues/#list-issues-for-a-repository
        asyncFunction = function(repo, username, cb){
          github.issues.repoIssues({
            user: username,
            repo: repo
          }, function(err, results){
            if(err) console.log(err);
            findRepo(repo, function(selectedRepo){
              selectedRepo.total_issues = results.length;
              cb(null, 'Got issues count.');  
            });
          });
        };
        break;
      case 'forks':
        asyncFunction = function(repo, username, cb){
          github.repos.getForks({
            user: username,
            repo: repo
          }, function(err, results){
            if(err) console.log(err);
            findRepo(repo, function(selectedRepo){
              selectedRepo.total_forks = results.length;
              cb(null, 'Got forks count.');  
            });
          });
        };
        break;
      default: 
        break;
    }

    _.forEach(repos, function(r){
      asyncRepos.push(function(cb){
        asyncFunction(r.name, username, cb);
      });
    });

    async.parallel(asyncRepos, function(err, results){
      if(err) console.log(err);
      callback();
    });
  };

  module.exports = GitHubCollaborations;
})();

