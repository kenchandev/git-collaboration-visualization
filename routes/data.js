var d3 = require("d3");

exports.processData = function(data, res){
  console.log(data);
  res.render('account', { info: JSON.stringify(data, null, '\t') });
};