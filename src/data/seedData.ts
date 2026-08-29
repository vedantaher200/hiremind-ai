import { 
  UserProfile, 
  Job, 
  Application, 
  AssessmentTest, 
  InterviewQuestion, 
  ResumeAnalysis, 
  TestAttempt,
  RankingWeights 
} from '../types';

export const DEFAULT_WEIGHTS: RankingWeights = {
  atsWeight: 25,
  interviewWeight: 25,
  codingWeight: 30,
  communicationWeight: 10,
  behavioralWeight: 10,
};

export const SEED_CANDIDATE: UserProfile = {
  id: 'cand-rahul-01',
  name: 'Rahul Mehta',
  email: 'rahul.mehta@example.com',
  role: 'candidate',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  phone: '+1 (555) 234-5678',
  location: 'San Francisco, CA (Open to Remote)',
  title: 'Senior AI & Full-Stack Engineer',
  bio: 'Passionate Artificial Intelligence engineer with 5+ years specializing in deep learning transformers, LLM deployment, and high-performance backend pipelines.',
  matchScore: 90,
  skills: ['React', 'Node.js', 'Python', 'AWS', 'SQL', 'PyTorch', 'TensorFlow', 'Docker', 'Kubernetes'],
  experience: [
    {
      id: 'exp-1',
      company: 'TechCorp',
      role: 'Senior Software Engineer',
      duration: '2021 - Present',
      description: 'Architected distributed AI model serving platform reducing latency by 42%. Led cross-functional team of 6 engineers developing multimodal search engines.',
      isCurrent: true
    },
    {
      id: 'exp-2',
      company: 'DataPulse Analytics',
      role: 'Software Developer',
      duration: '2019 - 2021',
      description: 'Engineered high-throughput ETL data pipelines using Python, Apache Spark, and PostgreSQL. Integrated automated computer vision microservices.',
      isCurrent: false
    }
  ],
  education: [
    {
      id: 'edu-1',
      institution: 'National Institute of Technology',
      degree: 'Bachelor of Engineering',
      field: 'Computer Science and Engineering',
      year: '2015 - 2019'
    },
    {
      id: 'edu-2',
      institution: 'Stanford University (Online Specialization)',
      degree: 'Master of Science Certificate',
      field: 'Artificial Intelligence & Deep Learning',
      year: '2020'
    }
  ],
  createdAt: '2026-01-15T08:00:00Z'
};

export const SEED_RECRUITER: UserProfile = {
  id: 'rec-sarah-01',
  name: 'Sarah Jenkins',
  email: 'sarah.jenkins@techcorp.io',
  role: 'recruiter',
  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  phone: '+1 (555) 876-5432',
  location: 'New York, NY',
  title: 'Lead Talent Acquisition Partner',
  bio: 'Specializing in identifying top 1% engineering and AI talent across North America and Europe.',
  skills: ['Technical Recruiting', 'Talent Assessment', 'ATS Optimization', 'Executive Search'],
  experience: [],
  education: [],
  createdAt: '2025-11-10T09:00:00Z'
};

export const SEED_CANDIDATES_LIST: UserProfile[] = [
  SEED_CANDIDATE,
  {
    id: 'cand-sneha-02',
    name: 'Sneha Patil',
    email: 'sneha.patil@example.com',
    role: 'candidate',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    phone: '+1 (555) 345-6789',
    location: 'Seattle, WA',
    title: 'Lead Frontend Engineer',
    bio: 'Frontend specialist crafting responsive, accessible, and high-performance Web applications with React, Next.js, and TypeScript.',
    matchScore: 88,
    skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Redux', 'GraphQL', 'Jest'],
    experience: [
      {
        id: 'exp-s1',
        company: 'CloudScale UI',
        role: 'Staff Frontend Architect',
        duration: '2022 - Present',
        description: 'Led UI design system adoption across 14 enterprise micro-frontends. Improved Lighthouse score from 68 to 99.',
        isCurrent: true
      }
    ],
    education: [
      {
        id: 'edu-s1',
        institution: 'University of Washington',
        degree: 'B.S. in Computer Science',
        field: 'Software Engineering',
        year: '2017 - 2021'
      }
    ],
    createdAt: '2026-02-01T10:00:00Z'
  },
  {
    id: 'cand-amit-03',
    name: 'Amit Sharma',
    email: 'amit.sharma@example.com',
    role: 'candidate',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    phone: '+1 (555) 456-7890',
    location: 'Austin, TX',
    title: 'Senior Backend Engineer',
    bio: 'Distributed systems engineer with deep expertise in Go, Java, microservices, and Kubernetes orchestration.',
    matchScore: 85,
    skills: ['Node.js', 'Go', 'PostgreSQL', 'Docker', 'Kubernetes', 'Redis', 'Kafka', 'AWS'],
    experience: [
      {
        id: 'exp-a1',
        company: 'Apex Cloud Systems',
        role: 'Senior Backend Developer',
        duration: '2020 - Present',
        description: 'Designed event-driven backend handling 50k requests/sec with 99.99% uptime.',
        isCurrent: true
      }
    ],
    education: [
      {
        id: 'edu-a1',
        institution: 'Texas A&M University',
        degree: 'B.S. in Computer Engineering',
        field: 'Distributed Systems',
        year: '2016 - 2020'
      }
    ],
    createdAt: '2026-01-20T11:00:00Z'
  },
  {
    id: 'cand-neha-04',
    name: 'Neha Verma',
    email: 'neha.verma@example.com',
    role: 'candidate',
    avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80',
    phone: '+1 (555) 567-8901',
    location: 'Boston, MA',
    title: 'Machine Learning & Data Scientist',
    bio: 'Data Scientist specializing in statistical inference, generative modeling, and customer churn prediction algorithms.',
    matchScore: 82,
    skills: ['Python', 'R', 'TensorFlow', 'Scikit-Learn', 'SQL', 'Tableau', 'BigQuery'],
    experience: [
      {
        id: 'exp-n1',
        company: 'BioData Labs',
        role: 'Data Scientist',
        duration: '2021 - Present',
        description: 'Built predictive disease modeling classifiers achieving 94.2% ROC-AUC score.',
        isCurrent: true
      }
    ],
    education: [
      {
        id: 'edu-n1',
        institution: 'Boston University',
        degree: 'Master of Science in Data Analytics',
        field: 'Machine Learning',
        year: '2019 - 2021'
      }
    ],
    createdAt: '2026-02-10T14:00:00Z'
  }
];

export const SEED_JOBS: Job[] = [
  {
    id: 'job-ai-01',
    title: 'AI Developer',
    department: 'Artificial Intelligence & Research',
    location: 'San Francisco, CA (Hybrid)',
    type: 'Full-time',
    experienceLevel: 'Senior',
    description: 'We are looking for an exceptional Senior AI Developer to design and deploy state-of-the-art multimodal AI systems, agents, and LLM-powered services for our enterprise platform.',
    requirements: [
      '5+ years of software engineering and ML experience',
      'Strong proficiency in Python, PyTorch, Transformers, and modern LLM orchestration',
      'Experience with production vector databases and scalable microservices',
      'Solid foundation in distributed computing and REST/gRPC architectures'
    ],
    requiredSkills: ['Python', 'PyTorch', 'TensorFlow', 'React', 'Kubernetes', 'SQL', 'AWS', 'Docker'],
    salaryRange: '$165,000 - $210,000 / year',
    applicantCount: 42,
    status: 'Active',
    createdAt: '2026-01-10T00:00:00Z'
  },
  {
    id: 'job-be-02',
    title: 'Backend Developer',
    department: 'Platform Engineering',
    location: 'Austin, TX (Remote)',
    type: 'Full-time',
    experienceLevel: 'Senior',
    description: 'Lead backend developer to architect resilient microservices, distributed caching layers, and high-throughput real-time database transactions.',
    requirements: [
      '4+ years building high-scale backend services in Node.js/Go/Java',
      'Expertise in PostgreSQL, indexing, query optimization, and Redis caching',
      'Experience with Kafka, AWS ECS/EKS, and automated CI/CD pipelines'
    ],
    requiredSkills: ['Node.js', 'PostgreSQL', 'Go', 'Docker', 'Kubernetes', 'Redis', 'AWS'],
    salaryRange: '$145,000 - $185,000 / year',
    applicantCount: 38,
    status: 'Active',
    createdAt: '2026-01-12T00:00:00Z'
  },
  {
    id: 'job-fe-03',
    title: 'Frontend Engineer',
    department: 'Product Experience',
    location: 'Seattle, WA (Hybrid)',
    type: 'Full-time',
    experienceLevel: 'Mid',
    description: 'Passionate frontend developer to build responsive, accessible, and delightful interactive interfaces for our rapid-growth analytics suite.',
    requirements: [
      '3+ years professional experience with React, TypeScript, and modern CSS (Tailwind)',
      'Eye for detail, typography, animations, and micro-interactions',
      'Strong experience with state management, client performance tuning, and testing'
    ],
    requiredSkills: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js', 'GraphQL', 'Jest'],
    salaryRange: '$130,000 - $165,000 / year',
    applicantCount: 51,
    status: 'Active',
    createdAt: '2026-01-15T00:00:00Z'
  },
  {
    id: 'job-ds-04',
    title: 'Data Scientist',
    department: 'Analytics & Insights',
    location: 'New York, NY (Remote)',
    type: 'Full-time',
    experienceLevel: 'Senior',
    description: 'Senior Data Scientist to uncover predictive behavioral insights, build customer segmentation models, and collaborate closely with product leaders.',
    requirements: [
      '4+ years practical experience applying statistical learning and predictive algorithms',
      'Proficiency with Python (pandas, numpy, scikit-learn), SQL, and data visualization tools',
      'Demonstrated track record of delivering measurable commercial business value'
    ],
    requiredSkills: ['Python', 'SQL', 'Scikit-Learn', 'TensorFlow', 'Tableau', 'Statistics'],
    salaryRange: '$150,000 - $190,000 / year',
    applicantCount: 25,
    status: 'Active',
    createdAt: '2026-01-18T00:00:00Z'
  }
];

export const SEED_APPLICATIONS: Application[] = [
  {
    id: 'app-rahul-01',
    candidateId: 'cand-rahul-01',
    candidateName: 'Rahul Mehta',
    candidateEmail: 'rahul.mehta@example.com',
    candidateAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    candidateLocation: 'San Francisco, CA',
    jobId: 'job-ai-01',
    jobTitle: 'AI Developer',
    appliedDate: '2026-02-12',
    status: 'Interviewed',
    scores: {
      atsScore: 92,
      interviewScore: 88,
      codingScore: 90,
      aptitudeScore: 80,
      communicationScore: 85,
      behavioralScore: 88,
      overallScore: 91
    },
    notes: 'Exceptional deep learning background and strong system architecture skills.'
  },
  {
    id: 'app-sneha-02',
    candidateId: 'cand-sneha-02',
    candidateName: 'Sneha Patil',
    candidateEmail: 'sneha.patil@example.com',
    candidateAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    candidateLocation: 'Seattle, WA',
    jobId: 'job-fe-03',
    jobTitle: 'Frontend Engineer',
    appliedDate: '2026-02-14',
    status: 'Technical',
    scores: {
      atsScore: 85,
      interviewScore: 90,
      codingScore: 88,
      aptitudeScore: 85,
      communicationScore: 89,
      behavioralScore: 90,
      overallScore: 88
    },
    notes: 'Outstanding UI craftsmanship, deep React ecosystem mastery, and articulate communication.'
  },
  {
    id: 'app-amit-03',
    candidateId: 'cand-amit-03',
    candidateName: 'Amit Sharma',
    candidateEmail: 'amit.sharma@example.com',
    candidateAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    candidateLocation: 'Austin, TX',
    jobId: 'job-be-02',
    jobTitle: 'Backend Developer',
    appliedDate: '2026-02-15',
    status: 'Technical',
    scores: {
      atsScore: 87,
      interviewScore: 84,
      codingScore: 86,
      aptitudeScore: 82,
      communicationScore: 83,
      behavioralScore: 84,
      overallScore: 85
    },
    notes: 'Strong database indexing and concurrency performance design capabilities.'
  },
  {
    id: 'app-neha-04',
    candidateId: 'cand-neha-04',
    candidateName: 'Neha Verma',
    candidateEmail: 'neha.verma@example.com',
    candidateAvatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80',
    candidateLocation: 'Boston, MA',
    jobId: 'job-ds-04',
    jobTitle: 'Data Scientist',
    appliedDate: '2026-02-18',
    status: 'Interviewed',
    scores: {
      atsScore: 82,
      interviewScore: 85,
      codingScore: 80,
      aptitudeScore: 85,
      communicationScore: 82,
      behavioralScore: 80,
      overallScore: 82
    },
    notes: 'Thorough analytical rigor with solid experimental design knowledge.'
  }
];

export const SEED_RESUME_ANALYSIS: ResumeAnalysis = {
  id: 'resume-rahul-01',
  candidateId: 'cand-rahul-01',
  fileName: 'Rahul_Mehta_Resume_2026.pdf',
  uploadedAt: '2026-02-10T14:30:00Z',
  fileSize: '1.4 MB',
  atsCompatibilityScore: 92,
  extractedSkills: [
    'Python',
    'PyTorch',
    'TensorFlow',
    'React',
    'Kubernetes',
    'SQL',
    'Docker',
    'AWS',
    'Transformers',
    'FastAPI',
    'PostgreSQL'
  ],
  strengths: [
    'Deep Learning & LLM deployment specialization with proven scale',
    'Strong background in Transformers, PyTorch, and tokenization pipelines',
    'Experience in production ML infrastructure and Kubernetes orchestration',
    'Proven track record leading high-impact cross-functional engineering pods'
  ],
  missingSkills: [
    'MLOps Pipelines (Kubeflow / MLflow automation)',
    'C++ Engine Optimization for low-latency edge inference'
  ],
  experienceSummary: 'Senior AI Engineer with 5+ years architecting distributed model serving systems at TechCorp and high-throughput data processing microservices at DataPulse Analytics.',
  educationSummary: 'B.E. in Computer Science from National Institute of Technology, followed by Stanford University Graduate Certificate in Artificial Intelligence & Deep Learning.',
  improvementSuggestions: [
    'Clarify scope of AI/ML model deployment metrics (e.g. latency percentiles, throughput p99)',
    'Highlight specific business revenue impact and model accuracy improvements in bullet points',
    'Add relevant open-source contributions or research publications'
  ],
  targetRole: 'Senior AI Developer'
};

export const SEED_INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'iq-1',
    category: 'Introduction',
    question: 'Could you introduce yourself and walk us through your background with production software and AI systems?',
    supportingInstruction: 'Briefly touch on your educational foundation, key engineering milestones, and the technologies you find most impactful.',
    expectedKeyPoints: ['Clear career narrative', 'Mention of core tech stack', 'Professional articulation'],
    idealDurationSeconds: 120
  },
  {
    id: 'iq-2',
    category: 'Core Concepts',
    question: 'How do you approach latency vs. throughput trade-offs when deploying large neural network models in production?',
    supportingInstruction: 'Discuss batching strategies, dynamic quantization, GPU caching, and asynchronous inference queues.',
    expectedKeyPoints: ['Dynamic batching', 'Quantization (INT8/FP16)', 'GPU memory management', 'Async job processing'],
    idealDurationSeconds: 180
  },
  {
    id: 'iq-3',
    category: 'Advanced Questions',
    question: 'Explain your experience with production-grade AI systems and addressing hallucinations or model drift.',
    supportingInstruction: 'Focus on a specific project where you deployed a model. Discuss the challenge, your approach, and how you measured success.',
    expectedKeyPoints: ['RAG architectures', 'Grounding & guardrails', 'Telemetry and drift metrics', 'Human-in-the-loop evaluation'],
    idealDurationSeconds: 240
  },
  {
    id: 'iq-4',
    category: 'System Design',
    question: 'Design a real-time semantic document search engine that parses 100,000 PDFs daily with sub-second querying.',
    supportingInstruction: 'Outline the data ingestion pipeline, embedding generation, vector indexing, caching layer, and failover strategy.',
    expectedKeyPoints: ['Ingestion workers', 'Vector database selection (e.g., Pinecone/Milvus/pgvector)', 'Hybrid search re-ranking', 'Distributed caches'],
    idealDurationSeconds: 300
  },
  {
    id: 'iq-5',
    category: 'Behavioral',
    question: 'Describe a situation where you had a strong technical disagreement with a teammate. How did you resolve it constructively?',
    supportingInstruction: 'Emphasize empathy, data-driven prototyping, objective evaluation, and alignment on shared business goals.',
    expectedKeyPoints: ['Constructive dialogue', 'Evidence-based benchmarking', 'Focus on customer impact', 'Team cohesion'],
    idealDurationSeconds: 150
  }
];

export const SEED_TESTS: AssessmentTest[] = [
  {
    id: 'test-aptitude-01',
    title: 'Aptitude & Logical Reasoning',
    category: 'Aptitude Test',
    description: 'General cognitive ability, numerical analysis, pattern recognition, and logical deduction under time constraints.',
    totalQuestions: 20,
    durationMinutes: 30,
    totalPoints: 20,
    passingScore: 14,
    questions: [
      {
        id: 'apt-q1',
        question: 'A server cluster processes 480 requests in 12 seconds with 4 worker nodes. If 2 nodes fail, how many requests will the remaining 2 nodes process in 30 seconds at the same rate?',
        type: 'mcq',
        options: ['600 requests', '400 requests', '720 requests', '300 requests'],
        correctOptionIndex: 0,
        explanation: 'Each node processes 480 / (12 * 4) = 10 req/sec. With 2 nodes: 2 * 10 * 30 = 600 requests.',
        points: 1
      },
      {
        id: 'apt-q2',
        question: 'Complete the sequence: 3, 7, 15, 31, 63, ?',
        type: 'mcq',
        options: ['127', '125', '129', '118'],
        correctOptionIndex: 0,
        explanation: 'Each term is 2n + 1 (or 2^(n+1) - 1). 63 * 2 + 1 = 127.',
        points: 1
      },
      {
        id: 'apt-q3',
        question: 'If all Algorithms are Logic, and some Logic is Mathematics, which of the following is logically guaranteed?',
        type: 'mcq',
        options: ['All Algorithms are Mathematics', 'Some Algorithms might be Mathematics', 'No Algorithms are Mathematics', 'All Mathematics are Logic'],
        correctOptionIndex: 1,
        explanation: 'Standard syllogistic deduction: Some Logic is Math does not strictly force all Algorithms to be Math, but allows compatibility.',
        points: 1
      },
      {
        id: 'apt-q4',
        question: 'A database query execution time decreases by 20% after adding an index, then by an additional 25% after query optimization. What is the total percentage reduction in execution time?',
        type: 'mcq',
        options: ['45%', '40%', '35%', '50%'],
        correctOptionIndex: 1,
        explanation: 'Remaining time = 0.8 * 0.75 = 0.60. Hence the total reduction is 1 - 0.60 = 40%.',
        points: 1
      }
    ]
  },
  {
    id: 'test-coding-02',
    title: 'Data Structures & Algorithms Challenge',
    category: 'Coding Test',
    description: 'Solve real-world algorithmic problems with optimal time and space complexity in TypeScript / JavaScript.',
    totalQuestions: 2,
    durationMinutes: 45,
    totalPoints: 100,
    passingScore: 70,
    questions: [
      {
        id: 'code-q1',
        question: 'Implement a function `twoSumTarget(nums: number[], target: number): number[]` that returns indices of two numbers that add up to target in O(N) time.',
        type: 'coding',
        starterCode: `function twoSumTarget(nums: number[], target: number): number[] {
  const map = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement)!, i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
        sampleInput: 'nums = [2, 7, 11, 15], target = 9',
        sampleOutput: '[0, 1]',
        explanation: 'Using a hash map gives O(N) time and O(N) space.',
        points: 50
      },
      {
        id: 'code-q2',
        question: 'Implement `isValidParentheses(s: string): boolean` to validate whether brackets `()`, `{}`, `[]` are properly matched and nested.',
        type: 'coding',
        starterCode: `function isValidParentheses(s: string): boolean {
  const stack: string[] = [];
  const pairs: Record<string, string> = { ')': '(', '}': '{', ']': '[' };
  for (const char of s) {
    if (['(', '{', '['].includes(char)) {
      stack.push(char);
    } else if (pairs[char]) {
      if (stack.pop() !== pairs[char]) return false;
    }
  }
  return stack.length === 0;
}`,
        sampleInput: 's = "{[()]}"',
        sampleOutput: 'true',
        explanation: 'Stack-based matching runs in O(N) time and O(N) space.',
        points: 50
      }
    ]
  },
  {
    id: 'test-tech-03',
    title: 'Technical AI & Systems MCQs',
    category: 'Technical MCQs',
    description: 'Assesses technical depth in machine learning theory, transformer architectures, vector embeddings, and web systems.',
    totalQuestions: 15,
    durationMinutes: 20,
    totalPoints: 30,
    passingScore: 22,
    questions: [
      {
        id: 'tech-q1',
        question: 'What is the primary computational bottleneck in the standard Self-Attention mechanism as sequence length (N) scales?',
        type: 'mcq',
        options: ['O(N^2) time and memory complexity', 'O(N log N) sorting overhead', 'Linear feed-forward dimension scaling', 'O(1) memory caching constraint'],
        correctOptionIndex: 0,
        explanation: 'Standard multi-head attention computes pairwise query-key dot products resulting in O(N^2) memory and compute.',
        points: 2
      },
      {
        id: 'tech-q2',
        question: 'Which vector index algorithm is typically preferred for billion-scale approximate nearest neighbor (ANN) search with sub-millisecond latency?',
        type: 'mcq',
        options: ['HNSW (Hierarchical Navigable Small World)', 'Linear Brute-Force Scan', 'B+ Tree Indexing', 'Prefix Trie Search'],
        correctOptionIndex: 0,
        explanation: 'HNSW builds multi-layer graphs offering logarithmic search scaling and superior recall rates.',
        points: 2
      },
      {
        id: 'tech-q3',
        question: 'In React 18/19, what does Concurrent Rendering allow the engine to do?',
        type: 'mcq',
        options: ['Pause, interrupt, and resume component rendering without blocking the main UI thread', 'Run JavaScript threads in separate Web Assembly cores simultaneously', 'Bypass virtual DOM reconciliation entirely', 'Guarantee synchronous layout triggers on all state changes'],
        correctOptionIndex: 0,
        explanation: 'Concurrent React prioritizes urgent interactions (typing, hovering) over non-urgent background render passes.',
        points: 2
      }
    ]
  }
];

export const SEED_TEST_ATTEMPTS: TestAttempt[] = [
  {
    id: 'att-01',
    testId: 'test-coding-02',
    testTitle: 'Data Structures & Algorithms Challenge',
    category: 'Coding Test',
    candidateId: 'cand-rahul-01',
    completedAt: '2026-02-14T16:20:00Z',
    score: 75,
    totalPoints: 100,
    percentage: 75,
    status: 'Passed',
    timeSpentMinutes: 38,
    answers: { 'code-q1': 'submitted', 'code-q2': 'submitted' }
  },
  {
    id: 'att-02',
    testId: 'test-aptitude-01',
    testTitle: 'Aptitude & Logical Reasoning',
    category: 'Aptitude Test',
    candidateId: 'cand-rahul-01',
    completedAt: '2026-02-13T11:45:00Z',
    score: 16,
    totalPoints: 20,
    percentage: 80,
    status: 'Passed',
    timeSpentMinutes: 22,
    answers: { 'apt-q1': 0, 'apt-q2': 0, 'apt-q3': 1, 'apt-q4': 1 }
  }
];
