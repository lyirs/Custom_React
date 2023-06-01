import { ReactElementType } from 'shared/ReactTypes';
import { mountChildFibers, reconcileChildFibers } from './childFibers';
import { FiberNode } from './fiber';
import { pushProvider } from './fiberContext';
import { Ref } from './fiberFlags';
import { renderWithHooks } from './fiberHooks';
import { Lane, Lanes } from './fiberLanes';
import { processUpdateQueue, UpdateQueue } from './updateQueue';
import {
	ContextProvider,
	Fragment,
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText
} from './workTags';

// 递归中的递阶段
export const beginWork = (wip: FiberNode, renderLanes: Lanes) => {
	// 与React Element比较，返回子fiberNode
	switch (wip.tag) {
		// HostRoot的beginwork工作流程
		// 1.计算状态的最新值
		// 2.创建子fiberNode
		case HostRoot:
			return updateHostRoot(wip, renderLanes);
		// HostComponent的beginwork工作流程
		// 1.创建子fiberNode
		case HostComponent:
			return updateHostComponent(wip, renderLanes);
		// HostText无子节点
		case HostText:
			return null;
		case FunctionComponent:
			return updateFunctionComponent(wip, renderLanes);
		case Fragment:
			return updateFragment(wip, renderLanes);
		case ContextProvider:
			return updateContextProvider(wip, renderLanes);
		default:
			if (__DEV__) {
				console.warn('beginwork未实现的类型');
			}
			break;
	}
	return null;
};

const updateContextProvider = (wip: FiberNode, renderLanes: Lanes) => {
	// context入栈
	// {
	// 	$$typeof: REACT_PROVIDER_TYPE,
	// 	_context: context
	// };
	const providerType = wip.type;
	const context = providerType._context;
	const oldProps = wip.memoizedProps;
	const newProps = wip.pendingProps;
	const newValue = newProps.value;

	if (__DEV__ && !('value' in newProps)) {
		console.warn('<Context.Provider>需要传递value props');
	}

	if (newValue !== oldProps.value) {
		// TODO
		// context.value变化
		// 从Provider向下DFS，寻找消费了当前变化的context的consumer
		// 如果找到consumer，从consumer向上遍历到Provider
		// 标记沿途组件存在更新
		console.log('未实现bailout');
	}

	pushProvider(context, newValue);

	const nextChildren = newProps.children;
	reconcileChildren(wip, nextChildren, renderLanes);
	return wip.child;
};

const updateFragment = (wip: FiberNode, renderLanes: Lanes) => {
	const nextChildren = wip.pendingProps;
	reconcileChildren(wip, nextChildren, renderLanes);
	return wip.child;
};

const updateFunctionComponent = (wip: FiberNode, renderLanes: Lanes) => {
	const nextChildren = renderWithHooks(wip, renderLanes);
	reconcileChildren(wip, nextChildren, renderLanes);
	return wip.child;
};

const updateHostRoot = (wip: FiberNode, renderLanes: Lanes) => {
	const baseState = wip.memoizedState;
	const updateQueue = wip.updateQueue as UpdateQueue<Element>;
	const pending = updateQueue.shared.pending;
	updateQueue.shared.pending = null;
	const { memoizedState } = processUpdateQueue(baseState, pending, renderLanes);
	wip.memoizedState = memoizedState;

	const nextChildren = wip.memoizedState;
	reconcileChildren(wip, nextChildren, renderLanes);
	return wip.child;
};

const updateHostComponent = (wip: FiberNode, renderLanes: Lanes) => {
	const nextProps = wip.pendingProps;
	const nextChildren = nextProps.children;
	markRef(wip.alternate, wip);
	reconcileChildren(wip, nextChildren, renderLanes);
	return wip.child;
};

const reconcileChildren = (
	wip: FiberNode,
	children: any,
	renderLanes: Lanes
) => {
	// 对比子current fiberNode与子reactElement生成子对应的wip fiberNode
	const current = wip.alternate;

	if (current !== null) {
		// update
		wip.child = reconcileChildFibers(wip, current.child, children, renderLanes);
	} else {
		// mount
		wip.child = mountChildFibers(wip, null, children, renderLanes);
	}
};

// 标记Ref需要满足：
// mount时：存在ref
// update时：ref引用变化

const markRef = (current: FiberNode | null, workInProgress: FiberNode) => {
	const ref = workInProgress.ref;
	if (
		(current === null && ref !== null) ||
		(current !== null && current.ref !== ref)
	) {
		workInProgress.flags |= Ref;
	}
};
