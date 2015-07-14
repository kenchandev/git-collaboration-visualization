var GitHubApi = require("github");
var async = require("async");
var GitHubCollaborations = require("./ghcollab");
var d3Data = require("./data");

exports.index = function(req, res){
  // console.log("\n\n\n\n\n\n\n\n\nInside /:\n\n\n\n\n\n\n\n\n",req.user);
  res.render('index', { title: "Passport-Examples"});
};

exports.handleGitHubInfo = function(req, res){
  var githubCollab = new GitHubCollaborations(req.user);
  
  //  Authenticate the GitHub user.
  githubCollab.authenticate();
  //  Gather and process all of a user's repos' info (branches and commits). 
  d3Data.processData(githubCollab.getRepositories(), res);
};


