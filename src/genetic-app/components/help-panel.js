import { LitElement, html, css } from 'lit';

export class HelpPanel extends LitElement {
  static styles = css`
    :host {
      display: block;
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease-in-out;
      margin-top: 1rem;
    }

    :host([expanded]) {
      max-height: 500px;
    }

    .help-content {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .help-category {
      background: var(--bg-card);
      border-radius: 0.5rem;
      padding: 1rem;
      border: 1px solid var(--border-light);
    }

    .help-category h3 {
      color: var(--accent-blue);
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0 0 0.75rem 0;
    }

    .help-term {
      margin-bottom: 0.75rem;
    }

    .help-term:last-child {
      margin-bottom: 0;
    }

    .help-term strong {
      color: var(--text-primary);
      font-weight: 600;
    }

    .help-term p {
      color: var(--text-secondary);
      font-size: 0.875rem;
      margin: 0.25rem 0 0 0;
      line-height: 1.4;
    }
  `;

  static properties = {
    expanded: { type: Boolean, reflect: true }
  };

  render() {
    return html`
      <div class="help-content">
        <div class="help-category">
          <h3>🧬 Genetic Basics</h3>
          <div class="help-term">
            <strong>SNP (Single Nucleotide Polymorphism)</strong>
            <p>A variation in a single DNA building block. Think of it as a typo in your genetic code that's common in humans.</p>
          </div>
          <div class="help-term">
            <strong>Allele</strong>
            <p>Different versions of the same gene. You inherit one from each parent (like having two copies of the same book with slight differences).</p>
          </div>
          <div class="help-term">
            <strong>Genotype</strong>
            <p>Your specific genetic makeup for a trait (like AA, AT, or TT). This is what you inherited from your parents.</p>
          </div>
        </div>
        
        <div class="help-category">
          <h3>📊 Risk Categories</h3>
          <div class="help-term">
            <strong>High Risk</strong>
            <p>Your genetic variant is associated with significantly increased likelihood of a condition. This doesn't mean you will definitely get it.</p>
          </div>
          <div class="help-term">
            <strong>Moderate Risk</strong>
            <p>Your genetic variant shows some increased risk, but it's not as strong as high-risk variants.</p>
          </div>
          <div class="help-term">
            <strong>Low Risk</strong>
            <p>Your genetic variant is associated with decreased risk or normal risk for a condition.</p>
          </div>
        </div>
        
        <div class="help-category">
          <h3>🔬 Study Terms</h3>
          <div class="help-term">
            <strong>GWAS</strong>
            <p>Genome-Wide Association Study - large research studies that compare DNA from many people to find genetic variants linked to diseases.</p>
          </div>
          <div class="help-term">
            <strong>P-value</strong>
            <p>A measure of how confident scientists are in their findings. Lower numbers (like 0.001) mean higher confidence.</p>
          </div>
          <div class="help-term">
            <strong>Effect Size</strong>
            <p>How much a genetic variant increases or decreases your risk. Larger numbers mean bigger effects.</p>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('help-panel', HelpPanel);