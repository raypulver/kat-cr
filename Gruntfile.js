module.exports = function(grunt) {
  grunt.initConfig({
    jsdoc: {
      dist: {
        src: [require('./package').main, 'lib/*.js'],
        options: {
          destination: 'doc'
        }
      }
    }
  });
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.registerTask('default', ['jsdoc']);
};
