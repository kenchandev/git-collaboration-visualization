var GitHubApi = require("github");
var async = require("async");
var GitHubCollaborations = require("./ghcollab");
var d3Data = require("./data");

exports.index = function(req, res){
  res.render('index', { title: "GitHub Visualization"});
};

exports.handleGitHubInfo = function(req, res){
  var githubCollab = new GitHubCollaborations(req.user, res);
  
  //  Authenticate the GitHub user.
  githubCollab.authenticate();
  //  Gather and process all of a user's repos' info (branches and commits). 
  // d3Data.processData(, res);
  githubCollab.getRepositories();
};


