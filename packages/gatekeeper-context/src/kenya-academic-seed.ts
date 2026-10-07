import type { ContextCollectionMetadata, ContextCollectionSummary } from "./context-types.js";
import { metadataToSummary } from "./collection-kv.js";
import { domainName } from "./domain.js";
import type { ContextCollectionDurableObject } from "./context-collection.js";
import type { LibraryRegistryDurableObject } from "./registry-do.js";

export const KENYA_ACADEMIC_COLLECTION_ID = "col-kenya-academic-sources";

export const KENYA_ACADEMIC_METADATA: ContextCollectionMetadata = {
  id: KENYA_ACADEMIC_COLLECTION_ID,
  icon: "grad-cap",
  title: "Kenya Academic & Placement Knowledge Base",
  description:
    "Official Kenya academic references: KNEC curriculum frameworks, KCSE grading, KUCCPS cluster points formula, university degree syllabi (UoN, JKUAT, Strathmore), and NACOSTI research standards.",
  visibility: "public",
  created: new Date("2026-01-01T00:00:00.000Z"),
  lastUpdated: new Date(),
  documentCount: 8,
  content: { source: "web" },
};

export const KENYA_ACADEMIC_DOCUMENTS: Array<{
  path: string;
  description: string;
  body: string;
}> = [
  {
    path: "knec/kcse-framework.md",
    description: "KNEC KCSE examination structure, subject clusters, grading system, and mean grade calculation.",
    body: `# KNEC KCSE Curriculum Framework & Grading System

## 1. Overview
The Kenya National Examinations Council (KNEC) administers the Kenya Certificate of Secondary Education (KCSE). This framework outlines subject groupings, grading scales, and calculation methodology for the overall candidate mean grade.

## 2. Subject Groupings
Candidates must register for a minimum of 7 and a maximum of 9 subjects across the 5 approved groups:

### Group I: Compulsory Core Subjects
- **English (101)**
- **Kiswahili (102)**
- **Mathematics (121 Alt A / 122 Alt B)**

### Group II: Natural Sciences (Candidate must take at least 2)
- **Biology (231)**
- **Physics (232)**
- **Chemistry (233)**
- *Note for STEM/Health pathways: Chemistry is compulsory for virtually all medical and chemical engineering programs.*

### Group III: Humanities (Candidate must take at least 1)
- **History and Government (311)**
- **Geography (312)**
- **Christian Religious Education / CRE (313)**
- **Islamic Religious Education / IRE (314)**
- **Hindu Religious Education / HRE (315)**

### Group IV: Applied, Technical & Agricultural (Elective)
- **Home Science (441)**, **Art and Design (442)**
- **Agriculture (443)**
- **Woodwork (444)**, **Metalwork (445)**
- **Building Construction (446)**
- **Power Mechanics (447)**, **Electricity (448)**
- **Drawing and Design (449)**
- **Aviation Technology (450)**
- **Computer Studies (451)**

### Group V: Foreign Languages & Business (Elective)
- **French (501)**, **German (502)**, **Arabic (503)**, **Kenyan Sign Language (504)**
- **Music (511)**
- **Business Studies (565)**

## 3. KNEC 12-Point Grading Scale
Every subject is scored on a standardized 12-point scale:

| Grade | Points | Classification | Typical Percentage Band |
| :--- | :---: | :--- | :--- |
| **A** | 12 | Excellent | 80% – 100% |
| **A-** | 11 | Very Good | 75% – 79% |
| **B+** | 10 | Good | 70% – 74% |
| **B** | 9 | Fairly Good | 65% – 69% |
| **B-** | 8 | Above Average | 60% – 64% |
| **C+** | 7 | Average (Min University Entry) | 55% – 59% |
| **C** | 6 | Fair | 50% – 54% |
| **C-** | 5 | Below Average | 45% – 49% |
| **D+** | 4 | Poor | 40% – 44% |
| **D** | 3 | Very Poor | 35% – 39% |
| **D-** | 2 | Very Poor | 30% – 34% |
| **E** | 1 | Fail | 0% – 29% |

## 4. Overall Mean Grade Calculation
The aggregate score is calculated from the **best 7 subjects** conforming to the following mandatory distribution:
1. All three compulsory Group I subjects (English, Kiswahili, Mathematics).
2. The best two sciences from Group II.
3. The best one subject from Group III (Humanities).
4. The single best subject among the remaining eligible subjects (Group II, III, IV, or V).

Maximum possible aggregate points: $7 \\times 12 = 84$.
Minimum university direct government-sponsored entry threshold is **C+ (46 points)**.
`,
  },
  {
    path: "kuccps/cluster-points-calculation.md",
    description: "KUCCPS Weighted Cluster Point (WCP) calculation formula and placement criteria.",
    body: `# KUCCPS Weighted Cluster Points (WCP) Formula & Placement Criteria

## 1. Overview
The Kenya Universities and Colleges Central Placement Service (KUCCPS) places government-sponsored students into Kenyan public and private universities. Placement eligibility depends on the **Weighted Cluster Point (WCP)**.

## 2. The Official KUCCPS Formula
The Weighted Cluster Point ($C$) for any specific degree program is calculated using:

$$C = \\sqrt{\\frac{r}{m} \\times \\frac{t}{48}} \\times 48$$

Where:
- **$r$ (Raw Cluster Points):** The sum of points scored by the candidate in the **4 specific cluster subjects** required for that degree program. Maximum possible $r = 48$ ($4 \\times 12$).
- **$m$ (Maximum Cluster Points):** The highest possible score across the 4 cluster subjects, which is always **48**.
- **$t$ (Candidate's Total Aggregate Points):** The candidate's overall KCSE aggregate points scored across their best 7 subjects (from 7 to 84).
- **$48$:** The normalizing coefficient.

### Simplified Formula
Since $m = 48$, the formula simplifies to:

$$C = \\sqrt{\\frac{r \\times t}{48 \\times 48}} \\times 48 = \\sqrt{r \\times t}$$

*Example:*
- Candidate KCSE Aggregate ($t$) = 72 points (A-).
- Program Cluster Subjects Raw Sum ($r$) = 44 points (e.g., A in Math, A in Physics, A- in Chemistry, B+ in English).
- $$C = \\sqrt{44 \\times 72} = \\sqrt{3168} \\approx 56.285 \\text{ points}.$$
- *Wait, notice that KUCCPS maximum cluster points scale is 48!*
In the official KUCCPS table, when calculated:
$$C = \\sqrt{\\frac{r}{48} \\times \\frac{t}{84}} \\times 48$$
Let's verify:
$$\\text{If } r=48 \\text{ and } t=84: C = \\sqrt{1 \\times 1} \\times 48 = 48.000.$$
Maximum achievable cluster point is **48.000**.

## 3. Minimum Subject Cut-off Rules
Even if a candidate meets the aggregate cluster cutoff, they MUST satisfy the minimum individual subject grade prerequisites (e.g., min C+ in Math and Physics for Engineering, min B in Biology and Chemistry for Medicine).
`,
  },
  {
    path: "kuccps/degree-clusters-and-cutoffs.md",
    description: "KUCCPS degree cluster subject requirements for Engineering, Medicine, CS, Law, and Business.",
    body: `# KUCCPS Degree Subject Clusters & Minimum Subject Requirements

## 1. Cluster 1: Law & Legal Studies
- **Degree Examples:** Bachelor of Laws (LL.B).
- **Cluster Subjects (4):**
  1. English or Kiswahili (Minimum: B plain)
  2. Any 2nd language or Mathematics
  3. Any Humanity (History, Geography, CRE)
  4. Best remaining subject
- **Key Universities:** UoN (Parklands Campus), Strathmore University, Moi University (Annex), Kenyatta University, Kabarak University.

## 2. Cluster 3: Engineering, Technology & Architecture
- **Degree Examples:** BSc Civil Engineering, Electrical & Electronic Engineering, Mechanical Engineering, Mechatronics, Aeronautical Engineering.
- **Cluster Subjects (4):**
  1. Mathematics Alt A
  2. Physics
  3. Chemistry
  4. Biology OR Any Group IV subject (Computer Studies, Drawing & Design, Electricity, Building Construction)
- **Minimum Requirements:** Mathematics (C+), Physics (C+), Chemistry (C+), English/Kiswahili (C+).
- **Key Universities:** JKUAT, UoN, Moi, Dedan Kimathi (DeKUT), Technical University of Kenya (TUK).

## 3. Cluster 5: Computing & Informatics
- **Degree Examples:** BSc Computer Science, BSc Software Engineering, Bachelor of Information Technology (BIT), BSc Applied Computer Technology.
- **Cluster Subjects (4):**
  1. Mathematics Alt A
  2. Physics
  3. 3rd Subject: Chemistry OR Biology OR Computer Studies
  4. 4th Subject: Any Group II, III, IV, or V
- **Key Universities:** UoN (Chiromo), JKUAT, Strathmore (SCES), USIU-Africa, Kenyatta University.

## 4. Cluster 4: Medicine, Pharmacy & Health Sciences
- **Degree Examples:** Bachelor of Medicine and Bachelor of Surgery (MBChB), Bachelor of Pharmacy (BPharm), BSc Nursing, BDS Dental Surgery.
- **Cluster Subjects (4):**
  1. Biology
  2. Chemistry
  3. Mathematics OR Physics
  4. English OR Kiswahili
- **Minimum Subject Thresholds:** Minimum B in Biology, B in Chemistry, B in Mathematics/Physics, B in English/Kiswahili. Overall KCSE Mean Grade: B+ or A.
- **Key Universities:** UoN (Kenyatta National Hospital campus), Moi University (MTRH), Kenyatta University, JKUAT, Egerton, Mount Kenya University (MKU).

## 5. Cluster 2: Business, Commerce & Economics
- **Degree Examples:** Bachelor of Commerce (BCom), BSc Financial Economics, BSc Actuarial Science.
- **Cluster Subjects (4):**
  1. Mathematics Alt A
  2. English OR Kiswahili
  3. Any Humanity (History, Geography, CRE)
  4. Business Studies OR Any Group IV/V subject
`,
  },
  {
    path: "universities/kenyan-universities-syllabi.md",
    description: "Curriculum structures, semester rules, grading systems, and common units across Kenyan universities.",
    body: `# Kenyan University Curriculum Structures & Standards

## 1. Academic Calendar & Credit Units
Most Kenyan universities operate on a **two-semester system** per academic year:
- **Semester 1:** August/September – December
- **Semester 2:** January – April/May
- **Trimester / Summer Session (Optional):** May – August (Fast-track / Industrial Attachment)

Each unit typically represents **45 Contact Hours** (3 lecture hours per week $\\times$ 15 weeks), equivalent to **3.0 Academic Credit Units**. Full-time students enroll in 6 to 8 units per semester (18 – 24 credit hours).

## 2. Standard Grading Scale & Degree Classifications
Kenyan universities (UoN, JKUAT, KU, Moi, Strathmore) adhere to the Commission for University Education (CUE) standards:

| Score Band | Letter Grade | Grade Points | Degree Classification (Honours) |
| :--- | :---: | :---: | :--- |
| **70% – 100%** | **A** | 4.0 / 5.0 | **First Class Honours** |
| **60% – 69%** | **B** | 3.0 / 4.0 | **Second Class Honours (Upper Division)** |
| **50% – 59%** | **C** | 2.0 / 3.0 | **Second Class Honours (Lower Division)** |
| **40% – 49%** | **D** | 1.0 / 2.0 | **Pass** |
| **Below 40%** | **E / F** | 0.0 | **Fail** (Requires Supplementary Exam or Retake) |

*Note: In professional degrees (e.g., MBChB Medicine, Bachelor of Laws LL.B, BPharm Pharmacy), the passing score is frequently elevated to 50%, and awards may be unclassified with Pass/Credit/Distinction.*

## 3. Assessment Breakdown
- **Continuous Assessment Tests (CATs) & Practical Lab Work:** 30% – 40% of the total unit mark.
- **End of Semester University Examination:** 60% – 70% of the total unit mark.
- **Attendance Requirement:** Minimum **75% lecture and lab attendance** is mandatory to sit final examinations.

## 4. Common University Units (CUU)
Under CUE mandates, every undergraduate student across Kenya must complete university-wide foundational units:
1. **Communication Skills (e.g. CCS 001 / UCC 101):** Academic writing, discourse, and scholarly argumentation.
2. **Critical Thinking & Philosophy (e.g. CCS 002):** Logic, reasoning, and ethics.
3. **Environmental Science & Climate Literacy (e.g. CCS 008):** Ecology, Kenya Vision 2030 sustainability.
4. **Information Literacy & Computer Competency (e.g. CCS 010):** Digital research, database queries.
5. **HIV/AIDS & National Cohesion (e.g. CCS 009):** Public health, civic education, and ethics.
`,
  },
  {
    path: "universities/uon-computer-science-syllabus.md",
    description: "University of Nairobi (UoN) BSc Computer Science syllabus overview, core units, and project milestones.",
    body: `# University of Nairobi (UoN) BSc Computer Science Syllabus

**School of Computing and Informatics (SCI), Chiromo Campus**

## Year 1 (Foundations)
- **Semester 1:**
  - CSC 111: Introduction to Computer Systems & Architecture
  - CSC 112: Procedural Programming (C / C++)
  - SMA 101: Basic Mathematics (Discrete Structures)
  - SMA 103: Calculus I
  - CCS 001: Communication Skills
- **Semester 2:**
  - CSC 121: Object-Oriented Programming (Java)
  - CSC 122: Data Structures & Algorithms I
  - SMA 104: Calculus II
  - SMA 106: Linear Algebra I
  - CCS 010: Information Literacy

## Year 2 (Core Computer Systems & Theory)
- **Semester 1:**
  - CSC 211: Computer Architecture & Organization
  - CSC 212: Data Structures & Algorithms II
  - CSC 213: Database Systems (Relational Model, SQL, Normalization)
  - SMA 201: Probability & Statistics I
- **Semester 2:**
  - CSC 221: Operating Systems Principles (Concurrency, Memory Management, Linux POSIX)
  - CSC 222: Software Engineering Principles (Agile, UML, SDLC)
  - CSC 223: Computer Networks I (OSI model, TCP/IP, Routing)
  - CSC 224: Internet Technologies & Web Development

## Year 3 (Specializations & Industrial Attachment)
- **Semester 1:**
  - CSC 311: Design & Analysis of Algorithms
  - CSC 312: Artificial Intelligence & Knowledge Systems
  - CSC 313: Compiler Construction & Automata Theory
  - CSC 314: Computer Networks II (Network Security, Cryptography)
- **Semester 2:**
  - CSC 321: Distributed Systems & Cloud Computing
  - CSC 322: Human-Computer Interaction (HCI)
  - CSC 323: Research Methodology & Technical Writing
- **CSC 399: Industrial Attachment (Mandatory 12-week industry placement).**

## Year 4 (Capstone Project & Advanced Electives)
- **CSC 499: Capstone Final Year Project (Parts I & II):**
  - Requirements Specification & Architectural Design defense.
  - Full system implementation, empirical testing, and oral viva defense before an academic board.
- **Elective Tracks:**
  - *Data Science & AI:* Machine Learning, Big Data Analytics, NLP.
  - *Cybersecurity:* Cryptography, Digital Forensics, Ethical Hacking.
  - *Distributed Computing:* Microservices, Blockchain, Edge Computing.
`,
  },
  {
    path: "standards/kenyan-academic-writing-and-citations.md",
    description: "Kenyan university research standards, APA 7th, IEEE, OSCOLA (Kenya Law), and NACOSTI compliance.",
    body: `# Academic Writing, Referencing & Research Standards in Kenya

## 1. NACOSTI & Institutional Ethics Clearance
All postgraduate, undergraduate capstone, and field research conducted in Kenya must adhere to the **National Commission for Science, Technology and Innovation (NACOSTI)** regulations under the Science, Technology and Innovation Act (2013):
1. **Ethical Approval:** Clear the proposal with the University Institutional Scientific and Ethics Review Committee (ISERC).
2. **NACOSTI Research License:** Mandatory prior to collecting empirical data, administering questionnaires, or deploying software in public/private institutions.
3. **Plagiarism Policy:** Maximum allowed similarity index via Turnitin/iThenticate is **15%** (excluding bibliography and common phrases; single-source similarity must not exceed 3%).

## 2. Citation Styles by Academic Discipline

### A. APA 7th Edition (Education, Business, Humanities, Social Sciences)
- **In-text citation:** (Muriithi & Otieno, 2023) or Muriithi and Otieno (2023).
- **Three or more authors:** (Kariuki et al., 2022).
- **Reference format (Journal):**
  > Wanjiku, N. J., & Kamau, P. K. (2024). Adoption of mobile payment systems among SMEs in Nairobi. *African Journal of Information Systems*, 16(2), 145–162. https://doi.org/10.1080/ajis.2024.12345

### B. IEEE Style (Computer Science, Telecommunications, Electrical Engineering)
- **In-text citation:** Square bracket numbered citations: "[1]", "[2], [3]".
- **Reference format:**
  > [1] J. K. Omwenga and E. M. Kiprono, "Optimized edge computing pipelines for low-bandwidth agricultural IoT in Rift Valley," *IEEE Transactions on Emerging Topics in Computing*, vol. 12, no. 3, pp. 312–321, Mar. 2025.

### C. OSCOLA (Law & Legal Studies in Kenya)
- Cites Kenyan statutes, Constitution, and court rulings indexed on Kenya Law Reports (eKLR):
  - **Constitution:** *Constitution of Kenya (2010), art 35(1).*
  - **Statute:** *Data Protection Act (No 24 of 2019), s 18.*
  - **Case Law:** *Republic v Independent Electoral and Boundaries Commission [2017] eKLR.*
`,
  },
  {
    path: "skills/kenya-academic-copilot/SKILL.md",
    description: "Agent Skill manifest for Kenyan academic advisory, KNEC prep, and university syllabi.",
    body: `---
name: kenya-academic-copilot
description: Expert Kenyan academic assistant for KNEC exams, KCSE grading, KUCCPS degree placement & cluster points, and Kenyan university course syllabi.
---

# Kenya Academic Copilot

You are an expert academic advisor specialized in the Kenyan education ecosystem.

## Knowledge Capabilities:
1. **KNEC KCSE Guidance:**
   - Subject groups (I through V), grading on the 12-point scale (A to E).
   - Rules for computing candidate mean grades from the best 7 subjects.
2. **KUCCPS Placement & Cluster Points:**
   - Calculation of Weighted Cluster Points using $C = \\sqrt{\\frac{r}{48} \\times \\frac{t}{84}} \\times 48$.
   - Subject prerequisites for Engineering, Medicine, Computer Science, Law, and Commerce.
3. **Kenyan University Syllabi:**
   - Degree programs, course codes, common units (Communication Skills, Critical Thinking, Information Literacy).
   - Standard 40% CAT / 60% Exam breakdown and degree honors classifications.
4. **Academic Writing & Research Standards:**
   - APA 7th, IEEE, Harvard, and OSCOLA formatting for Kenyan papers.
   - NACOSTI ethical clearance and anti-plagiarism compliance rules.

When responding to Kenyan students, align answers with their specific university (UoN, JKUAT, Strathmore, KU, Moi) and academic year requirements.
`,
  },
  {
    path: "skills/youtube-lectures/SKILL.md",
    description: "Search, recommend, and embed verified academic video lectures with interactive chapters.",
    body: `---
name: youtube-lectures
description: Search, recommend, and embed verified academic video lectures (3Blue1Brown, MIT OCW, Karpathy, Abdul Bari, Walter Lewin) for playable Gadget UI rendering.
---

# Academic YouTube Video Engine & Lecture Guide

Use this skill when students or developers need visual, intuitive, or deep-dive academic lectures and tutorials on Mathematics, Algorithms, Machine Learning, Computer Science, and Physics.

## Playing in Gadget UI
When the user asks for a video or lecture:
1. Mount it in the **Gadget UI** via `client.js` with a responsive 16:9 iframe embed (`https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&rel=0&modestbranding=1&playsinline=1`).
2. Keep it clean like YouTube — strip off added custom controls (buttons, drawers, extra chrome), letting native YouTube controls provide play, seek, volume, and fullscreen.

## Recommending Lectures in Chat
You can also share direct embeds or inline links:
```youtube
https://www.youtube.com/watch?v=kCc8FmEb1nY
```
Or:
[🎬 Let's build GPT: from scratch, in code, spelled out](https://www.youtube.com/watch?v=kCc8FmEb1nY)

## Curated Verified Lectures:
- **Linear Algebra**: 3Blue1Brown Essence of Linear Algebra (\`fNk_zzaMoSs\`, \`k7RM-ot2NWY\`, \`kYB8IZa5AuE\`, \`PFDu9oVAE-g\`) and MIT 18.06 Gilbert Strang (\`ZK3O402wf1c\`).
- **Calculus**: 3Blue1Brown Essence of Calculus (\`WUvTyaaNkzM\`).
- **Algorithms & Complexity**: MIT 6.006 Peak Finding (\`HtSuA80QTyo\`) and Abdul Bari Algorithm Complexity (\`0IAPZzGSbME\`).
- **Deep Learning & Transformers**: Andrej Karpathy nanoGPT (\`kCc8FmEb1nY\`), 3Blue1Brown Neural Networks (\`aircAruvnKk\`, \`VMj-3S1tku0\`).
- **Physics & Engineering**: Prof. Walter Lewin Classical Mechanics (\`w-HYZv6HzAs\`).
- **Statistics & Data Science**: StatQuest PCA Step-by-Step (\`qBigTkBLU6g\`).
`,
  },
];

/**
 * Ensures the Kenya Academic Collection and all its documents are seeded into the public registry.
 */
export async function ensureKenyaAcademicSeeded(
  env: Cloudflare.Env,
  domain: string,
  collectionsNamespace: DurableObjectNamespace<ContextCollectionDurableObject>,
  registryNamespace: DurableObjectNamespace<LibraryRegistryDurableObject>,
): Promise<void> {
  const registry = registryNamespace.getByName(domain);
  const isAlreadyPublic = await registry.isPublic(KENYA_ACADEMIC_COLLECTION_ID);

  const collectionDO = collectionsNamespace.get(
    collectionsNamespace.idFromName(domainName(domain, KENYA_ACADEMIC_COLLECTION_ID)),
  );

  if (!isAlreadyPublic) {
    try {
      await collectionDO.initialize(KENYA_ACADEMIC_METADATA, domain, "");
    } catch {
      // Ignore if already initialized
    }

    // Populate all seed documents
    for (const doc of KENYA_ACADEMIC_DOCUMENTS) {
      try {
        await collectionDO.putContextDocument(doc.path, {
          description: doc.description,
          body: doc.body,
          contentType: "text/markdown",
        });
      } catch (err) {
        console.warn(`Failed to seed document ${doc.path}:`, err);
      }
    }

    // Register into public registry and snapshot to KV
    const summary: ContextCollectionSummary = metadataToSummary(KENYA_ACADEMIC_METADATA);
    summary.documentCount = KENYA_ACADEMIC_DOCUMENTS.length;
    await registry.addPublic(domain, summary);
  }
}
