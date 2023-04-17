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