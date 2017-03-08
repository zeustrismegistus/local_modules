const Code = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const describe = lab.describe;
const it = lab.it;
const before = lab.before;
const after = lab.after;
const expect = Code.expect;

const fs = require('fs-extra');

var builderFactory = require('./../serviceBuilder.js').ServiceBuilder;

describe('creating and interacting with a generated node service', () => {

	var builder;

    before((done) => {
 
		builder = builderFactory('./generatedService');
		builder.setName('tempService');
		builder.hasFile('exportsA.js', 'module.exports.A = "a";console.log("hello from exportsA");');
		builder.hasFile('exportsB.js', 'module.exports.B = "b";console.log("hello from exportsB");');
		builder.hasFile('exportsC.js', 'var a = require("exportsA"); var b = require("exportsB"); console.log("hello from exportsC");');
		
		builder.editPackage((json)=>{
			json.main = 'exportsC.js';
			json.scripts.start = 'node exportsC.js';
			return json;
		});
	
        done();
    });

    after((done) => {

		builder.removeSelf();
        done();
    });

    it('creates a file by shell command', (done) => {

		//builder.npmUpdate();
	
		builder.shell('touch exportsD.js');
		
        expect(fs.exists('exportsD.js')).to.equal(true);
        done();
    });
});