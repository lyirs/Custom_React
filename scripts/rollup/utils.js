import path from 'path';
import fs from 'fs';

import ts from 'rollup-plugin-typescript2';
import cjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
const pkgPath = path.resolve(__dirname, '../../packages');
const distPath = path.resolve(__dirname, '../../dist/node_modules');

export const resolvePkgPath = (pkgName, isDist) => {
	if (isDist) {
		return `${distPath}/${pkgName}`;
	}
	return `${pkgPath}/${pkgName}`;
};

export const getPackageJson = (pkgName) => {
	const path = `${resolvePkgPath(pkgName)}/package.json`;
	const str = fs.readFileSync(path, { encoding: 'utf-8' });
	return JSON.parse(str);
};

// rollup原生支持ESM格式，所以对于CJS格式的包，我们需要先将它用该插件转为ESM格式。
export const getBaseRollupPlugins = ({
	alias = {
		__DEV__: true,
		preventAssignment: true
	},
	typescript = {}
} = {}) => {
	return [replace(alias), cjs(), ts(typescript)];
};
