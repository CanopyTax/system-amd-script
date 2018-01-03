describe('system-amd-script', function() {
	let validManifestUrl = 'http://localhost:' + window.location.port + '/base/test/manifests/simple.json';

	let system;

	beforeEach(function() {
		system = new System.constructor();
		window.system = system;
		window.SystemJS = system;
		window.define = function () {
			window.canopyDefine.apply(window, arguments);
		}
		Object.keys(window.__systemAmdScript.scriptNameMap).forEach(key => {
			delete window.__systemAmdScript.scriptNameMap[key];
		});
	});

	it('should load modules via script tags with meta config', function(done) {
		system.config({
			meta: {
				"navbar": { loader: '/base/test/fixtures/plugin.js' }
			}
		});

		system
		.import('navbar')
		.then(function(m) {
			expect(m()).toBe(1);
			done();
		})
		.catch(fail)
	});

	it(`should update traced dependencies`, function(done) {
		system.config({
			trace: true,
			meta: {
				"navbar": { loader: '/base/test/fixtures/plugin.js' },
				"main": { loader: '/base/test/fixtures/plugin.js' }
			}
		});

		system
		.import('main')
		.then(function(m) {
			setTimeout(() => {
				expect(system.loads['http://localhost:9876/main'].deps).toEqual(['navbar']);
				expect(system.loads['http://localhost:9876/navbar'].deps).toEqual([]);
				done();
			});
		})
		.catch(fail)
	});

	it('should load modules via script tags with bang config', function(done) {
		system
		.import('navbar!/base/test/fixtures/plugin.js')
		.then(function(m) {
			expect(m()).toBe(1);
			done();
		})
		.catch(fail)
	});

	it('should throw an error for modules that aren\'t amd', function(done) {
		system
		.import('/base/test/fixtures/module-noamd.js!/base/src/system-script.js')
		.then(function(m) {
			fail(new Error('Should not have resolved!'));
			done();
		})
		.catch(error => {
			expect(error.message.split('\n')[0]).toBe('base/test/fixtures/module-noamd.js was not properly loaded!');
			done();
		})
	});

	it('should throw an error for 404 urls', function(done) {
		system
		.import('/base/test/fixtures/module-no-exist.js!/base/src/system-script.js')
		.then(function(m) {
			fail(new Error('Should not have resolved!'));
			done();
		})
		.catch(error => {
			console.log('Error loading module from the address: "test/fixtures/module-no-exist.js"');
			expect(error.message.split('\n')[0]).toBe('Error loading module from the address: "http://localhost:9876/base/test/fixtures/module-no-exist.js"');
			done();
		})
	});

	it("Should pre-load modules that are script-tagged directly", function(done) {
		system
			.import("navbar!/base/test/fixtures/plugin.js")
			.then(function(m) {
				const head = document.getElementsByTagName("head")[0];
				const script = document.createElement("script");
				script.async = true;
				script.addEventListener('load', function() {
					system
					.import("navbar-preloaded!/base/src/system-script.js")
						.then(function(m) {
							expect(m()).toBe(1);
							done();
						})
						.catch(fail);
					}, false);
				script.addEventListener('error', fail, false);
				script.src = '/base/test/fixtures/module-preloaded.js';
				head.appendChild(script);
			})
			.catch(fail);
	});

  it("Should delete a module's script tag and remove from scriptNameMap when SystemJS.delete is called", function(done) {
    const moduleToImport = 'navbar!/base/test/fixtures/plugin.js';
		system
		.import(moduleToImport)
		.then(function(m) {
			expect(m()).toBe(1);
      expect(window.__systemAmdScript.scriptNameMap['navbar']).toBeDefined();
      expect(document.querySelector(`[data-system-amd-name="navbar"]`)).toBeDefined();

      expect(system.delete(system.normalizeSync(moduleToImport))).toBe(true);

      expect(window.__systemAmdScript.scriptNameMap['navbar']).toBeUndefined();
      expect(document.querySelector(`[data-system-amd-name="navbar"]`)).toBe(null);

      done();
		})
		.catch(fail)
  });
});
