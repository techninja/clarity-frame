/**
 * @typedef {Object} SNPRecord
 * @property {string} rsid
 * @property {string} chromosome
 * @property {number} position
 * @property {string} allele1
 * @property {string} allele2
 */

export class GeneticDatabase {
  constructor() {
    this.db = null;
  }

  /**
   * Initialize IndexedDB
   * @returns {Promise<void>}
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('GeneticsDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const store = db.createObjectStore('snps', { keyPath: 'rsid' });
        store.createIndex('chromosome', 'chromosome', { unique: false });
        store.createIndex('position', 'position', { unique: false });
      };
    });
  }

  /**
   * Get record count
   * @returns {Promise<number>}
   */
  async getCount() {
    const transaction = this.db.transaction(['snps'], 'readonly');
    const store = transaction.objectStore('snps');
    return new Promise((resolve, reject) => {
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all data
   * @returns {Promise<void>}
   */
  async clear() {
    const transaction = this.db.transaction(['snps'], 'readwrite');
    const store = transaction.objectStore('snps');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all data with progress tracking
   * @param {Function} progressCallback
   * @returns {Promise<void>}
   */
  async clearWithProgress(progressCallback) {
    const totalRecords = await this.getCount();
    const batchSize = 10000;
    let deleted = 0;

    while (deleted < totalRecords) {
      const transaction = this.db.transaction(['snps'], 'readwrite');
      const store = transaction.objectStore('snps');
      const keys = [];
      
      // Get batch of keys
      const keyRequest = store.openCursor();
      await new Promise((resolve) => {
        let collected = 0;
        keyRequest.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor && collected < batchSize) {
            keys.push(cursor.key);
            collected++;
            cursor.continue();
          } else {
            resolve();
          }
        };
      });

      // Delete batch
      if (keys.length > 0) {
        const deleteTransaction = this.db.transaction(['snps'], 'readwrite');
        const deleteStore = deleteTransaction.objectStore('snps');
        
        keys.forEach(key => deleteStore.delete(key));
        
        await new Promise((resolve, reject) => {
          deleteTransaction.oncomplete = () => resolve();
          deleteTransaction.onerror = () => reject(deleteTransaction.error);
        });
        
        deleted += keys.length;
        progressCallback?.(deleted, totalRecords);
      } else {
        break;
      }
    }
  }

  /**
   * Import SNP data in batches
   * @param {string} fileContents
   * @param {Function} progressCallback - Called with (current, total)
   * @returns {Promise<number>}
   */
  async importData(fileContents, progressCallback) {
    const lines = fileContents.split('\n');
    const dataLines = lines.filter(line => 
      line.trim() && !line.startsWith('#') && !line.startsWith('rsid')
    );
    
    const batchSize = 5000;
    let processed = 0;

    for (let i = 0; i < dataLines.length; i += batchSize) {
      const batch = dataLines.slice(i, i + batchSize);
      await this._processBatch(batch);
      processed += batch.length;
      progressCallback?.(processed, dataLines.length);
    }

    return dataLines.length;
  }

  /**
   * Process a batch of SNP records
   * @param {string[]} batch
   * @returns {Promise<void>}
   */
  async _processBatch(batch) {
    const transaction = this.db.transaction(['snps'], 'readwrite');
    const store = transaction.objectStore('snps');

    batch.forEach(line => {
      const columns = line.split('\t');
      if (columns.length === 5) {
        const record = {
          rsid: columns[0].trim(),
          chromosome: columns[1].trim(),
          position: parseInt(columns[2], 10),
          allele1: columns[3].trim(),
          allele2: columns[4].trim()
        };
        store.put(record);
      }
    });

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Find SNPs by rsIDs
   * @param {string[]} rsids
   * @returns {Promise<SNPRecord[]>}
   */
  async findByRsids(rsids) {
    const transaction = this.db.transaction(['snps'], 'readonly');
    const store = transaction.objectStore('snps');
    const results = [];

    return new Promise((resolve) => {
      let completed = 0;
      
      rsids.forEach(rsid => {
        const request = store.get(rsid);
        request.onsuccess = () => {
          if (request.result) results.push(request.result);
          completed++;
          if (completed === rsids.length) resolve(results);
        };
        request.onerror = () => {
          completed++;
          if (completed === rsids.length) resolve(results);
        };
      });
    });
  }
}