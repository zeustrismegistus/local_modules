//init dependencies
const fs = require('fs-extra');
const path = require('path');
const shell = require('shelljs');
const pify = require('pify');


/*
	sample usage:
		
		var builder = serviceBuilder.new(targetFolder, *optional* runtimeSourceFolder)  //and initializes with basic node runtime files
		.setName('myModule')
		.editPackage((json)=>{})
		.hasDependency(depName)		//updates packageJSON
		.hasFile(targetPath, contents) //updates packageJSON and writes file

		//npm calls
		builder.npmUpdate() //does an npm-update
		
		//general shell calls
		builder.shell(command);
			
		//we build and demo
		builder.removeSelf();
*/

function ServiceBuilder (targetFolder, runtimeSourceFolder)
{
	//privates
	var __self = this;
	var __origDir = shell.pwd();
	
	//behaviour
	this.folder = targetFolder;
	this.initFolder = function()
	{
		console.log('ServiceBuilder initializing on ' + targetFolder);
		
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
		
		console.log('ServiceBuilder initialized on ' + targetFolder);
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
	ServiceBuilder.new = function(targetFolder, runtimeSourceFolder)
	{
		return new ServiceBuilder(targetFolder, runtimeSourceFolder);
	};
	
	Object.freeze(ServiceBuilder);
})();



module.exports = 
{
	ServiceBuilder :ServiceBuilder.new
};



console.log('ServiceBuilder up');