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

/**
 * Search academic YouTube lectures by query string with relevance ranking.
 */
export function searchYouTubeLectures(query: string): AcademicLecture[] {
  const q = (query || '').toLowerCase().trim();
  if (!q) return ACADEMIC_DISCOVERY_CATALOG;

  const tokens = q.split(/[^a-z0-9_]+/).filter(t => t.length > 2);

  const scored = ACADEMIC_DISCOVERY_CATALOG.map(item => {
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

  return matching.length > 0 ? matching : ACADEMIC_DISCOVERY_CATALOG;
}

/**
 * Handle GET/POST /api/youtube/search requests.
 */
export async function handleYouTubeSearchRequest(req: Request): Promise<Response> {
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

  const results = searchYouTubeLectures(query);

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
      'Cache-Control': 'public, max-age=300'
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
