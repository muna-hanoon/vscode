/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

const { spawnSync } = require('child_process');
const { statSync } = require('fs');

// @ts-check
// Based on https://source.chromium.org/chromium/chromium/src/+/main:chrome/installer/linux/rpm/calculate_package_deps.py
export function calculatePackageDeps(/** @type string */ binaryPath) {
	if ((statSync(binaryPath).mode & 0o111) === 0) {
		throw new Error(`Binary ${binaryPath} needs to have an executable bit set.`);
	}

	const findRequiresResult = spawnSync('/usr/lib/rpm/find-requires', [], { input: binaryPath + '\n' });
	if (findRequiresResult.status !== 0) {
		throw new Error(`find-requires failed with exit code ${findRequiresResult.status}.\nstderr: ${findRequiresResult.stderr}`);
	}

	const requires = new Set(findRequiresResult.stdout.toString('utf-8').trimEnd().split('\n'));

	// we only need to use provides to check for newer dependencies
	// const provides = readFileSync('dist_package_provides.json');
	// const jsonProvides = JSON.parse(provides.toString('utf-8'));

	return requires;
}

// Based on https://source.chromium.org/chromium/chromium/src/+/main:chrome/installer/linux/rpm/merge_package_deps.py
/**
 *
 * @param {*} inputDeps
 * @returns Set<string>
 */
export function mergePackageDeps(/** @type Set<string>[] */ inputDeps) {
	const requires = new Set();
	for (const depSet of inputDeps) {
		for (const dep of depSet) {
			const trimmedDependency = dep.trim();
			if (trimmedDependency.length && !trimmedDependency.startsWith('#')) {
				requires.add(trimmedDependency);
			}
		}
	}
	return requires;
}
