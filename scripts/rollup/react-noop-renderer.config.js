import { getPackageJson, resolvePkgPath, getBaseRollupPlugins } from './utils';
import generatePackageJson from 'rollup-plugin-generate-package-json';
import alias from '@rollup/plugin-alias';

const { name, module, peerDependencies } = getPackageJson(
	'react-noop-renderer'
);
// react-noop-renderer包的路径
const pkgPath = resolvePkgPath(name);
// react-noop-renderer产物路径
const pkgDistPath = resolvePkgPath(name, true);
export default [
	// react-noop-renderer
	{
		input: `${pkgPath}/${module}`,
		// 需要兼容React17前的导出
		output: [
			{
				file: `${pkgDistPath}/index.js`,
				name: 'ReactNoopRenderer',
				format: 'umd'
			}
		],
		// 这样打包后ReacrDOM中将不会包含React的代码，从而解决"内部数据共享层"的问题
		external: [...Object.keys(peerDependencies), 'scheduler'],
		plugins: [
			...getBaseRollupPlugins({
				typescript: {
					exclude: ['./packages/react-dom/**/*'],
					tsconfigOverride: {
						compilerOptions: {
							paths: {
								hostConfig: [`./${name}/src/hostConfig.ts`]
							}
						}
					}
				}
			}),
			// 类似于 webpack resolve alias
			alias({
				entries: {
					hostConfig: `${pkgPath}/src/hostConfig.ts`
				}
			}),
			generatePackageJson({
				inputFolder: pkgPath,
				outputFolder: pkgDistPath,
				baseContents: ({ name, description, version }) => ({
					name,
					description,
					version,
					peerDependencies: {
						react: version
					},
					main: 'index.js'
				})
			})
		]
	}
];
