describe('system-amd-script', function() {
  let SystemJS;

  beforeEach(function() {
    SystemJS = new System.constructor();
    window.SystemJS = SystemJS;
    window.define = function () {
      window.canopyDefine.apply(window, arguments);
    }
    const scripts = document.querySelectorAll('script[data-system-amd-name]')
    for (let i=0; i<scripts.length; i++) {
      scripts[i].remove() }
    Object.keys(window.__systemAmdScript.scriptNameMap).forEach(key => {
      delete window.__systemAmdScript.scriptNameMap[key];
    });
  });

  it('should load modules via script tags with meta config', function() {
    console.log('meta test')
    SystemJS.config({
      meta: {
        "navbar": { loader: '/base/test/fixtures/plugin.js' }
      }
    });

    return SystemJS
      .import('navbar')
      .then(function(m) {
        expect(m()).toBe(1);
      })
  });

  it(`should update traced dependencies`, function() {
    console.log('trace test')
    SystemJS.config({
      trace: true,
      meta: {
        "navbar": { loader: '/base/test/fixtures/plugin.js' },
        "main": { loader: '/base/test/fixtures/plugin.js' }
      }
    });

    return SystemJS
      .import('main')
      .then(m => new Promise(resolve => {
        setTimeout(() => {
          expect(SystemJS.loads['http://localhost:9876/main'].deps).toEqual(['navbar']);
          expect(SystemJS.loads['http://localhost:9876/navbar'].deps).toEqual([]);
          resolve()
        })
      }))
  });

  it('should load modules via script tags with bang config', function() {
    return SystemJS
      .import('navbar!/base/test/fixtures/plugin.js')
      .then(function(m) {
        expect(m()).toBe(1);
      })
  });

  it('should throw an error for modules that aren\'t amd', function() {
    return SystemJS
      .import('/base/test/fixtures/module-noamd.js!/base/src/system-script.js')
      .then(function(m) {
        fail(new Error('Should not have resolved!'));
      })
      .catch(error => {
        expect(error.message.split('\n')[0]).toBe('base/test/fixtures/module-noamd.js was not properly loaded!');
      })
  });

  it('should throw an error for 404 urls', function() {
    return SystemJS
      .import('/base/test/fixtures/module-no-exist.js!/base/src/system-script.js')
      .then(function(m) {
        fail(new Error('Should not have resolved!'));
      })
      .catch(error => {
        const actual = error.message.split('\n')[0]
        const expected = 'Error loading module "module-no-exist.js" from address "http://localhost:9876/base/test/fixtures/module-no-exist.js"'
        expect(actual).toBe(expected);
      })
  });

  it("Should pre-load modules that are script-tagged directly", function() {
    return SystemJS
      .import("navbar!/base/test/fixtures/plugin.js")
      .then(function(m) {
        return new Promise((resolve, reject) => {
          const head = document.getElementsByTagName("head")[0];
          const script = document.createElement("script");
          script.async = true;
          script.addEventListener('load', function() {
            resolve(
              SystemJS
              .import("navbar-preloaded!/base/src/system-script.js")
              .then(function(m) {
                expect(m()).toBe(1);
              })
            )
          }, false);
          script.addEventListener('error', reject, false);
          script.src = '/base/test/fixtures/module-preloaded.js';
          head.appendChild(script);
        })
      })
  });

  it("Should delete a module's script tag and remove from scriptNameMap when SystemJS.delete is called", function() {
    const moduleToImport = 'foo!/base/test/fixtures/plugin.js';

    return SystemJS
      .import(moduleToImport)
      .then(function(m) {
        expect(window.__systemAmdScript.scriptNameMap['foo']).toBeDefined();
        expect(document.querySelector(`[data-system-amd-name="foo"]`)).toBeDefined();

        expect(SystemJS.delete(SystemJS.normalizeSync(moduleToImport))).toBe(true);

        expect(window.__systemAmdScript.scriptNameMap['foo']).toBeUndefined();
        expect(document.querySelector(`[data-system-amd-name="foo"]`)).toBe(null);
      })
  });
});
