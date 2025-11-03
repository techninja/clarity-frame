import { LitElement, html, css } from 'lit';

export class FilterTabs extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .tabs {
      display: flex;
      border-bottom: 1px solid var(--border-light);
      margin: 1rem 0 0 0;
      overflow-x: auto;
      flex-shrink: 0;
    }

    .tab-button {
      padding: 0.75rem 1.25rem;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      font-weight: 500;
      color: var(--text-secondary);
      white-space: nowrap;
      background: none;
      border-left: none;
      border-right: none;
      border-top: none;
    }

    .tab-button.active {
      border-bottom-color: currentColor;
      color: var(--text-primary);
      font-weight: 600;
    }

    .tab-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      color: var(--text-muted);
      text-decoration: line-through;
    }

    .tab-button.all { color: var(--accent-blue); }
    .tab-button.high { color: var(--risk-high); }
    .tab-button.moderate { color: var(--risk-moderate); }
    .tab-button.low { color: var(--risk-low); }
    .tab-button.unknown { color: var(--risk-unknown); }
    .tab-button.not-found { color: var(--risk-unknown); }
  `;

  static properties = {
    tabs: { type: Array },
    activeTab: { type: String },
    counts: { type: Object }
  };

  constructor() {
    super();
    this.tabs = [];
    this.activeTab = '';
    this.counts = {};
  }

  _handleTabClick(tabId) {
    if (tabId !== 'all' && this.counts[tabId] === 0) return;
    
    this.dispatchEvent(new CustomEvent('tab-change', {
      detail: { tab: tabId },
      bubbles: true
    }));
  }

  render() {
    return html`
      <div class="tabs">
        ${this.tabs.map(tab => html`
          <button 
            class="tab-button ${tab.id} ${this.activeTab === tab.id ? 'active' : ''}"
            ?disabled=${tab.id !== 'all' && this.counts[tab.id] === 0}
            @click=${() => this._handleTabClick(tab.id)}
          >
            ${tab.label} (${this.counts[tab.id] || 0})
          </button>
        `)}
      </div>
    `;
  }
}

customElements.define('filter-tabs', FilterTabs);