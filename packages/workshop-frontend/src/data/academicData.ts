import type { Icon } from '@phosphor-icons/react';
import {
  Code,
  Scales,
  TrendUp,
  Stethoscope,
  BookOpen,
  Buildings,
  Cpu,
} from '@phosphor-icons/react';

export interface University {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  code: string;
  region: string;
  domains: string[];
  city: string;
  acronyms?: string[];
  website?: string;
}

export interface DefaultCourse {
  code: string;
  name: string;
  instructor: string;
  color: string;
  selected: boolean;
}

export interface Persona {
  id: string;
  title: string;
  subtitle: string;
  icon: Icon;
  color: string;
  bgColor: string;
  borderColor: string;
  citation: string;
  defaultDegrees: string[];
  defaultCourses: DefaultCourse[];
  focusFeatures: string[];
}

export interface AcademicLevel {
  id: string;
  label: string;
  years: string[];
}

export interface CitationStyle {
  id: string;
  label: string;
  desc: string;
}


export const UNIVERSITIES: University[] = [
  // ── Global Top Tier (North America, Europe, Asia-Pacific) ──
  {
    id: 'mit',
    name: 'Massachusetts Institute of Technology (MIT)',
    country: 'United States',
    countryCode: 'US',
    code: 'MIT',
    region: 'Global',
    domains: ['mit.edu'],
    city: 'Cambridge, MA',
    acronyms: ['MIT']
  },
  {
    id: 'stanford',
    name: 'Stanford University',
    country: 'United States',
    countryCode: 'US',
    code: 'Stanford',
    region: 'Global',
    domains: ['stanford.edu'],
    city: 'Stanford, CA',
    acronyms: ['Stanford']
  },
  {
    id: 'harvard',
    name: 'Harvard University',
    country: 'United States',
    countryCode: 'US',
    code: 'Harvard',
    region: 'Global',
    domains: ['harvard.edu'],
    city: 'Cambridge, MA',
    acronyms: ['Harvard']
  },
  {
    id: 'oxford',
    name: 'University of Oxford',
    country: 'United Kingdom',
    countryCode: 'GB',
    code: 'Oxford',
    region: 'Global',
    domains: ['ox.ac.uk'],
    city: 'Oxford',
    acronyms: ['Oxford', 'Oxon']
  },
  {
    id: 'cambridge',
    name: 'University of Cambridge',
    country: 'United Kingdom',
    countryCode: 'GB',
    code: 'Cambridge',
    region: 'Global',
    domains: ['cam.ac.uk'],
    city: 'Cambridge',
    acronyms: ['Cambridge', 'Cantab']
  },
  {
    id: 'berkeley',
    name: 'University of California, Berkeley (UC Berkeley)',
    country: 'United States',
    countryCode: 'US',
    code: 'UC Berkeley',
    region: 'Global',
    domains: ['berkeley.edu'],
    city: 'Berkeley, CA',
    acronyms: ['UCB', 'Cal', 'Berkeley']
  },
  {
    id: 'imperial',
    name: 'Imperial College London',
    country: 'United Kingdom',
    countryCode: 'GB',
    code: 'Imperial',
    region: 'Global',
    domains: ['imperial.ac.uk'],
    city: 'London',
    acronyms: ['Imperial', 'ICL']
  },
  {
    id: 'toronto',
    name: 'University of Toronto',
    country: 'Canada',
    countryCode: 'CA',
    code: 'UofT',
    region: 'Global',
    domains: ['utoronto.ca'],
    city: 'Toronto',
    acronyms: ['UofT', 'UToronto']
  },
  {
    id: 'eth_zurich',
    name: 'ETH Zürich (Swiss Federal Institute of Technology)',
    country: 'Switzerland',
    countryCode: 'CH',
    code: 'ETH',
    region: 'Global',
    domains: ['ethz.ch'],
    city: 'Zürich',
    acronyms: ['ETH', 'ETHZ']
  },
  {
    id: 'nus',
    name: 'National University of Singapore (NUS)',
    country: 'Singapore',
    countryCode: 'SG',
    code: 'NUS',
    region: 'Global',
    domains: ['nus.edu.sg'],
    city: 'Singapore',
    acronyms: ['NUS']
  },
  {
    id: 'columbia',
    name: 'Columbia University in the City of New York',
    country: 'United States',
    countryCode: 'US',
    code: 'Columbia',
    region: 'Global',
    domains: ['columbia.edu'],
    city: 'New York, NY',
    acronyms: ['Columbia']
  },
  {
    id: 'cmu',
    name: 'Carnegie Mellon University',
    country: 'United States',
    countryCode: 'US',
    code: 'CMU',
    region: 'Global',
    domains: ['cmu.edu'],
    city: 'Pittsburgh, PA',
    acronyms: ['CMU']
  },
  {
    id: 'ucla',
    name: 'University of California, Los Angeles (UCLA)',
    country: 'United States',
    countryCode: 'US',
    code: 'UCLA',
    region: 'Global',
    domains: ['ucla.edu'],
    city: 'Los Angeles, CA',
    acronyms: ['UCLA']
  },
  {
    id: 'princeton',
    name: 'Princeton University',
    country: 'United States',
    countryCode: 'US',
    code: 'Princeton',
    region: 'Global',
    domains: ['princeton.edu'],
    city: 'Princeton, NJ',
    acronyms: ['Princeton']
  },
  {
    id: 'yale',
    name: 'Yale University',
    country: 'United States',
    countryCode: 'US',
    code: 'Yale',
    region: 'Global',
    domains: ['yale.edu'],
    city: 'New Haven, CT',
    acronyms: ['Yale']
  },
  {
    id: 'nyu',
    name: 'New York University (NYU)',
    country: 'United States',
    countryCode: 'US',
    code: 'NYU',
    region: 'Global',
    domains: ['nyu.edu'],
    city: 'New York, NY',
    acronyms: ['NYU']
  },
  {
    id: 'waterloo',
    name: 'University of Waterloo',
    country: 'Canada',
    countryCode: 'CA',
    code: 'UWaterloo',
    region: 'Global',
    domains: ['uwaterloo.ca'],
    city: 'Waterloo',
    acronyms: ['UW', 'UWaterloo']
  },
  {
    id: 'melbourne',
    name: 'University of Melbourne',
    country: 'Australia',
    countryCode: 'AU',
    code: 'UniMelb',
    region: 'Global',
    domains: ['unimelb.edu.au'],
    city: 'Melbourne',
    acronyms: ['UniMelb']
  },
  {
    id: 'tsinghua',
    name: 'Tsinghua University',
    country: 'China',
    countryCode: 'CN',
    code: 'THU',
    region: 'Global',
    domains: ['tsinghua.edu.cn'],
    city: 'Beijing',
    acronyms: ['THU']
  },
  {
    id: 'pku',
    name: 'Peking University',
    country: 'China',
    countryCode: 'CN',
    code: 'PKU',
    region: 'Global',
    domains: ['pku.edu.cn'],
    city: 'Beijing',
    acronyms: ['PKU']
  },
  {
    id: 'edinburgh',
    name: 'University of Edinburgh',
    country: 'United Kingdom',
    countryCode: 'GB',
    code: 'Edinburgh',
    region: 'Global',
    domains: ['ed.ac.uk'],
    city: 'Edinburgh',
    acronyms: ['Edinburgh']
  },
  {
    id: 'ucl',
    name: 'University College London (UCL)',
    country: 'United Kingdom',
    countryCode: 'GB',
    code: 'UCL',
    region: 'Global',
    domains: ['ucl.ac.uk'],
    city: 'London',
    acronyms: ['UCL']
  },
  {
    id: 'lse',
    name: 'London School of Economics and Political Science (LSE)',
    country: 'United Kingdom',
    countryCode: 'GB',
    code: 'LSE',
    region: 'Global',
    domains: ['lse.ac.uk'],
    city: 'London',
    acronyms: ['LSE']
  },
  {
    id: 'cornell',
    name: 'Cornell University',
    country: 'United States',
    countryCode: 'US',
    code: 'Cornell',
    region: 'Global',
    domains: ['cornell.edu'],
    city: 'Ithaca, NY',
    acronyms: ['Cornell']
  },
  {
    id: 'caltech',
    name: 'California Institute of Technology (Caltech)',
    country: 'United States',
    countryCode: 'US',
    code: 'Caltech',
    region: 'Global',
    domains: ['caltech.edu'],
    city: 'Pasadena, CA',
    acronyms: ['Caltech']
  },
  {
    id: 'upenn',
    name: 'University of Pennsylvania (Penn)',
    country: 'United States',
    countryCode: 'US',
    code: 'UPenn',
    region: 'Global',
    domains: ['upenn.edu'],
    city: 'Philadelphia, PA',
    acronyms: ['UPenn', 'Penn']
  },
  {
    id: 'brown',
    name: 'Brown University',
    country: 'United States',
    countryCode: 'US',
    code: 'Brown',
    region: 'Global',
    domains: ['brown.edu'],
    city: 'Providence, RI',
    acronyms: ['Brown']
  },
  {
    id: 'dartmouth',
    name: 'Dartmouth College',
    country: 'United States',
    countryCode: 'US',
    code: 'Dartmouth',
    region: 'Global',
    domains: ['dartmouth.edu'],
    city: 'Hanover, NH',
    acronyms: ['Dartmouth']
  },
  {
    id: 'northwestern',
    name: 'Northwestern University',
    country: 'United States',
    countryCode: 'US',
    code: 'Northwestern',
    region: 'Global',
    domains: ['northwestern.edu'],
    city: 'Evanston, IL',
    acronyms: ['NU']
  },
  {
    id: 'uchicago',
    name: 'University of Chicago',
    country: 'United States',
    countryCode: 'US',
    code: 'UChicago',
    region: 'Global',
    domains: ['uchicago.edu'],
    city: 'Chicago, IL',
    acronyms: ['UChicago', 'UC']
  },
  {
    id: 'jhu',
    name: 'Johns Hopkins University',
    country: 'United States',
    countryCode: 'US',
    code: 'JHU',
    region: 'Global',
    domains: ['jhu.edu'],
    city: 'Baltimore, MD',
    acronyms: ['JHU']
  },
  {
    id: 'umich',
    name: 'University of Michigan (Ann Arbor)',
    country: 'United States',
    countryCode: 'US',
    code: 'UMich',
    region: 'Global',
    domains: ['umich.edu'],
    city: 'Ann Arbor, MI',
    acronyms: ['UMich']
  },
  {
    id: 'ubc',
    name: 'University of British Columbia',
    country: 'Canada',
    countryCode: 'CA',
    code: 'UBC',
    region: 'Global',
    domains: ['ubc.ca'],
    city: 'Vancouver',
    acronyms: ['UBC']
  },
  {
    id: 'mcgill',
    name: 'McGill University',
    country: 'Canada',
    countryCode: 'CA',
    code: 'McGill',
    region: 'Global',
    domains: ['mcgill.ca'],
    city: 'Montreal',
    acronyms: ['McGill']
  },
  {
    id: 'sydney',
    name: 'University of Sydney',
    country: 'Australia',
    countryCode: 'AU',
    code: 'USYD',
    region: 'Global',
    domains: ['sydney.edu.au'],
    city: 'Sydney',
    acronyms: ['USYD']
  },
  {
    id: 'anu',
    name: 'Australian National University (ANU)',
    country: 'Australia',
    countryCode: 'AU',
    code: 'ANU',
    region: 'Global',
    domains: ['anu.edu.au'],
    city: 'Canberra',
    acronyms: ['ANU']
  },
  {
    id: 'utokyo',
    name: 'University of Tokyo',
    country: 'Japan',
    countryCode: 'JP',
    code: 'UTokyo',
    region: 'Global',
    domains: ['u-tokyo.ac.jp'],
    city: 'Tokyo',
    acronyms: ['Todai', 'UTokyo']
  },
  {
    id: 'tum',
    name: 'Technical University of Munich (TUM)',
    country: 'Germany',
    countryCode: 'DE',
    code: 'TUM',
    region: 'Global',
    domains: ['tum.de'],
    city: 'Munich',
    acronyms: ['TUM']
  },
  {
    id: 'epfl',
    name: 'École Polytechnique Fédérale de Lausanne (EPFL)',
    country: 'Switzerland',
    countryCode: 'CH',
    code: 'EPFL',
    region: 'Global',
    domains: ['epfl.ch'],
    city: 'Lausanne',
    acronyms: ['EPFL']
  },

  // ── East & Central Africa (Kenya, Uganda, Tanzania, Rwanda, Ethiopia) ──
  // Kenya - Public & Technical Universities
  {
    id: 'uon',
    name: 'University of Nairobi',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'UoN',
    region: 'East Africa',
    domains: ['uonbi.ac.ke'],
    city: 'Nairobi',
    acronyms: ['UoN', 'UON']
  },
  {
    id: 'kenyatta',
    name: 'Kenyatta University',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'KU',
    region: 'East Africa',
    domains: ['ku.ac.ke'],
    city: 'Nairobi',
    acronyms: ['KU']
  },
  {
    id: 'jkuat',
    name: 'Jomo Kenyatta University of Agriculture & Technology (JKUAT)',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'JKUAT',
    region: 'East Africa',
    domains: ['jkuat.ac.ke'],
    city: 'Juja, Nairobi',
    acronyms: ['JKUAT']
  },
  {
    id: 'tuk',
    name: 'Technical University of Kenya (TUK)',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'TUK',
    region: 'East Africa',
    domains: ['tukenya.ac.ke'],
    city: 'Nairobi',
    acronyms: ['TUK', 'Kenya Poly', 'TUK Kenya']
  },
  {
    id: 'tum_ke',
    name: 'Technical University of Mombasa (TUM)',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'TUM',
    region: 'East Africa',
    domains: ['tum.ac.ke'],
    city: 'Mombasa',
    acronyms: ['TUM', 'Mombasa Poly', 'TUM Kenya']
  },
  {
    id: 'dekut',
    name: 'Dedan Kimathi University of Technology (DeKUT)',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'DeKUT',
    region: 'East Africa',
    domains: ['dkut.ac.ke'],
    city: 'Nyeri',
    acronyms: ['DeKUT', 'DKUT', 'Kimathi']
  },
  {
    id: 'maseno',
    name: 'Maseno University',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'Maseno',
    region: 'East Africa',
    domains: ['maseno.ac.ke'],
    city: 'Maseno, Kisumu',
    acronyms: ['Maseno', 'MSU']
  },
  {
    id: 'mmust',
    name: 'Masinde Muliro University of Science and Technology (MMUST)',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'MMUST',
    region: 'East Africa',
    domains: ['mmust.ac.ke'],
    city: 'Kakamega',
    acronyms: ['MMUST']
  },
  {
    id: 'mmu',
    name: 'Multimedia University of Kenya (MMU)',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'MMU',
    region: 'East Africa',
    domains: ['mmu.ac.ke'],
    city: 'Nairobi',
    acronyms: ['MMU']
  },
  {
    id: 'must_ke',
    name: 'Meru University of Science & Technology (MUST)',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'MUST',
    region: 'East Africa',
    domains: ['must.ac.ke'],
    city: 'Meru',
    acronyms: ['MUST', 'MUST Kenya']
  },
  {
    id: 'uoeld',
    name: 'University of Eldoret (UoE)',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'UoE',
    region: 'East Africa',
    domains: ['uoeld.ac.ke'],
    city: 'Eldoret',
    acronyms: ['UoE', 'Chepkoilel']
  },
  {
    id: 'moi',
    name: 'Moi University',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'Moi',
    region: 'East Africa',
    domains: ['mu.ac.ke'],
    city: 'Eldoret',
    acronyms: ['MU', 'Moi']
  },
  {
    id: 'egerton',
    name: 'Egerton University',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'Egerton',
    region: 'East Africa',
    domains: ['egerton.ac.ke'],
    city: 'Njoro, Nakuru',
    acronyms: ['Egerton', 'EU']
  },
  {
    id: 'kisii',
    name: 'Kisii University',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'Kisii',
    region: 'East Africa',
    domains: ['kisiiuniversity.ac.ke'],
    city: 'Kisii',
    acronyms: ['Kisii', 'KSU']
  },
  {
    id: 'chuka',
    name: 'Chuka University',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'Chuka',
    region: 'East Africa',
    domains: ['chuka.ac.ke'],
    city: 'Chuka',
    acronyms: ['Chuka', 'CU']
  },
  {
    id: 'pwani',
    name: 'Pwani University',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'PU',
    region: 'East Africa',
    domains: ['pu.ac.ke'],
    city: 'Kilifi',
    acronyms: ['PU', 'Pwani']
  },
  {
    id: 'machakos',
    name: 'Machakos University',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'MksU',
    region: 'East Africa',
    domains: ['mksu.ac.ke'],
    city: 'Machakos',
    acronyms: ['MksU', 'Machakos']
  },
  {
    id: 'seku',
    name: 'South Eastern Kenya University (SEKU)',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'SEKU',
    region: 'East Africa',
    domains: ['seku.ac.ke'],
    city: 'Kitui',
    acronyms: ['SEKU']
  },
  {
    id: 'karatina',
    name: 'Karatina University',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'KarU',
    region: 'East Africa',
    domains: ['karu.ac.ke'],
    city: 'Karatina, Nyeri',
    acronyms: ['KarU', 'Karatina']
  },
  {
    id: 'cuk',
    name: 'The Co-operative University of Kenya (CUK)',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'CUK',
    region: 'East Africa',
    domains: ['cuk.ac.ke'],
    city: 'Nairobi, Karen',
    acronyms: ['CUK']
  },
  {
    id: 'kirinyaga',
    name: 'Kirinyaga University',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'KyU',
    region: 'East Africa',
    domains: ['kyu.ac.ke'],
    city: 'Kerugoya',
    acronyms: ['KyU', 'Kirinyaga']
  },
  {
    id: 'kibabii',
    name: 'Kibabii University',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'KIBU',
    region: 'East Africa',
    domains: ['kibu.ac.ke'],
    city: 'Bungoma',
    acronyms: ['KIBU', 'Kibabii']
  },
  {
    id: 'embu',
    name: 'University of Embu',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'UoEm',
    region: 'East Africa',
    domains: ['embuni.ac.ke'],
    city: 'Embu',
    acronyms: ['UoEm', 'Embu']
  },
  {
    id: 'rongo',
    name: 'Rongo University',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'RU',
    region: 'East Africa',
    domains: ['rongovarsity.ac.ke'],
    city: 'Rongo, Migori',
    acronyms: ['RU', 'Rongo']
  },
  {
    id: 'laikipia',
    name: 'Laikipia University',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'LU',
    region: 'East Africa',
    domains: ['laikipia.ac.ke'],
    city: 'Nyahururu',
    acronyms: ['LU', 'Laikipia']
  },
  {
    id: 'mmarau',
    name: 'Maasai Mara University',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'MMARAU',
    region: 'East Africa',
    domains: ['mmarau.ac.ke'],
    city: 'Narok',
    acronyms: ['MMARAU', 'Maasai Mara']
  },
  {
    id: 'ttu',
    name: 'Taita Taveta University (TTU)',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'TTU',
    region: 'East Africa',
    domains: ['ttu.ac.ke'],
    city: 'Voi',
    acronyms: ['TTU']
  },
  {
    id: 'tmu',
    name: 'Tom Mboya University',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'TMU',
    region: 'East Africa',
    domains: ['tmu.ac.ke'],
    city: 'Homa Bay',
    acronyms: ['TMU', 'Tom Mboya']
  },
  {
    id: 'alupe',
    name: 'Alupe University',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'AU',
    region: 'East Africa',
    domains: ['au.ac.ke'],
    city: 'Busia',
    acronyms: ['AU', 'Alupe']
  },
  {
    id: 'kafu',
    name: 'Kaimosi Friends University (KAFU)',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'KAFU',
    region: 'East Africa',
    domains: ['kafu.ac.ke'],
    city: 'Kaimosi, Vihiga',
    acronyms: ['KAFU']
  },
  {
    id: 'tharaka',
    name: 'Tharaka University',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'TU',
    region: 'East Africa',
    domains: ['tharaka.ac.ke'],
    city: 'Tharaka Nithi',
    acronyms: ['TU', 'Tharaka']
  },
  {
    id: 'garissa',
    name: 'Garissa University',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'GaU',
    region: 'East Africa',
    domains: ['gau.ac.ke'],
    city: 'Garissa',
    acronyms: ['GaU', 'Garissa']
  },

  // Kenya - Chartered Private Universities & TVET Institutions
  {
    id: 'strathmore',
    name: 'Strathmore University',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'Strathmore',
    region: 'East Africa',
    domains: ['strathmore.edu'],
    city: 'Nairobi',
    acronyms: ['SU', 'Strathmore']
  },
  {
    id: 'usiu',
    name: 'United States International University Africa (USIU)',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'USIU',
    region: 'East Africa',
    domains: ['usiu.ac.ke'],
    city: 'Nairobi',
    acronyms: ['USIU', 'USIU-Africa']
  },
  {
    id: 'mku',
    name: 'Mount Kenya University (MKU)',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'MKU',
    region: 'East Africa',
    domains: ['mku.ac.ke'],
    city: 'Thika',
    acronyms: ['MKU']
  },
  {
    id: 'daystar',
    name: 'Daystar University',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'Daystar',
    region: 'East Africa',
    domains: ['daystar.ac.ke'],
    city: 'Nairobi',
    acronyms: ['Daystar']
  },
  {
    id: 'cuea',
    name: 'Catholic University of Eastern Africa (CUEA)',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'CUEA',
    region: 'East Africa',
    domains: ['cuea.edu'],
    city: 'Nairobi',
    acronyms: ['CUEA']
  },
  {
    id: 'kca',
    name: 'KCA University',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'KCA',
    region: 'East Africa',
    domains: ['kca.ac.ke'],
    city: 'Nairobi',
    acronyms: ['KCA', 'KCAU']
  },
  {
    id: 'kabarak',
    name: 'Kabarak University',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'Kabarak',
    region: 'East Africa',
    domains: ['kabarak.ac.ke'],
    city: 'Nakuru',
    acronyms: ['Kabarak', 'KABU']
  },
  {
    id: 'anu_ke',
    name: 'Africa Nazarene University (ANU)',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'ANU',
    region: 'East Africa',
    domains: ['anu.ac.ke'],
    city: 'Nairobi, Ongata Rongai',
    acronyms: ['ANU', 'Nazarene']
  },
  {
    id: 'zetech',
    name: 'Zetech University',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'Zetech',
    region: 'East Africa',
    domains: ['zetech.ac.ke'],
    city: 'Ruiru, Nairobi',
    acronyms: ['ZU', 'Zetech']
  },
  {
    id: 'riara',
    name: 'Riara University',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'Riara',
    region: 'East Africa',
    domains: ['riarauniversity.ac.ke'],
    city: 'Nairobi',
    acronyms: ['RU', 'Riara']
  },
  {
    id: 'kemu',
    name: 'Kenya Methodist University (KeMU)',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'KeMU',
    region: 'East Africa',
    domains: ['kemu.ac.ke'],
    city: 'Meru / Nairobi',
    acronyms: ['KeMU']
  },
  {
    id: 'pac',
    name: 'Pan Africa Christian University (PAC)',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'PAC',
    region: 'East Africa',
    domains: ['pacuniversity.ac.ke'],
    city: 'Nairobi, Roysambu',
    acronyms: ['PAC', 'PACU']
  },
  {
    id: 'spu',
    name: "St. Paul's University (SPU)",
    country: 'Kenya',
    countryCode: 'KE',
    code: 'SPU',
    region: 'East Africa',
    domains: ['spu.ac.ke'],
    city: 'Limuru / Nairobi',
    acronyms: ['SPU', "St Paul's"]
  },
  {
    id: 'gluk',
    name: 'Great Lakes University of Kisumu (GLUK)',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'GLUK',
    region: 'East Africa',
    domains: ['gluk.ac.ke'],
    city: 'Kisumu',
    acronyms: ['GLUK']
  },
  {
    id: 'kmtc',
    name: 'Kenya Medical Training College (KMTC)',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'KMTC',
    region: 'East Africa',
    domains: ['kmtc.ac.ke'],
    city: 'Nairobi & Nationwide',
    acronyms: ['KMTC']
  },
  {
    id: 'ntti',
    name: 'Nairobi Technical Training Institute (NTTI)',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'NTTI',
    region: 'East Africa',
    domains: ['nairobitti.ac.ke'],
    city: 'Nairobi',
    acronyms: ['NTTI']
  },
  {
    id: 'kabete_poly',
    name: 'The Kabete National Polytechnic',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'TKNP',
    region: 'East Africa',
    domains: ['kabetepoly.ac.ke'],
    city: 'Nairobi',
    acronyms: ['Kabete Poly', 'TKNP']
  },
  {
    id: 'kcnp',
    name: 'Kenya Coast National Polytechnic',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'KCNP',
    region: 'East Africa',
    domains: ['kenyacoastpoly.ac.ke'],
    city: 'Mombasa',
    acronyms: ['KCNP']
  },
  {
    id: 'eldoret_poly',
    name: 'The Eldoret National Polytechnic',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'TENP',
    region: 'East Africa',
    domains: ['eldoretpoly.ac.ke'],
    city: 'Eldoret',
    acronyms: ['TENP', 'Eldoret Poly']
  },
  {
    id: 'kimc',
    name: 'Kenya Institute of Mass Communication (KIMC)',
    country: 'Kenya',
    countryCode: 'KE',
    code: 'KIMC',
    region: 'East Africa',
    domains: ['kimc.ac.ke'],
    city: 'Nairobi',
    acronyms: ['KIMC']
  },

  // Uganda
  {
    id: 'makerere',
    name: 'Makerere University',
    country: 'Uganda',
    countryCode: 'UG',
    code: 'MAK',
    region: 'East Africa',
    domains: ['mak.ac.ug'],
    city: 'Kampala',
    acronyms: ['MAK']
  },
  {
    id: 'iuea_uganda',
    name: 'International University of East Africa (IUEA)',
    country: 'Uganda',
    countryCode: 'UG',
    code: 'IUEA',
    region: 'East Africa',
    domains: ['iuea.ac.ug'],
    city: 'Kampala',
    acronyms: ['IUEA', 'East Africa'],
    website: 'https://iuea.ac.ug/'
  },
  {
    id: 'mubs',
    name: 'Makerere University Business School (MUBS)',
    country: 'Uganda',
    countryCode: 'UG',
    code: 'MUBS',
    region: 'East Africa',
    domains: ['mubs.ac.ug'],
    city: 'Kampala',
    acronyms: ['MUBS']
  },
  {
    id: 'kyambogo',
    name: 'Kyambogo University',
    country: 'Uganda',
    countryCode: 'UG',
    code: 'KYU',
    region: 'East Africa',
    domains: ['kyu.ac.ug'],
    city: 'Kampala',
    acronyms: ['KYU']
  },
  {
    id: 'ucu',
    name: 'Uganda Christian University (UCU)',
    country: 'Uganda',
    countryCode: 'UG',
    code: 'UCU',
    region: 'East Africa',
    domains: ['ucu.ac.ug'],
    city: 'Mukono',
    acronyms: ['UCU']
  },
  {
    id: 'must_ug',
    name: 'Mbarara University of Science & Technology (MUST)',
    country: 'Uganda',
    countryCode: 'UG',
    code: 'MUST',
    region: 'East Africa',
    domains: ['must.ac.ug'],
    city: 'Mbarara',
    acronyms: ['MUST']
  },
  {
    id: 'kiu',
    name: 'Kampala International University (KIU)',
    country: 'Uganda',
    countryCode: 'UG',
    code: 'KIU',
    region: 'East Africa',
    domains: ['kiu.ac.ug'],
    city: 'Kampala',
    acronyms: ['KIU']
  },
  {
    id: 'umu',
    name: 'Uganda Martyrs University (UMU)',
    country: 'Uganda',
    countryCode: 'UG',
    code: 'UMU',
    region: 'East Africa',
    domains: ['umu.ac.ug'],
    city: 'Nkozi',
    acronyms: ['UMU']
  },
  {
    id: 'vu_ug',
    name: 'Victoria University Uganda',
    country: 'Uganda',
    countryCode: 'UG',
    code: 'VU',
    region: 'East Africa',
    domains: ['vu.ac.ug'],
    city: 'Kampala',
    acronyms: ['VU']
  },
  {
    id: 'cavendish_ug',
    name: 'Cavendish University Uganda',
    country: 'Uganda',
    countryCode: 'UG',
    code: 'CUU',
    region: 'East Africa',
    domains: ['cavendish.ac.ug'],
    city: 'Kampala',
    acronyms: ['CUU']
  },
  {
    id: 'isbat',
    name: 'ISBAT University',
    country: 'Uganda',
    countryCode: 'UG',
    code: 'ISBAT',
    region: 'East Africa',
    domains: ['isbat.ac.ug'],
    city: 'Kampala',
    acronyms: ['ISBAT']
  },
  {
    id: 'gulu',
    name: 'Gulu University',
    country: 'Uganda',
    countryCode: 'UG',
    code: 'GU',
    region: 'East Africa',
    domains: ['gu.ac.ug'],
    city: 'Gulu',
    acronyms: ['GU']
  },
  {
    id: 'busitema',
    name: 'Busitema University',
    country: 'Uganda',
    countryCode: 'UG',
    code: 'BU',
    region: 'East Africa',
    domains: ['busitema.ac.ug'],
    city: 'Busia',
    acronyms: ['BU']
  },
  {
    id: 'kabale',
    name: 'Kabale University',
    country: 'Uganda',
    countryCode: 'UG',
    code: 'KAB',
    region: 'East Africa',
    domains: ['kab.ac.ug'],
    city: 'Kabale',
    acronyms: ['KAB']
  },

  // Tanzania
  {
    id: 'udsm',
    name: 'University of Dar es Salaam',
    country: 'Tanzania',
    countryCode: 'TZ',
    code: 'UDSM',
    region: 'East Africa',
    domains: ['udsm.ac.tz'],
    city: 'Dar es Salaam',
    acronyms: ['UDSM']
  },
  {
    id: 'sua',
    name: 'Sokoine University of Agriculture',
    country: 'Tanzania',
    countryCode: 'TZ',
    code: 'SUA',
    region: 'East Africa',
    domains: ['sua.ac.tz'],
    city: 'Morogoro',
    acronyms: ['SUA']
  },
  {
    id: 'udom',
    name: 'University of Dodoma (UDOM)',
    country: 'Tanzania',
    countryCode: 'TZ',
    code: 'UDOM',
    region: 'East Africa',
    domains: ['udom.ac.tz'],
    city: 'Dodoma',
    acronyms: ['UDOM']
  },
  {
    id: 'muhas',
    name: 'Muhimbili University of Health and Allied Sciences (MUHAS)',
    country: 'Tanzania',
    countryCode: 'TZ',
    code: 'MUHAS',
    region: 'East Africa',
    domains: ['muhas.ac.tz'],
    city: 'Dar es Salaam',
    acronyms: ['MUHAS']
  },
  {
    id: 'ardhi',
    name: 'Ardhi University',
    country: 'Tanzania',
    countryCode: 'TZ',
    code: 'ARU',
    region: 'East Africa',
    domains: ['aru.ac.tz'],
    city: 'Dar es Salaam',
    acronyms: ['ARU', 'Ardhi']
  },

  // Rwanda & Ethiopia
  {
    id: 'ur',
    name: 'University of Rwanda',
    country: 'Rwanda',
    countryCode: 'RW',
    code: 'UR',
    region: 'East Africa',
    domains: ['ur.ac.rw'],
    city: 'Kigali',
    acronyms: ['UR']
  },
  {
    id: 'cmu_africa',
    name: 'Carnegie Mellon University Africa',
    country: 'Rwanda',
    countryCode: 'RW',
    code: 'CMU Africa',
    region: 'East Africa',
    domains: ['africa.engineering.cmu.edu'],
    city: 'Kigali',
    acronyms: ['CMU Africa', 'CMU-A']
  },
  {
    id: 'alu_rw',
    name: 'African Leadership University (ALU)',
    country: 'Rwanda',
    countryCode: 'RW',
    code: 'ALU',
    region: 'East Africa',
    domains: ['alueducation.com'],
    city: 'Kigali',
    acronyms: ['ALU']
  },
  {
    id: 'aau_et',
    name: 'Addis Ababa University',
    country: 'Ethiopia',
    countryCode: 'ET',
    code: 'AAU',
    region: 'East Africa',
    domains: ['aau.edu.et'],
    city: 'Addis Ababa',
    acronyms: ['AAU']
  },
  {
    id: 'kyotoiu',
    name: 'Kyoto International University',
    country: 'Japan',
    countryCode: 'JP',
    code: 'KIU',
    region: 'Global',
    domains: ['kyotoiu.ac.jp'],
    website: 'http://www.kyotoiu.ac.jp/',
    city: 'Kyoto',
    acronyms: ['KIU']
  },

  // ── West & Southern & North Africa ──
  {
    id: 'uct',
    name: 'University of Cape Town (UCT)',
    country: 'South Africa',
    countryCode: 'ZA',
    code: 'UCT',
    region: 'Southern Africa',
    domains: ['uct.ac.za'],
    city: 'Cape Town',
    acronyms: ['UCT']
  },
  {
    id: 'wits',
    name: 'University of the Witwatersrand (Wits)',
    country: 'South Africa',
    countryCode: 'ZA',
    code: 'Wits',
    region: 'Southern Africa',
    domains: ['wits.ac.za'],
    city: 'Johannesburg',
    acronyms: ['Wits']
  },
  {
    id: 'stellenbosch',
    name: 'Stellenbosch University',
    country: 'South Africa',
    countryCode: 'ZA',
    code: 'Stell',
    region: 'Southern Africa',
    domains: ['sun.ac.za'],
    city: 'Stellenbosch',
    acronyms: ['SU', 'Stell']
  },
  {
    id: 'pretoria',
    name: 'University of Pretoria',
    country: 'South Africa',
    countryCode: 'ZA',
    code: 'UP',
    region: 'Southern Africa',
    domains: ['up.ac.za'],
    city: 'Pretoria',
    acronyms: ['UP']
  },
  {
    id: 'ukzn',
    name: 'University of KwaZulu-Natal',
    country: 'South Africa',
    countryCode: 'ZA',
    code: 'UKZN',
    region: 'Southern Africa',
    domains: ['ukzn.ac.za'],
    city: 'Durban',
    acronyms: ['UKZN']
  },
  {
    id: 'unilag',
    name: 'University of Lagos (UNILAG)',
    country: 'Nigeria',
    countryCode: 'NG',
    code: 'UNILAG',
    region: 'West Africa',
    domains: ['unilag.edu.ng'],
    city: 'Lagos',
    acronyms: ['UNILAG']
  },
  {
    id: 'ui_ibadan',
    name: 'University of Ibadan (UI)',
    country: 'Nigeria',
    countryCode: 'NG',
    code: 'UI',
    region: 'West Africa',
    domains: ['ui.edu.ng'],
    city: 'Ibadan',
    acronyms: ['UI']
  },
  {
    id: 'covenant',
    name: 'Covenant University',
    country: 'Nigeria',
    countryCode: 'NG',
    code: 'Covenant',
    region: 'West Africa',
    domains: ['covenantuniversity.edu.ng'],
    city: 'Ota, Ogun State',
    acronyms: ['CU', 'Covenant']
  },
  {
    id: 'oau',
    name: 'Obafemi Awolowo University (OAU)',
    country: 'Nigeria',
    countryCode: 'NG',
    code: 'OAU',
    region: 'West Africa',
    domains: ['oauife.edu.ng'],
    city: 'Ile-Ife',
    acronyms: ['OAU']
  },
  {
    id: 'abu_zaria',
    name: 'Ahmadu Bello University (ABU)',
    country: 'Nigeria',
    countryCode: 'NG',
    code: 'ABU',
    region: 'West Africa',
    domains: ['abu.edu.ng'],
    city: 'Zaria',
    acronyms: ['ABU']
  },
  {
    id: 'unn',
    name: 'University of Nigeria, Nsukka (UNN)',
    country: 'Nigeria',
    countryCode: 'NG',
    code: 'UNN',
    region: 'West Africa',
    domains: ['unn.edu.ng'],
    city: 'Nsukka',
    acronyms: ['UNN']
  },
  {
    id: 'futa',
    name: 'Federal University of Technology Akure (FUTA)',
    country: 'Nigeria',
    countryCode: 'NG',
    code: 'FUTA',
    region: 'West Africa',
    domains: ['futa.edu.ng'],
    city: 'Akure',
    acronyms: ['FUTA']
  },
  {
    id: 'knust',
    name: 'Kwame Nkrumah University of Science & Technology (KNUST)',
    country: 'Ghana',
    countryCode: 'GH',
    code: 'KNUST',
    region: 'West Africa',
    domains: ['knust.edu.gh'],
    city: 'Kumasi',
    acronyms: ['KNUST']
  },
  {
    id: 'ug_legon',
    name: 'University of Ghana (Legon)',
    country: 'Ghana',
    countryCode: 'GH',
    code: 'UG',
    region: 'West Africa',
    domains: ['ug.edu.gh'],
    city: 'Accra',
    acronyms: ['UG', 'Legon']
  },
  {
    id: 'ashesi',
    name: 'Ashesi University',
    country: 'Ghana',
    countryCode: 'GH',
    code: 'Ashesi',
    region: 'West Africa',
    domains: ['ashesi.edu.gh'],
    city: 'Berekuso',
    acronyms: ['Ashesi']
  },
  {
    id: 'cairo',
    name: 'Cairo University',
    country: 'Egypt',
    countryCode: 'EG',
    code: 'CU',
    region: 'North Africa',
    domains: ['cu.edu.eg'],
    city: 'Giza',
    acronyms: ['CU']
  },
  {
    id: 'auc_egypt',
    name: 'The American University in Cairo (AUC)',
    country: 'Egypt',
    countryCode: 'EG',
    code: 'AUC',
    region: 'North Africa',
    domains: ['aucegypt.edu'],
    city: 'New Cairo',
    acronyms: ['AUC']
  },
  {
    id: 'unza',
    name: 'University of Zambia (UNZA)',
    country: 'Zambia',
    countryCode: 'ZM',
    code: 'UNZA',
    region: 'Southern Africa',
    domains: ['unza.zm'],
    city: 'Lusaka',
    acronyms: ['UNZA']
  },
  {
    id: 'uz_zim',
    name: 'University of Zimbabwe',
    country: 'Zimbabwe',
    countryCode: 'ZW',
    code: 'UZ',
    region: 'Southern Africa',
    domains: ['uz.ac.zw'],
    city: 'Harare',
    acronyms: ['UZ']
  },
  {
    id: 'ub_botswana',
    name: 'University of Botswana',
    country: 'Botswana',
    countryCode: 'BW',
    code: 'UB',
    region: 'Southern Africa',
    domains: ['ub.bw'],
    city: 'Gaborone',
    acronyms: ['UB']
  },
  {
    id: 'iuea_uganda',
    name: 'International University of East Africa (IUEA)',
    country: 'Uganda',
    countryCode: 'UG',
    code: 'IUEA',
    region: 'East Africa',
    domains: ['iuea.ac.ug'],
    city: 'Kampala',
    acronyms: ['IUEA'],
    website: 'https://iuea.ac.ug/'
  }
];

// Lazy loader and parser for the full 16,314+ university global dataset
import rawCatalog from './universitiesCatalog.json';

let _fullUniversitiesCache: University[] | null = null;

export interface SecondarySchool {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  code: string;
  curriculum: string;
  city: string;
  levels: string[];
}

export const SECONDARY_SCHOOLS: SecondarySchool[] = [
  // ── Uganda (UNEB: UCE O-Level & UACE A-Level) ──
  { id: 'budo', name: "King's College Budo", country: 'Uganda', countryCode: 'UG', code: 'KCB', curriculum: 'UNEB (UCE / UACE)', city: 'Wakiso / Kampala', levels: ['S.1', 'S.2', 'S.3', 'S.4 (UCE)', 'S.5', 'S.6 (UACE)'] },
  { id: 'smack', name: "St. Mary's College Kisubi (SMACK)", country: 'Uganda', countryCode: 'UG', code: 'SMACK', curriculum: 'UNEB (UCE / UACE)', city: 'Entebbe / Wakiso', levels: ['S.1', 'S.2', 'S.3', 'S.4 (UCE)', 'S.5', 'S.6 (UACE)'] },
  { id: 'gayaza', name: 'Gayaza High School', country: 'Uganda', countryCode: 'UG', code: 'GHS', curriculum: 'UNEB (UCE / UACE)', city: 'Gayaza / Kampala', levels: ['S.1', 'S.2', 'S.3', 'S.4 (UCE)', 'S.5', 'S.6 (UACE)'] },
  { id: 'namagunga', name: "Mt. St. Mary's College Namagunga", country: 'Uganda', countryCode: 'UG', code: 'MSMCN', curriculum: 'UNEB (UCE / UACE)', city: 'Mukono', levels: ['S.1', 'S.2', 'S.3', 'S.4 (UCE)', 'S.5', 'S.6 (UACE)'] },
  { id: 'namilyango', name: 'Namilyango College', country: 'Uganda', countryCode: 'UG', code: 'NAM', curriculum: 'UNEB (UCE / UACE)', city: 'Mukono', levels: ['S.1', 'S.2', 'S.3', 'S.4 (UCE)', 'S.5', 'S.6 (UACE)'] },
  { id: 'namugongo', name: 'Uganda Martyrs S.S. Namugongo', country: 'Uganda', countryCode: 'UG', code: 'UMSSN', curriculum: 'UNEB (UCE / UACE)', city: 'Kira / Wakiso', levels: ['S.1', 'S.2', 'S.3', 'S.4 (UCE)', 'S.5', 'S.6 (UACE)'] },
  { id: 'kibuli', name: 'Kibuli Secondary School', country: 'Uganda', countryCode: 'UG', code: 'KSS', curriculum: 'UNEB (UCE / UACE)', city: 'Kampala', levels: ['S.1', 'S.2', 'S.3', 'S.4 (UCE)', 'S.5', 'S.6 (UACE)'] },
  { id: 'maco', name: 'Makerere College School', country: 'Uganda', countryCode: 'UG', code: 'MACOS', curriculum: 'UNEB (UCE / UACE)', city: 'Kampala', levels: ['S.1', 'S.2', 'S.3', 'S.4 (UCE)', 'S.5', 'S.6 (UACE)'] },
  { id: 'mengo', name: 'Mengo Senior School', country: 'Uganda', countryCode: 'UG', code: 'MSS', curriculum: 'UNEB (UCE / UACE)', city: 'Kampala', levels: ['S.1', 'S.2', 'S.3', 'S.4 (UCE)', 'S.5', 'S.6 (UACE)'] },
  { id: 'ntare', name: 'Ntare School', country: 'Uganda', countryCode: 'UG', code: 'NTS', curriculum: 'UNEB (UCE / UACE)', city: 'Mbarara', levels: ['S.1', 'S.2', 'S.3', 'S.4 (UCE)', 'S.5', 'S.6 (UACE)'] },
  { id: 'seeta', name: 'Seeta High School (Main Campus)', country: 'Uganda', countryCode: 'UG', code: 'SHS', curriculum: 'UNEB (UCE / UACE)', city: 'Mukono', levels: ['S.1', 'S.2', 'S.3', 'S.4 (UCE)', 'S.5', 'S.6 (UACE)'] },
  { id: 'nabingo', name: 'Trinity College Nabbingo', country: 'Uganda', countryCode: 'UG', code: 'TRICONA', curriculum: 'UNEB (UCE / UACE)', city: 'Wakiso', levels: ['S.1', 'S.2', 'S.3', 'S.4 (UCE)', 'S.5', 'S.6 (UACE)'] },
  { id: 'nabisunsa', name: 'Nabisunsa Girls Secondary School', country: 'Uganda', countryCode: 'UG', code: 'NGSS', curriculum: 'UNEB (UCE / UACE)', city: 'Kampala', levels: ['S.1', 'S.2', 'S.3', 'S.4 (UCE)', 'S.5', 'S.6 (UACE)'] },

  // ── Kenya (KNEC: KCSE & CBC Senior School) ──
  { id: 'alliance_boys', name: 'Alliance High School', country: 'Kenya', countryCode: 'KE', code: 'AHS', curriculum: 'KNEC (KCSE / CBC)', city: 'Kikuyu', levels: ['Form 1', 'Form 2', 'Form 3', 'Form 4 (KCSE)', 'Grade 10', 'Grade 11', 'Grade 12'] },
  { id: 'kenya_high', name: 'The Kenya High School', country: 'Kenya', countryCode: 'KE', code: 'KHS', curriculum: 'KNEC (KCSE / CBC)', city: 'Nairobi', levels: ['Form 1', 'Form 2', 'Form 3', 'Form 4 (KCSE)', 'Grade 10', 'Grade 11', 'Grade 12'] },
  { id: 'mangu', name: "Mang'u High School", country: 'Kenya', countryCode: 'KE', code: 'MHS', curriculum: 'KNEC (KCSE / CBC)', city: 'Thika', levels: ['Form 1', 'Form 2', 'Form 3', 'Form 4 (KCSE)', 'Grade 10', 'Grade 11', 'Grade 12'] },
  { id: 'starehe', name: "Starehe Boys' Centre and School", country: 'Kenya', countryCode: 'KE', code: 'SBC', curriculum: 'KNEC (KCSE / CBC)', city: 'Nairobi', levels: ['Form 1', 'Form 2', 'Form 3', 'Form 4 (KCSE)', 'Grade 10', 'Grade 11', 'Grade 12'] },
  { id: 'lenana', name: 'Lenana School', country: 'Kenya', countryCode: 'KE', code: 'LNS', curriculum: 'KNEC (KCSE / CBC)', city: 'Nairobi', levels: ['Form 1', 'Form 2', 'Form 3', 'Form 4 (KCSE)', 'Grade 10', 'Grade 11', 'Grade 12'] },
  { id: 'nairobi_school', name: 'Nairobi School', country: 'Kenya', countryCode: 'KE', code: 'NSC', curriculum: 'KNEC (KCSE / CBC)', city: 'Nairobi', levels: ['Form 1', 'Form 2', 'Form 3', 'Form 4 (KCSE)', 'Grade 10', 'Grade 11', 'Grade 12'] },
  { id: 'riruta', name: 'Precious Blood Secondary School Riruta', country: 'Kenya', countryCode: 'KE', code: 'PBR', curriculum: 'KNEC (KCSE / CBC)', city: 'Nairobi', levels: ['Form 1', 'Form 2', 'Form 3', 'Form 4 (KCSE)', 'Grade 10', 'Grade 11', 'Grade 12'] },
  { id: 'maseno', name: 'Maseno School', country: 'Kenya', countryCode: 'KE', code: 'MSN', curriculum: 'KNEC (KCSE / CBC)', city: 'Kisumu', levels: ['Form 1', 'Form 2', 'Form 3', 'Form 4 (KCSE)', 'Grade 10', 'Grade 11', 'Grade 12'] },
  { id: 'strathmore_sec', name: 'Strathmore School', country: 'Kenya', countryCode: 'KE', code: 'STRATH', curriculum: 'KNEC (KCSE / CBC)', city: 'Nairobi', levels: ['Form 1', 'Form 2', 'Form 3', 'Form 4 (KCSE)', 'Grade 10', 'Grade 11', 'Grade 12'] },

  // ── Tanzania (NECTA: CSEE / ACSEE) ──
  { id: 'ilboru', name: 'Ilboru Secondary School', country: 'Tanzania', countryCode: 'TZ', code: 'ILB', curriculum: 'NECTA (CSEE / ACSEE)', city: 'Arusha', levels: ['Form 1', 'Form 2', 'Form 3', 'Form 4 (CSEE)', 'Form 5', 'Form 6 (ACSEE)'] },
  { id: 'tabora_boys', name: 'Tabora Boys Secondary School', country: 'Tanzania', countryCode: 'TZ', code: 'TBS', curriculum: 'NECTA (CSEE / ACSEE)', city: 'Tabora', levels: ['Form 1', 'Form 2', 'Form 3', 'Form 4 (CSEE)', 'Form 5', 'Form 6 (ACSEE)'] },
  { id: 'kibaha_sec', name: 'Kibaha Secondary School', country: 'Tanzania', countryCode: 'TZ', code: 'KSS', curriculum: 'NECTA (CSEE / ACSEE)', city: 'Pwani', levels: ['Form 1', 'Form 2', 'Form 3', 'Form 4 (CSEE)', 'Form 5', 'Form 6 (ACSEE)'] },
  { id: 'marian_girls', name: 'Marian Girls High School', country: 'Tanzania', countryCode: 'TZ', code: 'MGHS', curriculum: 'NECTA (CSEE / ACSEE)', city: 'Bagamoyo', levels: ['Form 1', 'Form 2', 'Form 3', 'Form 4 (CSEE)', 'Form 5', 'Form 6 (ACSEE)'] },

  // ── Rwanda (NESA) ──
  { id: 'fawe_rwanda', name: 'FAWE Girls School Gisozi', country: 'Rwanda', countryCode: 'RW', code: 'FAWE', curriculum: 'NESA (O / A-Level)', city: 'Kigali', levels: ['S.1', 'S.2', 'S.3 (O-Level)', 'S.4', 'S.5', 'S.6 (Advanced)'] },
  { id: 'lycee_kigali', name: 'Lycée de Kigali', country: 'Rwanda', countryCode: 'RW', code: 'LDK', curriculum: 'NESA (O / A-Level)', city: 'Kigali', levels: ['S.1', 'S.2', 'S.3 (O-Level)', 'S.4', 'S.5', 'S.6 (Advanced)'] },
  { id: 'green_hills', name: 'Green Hills Academy', country: 'Rwanda', countryCode: 'RW', code: 'GHA', curriculum: 'Cambridge / IB / NESA', city: 'Kigali', levels: ['Grade 9', 'Grade 10 (IGCSE)', 'Grade 11', 'Grade 12 (IB DP)'] },

  // ── Nigeria (WAEC / NECO / JAMB) ──
  { id: 'kings_college_lagos', name: "King's College Lagos", country: 'Nigeria', countryCode: 'NG', code: 'KCL', curriculum: 'WAEC / NECO', city: 'Lagos', levels: ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3 (WASSCE)'] },
  { id: 'queens_college_lagos', name: "Queen's College Lagos", country: 'Nigeria', countryCode: 'NG', code: 'QCL', curriculum: 'WAEC / NECO', city: 'Lagos', levels: ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3 (WASSCE)'] },
  { id: 'loyola_jesuit', name: 'Loyola Jesuit College', country: 'Nigeria', countryCode: 'NG', code: 'LJC', curriculum: 'WAEC / Cambridge', city: 'Abuja', levels: ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3 (WASSCE)'] },

  // ── Ghana (WAEC WASSCE) ──
  { id: 'presec_legon', name: "Presbyterian Boys' Secondary School (PRESEC Legon)", country: 'Ghana', countryCode: 'GH', code: 'PRESEC', curriculum: 'WAEC (WASSCE)', city: 'Accra', levels: ['SHS 1', 'SHS 2', 'SHS 3 (WASSCE)'] },
  { id: 'achimota', name: 'Achimota School', country: 'Ghana', countryCode: 'GH', code: 'ACHI', curriculum: 'WAEC (WASSCE)', city: 'Accra', levels: ['SHS 1', 'SHS 2', 'SHS 3 (WASSCE)'] },
  { id: 'prempeh', name: 'Prempeh College', country: 'Ghana', countryCode: 'GH', code: 'PREM', curriculum: 'WAEC (WASSCE)', city: 'Kumasi', levels: ['SHS 1', 'SHS 2', 'SHS 3 (WASSCE)'] },

  // ── United Kingdom (GCSE & A-Levels) ──
  { id: 'eton_college', name: 'Eton College', country: 'United Kingdom', countryCode: 'GB', code: 'ETON', curriculum: 'Ofqual (GCSE / A-Level)', city: 'Windsor', levels: ['Year 9', 'Year 10 (GCSE)', 'Year 11 (GCSE)', 'Year 12 (Sixth Form)', 'Year 13 (A-Level)'] },
  { id: 'westminster_school', name: 'Westminster School', country: 'United Kingdom', countryCode: 'GB', code: 'WEST', curriculum: 'Ofqual (GCSE / A-Level)', city: 'London', levels: ['Year 9', 'Year 10 (GCSE)', 'Year 11 (GCSE)', 'Year 12 (Sixth Form)', 'Year 13 (A-Level)'] },

  // ── United States (High School / AP / IB) ──
  { id: 'exeter', name: 'Phillips Exeter Academy', country: 'United States', countryCode: 'US', code: 'PEA', curriculum: 'US High School / AP', city: 'Exeter, NH', levels: ['9th Grade (Freshman)', '10th Grade (Sophomore)', '11th Grade (Junior)', '12th Grade (Senior)'] },
  { id: 'stuyvesant', name: 'Stuyvesant High School', country: 'United States', countryCode: 'US', code: 'STUY', curriculum: 'US High School / AP / Regents', city: 'New York, NY', levels: ['9th Grade (Freshman)', '10th Grade (Sophomore)', '11th Grade (Junior)', '12th Grade (Senior)'] },
];

export function getSecondarySchools(countryCode?: string): SecondarySchool[] {
  if (!countryCode) return SECONDARY_SCHOOLS;
  const cc = countryCode.toUpperCase();
  const regionalMatch = SECONDARY_SCHOOLS.filter(s => s.countryCode === cc);
  const others = SECONDARY_SCHOOLS.filter(s => s.countryCode !== cc);
  return [...regionalMatch, ...others];
}

export type InstitutionSector = 'higher_ed' | 'secondary';

export interface SecondarySystemInfo {
  countryCode: string;
  countryName: string;
  systemName: string;
  examBoards: string[];
  levels: { id: string; label: string; stage: 'Ordinary Level / Junior' | 'Advanced Level / Senior' | 'General' }[];
  defaultTracks: string[];
}

export const REGIONAL_SECONDARY_SYSTEMS: Record<string, SecondarySystemInfo> = {
  UG: {
    countryCode: 'UG',
    countryName: 'Uganda',
    systemName: 'UNEB (UCE & UACE)',
    examBoards: ['UNEB'],
    levels: [
      { id: 'S.1', label: 'Senior 1 (S.1)', stage: 'Ordinary Level / Junior' },
      { id: 'S.2', label: 'Senior 2 (S.2)', stage: 'Ordinary Level / Junior' },
      { id: 'S.3', label: 'Senior 3 (S.3)', stage: 'Ordinary Level / Junior' },
      { id: 'S.4', label: 'Senior 4 (S.4 - UCE Candidate)', stage: 'Ordinary Level / Junior' },
      { id: 'S.5', label: 'Senior 5 (S.5)', stage: 'Advanced Level / Senior' },
      { id: 'S.6', label: 'Senior 6 (S.6 - UACE Candidate)', stage: 'Advanced Level / Senior' },
    ],
    defaultTracks: [
      'PCM (Physics, Chemistry, Math)',
      'PCB (Physics, Chemistry, Biology)',
      'BCG (Biology, Chemistry, Geography)',
      'MEG (Math, Economics, Geography)',
      'HEL (History, Economics, Literature)',
      'Arts & Humanities (O-Level)',
      'Sciences & Tech (O-Level)',
    ],
  },
  KE: {
    countryCode: 'KE',
    countryName: 'Kenya',
    systemName: 'KNEC (KCSE & CBC Senior School)',
    examBoards: ['KNEC'],
    levels: [
      { id: 'Form 1', label: 'Form 1', stage: 'Ordinary Level / Junior' },
      { id: 'Form 2', label: 'Form 2', stage: 'Ordinary Level / Junior' },
      { id: 'Form 3', label: 'Form 3', stage: 'Ordinary Level / Junior' },
      { id: 'Form 4', label: 'Form 4 (KCSE Candidate)', stage: 'Ordinary Level / Junior' },
      { id: 'Grade 10', label: 'Grade 10 (Senior School)', stage: 'Advanced Level / Senior' },
      { id: 'Grade 11', label: 'Grade 11 (Senior School)', stage: 'Advanced Level / Senior' },
      { id: 'Grade 12', label: 'Grade 12 (Senior School Candidate)', stage: 'Advanced Level / Senior' },
    ],
    defaultTracks: [
      'STEM Pathway (Pure Sciences & Math)',
      'STEM Pathway (Applied Sciences & Tech)',
      'Social Sciences Pathway (Humanities & Business)',
      'Arts & Sports Science Pathway',
      'KCSE Sciences (Math, Chem, Bio, Phys)',
      'KCSE Humanities (Hist, Geo, CRE, Bus)',
    ],
  },
  TZ: {
    countryCode: 'TZ',
    countryName: 'Tanzania',
    systemName: 'NECTA (CSEE & ACSEE)',
    examBoards: ['NECTA'],
    levels: [
      { id: 'Form 1', label: 'Form 1', stage: 'Ordinary Level / Junior' },
      { id: 'Form 2', label: 'Form 2', stage: 'Ordinary Level / Junior' },
      { id: 'Form 3', label: 'Form 3', stage: 'Ordinary Level / Junior' },
      { id: 'Form 4', label: 'Form 4 (CSEE Candidate)', stage: 'Ordinary Level / Junior' },
      { id: 'Form 5', label: 'Form 5 (High School)', stage: 'Advanced Level / Senior' },
      { id: 'Form 6', label: 'Form 6 (ACSEE Candidate)', stage: 'Advanced Level / Senior' },
    ],
    defaultTracks: [
      'PCM (Physics, Chemistry, Mathematics)',
      'PCB (Physics, Chemistry, Biology)',
      'CBG (Chemistry, Biology, Geography)',
      'EGM (Economics, Geography, Mathematics)',
      'HGL (History, Geography, Language)',
      'HGK (History, Geography, Kiswahili)',
    ],
  },
  RW: {
    countryCode: 'RW',
    countryName: 'Rwanda',
    systemName: 'NESA (O & A-Level)',
    examBoards: ['NESA'],
    levels: [
      { id: 'S.1', label: 'Senior 1 (S.1)', stage: 'Ordinary Level / Junior' },
      { id: 'S.2', label: 'Senior 2 (S.2)', stage: 'Ordinary Level / Junior' },
      { id: 'S.3', label: 'Senior 3 (S.3 - O-Level Exam)', stage: 'Ordinary Level / Junior' },
      { id: 'S.4', label: 'Senior 4 (S.4)', stage: 'Advanced Level / Senior' },
      { id: 'S.5', label: 'Senior 5 (S.5)', stage: 'Advanced Level / Senior' },
      { id: 'S.6', label: 'Senior 6 (S.6 - National Exam)', stage: 'Advanced Level / Senior' },
    ],
    defaultTracks: [
      'MCB (Mathematics, Chemistry, Biology)',
      'MPC (Mathematics, Physics, Computer)',
      'PCB (Physics, Chemistry, Biology)',
      'HEG (History, Economics, Geography)',
      'MEG (Mathematics, Economics, Geography)',
    ],
  },
  NG: {
    countryCode: 'NG',
    countryName: 'Nigeria',
    systemName: 'WAEC / NECO / JAMB',
    examBoards: ['WAEC', 'NECO', 'JAMB'],
    levels: [
      { id: 'JSS 1', label: 'JSS 1 (Junior Secondary)', stage: 'Ordinary Level / Junior' },
      { id: 'JSS 2', label: 'JSS 2', stage: 'Ordinary Level / Junior' },
      { id: 'JSS 3', label: 'JSS 3 (BECE Candidate)', stage: 'Ordinary Level / Junior' },
      { id: 'SSS 1', label: 'SSS 1 (Senior Secondary)', stage: 'Advanced Level / Senior' },
      { id: 'SSS 2', label: 'SSS 2', stage: 'Advanced Level / Senior' },
      { id: 'SSS 3', label: 'SSS 3 (WASSCE / JAMB UTME)', stage: 'Advanced Level / Senior' },
    ],
    defaultTracks: [
      'Science Stream (Math, Physics, Chemistry, Biology)',
      'Commercial / Business Stream (Accounting, Commerce, Economics)',
      'Arts & Humanities (Literature, Government, CRS/IRS, History)',
      'Technical & Vocational',
    ],
  },
  GH: {
    countryCode: 'GH',
    countryName: 'Ghana',
    systemName: 'WAEC (WASSCE)',
    examBoards: ['WAEC'],
    levels: [
      { id: 'JHS 1', label: 'JHS 1', stage: 'Ordinary Level / Junior' },
      { id: 'JHS 2', label: 'JHS 2', stage: 'Ordinary Level / Junior' },
      { id: 'JHS 3', label: 'JHS 3 (BECE Candidate)', stage: 'Ordinary Level / Junior' },
      { id: 'SHS 1', label: 'SHS 1 (Senior High)', stage: 'Advanced Level / Senior' },
      { id: 'SHS 2', label: 'SHS 2', stage: 'Advanced Level / Senior' },
      { id: 'SHS 3', label: 'SHS 3 (WASSCE Candidate)', stage: 'Advanced Level / Senior' },
    ],
    defaultTracks: [
      'General Science (Elective Maths, Physics, Chemistry, Biology)',
      'General Arts (Government, Literature, Economics, History)',
      'Business (Accounting, Costing, Economics, Elective Maths)',
      'Visual Arts & Home Economics',
    ],
  },
  GB: {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    systemName: 'GCSE & A-Levels',
    examBoards: ['Edexcel', 'AQA', 'OCR', 'Cambridge'],
    levels: [
      { id: 'Year 9', label: 'Year 9 (Key Stage 3)', stage: 'Ordinary Level / Junior' },
      { id: 'Year 10', label: 'Year 10 (GCSE Year 1)', stage: 'Ordinary Level / Junior' },
      { id: 'Year 11', label: 'Year 11 (GCSE Exam Year)', stage: 'Ordinary Level / Junior' },
      { id: 'Year 12', label: 'Year 12 (Sixth Form / AS-Level)', stage: 'Advanced Level / Senior' },
      { id: 'Year 13', label: 'Year 13 (Upper Sixth / A-Level Final)', stage: 'Advanced Level / Senior' },
    ],
    defaultTracks: [
      'STEM A-Levels (Maths, Further Maths, Physics, Chemistry)',
      'Biological Sciences (Biology, Chemistry, Psychology)',
      'Humanities & Social Sciences (History, Politics, Economics, English)',
      'GCSE Core Curriculum',
    ],
  },
  US: {
    countryCode: 'US',
    countryName: 'United States',
    systemName: 'High School (AP / IB / Honors)',
    examBoards: ['College Board (AP)', 'ACT / SAT', 'IB'],
    levels: [
      { id: '9th Grade', label: '9th Grade (Freshman)', stage: 'General' },
      { id: '10th Grade', label: '10th Grade (Sophomore)', stage: 'General' },
      { id: '11th Grade', label: '11th Grade (Junior / APs)', stage: 'General' },
      { id: '12th Grade', label: '12th Grade (Senior / AP / Honors)', stage: 'General' },
    ],
    defaultTracks: [
      'Advanced Placement (AP STEM Track: Calc BC, Physics C, Chem)',
      'AP Humanities Track (AP Lit, AP US History, AP Gov)',
      'International Baccalaureate (IB Diploma Programme)',
      'General College Prep Curriculum',
    ],
  },
};

export function getRegionalSecondarySystem(countryCode?: string): SecondarySystemInfo {
  const code = (countryCode || 'UG').toUpperCase();
  return REGIONAL_SECONDARY_SYSTEMS[code] || REGIONAL_SECONDARY_SYSTEMS['UG'];
}

export function getFullUniversities(preferredCountryCode?: string): University[] {
  const catalogItems: University[] = (rawCatalog as Array<[string, string, string, string, string, string, string[]]>).map((item) => ({
    id: item[0],
    name: item[1],
    country: item[2],
    countryCode: item[3],
    code: item[4],
    city: item[5],
    region: item[2],
    domains: [],
    acronyms: item[6] || [],
  }));

  // Merge with initial hardcoded curated list, deduplicating by lowercase name
  const seenNames = new Set<string>();
  const merged: University[] = [];

  for (const u of UNIVERSITIES) {
    const key = u.name.toLowerCase().trim();
    if (!seenNames.has(key)) {
      seenNames.add(key);
      merged.push(u);
    }
  }

  for (const u of catalogItems) {
    const key = u.name.toLowerCase().trim();
    if (!seenNames.has(key)) {
      seenNames.add(key);
      merged.push(u);
    }
  }

  // Prioritize based on detected preferredCountryCode (e.g. 'UG', 'KE', 'TZ', 'RW', 'NG', 'GH', 'GB', 'US')
  const pref = (preferredCountryCode || '').toUpperCase();
  const defaultRegionalCodes = new Set(['UG', 'KE', 'RW', 'TZ']);

  const prioritized = merged.sort((a, b) => {
    if (pref) {
      const aIsPref = a.countryCode === pref;
      const bIsPref = b.countryCode === pref;
      if (aIsPref && !bIsPref) return -1;
      if (!aIsPref && bIsPref) return 1;
    }
    const aIsRegional = defaultRegionalCodes.has(a.countryCode);
    const bIsRegional = defaultRegionalCodes.has(b.countryCode);
    if (aIsRegional && !bIsRegional) return -1;
    if (!aIsRegional && bIsRegional) return 1;
    return 0;
  });

  return prioritized;
}


export const PERSONAS: Persona[] = [
  {
    id: 'engineering',
    title: 'STEM & Engineering',
    subtitle: 'Computer Science, Software, Electrical, Mechanical & Math',
    icon: Code,
    color: '#6366f1',
    bgColor: 'from-indigo-950/60 to-slate-900',
    borderColor: 'border-indigo-500/40',
    citation: 'IEEE',
    defaultDegrees: [
      'B.Sc. Computer Science',
      'B.Eng. Software Engineering',
      'B.Sc. Electrical & Electronic Engineering',
      'B.Sc. Mechanical & Mechatronics Engineering',
      'B.Sc. Mathematics & Statistics',
      'M.Sc. Computer Science',
      'Ph.D. in Computer Science & Robotics'
    ],
    defaultCourses: [
      { code: 'CS 301', name: 'Distributed Systems & Cloud Computing', instructor: 'Dr. Elena Rostova', color: '#6366f1', selected: true },
      { code: 'MATH 240', name: 'Multivariable Calculus & Linear Optimization', instructor: 'Dr. Sarah Jenkins', color: '#f59e0b', selected: true },
      { code: 'CS 210', name: 'Data Structures & Algorithmic Complexity', instructor: 'Prof. Alan Thorne', color: '#10b981', selected: true },
      { code: 'CS 350', name: 'Artificial Intelligence & Machine Learning', instructor: 'Dr. Marcus Vance', color: '#8b5cf6', selected: false },
      { code: 'ECE 220', name: 'Digital Logic & Computer Organization', instructor: 'Dr. Katherine Wu', color: '#06b6d4', selected: false },
      { code: 'PHYS 201', name: 'Classical Mechanics & Electromagnetism', instructor: 'Prof. Richard Hall', color: '#ec4899', selected: false }
    ],
    focusFeatures: [
      'Big-O Complexity & Socratic Code Review',
      'LaTeX Mathematical & Physics Derivations ($$...$$)',
      'Algorithmic Proofs & Technical Spec Generator',
      'IEEE Citation Standard'
    ]
  },
  {
    id: 'datascience',
    title: 'Data Science & AI',
    subtitle: 'Machine Learning, Deep Learning, Big Data & Analytics',
    icon: Cpu,
    color: '#3b82f6',
    bgColor: 'from-blue-950/60 to-slate-900',
    borderColor: 'border-blue-500/40',
    citation: 'IEEE',
    defaultDegrees: [
      'B.Sc. Data Science & Artificial Intelligence',
      'B.Sc. Applied Statistics & Analytics',
      'M.Sc. Machine Learning & Neural Systems',
      'Ph.D. in Data Science'
    ],
    defaultCourses: [
      { code: 'DS 301', name: 'Statistical Learning & Deep Neural Networks', instructor: 'Dr. Andrew Ngoma', color: '#3b82f6', selected: true },
      { code: 'MATH 310', name: 'Linear Algebra & Probability for Machine Learning', instructor: 'Prof. Gilbert Strang', color: '#f59e0b', selected: true },
      { code: 'DATA 220', name: 'Big Data Ingestion & Apache Spark Pipelines', instructor: 'Dr. Sophia Chen', color: '#10b981', selected: true },
      { code: 'NLP 401', name: 'Large Language Models & Natural Language Processing', instructor: 'Dr. Liam Patel', color: '#8b5cf6', selected: false }
    ],
    focusFeatures: [
      'Jupyter / Python Code Optimization & Pandas profiling',
      'LaTeX Matrix & Tensor Derivations',
      'Automated Experiment Hypothesis Testing',
      'IEEE / ACM Citation Standards'
    ]
  },
  {
    id: 'law',
    title: 'Law & Jurisprudence',
    subtitle: 'Constitutional, Corporate, Criminal, Commercial & International Law',
    icon: Scales,
    color: '#f59e0b',
    bgColor: 'from-amber-950/60 to-slate-900',
    borderColor: 'border-amber-500/40',
    citation: 'Bluebook',
    defaultDegrees: [
      'LL.B. Bachelor of Laws',
      'LL.M. Corporate & Commercial Law',
      'LL.M. International Human Rights',
      'Juris Doctor (J.D.)',
      'Ph.D. in Jurisprudence'
    ],
    defaultCourses: [
      { code: 'LAW 101', name: 'Constitutional Jurisprudence & Human Rights', instructor: 'Prof. H.L.A. Hart', color: '#f59e0b', selected: true },
      { code: 'LAW 240', name: 'Tort & Contractual Obligations', instructor: 'Dr. Lord Denning', color: '#6366f1', selected: true },
      { code: 'LAW 310', name: 'Criminal Law, Procedure & Evidence', instructor: 'Justice Aloma Mukhtar', color: '#ef4444', selected: true },
      { code: 'LAW 405', name: 'Commercial Arbitration & International Trade', instructor: 'Dr. Christian Owoeye', color: '#10b981', selected: false },
      { code: 'LAW 330', name: 'Property, Land Law & Equity', instructor: 'Prof. Sandra Day', color: '#8b5cf6', selected: false }
    ],
    focusFeatures: [
      'IRAC Method Analysis (Issue, Rule, Application, Conclusion)',
      'Statutory & Case Law Precedent Audit',
      'Bluebook / OSCOLA Citation Standard',
      'Legal Precision & Appellate Argumentative Rigor'
    ]
  },
  {
    id: 'bba',
    title: 'Business & Finance',
    subtitle: 'Corporate Finance, Accounting, Strategy & MBA Management',
    icon: TrendUp,
    color: '#10b981',
    bgColor: 'from-emerald-950/60 to-slate-900',
    borderColor: 'border-emerald-500/40',
    citation: 'Harvard',
    defaultDegrees: [
      'Bachelor of Business Administration (BBA)',
      'B.Sc. Finance & Banking',
      'B.Sc. Accounting & Forensic Auditing',
      'Master of Business Administration (MBA)',
      'M.Sc. Quantitative Finance'
    ],
    defaultCourses: [
      { code: 'FIN 320', name: 'Corporate Valuation & DCF Financial Modeling', instructor: 'Prof. Aswath Damodaran', color: '#10b981', selected: true },
      { code: 'MGT 401', name: 'Strategic Enterprise Leadership & Governance', instructor: 'Prof. Michael Porter', color: '#6366f1', selected: true },
      { code: 'ECON 201', name: 'Applied Econometrics & Microeconomic Theory', instructor: 'Dr. Esther Duflo', color: '#f59e0b', selected: true },
      { code: 'MKT 210', name: 'Global Brand Strategy & Consumer Analytics', instructor: 'Dr. Philip Kotler', color: '#ec4899', selected: false },
      { code: 'ACC 305', name: 'Managerial Cost Accounting & Auditing Standards', instructor: 'Prof. David Walker', color: '#06b6d4', selected: false }
    ],
    focusFeatures: [
      'Executive Summary & Policy Memo Generator',
      'DCF, WACC & Pro-Forma Financial Formulas',
      'SWOT, PESTLE & Porter\'s 5 Forces Frameworks',
      'Harvard & APA 7th Referencing Standards'
    ]
  },
  {
    id: 'medical',
    title: 'Medicine & Health Sciences',
    subtitle: 'Clinical Medicine, Pharmacy, Nursing, Public Health & Bio-Med',
    icon: Stethoscope,
    color: '#06b6d4',
    bgColor: 'from-cyan-950/60 to-slate-900',
    borderColor: 'border-cyan-500/40',
    citation: 'AMA / NLM',
    defaultDegrees: [
      'MBChB / M.D. Medicine & Surgery',
      'Bachelor of Pharmacy (B.Pharm)',
      'B.Sc. Nursing & Midwifery',
      'B.Sc. Biomedical Engineering',
      'Master of Public Health (MPH)'
    ],
    defaultCourses: [
      { code: 'MED 201', name: 'Human Gross Anatomy & Neurophysiology', instructor: 'Dr. William Osler', color: '#06b6d4', selected: true },
      { code: 'PHARM 310', name: 'Clinical Pharmacology & Pharmacokinetics', instructor: 'Dr. Paul Farmer', color: '#3b82f6', selected: true },
      { code: 'PATH 220', name: 'General Pathology & Immunopathology', instructor: 'Dr. Rudolf Virchow', color: '#ef4444', selected: true },
      { code: 'PUBH 110', name: 'Global Epidemiological Models & Biostatistics', instructor: 'Dr. Soumya Swaminathan', color: '#10b981', selected: false },
      { code: 'BIO 105', name: 'Molecular Genetics & Cellular Biochemistry', instructor: 'Dr. Jennifer Doudna', color: '#8b5cf6', selected: false }
    ],
    focusFeatures: [
      'Clinical Case Synthesis & Differential Diagnosis',
      'PubMed / AMA / NLM Citation Indexing',
      'Flashcard Active Recall for Pharmacology & Anatomy',
      'Bio-statistical Evidence Verification'
    ]
  },
  {
    id: 'humanities',
    title: 'Humanities & Social Sciences',
    subtitle: 'History, International Relations, Philosophy, Sociology & Literature',
    icon: BookOpen,
    color: '#ec4899',
    bgColor: 'from-pink-950/60 to-slate-900',
    borderColor: 'border-pink-500/40',
    citation: 'MLA',
    defaultDegrees: [
      'B.A. International Relations & Diplomacy',
      'B.A. Literature & Creative Writing',
      'B.A. Philosophy, Politics & Economics (PPE)',
      'B.A. Sociology & Anthropology',
      'M.A. Global Geopolitics'
    ],
    defaultCourses: [
      { code: 'HIST 205', name: 'Modern Geopolitical Conflicts & Diplomacy', instructor: 'Prof. Eric Hobsbawm', color: '#ec4899', selected: true },
      { code: 'PHIL 102', name: 'Ethics, Epistemology & Political Philosophy', instructor: 'Dr. Martha Nussbaum', color: '#8b5cf6', selected: true },
      { code: 'LIT 330', name: 'Post-Colonial & Critical Literary Theory', instructor: 'Prof. Ngũgĩ wa Thiong\'o', color: '#f59e0b', selected: true },
      { code: 'SOC 210', name: 'Quantitative & Qualitative Social Research', instructor: 'Dr. Max Weber', color: '#10b981', selected: false }
    ],
    focusFeatures: [
      'Thematic Close-Reading & Textual Synthesis',
      'Historiographical Argument Mapping',
      'MLA 9th / Chicago Style Citation Verification',
      'Socratic Tone & Dialectical Essay Proofreader'
    ]
  },
  {
    id: 'commercial',
    title: 'Architecture & Built Environment',
    subtitle: 'Architecture, Urban Planning, Quantity Surveying & Real Estate',
    icon: Buildings,
    color: '#8b5cf6',
    bgColor: 'from-purple-950/60 to-slate-900',
    borderColor: 'border-purple-500/40',
    citation: 'APA',
    defaultDegrees: [
      'Bachelor of Architecture (B.Arch)',
      'B.Sc. Construction Management & Quantity Surveying',
      'B.Sc. Urban & Regional Planning',
      'B.Sc. Land Economics & Real Estate'
    ],
    defaultCourses: [
      { code: 'ARCH 110', name: 'Architectural Design Studio & Spatial Theory', instructor: 'Prof. Zaha Hadid', color: '#8b5cf6', selected: true },
      { code: 'URB 301', name: 'Sustainable Urban Planning & Smart Infrastructure', instructor: 'Dr. Jane Jacobs', color: '#10b981', selected: true },
      { code: 'PROP 220', name: 'Commercial Real Estate Valuation & Investment', instructor: 'Dr. Arthur Jones', color: '#f59e0b', selected: true },
      { code: 'CIVIL 205', name: 'Structural Mechanics & Building Code Compliance', instructor: 'Eng. David Ochieng', color: '#06b6d4', selected: false }
    ],
    focusFeatures: [
      'Feasibility Study & Pro-Forma Investment Modeling',
      'Building Code & Zoning Compliance Checklist',
      'RICS Valuation Standards',
      'Visual Concept Diagrams & Structural Matrices'
    ]
  }
];

export const ACADEMIC_LEVELS: AcademicLevel[] = [
  { id: 'Undergraduate', label: 'Undergraduate', years: ['1st Year (Freshman)', '2nd Year (Sophomore)', '3rd Year (Junior)', '4th Year (Senior)', 'Finalist / 5th Year'] },
  { id: 'Postgraduate', label: 'Postgraduate (Master\'s / MBA / LLM)', years: ['Year 1 (Coursework & Seminars)', 'Year 2 (Thesis / Capstone)', 'Final Defense'] },
  { id: 'PhD', label: 'PhD / Doctoral Candidate', years: ['Year 1 (Proposal & Comprehensive Exams)', 'Year 2 (Fieldwork & Data Ingestion)', 'Year 3+ (Dissertation Writing)'] },
];

export const SEMESTERS: string[] = [
  'Fall Semester 2026',
  'Spring Semester 2027',
  'Semester 1 (2026/2027)',
  'Semester 2 (2026/2027)',
  'Summer / Trimester Term',
];

export const CITATION_STYLES: CitationStyle[] = [
  { id: 'APA', label: 'APA 7th Edition', desc: 'Social Sciences, Business, Psychology, Education' },
  { id: 'IEEE', label: 'IEEE Style', desc: 'Computer Science, Electrical Engineering, AI, Physics' },
  { id: 'MLA', label: 'MLA 9th Edition', desc: 'Literature, Humanities, Arts, Cultural Studies' },
  { id: 'Harvard', label: 'Harvard Referencing', desc: 'Business Schools, Management, Economics' },
  { id: 'Chicago', label: 'Chicago 17th (Notes & Bib)', desc: 'History, Political Science, Fine Arts' },
  { id: 'Bluebook', label: 'Bluebook Uniform Legal', desc: 'US Law Schools, Court Briefs, Legal Law Reviews' },
  { id: 'OSCOLA', label: 'OSCOLA Standard', desc: 'UK & Commonwealth Law, Oxford Legal Research' },
  { id: 'AMA / NLM', label: 'AMA / NLM (Vancouver)', desc: 'Medicine, Clinical Pharmacology, Public Health' },
];

export const COURSE_COLORS: string[] = [
  '#6366f1', // Indigo
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#ef4444', // Red
  '#3b82f6', // Blue
];
