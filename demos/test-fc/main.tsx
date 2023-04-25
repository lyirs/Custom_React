import React from 'react';
import { useState } from 'react';
import ReactDOM from 'react-dom/client';

console.log(import.meta.hot);

const App = () => {
	const [num, setNum] = useState(100);

	const arr =
		num % 2 === 0
			? [<li key="1">1</li>, <li key="2">2</li>, <li key="3">3</li>]
			: [<li key="3">3</li>, <li key="2">2</li>, <li key="1">1</li>];
	return <ul onClick={() => setNum(num + 1)}>{arr}</ul>;
};

const Child = () => {
	return <span>react</span>;
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<App />
);
