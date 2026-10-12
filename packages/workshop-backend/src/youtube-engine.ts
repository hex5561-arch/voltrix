/**
 * YouTube Academic Video Engine for Voltrix OS
 * Provides curated academic lecture catalog, search matching, and video ingestion.
 */

export interface VideoChapter {
  title: string;
  timestamp: string;
  seconds: number;
}

export interface AcademicLecture {
  videoId: string;
  title: string;
  author: string;
  duration: string;
  discipline: string;
  summary: string;
  chapters: VideoChapter[];
  takeaways: string[];
}

export const ACADEMIC_DISCOVERY_CATALOG: AcademicLecture[] = [
  {
    videoId: 'fNk_zzaMoSs',
    title: 'Vectors, what even are they? | Essence of linear algebra, chapter 1',
    author: '3Blue1Brown',
    duration: '9:52',
    discipline: 'Mathematics & Linear Algebra',
    summary: 'Geometric foundation of vectors, coordinate systems, and vector addition in Euclidean space.',
    chapters: [
      { title: 'Introduction & Physics perspective', timestamp: '00:00', seconds: 0 },
      { title: 'Computer science perspective (Lists of numbers)', timestamp: '01:25', seconds: 85 },
      { title: 'Mathematician perspective (Vector axioms)', timestamp: '03:10', seconds: 190 },
      { title: 'Vector addition & Scaling vectors', timestamp: '05:32', seconds: 332 },
      { title: 'Fundamental geometric coordinate insight', timestamp: '08:15', seconds: 495 }
    ],
    takeaways: [
      'Vectors can be understood through 3 lenses: Physics (arrows), CS (ordered lists), and Math (generalized objects satisfying axioms).',
      'Vector addition: u + v = [u1 + v1, u2 + v2] represents chaining geometric displacements in space.',
      'Scalar multiplication scales length by factor c: c*v = [c*v1, c*v2].'
    ]
  },
  {
    videoId: 'k7RM-ot2NWY',
    title: 'Linear Combinations, Span, and Basis Vectors | Essence of linear algebra, chapter 2',
    author: '3Blue1Brown',
    duration: '9:59',
    discipline: 'Mathematics & Linear Algebra',
    summary: 'Visualizing span, linear independence, and basis coordinate systems (i-hat, j-hat).',
    chapters: [
      { title: 'Basis vectors i-hat and j-hat', timestamp: '00:00', seconds: 0 },
      { title: 'Linear combinations: a*v + b*w', timestamp: '02:40', seconds: 160 },
      { title: 'The span of two vectors in 2D and 3D', timestamp: '05:10', seconds: 310 },
      { title: 'Linear dependence and independence', timestamp: '07:30', seconds: 450 }
    ],
    takeaways: [
      'The span of vectors v1, ..., vk is the set of all linear combinations c1*v1 + ... + ck*vk.',
      'Linearly dependent vectors are redundant: one vector can be expressed as a linear combination of others.'
    ]
  },
  {
    videoId: 'kYB8IZa5AuE',
    title: 'Linear Transformations and Matrices | Essence of linear algebra, chapter 3',
    author: '3Blue1Brown',
    duration: '10:59',
    discipline: 'Mathematics & Linear Algebra',
    summary: 'Visualizing matrix multiplication as linear space transformations preserving origin and grid lines.',
    chapters: [
      { title: 'What is a linear transformation?', timestamp: '00:00', seconds: 0 },
      { title: 'Tracking basis vectors i-hat and j-hat', timestamp: '03:15', seconds: 195 },
      { title: 'Matrix-vector multiplication as linear combination', timestamp: '06:40', seconds: 400 },
      { title: 'Rotation and shear transformations', timestamp: '09:10', seconds: 550 }
    ],
    takeaways: [
      'A transformation is linear if T(c*u + d*v) = c*T(u) + d*T(v) and T(0) = 0.',
      'A matrix completely encapsulates where basis vectors land.'
    ]
  },
  {
    videoId: 'PFDu9oVAE-g',
    title: 'Eigenvectors and Eigenvalues | Essence of linear algebra, chapter 14',
    author: '3Blue1Brown',
    duration: '17:16',
    discipline: 'Mathematics & Linear Algebra',
    summary: 'Geometric intuition behind eigenvectors (A*v = lambda*v) and characteristic polynomials.',
    chapters: [
      { title: 'Geometric visual intuition of eigen-axes', timestamp: '00:00', seconds: 0 },
      { title: 'Eigenvector equation: A v = lambda v', timestamp: '04:15', seconds: 255 },
      { title: 'Characteristic polynomial det(A - lambda*I) = 0', timestamp: '08:40', seconds: 520 },
      { title: 'Diagonal matrices & Eigendecomposition', timestamp: '13:10', seconds: 790 }
    ],
    takeaways: [
      'An eigenvector v of matrix A remains on its original span under transformation A, scaled by eigenvalue lambda: A*v = lambda*v.',
      'Eigenvalues satisfy the characteristic equation det(A - lambda*I) = 0.'
    ]
  },
  {
    videoId: 'ZK3O402wf1c',
    title: 'MIT 18.06: Linear Algebra — Lecture 1: Geometry of Linear Equations',
    author: 'MIT OpenCourseWare (Prof. Gilbert Strang)',
    duration: '39:49',
    discipline: 'Mathematics & Linear Algebra',
    summary: 'Row picture vs column picture of linear systems Ax = b, matrix elimination, and vector spaces.',
    chapters: [
      { title: 'Course introduction & 2x2 linear systems', timestamp: '00:00', seconds: 0 },
      { title: 'Row Picture vs Column Picture', timestamp: '06:30', seconds: 390 },
      { title: 'Matrix multiplication: Ax as combination of columns', timestamp: '18:45', seconds: 1125 }
    ],
    takeaways: [
      'The column picture expresses Ax = b as a linear combination of matrix columns.',
      'A system has a unique solution iff the coefficient matrix columns are linearly independent.'
    ]
  },
  {
    videoId: 'WUvTyaaNkzM',
    title: 'The Essence of Calculus, Chapter 1: The derivative',
    author: '3Blue1Brown',
    duration: '17:05',
    discipline: 'Mathematics & Calculus',
    summary: 'Geometric intuition behind derivatives, instantaneous rate of change, and area limits.',
    chapters: [
      { title: 'Geometric area intuition', timestamp: '00:00', seconds: 0 },
      { title: 'Distance, Velocity, and Time', timestamp: '04:15', seconds: 255 },
      { title: 'The paradox of 0/0 and limits', timestamp: '08:50', seconds: 530 }
    ],
    takeaways: [
      'Derivative measures instantaneous rate of change: f\'(x) = lim_{dx->0} [f(x+dx) - f(x)] / dx.',
      'Differentiation computes the sensitivity of output to infinitesimal input variations.'
    ]
  },
  {
    videoId: 'HtSuA80QTyo',
    title: 'MIT 6.006: Introduction to Algorithms — Lecture 1: Algorithmic Thinking, Peak Finding',
    author: 'MIT OpenCourseWare (Prof. Erik Demaine)',
    duration: '52:10',
    discipline: 'Computer Science & Algorithms',
    summary: 'Divide and conquer algorithmic paradigm, 1D and 2D peak finding problem.',
    chapters: [
      { title: 'Course Overview & Syllabus', timestamp: '00:00', seconds: 0 },
      { title: '1D Peak Finding: Straightforward O(n) Search', timestamp: '08:30', seconds: 510 },
      { title: '1D Peak Finding: Divide & Conquer O(log n)', timestamp: '17:45', seconds: 1065 },
      { title: '2D Peak Finding Algorithm', timestamp: '34:20', seconds: 2060 }
    ],
    takeaways: [
      'Divide and conquer reduces search space exponentially from n to n/2 per step.',
      'Recurrence relation for 1D binary peak finding: T(n) = T(n/2) + O(1) implies T(n) = O(log n).'
    ]
  },
  {
    videoId: 'aircAruvnKk',
    title: 'Neural Networks: But what is a neural network? | Deep learning, chapter 1',
    author: '3Blue1Brown',
    duration: '19:13',
    discipline: 'Computer Science & AI',
    summary: 'Visual introduction to multilayer perceptrons, activations, weights, and biases.',
    chapters: [
      { title: 'Structure of a Neuron', timestamp: '00:00', seconds: 0 },
      { title: 'Hidden Layers & Feature Representation', timestamp: '04:12', seconds: 252 },
      { title: 'Matrix Notation & Activations', timestamp: '09:45', seconds: 585 }
    ],
    takeaways: [
      'A neuron holds a scalar activation value representing feature presence.',
      'Layer transitions are computed via matrix multiplication: a^(l) = sigma(W^(l)*a^(l-1) + b^(l)).'
    ]
  },
  {
    videoId: 'IHZwWFHWa-w',
    title: 'Gradient Descent, How Neural Networks Learn | Deep learning, chapter 2',
    author: '3Blue1Brown',
    duration: '21:01',
    discipline: 'Computer Science & Machine Learning',
    summary: 'Cost functions, high-dimensional gradients, and step-by-step optimization.',
    chapters: [
      { title: 'Cost function definition', timestamp: '00:00', seconds: 0 },
      { title: 'Gradient vector and direction of steepest ascent', timestamp: '06:15', seconds: 375 },
      { title: 'Backpropagation preview', timestamp: '15:20', seconds: 920 }
    ],
    takeaways: [
      'The negative gradient -grad(C) points in the direction of steepest descent for cost C.',
      'Weights are updated iteratively: W <- W - eta * grad(C).'
    ]
  },
  {
    videoId: 'kCc8FmEb1nY',
    title: "Let's build GPT: from scratch, in code, spelled out",
    author: 'Andrej Karpathy',
    duration: '1:56:22',
    discipline: 'Computer Science & AI / LLMs',
    summary: 'Complete architectural implementation of nanoGPT: token embeddings, self-attention, multi-head attention, and transformer blocks.',
    chapters: [
      { title: 'Introduction & Bigram model baseline', timestamp: '00:00', seconds: 0 },
      { title: 'Self-Attention Mechanism & Q, K, V', timestamp: '31:10', seconds: 1870 },
      { title: 'Multi-Head Attention & Residual Connections', timestamp: '1:02:15', seconds: 3735 }
    ],
    takeaways: [
      'Scaled Dot-Product Attention: Attention(Q, K, V) = softmax(Q*K^T / sqrt(d_k)) * V.',
      'Causal masking prevents tokens from attending to future positions.'
    ]
  },
  {
    videoId: '0IAPZzGSbME',
    title: 'Introduction to Algorithms & Asymptotic Analysis',
    author: 'Abdul Bari',
    duration: '18:40',
    discipline: 'Computer Science & Algorithms',
    summary: 'Formulating asymptotic time complexity, Big-O, Omega, and Theta notations.',
    chapters: [
      { title: 'What is an Algorithm?', timestamp: '00:00', seconds: 0 },
      { title: 'Time and Space Complexity Analysis', timestamp: '05:20', seconds: 320 },
      { title: 'Asymptotic Notations: Big O, Omega, Theta', timestamp: '11:00', seconds: 660 }
    ],
    takeaways: [
      'Big-O notation f(n) = O(g(n)) gives an asymptotic upper bound on growth rate.',
      'Dominant polynomial or exponential terms dictate runtime as n -> infinity.'
    ]
  },
  {
    videoId: '8mAITcNt710',
    title: 'Harvard CS50: Introduction to Computer Science — Full University Course',
    author: 'freeCodeCamp.org / Prof. David J. Malan',
    duration: '2:45:00',
    discipline: 'Computer Science & Programming',
    summary: 'Computational thinking, binary representation, algorithms, memory pointers, and data structures.',
    chapters: [
      { title: 'Binary, ASCII, and Computational Thinking', timestamp: '00:00', seconds: 0 },
      { title: 'Algorithms, Linear vs Binary Search', timestamp: '35:20', seconds: 2120 }
    ],
    takeaways: [
      'Information is encoded in binary (0 and 1 bits); n bits represent 2^n unique states.',
      'Binary search achieves O(log n) time by halving search boundaries repeatedly.'
    ]
  },
  {
    videoId: 'wWnfJ0-xXRE',
    title: 'MIT 8.01: Classical Mechanics — Lecture 1: Units & Dimensions',
    author: 'Prof. Walter Lewin (MIT Physics)',
    duration: '48:35',
    discipline: 'Physics & Mechanics',
    summary: 'Dimensional analysis, scale invariance, orders of magnitude, and physical measurement uncertainty.',
    chapters: [
      { title: 'Units, Length, Mass, and Time', timestamp: '00:00', seconds: 0 },
      { title: 'Dimensional Analysis in Physical Equations', timestamp: '14:20', seconds: 860 }
    ],
    takeaways: [
      'Dimensional homogeneity: Every valid physical relation must balance dimensions [L], [M], [T].',
      'Order-of-magnitude scaling provides physical validation before detailed derivation.'
    ]
  },
  {
    videoId: '4jRBRDbJemM',
    title: 'ROC and AUC, Clearly Explained! | Machine Learning Metrics',
    author: 'StatQuest with Josh Starmer',
    duration: '16:04',
    discipline: 'Statistics & Machine Learning',
    summary: 'Receiver Operating Characteristic (ROC) curves, True Positive Rate, False Positive Rate, and AUC classification metric.',
    chapters: [
      { title: 'Confusion Matrix & Threshold Sensitivity', timestamp: '00:00', seconds: 0 },
      { title: 'Plotting True Positive vs False Positive Rate', timestamp: '05:30', seconds: 330 }
    ],
    takeaways: [
      'ROC curve plots Sensitivity against (1 - Specificity) across decision thresholds.',
      'AUC quantifies overall classifier ranking discriminability (1.0 = perfect, 0.5 = random).'
    ]
  },
  {
    videoId: 'bBC-nXj3Ng4',
    title: 'How Does Bitcoin & Cryptography Actually Work?',
    author: '3Blue1Brown',
    duration: '26:12',
    discipline: 'Computer Science & Cryptography',
    summary: 'Cryptographic hash functions (SHA-256), digital signatures, ledger consensus, and proof of work.',
    chapters: [
      { title: 'Ledgers and Trust Networks', timestamp: '00:00', seconds: 0 },
      { title: 'Cryptographic Hash Functions (SHA-256)', timestamp: '04:30', seconds: 270 }
    ],
    takeaways: [
      'Cryptographic hash functions are deterministic, collision-resistant, and pre-image resistant.',
      'Asymmetric public-key cryptography guarantees message authenticity without revealing private keys.'
    ]
  }
];

/**
 * Extract YouTube 11-char video ID from any format (URL, embed, ID string, or query text).
 */
export function extractYouTubeId(input: string | null | undefined): string | null {
  if (!input) return null;
  const str = String(input).trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str;

  const match = str.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|(?:embed|v|shorts)\/))([a-zA-Z0-9_-]{11})/i
  );
  if (match) return match[1];

  // Search query match against catalog
  const found = searchYouTubeLectures(str);
  if (found.length > 0) return found[0].videoId;

  return null;
}

// In-memory cache of dynamically ingested lectures (e.g. from search queries)
export const DYNAMIC_ACADEMIC_CACHE = new Map<string, AcademicLecture>();

export function getAllKnownLectures(): AcademicLecture[] {
  const map = new Map<string, AcademicLecture>();
  for (const item of ACADEMIC_DISCOVERY_CATALOG) {
    map.set(item.videoId, item);
  }
  for (const [id, item] of DYNAMIC_ACADEMIC_CACHE.entries()) {
    map.set(id, item);
  }
  return Array.from(map.values());
}

/**
 * Search academic YouTube lectures by query string with relevance ranking.
 */
export function searchYouTubeLectures(query: string): AcademicLecture[] {
  const q = (query || '').toLowerCase().trim();
  const allLectures = getAllKnownLectures();
  if (!q) return allLectures;

  const tokens = q.split(/[^a-z0-9_]+/).filter(t => t.length > 2);

  const scored = allLectures.map(item => {
    let score = 0;
    const titleLow = item.title.toLowerCase();
    const authorLow = item.author.toLowerCase();
    const discLow = item.discipline.toLowerCase();
    const summaryLow = item.summary.toLowerCase();

    if (item.videoId.toLowerCase() === q) score += 100;
    if (titleLow === q) score += 80;
    if (titleLow.includes(q)) score += 50;
    if (authorLow.includes(q)) score += 35;
    if (discLow.includes(q)) score += 30;
    if (summaryLow.includes(q)) score += 20;

    for (const tok of tokens) {
      if (titleLow.includes(tok)) score += 15;
      if (authorLow.includes(tok)) score += 10;
      if (discLow.includes(tok)) score += 8;
      if (summaryLow.includes(tok)) score += 4;
    }

    return { item, score };
  });

  const matching = scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(s => s.item);

  return matching.length > 0 ? matching : [];
}

/**
 * Multi-tier Hybrid Search:
 * 1. Checks local catalog & memory cache first.
 * 2. If fewer than 3 matches, queries YouTube Data API / Web fallback.
 * 3. Ingests and caches new video results.
 */
export async function searchYouTubeLecturesHybrid(query: string, env?: unknown): Promise<AcademicLecture[]> {
  const q = (query || '').trim();
  if (!q) return getAllKnownLectures();

  // Tier 1: Local catalog search
  const localMatches = searchYouTubeLectures(q);
  if (localMatches.length >= 3) {
    return localMatches;
  }

  // Tier 2: YouTube Fallback Query (API or public web extraction + oEmbed)
  const fallbackResults: AcademicLecture[] = [];
  try {
    const envObj = (env as Record<string, string | undefined>) || {};
    const ytApiKey = envObj.YOUTUBE_API_KEY || envObj.GOOGLE_API_KEY;

    let videoIds: string[] = [];

    if (ytApiKey) {
      const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(q + ' academic lecture')}&maxResults=5&key=${ytApiKey}`;
      const res = await fetch(apiUrl);
      if (res.ok) {
        const data = await res.json() as { items?: Array<{ id?: { videoId?: string }; snippet?: { title?: string; channelTitle?: string; description?: string } }> };
        for (const item of data.items || []) {
          const vId = item.id?.videoId;
          if (vId && !DYNAMIC_ACADEMIC_CACHE.has(vId)) {
            const lecture: AcademicLecture = {
              videoId: vId,
              title: item.snippet?.title || `Academic Lecture: ${q}`,
              author: item.snippet?.channelTitle || 'Academic Channel',
              duration: 'Lecture',
              discipline: 'Academic Science & Mathematics',
              summary: item.snippet?.description || `Academic lecture covering ${q}.`,
              chapters: [
                { title: 'Foundational Overview', timestamp: '00:00', seconds: 0 },
                { title: 'Core Principles & Analysis', timestamp: '06:00', seconds: 360 },
                { title: 'Synthesis & Problem Solving', timestamp: '14:00', seconds: 840 }
              ],
              takeaways: [
                `Essential concepts and foundations for ${q}.`,
                'Synthesizing key equations and structural proofs accelerates retention.',
                'Active recall checkpoint solidifies theoretical grasp.'
              ]
            };
            DYNAMIC_ACADEMIC_CACHE.set(vId, lecture);
            fallbackResults.push(lecture);
          }
        }
      }
    }

    // If no API key or API call returned empty, use resilient public extraction
    if (fallbackResults.length === 0) {
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(q + ' academic lecture')}`;
      const res = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });
      if (res.ok) {
        const text = await res.text();
        const matches = text.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g);
        const seen = new Set<string>();
        for (const m of matches) {
          const id = m[1];
          if (id && !seen.has(id) && !ACADEMIC_DISCOVERY_CATALOG.some(c => c.videoId === id)) {
            seen.add(id);
            videoIds.push(id);
            if (videoIds.length >= 4) break;
          }
        }
      }

      // Fetch oembed details for extracted video IDs
      for (const id of videoIds) {
        if (DYNAMIC_ACADEMIC_CACHE.has(id)) {
          fallbackResults.push(DYNAMIC_ACADEMIC_CACHE.get(id)!);
          continue;
        }
        try {
          const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`);
          if (oembedRes.ok) {
            const odata = await oembedRes.json() as { title?: string; author_name?: string };
            const lecture: AcademicLecture = {
              videoId: id,
              title: odata.title || `Academic Lecture (${id})`,
              author: odata.author_name || 'Academic Creator',
              duration: 'Lecture',
              discipline: 'Academic Science & Mathematics',
              summary: `University-level educational lecture focusing on ${odata.title || q}.`,
              chapters: [
                { title: 'Core Lecture Theory', timestamp: '00:00', seconds: 0 },
                { title: 'Proof & Derivation', timestamp: '05:30', seconds: 330 },
                { title: 'Applications & Review', timestamp: '12:00', seconds: 720 }
              ],
              takeaways: [
                `Direct insights into ${odata.title || q}.`,
                'Apply conceptual definitions to work through test cases.',
                'Review chapter milestones for targeted exam preparation.'
              ]
            };
            DYNAMIC_ACADEMIC_CACHE.set(id, lecture);
            fallbackResults.push(lecture);
          }
        } catch {
          // ignore single video oembed error
        }
      }
    }
  } catch (err) {
    console.warn('YouTube fallback search failed:', err);
  }

  // Combine local matches + newly discovered fallback results
  const combinedMap = new Map<string, AcademicLecture>();
  for (const item of localMatches) {
    combinedMap.set(item.videoId, item);
  }
  for (const item of fallbackResults) {
    combinedMap.set(item.videoId, item);
  }

  const combined = Array.from(combinedMap.values());
  return combined.length > 0 ? combined : ACADEMIC_DISCOVERY_CATALOG;
}

/**
 * Handle GET/POST /api/youtube/search requests.
 */
export async function handleYouTubeSearchRequest(req: Request, env?: unknown): Promise<Response> {
  const url = new URL(req.url);
  let query = url.searchParams.get('q') || url.searchParams.get('query') || '';

  if (!query && req.method === 'POST') {
    try {
      const body = await req.json() as Record<string, unknown>;
      query = String(body.q || body.query || '');
    } catch {
      // Ignore body parse error
    }
  }

  const results = await searchYouTubeLecturesHybrid(query, env);

  return new Response(JSON.stringify({
    success: true,
    query,
    count: results.length,
    results
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=60'
    }
  });
}


/**
 * Handle POST /api/rag/ingest-youtube requests.
 */
export async function handleYouTubeIngestRequest(req: Request): Promise<Response> {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json() as Record<string, unknown>;
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const youtubeUrl = String(body.youtubeUrl || body.url || '').trim();
  if (!youtubeUrl) {
    return new Response(JSON.stringify({ success: false, error: 'youtubeUrl is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const videoId = extractYouTubeId(youtubeUrl);
  const normalizedUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : youtubeUrl;

  // Check catalog first for instant verified metadata
  const catalogEntry = videoId ? ACADEMIC_DISCOVERY_CATALOG.find(c => c.videoId === videoId) : null;

  let title = catalogEntry?.title || '';
  let author = catalogEntry?.author || '';

  // If not in catalog, fetch oEmbed metadata
  if (!title) {
    try {
      const oeResp = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(normalizedUrl)}`, {
        signal: AbortSignal.timeout(4000)
      });
      if (oeResp.ok) {
        const oeData = await oeResp.json() as { title?: string; author_name?: string };
        title = oeData.title || title;
        author = oeData.author_name || author;
      }
    } catch {
      // Fallback
    }
  }

  const finalTitle = title || (videoId ? `YouTube Lecture (${videoId})` : normalizedUrl);
  const finalAuthor = author || 'Academic Educator';

  // Fetch transcript content via Jina Reader or use catalog summary
  let extractedText = '';
  if (catalogEntry) {
    extractedText = `YouTube Academic Lecture: ${catalogEntry.title}\n` +
      `Instructor / Channel: ${catalogEntry.author} (${catalogEntry.discipline})\n` +
      `Duration: ${catalogEntry.duration}\n` +
      `URL: ${normalizedUrl}\n\n` +
      `Executive Summary:\n${catalogEntry.summary}\n\n` +
      `Timestamped Chapters:\n${catalogEntry.chapters.map(c => `- ${c.timestamp}: ${c.title}`).join('\n')}\n\n` +
      `Core Formulas & Conceptual Takeaways:\n${catalogEntry.takeaways.map(t => `- ${t}`).join('\n')}`;
  } else {
    try {
      const jinaResp = await fetch(`https://r.jina.ai/${normalizedUrl}`, {
        headers: { 'Accept': 'text/plain', 'User-Agent': 'VoltrixYouTubeIngest/1.0' },
        signal: AbortSignal.timeout(8000)
      });
      if (jinaResp.ok) {
        const raw = await jinaResp.text();
        const contentIdx = raw.indexOf('Markdown Content:');
        extractedText = contentIdx > -1 ? raw.slice(contentIdx + 17).trim() : raw;
      }
    } catch {
      // Fallback text
    }

    if (!extractedText || extractedText.length < 100) {
      extractedText = `YouTube Educational Lecture: ${finalTitle}\n` +
        `Instructor / Source: ${finalAuthor}\n` +
        `URL: ${normalizedUrl}\n\n` +
        `Overview:\nStructured lecture explaining core concepts, problem-solving techniques, and academic theory for ${finalTitle}.`;
    }
  }

  const wordCount = extractedText.split(/\s+/).filter(Boolean).length;

  return new Response(JSON.stringify({
    success: true,
    videoId: videoId || normalizedUrl,
    youtubeUrl: normalizedUrl,
    title: finalTitle,
    author: finalAuthor,
    words: wordCount,
    chapters: catalogEntry?.chapters || [],
    takeaways: catalogEntry?.takeaways || [],
    content: extractedText
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

export interface RecommendedLecture extends AcademicLecture {
  recommendationReason?: string;
  isWeaknessMatch?: boolean;
  isCourseMatch?: boolean;
  isSubscribedMatch?: boolean;
}

/**
 * Handle GET /api/vtube/feed requests.
 * Evaluates student weaknesses, subscribed channels, and enrolled courses to prioritize recommendations.
 */
export async function handleVTubeFeedRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const discipline = url.searchParams.get('discipline')?.toLowerCase();
  const courses = (url.searchParams.get('courses') || '')
    .toLowerCase()
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  const weaknesses = (url.searchParams.get('weaknesses') || '')
    .toLowerCase()
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  const subscribed = (url.searchParams.get('subscribed') || '')
    .toLowerCase()
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const allLectures = getAllKnownLectures();

  const scored: Array<{ lecture: RecommendedLecture; score: number }> = allLectures.map(lec => {
    let score = 0;
    let reason = '';
    let isWeaknessMatch = false;
    let isCourseMatch = false;
    let isSubscribedMatch = false;

    const titleLow = lec.title.toLowerCase();
    const discLow = lec.discipline.toLowerCase();
    const authorLow = lec.author.toLowerCase();
    const summaryLow = lec.summary.toLowerCase();
    const takeawaysText = (lec.takeaways || []).join(' ').toLowerCase();

    // 1. Weakness match check (highest priority: student focus areas)
    for (const w of weaknesses) {
      if (w.length < 3) continue;
      if (titleLow.includes(w) || summaryLow.includes(w) || takeawaysText.includes(w) || discLow.includes(w)) {
        score += 120;
        isWeaknessMatch = true;
        reason = `Targets Weakness: ${w.charAt(0).toUpperCase() + w.slice(1)}`;
        break;
      }
    }

    // 2. Subscribed author check
    for (const sub of subscribed) {
      if (sub && authorLow.includes(sub)) {
        score += 60;
        isSubscribedMatch = true;
        if (!reason) {
          reason = `From Subscribed Creator: ${lec.author}`;
        }
        break;
      }
    }

    // 3. Enrolled courses check
    for (const course of courses) {
      if (course.length < 3) continue;
      if (titleLow.includes(course) || discLow.includes(course)) {
        score += 45;
        isCourseMatch = true;
        if (!reason) {
          reason = `Enrolled Course Aligned: ${course.toUpperCase()}`;
        }
        break;
      }
    }

    // 4. Discipline match check
    if (discipline && discLow.includes(discipline)) {
      score += 25;
      if (!reason) {
        reason = `Curriculum Foundation: ${lec.discipline}`;
      }
    }

    const recLecture: RecommendedLecture = {
      ...lec,
      recommendationReason: reason || (isWeaknessMatch ? 'Identified Weakness Topic' : 'Academic Core'),
      isWeaknessMatch,
      isCourseMatch,
      isSubscribedMatch,
    };

    return { lecture: recLecture, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Recommended shelf: items with score >= 45 (or top 4 if none match)
  const highScoring = scored.filter(s => s.score >= 45).map(s => s.lecture);
  const recommended = highScoring.length > 0 ? highScoring.slice(0, 6) : scored.slice(0, 4).map(s => s.lecture);
  const feed = scored.map(s => s.lecture);

  return new Response(JSON.stringify({
    success: true,
    recommended,
    feed,
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

/**
 * Handle GET /api/vtube/video/:id requests with dynamic oEmbed fallback.
 */
export async function handleVTubeVideoRequest(req: Request, videoId: string): Promise<Response> {
  let video = getAllKnownLectures().find(c => c.videoId === videoId);

  if (!video) {
    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      if (oembedRes.ok) {
        const odata = await oembedRes.json() as { title?: string; author_name?: string };
        video = {
          videoId,
          title: odata.title || `Academic Lecture (${videoId})`,
          author: odata.author_name || 'Academic Creator',
          duration: '--:--',
          discipline: 'Academic Science & Mathematics',
          summary: `Academic video analysis and lecture on ${odata.title || videoId}.`,
          chapters: [
            { title: 'Foundational Overview', timestamp: '00:00', seconds: 0 },
            { title: 'Theoretical Framework & Derivations', timestamp: '05:00', seconds: 300 },
            { title: 'Synthesis & Exam Applications', timestamp: '15:00', seconds: 900 }
          ],
          takeaways: [
            `Core conceptual foundations of ${odata.title || 'this topic'}.`,
            'Active recall and timestamped note-taking strengthen retention.',
            'Socratic inquiry verifies deeper conceptual mastery.'
          ]
        };
        DYNAMIC_ACADEMIC_CACHE.set(videoId, video);
      }
    } catch {
      // Fallback below
    }
  }

  if (!video) {
    return new Response(JSON.stringify({ success: false, error: 'Video not found' }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  return new Response(JSON.stringify({ success: true, video }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

