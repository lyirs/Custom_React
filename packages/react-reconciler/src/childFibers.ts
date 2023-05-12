import { Key } from 'shared/ReactTypes';
import { REACT_ELEMENT_TYPE, REACT_FRAGMENT_TYPE } from 'shared/ReactSymbols';
import { Props, ReactElementType } from 'shared/ReactTypes';
import {
	createFiberFromElement,
	createFiberFromFragment,
	createWorkInProgress,
	FiberNode
} from './fiber';
import { ChildDeletion, Placement } from './fiberFlags';
import { Fragment, HostText } from './workTags';
import { Lanes } from './fiberLanes';

type ExistignChildren = Map<string | number, FiberNode>;

const ChildReconciler = (shouldTrackEffects: boolean) => {
	const deleteChild = (returnFiber: FiberNode, childToDelete: FiberNode) => {
		if (!shouldTrackEffects) {
			return;
		}
		const deletions = returnFiber.deletions;
		if (deletions === null) {
			returnFiber.deletions = [childToDelete];
			returnFiber.flags |= ChildDeletion;
		} else {
			deletions.push(childToDelete);
		}
	};
	const deleteRemainingChildren = (
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null
	) => {
		if (!shouldTrackEffects) {
			return;
		}
		let childToDelete = currentFirstChild;
		while (childToDelete !== null) {
			deleteChild(returnFiber, childToDelete);
			childToDelete = childToDelete.sibling;
		}
	};
	const reconcileSingleElement = (
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		element: ReactElementType,
		lanes: Lanes
	) => {
		const key = element.key;
		// 只有key与type完全相同 才能复用
		while (currentFiber !== null) {
			// update
			if (currentFiber.key === key) {
				// key相同
				if (element.$$typeof === REACT_ELEMENT_TYPE) {
					if (currentFiber.type === element.type) {
						let props = element.props;
						if (element.type === REACT_FRAGMENT_TYPE) {
							props = element.props.children;
						}
						// type相同
						const existing = useFiber(currentFiber, props);
						existing.return = returnFiber;
						// 当前节点可复用，剩下节点标记删除
						deleteRemainingChildren(returnFiber, currentFiber.sibling);
						return existing;
					}
					// key相同，type不同 删掉所有旧的
					deleteRemainingChildren(returnFiber, currentFiber);
					break;
				} else {
					if (__DEV__) {
						console.warn('还未实现的react类型', element);
						break;
					}
				}
			} else {
				// key不同 删掉旧的
				deleteChild(returnFiber, currentFiber);
				currentFiber = currentFiber.sibling;
			}
		}
		// 根据element创建fiber
		let fiber;
		if (element.type === REACT_FRAGMENT_TYPE) {
			fiber = createFiberFromFragment(element.props.children, lanes, key);
		} else {
			fiber = createFiberFromElement(element, lanes);
		}
		fiber.return = returnFiber;
		return fiber;
	};

	const reconcileSingleTextNode = (
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		content: string | number,
		lanes: Lanes
	) => {
		while (currentFiber !== null) {
			// update
			if (currentFiber.tag === HostText) {
				const existing = useFiber(currentFiber, { content });
				existing.return = returnFiber;
				deleteRemainingChildren(returnFiber, currentFiber.sibling);
				return existing;
			}
			deleteChild(returnFiber, currentFiber);
			currentFiber = currentFiber.sibling;
		}
		const fiber = new FiberNode(HostText, { content }, null);
		fiber.lanes = lanes;
		fiber.return = returnFiber;
		return fiber;
	};

	const placeSingleChild = (fiber: FiberNode) => {
		// fiber.alternate为null，也就是current为null，也就是首屏渲染的情况
		if (shouldTrackEffects && fiber.alternate === null) {
			fiber.flags |= Placement;
		}
		return fiber;
	};

	const reconcileChildrenArray = (
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		newChild: any[],
		lanes: Lanes
	) => {
		// 最后一个可复用fiber在current中的index
		let lastPlacedIndex = 0;
		// 创建的最后一个Fiber
		let lastNewFiber: FiberNode | null = null;
		// 创建的第一个Fiber
		let firstNewFiber: FiberNode | null = null;
		// 1. 将current保存在Map中
		const existingChildren: ExistignChildren = new Map();
		let current = currentFirstChild;
		while (current !== null) {
			const keyToUse = current.key !== null ? current.key : current.index;
			existingChildren.set(keyToUse, current);
			current = current.sibling;
		}

		for (let i = 0; i < newChild.length; i++) {
			// 2. 遍历newChild，寻找是否可复用
			// 在Map中存在对应current fiber，且可以复用
			// 在Map中不存在对应current fiber，或不能复用
			const after = newChild[i];

			const newFiber = updateFromMap(
				returnFiber,
				existingChildren,
				i,
				after,
				lanes
			);
			if (newFiber === null) {
				continue;
			}

			// 3. 标记移动还是插入
			newFiber.index = i;
			newFiber.return = returnFiber;

			if (lastNewFiber === null) {
				lastNewFiber = newFiber;
				firstNewFiber = newFiber;
			} else {
				lastNewFiber.sibling = newFiber;
				lastNewFiber = lastNewFiber.sibling;
			}

			if (!shouldTrackEffects) {
				continue;
			}

			const current = newFiber.alternate;
			if (current !== null) {
				const oldIndex = current.index;
				if (oldIndex < lastPlacedIndex) {
					newFiber.flags |= Placement;
					continue;
				} else {
					lastPlacedIndex = oldIndex;
				}
			} else {
				// mount
				newFiber.flags |= Placement;
			}
		}

		// 4. 将Map中剩下的标记为删除
		existingChildren.forEach((fiber) => {
			deleteChild(returnFiber, fiber);
		});

		return firstNewFiber;
	};

	const updateFromMap = (
		returnFiber: FiberNode,
		existingChildren: ExistignChildren,
		index: number,
		element: any,
		lanes: Lanes
	): FiberNode | null => {
		const keyToUse = element.key !== null ? element.key : index;
		const before = existingChildren.get(keyToUse);

		if (typeof element === 'string' || typeof element === 'number') {
			// HostText
			if (before) {
				if (before.tag === HostText) {
					existingChildren.delete(keyToUse);
					return useFiber(before, { content: element + '' });
				}
			}
			return new FiberNode(HostText, { content: element + '' }, null);
		}

		// ReactElement
		if (typeof element === 'object' && element !== null) {
			switch (element.$$typeof) {
				case REACT_ELEMENT_TYPE:
					if (element.type === REACT_FRAGMENT_TYPE) {
						return updateFragment(
							returnFiber,
							before,
							element,
							lanes,
							keyToUse,
							existingChildren
						);
					}
					if (before) {
						if (before.type === element.type) {
							existingChildren.delete(keyToUse);
							return useFiber(before, element.props);
						}
					}
					return createFiberFromElement(element, lanes);
			}
			// TODO 数组类型
			if (Array.isArray(element) && __DEV__) {
				console.warn('还未实现数组类型的child');
			}
		}

		// 数组类型
		if (Array.isArray(element)) {
			return updateFragment(
				returnFiber,
				before,
				element,
				lanes,
				keyToUse,
				existingChildren
			);
		}
		return null;
	};

	return function reconcileChildFibers(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		newChild: any,
		lanes: Lanes
	) {
		// 判断Fragment

		// <>
		// <div></div>
		// <div></div>
		// </>
		const isUnKeyedTopLevelFragment =
			typeof newChild === 'object' &&
			newChild !== null &&
			newChild.type === REACT_FRAGMENT_TYPE &&
			newChild.key === null;

		if (isUnKeyedTopLevelFragment) {
			newChild = newChild.props.children;
		}
		// 判断当前fiber的类型
		if (typeof newChild == 'object' && newChild !== null) {
			// 多节点的情况 ul> li*3
			if (Array.isArray(newChild)) {
				return reconcileChildrenArray(
					returnFiber,
					currentFiber,
					newChild,
					lanes
				);
			}
			switch (newChild.$$typeof) {
				case REACT_ELEMENT_TYPE:
					return placeSingleChild(
						reconcileSingleElement(returnFiber, currentFiber, newChild, lanes)
					);

				default:
					if (__DEV__) {
						console.warn('未实现的reconcile类型', newChild);
					}
					break;
			}
		}

		// HostText
		if (typeof newChild === 'string' || typeof newChild === 'number') {
			return placeSingleChild(
				reconcileSingleTextNode(returnFiber, currentFiber, newChild, lanes)
			);
		}

		// 兜底删除
		if (currentFiber !== null) {
			deleteRemainingChildren(returnFiber, currentFiber);
		}

		if (__DEV__) {
			console.warn('未实现的reconcile类型', newChild);
		}

		return null;
	};
};

const useFiber = (fiber: FiberNode, pendingProps: Props): FiberNode => {
	const clone = createWorkInProgress(fiber, pendingProps);
	clone.index = 0;
	clone.sibling = null;
	return clone;
};

const updateFragment = (
	returnFiber: FiberNode,
	current: FiberNode | undefined,
	elements: any[],
	lanes: Lanes,
	key: Key,
	existingChildren: ExistignChildren
) => {
	let fiber;
	if (!current || current.tag !== Fragment) {
		fiber = createFiberFromFragment(elements, lanes, key);
	} else {
		existingChildren.delete(key);
		fiber = useFiber(current, elements);
	}
	fiber.return = returnFiber;
	return fiber;
};

export const reconcileChildFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);
