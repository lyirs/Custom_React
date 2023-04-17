/**
 * ReactElement如果作为核心模块操作的数据结构，存在的问题：
    ♢ 无法表达节点之间的关系
    ♢ 字段有限，不好拓展（比如：无法表达状态）
    所以，需要一种新的数据结构，他的特点：
    ♢ 介于ReactElement与真实UI节点之间
    ♢ 能够表达节点之间的关系
    ♢ 方便拓展（不仅作为数据存储单元，也能作为工作单元）
    这就是FiberNode（虚拟DOM在React中的实现）
 */

import { Props, Key, Ref } from 'shared/ReactTypes';
import { Flags, NoFlags } from './fiberFlags';
import { WorkTag } from './workTags';

export class FiberNode {
	type: any;
	tag: WorkTag;
	pendingProps: Props;
	key: Key;
	stateNode: any;
	ref: Ref;
	return: FiberNode | null;
	sibling: FiberNode | null;
	child: FiberNode | null;
	index: number;

	memoizedProps: Props | null;
	alternate: FiberNode | null; // 用于在current fiberNode树与workInProgress中切换
	flags: Flags;
	constructor(tag: WorkTag, pendingProps: Props, key: Key) {
		this.tag = tag;
		this.key = key;
		// HostComponent <div> div DOM
		this.stateNode = null;
		// FunctionComponent () => {}
		this.type = null;

		// 构成树状结构
		// 指向父fiberNode
		this.return = null;
		// 指向兄弟fiberNode
		this.sibling = null;
		this.child = null;
		// <ul> li *3 <.ul>
		this.index = 0;

		this.ref = null;

		// 作为工作单元
		this.pendingProps = pendingProps;
		this.memoizedProps = null;

		this.alternate = null;
		// 副作用
		this.flags = NoFlags;
	}
}
