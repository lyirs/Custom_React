// 同步任务队列
let syncQueue: ((...args: any) => void)[] | null = null;
let isFlushingSyncQueue = false;

// 调度
export const scheduleSyncCallback = (callback: (...args: any) => void) => {
	if (syncQueue === null) {
		syncQueue = [callback];
	} else {
		syncQueue.push(callback);
	}
};

// 执行
export const flushSyncCallbacks = () => {
	if (!isFlushingSyncQueue && syncQueue) {
		isFlushingSyncQueue = true;
		try {
			syncQueue.forEach((callback) => callback());
		} catch (e) {
			if (__DEV__) {
				console.error('flushSyncCallbacks报错', e);
			}
		} finally {
			isFlushingSyncQueue = false;
			syncQueue = null;
		}
	}
};
