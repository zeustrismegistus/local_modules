//init dependencies
const fs = require('fs-extra');
const path = require('path');
const shell = require('shelljs');

/*
	sample usage:
	
		var builderFactory = require('./../moduleBuilder.js').ModuleBuilder;
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
		builder.npmUpdate(); //this should add the 
		builder.shell('ECHO >> exportsD.js');
		builder.removeFolder();
*/

function ModuleBuilder (targetFolder, runtimeSourceFolder)
{
	//privates
	var __self = this;
	var __origDir = shell.pwd();
	
	//behaviour
	this.folder = targetFolder;
	this.initFolder = function()
	{
		console.log('ModuleBuilder initializing on ' + targetFolder);
		
		//create the target 
		fs.ensureDirSync(targetFolder);
			
		//clear the target
		fs.emptyDirSync(targetFolder);
		
		//copy from source to target 
		var sourceFolder = '';
		if(runtimeSourceFolder)
			sourceFolder = runtimeSourceFolder;
		
		var sourceFiles = ['node.exe','npm.cmd', 'node_modules/npm', 'node_modules/.bin'];
		sourceFiles.forEach
		((x,i,a)=>{
			
			fs.copySync(path.join(sourceFolder,x), targetFolder + '/' + x);
		});
		
		//write the empty package json
		var packageJSON = {
			  "name": "",
			  "version": "0.0.0",
			  "description": "",
			  "main": "",
			  "scripts": {},
			  "author": "",
			  "dependencies": {},
			  "files": []
			};
		fs.writeFileSync(targetFolder + '/package.json' , JSON.stringify(packageJSON));
		
		console.log('ModuleBuilder initialized on ' + targetFolder);
		return __self;
	};
	this.editPackage = function(editJSONFn)
	{
		if(!editJSONFn)
			return __self;
		
		var packageJSON = fs.readFileSync(targetFolder + '/package.json')
		var json = JSON.parse(packageJSON);
		console.log('loaded package.json :' + packageJSON);
		
		json = editJSONFn(json);
		var newPackageJSON = JSON.stringify(json)
		console.log('writing package.json :' + newPackageJSON);
		fs.writeFileSync(targetFolder + '/package.json', newPackageJSON);
		
		return __self;
	};
	this.setName = function(name)
	{
		if(!name)
			return __self;
		
		this.editPackage((json)=>{
			json.name = name;
			return json;
		});
		
		return __self;
	};
	this.hasDependency = function(depName, version)
	{
		if(!depName)
			return __self;
		
		this.editPackage((json)=>{
			json.dependencies[depName] = version || 'latest';
			return json;
		});
		
		return __self;
	};
	this.hasFile = function(filePath, contents)
	{
		
		console.log('writing ' + filePath);
		var targetPath = path.join(targetFolder, filePath);
		fs.writeFileSync(targetPath, contents);
		
		this.editPackage((json)=>
		{
			//skip if already existing in the manifest
			if(json.files.indexOf(filePath) > -1)
				return json;
			
			json.files.push(filePath);
			
			return json;
		});
		
		return __self;
	};
	
	//npm calls
	this.npmUpdate = function()
	{
		return this.shell("npm update");
	};
	
	//shell calls - they always execute from the target directory. synchronously
	//note: using exec under the hood, so the commands have to be compatible with the underlying fs
	this.shell = function(command, options)
	{
		try
		{
			//move to the target folder
			shell.pushd(targetFolder);
		
			//do some stuff
			var rv = shell.exec(command, options);
			if(rv.stderr)
				throw rv.stderr;
			
			return rv.stdout;
		}
		catch(e){
			throw e;
		}
		finally
		{
			//go back to the original folder
			shell.popd();
		}
	};
	
	this.removeFolder = function()
	{
		//clear the target
		fs.emptyDirSync(targetFolder);
		
		fs.rmdirSync(targetFolder);
		
		return __self;
	};
}

(()=>{
	ModuleBuilder.new = function(targetFolder, runtimeSourceFolder)
	{
		return new ModuleBuilder(targetFolder, runtimeSourceFolder);
	};
	
	Object.freeze(ModuleBuilder);
})();



module.exports = 
{
	ModuleBuilder :ModuleBuilder.new
};



console.log('ModuleBuilder up');