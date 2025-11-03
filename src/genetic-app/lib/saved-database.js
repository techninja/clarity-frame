/**
 * @typedef {Object} SavedItem
 * @property {string} rsid
 * @property {string} searchTrait
 * @property {Object} snpData
 * @property {Object} traitInfo
 * @property {string} notes
 * @property {number} savedAt
 */

export class SavedDatabase {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SavedGeneticsDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const store = db.createObjectStore('saved', { keyPath: 'rsid' });
        store.createIndex('savedAt', 'savedAt', { unique: false });
      };
    });
  }

  async saveItem(rsid, searchTrait, snpData, traitInfo, notes = '') {
    const transaction = this.db.transaction(['saved'], 'readwrite');
    const store = transaction.objectStore('saved');
    
    const item = {
      rsid,
      searchTrait,
      snpData,
      traitInfo,
      notes,
      savedAt: Date.now()
    };
    
    return new Promise((resolve, reject) => {
      const request = store.put(item);
      request.onsuccess = () => resolve(item);
      request.onerror = () => reject(request.error);
    });
  }

  async removeItem(rsid) {
    const transaction = this.db.transaction(['saved'], 'readwrite');
    const store = transaction.objectStore('saved');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(rsid);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getItem(rsid) {
    const transaction = this.db.transaction(['saved'], 'readonly');
    const store = transaction.objectStore('saved');
    
    return new Promise((resolve, reject) => {
      const request = store.get(rsid);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllItems() {
    const transaction = this.db.transaction(['saved'], 'readonly');
    const store = transaction.objectStore('saved');
    const index = store.index('savedAt');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll();
      request.onsuccess = () => resolve(request.result.reverse()); // Most recent first
      request.onerror = () => reject(request.error);
    });
  }

  async updateNotes(rsid, notes) {
    const item = await this.getItem(rsid);
    if (!item) throw new Error('Item not found');
    
    item.notes = notes;
    return this.saveItem(item.rsid, item.searchTrait, item.snpData, item.traitInfo, notes);
  }

  async isItemSaved(rsid) {
    const item = await this.getItem(rsid);
    return !!item;
  }
}