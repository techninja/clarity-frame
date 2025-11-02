import { LitElement, html, css } from 'lit';
import './dna-loader.js';
import './lazy-results.js';

export class ResultsDisplay extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .results-container {
      background: rgba(249, 250, 251, 0.9);
      border: 1px solid #e5e7eb;
      border-radius: 0.75rem;
      backdrop-filter: blur(2px);
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
    }

    @media (min-width: 768px) {
      .results-container {
        height: calc(100vh - var(--header-height, 8rem) - var(--search-panel-height, 12rem));
      }
    }

    .results-header-section {
      padding: 1.25rem;
      flex-shrink: 0;
    }

    .results-header {
      margin-bottom: 1rem;
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

    /* New: centered hover label for each segment */
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

    .tabs {
      display: flex;
      border-bottom: 1px solid #e5e7eb;
      margin: 1rem 0 0 0;
      overflow-x: auto;
      flex-shrink: 0;
    }

    .tab-button {
      padding: 0.75rem 1.25rem;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      font-weight: 500;
      color: #6b7280;
      white-space: nowrap;
      background: none;
      border-left: none;
      border-right: none;
      border-top: none;
    }

    .tab-button.active {
      border-bottom-color: #3b82f6;
      color: #3b82f6;
    }

    .tab-content {
      flex: 1;
      overflow: hidden;
      min-height: 0;
    }

    .tab-pane {
      height: 100%;
      display: block;
    }

    .tab-pane.hidden {
      display: none;
    }

    .limit-warning {
      background-color: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 0.375rem;
      padding: 0.75rem;
      margin: 0.75rem 1rem;
      font-size: 0.875rem;
      color: #92400e;
    }

    .snp-card {
      border: 1px solid;
      padding: 0.75rem;
      border-radius: 0.375rem;
      box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    }

    .snp-card.high-risk {
      background-color: #fef2f2;
      border-color: #fecaca;
    }

    .snp-card.moderate-risk {
      background-color: #fffbeb;
      border-color: #fed7aa;
    }

    .snp-card.low-risk {
      background-color: #f0fdf4;
      border-color: #bbf7d0;
    }

    .snp-card.unknown-risk {
      background-color: #f9fafb;
      border-color: #e5e7eb;
    }

    .snp-card.not-found {
      background-color: #ffffff;
      border-color: #e5e7eb;
    }

    .snp-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      font-weight: 600;
    }

    .snp-header.high-risk { color: #991b1b; }
    .snp-header.moderate-risk { color: #92400e; }
    .snp-header.low-risk { color: #166534; }
    .snp-header.unknown-risk { color: #374151; }

    .match-badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
    }

    .match-badge.found {
      background-color: #dcfce7;
      color: #166534;
    }

    .match-badge.not-found {
      background-color: #f3f4f6;
      color: #6b7280;
    }

    .snp-details {
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid #e5e7eb;
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 0.5rem 1rem;
      font-size: 0.875rem;
      color: #374151;
    }

    .detail-label {
      font-weight: 600;
      color: #6b7280;
    }

    .allele-display {
      font-family: monospace;
      background-color: #e5e7eb;
      padding: 0.125rem 0.25rem;
      border-radius: 0.25rem;
    }

    .risk-level {
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .risk-icon {
      width: 1rem;
      height: 1rem;
    }

    .external-link {
      color: #3b82f6;
      text-decoration: none;
    }

    .external-link:hover {
      text-decoration: underline;
    }

    .empty-state {
      font-size: 0.875rem;
      color: #6b7280;
      padding: 0.75rem;
      text-align: center;
    }

    .loading-state {
      padding: 1rem;
      background-color: #dbeafe;
      color: #1e40af;
      border-radius: 0.5rem;
      text-align: center;
    }

    .error-state {
      padding: 1rem;
      background-color: #fef2f2;
      color: #991b1b;
      border-radius: 0.5rem;
    }

    .hidden {
      display: none;
    }

    .loader-overlay {
      position: fixed;
      top: 8rem;
      left: 10vw;
      right: 10vw;
      bottom: 8rem;
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
      opacity: 1;
      transition: opacity 0.5s ease-in-out;
      border-radius: 0.75rem;
    }

    @media (max-width: 767px) {
      .loader-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
      }
    }

    .loader-overlay.fade-out {
      opacity: 0;
      pointer-events: none;
    }

    .content-wrapper {
      position: relative;
      opacity: 1;
      transition: opacity 0.3s ease-in-out;
    }

    .content-wrapper.fade-in {
      opacity: 1;
    }
  `;

  static properties = {
    results: { type: Object },
    loading: { type: Boolean },
    error: { type: String },
    activeTab: { type: String },
    showLoader: { type: Boolean },
    debugLoading: { type: Boolean },
    searchQuery: { type: String },
    searchProgress: { type: Object }
  };

  constructor() {
    super();
    this.results = null;
    this.loading = false;
    this.error = null;
    this.activeTab = 'high';
    this.showLoader = false;
    this.debugLoading = false;
    this.searchQuery = '';
    this.searchProgress = { step: '', detail: '' };
  }



  updated(changedProperties) {
    if (changedProperties.has('results') && this.results) {
      this._setDefaultActiveTab();
    }

    if (changedProperties.has('loading')) {
      if (this.loading) {
        this.showLoader = true;
      } else if (this.showLoader) {
        // Fade out loader after a brief delay
        setTimeout(() => {
          this.showLoader = false;
        }, 300);
      }
    }
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
          studyUrls
        });
        counts[category]++;
      } else {
        categories.notFound.push({
          rsid,
          traits,
          riskAlleles: riskAlleles.join(', ') || 'N/A',
          studyUrls
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

  _setDefaultActiveTab() {
    if (!this.results?.counts) return;

    const tabOrder = ['high', 'moderate', 'low', 'unknown', 'notFound'];
    this.activeTab = tabOrder.find(tab => this.results.counts[tab] > 0) || 'high';
  }

  _switchTab(tab) {
    this.activeTab = tab;
    // Reset scroll position
    const tabContent = this.shadowRoot.querySelector('.tab-content');
    if (tabContent) tabContent.scrollTop = 0;
  }

  _renderChart(processedResults) {
    if (!processedResults?.counts) return '';

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

  _renderSnpCard(item, category) {
    const isMatched = category !== 'notFound';
    const riskClass = category === 'high' ? 'high-risk' :
                     category === 'moderate' ? 'moderate-risk' :
                     category === 'low' ? 'low-risk' :
                     category === 'unknown' ? 'unknown-risk' : 'not-found';

    return html`
      <div class="snp-card ${riskClass}">
        <details open>
          <summary class="snp-header ${riskClass}">
            <span>${item.rsid}</span>
            <span class="match-badge ${isMatched ? 'found' : 'not-found'}">
              ${isMatched ? 'MATCH FOUND' : 'Not in your data'}
            </span>
          </summary>

          ${isMatched ? html`
            <div class="snp-details">
              <span class="detail-label">Associated Trait(s):</span>
              <span>${item.traits}</span>

              <span class="detail-label">Risk Allele(s):</span>
              <span class="allele-display">${item.riskAlleles}</span>

              <span class="detail-label">Your Alleles:</span>
              <span class="allele-display">${item.snp.allele1} / ${item.snp.allele2}</span>

              <span class="detail-label">Risk Level:</span>
              <span class="risk-level ${riskClass}">${item.riskLevel}</span>

              <span class="detail-label">More Info:</span>
              <a href="https://www.ncbi.nlm.nih.gov/snp/${item.rsid}" target="_blank" class="external-link">dbSNP</a>
            </div>
          ` : html`
            <div class="snp-details">
              <span class="detail-label">Associated Trait(s):</span>
              <span>${item.traits}</span>

              <span class="detail-label">Risk Allele(s):</span>
              <span class="allele-display">${item.riskAlleles}</span>

              <span class="detail-label">More Info:</span>
              <a href="https://www.ncbi.nlm.nih.gov/snp/${item.rsid}" target="_blank" class="external-link">dbSNP</a>
            </div>
          `}
        </details>
      </div>
    `;
  }

  render() {
    // Debug: Force loading state
    if (this.debugLoading) {
      return html`
        <dna-loader
          message="Searching GWAS Catalog..."
          subtitle="This may take 30+ seconds for complex traits"
        ></dna-loader>
      `;
    }

    // Show error state
    if (this.error && !this.loading) {
      return html`
        <div class="error-state">
          <strong>Error:</strong> ${this.error}
        </div>
      `;
    }

    // Show empty state
    if (!this.results && !this.loading) {
      return html`
        <div class="results-container">
          <div class="empty-state">
            Search for traits or rsIDs to see results here.
          </div>
        </div>
      `;
    }

    // Process results if available
    const processedResults = this.results ? this._processResults(this.results) : null;
    const hasResults = processedResults && !this.error;

    let content = html``;
    if (hasResults) {
      const { query, categories, counts, totalAssociated, totalMatched } = processedResults;
      content = this._renderResults(query, categories, counts, totalAssociated, totalMatched);
    }

    return html`
      <div class="content-wrapper ${hasResults ? 'fade-in' : ''}">
        ${content}

        ${this.showLoader ? html`
          <div class="loader-overlay ${!this.loading ? 'fade-out' : ''}">
            <dna-loader
              message="Searching for '${this.searchQuery}'..."
              subtitle="${this.searchProgress.step}${this.searchProgress.detail ? ' - ' + this.searchProgress.detail : ''}"
            ></dna-loader>
          </div>
        ` : ''}
      </div>
    `;
  }

  _renderResults(query, categories, counts, totalAssociated, totalMatched) {

    const processedResults = { query, categories, counts, totalAssociated, totalMatched };

    return html`
      <div class="results-container">
        <div class="results-header-section">
          <div class="results-header">
            <h3 class="results-title">Results for "${query}"</h3>
            <p class="results-summary">
              Found <strong>${totalAssociated.toLocaleString()}</strong> known SNP(s) associated with this term.
              <strong style="color: ${totalMatched > 0 ? '#059669' : '#6b7280'}">${totalMatched.toLocaleString()}</strong>
              ${totalMatched === 1 ? 'match was' : 'matches were'} found in your data.
            </p>
          </div>

          ${this._renderChart(processedResults)}

          <div class="disclaimer">
            <strong>Disclaimer:</strong> This is a tool for informational purposes only and is not medical advice.
            "Risk" is a statistical measure and does not mean you will or will not develop a condition.
            Consult a healthcare professional for any health concerns.
          </div>

          <div class="tabs">
          <button class="tab-button ${this.activeTab === 'high' ? 'active' : ''}"
                  @click=${() => this._switchTab('high')}>
            High Risk (${counts.high})
          </button>
          <button class="tab-button ${this.activeTab === 'moderate' ? 'active' : ''}"
                  @click=${() => this._switchTab('moderate')}>
            Moderate Risk (${counts.moderate})
          </button>
          <button class="tab-button ${this.activeTab === 'low' ? 'active' : ''}"
                  @click=${() => this._switchTab('low')}>
            Low Risk (${counts.low})
          </button>
          <button class="tab-button ${this.activeTab === 'unknown' ? 'active' : ''}"
                  @click=${() => this._switchTab('unknown')}>
            Unknown Risk (${counts.unknown})
          </button>
          <button class="tab-button ${this.activeTab === 'notFound' ? 'active' : ''}"
                  @click=${() => this._switchTab('notFound')}>
            Not Found (${counts.notFound})
          </button>
          </div>
        </div>

        ${processedResults.isLimited ? html`
          <div class="limit-warning">
            <strong>Results Limited:</strong> Showing first 1,000 associations to prevent performance issues. 
            Try a more specific search term for complete results.
          </div>
        ` : ''}

        <div class="tab-content">
          <div class="tab-pane ${this.activeTab === 'high' ? '' : 'hidden'}">
            <lazy-results
              .items=${categories.high}
              category="high-risk"
              .renderItem=${(item, cat) => this._renderSnpCard(item, 'high')}
            ></lazy-results>
          </div>

          <div class="tab-pane ${this.activeTab === 'moderate' ? '' : 'hidden'}">
            <lazy-results
              .items=${categories.moderate}
              category="moderate-risk"
              .renderItem=${(item, cat) => this._renderSnpCard(item, 'moderate')}
            ></lazy-results>
          </div>

          <div class="tab-pane ${this.activeTab === 'low' ? '' : 'hidden'}">
            <lazy-results
              .items=${categories.low}
              category="low-risk"
              .renderItem=${(item, cat) => this._renderSnpCard(item, 'low')}
            ></lazy-results>
          </div>

          <div class="tab-pane ${this.activeTab === 'unknown' ? '' : 'hidden'}">
            <lazy-results
              .items=${categories.unknown}
              category="unknown-risk"
              .renderItem=${(item, cat) => this._renderSnpCard(item, 'unknown')}
            ></lazy-results>
          </div>

          <div class="tab-pane ${this.activeTab === 'notFound' ? '' : 'hidden'}">
            <lazy-results
              .items=${categories.notFound}
              category="not-found"
              .renderItem=${(item, cat) => this._renderSnpCard(item, 'notFound')}
            ></lazy-results>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('results-display', ResultsDisplay);
