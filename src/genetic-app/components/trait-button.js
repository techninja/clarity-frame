import { LitElement, html, css } from 'lit';

export class TraitButton extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
    }

    .trait-button {
      padding: 0.375rem 0.75rem;
      border-radius: 9999px;
      font-weight: 500;
      font-size: 0.875rem;
      cursor: pointer;
      transition: opacity 0.15s ease;
      white-space: nowrap;
      border-width: 1px;
      border-style: solid;
      background: none;
      font-family: inherit;
    }

    .trait-button:hover {
      opacity: 0.8;
    }

    .trait-button:focus {
      outline: 2px solid transparent;
      outline-offset: 2px;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
    }

    .trait-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .trait-button:disabled:hover {
      opacity: 0.5;
    }
  `;

  static properties = {
    text: { type: String },
    variant: { type: String },
    disabled: { type: Boolean }
  };

  constructor() {
    super();
    this.text = '';
    this.variant = 'blue';
    this.disabled = false;
  }

  _getVariantStyles() {
    const variants = {
      blue: { bg: '#dbeafe', border: '#93c5fd', text: '#1e40af' },
      green: { bg: '#dcfce7', border: '#86efac', text: '#166534' },
      yellow: { bg: '#fef3c7', border: '#fcd34d', text: '#92400e' },
      purple: { bg: '#f3e8ff', border: '#c4b5fd', text: '#7c3aed' },
      pink: { bg: '#fce7f3', border: '#f9a8d4', text: '#be185d' },
      indigo: { bg: '#e0e7ff', border: '#a5b4fc', text: '#3730a3' },
      red: { bg: '#fee2e2', border: '#fca5a5', text: '#991b1b' },
      teal: { bg: '#ccfbf1', border: '#5eead4', text: '#0f766e' }
    };
    return variants[this.variant] || variants.blue;
  }

  _handleClick() {
    if (this.disabled) return;
    
    this.dispatchEvent(new CustomEvent('trait-click', {
      detail: { text: this.text },
      bubbles: true
    }));
  }

  render() {
    const styles = this._getVariantStyles();
    
    return html`
      <button 
        class="trait-button"
        style="background-color: ${styles.bg}; border-color: ${styles.border}; color: ${styles.text};"
        ?disabled=${this.disabled}
        @click=${this._handleClick}
      >
        ${this.text}
      </button>
    `;
  }
}

customElements.define('trait-button', TraitButton);