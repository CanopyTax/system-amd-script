describe('sofe api', function() {
	let validManifestUrl = 'http://localhost:' + window.location.port + '/base/test/manifests/simple.json';

	let system;

	beforeEach(function() {
		system = new System.constructor();
		window.system = system;
		window.SystemJS = system;
		window.define = function () {
			window.canopyDefine.apply(window, arguments);
		}
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
});
