# 从零开始实现React18

♢ 定义项目结构（monorepo）

♢ 定义开发规范
```
pnpm i eslint -D -w
pnpm i -D -w @typescript-eslint/eslint-plugin 
pnpm i prettier -D -w
pnpm i eslint-config-prettier eslint-plugin-prettier -D -w
pnpm i husky -D -w
pnpm i commitlint @commitlint/cli @commitlint/config-conventional -D -w
```
♢ 定义打包工具
```
pnpm i -D -w rollup
```
♢ React项目结构
- react（宿主环境无关的公用方法）
- shared（公用辅助方法，宿主环境无关）

♢ JSX转换 运行时实现 （编译时由babel编译实现）
- 实现jsx方法
  - jsxDEV方法（dev环境）
  - jsx方法（prod环境）
  - React.createElement方法

♢ 实现打包流程
```
pnpm i -D -w rollup-plugin-typescript2
pnpm i -D -w @rollup/plugin-commonjs
pnpm i -D -w rimraf
pnpm i -D -w rollup-plugin-generate-package-json
```
对应上述3方法，打包对应文件：
- react/jsx-dev-runtime.js（dev环境）
- react/jsx-rumtime.js（prod环境）
- React

♢ 调试打包结果

在dist/node_modules/react中
```
pnpm link --global
```
在npx create-react-app创建的react项目中
```
pnpm link react --global
```