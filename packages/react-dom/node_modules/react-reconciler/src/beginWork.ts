import { ReactElementType } from 'shared/ReactTypes';
import { mountChildFibers, reconcileChildFibers } from './childFibers';
import { FiberNode } from './fiber';
import { renderWithHooks } from './fiberHooks';
import { Lane } from './fiberLanes';
import { processUpdateQueue, UpdateQueue } from './updateQueue';
import {
	Fragment,
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText
} from './workTags';

// 递归中的递阶段
export const beginWork = (wip: FiberNode, renderLane: Lane) => {
	// 与React Element比较，返回子fiberNode
	switch (wip.tag) {
		// HostRoot的beginwork工作流程
		// 1.计算状态的最新值
		// 2.创建子fiberNode
		case HostRoot:
			return updateHostRoot(wip, renderLane);
		// HostComponent的beginwork工作流程
		// 1.创建子fiberNode
		case HostComponent:
			return updateHostComponent(wip);
		// HostText无子节点
		case HostText:
			return null;
		case FunctionComponent:
			return updateFunctionComponent(wip, renderLane);
		case Fragment:
			return updateFragment(wip);
		default:
			if (__DEV__) {
				console.warn('beginwork未实现的类型');
			}
			break;
	}
	return null;
};

const updateFragment = (wip: FiberNode) => {
	const nextChildren = wip.pendingProps;
	reconcileChildren(wip, nextChildren);
	return wip.child;
};

const updateFunctionComponent = (wip: FiberNode, renderLane: Lane) => {
	const nextChildren = renderWithHooks(wip, renderLane);
	reconcileChildren(wip, nextChildren);
	return wip.child;
};

const updateHostRoot = (wip: FiberNode, renderLane: Lane) => {
	const baseState = wip.memoizedState;
	const updateQueue = wip.updateQueue as UpdateQueue<Element>;
	const pending = updateQueue.shared.pending;
	updateQueue.shared.pending = null;
	const { memoizedState } = processUpdateQueue(baseState, pending, renderLane);
	wip.memoizedState = memoizedState;

	const nextChildren = wip.memoizedState;
	reconcileChildren(wip, nextChildren);
	return wip.child;
};

const updateHostComponent = (wip: FiberNode) => {
	const nextProps = wip.pendingProps;
	const nextChildren = nextProps.children;
	reconcileChildren(wip, nextChildren);
	return wip.child;
};

const reconcileChildren = (wip: FiberNode, children?: ReactElementType) => {
	// 对比子current fiberNode与子reactElement生成子对应的wip fiberNode
	const current = wip.alternate;

	if (current !== null) {
		// update
		wip.child = reconcileChildFibers(wip, current?.child, children);
	} else {
		// mount
		wip.child = mountChildFibers(wip, null, children);
	}
};
