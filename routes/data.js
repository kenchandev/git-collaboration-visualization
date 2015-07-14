var d3 = require("d3");

exports.processData = function(data, res){
  console.log("\n\n\n\n\n\nTesting\n\n\n\n\n\n");
  res.render('account', { info: JSON.stringify(data, null, '\t') });
};