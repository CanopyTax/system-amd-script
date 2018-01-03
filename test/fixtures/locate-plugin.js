exports.locate = function(load, systemFetch) {
	if (load.name.indexOf('navbar') > -1) {
		return '/base/test/fixtures/module.js';
	} else {
		return '/base/test/fixtures/mod-b.js';
	}
}
