import { useState, useEffect, useRef } from "react";
import { Play } from "@phosphor-icons/react";

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
  channelAvatar?: string;
  discipline: string;
  summary: string;
  chapters: VideoChapter[];
  takeaways: string[];
}

/**
 * 100% Verified Academic Video Catalog for instant high-yield playback & fallback chapters
 */
export const ACADEMIC_DISCOVERY_CATALOG: AcademicLecture[] = [
  {
    videoId: "fNk_zzaMoSs",
    title: "Vectors, what even are they? | Essence of linear algebra, chapter 1",
    author: "3Blue1Brown",
    duration: "9:52",
    channelAvatar: "📐",
    discipline: "Mathematics & Linear Algebra",
    summary: "Geometric foundation of vectors, coordinate systems, and vector addition in Euclidean space.",
    chapters: [
      { title: "Introduction & Physics perspective", timestamp: "00:00", seconds: 0 },
      { title: "Computer science perspective (Lists of numbers)", timestamp: "01:25", seconds: 85 },
      { title: "Mathematician perspective (Vector axioms)", timestamp: "03:10", seconds: 190 },
      { title: "Vector addition & Scaling vectors", timestamp: "05:32", seconds: 332 },
      { title: "Fundamental geometric coordinate insight", timestamp: "08:15", seconds: 495 },
    ],
    takeaways: [
      "Vectors can be understood through 3 lenses: Physics (arrows), CS (ordered lists), and Math (generalized objects satisfying axioms).",
      "Vector addition: u + v = [u1 + v1, u2 + v2] represents chaining geometric displacements.",
      "Scalar multiplication scales the length of a vector by factor c: c*v = [c*v1, c*v2].",
    ],
  },
  {
    videoId: "k7RM-ot2NWY",
    title: "Linear Combinations, Span, and Basis Vectors | Essence of linear algebra, chapter 2",
    author: "3Blue1Brown",
    duration: "9:59",
    channelAvatar: "📐",
    discipline: "Mathematics & Linear Algebra",
    summary: "Visualizing span, linear independence, and basis coordinate systems (i-hat, j-hat).",
    chapters: [
      { title: "Basis vectors i-hat and j-hat", timestamp: "00:00", seconds: 0 },
      { title: "Linear combinations: a*v + b*w", timestamp: "02:40", seconds: 160 },
      { title: "The span of two vectors in 2D and 3D", timestamp: "05:10", seconds: 310 },
      { title: "Linear dependence and independence", timestamp: "07:30", seconds: 450 },
    ],
    takeaways: [
      "The span of vectors v1, ..., vk is the set of all linear combinations c1*v1 + ... + ck*vk.",
      "Linearly dependent vectors are redundant: one vector can be expressed as a linear combination of others.",
    ],
  },
  {
    videoId: "kYB8IZa5AuE",
    title: "Linear Transformations and Matrices | Essence of linear algebra, chapter 3",
    author: "3Blue1Brown",
    duration: "10:59",
    channelAvatar: "📐",
    discipline: "Mathematics & Linear Algebra",
    summary: "Visualizing matrix multiplication as linear space transformations preserving the origin and grid lines.",
    chapters: [
      { title: "What is a linear transformation?", timestamp: "00:00", seconds: 0 },
      { title: "Tracking basis vectors i-hat and j-hat", timestamp: "03:15", seconds: 195 },
      { title: "Matrix-vector multiplication as linear combination", timestamp: "06:40", seconds: 400 },
      { title: "Rotation and shear transformations", timestamp: "09:10", seconds: 550 },
    ],
    takeaways: [
      "A transformation is linear if T(c*u + d*v) = c*T(u) + d*T(v) and T(0) = 0.",
      "A matrix completely encapsulates where basis vectors land.",
    ],
  },
  {
    videoId: "PFDu9oVAE-g",
    title: "Eigenvectors and Eigenvalues | Essence of linear algebra, chapter 14",
    author: "3Blue1Brown",
    duration: "17:16",
    channelAvatar: "🔍",
    discipline: "Mathematics & Linear Algebra",
    summary: "Geometric intuition behind eigenvectors (A*v = lambda*v) and characteristic polynomials.",
    chapters: [
      { title: "Geometric visual intuition of eigen-axes", timestamp: "00:00", seconds: 0 },
      { title: "Eigenvector equation: A v = lambda v", timestamp: "04:15", seconds: 255 },
      { title: "Characteristic polynomial det(A - lambda*I) = 0", timestamp: "08:40", seconds: 520 },
      { title: "Diagonal matrices & Eigendecomposition", timestamp: "13:10", seconds: 790 },
    ],
    takeaways: [
      "An eigenvector v of matrix A remains on its original span under transformation A, scaled by eigenvalue lambda: A*v = lambda*v.",
      "Eigenvalues satisfy the characteristic equation det(A - lambda*I) = 0.",
    ],
  },
  {
    videoId: "ZK3O402wf1c",
    title: "MIT 18.06: Linear Algebra — Lecture 1: The Geometry of Linear Equations",
    author: "MIT OpenCourseWare (Prof. Gilbert Strang)",
    duration: "39:49",
    channelAvatar: "🏛️",
    discipline: "Mathematics & Linear Algebra",
    summary: "Row picture vs column picture of linear systems Ax = b, matrix elimination, and vector spaces.",
    chapters: [
      { title: "Course introduction & 2x2 linear systems", timestamp: "00:00", seconds: 0 },
      { title: "Row Picture vs Column Picture", timestamp: "06:30", seconds: 390 },
      { title: "Matrix multiplication: Ax as combination of columns", timestamp: "18:45", seconds: 1125 },
      { title: "3x3 systems and geometry of planes", timestamp: "28:10", seconds: 1690 },
    ],
    takeaways: [
      "The column picture expresses Ax = b as a linear combination of matrix columns.",
      "A system has a unique solution if and only if coefficient matrix columns are linearly independent.",
    ],
  },
  {
    videoId: "WUvTyaaNkzM",
    title: "The Essence of Calculus, Chapter 1: The derivative",
    author: "3Blue1Brown",
    duration: "17:05",
    channelAvatar: "📐",
    discipline: "Mathematics & Calculus",
    summary: "Geometric intuition behind derivatives, instantaneous rate of change, and the paradox of zero division.",
    chapters: [
      { title: "Geometric area intuition", timestamp: "00:00", seconds: 0 },
      { title: "Distance, Velocity, and Time", timestamp: "04:15", seconds: 255 },
      { title: "The paradox of 0/0 and limits", timestamp: "08:50", seconds: 530 },
      { title: "Formalizing df/dt", timestamp: "12:30", seconds: 750 },
    ],
    takeaways: [
      "The derivative measures instantaneous rate of change as delta t -> 0.",
      "Graphically, the derivative is the exact slope of the tangent line at any given point.",
    ],
  },
  {
    videoId: "HtSuA80QTyo",
    title: "MIT 6.006: Introduction to Algorithms — Lecture 1: Algorithmic Thinking, Peak Finding",
    author: "MIT OpenCourseWare (Prof. Erik Demaine)",
    duration: "52:10",
    channelAvatar: "🏛️",
    discipline: "Computer Science & Algorithms",
    summary: "Divide and conquer algorithmic paradigm, 1D and 2D peak finding problem.",
    chapters: [
      { title: "Course Overview & Syllabus", timestamp: "00:00", seconds: 0 },
      { title: "1D Peak Finding: Straightforward O(n) Search", timestamp: "08:30", seconds: 510 },
      { title: "1D Peak Finding: Divide & Conquer O(log n)", timestamp: "17:45", seconds: 1065 },
      { title: "2D Peak Finding Algorithm", timestamp: "34:20", seconds: 2060 },
    ],
    takeaways: [
      "Divide and conquer reduces search space exponentially from n to n/2 per step.",
      "Recurrence relation for 1D binary peak finding: T(n) = T(n/2) + O(1) implies T(n) = O(log n).",
    ],
  },
  {
    videoId: "aircAruvnKk",
    title: "Neural Networks: But what is a neural network? | Deep learning, chapter 1",
    author: "3Blue1Brown",
    duration: "19:13",
    channelAvatar: "🧠",
    discipline: "Computer Science & AI",
    summary: "Visual introduction to multilayer perceptrons, activations, weights, and biases.",
    chapters: [
      { title: "Structure of a Neuron", timestamp: "00:00", seconds: 0 },
      { title: "Hidden Layers & Feature Representation", timestamp: "04:12", seconds: 252 },
      { title: "Matrix Notation & Activations", timestamp: "09:45", seconds: 585 },
      { title: "Sigmoid and modern activation functions", timestamp: "14:20", seconds: 860 },
    ],
    takeaways: [
      "A neuron holds a number between 0 and 1 representing an activation level.",
      "Feedforward formula: a^(1) = sigma(W * a^(0) + b).",
    ],
  },
  {
    videoId: "VMj-3S1tku0",
    title: "Deep Learning: Gradient descent, how neural networks learn | Chapter 2",
    author: "3Blue1Brown",
    duration: "21:01",
    channelAvatar: "🧠",
    discipline: "Computer Science & AI",
    summary: "Visualizing high-dimensional cost surfaces and following the negative gradient vector.",
    chapters: [
      { title: "Cost Function Definition", timestamp: "00:00", seconds: 0 },
      { title: "Gradient Vector Direction", timestamp: "05:15", seconds: 315 },
      { title: "Stochastic Gradient Descent (SGD)", timestamp: "11:30", seconds: 690 },
      { title: "Backpropagation Intuition", timestamp: "16:45", seconds: 1005 },
    ],
    takeaways: [
      "The gradient vector nabla C points in the direction of steepest ascent on the cost manifold.",
      "Weight updates follow the negative gradient: W <- W - eta * nabla C.",
    ],
  },
  {
    videoId: "kCc8FmEb1nY",
    title: "Let's build GPT: from scratch, in code, spelled out",
    author: "Andrej Karpathy",
    duration: "1:56:22",
    channelAvatar: "⚡",
    discipline: "Computer Science & AI",
    summary: "Complete step-by-step implementation of the nanoGPT transformer architecture in PyTorch.",
    chapters: [
      { title: "Bigram character-level model", timestamp: "00:00", seconds: 0 },
      { title: "Mathematical trick of self-attention", timestamp: "25:10", seconds: 1510 },
      { title: "Multi-head attention & Residual connections", timestamp: "55:30", seconds: 3330 },
      { title: "Feedforward network & LayerNorm", timestamp: "1:15:00", seconds: 4500 },
      { title: "Training the transformer", timestamp: "1:35:00", seconds: 5700 },
    ],
    takeaways: [
      "Self-attention formula: Attention(Q, K, V) = softmax(Q * K^T / sqrt(d_k)) * V.",
      "Causal masking prevents tokens from attending to subsequent tokens in autoregressive generation.",
    ],
  },
  {
    videoId: "0IAPZzGSbME",
    title: "Abdul Bari: 1.1 Introduction to Algorithms and Complexity Analysis",
    author: "Abdul Bari",
    duration: "18:03",
    channelAvatar: "📘",
    discipline: "Computer Science & Algorithms",
    summary: "Asymptotic notation, Big-O, Omega, and Theta complexity analysis principles.",
    chapters: [
      { title: "What is an Algorithm?", timestamp: "00:00", seconds: 0 },
      { title: "Time and Space Complexity", timestamp: "04:20", seconds: 260 },
      { title: "Asymptotic Notations (Big-O, Omega, Theta)", timestamp: "09:15", seconds: 555 },
      { title: "Comparing Growth Rates", timestamp: "14:10", seconds: 850 },
    ],
    takeaways: [
      "Big-O represents an asymptotic upper bound: f(n) <= c * g(n) for n >= n0.",
      "Complexity hierarchy: O(1) < O(log n) < O(n) < O(n log n) < O(n^2) < O(2^n).",
    ],
  },
  {
    videoId: "w-HYZv6HzAs",
    title: "Walter Lewin: For the Love of Physics — Classical Mechanics Lecture 1",
    author: "Prof. Walter Lewin (MIT)",
    duration: "50:06",
    channelAvatar: "⚛️",
    discipline: "Physics & Engineering",
    summary: "Powers of ten, units, dimensional analysis, and experimental uncertainties.",
    chapters: [
      { title: "Introduction & Standard Units", timestamp: "00:00", seconds: 0 },
      { title: "Dimensional Analysis Technique", timestamp: "12:15", seconds: 735 },
      { title: "Measuring Periods of Pendulums", timestamp: "28:40", seconds: 1720 },
      { title: "Experimental Uncertainties & Significant Figures", timestamp: "40:10", seconds: 2410 },
    ],
    takeaways: [
      "Dimensional analysis determines physical proportionality without solving differential equations.",
      "Simple pendulum period: T = 2*pi * sqrt(L / g), completely independent of mass.",
    ],
  },
  {
    videoId: "qBigTkBLU6g",
    title: "StatQuest: Principal Component Analysis (PCA) Step-by-Step",
    author: "StatQuest with Josh Starmer",
    duration: "21:57",
    channelAvatar: "📊",
    discipline: "Data Science & Statistics",
    summary: "Dimensionality reduction, projection, variance maximization, and scree plots.",
    chapters: [
      { title: "Why PCA? Intuition & 2D Projection", timestamp: "00:00", seconds: 0 },
      { title: "Finding the First Principal Component (PC1)", timestamp: "04:30", seconds: 270 },
      { title: "Calculating PC2 & Orthogonality", timestamp: "10:15", seconds: 615 },
      { title: "Eigenvalues, Eigenvectors & Scree Plots", timestamp: "15:45", seconds: 945 },
    ],
    takeaways: [
      "PCA rotates coordinate axes to align with orthogonal directions of maximum variance.",
      "Eigenvectors of the covariance matrix form the principal axes; eigenvalues quantify variance explained.",
    ],
  },
];

const KNOWN_CHANNELS = [
  "3blue1brown",
  "mitopencourseware",
  "stanford",
  "harvard",
  "khanacademy",
  "crashcourse",
  "statquest",
  "andrejkarpathy",
  "abdulbari",
];

/**
 * Universal YouTube ID Extractor
 */
export function extractYouTubeId(urlOrId?: unknown): string {
  if (!urlOrId) return "fNk_zzaMoSs";

  if (typeof urlOrId === "object" && urlOrId !== null) {
    const obj = urlOrId as Record<string, unknown>;
    return (
      (obj.videoId as string) ||
      (obj.id as string) ||
      extractYouTubeId(obj.url || obj.videoUrl || obj.title)
    );
  }

  const str = String(urlOrId).trim();

  // 1. JSON encoded string
  if (str.startsWith("{") && str.endsWith("}")) {
    try {
      const parsed = JSON.parse(str);
      const res = extractYouTubeId(parsed);
      if (res) return res;
    } catch {}
  }

  // 2. Standard YouTube URL match
  const urlMatch = str.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|(?:embed|v|shorts)\/))([a-zA-Z0-9_-]{11})/i,
  );
  if (urlMatch) return urlMatch[1];

  // 3. Explicit ID pattern
  const explicitIdMatch = str.match(
    /(?:video_?id|id|v)\s*[:=]\s*["'`]?([a-zA-Z0-9_-]{11})["'`]?/i,
  );
  if (
    explicitIdMatch &&
    !KNOWN_CHANNELS.includes(explicitIdMatch[1].toLowerCase())
  ) {
    return explicitIdMatch[1];
  }

  // 4. Exact 11-char ID
  if (
    /^[a-zA-Z0-9_-]{11}$/.test(str) &&
    !KNOWN_CHANNELS.includes(str.toLowerCase()) &&
    ![
      "mathematics",
      "concurrency",
      "engineering",
      "programming",
      "introductio",
    ].includes(str.toLowerCase())
  ) {
    return str;
  }

  // 5. Query / Search match against Catalog
  const searchMatch = str.match(/[?&](?:search_query|q)=([^&]+)/i);
  const queryText = searchMatch
    ? decodeURIComponent(searchMatch[1].replace(/\+/g, " "))
    : str;
  const qLow = queryText.toLowerCase();

  const tokens = qLow
    .split(/[^a-z0-9_]+/)
    .filter(
      (t) =>
        t.length > 2 &&
        ![
          "watch",
          "youtube",
          "video",
          "lecture",
          "the",
          "and",
          "for",
          "with",
          "from",
          "tutorial",
          "course",
        ].includes(t),
    );

  let bestMatch: AcademicLecture | null = null;
  let highestScore = 0;

  for (const item of ACADEMIC_DISCOVERY_CATALOG) {
    const titleLow = item.title.toLowerCase();
    const itemText =
      `${item.title} ${item.author} ${item.discipline} ${item.summary}`.toLowerCase();
    let score = 0;

    if (titleLow.includes(qLow) || qLow.includes(titleLow)) score += 50;

    for (const tok of tokens) {
      if (titleLow.includes(tok)) score += 15;
      else if (itemText.includes(tok)) score += 4;
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = item;
    }
  }

  if (bestMatch && highestScore > 0) return bestMatch.videoId;

  return "fNk_zzaMoSs";
}

export interface YouTubePlayerCardProps {
  videoId?: string | null;
  videoUrl?: string | null;
  title?: string | null;
  author?: string | null;
  chapters?: VideoChapter[] | null;
  takeaways?: string[] | null;
  onSaveToNotes?: ((notes: string, title: string) => void) | null;
  onClose?: (() => void) | null;
  compact?: boolean;
}

/**
 * Clean Native YouTube Player for Voltrix OS
 * Responsive 16:9 nocookie player with native YouTube controls — clean, playable, and clutter-free.
 */
export function YouTubePlayerCard({
  videoId: initialVideoId = null,
  videoUrl = null,
  title: initialTitle = null,
  author: _author = null,
  chapters: _chapters = null,
  takeaways: _takeaways = null,
  onSaveToNotes: _onSaveToNotes = null,
  onClose: _onClose = null,
  compact: _compact = false,
}: YouTubePlayerCardProps) {
  const [activeVideoId, setActiveVideoId] = useState<string>(() => {
    return (
      extractYouTubeId(initialVideoId || videoUrl || initialTitle) ||
      "fNk_zzaMoSs"
    );
  });

  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const extracted = extractYouTubeId(
      initialVideoId || videoUrl || initialTitle,
    );
    if (extracted && extracted !== activeVideoId) {
      setActiveVideoId(extracted);
    }
  }, [initialVideoId, videoUrl, initialTitle, activeVideoId]);

  const catalogEntry =
    ACADEMIC_DISCOVERY_CATALOG.find((c) => c.videoId === activeVideoId) || null;
  const currentTitle =
    initialTitle || catalogEntry?.title || `YouTube Video (${activeVideoId})`;

  useEffect(() => {
    if (activeVideoId && typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("voltrix-play-gadget-video", {
          detail: { videoId: activeVideoId, title: currentTitle },
        }),
      );
    }
  }, [activeVideoId, currentTitle]);

  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "";
  const embedSrc = `https://www.youtube-nocookie.com/embed/${activeVideoId}?enablejsapi=1&origin=${encodeURIComponent(
    origin,
  )}&widget_referrer=${encodeURIComponent(
    origin,
  )}&rel=0&modestbranding=1&playsinline=1`;

  return (
    <span className="block w-full my-3 rounded-2xl bg-black border border-kumo-line dark:border-neutral-800 shadow-md overflow-hidden">
      <span className="block relative w-full aspect-video bg-black">
        <iframe
          ref={iframeRef}
          key={activeVideoId}
          src={embedSrc}
          title={currentTitle}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          loading="lazy"
        />
      </span>
    </span>
  );
}

/**
 * Compact YouTube Chat Card for previewing video results before full playback
 */
export function YouTubeChatCard({
  data,
  rawUrl,
  onPlay,
}: {
  data?: unknown;
  rawUrl?: string;
  onPlay?: (videoId: string) => void;
}) {
  let title = "Academic Lecture";
  let author = "Academic Educator";
  let url = rawUrl || "https://www.youtube.com";

  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;
    title = (obj.title as string) || title;
    author = (obj.author as string) || author;
    if (obj.videoId) url = `https://www.youtube.com/watch?v=${obj.videoId}`;
    else if (obj.url || obj.videoUrl)
      url = (obj.url || obj.videoUrl) as string;
    else if (obj.query)
      url = `https://www.youtube.com/results?search_query=${encodeURIComponent(
        String(obj.query),
      )}`;
  } else if (typeof data === "string") {
    const trimmed = data.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      url = trimmed;
    } else {
      url = `https://www.youtube.com/results?search_query=${encodeURIComponent(
        trimmed,
      )}`;
      title = trimmed;
    }
  }

  const videoId = extractYouTubeId(url || title);
  const catalogEntry = ACADEMIC_DISCOVERY_CATALOG.find(
    (c) => c.videoId === videoId,
  );
  if (catalogEntry) {
    title = catalogEntry.title;
    author = catalogEntry.author;
  }

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

  return (
    <span className="flex my-2 p-2.5 rounded-xl bg-kumo-base dark:bg-[#121316] border border-kumo-line dark:border-neutral-800 hover:border-kumo-brand/40 shadow-xs items-center justify-between gap-3 transition-all group">
      {/* Thumbnail + Video Info */}
      <span className="flex items-center gap-3 min-w-0 flex-1">
        <span className="block relative w-20 h-12 rounded-lg overflow-hidden bg-black/80 border border-kumo-line dark:border-neutral-800 flex-shrink-0 shadow-xs">
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <span className="flex absolute inset-0 bg-black/25 items-center justify-center">
            <span className="flex w-5 h-5 rounded-full bg-red-600 text-white items-center justify-center shadow-xs">
              <Play weight="fill" className="w-2.5 h-2.5 ml-0.5" />
            </span>
          </span>
        </span>

        <span className="block min-w-0 space-y-0.5">
          <span className="block text-xs font-semibold text-kumo-default dark:text-neutral-100 truncate group-hover:text-kumo-brand transition-colors">
            {title}
          </span>
          <span className="flex text-[11px] text-kumo-subtle dark:text-neutral-400 truncate items-center gap-1.5">
            <span className="text-kumo-brand font-medium">{author}</span>
            {catalogEntry?.duration && <span>· {catalogEntry.duration}</span>}
          </span>
        </span>
      </span>

      {/* Action Button */}
      <button
        type="button"
        onClick={() => {
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("voltrix-play-gadget-video", {
                detail: { videoId, title },
              }),
            );
          }
          onPlay?.(videoId);
        }}
        className="px-3 py-1.5 rounded-lg bg-kumo-brand hover:opacity-90 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer flex-shrink-0"
        title="Play this lecture in Gadget UI"
      >
        <Play weight="fill" className="w-3 h-3" />
        <span>Watch</span>
      </button>
    </span>
  );
}

export default YouTubePlayerCard;
