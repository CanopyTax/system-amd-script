!function() {
  function denormalizeName(normalizedName) {
    const withoutBang = normalizedName.slice(0, normalizedName.indexOf('!'));
    return withoutBang.substring(withoutBang.lastIndexOf('/') + 1);
  }

  window.__systemAmdScript = {};
  window.__systemAmdScript.denormalizeName = denormalizeName;

  let scriptNameMap = window.__systemAmdScript.scriptNameMap = {};
  let nameCounter = 0;

  window.define = window.canopyDefine = function(name, deps, m) {
    const outerSystem = __systemAmdScript.SystemJS || SystemJS;

    if (typeof name === "string") {
      nameCounter++;
      const newName = `__samds__${name}__${nameCounter}`;
      scriptNameMap[
        name.indexOf("!") > -1 ? name.substring(0, name.indexOf("!")) : name
      ] = newName;
      name = newName;
    }

    outerSystem.amdDefine(name, deps, m);
  };

  window.define.amd = true;

  const ogSystemDelete = SystemJS.delete;

  SystemJS.delete = function(normalizedName) {
    const moduleName = denormalizeName(normalizedName);
    delete scriptNameMap[moduleName];

    const script = document.querySelector(`script[data-system-amd-name="${moduleName}"]`);
    if (script) {
      script.parentNode.removeChild(script);
    }

    return ogSystemDelete.apply(this, arguments);
  }
}();
