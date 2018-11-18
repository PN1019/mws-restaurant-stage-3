var autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync').create();
var connect = require('gulp-connect');

var del = require('del');
var gulp = require("gulp");
var gzip = require('gulp-gzip');
var gzipStatic = require('connect-gzip-static');
var gulpSequence = require('gulp-sequence');

var imagemin = require('gulp-imagemin');

var sourcemaps = require('gulp-sourcemaps');
var uglifyjs = require('gulp-uglify-es').default;

var uglifycss = require('gulp-uglifycss');

var webp = require('gulp-webp');


  //============= code for your default task goes here ===========

gulp.task('default', ['clean', 'copy-html', 'copy-icons','minify-images','minify-styles', 'scripts', 'service-worker', 'copy-manifest'
    ],
    function () {
        gulp.watch('css/**/*.css', ['minify-styles']);
		gulp.watch('./*.html', ['copy-html']);
        gulp.watch('js/**/*.js', ['scripts']);
        gulp.watch('./serviceworker.js', ['service-worker']);

        browserSync.init({
            server: './dist'
        });
    });
	gulp.task('watch', function () {
    gulp.watch('./*.html', ['copy-html']);
    gulp.watch('css/**/*.css', ['minify-styles']);
    gulp.watch('js/**/*.js', ['scripts']);
    gulp.watch('./serviceworker.js', ['service-worker']);
});

gulp.task('dist', function(done){
	gulpSequence('clean:dist',['copy'],['gzip'],['start','watch'],done);
});
gulp.task('copy',['copy-html', 'minify-images', 'minify-styles', 'scripts-dist',
   'service-worker', 'copy-manifest'
]);

   
//=======Cleaning up generated files automatically==============//
gulp.task('clean:dist', function() {
  return del.sync('dist/**',{
  force:true});
});

//=================Convert and Minify Images to WebP  =================//
gulp.task('minify-images', function(){
  return gulp.src('img/**/*.+(png|jpg|gif)')
  .pipe(imagemin([
        imagemin.jpegtran({progressive: true}),
        imagemin.gifsicle({interlaced: true}),
        imagemin.optipng({optimizationLevel: 5})
        ]))
  .pipe(webp())
  .pipe(gulp.dest('dist/img'))
});


//========Copy manifest to dist folder=======//
gulp.task('copy-manifest', function () {
    return gulp.src('./manifest.json')
        .pipe(gulp.dest('dist'));
});

//=======Copy HTML to dist folder=======//
gulp.task('copy-html', function () {
    gulp.src('./*.html')
        .pipe(gulp.dest('./dist/html/'))
        .pipe(connect.reload());
});

//====scripts===////

 gulp.task('scripts', function () {
    gulp.src('js/**/*.js')
        .pipe(sourcemaps.init())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('dist/js'));
});

gulp.task('scripts-dist', function () {
    gulp.src('js/**/*.js')
        .pipe(uglifyjs())
        .pipe(gulp.dest('dist/js'))
        .pipe(connect.reload());
}); 

gulp.task('service-worker', function () {
    return gulp.src('./serviceworker.js')
        .pipe(uglifyjs())
        .pipe(gulp.dest('dist'))
        .pipe(connect.reload());
});
gulp.task('minify-styles', function () {
    gulp.src('css/**/*.css')
        .pipe(uglifycss())
        .pipe(gulp.dest('dist/css'))
        .pipe(connect.reload());
});
// gZip tasks
gulp.task('gzip', ['gzip-html', 'gzip-css', 'gzip-js'], function () {});
/*========g-zipping compression=========*/
gulp.task('gzip-html', function () {
    gulp.src('**/*.html')
        .pipe(gzip())
        .pipe(gulp.dest('dist/html'));
});

gulp.task('gzip-css', function () {
    gulp.src('css/**/*.css')
        .pipe(gzip())
        .pipe(gulp.dest('dist/css'));
});

gulp.task('gzip-js', function () {
    gulp.src('js/**/*.js')
        .pipe(gzip())
        .pipe(gulp.dest('dist/js'));
});
/*=======================Starts the server in /dist directory=========================**/
gulp.task('start', function () {
    // var oneDay = 86400000;
    connect.server({
        root: './dist/html/index.html',
        port: 8000,
        livereload: false,
        middleware: function () {
            return [
			     gzipStatic(__dirname, {
                    maxAge: 31536000000
                })
                // connectGzip.gzip()
            ];
        }
    });
});