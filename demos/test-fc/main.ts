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
		insertSpan('0 ');
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
