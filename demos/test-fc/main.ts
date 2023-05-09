// 交互触发更新
// 1.调度阶段微任务调度（ensureRootIsScheduled方法）
// 2.微任务调度结束，进入render阶段
// 3.render阶段结束，进入commit阶段
// 4.commit阶段结束，调度阶段微任务调度（ensureRootIsScheduled方法）
// 5.整体是个大的微任务循环，循环的驱动力是「微任务调度模块」。

import './style.css';

import {
	unstable_ImmediatePriority as ImmediatePriority,
	unstable_UserBlockingPriority as UserBlockingPriority,
	unstable_NormalPriority as NormalPriority,
	unstable_LowPriority as LowPriority,
	unstable_IdlePriority as IdlePriority,
	unstable_scheduleCallback as scheduleCallback,
	unstable_shouldYield as shouldYield,
	CallbackNode,
	unstable_getFirstCallbackNode as getFirstCallbackNode,
	unstable_cancelCallback as cancelCallback
} from 'scheduler';

const button = document.querySelector('button');
const root = document.querySelector('#root');

type Priority =
	| typeof IdlePriority
	| typeof LowPriority
	| typeof NormalPriority
	| typeof UserBlockingPriority
	| typeof ImmediatePriority;

interface Work {
	count: number;
	priority: Priority;
}

const workList: Work[] = [];

let prevPriority: Priority = IdlePriority;
let curCallback: CallbackNode | null = null;

[LowPriority, NormalPriority, UserBlockingPriority, ImmediatePriority].forEach(
	(priority) => {
		const btn = document.createElement('button');
		root?.appendChild(btn);
		btn.innerText = [
			'',
			'ImmediatePriority',
			'UserBlockingPriority',
			'NormalPriority',
			'LowPriority'
		][priority];
		btn.onclick = () => {
			workList.unshift({
				count: 100,
				priority: priority as Priority
			});
			schedule();
		};
	}
);

const schedule = () => {
	const cbNode = getFirstCallbackNode();
	const curWork = workList.sort((w1, w2) => w1.priority - w2.priority)[0];

	if (!curWork) {
		curCallback = null;
		cbNode && cancelCallback(cbNode);
		return;
	}

	// 策略逻辑
	const { priority: curPriority } = curWork;
	if (curPriority === prevPriority) {
		return;
	}

	// 更高优先级的work
	cbNode && cancelCallback(cbNode);
	curCallback = scheduleCallback(curPriority, perform.bind(null, curWork));
};

const perform = (work: Work, didTimeout?: boolean) => {
	/**
	 *  1. work.priority
	 *  2. 饥饿问题
	 *  3. 时间切片
	 */
	const needSync = work.priority === ImmediatePriority || didTimeout;
	while ((needSync || !shouldYield()) && work.count) {
		work.count--;
		insertSpan(work.priority + '');
	}

	// 中断执行 / 执行完
	prevPriority = work.priority;
	if (!work.count) {
		const workIndex = workList.indexOf(work);
		workList.splice(workIndex, 1);
		prevPriority = IdlePriority;
	}

	const prevCallback = curCallback;
	schedule();
	const newCallback = curCallback;

	if (newCallback && prevCallback === newCallback) {
		return perform.bind(null, work);
	}
};

const insertSpan = (content) => {
	const span = document.createElement('span');
	span.innerText = content;
	span.className = `pri-${content}`;
	doSomeBuzyWork(10000000);
	root?.appendChild(span);
};

const doSomeBuzyWork = (len: number) => {
	let result = 0;
	while (len--) {
		result += len;
	}
};

// 示例在两种情况下会造成阻塞：

// 1.work.count数量太多
// 2.单个work.count工作量太大
