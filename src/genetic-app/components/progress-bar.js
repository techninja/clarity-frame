import { LitElement, html, css } from 'lit';

export class ProgressBar extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .progress-card {
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(4px);
      padding: 1.5rem;
      border-radius: 0.75rem;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      text-align: center;
    }

    .progress-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 1rem 0;
    }

    .progress-bar-container {
      width: 100%;
      height: 1.5rem;
      background-color: #e5e7eb;
      border-radius: 0.75rem;
      overflow: hidden;
      margin-bottom: 0.75rem;
      position: relative;
    }

    .progress-bar {
      height: 100%;
      transition: width 0.3s ease;
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .progress-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: white;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    .progress-text {
      font-size: 0.875rem;
      color: #6b7280;
      margin: 0;
    }
  `;

  static properties = {
    title: { type: String },
    progress: { type: Number },
    color: { type: String },
    text: { type: String }
  };

  constructor() {
    super();
    this.title = '';
    this.progress = 0;
    this.color = '#3b82f6';
    this.text = '';
  }

  render() {
    return html`
      <div class="progress-card">
        ${this.title ? html`<h2 class="progress-title">${this.title}</h2>` : ''}
        <div class="progress-bar-container">
          <div 
            class="progress-bar" 
            style="width: ${this.progress}%; background-color: ${this.color};"
          >
            <span class="progress-label">${Math.round(this.progress)}%</span>
          </div>
        </div>
        ${this.text ? html`<div class="progress-text">${this.text}</div>` : ''}
      </div>
    `;
  }
}

customElements.define('progress-bar', ProgressBar);