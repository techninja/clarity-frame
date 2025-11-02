import { LitElement, html, css } from 'lit';

export class LazyResults extends LitElement {
  static styles = css`
    :host {
      display: block;
      height: 100%;
      overflow-y: auto;
    }

    .results-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.5rem;
      padding: 1rem;
    }

    @media (min-width: 768px) {
      .results-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    .loading-more {
      text-align: center;
      padding: 1rem;
      color: #6b7280;
      font-size: 0.875rem;
    }

    .empty-state {
      font-size: 0.875rem;
      color: #6b7280;
      padding: 0.75rem;
      text-align: center;
    }

    .end-message {
      text-align: center;
      padding: 1rem;
      color: #9ca3af;
      font-size: 0.75rem;
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

    .external-link {
      color: #3b82f6;
      text-decoration: none;
    }

    .external-link:hover {
      text-decoration: underline;
    }
  `;

  static properties = {
    items: { type: Array },
    category: { type: String },
    renderItem: { type: Function },
    batchSize: { type: Number },
    visibleCount: { type: Number },
    loading: { type: Boolean }
  };

  constructor() {
    super();
    this.items = [];
    this.category = '';
    this.renderItem = null;
    this.batchSize = 20;
    this.visibleCount = 20;
    this.loading = false;
  }

  firstUpdated() {
    this.addEventListener('scroll', this._handleScroll.bind(this));
  }

  updated(changedProperties) {
    if (changedProperties.has('items')) {
      this.visibleCount = Math.min(this.batchSize, this.items.length);
    }
  }

  _handleScroll() {
    if (this.loading || this.visibleCount >= this.items.length) return;

    const { scrollTop, scrollHeight, clientHeight } = this;
    if (scrollHeight - scrollTop - clientHeight < 100) {
      this._loadMore();
    }
  }

  _loadMore() {
    if (this.loading || this.visibleCount >= this.items.length) return;
    
    this.loading = true;
    
    // Simulate async loading
    setTimeout(() => {
      this.visibleCount = Math.min(
        this.visibleCount + this.batchSize,
        this.items.length
      );
      this.loading = false;
      this.requestUpdate();
    }, 100);
  }

  render() {
    if (!this.items.length) {
      return html`
        <div class="end-message">
          No ${this.category} items found.
        </div>
      `;
    }

    const visibleItems = this.items.slice(0, this.visibleCount);
    const hasMore = this.visibleCount < this.items.length;

    return html`
      <div class="results-grid">
        ${visibleItems.map(item => this.renderItem?.(item, this.category))}
      </div>
      
      ${this.loading ? html`
        <div class="loading-more">Loading more results...</div>
      ` : ''}
      
      ${hasMore && !this.loading ? html`
        <div class="loading-more">Scroll down for more results</div>
      ` : ''}
      
      ${!hasMore && this.items.length > this.batchSize ? html`
        <div class="end-message">
          Showing all ${this.items.length} ${this.category} results
        </div>
      ` : ''}
    `;
  }
}

customElements.define('lazy-results', LazyResults);