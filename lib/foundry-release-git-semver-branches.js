// Load our dependencies
var quote = require('shell-quote').quote,
	SemVer = require('semver').SemVer,
	shell = require('shelljs'),
	Config = require('nconf'),
	Merge = require('deep-extend'),
	Template = require('template-string');

var Pkg = require('../package.json');


var commands = Config.env({
						separator: '_',
						match: /^npm_package_foundry.*/
				})
				.get('npm:package:foundry:releaseCommands'),
		index = Object.keys(commands)
				.find( function (index) {
						var item = commands[index]
						return (typeof item === 'string' && item === Pkg.name)
								|| (item.type === 'releaseCommand' && item.command === Pkg.name);
				}),
		options = Merge(index && commands[index].options || {}, {
			minorBranchTemplate: '${version}',
			patchBranchTemplate: '${version}'
		});


exports.publish = function (params, cb) {
	// Calculate the semver branches (e.g. `1.2.3` -> `1.2.x`, `1.x.x`)
	var semver = new SemVer(params.version),
		minorBranch = Template(options.minorBranchTemplate, {
			version: [semver.major, 'x', 'x'].join('.')}); // 1.x.x
		patchBranch = Template(options.patchBranchTemplate, {
			version: [semver.major, semver.minor, 'x'].join('.')}); // 1.2.x

	// Update the branches, push the branches, and go back to the original branch
	// DEV: We should force push but based on some configs that could push all branches
	shell.exec(quote(['git', 'checkout', '-B', minorBranch]));
	shell.exec('git push');
	shell.exec('git checkout -');
	shell.exec(quote(['git', 'checkout', '-B', patchBranch]));
	shell.exec('git push');
	shell.exec('git checkout -');
	process.nextTick(cb);
};
