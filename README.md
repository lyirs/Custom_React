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
如以下情况：
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

###  ♢ 实现useEffect
effect数据结构

effect的工作流程
- 调度副作用
```
pnpm i -w scheduler 
pnpm i -D -w @types/scheduler
```
- 收集回调
- 执行副作用

###  ♢ 实现noop-renderer
为了测试Reconciler，我们需要构建「宿主环境无关的渲染器」，这就是react-noop-renderer

在ReactDOM宿主环境的原生节点是DOM节点，在Noop-Renderer宿主环境包括三类节点：

- Instance（HostComponent）
- TextInstance（HostText）
- Container（HostRoot）

除此以外，还需实现「以ReactElement的形式导出树状结构」。

完善Reconciler测试环境:
```
pnpm i -D -w jest-react
```
当前我们为测试做的准备:

- 针对ReactDOM宿主环境：ReactTestUtils
- 针对Reconciler的测试：React-Noop-Renderer
- 针对并发环境的测试：jest-react、Scheduler、React-Noop-Renderer配合使用

###  ♢ 实现并发更新
要实现并发更新，需要做的改动包括：
- Lane模型增加更多优先级
- 交互与优先级对应
- 调度阶段引入Scheduler，新增调度策略逻辑
- render阶段可中断
- 根据update计算state的算法需要修改

##### 扩展调度阶段

主要是在同步更新（微任务调度）的基础上扩展并发更新（Scheduler调度），主要包括:
- 将Demo中的调度策略移到项目中
- render阶段变为「可中断」

梳理两种典型场景：
- 时间切片
- 高优先级更新打断低优先级更新

##### 扩展state计算机制

扩展「根据lane对应update计算state」的机制，主要包括：
- 通过update计算state时可以跳过「优先级不够的update」
- 由于「高优先级任务打断低优先级任务」，同一个组件中「根据update计算state」的流程可能会多次执行，所以需要保存update

##### 跳过update需要考虑的问题

如何比较「优先级是否足够」？

如何同时兼顾「update的连续性」与「update的优先级」？

新增baseState、baseQueue字段：
- baseState是本次更新参与计算的初始state，memoizedState是上次更新计算的最终state
- 如果本次更新没有update被跳过，则下次更新开始时baseState === memoizedState
- 如果本次更新有update被跳过，则本次更新计算出的memoizedState为「考虑优先级」情况下计算的结果，baseState为「最后一个没被跳过的update计算后的结果」，下次更新开始时baseState !== memoizedState
- 本次更新「被跳过的update及其后面的所有update」都会被保存在baseQueue中参与下次state计算
- 本次更新「参与计算但保存在baseQueue中的update」，优先级会降低到NoLane
  
```
// u0
{
  action: num => num + 1,
  lane: DefaultLane
}
// u1
{
  action: 3,
  lane: SyncLane
}
// u2
{
  action: num => num + 10,
  lane: DefaultLane
}

/*
* 第一次render
* baseState = 0; memoizedState = 0; 
* baseQueue = null; updateLane = DefaultLane;
* 第一次render 第一次计算 
* baseState = 1; memoizedState = 1; 
* baseQueue = null;
* 第一次render 第二次计算 
* baseState = 1; memoizedState = 1; 
* baseQueue = u1;
* 第一次render 第三次计算 
* baseState = 1; memoizedState = 11; 
* baseQueue = u1 -> u2(NoLane);
*/ 

/*
* 第二次render
* baseState = 1; memoizedState = 11; 
* baseQueue = u1 -> u2(NoLane); updateLane = SyncLane
* 第二次render 第一次计算 
* baseState = 3; memoizedState = 3; 
* 第二次render 第二次计算 
* baseState = 13; memoizedState = 13; 
*/ 
```

##### 保存update的问题
考虑将update保存在current中。只要不进入commit阶段，current与wip不会互换，所以保存在current中，即使多次执行render阶段，只要不进入commit阶段，都能从current中恢复数据。

###  ♢ 实现useTransition
useTransition的作用翻译成源码术语：

- 切换UI -> 触发更新
- 先显示旧的UI，待新的UI加载完成后再显示新的UI -> 「切换新UI」对应低优先级更新
  
实现的要点：

- 实现基础hook工作流程
- 实现Transition优先级
- useTransition的实现细节

###  ♢ 实现useRef
Ref数据结构：
- ~~string~~
- (instance: T) => void
```
<div ref={dom => console.log(dom)}></div>
```
- {current: T}
```
<div ref={domRef}></div>
```

HostComponent Ref工作流程:
- 标记Ref
- 执行Ref操作


###  ♢ 实现useContext
context相关实现细节：

- Context数据结构（createContext的返回值）
- JSX类型 ctx.Provider
- useContext实现

还没实现bailout，所以实现context不需要考虑这种情况(shouldComponentUpdate标记不用更新，hook又标记需要更新):
```
const ctx = createContext(null);

function App() {
  const [num, update] = useState(0);
  return (
    <ctx.Provider value={num}>
        <div onClick={() => update(Math.random())}>
          <Middle />
        </div>
    </ctx.Provider>
  );
}

class Middle extends Component {
    shouldComponentUpdate() {
        return false;
    }
    render() {
        return <Child />;
    }
}

function Child() {
  const val = useContext(ctx);
  return <p>{val}</p>;
}
```