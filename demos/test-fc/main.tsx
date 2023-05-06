import React from 'react';
import ReactDOM from 'react-dom/client';

function App() {
	return (
		<>
			<Child />
			<div>hello world</div>
		</>
	);
}

function Child() {
	return 'Child';
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<App />
);
