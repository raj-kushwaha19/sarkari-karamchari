require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Complaint = require('../src/models/Complaint');
const DepartmentDirectory = require('../src/models/DepartmentDirectory');
const Representative = require('../src/models/Representative');

const seed = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('❌ MONGO_URI not set. Copy .env.example to .env and fill in your values.');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing seed data
    await Promise.all([
      User.deleteMany({}),
      Complaint.deleteMany({}),
      DepartmentDirectory.deleteMany({}),
      Representative.deleteMany({}),
    ]);
    console.log('🗑️ Cleared existing data');

    // Seed Users
    const [user1, adminUser] = await User.create([
      { googleId: 'demo_google_001', name: 'Ramesh Kumar', email: 'ramesh.demo@example.com', role: 'user' },
      { googleId: 'demo_google_admin', name: 'Admin User', email: 'admin@genz-solutions.demo', role: 'admin' },
    ]);
    console.log('✅ Users seeded');

    // Seed Complaints
    const now = new Date();
    const fourDaysAgo = new Date(now - 4 * 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now - 2 * 24 * 60 * 60 * 1000);

    await Complaint.create([
      {
        userRef: user1._id,
        department: 'Municipal Corporation',
        location: { pinCode: '110001' },
        status: 'submitted',
        description: {
          raw: 'There is a large pothole on Main Street near the market that has been there for 3 weeks and is causing accidents.',
          aiFormatted: 'Subject: Urgent: Pothole on Main Street, Connaught Place\n\nRespected Sir/Madam,\n\nI would like to bring to your attention a serious road hazard...',
        },
        timeline: [
          { stage: 'submitted', timestamp: fourDaysAgo, note: 'Complaint filed by citizen' },
        ],
        lastUpdatedAt: fourDaysAgo,
        escalationLevel: 0,
        followUpSentAt: null,
      },
      {
        userRef: user1._id,
        department: 'Electricity Board',
        location: { pinCode: '110002' },
        status: 'department_received',
        description: {
          raw: 'Power cuts happening daily for 4-5 hours in our locality since last week.',
          aiFormatted: 'Subject: Daily Power Outages - Urgent Resolution Required\n\nRespected Sir/Madam...',
        },
        timeline: [
          { stage: 'submitted', timestamp: twoDaysAgo, note: 'Complaint filed by citizen' },
          { stage: 'department_received', timestamp: new Date(twoDaysAgo.getTime() + 3600000), note: 'Acknowledged by department' },
        ],
        lastUpdatedAt: new Date(twoDaysAgo.getTime() + 3600000),
        escalationLevel: 0,
      },
      {
        userRef: user1._id,
        department: 'Water Supply Department',
        location: { pinCode: '110003' },
        status: 'resolved',
        description: {
          raw: 'No water supply for the past 5 days. Families in the area are suffering.',
          aiFormatted: 'Subject: Critical Water Supply Disruption\n\nRespected Sir/Madam...',
        },
        timeline: [
          { stage: 'submitted', timestamp: new Date(now - 7 * 24 * 60 * 60 * 1000), note: 'Complaint filed' },
          { stage: 'department_received', timestamp: new Date(now - 6 * 24 * 60 * 60 * 1000), note: 'Forwarded to field team' },
          { stage: 'resolved', timestamp: new Date(now - 1 * 24 * 60 * 60 * 1000), note: 'Water supply restored. Issue was a broken main valve.' },
        ],
        lastUpdatedAt: new Date(now - 1 * 24 * 60 * 60 * 1000),
        escalationLevel: 0,
      },
    ]);
    console.log('✅ Complaints seeded');

    // Seed Department Directory
    await DepartmentDirectory.create([
      {
        name: 'Municipal Corporation',
        jurisdiction: 'Urban Local Body',
        officialEmail: 'complaints@mcdelhi.demo.gov.in',
        contactInfo: 'Helpline: 1533 | Mon-Sat 9AM-6PM',
        lastVerifiedAt: now,
        sourceUrl: 'https://mcdonline.nic.in',
        approvalStatus: 'approved',
      },
      {
        name: 'Electricity Board',
        jurisdiction: 'Power Distribution',
        officialEmail: 'grievance@bses.demo.gov.in',
        contactInfo: 'Helpline: 19123 | 24x7',
        lastVerifiedAt: now,
        sourceUrl: 'https://bsesdelhi.com',
        approvalStatus: 'approved',
      },
      {
        name: 'Water Supply Department',
        jurisdiction: 'Delhi Jal Board',
        officialEmail: 'complaints@djb.demo.gov.in',
        contactInfo: 'Helpline: 1916 | 24x7',
        lastVerifiedAt: now,
        sourceUrl: 'https://delhijalboard.nic.in',
        approvalStatus: 'approved',
      },
      {
        name: 'Ministry of Road Transport',
        jurisdiction: 'National Highways & Roads',
        officialEmail: 'pgportal@morth.demo.nic.in',
        contactInfo: 'Toll-Free: 1800-11-8500',
        lastVerifiedAt: now,
        sourceUrl: 'https://morth.nic.in',
        approvalStatus: 'approved',
      },
      {
        name: 'Police',
        jurisdiction: 'Law & Order',
        officialEmail: 'dcp-ops@delhipolice.demo.gov.in',
        contactInfo: 'Emergency: 100 | Helpline: 1800-11-0031',
        lastVerifiedAt: now,
        sourceUrl: 'https://delhipolice.gov.in',
        approvalStatus: 'approved',
      },
    ]);
    console.log('✅ Department Directory seeded (DEMO DATA)');

    // Seed Representatives (approved)
    await Representative.create([
      {
        name: 'Sh. Arvind Sharma (DEMO)',
        constituency: 'Connaught Place, Delhi',
        pinCodes: ['110001', '110002'],
        officeAddress: '12, Parliament Street, New Delhi - 110001',
        phone: '+91-11-23034500',
        email: 'mp.arvind.demo@sansad.nic.in',
        lastVerifiedAt: now,
        sourceUrl: 'https://sansad.in/ls/members',
        approvalStatus: 'approved',
      },
      {
        name: 'Smt. Priya Gupta (DEMO)',
        constituency: 'Patna Sahib, Bihar',
        pinCodes: ['800001', '800002'],
        officeAddress: '45, Dak Bungalow Road, Patna - 800001',
        phone: '+91-612-2225000',
        email: 'mp.priya.demo@sansad.nic.in',
        lastVerifiedAt: now,
        sourceUrl: 'https://sansad.in/ls/members',
        approvalStatus: 'approved',
      },
      {
        name: 'Sh. Vijay Singh (DEMO)',
        constituency: 'Lucknow Central, UP',
        pinCodes: ['226001', '226002'],
        officeAddress: '7, Vidhan Sabha Marg, Lucknow - 226001',
        phone: '+91-522-2238000',
        email: 'mla.vijay.demo@upvidhansabha.nic.in',
        lastVerifiedAt: now,
        sourceUrl: 'https://www.upvidhansabha.nic.in',
        approvalStatus: 'approved',
      },
      {
        name: 'Smt. Rekha Devi (DEMO)',
        constituency: 'Muzaffarpur, Bihar',
        pinCodes: ['842001', '842002'],
        officeAddress: '23, Station Road, Muzaffarpur - 842001',
        phone: '+91-621-2260000',
        email: 'mp.rekha.demo@sansad.nic.in',
        lastVerifiedAt: now,
        sourceUrl: 'https://sansad.in/ls/members',
        approvalStatus: 'approved',
      },
      {
        name: 'Sh. Ramesh Yadav (DEMO)',
        constituency: 'Varanasi, UP',
        pinCodes: ['221001', '221002'],
        officeAddress: '5, Cantonment Area, Varanasi - 221001',
        phone: '+91-542-2500000',
        email: 'mp.ramesh.demo@sansad.nic.in',
        lastVerifiedAt: now,
        sourceUrl: 'https://sansad.in/ls/members',
        approvalStatus: 'approved',
      },
    ]);

    // Seed 2 pending representatives (to demo review queue)
    await Representative.create([
      {
        name: 'Sh. New Candidate (DEMO - PENDING)',
        constituency: 'Sample Constituency',
        pinCodes: ['500001'],
        officeAddress: 'Sample Office, Hyderabad - 500001',
        phone: '+91-40-12345678',
        email: 'new.mp.demo@sansad.nic.in',
        lastVerifiedAt: now,
        sourceUrl: 'https://sansad.in/ls/members',
        approvalStatus: 'pending',
      },
      {
        name: 'Smt. Another Candidate (DEMO - PENDING)',
        constituency: 'Another Constituency',
        pinCodes: ['600001'],
        officeAddress: 'Another Office, Chennai - 600001',
        phone: '+91-44-87654321',
        email: 'another.mp.demo@sansad.nic.in',
        lastVerifiedAt: now,
        sourceUrl: 'https://sansad.in/ls/members',
        approvalStatus: 'pending',
      },
    ]);
    console.log('✅ Representatives seeded (DEMO DATA + 2 pending for review queue demo)');

    console.log('');
    console.log('✅✅✅ Seed complete!');
    console.log('⚠️  NOTE: This is DEMO DATA — pending first live scraper refresh');
    console.log('📋 All representative names marked (DEMO) are fictional');
    console.log('📧 Contact emails are @demo domains — not real government emails');
    console.log('🔁 Run the admin scraper to refresh with real data');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
};

seed();
