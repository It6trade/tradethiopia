const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/user.model');
const SalesCustomer = require('./sales/models/SalesCustomer');
const Task = require('./models/Task');
const CalendarEvent = require('./models/CalendarEvent');
const SalesTarget = require('./sales/models/SalesTarget');
const Notification = require('./models/Notification');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tradethiopia')
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Sample courses for realistic data
const courses = [
  { name: 'Digital Marketing Mastery', price: 25000 },
  { name: 'Business Analytics', price: 30000 },
  { name: 'Web Development Bootcamp', price: 35000 },
  { name: 'Data Science Fundamentals', price: 40000 },
  { name: 'Project Management Professional', price: 28000 },
  { name: 'Financial Modeling', price: 32000 },
  { name: 'UI/UX Design Complete', price: 27000 },
  { name: 'Cloud Computing AWS', price: 38000 },
  { name: 'Mobile App Development', price: 33000 },
  { name: 'Cybersecurity Essentials', price: 36000 }
];

// Sample Ethiopian names
const ethiopianNames = [
  'Abebe Kebede', 'Tigist Alemayehu', 'Solomon Tesfaye', 'Hanna Girma',
  'Dawit Bekele', 'Marta Haile', 'Yohannes Desta', 'Rahel Mekonnen',
  'Tadesse Worku', 'Selamawit Alem', 'Mulugeta Assefa', 'Tsion Tekle',
  'Berhanu Molla', 'Bethlehem Taye', 'Getachew Abate', 'Sara Negash',
  'Alemayehu Wolde', 'Ruth Tefera', 'Tewodros Ayele', 'Senait Fanta',
  'Habtamu Gebre', 'Eden Yonas', 'Mesfin Alemu', 'Meron Kassahun',
  'Tekle Tadesse', 'Helen Tadesse', 'Girma Tadele', 'Selam Dereje'
];

// Sample company names
const companyNames = [
  'Ethio Telecom', 'Ethiopian Airlines', 'Commercial Bank of Ethiopia', 
  'Dashen Bank', 'Awash Bank', 'Wegagen Bank', 'Nib Bank',
  'East African Bottling', 'Moha Soft Drinks', 'BGI Ethiopia',
  'Habesha Breweries', 'Meta Abo Brewery', 'Dire Dawa Textile',
  'Bahir Dar Textile', 'Kombolcha Textile', 'Arbaminch Textile',
  'National Tobacco', 'East Africa Tobacco', 'Addis Pharmaceutical',
  'Cadila Pharmaceuticals Ethiopia', 'Julphar Ethiopia', 'Life Healthcare',
  'Ethiopian Insurance Corporation', 'Awash Insurance', 'United Insurance'
];

// Generate realistic sales data
function generateSalesCustomers(agents, count) {
  const customers = [];
  const statuses = ['Prospect', 'Pending', 'Completed', 'Scheduled', 'Cancelled'];
  const callStatuses = ['Called', 'Not Called', 'Busy', 'No Answer', 'Callback'];
  const schedulePrefs = ['Regular', 'Weekend', 'Night', 'Online'];
  const titles = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Engineer', 'Manager'];

  for (let i = 0; i < count; i++) {
    const agent = agents[i % agents.length];
    const course = courses[Math.floor(Math.random() * courses.length)];
    const isIndividual = Math.random() > 0.3;
    const daysAgo = Math.floor(Math.random() * 90);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    customers.push({
      agentId: agent._id.toString(),
      customerName: isIndividual 
        ? `${titles[Math.floor(Math.random() * titles.length)]} ${ethiopianNames[Math.floor(Math.random() * ethiopianNames.length)]}`
        : companyNames[Math.floor(Math.random() * companyNames.length)],
      contactTitle: isIndividual ? 'Individual' : ['CEO', 'HR Manager', 'Training Director', 'Operations Manager'][Math.floor(Math.random() * 4)],
      phone: `+251${Math.floor(Math.random() * 900000000 + 100000000)}`,
      email: isIndividual 
        ? `customer${i}@example.com`
        : `contact${i}@company.et`,
      callStatus: callStatuses[Math.floor(Math.random() * callStatuses.length)],
      followupStatus: statuses[Math.floor(Math.random() * statuses.length)],
      schedulePreference: schedulePrefs[Math.floor(Math.random() * schedulePrefs.length)],
      courseName: course.name,
      coursePrice: course.price,
      date: date,
      note: [
        'Very interested in the course',
        'Requested a callback next week',
        'Needs more information about payment plans',
        'Already completed the registration',
        'Waiting for approval from management',
        'Comparing with other training providers',
        'Ready to enroll immediately',
        'Asking about group discounts'
      ][Math.floor(Math.random() * 8)],
      supervisorComment: Math.random() > 0.7 ? [
        'Excellent prospect, follow up urgently',
        'Good communication, likely to convert',
        'Needs more nurturing',
        'High-value client, prioritize',
        'Competitor mentioned, address concerns'
      ][Math.floor(Math.random() * 5)] : ''
    });
  }

  return customers;
}

// Generate tasks
function generateTasks(manager, agents, count) {
  const tasks = [];
  const priorities = ['Low', 'Medium', 'High', 'Urgent'];
  const statuses = ['Pending', 'In Progress', 'Completed', 'Cancelled'];
  const taskTemplates = [
    { title: 'Follow up with high-value leads', desc: 'Contact leads with course price > 30,000 ETB' },
    { title: 'Prepare weekly sales report', desc: 'Compile all sales activities for the week' },
    { title: 'Conduct customer satisfaction survey', desc: 'Survey 10 recent customers' },
    { title: 'Schedule training sessions', desc: 'Coordinate with trainers for upcoming sessions' },
    { title: 'Update CRM data', desc: 'Ensure all customer information is current' },
    { title: 'Review pending proposals', desc: 'Evaluate proposals and provide feedback' },
    { title: 'Organize team meeting', desc: 'Prepare agenda and coordinate schedules' },
    { title: 'Cold call new prospects', desc: 'Reach out to 20 new potential clients' },
    { title: 'Follow up on pending payments', desc: 'Contact customers with outstanding balances' },
    { title: 'Prepare sales presentation', desc: 'Create deck for upcoming client meeting' }
  ];

  for (let i = 0; i < count; i++) {
    const agent = agents[i % agents.length];
    const template = taskTemplates[i % taskTemplates.length];
    const daysFromNow = Math.floor(Math.random() * 30) - 15; // -15 to +15 days
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + daysFromNow);

    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const completedAt = status === 'Completed' ? new Date() : null;

    tasks.push({
      title: template.title,
      description: template.desc,
      assignedTo: agent._id,
      assignedBy: manager._id,
      status: status,
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      dueDate: dueDate,
      completedAt: completedAt,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date in last 30 days
    });
  }

  return tasks;
}

// Generate calendar events
function generateCalendarEvents(manager, agents, count) {
  const events = [];
  const eventTypes = ['meeting', 'call', 'training', 'deadline', 'other'];
  const eventTemplates = [
    { title: 'Team standup meeting', type: 'meeting', location: 'Office Conference Room' },
    { title: 'Client presentation', type: 'meeting', location: 'Client Office' },
    { title: 'Follow-up call', type: 'call', location: 'Phone' },
    { title: 'Sales training session', type: 'training', location: 'Training Hall' },
    { title: 'Proposal submission deadline', type: 'deadline', location: '' },
    { title: 'Monthly review meeting', type: 'meeting', location: 'Office Conference Room' },
    { title: 'Product demo', type: 'meeting', location: 'Virtual - Zoom' },
    { title: 'Prospecting calls', type: 'call', location: 'Office' },
    { title: 'CRM training', type: 'training', location: 'Training Room' },
    { title: 'Report submission', type: 'deadline', location: '' }
  ];

  for (let i = 0; i < count; i++) {
    const agent = agents[i % agents.length];
    const template = eventTemplates[i % eventTemplates.length];
    const daysFromNow = Math.floor(Math.random() * 60) - 15; // -15 to +45 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + daysFromNow);
    startDate.setHours(9 + Math.floor(Math.random() * 8), 0, 0, 0); // 9 AM to 5 PM
    
    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + (Math.random() > 0.5 ? 1 : 2)); // 1 or 2 hours duration

    events.push({
      title: template.title,
      start: startDate,
      end: endDate,
      description: `${template.title} scheduled for ${agent.username}`,
      type: template.type,
      agentId: agent._id.toString(),
      agentName: agent.username,
      location: template.location,
      createdBy: manager._id.toString()
    });
  }

  return events;
}

// Generate sales targets
function generateSalesTargets(agents) {
  const targets = [];
  const now = new Date();

  agents.forEach(agent => {
    // Weekly target (current week)
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)
    weekEnd.setHours(23, 59, 59, 999);

    targets.push({
      agentId: agent._id.toString(),
      agentName: agent.username,
      weeklySalesTarget: Math.floor(Math.random() * 50000) + 50000, // 50k - 100k
      monthlySalesTarget: 0,
      periodType: 'weekly',
      periodStart: weekStart,
      periodEnd: weekEnd
    });

    // Monthly target (current month)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    targets.push({
      agentId: agent._id.toString(),
      agentName: agent.username,
      weeklySalesTarget: 0,
      monthlySalesTarget: Math.floor(Math.random() * 200000) + 200000, // 200k - 400k
      periodType: 'monthly',
      periodStart: monthStart,
      periodEnd: monthEnd
    });
  });

  return targets;
}

// Generate notifications
function generateNotifications(agents, tasks) {
  const notifications = [];
  const notificationTemplates = [
    'New task assigned to you',
    'Task deadline approaching',
    'Monthly target updated',
    'Weekly performance report available',
    'Team meeting scheduled',
    'New lead assigned',
    'Customer feedback received',
    'Training session reminder'
  ];

  agents.forEach((agent, index) => {
    // Generate 3-5 notifications per agent
    const notifCount = Math.floor(Math.random() * 3) + 3;
    for (let i = 0; i < notifCount; i++) {
      const daysAgo = Math.floor(Math.random() * 7);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);

      notifications.push({
        user: agent._id,
        text: notificationTemplates[Math.floor(Math.random() * notificationTemplates.length)],
        read: Math.random() > 0.4, // 60% read, 40% unread
        type: ['general', 'task', 'target'][Math.floor(Math.random() * 3)],
        taskId: tasks[index % tasks.length]?._id,
        createdAt: createdAt
      });
    }
  });

  return notifications;
}

// Main seed function
async function seedData() {
  try {
    console.log('🌱 Starting data seeding...\n');

    // Step 1: Find or create sales manager
    console.log('1️⃣ Creating Sales Manager...');
    let manager = await User.findOne({ role: 'salesmanager' });
    
    if (!manager) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      manager = await User.create({
        username: 'Sales Manager',
        email: 'salesmanager@tradethiopia.com',
        password: hashedPassword,
        role: 'salesmanager',
        status: 'active',
        fullName: 'Sales Manager',
        phone: '+251911000000',
        infoStatus: 'active'
      });
      console.log(`✅ Created Sales Manager: ${manager.email}`);
    } else {
      console.log(`✅ Found existing Sales Manager: ${manager.email}`);
    }

    // Step 2: Find or create sales agents
    console.log('\n2️⃣ Creating Sales Agents...');
    const agentNames = [
      'Abebe Tesfaye', 'Tigist Alemayehu', 'Solomon Bekele', 
      'Hanna Girma', 'Dawit Mekonnen', 'Marta Haile',
      'Yohannes Desta', 'Rahel Worku', 'Tadesse Assefa',
      'Selamawit Tekle', 'Mulugeta Alem', 'Tsion Negash'
    ];

    let agents = await User.find({ role: 'sales', status: 'active' }).limit(12);
    
    if (agents.length < 10) {
      console.log(`Found only ${agents.length} agents, creating more...`);
      const agentsToCreate = [];
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      for (let i = agents.length; i < 12; i++) {
        agentsToCreate.push({
          username: agentNames[i],
          email: `agent${i + 1}@tradethiopia.com`,
          password: hashedPassword,
          role: 'sales',
          status: 'active',
          fullName: agentNames[i],
          phone: `+2519${String(i).padStart(8, '0')}`,
          infoStatus: 'active'
        });
      }
      
      const newAgents = await User.insertMany(agentsToCreate);
      agents = [...agents, ...newAgents];
      console.log(`✅ Created ${newAgents.length} new agents`);
    }
    console.log(`✅ Total ${agents.length} agents ready`);

    // Step 3: Clear existing data (optional - comment out if you want to keep existing data)
    console.log('\n3️⃣ Clearing existing Sales Manager data...');
    await SalesCustomer.deleteMany({});
    await Task.deleteMany({});
    await CalendarEvent.deleteMany({});
    await SalesTarget.deleteMany({});
    await Notification.deleteMany({ user: { $in: agents.map(a => a._id) } });
    console.log('✅ Existing data cleared');

    // Step 4: Generate and insert sales customers
    console.log('\n4️⃣ Generating Sales Customers...');
    const customers = generateSalesCustomers(agents, 150); // 150 customers
    await SalesCustomer.insertMany(customers);
    console.log(`✅ Created ${customers.length} sales customers`);

    // Step 5: Generate and insert tasks
    console.log('\n5️⃣ Generating Tasks...');
    const tasks = generateTasks(manager, agents, 50); // 50 tasks
    const insertedTasks = await Task.insertMany(tasks);
    console.log(`✅ Created ${insertedTasks.length} tasks`);

    // Step 6: Generate and insert calendar events
    console.log('\n6️⃣ Generating Calendar Events...');
    const events = generateCalendarEvents(manager, agents, 40); // 40 events
    await CalendarEvent.insertMany(events);
    console.log(`✅ Created ${events.length} calendar events`);

    // Step 7: Generate and insert sales targets
    console.log('\n7️⃣ Generating Sales Targets...');
    const targets = generateSalesTargets(agents);
    await SalesTarget.insertMany(targets);
    console.log(`✅ Created ${targets.length} sales targets`);

    // Step 8: Generate and insert notifications
    console.log('\n8️⃣ Generating Notifications...');
    const notifications = generateNotifications(agents, insertedTasks);
    await Notification.insertMany(notifications);
    console.log(`✅ Created ${notifications.length} notifications`);

    console.log('\n🎉 Data seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   • Sales Manager: 1`);
    console.log(`   • Sales Agents: ${agents.length}`);
    console.log(`   • Customers: ${customers.length}`);
    console.log(`   • Tasks: ${insertedTasks.length}`);
    console.log(`   • Calendar Events: ${events.length}`);
    console.log(`   • Sales Targets: ${targets.length}`);
    console.log(`   • Notifications: ${notifications.length}`);
    console.log('\n✅ All done! You can now test the Sales Manager dashboard.');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the seed function
seedData();
