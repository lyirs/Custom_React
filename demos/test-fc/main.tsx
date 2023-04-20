import React from 'react';
import { useState } from 'react';
import ReactDOM from 'react-dom/client';

console.log(import.meta.hot);

const App = () => {
	const [num, setNum] = useState(100);
	window.setNum = setNum;
	return num === 3 ? <Child /> : <div>{num}</div>;
};

const Child = () => {
	return <span>react</span>;
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<App />
);
