# 从零开始实现React18

### ♢ 定义项目结构（monorepo）

###  ♢ 定义开发规范
```
pnpm i eslint -D -w
pnpm i -D -w @typescript-eslint/eslint-plugin 
pnpm i prettier -D -w
pnpm i eslint-config-prettier eslint-plugin-prettier -D -w
pnpm i husky -D -w
pnpm i commitlint @commitlint/cli @commitlint/config-conventional -D -w
```
###  ♢ 定义打包工具
```
pnpm i -D -w rollup
```
###  ♢ React项目结构
- react（宿主环境无关的公用方法）
- shared（公用辅助方法，宿主环境无关）

###  ♢ JSX转换 运行时实现 （编译时由babel编译实现）
- 实现jsx方法
  - jsxDEV方法（dev环境）
  - jsx方法（prod环境）
  - React.createElement方法

###  ♢ 实现打包流程
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

###  ♢ 调试打包结果

在dist/node_modules/react中
```
pnpm link --global
```
在npx create-react-app创建的react项目中
```
pnpm link react --global
```

react内部3个阶段：

- schedule阶段
- render阶段（beginWork completeWork）
- commit阶段（commitWork）

###  ♢ 实现Reconciler架构 

ReactElement如果作为核心模块操作的数据结构，存在的问题：
- 无法表达节点之间的关系
- 字段有限，不好拓展（比如：无法表达状态）

所以，需要一种新的数据结构，他的特点：
- 介于ReactElement与真实UI节点之间
- 能够表达节点之间的关系
- 方便拓展（不仅作为数据存储单元，也能作为工作单元）

这就是FiberNode（虚拟DOM在React中的实现）

对于同一个节点，比较其ReactElement与fiberNode，生成子fiberNode。并根据比较的结果生成不同标记（插入、删除、移动......），对应不同宿主环境API的执行。

当所有ReactElement比较完后，会生成一棵fiberNode树，一共会存在两棵fiberNode树：
- current：与视图中真实UI对应的fiberNode树
- workInProgress：触发更新后，正在reconciler中计算的fiberNode树

以DFS（深度优先遍历）的顺序遍历ReactElement，这是个递归的过程，存在递、归两个阶段：
- 递：对应beginWork
- 归：对应completeWork

###  ♢ 触发更新

常见的触发更新的方式
- ReactDOM.createRoot().render（或老版的ReactDOM.render）
- this.setState
- useState的dispatch方法
 
更新机制的组成部分
- 代表更新的数据结构 —— Update
- 消费update的数据结构 —— UpdateQueue

实现mount时调用的API并将该API接入上述更新机制中

需要考虑的事情：
- 更新可能发生于任意组件，而更新流程是从根节点递归的
- 需要一个统一的根节点保存通用信息

更新流程的目的：

- 生成wip fiberNode树
- 标记副作用flags

更新流程的步骤：

- 递：beginWork
- 归：completeWork
###  ♢ 实现beginwork
HostRoot的beginWork工作流程
- 计算状态的最新值
- 创造子fiberNode

HostComponent的beginWork工作流程
- 创造子fiberNode

HostText没有beginWork工作流程

beginWork性能优化策略：「离屏DOM树」
###  ♢ 实现completeWork
需要解决的问题：
- 对于Host类型fiberNode：构建离屏DOM树
- 标记Update flag（TODO）

completeWork性能优化策略：

利用completeWork向上遍历（归）的流程，将子fiberNode的flags冒泡到父fiberNode，从而快速找到分布在不同fiberNode中的flags

###  ♢ 实现commit阶段
- beforeMutation阶段
- mutation阶段
- layout阶段
  
当前commit阶段要执行的任务：
- fiber树的切换
- 执行Placement对应操作
  
###  ♢ 打包ReactDOM
需要注意的点：

- 兼容原版React的导出
- 处理hostConfig的指向
```
pnpm i -D -w @rollup/plugin-alias
```

###  ♢ 实现FunctionComponent
FC的工作同样植根于：

- beginWork
- completeWork


###  ♢ 加入vite的实时调试
使用vite而不是webpack作为demo调试的原因：

- 在开发阶段编译速度快于webpack
- vite的插件体系与rollup兼容

在 package.json中运行vite，需要加入参数--force，禁掉包缓存

###  ♢ 实现Hooks架构

Reconciler  ---  内部数据共享层  ---  React

fiberNode中可用的字段：

- memoizedState
- updateQueue

对于FC对应的fiberNode，存在两层数据：

- fiberNode.memoizedState对应Hooks链表
- 链表中每个hook对应自身的数据

###  ♢ 实现useState

- 实现mount时useState的实现
- 实现dispatch方法，并接入现有更新流程内

###  ♢ 实现ReactElement的测试用例
```
pnpm i -D -w jest jest-config jest-environment-jsdom
pnpm i -D -w @babel/core @babel/preset-env @babel/plugin-transform-react-jsx
```

###  ♢ update流程
update流程与mount流程的区别。

对于beginWork：
- 需要处理ChildDeletion的情况
- 需要处理节点移动的情况（abc -> bca）

对于completeWork：
- 需要处理HostText内容更新的情况
- 需要处理HostComponent属性变化的情况

对于commitWork：
- 对于ChildDeletion，需要遍历被删除的子树
- 对于Update，需要更新文本内容

对于useState：
- 实现相对于mountState的updateState

###  ♢ 实现事件系统
实现事件系统需要考虑：

- 模拟实现浏览器事件捕获、冒泡流程
- 实现合成事件对象
- 方便后续扩展

###  ♢ 实现Diff算法
对于同级多节点Diff的支持

单节点需要支持的情况：

- 插入 Placement
- 删除 ChildDeletion

多节点需要支持的情况：

- 插入 Placement
- 删除 ChildDeletion
- 移动 Placement

###  ♢ 实现Fragment
```
<>
  <div></div>
  <div></div>
</>
```
```
<ul>
  <>
    <li>1</li>
    <li>2</li>
  </>
  <li>3</li>
  <li>4</li>
</ul>
```
```
// arr = [<li>c</li>, <li>d</li>]

<ul>
  <li>a</li>
  <li>b</li>
  {arr}
</ul>
```

###  ♢ 实现同步调度流程
多次触发更新，只进行一次更新流程

React批处理的时机既有宏任务，也有微任务。

「多次触发更新，只进行一次更新流程」，意味着要达成3个目标：

- 需要实现一套优先级机制，每个更新都拥有优先级  Lane模型
- 需要能够合并一个宏任务/微任务中触发的所有更新
- 需要一套算法，用于决定哪个优先级优先进入render阶段