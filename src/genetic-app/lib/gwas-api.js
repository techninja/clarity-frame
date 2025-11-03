/**
 * @typedef {Object} TraitInfo
 * @property {Set<string>} traits
 * @property {Set<string>} riskAlleles
 * @property {Set<string>} studyUrls
 * @property {Set<string>} genes
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
   * Fetch with download progress tracking
   * @param {string} url
   * @param {Function} progressCallback - Called with (loaded, total)
   * @returns {Promise<Response>}
   */
  async _fetchWithProgress(url, progressCallback) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;
    
    if (!response.body) {
      return response;
    }

    let loaded = 0;
    const reader = response.body.getReader();
    const chunks = [];
    const startTime = Date.now();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      chunks.push(value);
      loaded += value.length;
      
      // Always use fallback display since server doesn't provide content-length
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = loaded / elapsed / 1024 / 1024; // MB/s
      const minutes = Math.floor(elapsed / 60);
      const seconds = Math.floor(elapsed % 60);
      const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      const progressStr = `${(loaded/1024/1024).toFixed(1)}MB • ${rate.toFixed(1)}MB/s • ${timeStr}`;
      progressCallback?.(loaded, loaded, progressStr);
    }

    const blob = new Blob(chunks);
    const text = await blob.text();
    
    return {
      ok: response.ok,
      status: response.status,
      headers: response.headers,
      json: () => Promise.resolve(JSON.parse(text))
    };
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
   * Search for SNPs by trait keyword with progress tracking
   * @param {string} keyword
   * @param {Function} progressCallback - Called with (current, total, step)
   * @param {number} maxResults - Maximum results to return (default 1000)
   * @returns {Promise<Map<string, TraitInfo>>}
   */
  async searchByTrait(keyword, progressCallback = null, maxResults = 1000) {
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
    const totalTraits = efoTraits.length;
    
    for (let i = 0; i < efoTraits.length; i++) {
      const trait = efoTraits[i];
      
      const assocUrl = trait._links?.associations?.href;
      if (!assocUrl) continue;

      try {
        const associations = await this._fetchAllAssociations(
          assocUrl, 
          maxResults - rsidInfoMap.size,
          (loaded, total, progressStr) => {
            progressCallback?.(i + 1, totalTraits, progressStr || `Processing trait ${i + 1}/${totalTraits}`);
          }
        );
        const traitMap = await this._processAssociations(associations, null, trait.trait);
        
        // Merge into main map
        for (const [rsid, info] of traitMap) {
          if (rsidInfoMap.size >= maxResults) break;
          
          if (!rsidInfoMap.has(rsid)) {
            rsidInfoMap.set(rsid, { traits: new Set(), riskAlleles: new Set(), studyUrls: new Set(), genes: new Set(), effects: [] });
          }
          const existing = rsidInfoMap.get(rsid);
          info.traits.forEach(t => existing.traits.add(t));
          info.riskAlleles.forEach(r => existing.riskAlleles.add(r));
          info.studyUrls.forEach(s => existing.studyUrls.add(s));
          info.genes.forEach(g => existing.genes.add(g));
          info.effects.forEach(e => existing.effects.push(e));
        }
        
        if (rsidInfoMap.size >= maxResults) break;
      } catch (error) {
        console.warn(`Error processing trait ${trait.trait}:`, error);
      }
    }



    return rsidInfoMap;
  }

  /**
   * Fetch associations with pagination and limits
   * @param {string} url
   * @param {number} maxResults - Maximum results to fetch
   * @param {Function} downloadProgressCallback - Called with (loaded, total) for download progress
   * @returns {Promise<Array>}
   */
  async _fetchAllAssociations(url, maxResults = 1000, downloadProgressCallback = null) {
    const associations = [];
    let nextUrl = url;
    let pageCount = 0;
    const maxPages = 10; // Limit API calls

    while (nextUrl && associations.length < maxResults && pageCount < maxPages) {
      try {
        const response = downloadProgressCallback ? 
          await this._fetchWithProgress(nextUrl, downloadProgressCallback) :
          await fetch(nextUrl);
          
        if (!response.ok) break;
        
        const data = await response.json();
        if (data._embedded?.associations) {
          const remaining = maxResults - associations.length;
          const toAdd = data._embedded.associations.slice(0, remaining);
          associations.push(...toAdd);
        }
        nextUrl = data._links?.next?.href;
        pageCount++;
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
      const genes = new Set();
      const effectInfo = {
        direction: assoc.betaDirection,
        magnitude: assoc.betaNum,
        unit: assoc.betaUnit,
        description: assoc.pvalueDescription
      };

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
        // Extract genes from authorReportedGenes array
        locus.authorReportedGenes?.forEach(geneObj => {
          if (geneObj.geneName) {
            genes.add(geneObj.geneName);
          }
        });
        
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
        // Get traits from EFO
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
          rsidInfoMap.set(rsid, { traits: new Set(), riskAlleles: new Set(), studyUrls: new Set(), genes: new Set(), effects: [] });
        }
        
        const info = rsidInfoMap.get(rsid);
        traits.forEach(t => info.traits.add(t));
        riskAlleles.forEach(r => info.riskAlleles.add(r));
        genes.forEach(g => info.genes.add(g));
        if (effectInfo.direction || effectInfo.magnitude) {
          info.effects.push(effectInfo);
        }
        if (studyUrl) info.studyUrls.add(studyUrl);
      });
    }

    return rsidInfoMap;
  }
}
