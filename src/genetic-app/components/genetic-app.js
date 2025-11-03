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
      display: block;
      min-height: 100vh;
      background-color: #f3f4f6;
      font-family: 'Inter', sans-serif;
      position: relative;
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
      max-width: 80vw;
      margin: 0 auto;
      padding: 1rem;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .main-tabs {
      display: flex;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 0.75rem 0.75rem 0 0;
      backdrop-filter: blur(4px);
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-bottom: none;
      margin-top: 1rem;
    }

    .tab-button {
      flex: 1;
      padding: 1rem 2rem;
      border: none;
      background: transparent;
      cursor: pointer;
      font-weight: 600;
      font-size: 1rem;
      color: #6b7280;
      transition: all 0.2s ease;
    }

    .tab-button.active {
      background: #3b82f6;
      color: white;
    }

    .tab-button:hover:not(.active) {
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
    }

    .tab-content {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(4px);
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-top: none;
      padding: 1.5rem;
      display: grid;
      grid-template-rows: 1fr;
      grid-template-columns: 1fr;
    }

    .tab-pane {
      grid-row: 1;
      grid-column: 1;
      opacity: 1;
      transition: opacity 0.2s ease;
    }

    .tab-pane.hidden {
      opacity: 0;
      pointer-events: none;
    }

    .results-wrapper {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 0.75rem;
      backdrop-filter: blur(4px);
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      margin-top: 1rem;
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 400px;
      overflow-y: auto;
    }

    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(4px);
      padding: 1rem;
      border-radius: 0.75rem;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .header-content {
      text-align: center;
      flex: 1;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .trash-button {
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 0.5rem;
      padding: 0.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .trash-button:hover {
      background: #dc2626;
    }

    .trash-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .upload-prompt {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 0.75rem;
      backdrop-filter: blur(4px);
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 2rem;
      text-align: center;
      margin-top: 1rem;
    }

    .results-header {
      margin-bottom: 1rem;
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }

    .results-text {
      flex: 1;
    }

    .results-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: #111827;
      margin: 0 0 0.25rem 0;
    }

    .results-summary {
      font-size: 0.875rem;
      color: #6b7280;
      margin: 0;
    }

    .trait-image {
      min-width: 80px;
      height: 80px;
      border-radius: 0.5rem;
      background: #f8fafc;
      border: 2px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 3.75rem;
      flex-shrink: 0;
      padding: 0 0.5rem;
    }

    .loading-chart {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 3rem;
      margin: 1rem 0;
      color: #6b7280;
      font-size: 0.875rem;
    }

    .spinner {
      width: 1rem;
      height: 1rem;
      border: 2px solid rgba(0, 0, 0, 0.1);
      border-left-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-right: 0.5rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .disclaimer {
      font-size: 0.75rem;
      color: #6b7280;
      padding: 0.5rem;
      background-color: #f3f4f6;
      border-radius: 0.375rem;
      margin: 0.75rem 0;
    }

    .disclaimer strong {
      font-weight: 600;
    }

    .chart-container {
      display: flex;
      height: 1.5rem;
      border-radius: 0.25rem;
      overflow: hidden;
      margin: 1rem 0;
      border: 1px solid #d1d5db;
    }

    .chart-segment {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 500;
      transition: width 0.5s ease-in-out;
      position: relative;
      color: white;
    }

    .segment-label {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      font-size: 0.75rem;
      font-weight: 700;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s ease-in-out, transform 0.15s ease-in-out;
      white-space: nowrap;
      text-shadow: 0 1px 2px rgba(0,0,0,0.35);
    }

    .chart-segment:hover .segment-label {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1.02);
    }

    .chart-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: #6b7280;
      margin-top: 0.25rem;
      padding: 0 0.25rem;
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
    searchProgress: { type: Object },
    activeTab: { type: String },
    currentEmoji: { type: String }
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
    this.activeTab = 'search';
    this.currentEmoji = '🧬';
    this.database = new GeneticDatabase();
    this.gwasApi = new GWASApi();
    this.dnaBackground = null;
  }

  async firstUpdated() {
    await this._initDatabase();
    
    // Initialize DNA background after DOM is ready
    requestAnimationFrame(() => {
      const canvas = this.shadowRoot.querySelector('#dna-canvas');
      if (canvas) {
        this.dnaBackground = new DNABackground(canvas);
        this.dnaBackground.init();
      }
    });
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

  _switchTab(tab) {
    this.activeTab = tab;
  }

  async _updateEmoji(query) {
    this.currentEmoji = await this._getTraitEmoji(query);
  }

  _processResults(results) {
    if (!results) return null;
    const { query, rsidInfoMap, matchedSnps, totalAssociated } = results;
    const matchedRsidMap = new Map(matchedSnps.map(snp => [snp.rsid, snp]));
    const categories = { high: [], moderate: [], low: [], unknown: [], notFound: [] };
    let counts = { high: 0, moderate: 0, low: 0, unknown: 0, notFound: 0 };

    for (const [rsid, info] of rsidInfoMap) {
      const snp = matchedRsidMap.get(rsid);
      const traits = Array.from(info.traits).slice(0, 3).join(', ');
      const riskAlleles = Array.from(info.riskAlleles);
      const studyUrls = Array.from(info.studyUrls);

      if (snp) {
        const riskLevel = this._calculateRiskLevel(snp, riskAlleles);
        const category = riskLevel.toLowerCase().replace(' risk', '').replace(' ', '');

        categories[category].push({
          rsid,
          snp,
          traits,
          riskAlleles: riskAlleles.join(', ') || 'N/A',
          riskLevel,
          studyUrls,
          genes: Array.from(info.genes),
          effects: info.effects || []
        });
        counts[category]++;
      } else {
        categories.notFound.push({
          rsid,
          traits,
          riskAlleles: riskAlleles.join(', ') || 'N/A',
          studyUrls,
          genes: Array.from(info.genes),
          effects: info.effects || []
        });
        counts.notFound++;
      }
    }

    return {
      type: 'search-results',
      query,
      categories,
      counts,
      totalAssociated,
      totalMatched: matchedSnps.length
    };
  }

  _calculateRiskLevel(snp, riskAlleles) {
    if (riskAlleles.length === 0) return 'Unknown';

    let riskCount = 0;
    if (riskAlleles.includes(snp.allele1)) riskCount++;
    if (riskAlleles.includes(snp.allele2)) riskCount++;

    if (riskCount === 2) return 'High Risk';
    if (riskCount === 1) return 'Moderate Risk';
    return 'Low Risk';
  }

  _renderChart(processedResults) {
    if (!processedResults?.counts) {
      return html`
        <div class="loading-chart">
          <div class="spinner"></div>
          Loading risk analysis...
        </div>
      `;
    }

    const { counts, totalAssociated } = processedResults;
    const total = totalAssociated;

    if (total === 0) return '';

    const highPerc = (counts.high / total * 100).toFixed(1);
    const modPerc = (counts.moderate / total * 100).toFixed(1);
    const lowPerc = (counts.low / total * 100).toFixed(1);
    const unknownPerc = (counts.unknown / total * 100).toFixed(1);
    const notFoundPerc = (counts.notFound / total * 100).toFixed(1);

    return html`
      <div class="chart-container">
        ${counts.high > 0 ? html`
          <div class="chart-segment" style="width: ${highPerc}%; background-color: #ef4444;" title="High Risk: ${counts.high}">
            <span class="segment-label">${Math.round(highPerc)}%</span>
          </div>
        ` : ''}
        ${counts.moderate > 0 ? html`
          <div class="chart-segment" style="width: ${modPerc}%; background-color: #eab308;" title="Moderate Risk: ${counts.moderate}">
            <span class="segment-label">${Math.round(modPerc)}%</span>
          </div>
        ` : ''}
        ${counts.low > 0 ? html`
          <div class="chart-segment" style="width: ${lowPerc}%; background-color: #22c55e;" title="Low Risk: ${counts.low}">
            <span class="segment-label">${Math.round(lowPerc)}%</span>
          </div>
        ` : ''}
        ${counts.unknown > 0 ? html`
          <div class="chart-segment" style="width: ${unknownPerc}%; background-color: #6b7280;" title="Unknown Risk: ${counts.unknown}">
            <span class="segment-label">${Math.round(unknownPerc)}%</span>
          </div>
        ` : ''}
        ${counts.notFound > 0 ? html`
          <div class="chart-segment" style="width: ${notFoundPerc}%; background-color: #d1d5db; color: #374151;" title="Not Found: ${counts.notFound}">
            <span class="segment-label">${Math.round(notFoundPerc)}%</span>
          </div>
        ` : ''}
      </div>
      <div class="chart-labels">
        <span>Your Matches</span>
        <span>Not in Your Data</span>
      </div>
    `;
  }

  async _loadTraitEmojis() {
    // Force fresh load every time for now
    try {
      const response = await fetch(`./data/trait-emojis.json?v=${Date.now()}`, {
        cache: 'no-cache'
      });
      this.traitEmojis = await response.json();
      return this.traitEmojis;
    } catch (error) {
      console.warn('Failed to load trait emojis:', error);
      this.traitEmojis = {};
      return this.traitEmojis;
    }
  }

  async _getTraitEmoji(query) {
    const emojis = await this._loadTraitEmojis();
    const term = query.toLowerCase();
    const words = term.split(/\s+/);
    
    const matches = new Set();
    
    // Collect all matching emojis, excluding DNA emoji unless it's the only match
    for (const [category, data] of Object.entries(emojis)) {
      for (const keyword of data.keywords) {
        // Check if the full term contains the keyword OR if any word exactly matches the keyword
        const fullMatch = term.includes(keyword);
        const wordMatch = words.some(word => word === keyword);
        
        if (fullMatch || wordMatch) {
          if (data.emoji !== '🧬') {
            matches.add(data.emoji);
          }
        }
      }
    }
    
    // Return combined emojis or default DNA emoji
    return matches.size > 0 ? Array.from(matches).join('') : '🧬';
  }

  _renderResultsHeader() {
    if (this.searchLoading) {
      return html`
        <div class="results-header">
          <div class="results-text">
            <h3 class="results-title">Searching for "${this.currentSearchQuery}"...</h3>
            <p class="results-summary">
              ${this.searchProgress.step}${this.searchProgress.detail ? ' - ' + this.searchProgress.detail : ''}
            </p>
          </div>
          <div class="trait-image">${this.currentEmoji}</div>
        </div>
        ${this._renderChart(null)}
        <div class="disclaimer">
          <strong>Disclaimer:</strong> This is a tool for informational purposes only and is not medical advice.
          "Risk" is a statistical measure and does not mean you will or will not develop a condition.
          Consult a healthcare professional for any health concerns.
        </div>
      `;
    }

    if (!this.searchResults && !this.searchError) {
      return html`
        <div class="results-header">
          <div class="results-text">
            <h3 class="results-title">No Search Results</h3>
            <p class="results-summary">Switch to the Search tab to run queries and view results here.</p>
          </div>
        </div>
      `;
    }

    if (this.searchError) {
      return html`
        <div class="results-header">
          <div class="results-text">
            <h3 class="results-title">Search Error</h3>
            <p class="results-summary" style="color: #dc2626;">${this.searchError}</p>
          </div>
        </div>
      `;
    }

    const processedResults = this._processResults(this.searchResults);
    if (!processedResults) return '';

    const { query, counts, totalAssociated, totalMatched } = processedResults;

    return html`
      <div class="results-header">
        <div class="results-text">
          <h3 class="results-title">Results for "${query}"</h3>
          <p class="results-summary">
            Found <strong>${totalAssociated.toLocaleString()}</strong> known SNP(s) associated with this term.
            <strong style="color: ${totalMatched > 0 ? '#059669' : '#6b7280'}">${totalMatched.toLocaleString()}</strong>
            ${totalMatched === 1 ? 'match was' : 'matches were'} found in your data.
          </p>
        </div>
        <div class="trait-image">${this.currentEmoji}</div>
      </div>
      ${this._renderChart(processedResults)}
      <div class="disclaimer">
        <strong>Disclaimer:</strong> This is a tool for informational purposes only and is not medical advice.
        "Risk" is a statistical measure and does not mean you will or will not develop a condition.
        Consult a healthcare professional for any health concerns.
      </div>
    `;
  }

  async _handleSearch(event) {
    const { query } = event.detail;
    this.currentSearchQuery = query;
    this.searchLoading = true;
    this.searchError = null;
    this.searchResults = null;
    this.activeTab = 'results';
    this.dnaBackground?.setLoadingState(true);
    
    // Update emoji asynchronously
    this._updateEmoji(query);
    
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
      
      // Emoji already updated above
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
    // Show upload prompt if no data
    if (!this.recordCount && !this.clearing) {
      return html`
        <canvas id="dna-canvas"></canvas>
        <div class="container">
          <header>
            <div class="header-content">
              <h1>Genetic Mutation Lookup Tool</h1>
              <p class="subtitle">Upload a TAB-separated file to create a local, searchable database.</p>
            </div>
          </header>

          <div class="upload-prompt">
            <file-upload 
              .dbReady=${this.dbReady}
              .recordCount=${this.recordCount}
              @file-selected=${this._handleFileImport}
            ></file-upload>
          </div>
        </div>
      `;
    }

    // Show clearing progress
    if (this.clearing) {
      return html`
        <canvas id="dna-canvas"></canvas>
        <div class="container">
          <header>
            <div class="header-content">
              <h1>Genetic Mutation Lookup Tool</h1>
              <p class="subtitle">Clearing database...</p>
            </div>
          </header>

          <div class="upload-prompt">
            <progress-bar
              title="Clearing Database..."
              .progress=${this.clearProgress}
              color="#ea580c"
              text="Removing ${this.recordCount.toLocaleString()} records..."
            ></progress-bar>
          </div>
        </div>
      `;
    }

    // Main interface with data loaded
    return html`
      <canvas id="dna-canvas"></canvas>
      <div class="container">
        <header>
          <div class="header-content">
            <h1>Genetic Mutation Lookup Tool</h1>
            <p class="subtitle">${this.recordCount.toLocaleString()} genetic variants loaded</p>
          </div>
          <div class="header-actions">
            <button 
              class="trash-button"
              @click=${this._handleClearDatabase}
              title="Clear all data and start over"
            >
              🗑️
            </button>
          </div>
        </header>

        <div class="main-tabs">
          <button 
            class="tab-button ${this.activeTab === 'search' ? 'active' : ''}"
            @click=${() => this._switchTab('search')}
          >
            Search
          </button>
          <button 
            class="tab-button ${this.activeTab === 'results' ? 'active' : ''}"
            @click=${() => this._switchTab('results')}
          >
            Results
          </button>
        </div>

        <div class="tab-content">
          <div class="tab-pane ${this.activeTab === 'search' ? '' : 'hidden'}">
            <search-panel 
              .enabled=${this.recordCount > 0}
              .searching=${this.searchLoading}
              @search=${this._handleSearch}
            ></search-panel>
          </div>

          <div class="tab-pane ${this.activeTab === 'results' ? '' : 'hidden'}">
            ${this._renderResultsHeader()}
          </div>
        </div>

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
    `;
  }
}

customElements.define('genetic-app', GeneticApp);
