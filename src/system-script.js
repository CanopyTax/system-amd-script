let nameCounter = 0;
let scriptNameMap = {};
let outerSystem = null;

window.define = window.canopyDefine = function(name, deps, m) {
	if (typeof name === "string") {
		nameCounter++;
		const newName = `__script__${nameCounter}`;
		scriptNameMap[
			name.indexOf("!") > -1 ? name.substring(0, name.indexOf("!")) : name
		] = newName;
		name = newName;
	}

	outerSystem.amdDefine(name, deps, m);
};

window.define.amd = true;

function normalizeName(name) {
	return name.indexOf("!") > -1 ? name.substring(0, name.indexOf("!")) : name;
}

export function fetch(load) {
	outerSystem = this;
	// Prevent the default XHR request for the resource
	// and resolve with an empty string. The proper module resolution
	// happens inside the instantiate hook
	return new Promise((resolve, reject) => {
		const name = normalizeName(load.name.substring(window.location.origin.length + 1));
		const address = scriptNameMap[name];

		if (address) resolve("");

		const head = document.getElementsByTagName("head")[0];
		const script = document.createElement("script");
		script.async = true;

		function complete() {
			if (
				script.readyState &&
				script.readyState !== "loaded" &&
				script.readyState !== "complete"
			) {
				return;
			}

			resolve("");
		}

		function error(evt) {
			reject(evt);
		}

		if (script.attachEvent) {
			script.attachEvent("onreadystatechange", complete);
		} else {
			script.addEventListener("load", complete, false);
			script.addEventListener("error", error, false);
		}

		script.src = load.address;
		head.appendChild(script);
	});
}

export function instantiate(load) {
	const system = this;
	const name = normalizeName(load.name.substring(window.location.origin.length + 1));
	const address = scriptNameMap[name];

	if (!address) return Promise.reject(new Error(`${name} was not properly loaded!`));

	return system.import(address);
}
