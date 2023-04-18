/**
 * 对于同一个节点，比较其ReactElement与fiberNode，生成子fiberNode。
 * 并根据比较的结果生成不同标记（插入、删除、移动......），对应不同宿主环境API的执行。
 *
 * 当所有ReactElement比较完后，会生成一棵fiberNode树，一共会存在两棵fiberNode树：
 *  current：与视图中真实UI对应的fiberNode树
 *  workInProgress：触发更新后，正在reconciler中计算的fiberNode树
 *
 * 以DFS（深度优先遍历）的顺序遍历ReactElement
 */

import { beginWork } from './beginWork';
import { completeWork } from './completeWork';
import { createWorkInProgress, FiberNode, FiberRootNode } from './fiber';
import { HostRoot } from './workTags';

let workInProgress: FiberNode | null = null;

const prepareFreshStack = (root: FiberRootNode) => {
	workInProgress = createWorkInProgress(root.current, {});
};

export const scheduleUpdateOnFiber = (fiber: FiberNode) => {
	// fiberRootNode
	const root = markUpdataFromFiberToRoot(fiber);
	renderRoot(root);
};

const markUpdataFromFiberToRoot = (fiber: FiberNode) => {
	let node = fiber;
	let parent = node.return;
	while (parent !== null) {
		node = parent;
		parent = node.return;
	}
	if (node.tag === HostRoot) {
		return node.stateNode;
	}
	return null;
};
const renderRoot = (root: FiberRootNode) => {
	// 初始化
	prepareFreshStack(root);

	do {
		try {
			workLoop();
			break;
		} catch (e) {
			console.log('workLoop发生错误', e);
			workInProgress = null;
		}
	} while (true);
};

const workLoop = () => {
	while (workInProgress !== null) {
		performUnitOfWork(workInProgress);
	}
};

const performUnitOfWork = (fiber: FiberNode) => {
	const next = beginWork(fiber);
	fiber.memoizedProps = fiber.pendingProps;

	if (next === null) {
		completeUnitOfWork(fiber);
	} else {
		workInProgress = next;
	}
};

const completeUnitOfWork = (fiber: FiberNode) => {
	let node: FiberNode | null = fiber;

	do {
		completeWork(node);
		const siblind = node.sibling;
		if (siblind !== null) {
			workInProgress = siblind;
			return;
		}
		node = node.return;
		workInProgress = node;
	} while (node !== null);
};
