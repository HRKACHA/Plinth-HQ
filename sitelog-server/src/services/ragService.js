/**
 * RAG Service for Construction Knowledge Base
 *
 * Provides searchable construction knowledge including:
 * - IS Codes (Indian Standards)
 * - CPWD Specifications
 * - Construction best practices
 * - Safety standards
 *
 * This is a lightweight in-memory implementation. For production,
 * replace with a vector DB (Pinecone, pgvector, Weaviate).
 */

const knowledgeBase = [
  // IS 456:2000 — Plain and Reinforced Concrete
  {
    document: 'IS 456:2000',
    title: 'Plain and Reinforced Concrete — Code of Practice',
    clause: '5.1',
    category: 'concrete',
    content: 'Grades of concrete: The concrete shall be in grades designated as M10, M15, M20, M25, M30, M35, M40, M45, M50, M55, M60, M65, M70, M75 and M80. The number in grade designation refers to 28-day characteristic compressive strength of 150mm cube in MPa.',
  },
  {
    document: 'IS 456:2000',
    title: 'Plain and Reinforced Concrete — Code of Practice',
    clause: '6.1',
    category: 'concrete',
    content: 'Cement: The cement used shall be any of the following: 33 grade OPC (IS 269), 43 grade OPC (IS 8112), 53 grade OPC (IS 12269), Portland slag cement (IS 455), Portland pozzolana cement (IS 1489).',
  },
  {
    document: 'IS 456:2000',
    title: 'Plain and Reinforced Concrete — Code of Practice',
    clause: '8.1',
    category: 'concrete',
    content: 'The minimum cement content and maximum water-cement ratio for different exposure conditions: Mild exposure — min cement 300 kg/m³, max w/c 0.55. Moderate — 300 kg/m³, 0.50. Severe — 320 kg/m³, 0.45. Very severe — 340 kg/m³, 0.45. Extreme — 360 kg/m³, 0.40.',
  },
  {
    document: 'IS 456:2000',
    title: 'Plain and Reinforced Concrete — Code of Practice',
    clause: '13.1',
    category: 'concrete',
    content: 'Curing: Exposed surfaces of concrete shall be kept continuously in a moist condition for at least 7 days from the date of placing in case of OPC and at least 10 days where mineral admixtures or blended cements are used. The period of curing shall not be less than 10 days for concrete exposed to dry and hot weather conditions.',
  },
  {
    document: 'IS 456:2000',
    title: 'Plain and Reinforced Concrete — Code of Practice',
    clause: '26.5.1.1',
    category: 'concrete',
    content: 'Minimum reinforcement: The minimum area of tension reinforcement shall not be less than (0.85 × b × d) / fy, where b is the breadth and d is the effective depth of the beam and fy is the yield stress of the reinforcement.',
  },
  {
    document: 'IS 456:2000',
    title: 'Plain and Reinforced Concrete — Code of Practice',
    clause: '26.2.1',
    category: 'concrete',
    content: 'Nominal cover to meet durability requirements: Mild exposure — 20mm. Moderate — 30mm. Severe — 45mm. Very severe — 50mm. Extreme — 75mm. These covers apply to all reinforcement including links.',
  },

  // IS 1893:2002 — Earthquake Resistant Design
  {
    document: 'IS 1893:2002 (Part 1)',
    title: 'Criteria for Earthquake Resistant Design of Structures',
    clause: '6.4',
    category: 'structural',
    content: 'Seismic Zones: India is divided into 4 seismic zones — Zone II (Low Damage Risk), Zone III (Moderate Damage Risk), Zone IV (High Damage Risk), and Zone V (Very High Damage Risk). Zone factors (Z): Zone II — 0.10, Zone III — 0.16, Zone IV — 0.24, Zone V — 0.36.',
  },
  {
    document: 'IS 1893:2002 (Part 1)',
    title: 'Criteria for Earthquake Resistant Design of Structures',
    clause: '7.1',
    category: 'structural',
    content: 'Design seismic base shear: VB = Ah × W, where Ah is the design horizontal seismic coefficient and W is the seismic weight of the building. Ah = (Z × I × Sa/g) / (2 × R), where Z = zone factor, I = importance factor, R = response reduction factor, Sa/g = spectral acceleration coefficient.',
  },

  // IS 875 — Design Loads
  {
    document: 'IS 875 (Part 1):1987',
    title: 'Code of Practice for Design Loads — Dead Loads',
    clause: '4.1',
    category: 'structural',
    content: 'Unit weights of building materials: RCC — 25 kN/m³, PCC — 24 kN/m³, Brick masonry — 19.2 kN/m³, Stone masonry — 24.1 kN/m³, Timber — 8 kN/m³, Steel — 78.5 kN/m³, Glass — 25.5 kN/m³.',
  },
  {
    document: 'IS 875 (Part 2):1987',
    title: 'Code of Practice for Design Loads — Imposed Loads',
    clause: '3.1',
    category: 'structural',
    content: 'Minimum imposed floor loads: Residential buildings — 2.0 kN/m², Office buildings — 2.5 kN/m², Shops/stores (light) — 4.0 kN/m², Assembly areas with fixed seating — 4.0 kN/m², Assembly areas without fixed seating — 5.0 kN/m², Garages (light vehicles) — 2.5 kN/m², Hospitals — 2.0 kN/m², Educational buildings — 3.0 kN/m².',
  },

  // IS 13920:2016 — Ductile Design and Detailing
  {
    document: 'IS 13920:2016',
    title: 'Ductile Design and Detailing of Reinforced Concrete Structures',
    clause: '6.1',
    category: 'structural',
    content: 'Beams: Factored axial compressive stress shall not exceed 0.08fck. Width-to-depth ratio shall be more than 0.3. Width shall not be less than 200mm. Depth shall preferably not exceed 1/4 of clear span.',
  },

  // CPWD Specifications
  {
    document: 'CPWD General Specifications 2019',
    title: 'CPWD General Specifications for Civil Works',
    clause: 'Vol.1, Section 4',
    category: 'specifications',
    content: 'Earth Work: All excavation in foundations shall be taken to the required depth and width as shown in drawings. The bottom of excavation shall be levelled and rammed. Excavated earth should be stacked at minimum 1m distance from the edge of excavation. In case of hard soil, the sides of excavation may be kept vertical up to 1.5m depth.',
  },
  {
    document: 'CPWD General Specifications 2019',
    title: 'CPWD General Specifications for Civil Works',
    clause: 'Vol.1, Section 5',
    category: 'specifications',
    content: 'Concrete Work: Ready Mix Concrete (RMC) shall be used for all structural concrete of grade M20 and above. Transit mixer shall reach site within 90 minutes from batching. Concrete shall be placed within 30 minutes of arrival. Slump for RMC: beams/slabs — 75-100mm, columns — 75-100mm, foundation — 50-75mm.',
  },
  {
    document: 'CPWD General Specifications 2019',
    title: 'CPWD General Specifications for Civil Works',
    clause: 'Vol.2, Section 10',
    category: 'specifications',
    content: 'Brick Work: Bricks shall conform to IS 1077. Minimum compressive strength shall be 7.5 N/mm² (Class 75) for load bearing walls. Mortar mix for structural brick work in cement mortar shall be 1:4 (1 cement : 4 sand). Bricks shall be soaked in water for at least 2 hours before use.',
  },
  {
    document: 'CPWD General Specifications 2019',
    title: 'CPWD General Specifications for Civil Works',
    clause: 'Vol.2, Section 12',
    category: 'specifications',
    content: 'Plastering: Minimum thickness of internal plaster — 12mm (single coat) or 15-20mm (two coats). External plaster — 20mm minimum in two coats. Cement mortar 1:4 for external walls and 1:6 for internal walls. Curing for at least 7 days.',
  },

  // Safety Standards
  {
    document: 'IS 3696 (Part 1):1987',
    title: 'Safety Code for Scaffolds and Ladders',
    clause: '5.1',
    category: 'safety',
    content: 'Scaffolding General Requirements: Maximum height of free-standing scaffold shall not exceed 4 times its minimum base dimension. Working platforms shall be at least 600mm wide. Guard rails shall be at least 950mm above the platform. Toe boards of minimum 150mm height shall be provided.',
  },
  {
    document: 'NBC 2016 (Part 4)',
    title: 'National Building Code — Fire and Life Safety',
    clause: '4.4.3',
    category: 'safety',
    content: 'Fire Safety Requirements: Buildings above 15m height shall have wet riser system. Buildings above 24m shall have automatic sprinkler system. Minimum two staircases required for buildings with floor area exceeding 500 sq.m. Minimum staircase width — 1.5m for residential, 2.0m for other occupancies.',
  },
  {
    document: 'BOCW Act & Rules',
    title: 'Building and Other Construction Workers (Safety) Rules',
    clause: 'Rule 30-35',
    category: 'safety',
    content: 'Excavation Safety: No person shall work in excavation exceeding 1.5m depth without adequate shoring, strutting or stepping. Barriers at least 1m high shall be provided around excavations. Ladders or ramps shall be provided for safe access. Excavation materials shall be kept at least 1.5m from edge.',
  },

  // Construction Methods
  {
    document: 'PlinthHQ Best Practices',
    title: 'Concreting Best Practices Guide',
    clause: 'BPG-CON-01',
    category: 'methods',
    content: 'Pre-Concreting Checklist: 1) Check formwork alignment and level, 2) Ensure reinforcement is as per drawing with correct cover, 3) Get reinforcement inspection approved, 4) Arrange adequate vibrators (1 per 3 cu.m per hour), 5) Check concrete grade, slump, and quantity in mix design, 6) Plan pour sequence for large pours, 7) Ensure curing arrangements are ready, 8) Check weather forecast — avoid concreting in rain.',
  },
  {
    document: 'PlinthHQ Best Practices',
    title: 'Quality Assurance Guide',
    clause: 'BPG-QA-01',
    category: 'methods',
    content: 'Concrete Cube Testing: Cast minimum 6 cubes per 50 cu.m or part thereof (3 for 7-day test, 3 for 28-day test). Cube size: 150mm × 150mm × 150mm. Cubes must be cured in water at 27°C ± 2°C. Acceptance criteria (IS 456): Mean of group ≥ fck + 0.825 × standard deviation, and individual ≥ fck − 3 N/mm².',
  },
];

/**
 * Simple keyword-based search with relevance scoring.
 * For production, use embeddings + vector similarity.
 */
const STOP_WORDS = new Set(['the', 'and', 'for', 'with', 'this', 'that', 'from', 'but', 'all', 'any', 'how', 'what', 'who', 'when', 'where', 'why', 'can', 'you', 'your', 'our', 'their', 'has', 'have', 'had', 'will', 'would', 'shall', 'should', 'could', 'about', 'out', 'into', 'over', 'under', 'write', 'email', 'ask', 'asking', 'tell', 'make', 'create', 'generate', 'please', 'just', 'like']);

export function searchKnowledge(query, { topK = 5 } = {}) {
  const queryTerms = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));

  if (queryTerms.length === 0) {
    return { results: [], message: 'Query too short or contains no searchable terms.' };
  }

  const scored = knowledgeBase.map((entry) => {
    const searchText = `${entry.document} ${entry.title} ${entry.clause} ${entry.category} ${entry.content}`.toLowerCase();

    let score = 0;
    for (const term of queryTerms) {
      // Exact word match (higher score)
      const regex = new RegExp(`\\b${term}\\b`, 'g');
      const matches = searchText.match(regex);
      if (matches) score += matches.length * 2;

      // Partial match
      if (searchText.includes(term)) score += 1;
    }

    // Boost for category match
    const categoryTerms = ['concrete', 'structural', 'safety', 'specifications', 'methods'];
    for (const term of queryTerms) {
      if (categoryTerms.includes(term) && entry.category === term) {
        score += 5;
      }
    }

    return { ...entry, score };
  });

  const results = scored
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ score, ...entry }) => entry);

  return {
    results,
    totalMatches: scored.filter((e) => e.score > 0).length,
    message: results.length > 0
      ? `Found ${results.length} relevant results.`
      : 'No matching results found in the knowledge base.',
  };
}
