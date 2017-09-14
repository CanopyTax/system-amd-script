window.__systemAmdScript = {};

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
