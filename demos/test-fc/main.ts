// 交互触发更新
// 1.调度阶段微任务调度（ensureRootIsScheduled方法）
// 2.微任务调度结束，进入render阶段
// 3.render阶段结束，进入commit阶段
// 4.commit阶段结束，调度阶段微任务调度（ensureRootIsScheduled方法）
// 5.整体是个大的微任务循环，循环的驱动力是「微任务调度模块」。

import './style.css';

const button = document.querySelector('button');
const root = document.querySelector('#root');

interface Work {
	count: number;
}

const workList: Work[] = [];

const schedule = () => {
	const curWork = workList.pop();

	if (curWork) {
		perform(curWork);
	}
};

const perform = (work: Work) => {
	while (work.count) {
		work.count--;
		insertSpan('0');
	}
	schedule();
};

const insertSpan = (content) => {
	const span = document.createElement('span');
	span.innerText = content;
	root?.appendChild(span);
};

button &&
	(button.onclick = () => {
		workList.unshift({
			count: 100
		});
		schedule();
	});

// 示例在两种情况下会造成阻塞：

// 1.work.count数量太多
// 2.单个work.count工作量太大
