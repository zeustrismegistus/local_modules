# Node Service Builder - provides helper methods for programmatically creating node services on a file system somewhere.
It is very yeti.  It copies the node, et.al executables to a folder, manually constructs files, shells out to npm to 
resolve packages.  It's synchronous because slack.    

	sample usage:
	
		var builderFactory = require("d__module-builder").ModuleBuilder;
		builder = builderFactory('./generatedModule');
		builder.initFolder();
		builder.setName('tempService');
		builder.hasFile('exportsA.js', 'module.exports.A = "a";console.log("hello from exportsA");');
		builder.hasFile('exportsB.js', 'module.exports.B = "b";console.log("hello from exportsB");');
		builder.hasFile('exportsC.js', 'var a = require("exportsA"); var b = require("exportsB"); console.log("hello from exportsC");');
		builder.hasDependency('express', '^4.15.2');
		builder.editPackage((json)=>{
			json.main = 'exportsC.js';
			json.scripts.start = 'node exportsC.js';
			return json;
		});
		builder.npmUpdate(); //this should add the dependency
		builder.shell('ECHO >> exportsD.js'); //just do a shell command to show it operates on the target folder
		builder.removeFolder(); //remove the target folder
