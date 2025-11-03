import { LitElement, html, css } from 'lit';
import './chromosome-icon.js';

export class LazyResults extends LitElement {
  static styles = css`
    :host {
      display: block;
      height: 100%;
      overflow-y: auto;
      position: relative;
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
      position: fixed;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%);
      text-align: center;
      padding: 0.5rem 1rem;
      color: var(--text-secondary);
      font-size: 0.875rem;
      background: var(--bg-secondary);
      backdrop-filter: blur(4px);
      border-radius: 0.5rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      pointer-events: none;
    }

    .empty-state {
      font-size: 0.875rem;
      color: var(--text-secondary);
      padding: 0.75rem;
      text-align: center;
    }

    .end-message {
      position: fixed;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%);
      text-align: center;
      padding: 0.5rem 1rem;
      color: var(--text-muted);
      font-size: 0.75rem;
      background: var(--bg-secondary);
      backdrop-filter: blur(4px);
      border-radius: 0.5rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      pointer-events: none;
    }

    .snp-card {
      border: 1px solid;
      padding: 0.75rem;
      border-radius: 0.375rem;
      box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
      position: relative;
    }

    .snp-card.high-risk {
      background-color: var(--risk-high-bg);
      border-color: var(--risk-high);
    }

    .snp-card.moderate-risk {
      background-color: var(--risk-moderate-bg);
      border-color: var(--risk-moderate);
    }

    .snp-card.low-risk {
      background-color: var(--risk-low-bg);
      border-color: var(--risk-low);
    }

    .snp-card.unknown-risk {
      background-color: var(--bg-card);
      border-color: var(--border-color);
    }

    .snp-card.not-found {
      background-color: var(--bg-card);
      border-color: var(--border-color);
    }

    .snp-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      font-weight: 600;
    }

    .snp-header.high-risk { color: var(--risk-high); }
    .snp-header.moderate-risk { color: var(--risk-moderate); }
    .snp-header.low-risk { color: var(--risk-low); }
    .snp-header.unknown-risk { color: var(--risk-unknown); }

    .match-badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
    }

    .match-badge.found {
      background-color: #dcfce7;
      color: #166534;
      margin-right: 2.5rem;
    }

    .match-badge.not-found {
      background-color: #f3f4f6;
      color: #6b7280;
    }

    .snp-details {
      margin-top: 0.75rem;
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 0.5rem 1rem;
      font-size: 0.875rem;
      color: var(--text-primary);
    }

    .detail-label {
      font-weight: 600;
      color: var(--text-secondary);
    }

    .allele-display {
      font-family: monospace;
      background-color: var(--border-light);
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

    .chromosome-viz {
      margin: -0.75rem -0.75rem 0.75rem -0.75rem;
      padding: 0.75rem;
      border-bottom: 1px solid var(--border-light);
    }

    .chr-label {
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin-bottom: 0.25rem;
    }

    .chr-icon {
      flex-shrink: 0;
      stroke: var(--text-primary);
      stroke-width: 2;
    }

    .chr-container {
      display: flex;
      align-items: stretch;
      gap: 1rem;
    }

    .chr-icon-large {
      width: 20px;
      height: 40px;
      flex-shrink: 0;
    }

    .chr-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .chr-bar {
      flex: 1;
      background: linear-gradient(90deg, var(--chr-gradient-start), var(--chr-gradient-mid), var(--chr-gradient-end));
      border-radius: 0.5rem;
      position: relative;
      min-height: 1rem;
    }

    .position-marker {
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 1rem;
      height: 1rem;
      background: var(--chr-gradient-start);
      border: 2px solid var(--text-primary);
      border-radius: 50%;
    }

    .alleles {
      display: flex;
      gap: 0.25rem;
    }

    .allele {
      width: 1.5rem;
      height: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.625rem;
      font-weight: 600;
      color: white;
      border-radius: 0.125rem;
    }

    .allele.risk {
      background: #ef4444;
    }

    .allele.safe {
      background: #22c55e;
    }

    .allele-comparison {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .risk-alleles,
    .user-alleles {
      display: flex;
      gap: 0.25rem;
    }

    .vs-label {
      font-size: 0.75rem;
      color: var(--text-primary);
      font-weight: 500;
    }

    .risk-allele {
      background: var(--risk-high);
      color: white;
    }

    .user-allele.match {
      background: var(--risk-high);
      color: white;
    }

    .user-allele.safe {
      background: var(--risk-low);
      color: white;
    }

    .info-links {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .external-link {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.5rem;
      border: 1px solid var(--border-color);
      border-radius: 0.375rem;
      background-color: var(--bg-secondary);
      text-decoration: none;
      font-size: 0.75rem;
      transition: background-color 0.2s;
    }

    .external-link:hover {
      background-color: var(--bg-primary);
      text-decoration: none;
    }

    .link-icon {
      width: 12px;
      height: 12px;
      flex-shrink: 0;
    }

    .position-label {
      font-size: 0.625rem;
      color: #9ca3af;
    }

    .study-title {
      display: block;
      transition: max-height 0.3s ease;
      overflow: hidden;
      cursor: pointer;
      line-height: 1.4;
    }

    .study-title.truncated {
      max-height: 2.8em;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      text-overflow: ellipsis;
    }

    .study-title.expanded {
      max-height: 20em;
      display: block;
    }

    .study-title.clickable:hover {
      color: #3b82f6;
    }

    .gene-container {
      display: flex;
      align-items: flex-start;
      gap: 0.25rem;
    }

    .gene-links {
      transition: max-height 0.3s ease;
      overflow: hidden;
      line-height: 1.4;
    }

    .gene-links.truncated {
      max-height: 2.8em;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      word-break: break-word;
    }
    
    .gene-links.expanded {
      max-height: 15em;
      display: block;
      white-space: normal;
    }
    
    .gene-links .external-link {
      display: inline;
      padding: 0;
      border: none;
      background: none;
    }
    
    .gene-links.expanded .external-link {
      display: inline-block;
      margin-right: 0.25rem;
    }

    .gene-links.expanded {
      max-height: 15em;
      display: block;
    }

    .gene-chevron {
      cursor: pointer;
      color: #6b7280;
      font-size: 0.75rem;
      transition: transform 0.2s ease;
      margin-top: 0.1rem;
    }

    .gene-chevron:hover {
      color: #3b82f6;
    }

    .gene-chevron.expanded {
      transform: rotate(180deg);
    }

    .save-button {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 0.375rem;
      padding: 0.25rem;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.875rem;
    }

    .save-button:hover {
      background: var(--accent-blue);
      color: white;
    }

    .save-button.saved {
      background: var(--accent-blue);
      color: white;
    }

    .save-button.delete {
      background: #ef4444;
      color: white;
    }

    .save-button.delete:hover {
      background: #dc2626;
    }

    .notes-input {
      width: 100%;
      min-height: 3rem;
      padding: 0.5rem;
      border: 1px solid var(--border-light);
      border-radius: 0.375rem;
      background: var(--input-bg);
      color: var(--text-primary);
      font-family: inherit;
      font-size: 0.875rem;
      resize: vertical;
      box-sizing: border-box;
    }

    .notes-input:focus {
      outline: none;
      border-color: var(--accent-blue);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }
  `;

  static properties = {
    items: { type: Array },
    category: { type: String },
    batchSize: { type: Number },
    visibleCount: { type: Number },
    loading: { type: Boolean },
    darkMode: { type: Boolean },
    savedDatabase: { type: Object },
    searchTrait: { type: String }
  };

  constructor() {
    super();
    this.items = [];
    this.category = '';

    this.batchSize = 20;
    this.visibleCount = 20;
    this.loading = false;
    this.darkMode = false;
    this.savedDatabase = null;
    this.searchTrait = '';
    this.expandedTitles = new Set();
    this.expandedGenes = new Set();
    this.savedItems = new Set();
  }

  firstUpdated() {
    this.addEventListener('scroll', this._handleScroll.bind(this));
    this._setupIntersectionObserver();
  }

  _setupIntersectionObserver() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const studyUrl = entry.target.dataset.studyUrl;
          if (studyUrl && !this.studyTitles?.has(studyUrl)) {
            this._fetchStudyTitle(studyUrl);
          }
        }
      });
    }, { threshold: 0.1 });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  updated(changedProperties) {
    if (changedProperties.has('items')) {
      this.visibleCount = Math.min(this.batchSize, this.items.length);
    }
    
    // Observe new study placeholders
    if (this.observer) {
      this.shadowRoot.querySelectorAll('.study-placeholder[data-study-url]').forEach(el => {
        this.observer.observe(el);
      });
    }

    if (changedProperties.has('savedDatabase') && this.savedDatabase) {
      this._loadSavedStatus();
    }

    // Update trait emojis for saved items
    if (this.category === 'saved') {
      this._updateTraitEmojis();
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

  _renderStudyTitle(item) {
    if (!item.studyUrls?.length) return '';
    
    if (!this.studyTitles) {
      this.studyTitles = new Map();
    }
    
    const studyUrl = Array.from(item.studyUrls)[0];
    const cachedTitle = this.studyTitles.get(studyUrl);
    
    if (cachedTitle && cachedTitle !== 'loading...') {
      const isLong = cachedTitle.length > 80;
      const titleId = `title-${item.rsid}-${studyUrl.split('/').pop()}`;
      const isExpanded = this.expandedTitles.has(titleId);
      
      return html`
        <span class="detail-label">Study:</span>
        <span class="study-title ${isLong ? (isExpanded ? 'expanded clickable' : 'truncated clickable') : ''}" 
              @click="${isLong ? () => this._toggleStudyText(titleId) : null}">
          ${cachedTitle}
        </span>
      `;
    }
    
    // Return placeholder that will trigger lazy loading when visible
    return html`
      <span class="study-placeholder" data-study-url="${studyUrl}"></span>
    `;
  }

  _toggleStudyText(titleId) {
    if (this.expandedTitles.has(titleId)) {
      this.expandedTitles.delete(titleId);
    } else {
      this.expandedTitles.add(titleId);
    }
    this.requestUpdate();
  }

  _renderGenes(item) {
    if (!item.genes?.length) return '';
    
    const geneText = item.genes.join(', ');
    const isLong = geneText.length > 60;
    const geneId = `genes-${item.rsid}`;
    const isExpanded = this.expandedGenes.has(geneId);
    
    return html`
      <span class="detail-label">Genes:</span>
      <div class="gene-container">
        <span class="gene-links ${isLong ? (isExpanded ? 'expanded' : 'truncated') : ''}">
          ${item.genes.map((gene, i) => html`${i > 0 ? ', ' : ''}<a href="https://www.ncbi.nlm.nih.gov/gene/?term=${encodeURIComponent(gene)}" target="_blank" class="external-link">${gene}</a>`)}
        </span>
        ${isLong ? html`
          <span class="gene-chevron ${isExpanded ? 'expanded' : ''}" 
                @click="${() => this._toggleGenes(geneId)}">
            ▼
          </span>
        ` : ''}
      </div>
    `;
  }

  _toggleGenes(geneId) {
    if (this.expandedGenes.has(geneId)) {
      this.expandedGenes.delete(geneId);
    } else {
      this.expandedGenes.add(geneId);
    }
    this.requestUpdate();
  }

  async _loadSavedStatus() {
    if (!this.savedDatabase) return;
    this.savedItems.clear();
    
    for (const item of this.items) {
      try {
        const isSaved = await this.savedDatabase.isItemSaved(item.rsid);
        if (isSaved) {
          this.savedItems.add(item.rsid);
        }
      } catch (error) {
        console.warn('Error checking saved status:', error);
      }
    }
    this.requestUpdate();
  }

  async _handleSave(item) {
    if (!this.savedDatabase) return;
    
    try {
      const isSaved = this.savedItems.has(item.rsid);
      
      if (isSaved && this.category === 'saved') {
        // Delete from saved if in saved tab
        await this.savedDatabase.removeItem(item.rsid);
        this.savedItems.delete(item.rsid);
        // Remove from items array and trigger reflow
        const index = this.items.findIndex(i => i.rsid === item.rsid);
        if (index > -1) {
          this.items.splice(index, 1);
          this.requestUpdate();
        }
        // Notify parent to update saved counts
        this.dispatchEvent(new CustomEvent('item-deleted', { bubbles: true }));
      } else if (isSaved) {
        // Switch to saved tab if already saved
        this.dispatchEvent(new CustomEvent('switch-to-saved', { bubbles: true }));
      } else {
        // Save the item
        await this.savedDatabase.saveItem(
          item.rsid,
          this.searchTrait,
          item.snp,
          {
            traits: item.traits,
            riskAlleles: item.riskAlleles,
            riskLevel: item.riskLevel,
            studyUrls: item.studyUrls,
            genes: item.genes,
            effects: item.effects
          }
        );
        this.savedItems.add(item.rsid);
        this.requestUpdate();
      }
    } catch (error) {
      console.error('Error saving item:', error);
    }
  }

  async _updateNotes(rsid, notes) {
    if (!this.savedDatabase) return;
    try {
      await this.savedDatabase.updateNotes(rsid, notes);
    } catch (error) {
      console.error('Failed to update notes:', error);
    }
  }

  async _updateTraitEmojis() {
    const emojiElements = this.shadowRoot.querySelectorAll('.trait-emoji[data-trait]');
    for (const element of emojiElements) {
      const trait = element.dataset.trait;
      if (trait) {
        const emoji = await this._getTraitEmoji(trait);
        element.textContent = emoji;
      }
    }
  }

  async _getTraitEmoji(query) {
    try {
      const response = await fetch(`./data/trait-emojis.json?v=${Date.now()}`, {
        cache: 'no-cache'
      });
      const emojis = await response.json();
      const term = query.toLowerCase();
      const words = term.split(/\s+/);
      
      const matches = new Set();
      
      for (const [category, data] of Object.entries(emojis)) {
        for (const keyword of data.keywords) {
          const fullMatch = term.includes(keyword);
          const wordMatch = words.some(word => word === keyword);
          
          if (fullMatch || wordMatch) {
            if (data.emoji !== '🧬') {
              matches.add(data.emoji);
            }
          }
        }
      }
      
      return matches.size > 0 ? Array.from(matches).join('') : '🧬';
    } catch (error) {
      return '🧬';
    }
  }

  async _fetchStudyTitle(studyUrl) {
    if (this.studyTitles.has(studyUrl)) return;
    
    // Mark as loading to prevent duplicate requests
    this.studyTitles.set(studyUrl, 'loading...');
    
    try {
      const response = await fetch(studyUrl);
      if (response.ok) {
        const studyData = await response.json();
        const title = studyData?.publicationInfo?.title;
        if (title) {
          this.studyTitles.set(studyUrl, title);
          this.requestUpdate();
        } else {
          this.studyTitles.delete(studyUrl);
        }
      } else {
        this.studyTitles.delete(studyUrl);
      }
    } catch (error) {
      console.warn('Could not fetch study title:', error);
      this.studyTitles.delete(studyUrl);
    }
  }



  _renderSnpCard(item, category) {
    const isMatched = category !== 'notFound';
    const actualCategory = item.category || category;
    const riskClass = actualCategory === 'high' ? 'high-risk' :
                     actualCategory === 'moderate' ? 'moderate-risk' :
                     actualCategory === 'low' ? 'low-risk' :
                     actualCategory === 'unknown' ? 'unknown-risk' : 'not-found';

    return html`
      <div class="snp-card ${riskClass}">
        ${isMatched ? html`
          <button 
            class="save-button ${this.category === 'saved' ? 'delete' : this.savedItems.has(item.rsid) ? 'saved' : ''}"
            @click=${() => this._handleSave(item)}
            title="${this.category === 'saved' ? 'Delete from saved' : this.savedItems.has(item.rsid) ? 'View in Saved' : 'Save for later'}"
          >
            ${this.category === 'saved' ? '🗑️' : this.savedItems.has(item.rsid) ? '📌' : '🔖'}
          </button>
        ` : ''}
        <details open>
          <summary class="snp-header ${riskClass}">
            <span>${item.rsid}</span>
            <span class="match-badge ${isMatched ? 'found' : 'not-found'}">
              ${isMatched ? 'MATCH FOUND' : 'Not in your data'}
            </span>
          </summary>

          ${isMatched ? html`
            ${item.snp ? html`
              <div class="chromosome-viz">
                <div class="chr-container">
                  <chromosome-icon chromosome="${item.snp.chromosome}" .darkMode=${this.darkMode} class="chr-icon-large"></chromosome-icon>
                  <div class="chr-content">
                    <div class="chr-label">Chr ${item.snp.chromosome}</div>
                    <div class="chr-bar">
                      <div class="position-marker" style="left: ${(item.snp.position % 1000000) / 1000000 * 100}%"></div>
                    </div>
                    <div class="position-label">${item.snp.position.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ` : ''}
            
            <div class="snp-details">
              <span class="detail-label">Risk Level:</span>
              <span class="risk-level ${riskClass}">${item.riskLevel}</span>

              <span class="detail-label">Risk vs Your Alleles:</span>
              ${item.snp ? html`
                <div class="allele-comparison">
                  <div class="risk-alleles">
                    ${item.riskAlleles.split(',').map(allele => html`
                      <span class="allele risk-allele">${allele.trim()}</span>
                    `)}
                  </div>
                  <span class="vs-label">vs</span>
                  <div class="user-alleles">
                    <span class="allele user-allele ${item.snp.allele1 === item.riskAlleles.split(',')[0]?.trim() || item.riskAlleles.split(',').includes(item.snp.allele1) ? 'match' : 'safe'}">${item.snp.allele1}</span>
                    <span class="allele user-allele ${item.snp.allele2 === item.riskAlleles.split(',')[0]?.trim() || item.riskAlleles.split(',').includes(item.snp.allele2) ? 'match' : 'safe'}">${item.snp.allele2}</span>
                  </div>
                </div>
              ` : ''}

              ${item.effects?.length ? html`
                <span class="detail-label">Effect:</span>
                <span class="effect-info">
                  ${item.effects[0].direction} ${item.effects[0].description || item.traits}
                  ${item.effects[0].magnitude ? ` (${item.effects[0].magnitude} ${item.effects[0].unit || ''})` : ''}
                </span>
              ` : ''}

              ${this._renderGenes(item)}

              ${item.searchTrait && this.category === 'saved' ? html`
                <span class="detail-label">Search Trait:</span>
                <span class="search-trait">${item.searchTrait} <span class="trait-emoji" data-trait="${item.searchTrait}">🧬</span></span>
              ` : ''}

              ${this.category === 'saved' ? html`
                <span class="detail-label">Notes:</span>
                <textarea 
                  class="notes-input"
                  placeholder="Add your notes here..."
                  .value=${item.notes || ''}
                  @blur=${(e) => this._updateNotes(item.rsid, e.target.value)}
                  style="grid-column: 1 / -1;"
                ></textarea>
              ` : ''}

              ${this._renderStudyTitle(item)}

              <span class="detail-label">More Info:</span>
              <div class="info-links">
                <a href="https://www.ncbi.nlm.nih.gov/snp/${item.rsid}" target="_blank" class="external-link">
                  <img src="https://www.ncbi.nlm.nih.gov/favicon.ico" class="link-icon" alt="">dbSNP
                </a>
                <a href="https://www.infino.me/snp/${item.rsid}/" target="_blank" class="external-link">
                  <img src="https://www.infino.me/static/favicon.ico" class="link-icon" alt="">Infino
                </a>
                <a href="https://www.snpedia.com/index.php/${item.rsid}" target="_blank" class="external-link">
                  <img src="https://files.snpedia.com/data/SNPedia_favicon_48x48_2011.png" class="link-icon" alt="">SNPedia
                </a>
              </div>
            </div>
          ` : html`
            <div class="snp-details">
              <span class="detail-label">Risk Allele(s):</span>
              <span class="allele-display">${item.riskAlleles}</span>

              ${this._renderGenes(item)}

              ${this._renderStudyTitle(item)}

              <span class="detail-label">More Info:</span>
              <div class="info-links">
                <a href="https://www.ncbi.nlm.nih.gov/snp/${item.rsid}" target="_blank" class="external-link">
                  <img src="https://www.ncbi.nlm.nih.gov/favicon.ico" class="link-icon" alt="">dbSNP
                </a>
                <a href="https://www.infino.me/snp/${item.rsid}/" target="_blank" class="external-link">
                  <img src="https://www.infino.me/static/favicon.ico" class="link-icon" alt="">Infino
                </a>
                <a href="https://www.snpedia.com/index.php/${item.rsid}" target="_blank" class="external-link">
                  <img src="https://files.snpedia.com/data/SNPedia_favicon_48x48_2011.png" class="link-icon" alt="">SNPedia
                </a>
              </div>
            </div>
          `}
        </details>
      </div>
    `;
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
        ${visibleItems.map(item => this._renderSnpCard(item, this.category))}
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
