var gulp = require('gulp');
var gutil = require('gulp-util');

gulp.task('default', function(){
  return gutil.log('Gulp is running!');
});


//  gulp.task defines tasks. Arguments: name, dependencies, callback
//  gulp.src points to the files to be used. Use pipe to chain output to other plugins.
//  gulp.dest points to the output folder for writing files.