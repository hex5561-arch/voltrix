export interface MarkingRubricStep {
  markType: 'M1' | 'M2' | 'A1' | 'A2' | 'B1' | 'B2';
  description: string;
  marksAwarded: number;
}

export interface PastPaperQuestion {
  id: string;
  questionNumber: number;
  subpart?: string;
  topic: string;
  marks: number;
  prompt: string;
  diagramUrl?: string;
  rubric: MarkingRubricStep[];
  commonPitfalls: string[];
  socraticHints: string[];
  modelSolution: string;
}

export interface PastPaper {
  id: string;
  examBody: 'UNEB_UCE' | 'UNEB_UACE' | 'KNEC_KCSE' | 'WAEC_WASSCE' | 'CAMBRIDGE_IGCSE' | 'CAMBRIDGE_ALEVEL';
  examBodyName: string;
  country: string;
  level: 'O-Level' | 'A-Level' | 'High School' | 'Secondary';
  subjectCode: string;
  subjectName: string;
  paperNumber: number;
  year: number;
  termOrSession?: string;
  totalMarks: number;
  timeAllowed: string;
  instructions: string;
  questions: PastPaperQuestion[];
}

export const PAST_PAPERS: PastPaper[] = [
  // ─── UNEB UCE (Uganda Certificate of Education) ───────────────────────────
  {
    id: 'uneb-uce-phy-2023-p1',
    examBody: 'UNEB_UCE',
    examBodyName: 'UNEB (Uganda National Examinations Board)',
    country: 'UG',
    level: 'O-Level',
    subjectCode: '535/1',
    subjectName: 'Physics (Paper 1 - Theory)',
    paperNumber: 1,
    year: 2023,
    totalMarks: 80,
    timeAllowed: '2 Hours 15 Minutes',
    instructions: 'Answer all questions in Section A and any four questions from Section B. Mathematical tables and silent non-programmable calculators may be used.',
    questions: [
      {
        id: 'uneb-phy-2023-q1',
        questionNumber: 1,
        topic: 'Mechanics - Linear Momentum & Newton\'s Laws',
        marks: 8,
        prompt: `(a) State the Principle of Conservation of Linear Momentum. [2 marks]
(b) A trolley of mass 2.5 kg travelling at 4.0 m/s collides with a stationary trolley of mass 1.5 kg. After the collision, the two trolleys stick together and move in the same direction.
  (i) Calculate their common velocity after collision. [4 marks]
  (ii) Determine the loss in kinetic energy during the collision. [2 marks]`,
        rubric: [
          { markType: 'B1', description: 'Total linear momentum in a closed system remains constant / conserved', marksAwarded: 1 },
          { markType: 'B1', description: 'Provided no external net force acts on the system', marksAwarded: 1 },
          { markType: 'M1', description: 'Application of m1*u1 + m2*u2 = (m1 + m2)*v', marksAwarded: 1 },
          { markType: 'M1', description: 'Correct substitution: (2.5 * 4.0) + (1.5 * 0) = (2.5 + 1.5) * v', marksAwarded: 1 },
          { markType: 'A1', description: 'Correct value: 10 = 4.0 * v => v = 2.5', marksAwarded: 1 },
          { markType: 'A1', description: 'Correct SI units: m/s (or m s⁻¹)', marksAwarded: 1 },
          { markType: 'M1', description: 'KE calculation: Initial KE = 0.5*2.5*16 = 20 J; Final KE = 0.5*4.0*6.25 = 12.5 J', marksAwarded: 1 },
          { markType: 'A1', description: 'Loss = 20 - 12.5 = 7.5 Joules (J)', marksAwarded: 1 }
        ],
        commonPitfalls: [
          'Forgetting the condition "provided no external resultant force acts on the system"',
          'Calculating kinetic energy using momentum formula or forgetting the 1/2 in 0.5*m*v^2',
          'Omitting units (m/s or J) in the final answer'
        ],
        socraticHints: [
          'What happens to momentum before and after a collision when there are no outside forces?',
          'How can you write the total mass of the combined object once they stick together?',
          'Recall the formula for kinetic energy of a moving body: KE = 1/2 * m * v²'
        ],
        modelSolution: `(a) The principle of conservation of linear momentum states that for a collision occurring between two or more bodies in an isolated system, the total linear momentum before collision equals the total linear momentum after collision, provided no external resultant force acts on the system.

(b) (i) By conservation of momentum:
Total Momentum before = Total Momentum after
m₁u₁ + m₂u₂ = (m₁ + m₂)v
(2.5 kg × 4.0 m/s) + (1.5 kg × 0 m/s) = (2.5 kg + 1.5 kg) × v
10.0 kg·m/s = 4.0 kg × v
v = 10.0 / 4.0 = 2.5 m/s

(ii) Initial Kinetic Energy = ½ m₁u₁² + ½ m₂u₂²
= ½ (2.5)(4.0)² + 0 = ½(2.5)(16) = 20.0 J
Final Kinetic Energy = ½ (m₁ + m₂)v²
= ½ (4.0)(2.5)² = 2.0 × 6.25 = 12.5 J
Loss in Kinetic Energy = 20.0 J - 12.5 J = 7.5 J`
      },
      {
        id: 'uneb-phy-2023-q2',
        questionNumber: 2,
        topic: 'Electricity & Magnetism - Ohm\'s Law & Internal Resistance',
        marks: 7,
        prompt: `(a) Define electromotive force (e.m.f) of a cell. [2 marks]
(b) A battery of e.m.f 12 V and internal resistance r is connected in series with a 5.0 Ω resistor. A voltmeter connected across the 5.0 Ω resistor reads 10.0 V.
  (i) Find the current flowing through the circuit. [2 marks]
  (ii) Calculate the internal resistance r of the battery. [3 marks]`,
        rubric: [
          { markType: 'B1', description: 'Total work done / energy converted per unit charge', marksAwarded: 1 },
          { markType: 'B1', description: 'In driving charge completely around a complete circuit (or from negative to positive terminal inside source)', marksAwarded: 1 },
          { markType: 'M1', description: 'Using I = V / R with terminal potential difference across external resistor', marksAwarded: 1 },
          { markType: 'A1', description: 'I = 10.0 / 5.0 = 2.0 A (amperes)', marksAwarded: 1 },
          { markType: 'M1', description: 'Using E = V + Ir or E = I(R + r)', marksAwarded: 1 },
          { markType: 'M1', description: 'Substitution: 12 = 10 + 2r => 2r = 2', marksAwarded: 1 },
          { markType: 'A1', description: 'r = 1.0 Ω (ohms)', marksAwarded: 1 }
        ],
        commonPitfalls: [
          'Confusing e.m.f with terminal potential difference or defining it merely as "voltage"',
          'Using e.m.f (12 V) instead of terminal voltage (10 V) when calculating the current through the 5 Ω resistor',
          'Forgetting the ohm symbol (Ω)'
        ],
        socraticHints: [
          'What is the difference between total chemical energy supplied per coulomb versus the voltage delivered externally?',
          'What is the voltage drop across the 5 ohm resistor alone according to the voltmeter?',
          'Where did the remaining 2 volts (12V - 10V) go?'
        ],
        modelSolution: `(a) Electromotive force (e.m.f) is the total electrical energy transferred per unit charge (coulomb) in driving charge round a complete circuit.

(b) (i) Current I through the external resistor:
I = V / R = 10.0 V / 5.0 Ω = 2.0 A

(ii) Using the relation E = V + I·r (where lost volts = I·r):
12 V = 10.0 V + (2.0 A) · r
2.0 · r = 12 - 10 = 2.0 V
r = 2.0 / 2.0 = 1.0 Ω`
      }
    ]
  },
  {
    id: 'uneb-uce-math-2023-p1',
    examBody: 'UNEB_UCE',
    examBodyName: 'UNEB (Uganda National Examinations Board)',
    country: 'UG',
    level: 'O-Level',
    subjectCode: '456/1',
    subjectName: 'Mathematics (Paper 1)',
    paperNumber: 1,
    year: 2023,
    totalMarks: 100,
    timeAllowed: '2 Hours 30 Minutes',
    instructions: 'Section A contains 10 short answer questions (40 marks). Section B contains 5 structured questions (60 marks). Answer all questions in Section A and any four in Section B.',
    questions: [
      {
        id: 'uneb-math-2023-q1',
        questionNumber: 1,
        topic: 'Algebra - Quadratic Equations & Factorization',
        marks: 4,
        prompt: `Solve the quadratic equation: 2x² - 5x - 3 = 0. Show all steps of factorization or quadratic formula clearly. [4 marks]`,
        rubric: [
          { markType: 'M1', description: 'Identifies product ac = -6 and sum b = -5 (factors -6 and +1)', marksAwarded: 1 },
          { markType: 'M1', description: 'Splits middle term: 2x² - 6x + x - 3 = 0 => 2x(x - 3) + 1(x - 3) = 0', marksAwarded: 1 },
          { markType: 'M1', description: 'Factorized form: (2x + 1)(x - 3) = 0', marksAwarded: 1 },
          { markType: 'A1', description: 'Final roots: x = -1/2 or x = 3 (both correct)', marksAwarded: 1 }
        ],
        commonPitfalls: [
          'Sign errors when splitting -5x (writing +6x - 1x instead of -6x + 1x)',
          'Omitting the negative sign on x = -1/2'
        ],
        socraticHints: [
          'What two numbers multiply to (2 * -3 = -6) and add up to -5?',
          'Group the terms into two pairs to extract the common binomial factor.'
        ],
        modelSolution: `2x² - 5x - 3 = 0
Product = 2 × (-3) = -6
Sum = -5
Factors: -6 and 1

2x² - 6x + x - 3 = 0
2x(x - 3) + 1(x - 3) = 0
(2x + 1)(x - 3) = 0

Either 2x + 1 = 0  =>  x = -½
Or x - 3 = 0       =>  x = 3

Hence, x = -½ or x = 3.`
      },
      {
        id: 'uneb-math-2023-q2',
        questionNumber: 2,
        topic: 'Matrices & Transformations',
        marks: 6,
        prompt: `Given matrix M = [[3, 2], [1, 4]]:
(a) Calculate the determinant of matrix M. [2 marks]
(b) Hence, find the inverse matrix M⁻¹. [4 marks]`,
        rubric: [
          { markType: 'M1', description: 'Formula det(M) = (a*d) - (b*c) = (3*4) - (2*1)', marksAwarded: 1 },
          { markType: 'A1', description: 'det(M) = 12 - 2 = 10', marksAwarded: 1 },
          { markType: 'M1', description: 'Swaps leading diagonal elements and negates off-diagonal elements: [[4, -2], [-1, 3]]', marksAwarded: 2 },
          { markType: 'A1', description: 'M⁻¹ = (1/10) * [[4, -2], [-1, 3]] or [[0.4, -0.2], [-0.1, 0.3]]', marksAwarded: 1 }
        ],
        commonPitfalls: [
          'Subtracting in reverse order (e.g. 2*1 - 3*4 = -10)',
          'Negating diagonal instead of off-diagonal elements'
        ],
        socraticHints: [
          'How is the determinant of a 2x2 matrix [[a, b], [c, d]] calculated?',
          'What happens to the main diagonal versus the other diagonal when finding the adjoint?'
        ],
        modelSolution: `(a) Determinant:
det(M) = (3 × 4) - (2 × 1) = 12 - 2 = 10

(b) Adjoint of M:
Adj(M) = [[4, -2], [-1, 3]]

Inverse M⁻¹:
M⁻¹ = (1 / det(M)) × Adj(M)
= 1/10 × [[4, -2], [-1, 3]]
= [[0.4, -0.2], [-0.1, 0.3]]`
      }
    ]
  },

  // ─── KNEC KCSE (Kenya National Examinations Council) ──────────────────────
  {
    id: 'knec-kcse-math-2023-p1',
    examBody: 'KNEC_KCSE',
    examBodyName: 'KNEC (Kenya National Examinations Council)',
    country: 'KE',
    level: 'High School',
    subjectCode: '121/1',
    subjectName: 'Mathematics Alt A (Paper 1)',
    paperNumber: 1,
    year: 2023,
    totalMarks: 100,
    timeAllowed: '2 Hours 30 Minutes',
    instructions: 'Write your answers in the spaces provided. Show all the steps in your calculations, giving your answers at each stage in the spaces provided below each question.',
    questions: [
      {
        id: 'knec-math-2023-q1',
        questionNumber: 1,
        topic: 'Linear Programming & Inequalities',
        marks: 5,
        prompt: `Find the integral values of x that satisfy the simultaneous inequalities:
3 - 2x < 5  and  x + 4 ≤ 2x + 9. [5 marks]`,
        rubric: [
          { markType: 'M1', description: 'Solving 3 - 2x < 5: -2x < 2', marksAwarded: 1 },
          { markType: 'A1', description: 'Reverses inequality when dividing by negative: x > -1', marksAwarded: 1 },
          { markType: 'M1', description: 'Solving x + 4 <= 2x + 9: 4 - 9 <= 2x - x => -5 <= x (or x >= -5)', marksAwarded: 1 },
          { markType: 'M1', description: 'Combining inequalities: -1 < x (since x >= -5 is broader, range is x > -1 or bounded region)', marksAwarded: 1 },
          { markType: 'A1', description: 'Integral solutions listed clearly', marksAwarded: 1 }
        ],
        commonPitfalls: [
          'Forgetting to reverse the inequality sign when dividing by -2',
          'Omitting integral specification (listing continuous interval instead of integers)'
        ],
        socraticHints: [
          'What rule applies when dividing both sides of an inequality by a negative number?',
          'What values of x make BOTH inequalities true at the same time?'
        ],
        modelSolution: `First inequality:
3 - 2x < 5
-2x < 5 - 3
-2x < 2
Dividing by -2 (reverses inequality sign):
x > -1

Second inequality:
x + 4 ≤ 2x + 9
4 - 9 ≤ 2x - x
-5 ≤ x  or  x ≥ -5

Intersection of x > -1 and x ≥ -5:
Since -1 > -5, the intersecting solution set is x > -1.
If bounded by an upper limit in the problem context, state the integers; otherwise:
Integers: x ∈ {0, 1, 2, 3, ...}`
      },
      {
        id: 'knec-phy-2023-q2',
        questionNumber: 2,
        topic: 'Thermal Physics - Specific Heat Capacity',
        marks: 6,
        prompt: `A copper calorimeter of mass 120 g contains 80 g of water at 20 °C. A piece of metal of mass 100 g at 100 °C is transferred into the calorimeter. The mixture attains a steady temperature of 28 °C.
Given:
- Specific heat capacity of water = 4,200 J/kg·K
- Specific heat capacity of copper = 400 J/kg·K
Calculate the specific heat capacity of the metal piece, neglecting heat loss to the surroundings. [6 marks]`,
        rubric: [
          { markType: 'B1', description: 'Heat gained by calorimeter and water = Heat lost by metal piece', marksAwarded: 1 },
          { markType: 'M1', description: 'Heat gained: (0.12 * 400 * 8) + (0.08 * 4200 * 8)', marksAwarded: 2 },
          { markType: 'M1', description: 'Heat lost: 0.10 * c_metal * (100 - 28) = 0.10 * c_metal * 72', marksAwarded: 1 },
          { markType: 'M1', description: 'Equating and solving: 384 + 2688 = 3072 J = 7.2 * c_metal', marksAwarded: 1 },
          { markType: 'A1', description: 'c_metal = 3072 / 7.2 = 426.7 J/kg·K (or J/kg·°C)', marksAwarded: 1 }
        ],
        commonPitfalls: [
          'Forgetting to convert grams to kilograms (dividing by 1000)',
          'Omitting the copper calorimeter from heat absorbed',
          'Incorrect temperature changes: (28 - 20 = 8) and (100 - 28 = 72)'
        ],
        socraticHints: [
          'Which substances are gaining heat, and which substance is losing heat?',
          'Make sure all masses are converted to standard SI units (kg).',
          'What is the temperature change for the calorimeter and water versus the metal piece?'
        ],
        modelSolution: `Temperature rise for calorimeter & water Δθ₁ = 28 - 20 = 8 °C (or 8 K)
Temperature drop for metal piece Δθ₂ = 100 - 28 = 72 °C (or 72 K)

Masses in kg:
Calorimeter m_c = 0.12 kg
Water m_w = 0.08 kg
Metal m_m = 0.10 kg

Heat gained by calorimeter = 0.12 × 400 × 8 = 384 J
Heat gained by water = 0.08 × 4,200 × 8 = 2,688 J
Total Heat Gained = 384 + 2,688 = 3,072 J

Heat lost by metal = m_m × c_m × Δθ₂ = 0.10 × c_m × 72 = 7.2 c_m

Equating Heat Lost = Heat Gained:
7.2 c_m = 3,072
c_m = 3,072 / 7.2 = 426.67 J/kg·K (or 427 J/kg·K)`
      }
    ]
  },

  // ─── WAEC WASSCE (West African Senior School Certificate Examination) ─────
  {
    id: 'waec-wassce-chem-2023-p1',
    examBody: 'WAEC_WASSCE',
    examBodyName: 'WAEC (West African Examinations Council)',
    country: 'NG',
    level: 'Secondary',
    subjectCode: 'SC5052',
    subjectName: 'Chemistry (Paper 2 - Theory)',
    paperNumber: 2,
    year: 2023,
    totalMarks: 100,
    timeAllowed: '2 Hours',
    instructions: 'Answer all questions in Section A and four questions from Section B.',
    questions: [
      {
        id: 'waec-chem-2023-q1',
        questionNumber: 1,
        topic: 'Stoichiometry & Mole Concept',
        marks: 6,
        prompt: `(a) Define the term empirical formula. [2 marks]
(b) An organic compound containing carbon, hydrogen, and oxygen only was found to contain 52.2% carbon and 13.0% hydrogen by mass.
  (i) Determine the percentage of oxygen in the compound. [1 mark]
  (ii) Calculate the empirical formula of the compound. [Relative atomic masses: C = 12.0, H = 1.0, O = 16.0] [3 marks]`,
        rubric: [
          { markType: 'B1', description: 'Simplest whole number ratio of atoms of the different elements present in one molecule of the compound', marksAwarded: 2 },
          { markType: 'B1', description: '% Oxygen = 100 - (52.2 + 13.0) = 34.8%', marksAwarded: 1 },
          { markType: 'M1', description: 'Moles calculation: C = 52.2/12 = 4.35; H = 13.0/1 = 13.0; O = 34.8/16 = 2.175', marksAwarded: 1 },
          { markType: 'M1', description: 'Dividing by smallest: C = 4.35/2.175 = 2.0; H = 13.0/2.175 = 5.98 ≈ 6.0; O = 2.175/2.175 = 1.0', marksAwarded: 1 },
          { markType: 'A1', description: 'Empirical formula is C2H6O', marksAwarded: 1 }
        ],
        commonPitfalls: [
          'Confusing empirical formula with molecular formula',
          'Rounding moles before dividing by the smallest value',
          'Forgetting that the sum of percentages must equal 100%'
        ],
        socraticHints: [
          'What must the sum of all percentages in a pure compound add up to?',
          'How do you convert mass percentages to relative numbers of moles?',
          'What is the next step to turn those mole ratios into the smallest whole numbers?'
        ],
        modelSolution: `(a) The empirical formula is the simplest whole number ratio of the atoms of each element present in a compound.

(b) (i) Percentage of oxygen:
% O = 100.0% - (52.2% + 13.0%) = 100.0% - 65.2% = 34.8%

(ii) Calculate moles of each element per 100 g:
Moles of C = 52.2 / 12.0 = 4.35 mol
Moles of H = 13.0 / 1.0 = 13.0 mol
Moles of O = 34.8 / 16.0 = 2.175 mol

Divide each by the smallest value (2.175):
C = 4.35 / 2.175 = 2.00
H = 13.0 / 2.175 = 5.98 ≈ 6.00
O = 2.175 / 2.175 = 1.00

Empirical formula = C₂H₆O (ethanol / dimethyl ether)`
      }
    ]
  },

  // ─── Cambridge Assessment International Education ────────────────────────
  {
    id: 'cambridge-alevel-math-9709-p1',
    examBody: 'CAMBRIDGE_ALEVEL',
    examBodyName: 'Cambridge Assessment International Education',
    country: 'UK',
    level: 'A-Level',
    subjectCode: '9709/12',
    subjectName: 'Pure Mathematics 1',
    paperNumber: 1,
    year: 2023,
    totalMarks: 75,
    timeAllowed: '1 Hour 50 Minutes',
    instructions: 'Answer all questions. You must show all necessary working to gain full marks. Give non-exact numerical answers correct to 3 significant figures, or 1 decimal place for angles in degrees, unless a different degree of accuracy is specified in the question.',
    questions: [
      {
        id: 'cambridge-math-2023-q1',
        topic: 'Calculus - Differentiation & Tangent Equations',
        questionNumber: 1,
        marks: 5,
        prompt: `The equation of a curve is y = 3x² - 4x + 5.
(a) Find dy/dx. [2 marks]
(b) Find the equation of the tangent to the curve at the point where x = 2. Give your answer in the form y = mx + c. [3 marks]`,
        rubric: [
          { markType: 'M1', description: 'Differentiating power of x terms: 3*(2x) - 4', marksAwarded: 1 },
          { markType: 'A1', description: 'dy/dx = 6x - 4', marksAwarded: 1 },
          { markType: 'M1', description: 'Gradient at x = 2: m = 6(2) - 4 = 8; and y-coordinate: y = 3(4) - 4(2) + 5 = 9', marksAwarded: 1 },
          { markType: 'M1', description: 'Using y - y1 = m(x - x1): y - 9 = 8(x - 2)', marksAwarded: 1 },
          { markType: 'A1', description: 'y = 8x - 7', marksAwarded: 1 }
        ],
        commonPitfalls: [
          'Calculating normal instead of tangent gradient (-1/m)',
          'Errors when calculating y coordinate at x = 2',
          'Not simplifying to y = mx + c form'
        ],
        socraticHints: [
          'What rule allows you to differentiate terms of the form a*x^n?',
          'How do you find the slope m of the tangent line from the derivative?',
          'Remember you need both the x and y coordinates of the point on the curve.'
        ],
        modelSolution: `(a) y = 3x² - 4x + 5
dy/dx = 6x - 4

(b) When x = 2:
y = 3(2)² - 4(2) + 5 = 3(4) - 8 + 5 = 12 - 8 + 5 = 9
Point is (2, 9).

Gradient of tangent m = 6(2) - 4 = 12 - 4 = 8.

Equation of tangent:
y - y₁ = m(x - x₁)
y - 9 = 8(x - 2)
y - 9 = 8x - 16
y = 8x - 7`
      }
    ]
  }
];

export function getPastPapers(examBody?: string, subject?: string): PastPaper[] {
  return PAST_PAPERS.filter(p => {
    if (examBody && p.examBody !== examBody) return false;
    if (subject && !p.subjectName.toLowerCase().includes(subject.toLowerCase())) return false;
    return true;
  });
}

export function getPastPaperById(id: string): PastPaper | undefined {
  return PAST_PAPERS.find(p => p.id === id);
}

export function getQuestionById(paperId: string, questionId: string): PastPaperQuestion | undefined {
  const paper = getPastPaperById(paperId);
  return paper?.questions.find(q => q.id === questionId);
}
