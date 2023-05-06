// ReactDOM.createRoot(root).render(<App />);

import { Instance } from 'hostConfig';
import {
	createContainer,
	updateContainer
} from 'react-reconciler/src/fiberReconciler';
import { ReactElementType } from 'shared/ReactTypes';
import { Container } from './hostConfig';

let idCounter = 0;
export const createRoot = () => {
	const container: Container = {
		rootID: idCounter++,
		children: []
	};

	// @ts-ignore
	const root = createContainer(container);

	const getChildren = (parent: Container | Instance) => {
		if (parent) {
			return parent.children;
		}
		return null;
	};

	return {
		render(element: ReactElementType) {
			return updateContainer(element, root);
		},
		getChildren() {
			return getChildren(container);
		}
	};
};
