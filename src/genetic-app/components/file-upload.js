import { LitElement, html, css } from 'lit';
import './progress-bar.js';

export class FileUpload extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .card {
      background: var(--bg-card);
      border-radius: 0.75rem;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      padding: 1.5rem;
      backdrop-filter: blur(2px);
    }

    h2 {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 1rem 0;
      color: var(--text-primary);
    }

    .file-input {
      display: block;
      width: 100%;
      font-size: 0.875rem;
      color: #6b7280;
    }

    .file-input::file-selector-button {
      margin-right: 1rem;
      padding: 0.5rem 1rem;
      border-radius: 9999px;
      border: 0;
      font-size: 0.875rem;
      font-weight: 600;
      background-color: #dbeafe;
      color: #1d4ed8;
      cursor: pointer;
    }

    .file-input::file-selector-button:hover {
      background-color: #bfdbfe;
    }

    .status {
      margin-top: 1rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .status.success {
      color: #059669;
    }

    .status.error {
      color: #dc2626;
    }



    .hidden {
      display: none;
    }
  `;

  static properties = {
    dbReady: { type: Boolean },
    recordCount: { type: Number },
    importing: { type: Boolean },
    progress: { type: Number },
    progressText: { type: String }
  };

  constructor() {
    super();
    this.dbReady = false;
    this.recordCount = 0;
    this.importing = false;
    this.progress = 0;
    this.progressText = '';
  }

  connectedCallback() {
    super.connectedCallback();
    // Listen on document for events from parent component
    this._boundHandleProgress = this._handleProgress.bind(this);
    this._boundHandleComplete = this._handleComplete.bind(this);
    document.addEventListener('import-progress', this._boundHandleProgress);
    document.addEventListener('import-complete', this._boundHandleComplete);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('import-progress', this._boundHandleProgress);
    document.removeEventListener('import-complete', this._boundHandleComplete);
  }

  _handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    this.importing = true;
    this.dispatchEvent(new CustomEvent('file-selected', {
      detail: { file },
      bubbles: true
    }));
  }

  _handleProgress(event) {
    const { current, total } = event.detail;
    this.progress = total > 0 ? (current / total) * 100 : 0;
    this.progressText = `Processed ${current.toLocaleString()} / ${total.toLocaleString()} records...`;
    this.requestUpdate();
  }

  _handleComplete(event) {
    this.importing = false;
    this.recordCount = event.detail.totalRecords;
    this.requestUpdate();
  }

  _getStatusText() {
    if (!this.dbReady) return 'Status: Database is initializing...';
    if (this.recordCount > 0) {
      return `Status: Loaded ${this.recordCount.toLocaleString()} records from cache.`;
    }
    return 'Status: Database is empty. Please select a file.';
  }

  _getStatusClass() {
    if (!this.dbReady) return '';
    return this.recordCount > 0 ? 'success' : '';
  }

  render() {
    if (this.importing) {
      return html`
        <progress-bar
          title="Importing Data..."
          .progress=${this.progress}
          color="#3b82f6"
          text=${this.progressText}
        ></progress-bar>
      `;
    }

    if (this.recordCount > 0 && !this.importing) {
      return html``;
    }

    return html`
      <div class="card">
        <h2>Import Data File</h2>
        <input 
          type="file" 
          class="file-input"
          @change=${this._handleFileSelect}
          accept=".txt,.tsv,.tab"
        />
        <div class="status ${this._getStatusClass()}">
          ${this._getStatusText()}
        </div>
      </div>
    `;
  }
}

customElements.define('file-upload', FileUpload);
