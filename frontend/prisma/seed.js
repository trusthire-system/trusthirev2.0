const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding...');

    // Clean existing data
    await prisma.application.deleteMany({});
    await prisma.job.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.company.deleteMany({});
    await prisma.profile.deleteMany({});

    const passwordHash = await bcrypt.hash('password123', 10);

    // 1. Create Admin
    await prisma.user.create({
        data: {
            email: 'admin@trusthire.com',
            name: 'System Admin',
            passwordHash,
            role: 'ADMIN',
            isVerified: true
        },
    });

    // 2. Create Companies
    const techCorp = await prisma.company.create({
        data: {
            name: 'BharatTech Solutions',
            industry: 'IT',
            description: 'Leading software development firm specializing in AI and Cloud for the Indian ecosystem.',
            location: 'Bengaluru, KA',
            website: 'https://bharattech.io',
            organizationSize: '500-1000',
            isVerified: true
        }
    });

    const healthPlus = await prisma.company.create({
        data: {
            name: 'Arogya Health',
            industry: 'Healthcare',
            description: 'Premier multi-specialty healthcare provider across India.',
            location: 'Mumbai, MH',
            website: 'https://arogya.org.in',
            organizationSize: '5000+',
            isVerified: true
        }
    });

    const financeGroup = await prisma.company.create({
        data: {
            name: 'Mudra Finance Group',
            industry: 'Finance',
            description: 'Investment and accounting services for the Indian markets.',
            location: 'New Delhi, DL',
            website: 'https://mudrafinance.com',
            organizationSize: '1000-5000',
            isVerified: true
        }
    });

    const eduStream = await prisma.company.create({
        data: {
            name: 'Shiksha Learning',
            industry: 'Education',
            description: 'Innovative online learning platform for K-12 and competitive exams.',
            location: 'Hyderabad, TS',
            website: 'https://shiksha.edu.in',
            organizationSize: '100-500',
            isVerified: true
        }
    });

    const greenEnergy = await prisma.company.create({
        data: {
            name: 'Urja Energy Corp',
            industry: 'Engineering',
            description: 'Sustainable energy solutions focusing on solar and wind power in rural India.',
            location: 'Pune, MH',
            website: 'https://urja-energy.com',
            organizationSize: '500-1000',
            isVerified: false
        }
    });

    const vividMarketing = await prisma.company.create({
        data: {
            name: 'Vistar Marketing',
            industry: 'Marketing',
            description: 'Full-service digital marketing agency driving growth for Indian consumer brands.',
            location: 'Noida, UP',
            website: 'https://vistarmarketing.in',
            organizationSize: '50-100',
            isVerified: true
        }
    });

    // 3. Create HR Users
    const hrTech = await prisma.user.create({
        data: {
            email: 'hr@bharattech.io',
            name: 'Alice Johnson',
            passwordHash,
            role: 'HR_USER',
            isVerified: true,
            companyId: techCorp.id
        }
    });

    const hrHealth = await prisma.user.create({
        data: {
            email: 'recruitment@arogya.org.in',
            name: 'Dr. James Smith',
            passwordHash,
            role: 'HR_USER',
            isVerified: true,
            companyId: healthPlus.id
        }
    });

    const hrEdu = await prisma.user.create({
        data: {
            email: 'hiring@shiksha.edu.in',
            name: 'Mary Parker',
            passwordHash,
            role: 'HR_USER',
            isVerified: true,
            companyId: eduStream.id
        }
    });

    const hrGreen = await prisma.user.create({
        data: {
            email: 'careers@urja-energy.com',
            name: 'John Doe',
            passwordHash,
            role: 'HR_USER',
            isVerified: true,
            companyId: greenEnergy.id
        }
    });

    // 4. Create Candidates and Profiles
    const candidatesData = [
        {
            name: 'Sarah Chen',
            email: 'sarah.chen@gmail.com',
            role: 'CANDIDATE',
            profile: {
                skills: 'React, Node.js, TypeScript, Docker, AWS',
                experienceYears: 4,
                education: 'B.S. in Computer Science',
                ocrRawText: 'Sarah Chen. Experienced Full Stack Dev. Skills: React, Node.js, TypeScript, Docker, AWS. 4 years at CloudScale.'
            }
        },
        {
            name: 'Michael Ross',
            email: 'm.ross@gmail.com',
            role: 'CANDIDATE',
            profile: {
                skills: 'Patient care, ICU, Emergency response, Nursing, ACLS',
                experienceYears: 6,
                education: 'Bachelor of Science in Nursing (BSN)',
                ocrRawText: 'Michael Ross, RN. 6 years ICU experience. Certified in ACLS and PALS. Expert in patient care.'
            }
        },
        {
            name: 'Elena Rodriguez',
            email: 'elena.rod@gmail.com',
            role: 'CANDIDATE',
            profile: {
                skills: 'Taxation, Auditing, QuickBooks, GAAP, Financial Analysis',
                experienceYears: 3,
                education: 'Masters in Accountancy',
                ocrRawText: 'Elena Rodriguez. CPA Candidate. Skills: Taxation, Auditing, QuickBooks, GAAP. Experience at Big 4 Firm.'
            }
        },
        {
            name: 'David Kim',
            email: 'd.kim.tech@gmail.com',
            role: 'CANDIDATE',
            profile: {
                skills: 'Python, PostgreSQL, Kubernetes, Redis, Java',
                experienceYears: 5,
                education: 'M.S. in Software Systems',
                ocrRawText: 'David Kim. Backend specialist. Python, Kubernetes, Redis. High performance systems expert.'
            }
        },
        {
            name: 'James Wilson',
            email: 'j.wilson@edu.com',
            role: 'CANDIDATE',
            profile: {
                skills: 'Curriculum development, E-learning, Project Management, Pedagogy',
                experienceYears: 8,
                education: 'M.Ed. in Instructional Design',
                ocrRawText: 'James Wilson. 8 years in educational technology and curriculum design. Expert in LMS and pedagogy.'
            }
        },
        {
            name: 'Linda Garcia',
            email: 'linda.marketing@gmail.com',
            role: 'CANDIDATE',
            profile: {
                skills: 'SEO, SEM, Content Strategy, Google Analytics, Social Media Marketing',
                experienceYears: 5,
                education: 'B.A. in Marketing',
                ocrRawText: 'Linda Garcia. Digital Marketing Specialist. Proven track record in SEO/SEM and content growth.'
            }
        },
        {
            name: 'Robert Taylor',
            email: 'robert.eng@gmail.com',
            role: 'CANDIDATE',
            profile: {
                skills: 'Solar PV Systems, AutoCAD, Project Engineering, Sustainable Energy',
                experienceYears: 7,
                education: 'B.E. in Electrical Engineering',
                ocrRawText: 'Robert Taylor. Electrical Engineer focused on renewable energy. Certified Solar PV Professional.'
            }
        },
        {
            name: 'Sophia Martinez',
            email: 'sophia.data@gmail.com',
            role: 'CANDIDATE',
            profile: {
                skills: 'Machine Learning, Python, R, TensorFlow, Data Visualization',
                experienceYears: 2,
                education: 'Ph.D. in Data Science',
                ocrRawText: 'Sophia Martinez, PhD. Data Scientist with focus on deep learning and predictive modeling.'
            }
        }
    ];

    const users = [];
    for (const cand of candidatesData) {
        const profile = await prisma.profile.create({ data: cand.profile });
        const user = await prisma.user.create({
            data: {
                name: cand.name,
                email: cand.email,
                passwordHash,
                role: cand.role,
                isVerified: true,
                profileId: profile.id
            }
        });
        users.push(user);
    }

    // 5. Create Jobs
    const job1 = await prisma.job.create({
        data: {
            title: 'Senior Frontend Developer',
            description: 'We are looking for a React expert to lead our dashboard team in Bengaluru.',
            requirements: 'React, TypeScript, CSS, Node.js',
            preferred: 'Experience with Recharts and Tailwind',
            industry: 'IT',
            experienceLevel: '3-10 Years',
            salaryRange: '₹18,00,000 - ₹28,00,000 PA',
            vacancyCount: 2,
            companyId: techCorp.id
        }
    });

    const job2 = await prisma.job.create({
        data: {
            title: 'ICU Registered Nurse',
            description: 'Join our critical care unit in Mumbai for high-impact patient care.',
            requirements: 'Nursing, Patient care, ICU',
            preferred: 'ACLS Certification',
            industry: 'Healthcare',
            experienceLevel: '2+ Years',
            salaryRange: '₹6,00,000 - ₹10,00,000 PA',
            vacancyCount: 3,
            companyId: healthPlus.id
        }
    });

    const job3 = await prisma.job.create({
        data: {
            title: 'Senior Accountant',
            description: 'Manage corporate audits and tax filings (GST, Income Tax) for international clients.',
            requirements: 'Taxation, Auditing, GAAP, GST',
            preferred: 'CA or CMA License',
            industry: 'Finance',
            experienceLevel: '5 Years',
            salaryRange: '₹12,00,000 - ₹18,00,000 PA',
            vacancyCount: 1,
            companyId: financeGroup.id
        }
    });

    const job4 = await prisma.job.create({
        data: {
            title: 'Curriculum Designer',
            description: 'Design and develop engaging online courses for competitive exams in Hyderabad.',
            requirements: 'Curriculum development, E-learning, Pedagogy',
            preferred: 'Experience with Articulate Storyline',
            industry: 'Education',
            experienceLevel: '4+ Years',
            salaryRange: '₹8,00,000 - ₹14,00,000 PA',
            vacancyCount: 2,
            companyId: eduStream.id
        }
    });

    const job5 = await prisma.job.create({
        data: {
            title: 'Solar Panel Engineer',
            description: 'Lead the design and implementation of large-scale solar installations in Pune.',
            requirements: 'Solar PV Systems, Electrical Engineering, Project Management',
            preferred: 'Experience with Indian energy grid standards',
            industry: 'Engineering',
            experienceLevel: '5+ Years',
            salaryRange: '₹14,00,000 - ₹22,00,000 PA',
            vacancyCount: 1,
            companyId: greenEnergy.id
        }
    });

    const job6 = await prisma.job.create({
        data: {
            title: 'Data Scientist',
            description: 'Use advanced analytics and ML to solve complex business problems for the Indian market.',
            requirements: 'Machine Learning, Python, Statistical Modeling',
            preferred: 'Experience with PyTorch or TensorFlow',
            industry: 'IT',
            experienceLevel: '2+ Years',
            salaryRange: '₹15,00,000 - ₹25,00,000 PA',
            vacancyCount: 2,
            companyId: techCorp.id
        }
    });

    const job7 = await prisma.job.create({
        data: {
            title: 'Cloud Solutions Architect',
            description: 'Design and implement scalable cloud infrastructure for enterprise clients in Bengaluru.',
            requirements: 'AWS, Azure, Terraform, Kubernetes',
            preferred: 'AWS Solutions Architect Professional certification',
            industry: 'IT',
            experienceLevel: '7+ Years',
            salaryRange: '₹25,00,000 - ₹45,00,000 PA',
            vacancyCount: 1,
            companyId: techCorp.id
        }
    });

    const job8 = await prisma.job.create({
        data: {
            title: 'Staff Nurse - Emergency Dept',
            description: 'Provide high-quality care in our fast-paced Emergency Department in Mumbai.',
            requirements: 'Nursing, BLS, ACLS, Emergency care',
            preferred: 'CEN certification',
            industry: 'Healthcare',
            experienceLevel: '1-3 Years',
            salaryRange: '₹5,00,000 - ₹8,50,000 PA',
            vacancyCount: 5,
            companyId: healthPlus.id
        }
    });

    const job9 = await prisma.job.create({
        data: {
            title: 'Financial Analyst',
            description: 'Support strategic decision-making through financial modeling and analysis in Delhi.',
            requirements: 'Financial Modeling, Excel, SQL, Accounting',
            preferred: 'CFA Level 1',
            industry: 'Finance',
            experienceLevel: '2-4 Years',
            salaryRange: '₹10,00,000 - ₹16,00,000 PA',
            vacancyCount: 2,
            companyId: financeGroup.id
        }
    });

    const job10 = await prisma.job.create({
        data: {
            title: 'Digital Marketing Manager',
            description: 'Lead our digital marketing efforts for Indian retail brands in Noida.',
            requirements: 'SEO, SEM, Social Media, Analytics',
            preferred: 'Experience in Indian B2B market',
            industry: 'Marketing',
            experienceLevel: '5+ Years',
            salaryRange: '₹12,00,000 - ₹20,00,000 PA',
            vacancyCount: 1,
            companyId: vividMarketing.id
        }
    });

    const job11 = await prisma.job.create({
        data: {
            title: 'Wind Energy Consultant',
            description: 'Advise clients on wind farm feasibility in Gujarat and Rajasthan.',
            requirements: 'Wind Turbine Technology, Environmental Science, Project Management',
            preferred: 'Master\'s in Renewable Energy',
            industry: 'Engineering',
            experienceLevel: '4+ Years',
            salaryRange: '₹14,00,000 - ₹24,00,000 PA',
            vacancyCount: 2,
            companyId: greenEnergy.id
        }
    });

    // 6. Create Applications
    // job1: Senior Frontend Dev (Sarah, David apply)
    await prisma.application.create({
        data: {
            jobId: job1.id,
            applicantId: users[0].id, // Sarah
            matchScore: 92.5,
            certificateScore: 10,
            linkScore: 15,
            finalScore: 88.0,
            skillGap: '[]',
            isRecommended: true,
            status: 'PENDING'
        }
    });

    await prisma.application.create({
        data: {
            jobId: job1.id,
            applicantId: users[3].id, // David
            matchScore: 45.0,
            certificateScore: 5,
            linkScore: 10,
            finalScore: 35.0,
            skillGap: '["React", "TypeScript"]',
            isRecommended: false,
            status: 'REJECTED'
        }
    });

    await prisma.application.create({
        data: {
            jobId: job1.id,
            applicantId: users[7].id, // Sophia
            matchScore: 65.0,
            certificateScore: 20,
            linkScore: 10,
            finalScore: 60.0,
            skillGap: '["CSS", "Frontend Experience"]',
            isRecommended: false,
            status: 'PENDING'
        }
    });

    // job2: ICU Nurse (Michael applies)
    await prisma.application.create({
        data: {
            jobId: job2.id,
            applicantId: users[1].id, // Michael
            matchScore: 98.0,
            certificateScore: 30,
            linkScore: 5,
            finalScore: 95.0,
            skillGap: '[]',
            isRecommended: true,
            status: 'SELECTED'
        }
    });

    await prisma.application.create({
        data: {
            jobId: job2.id,
            applicantId: users[0].id, // Sarah (Tech person applying for nursing)
            matchScore: 5.0,
            certificateScore: 0,
            linkScore: 0,
            finalScore: 2.0,
            skillGap: '["Nursing", "Patient care", "ICU"]',
            isRecommended: false,
            status: 'REJECTED'
        }
    });

    // job3: Senior Accountant (Elena applies)
    await prisma.application.create({
        data: {
            jobId: job3.id,
            applicantId: users[2].id, // Elena
            matchScore: 85.0,
            certificateScore: 20,
            linkScore: 10,
            finalScore: 82.0,
            skillGap: '["CPA License"]',
            isRecommended: true,
            status: 'PENDING'
        }
    });

    await prisma.application.create({
        data: {
            jobId: job3.id,
            applicantId: users[5].id, // Linda
            matchScore: 40.0,
            certificateScore: 10,
            linkScore: 5,
            finalScore: 32.0,
            skillGap: '["Taxation", "Auditing", "GAAP"]',
            isRecommended: false,
            status: 'PENDING'
        }
    });

    // job4: Curriculum Designer (James applies)
    await prisma.application.create({
        data: {
            jobId: job4.id,
            applicantId: users[4].id, // James
            matchScore: 95.0,
            certificateScore: 15,
            linkScore: 10,
            finalScore: 92.0,
            skillGap: '[]',
            isRecommended: true,
            status: 'PENDING'
        }
    });

    // job5: Solar Panel Engineer (Robert applies)
    await prisma.application.create({
        data: {
            jobId: job5.id,
            applicantId: users[6].id, // Robert
            matchScore: 88.0,
            certificateScore: 25,
            linkScore: 5,
            finalScore: 85.0,
            skillGap: '[]',
            isRecommended: true,
            status: 'ON_HOLD'
        }
    });

    // job6: Data Scientist (Sophia applies)
    await prisma.application.create({
        data: {
            jobId: job6.id,
            applicantId: users[7].id, // Sophia
            matchScore: 94.0,
            certificateScore: 40,
            linkScore: 10,
            finalScore: 91.0,
            skillGap: '[]',
            isRecommended: true,
            status: 'PENDING'
        }
    });

    await prisma.application.create({
        data: {
            jobId: job6.id,
            applicantId: users[3].id, // David
            matchScore: 78.0,
            certificateScore: 15,
            linkScore: 10,
            finalScore: 72.0,
            skillGap: '["Machine Learning", "TensorFlow"]',
            isRecommended: true,
            status: 'PENDING'
        }
    });

    console.log('Seeding finished successfully.');

}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
