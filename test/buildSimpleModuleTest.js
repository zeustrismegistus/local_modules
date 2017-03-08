const Code = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const describe = lab.describe;
const it = lab.it;
const before = lab.before;
const after = lab.after;
const expect = Code.expect;

const fs = require('fs-extra');
const path = require('path');

var builderFactory = require('./../serviceBuilder.js').ServiceBuilder;

describe('creating and interacting with a generated node service', () => {

	var builder;

    before((done) => {
 
		builder = builderFactory('./generatedService');
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
	
        done();
    });

    after((done) => {

		builder.removeFolder();
        done();
    });

    it('creates a file by shell command', (done) => {
	
		builder.shell('ECHO >> exportsD.js');
		var dirlist = 	builder.shell('dir');
		
		var filePath = path.resolve(builder.folder, 'exportsD.js');
		var exists = fs.existsSync(filePath);
		expect(exists).to.equal(true);
        
		//try an npm update 
		//builder.npmUpdate();
	
        done();
    });
	it('does an npm update', (done) => {

		builder.npmUpdate(); //this should add the 
	
		var filePath = path.resolve(builder.folder, 'node_modules', 'express');
		var exists = fs.existsSync(filePath);
		expect(exists).to.equal(true);
		
        done();
    });
});