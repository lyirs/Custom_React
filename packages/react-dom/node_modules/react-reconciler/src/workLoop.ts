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

import { scheduleMicroTask } from 'hostConfig';
import { beginWork } from './beginWork';
import {
	commitHookEffectListCreate,
	commitHookEffectListDestroy,
	commitHookEffectListUnmount,
	commitMutationEffects
} from './commitWork';
import { completeWork } from './completeWork';
import {
	createWorkInProgress,
	FiberNode,
	FiberRootNode,
	PendingPassiveEffects
} from './fiber';
import { MutationMask, NoFlags, PassiveMask } from './fiberFlags';
import {
	getHighestPriorityLane,
	Lane,
	markRootFinished,
	mergeLanes,
	NoLane,
	SyncLane
} from './fiberLanes';
import { flushSyncCallbacks, scheduleSyncCallback } from './syncTaskQueue';
import { HostRoot } from './workTags';
import {
	unstable_scheduleCallback as scheduleCallback,
	unstable_NormalPriority as NormalPriority
} from 'scheduler';
import { HookHasEffect, Passive } from './hookEffectTags';

let workInProgress: FiberNode | null = null;
let wipRootRenderLane: Lane = NoLane;
let rootDoesHasPassiveEffects = false;

const prepareFreshStack = (root: FiberRootNode, lane: Lane) => {
	workInProgress = createWorkInProgress(root.current, {});
	wipRootRenderLane = lane;
};

export const scheduleUpdateOnFiber = (fiber: FiberNode, lane: Lane) => {
	// TODO 调度
	// fiberRootNode
	const root = markUpdataFromFiberToRoot(fiber);
	markRootUpdated(root, lane);
	ensureRootIsScheduled(root);
};

// schedule阶段入口
const ensureRootIsScheduled = (root: FiberRootNode) => {
	// 实现“某些判断机制”，选出一个lane
	const updateLane = getHighestPriorityLane(root.pendingLanes);
	if (updateLane === NoLane) {
		return; // 没有更新
	}
	if (updateLane === SyncLane) {
		// 同步优先级 用微任务调度
		if (__DEV__) {
			console.log('在微任务中调度，优先级：', updateLane);
		}
		scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root, updateLane));
		scheduleMicroTask(flushSyncCallbacks);
	} else {
		// 其他优先级 用宏任务调度
	}
};

export const markRootUpdated = (root: FiberRootNode, lane: Lane) => {
	root.pendingLanes = mergeLanes(root.pendingLanes, lane);
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
const performSyncWorkOnRoot = (root: FiberRootNode, lane: Lane) => {
	const nextLane = getHighestPriorityLane(root.pendingLanes);
	if (nextLane !== SyncLane) {
		// 其他比SyncLane低的优先级
		// NoLane
		ensureRootIsScheduled(root);
		return;
	}

	if (__DEV__) {
		console.warn('render阶段开始');
	}

	// 初始化
	prepareFreshStack(root, lane);

	do {
		try {
			workLoop();
			break;
		} catch (e) {
			if (__DEV__) {
				console.warn('workLoop发生错误', e);
			}
			workInProgress = null;
		}
	} while (true);

	const finishedWork = root.current.alternate;
	root.finishedWork = finishedWork;
	root.finishedLane = lane;
	wipRootRenderLane = NoLane;

	// 根据wip fiberNode树与树中的flags 执行具体的DOM操作
	commitRoot(root);
};

const commitRoot = (root: FiberRootNode) => {
	const finishedWork = root.finishedWork;
	if (finishedWork === null) {
		return;
	}

	if (__DEV__) {
		console.warn('commit阶段开始', finishedWork);
	}

	const lane = root.finishedLane;
	if (lane === NoLane && __DEV__) {
		console.error('commit阶段finishedLane不应该是NoLane');
	}

	// 重置
	root.finishedWork = null;
	root.finishedLane = NoLane;

	markRootFinished(root, lane);

	if (
		(finishedWork.flags & PassiveMask) !== NoFlags ||
		(finishedWork.subtreeFlags & PassiveMask) !== NoFlags
	) {
		if (!rootDoesHasPassiveEffects) {
			rootDoesHasPassiveEffects = true;
			// 调度副作用
			scheduleCallback(NormalPriority, () => {
				// 执行副作用
				flushPassiveEffects(root.pendingPassiveEffects);
				return;
			});
		}
	}
	// 判断是否存在3个子阶段需要执行的操作
	// root flags
	// root subtreeFlags
	const subtreeHasEffevt =
		(finishedWork.subtreeFlags & MutationMask) !== NoFlags;
	const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags;

	if (subtreeHasEffevt || rootHasEffect) {
		// TODO 1.beforeMutation
		// 2.mutation  Placement
		commitMutationEffects(finishedWork, root);
		root.current = finishedWork;
		// TODO 3.layout
	} else {
		root.current = finishedWork;
	}

	rootDoesHasPassiveEffects = false;
	ensureRootIsScheduled(root);
};

const flushPassiveEffects = (pendingPassiveEffects: PendingPassiveEffects) => {
	// 遍历effect
	// 首先触发所有unmount effect，且对于某个fiber，如果触发了unmount destroy，本次更新不会再触发update create
	pendingPassiveEffects.unmount.forEach((effect) => {
		commitHookEffectListUnmount(Passive, effect);
	});
	pendingPassiveEffects.unmount = [];
	// 触发所有上次更新的destroy
	pendingPassiveEffects.update.forEach((effect) => {
		commitHookEffectListDestroy(Passive | HookHasEffect, effect);
	});
	// 触发所有这次更新的create
	pendingPassiveEffects.update.forEach((effect) => {
		commitHookEffectListCreate(Passive | HookHasEffect, effect);
	});
	pendingPassiveEffects.update = [];
	flushSyncCallbacks();
};

const workLoop = () => {
	while (workInProgress !== null) {
		performUnitOfWork(workInProgress);
	}
};

const performUnitOfWork = (fiber: FiberNode) => {
	const next = beginWork(fiber, wipRootRenderLane);
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
