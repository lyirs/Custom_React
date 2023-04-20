import { ReactElementType } from 'shared/ReactTypes';
// import { createRoot } from './src/root';  不使用这个路径是为了确保不会将react-dom打包进test-utils
// @ts-ignore
import { createRoot } from 'react-dom';

export const renderIntoDocument = (element: ReactElementType) => {
	const div = document.createElement('div');
	// 返回 element
	return createRoot(div).render(element);
};
