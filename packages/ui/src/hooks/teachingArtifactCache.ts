/** 本地生成产物的字节缓存，元数据归 teachingCanvasStore 所有。 */
async function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("jzx-teaching-artifacts", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("bytes");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function writeTeachingArtifactBytes(id: string, data: ArrayBuffer): Promise<void> {
  const db = await open();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction("bytes", "readwrite");
      transaction.objectStore("bytes").put(data, id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
}
export async function readTeachingArtifactBytes(id: string): Promise<ArrayBuffer> {
  const db = await open();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction("bytes", "readonly").objectStore("bytes").get(id);
      request.onsuccess = () =>
        request.result instanceof ArrayBuffer
          ? resolve(request.result)
          : reject(new Error("Artifact bytes unavailable"));
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}
