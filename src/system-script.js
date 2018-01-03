let nameCounter = 0;
let scriptNameMap = {};
let outerSystem = SystemJS;

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

const ogSystemDelete = outerSystem.delete;

outerSystem.delete = function(normalizedName) {
  // This is asynchronous, but SystemJS.delete is synchronous. We just accept the race condition :'(
  SystemJS.import('sofe').then(sofe => sofe.locate({address: normalizedName})).then(url => {
    const script = document.querySelector(`script[src="${url}"]`);
    if (script) {
      script.parentNode.removeChild(script);
    }
    const withoutBang = normalizedName.slice(0, normalizedName.indexOf('!'));
    const sofeServiceName = withoutBang.substring(withoutBang.lastIndexOf('/') + 1);
    delete scriptNameMap[sofeServiceName];
  })

  return ogSystemDelete.apply(this, arguments);
}

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
	const name = normalizeName(
		load.name.substring(window.location.origin.length + 1)
	);
	const address = scriptNameMap[name];

	if (!address)
		return Promise.reject(new Error(`${name} was not properly loaded!`));

	return system
		.import(address)
		.then(load => {
			return load.__esModule ? assign(assign({}, load), { __esModule: true }) : load
		});
}

const assign = function(target, varArgs) {
    var to = Object(target);

    for (var index = 1; index < arguments.length; index++) {
      var nextSource = arguments[index];

      if (nextSource != null) { // Skip over if undefined or null
        for (var nextKey in nextSource) {
          // Avoid bugs when hasOwnProperty is shadowed
          if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
    }
    return to;
  };
