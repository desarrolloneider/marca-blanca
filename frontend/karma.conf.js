// Karma config -- necesario solo para agregar el reporter "lcov" (Angular
// no lo incluye por defecto con --code-coverage, solo genera html +
// text-summary). Sin el lcov.info, SonarQube no tiene de donde leer
// cobertura aunque los tests si corran -- por eso el dashboard mostraba
// 0.0% de coverage a pesar de tener specs pasando.
module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma'),
    ],
    client: {
      jasmine: {},
      clearContext: false,
    },
    jasmineHtmlReporter: {
      suppressAll: true,
    },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/mi-proyecto-frontend'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' },
        { type: 'lcov' },
      ],
    },
    reporters: ['progress', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    // Chrome se niega a arrancar como root sin --no-sandbox (es el caso del
    // job de Sonar en CI, que corre dentro de un contenedor Docker donde
    // todo corre como root). ChromeHeadless normal sigue sirviendo para
    // correr local, donde no hace falta este launcher.
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-gpu'],
      },
    },
    // browsers/singleRun/autoWatch/restartOnFileChange se dejan sin fijar
    // aca -- el builder de Angular (@angular-devkit/build-angular:karma)
    // los pisa segun los flags --browsers/--watch de "ng test"; fijarlos
    // aca hizo que --browsers=ChromeHeadless/--watch=false quedaran
    // ignorados y karma se colgara indefinidamente.
  });
};
