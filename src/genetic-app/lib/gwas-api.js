/**
 * @typedef {Object} TraitInfo
 * @property {Set<string>} traits
 * @property {Set<string>} riskAlleles
 * @property {Set<string>} studyUrls
 */

export class GWASApi {
  constructor() {
    this.baseUrl = 'https://www.ebi.ac.uk/gwas/rest/api';
  }

  /**
   * Fetch traits with pagination
   * @param {string} url
   * @returns {Promise<{traits: string[], nextUrl: string|null, error?: string}>}
   */
  async fetchTraits(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return {
        traits: data._embedded?.efoTraits?.map(t => t.trait) || [],
        nextUrl: data._links?.next?.href || null
      };
    } catch (error) {
      return { traits: [], nextUrl: null, error: error.message };
    }
  }

  /**
   * Search for SNP by rsID
   * @param {string} rsid
   * @returns {Promise<Map<string, TraitInfo>>}
   */
  async searchByRsid(rsid) {
    const snpResponse = await fetch(`${this.baseUrl}/singleNucleotidePolymorphisms/${rsid}`);
    if (!snpResponse.ok) {
      if (snpResponse.status === 404) {
        throw new Error(`SNP ${rsid} not found in the GWAS Catalog.`);
      }
      throw new Error(`API Error: ${snpResponse.status} ${snpResponse.statusText}`);
    }

    const snpData = await snpResponse.json();
    const assocUrl = snpData._links?.associations?.href;
    
    if (!assocUrl) {
      return new Map();
    }

    const associations = await this._fetchAllAssociations(assocUrl);
    return this._processAssociations(associations, rsid);
  }

  /**
   * Search for SNPs by trait keyword
   * @param {string} keyword
   * @returns {Promise<Map<string, TraitInfo>>}
   */
  async searchByTrait(keyword) {
    const traitResponse = await fetch(
      `${this.baseUrl}/efoTraits/search/findByEfoTrait?trait=${encodeURIComponent(keyword)}`
    );
    
    if (!traitResponse.ok) {
      throw new Error(`API Error: ${traitResponse.status} ${traitResponse.statusText}`);
    }

    const traitData = await traitResponse.json();
    const efoTraits = traitData._embedded?.efoTraits;

    if (!efoTraits?.length) {
      return new Map();
    }

    const rsidInfoMap = new Map();

    for (const trait of efoTraits) {
      const assocUrl = trait._links?.associations?.href;
      if (!assocUrl) continue;

      try {
        const associations = await this._fetchAllAssociations(assocUrl);
        const traitMap = await this._processAssociations(associations, null, trait.trait);
        
        // Merge into main map
        for (const [rsid, info] of traitMap) {
          if (!rsidInfoMap.has(rsid)) {
            rsidInfoMap.set(rsid, { traits: new Set(), riskAlleles: new Set(), studyUrls: new Set() });
          }
          const existing = rsidInfoMap.get(rsid);
          info.traits.forEach(t => existing.traits.add(t));
          info.riskAlleles.forEach(r => existing.riskAlleles.add(r));
          info.studyUrls.forEach(s => existing.studyUrls.add(s));
        }
      } catch (error) {
        console.warn(`Error processing trait ${trait.trait}:`, error);
      }
    }

    return rsidInfoMap;
  }

  /**
   * Fetch all associations with pagination
   * @param {string} url
   * @returns {Promise<Array>}
   */
  async _fetchAllAssociations(url) {
    const associations = [];
    let nextUrl = url;

    while (nextUrl) {
      try {
        const response = await fetch(nextUrl);
        if (!response.ok) break;
        
        const data = await response.json();
        if (data._embedded?.associations) {
          associations.push(...data._embedded.associations);
        }
        nextUrl = data._links?.next?.href;
      } catch (error) {
        console.warn('Error fetching associations:', error);
        break;
      }
    }

    return associations;
  }

  /**
   * Process associations into rsid info map
   * @param {Array} associations
   * @param {string|null} targetRsid
   * @param {string|null} traitName
   * @returns {Promise<Map<string, TraitInfo>>}
   */
  async _processAssociations(associations, targetRsid = null, traitName = null) {
    const rsidInfoMap = new Map();

    for (const assoc of associations) {
      const studyUrl = assoc._links?.study?.href;
      const rsids = new Set();
      const riskAlleles = new Set();

      // Extract rsIDs and risk alleles
      if (assoc.snps) {
        assoc.snps.forEach(snp => {
          if (snp.rsId) {
            const cleanRsId = snp.rsId.split(' ')[0].trim();
            if (cleanRsId) rsids.add(cleanRsId);
          }
        });
      }

      assoc.loci?.forEach(locus => {
        locus.strongestRiskAlleles?.forEach(riskAllele => {
          if (riskAllele.riskAlleleName) {
            const [rsIdPart, allelePart] = riskAllele.riskAlleleName.split('-');
            const cleanRsId = rsIdPart.trim();
            if (cleanRsId.startsWith('rs')) {
              rsids.add(cleanRsId);
              if (allelePart && allelePart.trim() !== '?') {
                riskAlleles.add(allelePart.trim());
              }
            }
          }
        });
      });

      // Get trait info
      let traits = new Set();
      if (traitName) {
        traits.add(traitName);
      } else {
        // Try to get from EFO traits
        const efoTraitsUrl = assoc._links?.efoTraits?.href;
        if (efoTraitsUrl) {
          try {
            const efoResponse = await fetch(efoTraitsUrl);
            if (efoResponse.ok) {
              const efoData = await efoResponse.json();
              efoData._embedded?.efoTraits?.forEach(t => traits.add(t.trait));
            }
          } catch (error) {
            console.warn('Could not fetch EFO traits:', error);
          }
        }
      }

      // If no traits found, try study fallback
      if (traits.size === 0 && studyUrl) {
        try {
          const studyResponse = await fetch(studyUrl);
          if (studyResponse.ok) {
            const studyData = await studyResponse.json();
            if (studyData?.diseaseTrait?.trait) {
              traits.add(studyData.diseaseTrait.trait);
            }
          }
        } catch (error) {
          console.warn('Could not fetch study trait:', error);
        }
      }

      if (traits.size === 0) traits.add('Trait Unknown');

      // Add to map
      rsids.forEach(rsid => {
        if (targetRsid && rsid !== targetRsid) return;
        
        if (!rsidInfoMap.has(rsid)) {
          rsidInfoMap.set(rsid, { traits: new Set(), riskAlleles: new Set(), studyUrls: new Set() });
        }
        
        const info = rsidInfoMap.get(rsid);
        traits.forEach(t => info.traits.add(t));
        riskAlleles.forEach(r => info.riskAlleles.add(r));
        if (studyUrl) info.studyUrls.add(studyUrl);
      });
    }

    return rsidInfoMap;
  }
}