// Local storage utilities
export const getStoredAuth = () => {
  try {
    const stored = localStorage.getItem('auth');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const storeAuth = (token, user, rememberDevice) => {
  const authData = { token, user, timestamp: Date.now() };
  localStorage.setItem('auth', JSON.stringify(authData));
};

export const clearAuth = () => {
  localStorage.removeItem('auth');
};

// IndexedDB for offline queue
const DB_NAME = 'attendanceDB';
const DB_VERSION = 1;
const STORE_NAME = 'syncQueue';

let db = null;

export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true
        });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
};

export const addToSyncQueue = async (action, data) => {
  if (!db) await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const item = {
      action,
      data,
      timestamp: Date.now(),
      retries: 0
    };
    const request = store.add(item);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getSyncQueue = async () => {
  if (!db) await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('timestamp');
    const request = index.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const removeFromSyncQueue = async (id) => {
  if (!db) await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const clearSyncQueue = async () => {
  if (!db) await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
