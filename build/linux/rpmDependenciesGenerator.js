/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

const { spawnSync } = require('child_process');
const { calculatePackageDeps, mergePackageDeps } = require('./linux-installer/rpm/rpmDependencyScripts');
const { resolve } = require('path');
const { readFileSync } = require('fs');

// @ts-check
function getRpmDependencies() {
	// Get the files for which we want to find dependencies.
	const findResult = spawnSync('find', ['.', '-name', '*.node']);
	if (findResult.status) {
		console.error('Error finding files:');
		console.error(findResult.stderr.toString());
		return [];
	}

	// Filter the files and add on the Code binary.
	const files = findResult.stdout.toString().split('\n').filter((file) => {
		return !file.includes('obj.target') && file.includes('build/Release');
	});
	files.push('.build/electron/code-oss');

	// Generate the dependencies.
	const dependencies = files.map((file) => calculatePackageDeps(file));

	// Fetch additional dependencies file.
	const additionalDeps = readFileSync(resolve(__dirname, 'linux-installer/rpm/additional_deps'));
	const additionalDepsSet = new Set(additionalDeps.toString('utf-8').trim().split('\n'));
	dependencies.push(additionalDepsSet);

	// Merge all the dependencies.
	const mergedDependencies = mergePackageDeps(dependencies);
	const sortedDependencies = [];
	for (const dependency of mergedDependencies) {
		sortedDependencies.push(dependency);
	}
	sortedDependencies.sort();
	return sortedDependencies;
}

exports.getRpmDependencies = getRpmDependencies;
