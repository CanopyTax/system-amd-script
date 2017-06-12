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

function getScript(address) {
	const existingScripts = Array.prototype.filter.call(
		document.querySelectorAll("script"),
		script => script.src === address
	);

	if (existingScripts.length) {
		return existingScripts[0];
	}

	const head = document.getElementsByTagName("head")[0];
	const script = document.createElement("script");
	script.async = true;
	script.src = address;
	head.appendChild(script);
	return script;
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

		const script = getScript(load.address);
		script.addEventListener("load", complete, false);
		script.addEventListener("error", error, false);

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
			reject(new Error(`Error loading module from the address: "${load.address}"`));
		}
	});
}

export function instantiate(load) {
	const system = this;
	const name = normalizeName(load.name.substring(window.location.origin.length + 1));
	const address = scriptNameMap[name];

	if (!address) return Promise.reject(new Error(`${name} was not properly loaded!`));

	return system.import(address);
}
