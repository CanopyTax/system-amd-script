let scriptNameMap = window.__systemAmdScript.scriptNameMap;
let outerSystem = SystemJS;

const ogSystemDelete = outerSystem.delete;

outerSystem.delete = function(normalizedName) {
  const moduleName = denormalizeName(normalizedName);
  delete scriptNameMap[moduleName];

  const script = document.querySelector(`script[data-system-amd-name="${moduleName}"]`);
  if (script) {
    script.parentNode.removeChild(script);
  }

  return ogSystemDelete.apply(this, arguments);
}

function denormalizeName(normalizedName) {
  const withoutBang = normalizedName.slice(0, normalizedName.indexOf('!'));
  return withoutBang.slice(withoutBang.lastIndexOf('/') + 1);
}

function normalizeName(name) {
  return name.indexOf("!") > -1 ? name.substring(0, name.indexOf("!")) : name;
}

function getScript(address, name) {
  const existingScript = document.querySelector(`script[src="${address}"]`);
  if (existingScript) {
    return existingScript;
  }

  const head = document.getElementsByTagName("head")[0];
  const script = document.createElement("script");
  script.async = true;
  script.src = address;
  script.setAttribute('data-system-amd-name', name)
  head.appendChild(script);
  return script;
}

export function fetch(load) {
  outerSystem = window.__systemAmdScript.SystemJS = this;
  // Prevent the default XHR request for the resource
  // and resolve with an empty string. The proper module resolution
  // happens inside the instantiate hook
  return new Promise((resolve, reject) => {
    const name = normalizeName(load.name.substring(window.location.origin.length + 1));
    const address = scriptNameMap[name];

    if (address) resolve("");

    tryDownloadScript(1);

    function tryDownloadScript(attempt) {
      const script = getScript(load.address, denormalizeName(load.name));
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
        if (attempt >= 3) {
          reject(new Error(`Error loading module "${denormalizeName(load.name)}"`));
        } else {
          setTimeout(() => {
            script.parentNode.removeChild(script);
            tryDownloadScript(attempt + 1);
          })
        }
      }
    }
  });
}

export function instantiate(load) {
  const system = this;
  const originalName = load.name.substring(window.location.origin.length + 1)
  const name = normalizeName(originalName);
  const address = scriptNameMap[name];

  if (!address)
    return Promise.reject(new Error(`${name} was not properly loaded!`));

  return system
    .import(address)
    .then(load => {
      if (system.loads && system.trace) {
        // fix source tracing
        setTimeout(() => {
          system.loads[system.normalizeSync(originalName)] = system.loads[system.normalizeSync(address)]
        });
      }
      return load.__esModule ? assign(assign({}, load), { __esModule: true }) : load
    });
}

const assign = function(target, varArgs) {
    let to = Object(target);

    for (let index = 1; index < arguments.length; index++) {
      let nextSource = arguments[index];

      if (nextSource !== null) { // Skip over if undefined or null
        for (let nextKey in nextSource) {
          // Avoid bugs when hasOwnProperty is shadowed
          if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
    }
    return to;
  };
