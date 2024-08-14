// utils/indexedDBUtils.js

const dbName = "audioCacheDB";
const storeName = "audioFiles";

export const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.onupgradeneeded = (event) => {
      const db = event?.target?.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: "url" });
      }
    };

    request.onsuccess = (event) => {
      resolve(event?.target?.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

export const storeAudioFile = async (url, audioBlob) => {
  const db = await openDB();
  const tx = db.transaction(storeName, "readwrite");
  const store = tx.objectStore(storeName);
  const cacheEntry = {
    url: url,
    data: audioBlob,
    timestamp: new Date().toISOString(),
  };
  console.log("successfully stored", cacheEntry);
  store.put(cacheEntry);
  return tx.complete;
};

export const retrieveAudioFile = async (url) => {
  const db = await openDB();
  const tx = db.transaction(storeName, "readonly");
  const store = tx.objectStore(storeName);

  return new Promise((resolve, reject) => {
    const request = store.get(url);

    request.onsuccess = (event) => {
      const result = event.target.result;

      if (result) {
        const now = new Date();
        console.log("result", result);
        const cachedDate = new Date(result.timestamp);
        const maxAge = 24 * 60 * 60 * 1000; // 1 day in milliseconds
        if (now - cachedDate < maxAge) {
          console.log("Found in indexDB");
          resolve(result.data);
        } else {
          // Cache expired
          resolve(null);
        }
      } else {
        resolve(null);
      }
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};
