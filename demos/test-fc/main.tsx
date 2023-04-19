import React from 'react';
import ReactDOM from 'react-dom/client';

const App = () => {
	return (
		<div>
			<span>big-react</span>
		</div>
	);
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<App />
);
