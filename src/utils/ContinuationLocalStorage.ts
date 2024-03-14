import { AsyncLocalStorage } from "async_hooks";

export default class CLS<T> {
    private asyncLocalStorage = new AsyncLocalStorage<Map<string, T>>();

    runWithContext(fn: () => void): void {
        const store = new Map<string, T>();
        this.asyncLocalStorage.run(store, fn);
    }

    // Implementing runWithNewContextAsync to handle async functions
    async runWithContextAsync(fn: () => Promise<void>): Promise<void> {
        const store = new Map<string, T>();
        return new Promise<void>((resolve, reject) => {
            this.asyncLocalStorage.run(store, async () => {
                try {
                    await fn();
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    set(key: string, value: T): void {
        const store = this.asyncLocalStorage.getStore();
        store?.set(key, value);
    }

    get(key: string): T | undefined {
        const store = this.asyncLocalStorage.getStore();
        return store?.get(key);
    }
}
