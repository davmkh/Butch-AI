import { MemoryStore } from './memoryStore.ts';
import { describeStoreContract } from './storeContract.ts';

const store = new MemoryStore();
describeStoreContract('memory', () => store);
