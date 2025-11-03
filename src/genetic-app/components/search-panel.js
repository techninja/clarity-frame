import { LitElement, html, css } from 'lit';
import { GWASApi } from '../lib/gwas-api.js';
import './trait-button.js';

export class SearchPanel extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .card {
      background: transparent;
      border: none;
      padding: 0;
      box-shadow: none;
    }

    .header {
      margin-bottom: 1rem;
    }

    .collapsible-content {
      display: block;
    }

    .card.disabled {
      opacity: 0.5;
      pointer-events: none;
    }

    h2 {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0;
      color: var(--text-primary);
    }

    @media (min-width: 768px) {
      h2 {
        margin: 0;
      }
    }

    .description {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-bottom: 1rem;
    }

    .traits-section {
      margin-bottom: 1rem;
    }

    .traits-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
      display: block;
    }

    .traits-container {
      max-height: 8.5rem;
      overflow-y: auto;
      padding-right: 0.5rem;
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      border: 1px solid transparent;
      position: relative;
    }

    @media (min-width: 768px) {
      .traits-container {
        max-height: 8rem;
      }
    }

    .loading-button {
      padding: 0.375rem 0.75rem;
      border-radius: 9999px;
      font-weight: 500;
      font-size: 0.875rem;
      background-color: var(--bg-primary);
      color: var(--text-secondary);
      border: 1px solid var(--border-light);
      cursor: not-allowed;
      opacity: 0.7;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .spinner {
      border: 2px solid rgba(0, 0, 0, 0.1);
      border-left-color: #3b82f6;
      border-radius: 50%;
      width: 1rem;
      height: 1rem;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .search-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    @media (min-width: 640px) {
      .search-form {
        flex-direction: row;
      }
    }

    .search-input {
      flex-grow: 1;
      padding: 0.5rem 1rem;
      border: 1px solid var(--input-border);
      background: var(--input-bg);
      color: var(--text-primary);
      border-radius: 0.5rem;
      font-size: 1rem;
      transition: all 0.2s;
    }

    .search-input::placeholder {
      color: var(--text-muted);
    }

    .search-input:focus {
      outline: none;
      ring: 2px;
      ring-color: #3b82f6;
      border-color: #3b82f6;
    }

    .search-input:disabled {
      opacity: 0.6;
      background: #f9fafb;
      cursor: not-allowed;
      border-color: #e5e7eb;
    }

    .search-button {
      background-color: #059669;
      color: white;
      font-weight: 600;
      padding: 0.5rem 1.5rem;
      border-radius: 0.5rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }

    .search-button:hover:not(:disabled) {
      background-color: #047857;
    }

    .search-button:disabled {
      opacity: 0.6;
      background: #9ca3af;
      cursor: not-allowed;
    }

    .search-button:focus {
      outline: none;
      ring: 2px;
      ring-offset: 2px;
      ring-color: #059669;
    }

    .loading-text {
      font-size: 0.75rem;
      color: var(--text-secondary);
      font-style: italic;
    }

    .error-text {
      font-size: 0.75rem;
      color: #dc2626;
    }
  `;

  static properties = {
    enabled: { type: Boolean },
    traits: { type: Array },
    loadingTraits: { type: Boolean },
    nextTraitUrl: { type: String },
    searchQuery: { type: String },
    searching: { type: Boolean }
  };

  constructor() {
    super();
    this.enabled = false;
    this.traits = [];
    this.loadingTraits = false;
    this.nextTraitUrl = null;
    this.searchQuery = '';
    this.searching = false;
    this.gwasApi = new GWASApi();
    this.traitColors = ['blue', 'green', 'yellow', 'purple', 'pink', 'indigo', 'red', 'teal'];
  }

  async firstUpdated() {
    await this._loadInitialTraits();
    this._setupScrollListener();
  }

  async _loadInitialTraits() {
    this.loadingTraits = true;
    const url = 'https://www.ebi.ac.uk/gwas/rest/api/efoTraits?size=20';
    
    try {
      const { traits, nextUrl, error } = await this.gwasApi.fetchTraits(url);
      if (error) {
        console.error('Error loading traits:', error);
        return;
      }
      
      this.traits = traits;
      this.nextTraitUrl = nextUrl;
    } catch (error) {
      console.error('Failed to load traits:', error);
    } finally {
      this.loadingTraits = false;
    }
  }

  _setupScrollListener() {
    const container = this.shadowRoot.querySelector('.traits-container');
    if (!container) return;

    container.addEventListener('scroll', async () => {
      if (!this.nextTraitUrl || this.loadingTraits) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop - clientHeight < 50) {
        await this._loadMoreTraits();
      }
    });
  }

  async _loadMoreTraits() {
    if (!this.nextTraitUrl || this.loadingTraits) return;
    
    this.loadingTraits = true;
    
    try {
      const { traits, nextUrl, error } = await this.gwasApi.fetchTraits(this.nextTraitUrl);
      if (!error && traits.length > 0) {
        this.traits = [...this.traits, ...traits];
        this.nextTraitUrl = nextUrl;
      }
    } catch (error) {
      console.error('Error loading more traits:', error);
    } finally {
      this.loadingTraits = false;
    }
  }

  _handleTraitClick(event) {
    if (this.searching) return;
    this.searchQuery = event.detail.text;
    this._handleSearch();
  }

  _handleSearch() {
    if (!this.searchQuery.trim() || this.searching) return;
    
    this.dispatchEvent(new CustomEvent('search', {
      detail: { query: this.searchQuery.trim() },
      bubbles: true
    }));
  }

  _handleKeyPress(event) {
    if (event.key === 'Enter' && !this.searching) {
      this._handleSearch();
    }
  }



  _simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash);
  }

  render() {
    return html`
      <div class="card ${this.enabled ? '' : 'disabled'}">
        <div class="header">
          <h2>Search Traits or rsIDs</h2>
        </div>
        
        <div class="collapsible-content">
          <p class="description">
            Enter a keyword (e.g., "heart disease") to find associated SNPs, or enter a 
            specific rsID (e.g., "rs123456"). Uses the public NHGRI-EBI GWAS Catalog.
          </p>

          <div class="traits-section">
            <span class="traits-label">Or select a common trait:</span>
            <div class="traits-container">
              ${this.traits.length === 0 && this.loadingTraits ? html`
                <span class="loading-text">Loading common traits...</span>
              ` : ''}
              
              ${this.traits.map(trait => {
                const colorIndex = this._simpleHash(trait) % this.traitColors.length;
                return html`
                  <trait-button
                    text=${trait}
                    variant=${this.traitColors[colorIndex]}
                    ?disabled=${this.searching}
                    @trait-click=${this._handleTraitClick}
                  ></trait-button>
                `;
              })}
              
              ${this.loadingTraits && this.traits.length > 0 ? html`
                <button class="loading-button" disabled>
                  Loading more... ⏳
                </button>
              ` : ''}
            </div>
          </div>
        </div>

        <div class="search-form">
          <input 
            type="text" 
            class="search-input"
            placeholder="Enter keyword or rsID"
            .value=${this.searchQuery}
            ?disabled=${this.searching}
            @input=${(e) => this.searchQuery = e.target.value}
            @keypress=${this._handleKeyPress}
          />
          <button 
            class="search-button"
            ?disabled=${this.searching}
            @click=${this._handleSearch}
          >
            ${this.searching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>
    `;
  }
}

customElements.define('search-panel', SearchPanel);
