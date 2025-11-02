import { LitElement, html, css } from 'lit';
import { GeneticDatabase } from '../lib/database.js';
import { GWASApi } from '../lib/gwas-api.js';
import { DNABackground } from '../lib/dna-background.js';
import './file-upload.js';
import './search-panel.js';
import './results-display.js';
import './progress-bar.js';

export class GeneticApp extends LitElement {
  static styles = css`
    :host {
      --header-height: 6rem;
      --search-panel-height: 16rem;
      display: block;
      min-height: 100vh;
      background-color: #f3f4f6;
      font-family: 'Inter', sans-serif;
      position: relative;
    }

    @media (min-width: 768px) {
      :host {
        height: 100vh;
        overflow: hidden;
      }
    }



    #dna-canvas {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }

    .container {
      position: relative;
      z-index: 1;
      max-width: 48rem;
      margin: 0 auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }

    @media (min-width: 768px) {
      .container {
        max-width: 80vw;
        padding: 0;
        gap: 0;
        height: 100vh;
        justify-content: flex-start;
      }
    }

    .content-area {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    @media (min-width: 768px) {
      .content-area {
        flex: 1;
        padding: var(--header-height) 1rem 0 1rem;
        overflow: hidden;
        min-height: 0;
      }
    }

    .results-wrapper {
      width: 100%;
    }

    @media (min-width: 768px) {
      .results-wrapper {
        flex: 1;
        min-height: 0;
        height: 0;
      }
    }

    header {
      text-align: center;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(4px);
      padding: 1rem;
      border-radius: 0.75rem;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    @media (min-width: 768px) {
      header {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 50;
        max-width: 80vw;
        margin: 0 auto;
        padding: 1rem;
        border-radius: 0;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      }
    }

    h1 {
      font-size: 1.875rem;
      font-weight: 700;
      color: #111827;
      margin: 0 0 0.5rem 0;
    }

    .subtitle {
      color: #6b7280;
      margin: 0;
    }

    .card {
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 0.75rem;
      padding: 1.5rem;
      backdrop-filter: blur(4px);
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      text-align: center;
    }

    .clear-button {
      margin: 0 auto;
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: white;
      background-color: #ea580c;
      border: none;
      border-radius: 0.375rem;
      cursor: pointer;
      transition: background-color 0.15s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .clear-button:hover:not(:disabled) {
      background-color: #c2410c;
    }

    .clear-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .spinner {
      width: 1rem;
      height: 1rem;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-left-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .hidden {
      display: none;
    }
  `;

  static properties = {
    dbReady: { type: Boolean },
    recordCount: { type: Number },
    showClearButton: { type: Boolean },
    clearing: { type: Boolean },
    clearProgress: { type: Number },
    searchLoading: { type: Boolean },
    searchResults: { type: Object },
    searchError: { type: String },
    currentSearchQuery: { type: String },
    searchProgress: { type: Object }
  };

  constructor() {
    super();
    this.dbReady = false;
    this.recordCount = 0;
    this.showClearButton = false;
    this.clearing = false;
    this.clearProgress = 0;
    this.searchLoading = false;
    this.searchResults = null;
    this.searchError = null;
    this.currentSearchQuery = '';
    this.searchProgress = { step: '', detail: '' };
    this.database = new GeneticDatabase();
    this.gwasApi = new GWASApi();
    this.dnaBackground = null;
  }

  async firstUpdated() {
    const canvas = this.shadowRoot.querySelector('#dna-canvas');
    if (canvas) {
      this.dnaBackground = new DNABackground(canvas);
      this.dnaBackground.init();
      console.log('DNA background initialized');
    } else {
      console.error('Canvas not found');
    }

    await this._initDatabase();
  }

  async _initDatabase() {
    try {
      await this.database.init();
      this.recordCount = await this.database.getCount();
      this.dbReady = true;
      this.showClearButton = this.recordCount > 0;
    } catch (error) {
      console.error('Database initialization failed:', error);
    }
  }

  async _handleFileImport(event) {
    const { file } = event.detail;
    this.dnaBackground?.setLoadingState(true);
    
    try {
      const fileContents = await this._readFile(file);
      const totalRecords = await this.database.importData(
        fileContents,
        (current, total) => {
          this._dispatchProgress(current, total);
        }
      );
      
      this.recordCount = totalRecords;
      this.showClearButton = true;
      this._dispatchImportComplete(totalRecords);
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      this.dnaBackground?.setLoadingState(false);
    }
  }

  async _handleSearch(event) {
    const { query } = event.detail;
    this.currentSearchQuery = query;
    this.searchLoading = true;
    this.searchError = null;
    this.searchResults = null;
    this.dnaBackground?.setLoadingState(true);
    
    try {
      const rsIdPattern = /^rs\d+$/i;
      let rsidInfoMap;
      
      if (rsIdPattern.test(query)) {
        this.searchProgress = { step: 'Looking up rsID', detail: 'Querying GWAS Catalog' };
        const [result] = await Promise.all([
          this.gwasApi.searchByRsid(query),
          new Promise(resolve => setTimeout(resolve, 800))
        ]);
        rsidInfoMap = result;
      } else {
        this.searchProgress = { step: 'Searching traits', detail: 'Querying GWAS Catalog' };
        const [result] = await Promise.all([
          this.gwasApi.searchByTrait(query, (current, total, step) => {
            if (typeof step === 'string' && (step.includes('%') || step.includes('MB'))) {
              this.searchProgress = { step: 'Downloading data', detail: step };
            } else {
              this.searchProgress = { step: step, detail: '' };
            }
            this.requestUpdate();
          }, 1000),
          new Promise(resolve => setTimeout(resolve, 800))
        ]);
        rsidInfoMap = result;
      }
      
      const allRsids = Array.from(rsidInfoMap.keys());
      this.searchProgress = { step: 'Found ' + allRsids.length + ' associations', detail: 'Searching your genetic data' };
      
      const [matchedSnps] = await Promise.all([
        this.database.findByRsids(allRsids),
        new Promise(resolve => setTimeout(resolve, 600))
      ]);
      
      this.searchResults = {
        query,
        rsidInfoMap,
        matchedSnps,
        totalAssociated: allRsids.length,
        isLimited: allRsids.length >= 1000
      };
    } catch (error) {
      console.error('Search failed:', error);
      this.searchError = error.message || 'An unexpected error occurred during search';
    } finally {
      this.searchLoading = false;
      this.searchProgress = { step: '', detail: '' };
      this.dnaBackground?.setLoadingState(false);
    }
  }

  async _handleClearDatabase() {
    this.clearing = true;
    this.clearProgress = 0;
    
    try {
      await this.database.clearWithProgress((deleted, total) => {
        this.clearProgress = total > 0 ? (deleted / total) * 100 : 0;
        this.requestUpdate();
      });
      
      this.clearProgress = 100;
      this.requestUpdate();
      
      // Brief delay to show 100% then reload
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Clear database failed:', error);
      this.clearing = false;
      this.clearProgress = 0;
    }
  }

  _readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }

  _dispatchProgress(current, total) {
    document.dispatchEvent(new CustomEvent('import-progress', {
      detail: { current, total }
    }));
  }

  _dispatchImportComplete(totalRecords) {
    document.dispatchEvent(new CustomEvent('import-complete', {
      detail: { totalRecords }
    }));
  }

  _dispatchSearchResults(results) {
    document.dispatchEvent(new CustomEvent('search-results', {
      detail: results
    }));
  }

  _dispatchSearchError(error) {
    document.dispatchEvent(new CustomEvent('search-error', {
      detail: { error }
    }));
  }

  render() {
    return html`
      <canvas id="dna-canvas"></canvas>
      <div class="container">
        <header>
          <h1>Genetic Mutation Lookup Tool</h1>
          <p class="subtitle">Upload a TAB-separated file to create a local, searchable database.</p>
        </header>

        <div class="content-area">
          ${this.clearing ? html`
            <div class="card">
              <progress-bar
                title="Clearing Database..."
                .progress=${this.clearProgress}
                color="#ea580c"
                text="Removing ${this.recordCount.toLocaleString()} records..."
              ></progress-bar>
            </div>
          ` : html`
            <file-upload 
              .dbReady=${this.dbReady}
              .recordCount=${this.recordCount}
              @file-selected=${this._handleFileImport}
            ></file-upload>
            ${this.showClearButton ? html`
              <div class="card">
                <button 
                  class="clear-button"
                  @click=${this._handleClearDatabase}
                >
                  Clear Stored Data & Start Over
                </button>
              </div>
            ` : ''}
          `}

          <div class="results-wrapper">
            <results-display
              .loading=${this.searchLoading}
              .results=${this.searchResults}
              .error=${this.searchError}
              .searchQuery=${this.currentSearchQuery}
              .searchProgress=${this.searchProgress}
            ></results-display>
          </div>
        </div>

        <search-panel 
          .enabled=${this.recordCount > 0}
          .searching=${this.searchLoading}
          @search=${this._handleSearch}
        ></search-panel>
      </div>
    `;
  }
}

customElements.define('genetic-app', GeneticApp);