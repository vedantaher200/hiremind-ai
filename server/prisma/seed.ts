import { PrismaClient, Role, CompanyVerificationStatus, PostingStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding HireMind AI database...');

  // 1. Create Platform Admin
  const adminPassword = await bcrypt.hash('AdminPassword123!', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@hiremind.ai' },
    update: {},
    create: {
      email: 'admin@hiremind.ai',
      name: 'HireMind Platform Admin',
      passwordHash: adminPassword,
      role: Role.ADMIN,
      isEmailVerified: true,
      title: 'Super Administrator',
      location: 'Global Ops'
    }
  });
  console.log(`Admin ready: ${admin.email}`);

  // 2. Create Sample Approved Recruiter & Company
  const recruiterPassword = await bcrypt.hash('Recruiter123!', 10);
  const recruiter = await prisma.user.upsert({
    where: { email: 'recruiter@techcorp.com' },
    update: {},
    create: {
      email: 'recruiter@techcorp.com',
      name: 'Sarah Jenkins',
      passwordHash: recruiterPassword,
      role: Role.RECRUITER,
      isEmailVerified: true,
      title: 'Talent Acquisition Director',
      location: 'San Francisco, CA'
    }
  });

  const company = await prisma.company.upsert({
    where: { recruiterId: recruiter.id },
    update: { verificationStatus: CompanyVerificationStatus.APPROVED },
    create: {
      recruiterId: recruiter.id,
      name: 'TechCorp Solutions',
      website: 'https://techcorp.com',
      industry: 'Software & Cloud Services',
      description: 'Global enterprise software company scaling next-generation AI platforms.',
      location: 'San Francisco, CA',
      contactEmail: 'careers@techcorp.com',
      companySize: '50-200 employees',
      verificationStatus: CompanyVerificationStatus.APPROVED,
      verifiedBy: admin.id,
      verifiedAt: new Date()
    }
  });

  // 3. Create Sample Jobs
  const job1 = await prisma.job.create({
    data: {
      recruiterId: recruiter.id,
      companyId: company.id,
      title: 'Senior Full Stack Developer',
      department: 'Engineering',
      description: 'Looking for a senior developer proficient in React, Node.js, and PostgreSQL to design scalable systems.',
      requiredSkills: ['React', 'Node.js', 'PostgreSQL', 'TypeScript'],
      preferredSkills: ['Prisma', 'Docker', 'AWS'],
      experienceLevel: 'Senior',
      location: 'Remote',
      workMode: 'Remote',
      employmentType: 'Full-time',
      salaryRange: '$120,000 - $150,000',
      openings: 2,
      status: PostingStatus.ACTIVE
    }
  });

  const job2 = await prisma.job.create({
    data: {
      recruiterId: recruiter.id,
      companyId: company.id,
      title: 'AI / Machine Learning Engineer',
      department: 'AI Research',
      description: 'Develop and evaluate state-of-the-art LLM fine-tuning and retrieval pipelines.',
      requiredSkills: ['Python', 'PyTorch', 'TensorFlow', 'LLMs'],
      preferredSkills: ['LangChain', 'FastAPI', 'Vector Databases'],
      experienceLevel: 'Mid',
      location: 'New York, NY',
      workMode: 'Hybrid',
      employmentType: 'Full-time',
      salaryRange: '$130,000 - $160,000',
      openings: 1,
      status: PostingStatus.ACTIVE
    }
  });

  // 4. Create Sample Internships
  const internship1 = await prisma.internship.create({
    data: {
      recruiterId: recruiter.id,
      companyId: company.id,
      title: 'Frontend Web Development Intern',
      department: 'Engineering',
      description: '3-month summer internship building responsive user interfaces in modern React & Tailwind.',
      skills: ['React', 'TypeScript', 'Tailwind CSS', 'HTML/CSS'],
      eligibility: 'Pre-final and Final Year Students',
      location: 'Remote',
      mode: 'Remote',
      duration: '3 Months',
      stipend: '$1,200/month',
      openings: 3,
      status: PostingStatus.ACTIVE
    }
  });

  const internship2 = await prisma.internship.create({
    data: {
      recruiterId: recruiter.id,
      companyId: company.id,
      title: 'Data Science & Analytics Intern',
      department: 'Analytics',
      description: 'Work alongside data scientists on exploratory data analysis and predictive modeling.',
      skills: ['Python', 'SQL', 'Pandas', 'Tableau'],
      eligibility: 'Degree in CS, Data Science, or Mathematics',
      location: 'San Francisco, CA',
      mode: 'Hybrid',
      duration: '6 Months',
      stipend: '$1,500/month',
      openings: 2,
      status: PostingStatus.ACTIVE
    }
  });

  // 5. Create Assessment Tests
  await prisma.assessmentTest.create({
    data: {
      title: 'General Aptitude & Logical Reasoning',
      description: 'Quantitative aptitude, logical deduction, and pattern analysis.',
      category: 'Aptitude Test',
      durationMinutes: 15,
      totalQuestions: 5,
      totalPoints: 25,
      passingScore: 60,
      questions: [
        {
          id: 'apt-1',
          type: 'mcq',
          question: 'If a train runs at 72 km/h, what is its speed in meters per second?',
          options: ['15 m/s', '20 m/s', '25 m/s', '30 m/s'],
          correctOptionIndex: 1,
          points: 5
        },
        {
          id: 'apt-2',
          type: 'mcq',
          question: 'Which number comes next in the sequence: 2, 6, 12, 20, 30, ...?',
          options: ['40', '42', '44', '46'],
          correctOptionIndex: 1,
          points: 5
        },
        {
          id: 'apt-3',
          type: 'mcq',
          question: 'If 5 workers complete a project in 12 days, how many days will 6 workers take at the same pace?',
          options: ['8 days', '10 days', '11 days', '14 days'],
          correctOptionIndex: 1,
          points: 5
        },
        {
          id: 'apt-4',
          type: 'mcq',
          question: 'All roses are flowers. Some flowers fade quickly. Therefore:',
          options: ['All roses fade quickly', 'Some roses may fade quickly', 'No roses fade quickly', 'None of the above'],
          correctOptionIndex: 1,
          points: 5
        },
        {
          id: 'apt-5',
          type: 'mcq',
          question: 'A shopkeeper sells an article at 20% profit. If the cost price is $150, what is the selling price?',
          options: ['$170', '$180', '$190', '$200'],
          correctOptionIndex: 1,
          points: 5
        }
      ]
    }
  });

  await prisma.assessmentTest.create({
    data: {
      title: 'Full Stack & Software Engineering Core',
      description: 'Frontend fundamentals, REST APIs, TypeScript, and database principles.',
      category: 'Technical Test',
      durationMinutes: 20,
      totalQuestions: 5,
      totalPoints: 25,
      passingScore: 60,
      questions: [
        {
          id: 'tech-1',
          type: 'mcq',
          question: 'What is the time complexity of searching by key in a standard hash table on average?',
          options: ['O(n)', 'O(log n)', 'O(1)', 'O(n^2)'],
          correctOptionIndex: 2,
          points: 5
        },
        {
          id: 'tech-2',
          type: 'mcq',
          question: 'Which HTTP status code signifies a resource was successfully created?',
          options: ['200 OK', '201 Created', '204 No Content', '301 Moved Permanently'],
          correctOptionIndex: 1,
          points: 5
        },
        {
          id: 'tech-3',
          type: 'mcq',
          question: 'What ACID property guarantees that all database transactions either complete fully or roll back completely?',
          options: ['Atomicity', 'Consistency', 'Isolation', 'Durability'],
          correctOptionIndex: 0,
          points: 5
        },
        {
          id: 'tech-4',
          type: 'mcq',
          question: 'In React, which hook is used to perform side effects in functional components?',
          options: ['useState', 'useMemo', 'useEffect', 'useCallback'],
          correctOptionIndex: 2,
          points: 5
        },
        {
          id: 'tech-5',
          type: 'mcq',
          question: 'Which of the following is a non-relational document database?',
          options: ['PostgreSQL', 'MySQL', 'MongoDB', 'Oracle DB'],
          correctOptionIndex: 2,
          points: 5
        }
      ]
    }
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
