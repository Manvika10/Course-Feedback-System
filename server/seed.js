/**
 * Complete Database Seeder — All Schemas
 * ========================================
 * Creates all collections with sample data for the full feedback system.
 * 
 * Collections created:
 *   1. users         — Admin + Students
 *   2. courses       — 6 sample courses
 *   3. lessons       — 2-3 lessons per course
 *   4. feedbacks     — Star, emoji, thumbs, NPS ratings (micro + macro)
 *   5. feedbackforms — Dynamic survey forms with conditional logic
 *   6. feedbackresponses — Responses to dynamic forms
 *
 * Run:
 *   cd server
 *   node seed.js
 *
 * Login Credentials:
 *   Admin:   admin@college.edu / admin123
 *   Student: alice@college.edu / student123
 *   Student: bob@college.edu   / student123
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const Course = require('./models/Course');
const Lesson = require('./models/Lesson');
const Feedback = require('./models/Feedback');
const FeedbackForm = require('./models/FeedbackForm');
const FeedbackResponse = require('./models/FeedbackResponse');

const seedData = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('🔗 Connected to MongoDB');

  // ─── Clear ALL collections ────────────────────────────────
  await Promise.all([
    User.deleteMany(),
    Course.deleteMany(),
    Lesson.deleteMany(),
    Feedback.deleteMany(),
    FeedbackForm.deleteMany(),
    FeedbackResponse.deleteMany(),
  ]);

  // Also drop old indexes to avoid conflicts
  try {
    await mongoose.connection.db.collection('feedbacks').dropIndexes();
  } catch (e) { /* ignore if no indexes */ }

  console.log('🗑️  Cleared all collections\n');

  // ═══════════════════════════════════════════════════════════
  // 1. USERS
  // ═══════════════════════════════════════════════════════════
  const [admin, student1, student2] = await Promise.all([
    User.create({ name: 'Admin User', email: 'admin@college.edu', password: 'admin123', role: 'admin' }),
    User.create({ name: 'Alice Johnson', email: 'alice@college.edu', password: 'student123', role: 'student' }),
    User.create({ name: 'Bob Smith', email: 'bob@college.edu', password: 'student123', role: 'student' }),
  ]);
  console.log('👤 Users created: admin, alice, bob');

  // ═══════════════════════════════════════════════════════════
  // 2. COURSES
  // ═══════════════════════════════════════════════════════════
  const courses = await Course.insertMany([
    { courseName: 'Data Structures & Algorithms', courseCode: 'CS301', facultyName: 'Dr. Priya Sharma', department: 'Computer Science', semester: '3', description: 'Fundamental CS algorithms and data structures' },
    { courseName: 'Database Management Systems', courseCode: 'CS401', facultyName: 'Prof. Rajesh Kumar', department: 'Computer Science', semester: '4', description: 'SQL, NoSQL, and database design principles' },
    { courseName: 'Machine Learning', courseCode: 'CS501', facultyName: 'Dr. Anita Patel', department: 'Computer Science', semester: '5', description: 'Supervised, unsupervised learning and deep learning' },
    { courseName: 'Web Technologies', courseCode: 'CS351', facultyName: 'Prof. Suresh Menon', department: 'Computer Science', semester: '4', description: 'HTML, CSS, JavaScript and modern frameworks' },
    { courseName: 'Operating Systems', courseCode: 'CS302', facultyName: 'Dr. Kavita Rao', department: 'Computer Science', semester: '3', description: 'Process management, memory, and file systems' },
    { courseName: 'Computer Networks', courseCode: 'CS452', facultyName: 'Prof. Vikas Singh', department: 'Computer Science', semester: '5', description: 'TCP/IP, routing, and network protocols' },
  ]);
  console.log(`📚 Courses created: ${courses.length}`);

  // ═══════════════════════════════════════════════════════════
  // 3. LESSONS (2-3 per course)
  // ═══════════════════════════════════════════════════════════
  const lessonData = [
    // DSA
    { courseId: courses[0]._id, title: 'Arrays & Linked Lists', order: 1, description: 'Linear data structures' },
    { courseId: courses[0]._id, title: 'Trees & Graphs', order: 2, description: 'Non-linear data structures' },
    { courseId: courses[0]._id, title: 'Sorting & Searching', order: 3, description: 'Algorithm design techniques' },
    // DBMS
    { courseId: courses[1]._id, title: 'ER Modeling', order: 1, description: 'Entity-relationship diagrams' },
    { courseId: courses[1]._id, title: 'SQL Queries', order: 2, description: 'SELECT, JOIN, subqueries' },
    { courseId: courses[1]._id, title: 'Normalization', order: 3, description: '1NF, 2NF, 3NF, BCNF' },
    // ML
    { courseId: courses[2]._id, title: 'Linear Regression', order: 1, description: 'Supervised learning basics' },
    { courseId: courses[2]._id, title: 'Neural Networks', order: 2, description: 'Deep learning introduction' },
    // Web Tech
    { courseId: courses[3]._id, title: 'HTML & CSS Basics', order: 1, description: 'Building web pages' },
    { courseId: courses[3]._id, title: 'JavaScript & DOM', order: 2, description: 'Dynamic web programming' },
    { courseId: courses[3]._id, title: 'React Fundamentals', order: 3, description: 'Component-based UI development' },
    // OS
    { courseId: courses[4]._id, title: 'Process Scheduling', order: 1, description: 'CPU scheduling algorithms' },
    { courseId: courses[4]._id, title: 'Memory Management', order: 2, description: 'Paging and segmentation' },
    // Networks
    { courseId: courses[5]._id, title: 'OSI Model', order: 1, description: '7 layers of networking' },
    { courseId: courses[5]._id, title: 'TCP/IP Protocol', order: 2, description: 'Transport and internet layers' },
  ];
  const lessons = await Lesson.insertMany(lessonData);
  console.log(`📖 Lessons created: ${lessons.length}`);

  // ═══════════════════════════════════════════════════════════
  // 4. FEEDBACKS (macro + micro with all rating types)
  // ═══════════════════════════════════════════════════════════
  const feedbacks = await Feedback.create([
    // Alice — macro course feedbacks
    {
      studentId: student1._id, courseId: courses[0]._id,
      feedbackType: 'macro', rating: 5,
      comment: 'Excellent course! Dr. Sharma explains algorithms very clearly.',
      identityMode: 'identified', anonymous: false,
      teachingQuality: 5, courseContent: 4, overallSatisfaction: 5,
      emojiReaction: 'love', thumbsUpDown: 'up', npsScore: 9,
      sliderRatings: { difficulty: 7 },
    },
    {
      studentId: student1._id, courseId: courses[1]._id,
      feedbackType: 'macro', rating: 4,
      comment: 'Great DBMS course with practical examples.',
      identityMode: 'pseudonymous', anonymous: false,
      teachingQuality: 4, courseContent: 5, overallSatisfaction: 4,
      emojiReaction: 'happy', thumbsUpDown: 'up', npsScore: 8,
    },
    {
      studentId: student1._id, courseId: courses[2]._id,
      feedbackType: 'macro', rating: 5,
      comment: 'Best ML course I have taken!',
      identityMode: 'anonymous', anonymous: true,
      teachingQuality: 5, courseContent: 5, overallSatisfaction: 5,
      emojiReaction: 'love', npsScore: 10,
    },
    // Alice — micro lesson feedbacks
    {
      studentId: student1._id, courseId: courses[0]._id,
      lessonId: lessons[0]._id, feedbackType: 'micro', rating: 5,
      comment: 'Arrays were explained perfectly.',
      identityMode: 'identified', emojiReaction: 'love',
    },
    {
      studentId: student1._id, courseId: courses[0]._id,
      lessonId: lessons[1]._id, feedbackType: 'micro', rating: 4,
      comment: 'Graphs section could use more examples.',
      identityMode: 'identified', emojiReaction: 'happy', thumbsUpDown: 'up',
    },
    // Bob — macro course feedbacks
    {
      studentId: student2._id, courseId: courses[0]._id,
      feedbackType: 'macro', rating: 4,
      comment: 'Good coverage, could use more practice problems.',
      identityMode: 'identified', anonymous: false,
      teachingQuality: 4, courseContent: 4, overallSatisfaction: 4,
      thumbsUpDown: 'up', npsScore: 7,
    },
    {
      studentId: student2._id, courseId: courses[3]._id,
      feedbackType: 'macro', rating: 3,
      comment: 'Needs more hands-on projects.',
      identityMode: 'identified', anonymous: false,
      teachingQuality: 3, courseContent: 4, overallSatisfaction: 3,
      emojiReaction: 'neutral', thumbsUpDown: 'down', npsScore: 5,
      sliderRatings: { difficulty: 4 },
    },
    // Bob — micro lesson feedback
    {
      studentId: student2._id, courseId: courses[3]._id,
      lessonId: lessons[9]._id, feedbackType: 'micro', rating: 4,
      comment: 'JavaScript section was fun.',
      identityMode: 'pseudonymous', emojiReaction: 'happy',
    },
  ]);
  console.log(`💬 Feedbacks created: ${feedbacks.length} (macro + micro)`);

  // ═══════════════════════════════════════════════════════════
  // 5. FEEDBACK FORMS (dynamic survey templates)
  // ═══════════════════════════════════════════════════════════
  const forms = await FeedbackForm.create([
    // Form 1: End-of-course survey with conditional logic
    {
      title: 'End-of-Course Satisfaction Survey',
      description: 'Please share your overall experience with this course.',
      formType: 'macro',
      triggerType: 'course_complete',
      createdBy: admin._id,
      isActive: true,
      questions: [
        {
          questionText: 'How would you rate this course overall?',
          questionType: 'star_rating',
          required: true,
        },
        {
          questionText: 'How do you feel about the course?',
          questionType: 'emoji_reaction',
          required: false,
        },
        {
          questionText: 'Would you recommend this course?',
          questionType: 'thumbs_up_down',
          required: true,
        },
        {
          questionText: 'How likely are you to recommend this course to a friend?',
          questionType: 'nps',
          required: true,
        },
        {
          questionText: 'Rate the difficulty level',
          questionType: 'numeric_slider',
          required: false,
          sliderConfig: { min: 1, max: 10, step: 1, minLabel: 'Very Easy', maxLabel: 'Very Hard' },
        },
        {
          questionText: 'What was the best part of this course?',
          questionType: 'multiple_choice',
          required: true,
          options: ['Teaching quality', 'Course content', 'Practical exercises', 'Guest lectures', 'Other'],
        },
        {
          // Conditional: Show only if "Other" was selected above
          questionText: 'Please specify what you liked most:',
          questionType: 'free_text',
          required: false,
          conditionalLogic: {
            dependsOnQuestion: 5, // index of the multiple choice question
            operator: 'equals',
            value: 'Other',
          },
        },
        {
          questionText: 'Rate your agreement with these statements:',
          questionType: 'likert',
          required: true,
          likertConfig: { min: 1, max: 5, minLabel: 'Strongly Disagree', maxLabel: 'Strongly Agree' },
        },
        {
          questionText: 'Rank these aspects by importance:',
          questionType: 'ranking',
          required: false,
          options: ['Clear explanations', 'Good pace', 'Practical examples', 'Helpful resources'],
        },
        {
          questionText: 'Any additional comments?',
          questionType: 'free_text',
          required: false,
        },
      ],
    },
    // Form 2: Per-lesson quick feedback
    {
      title: 'Lesson Quick Feedback',
      description: 'Quick feedback after each lesson.',
      formType: 'micro',
      triggerType: 'lesson_complete',
      createdBy: admin._id,
      isActive: true,
      questions: [
        {
          questionText: 'How clear was this lesson?',
          questionType: 'star_rating',
          required: true,
        },
        {
          questionText: 'How do you feel after this lesson?',
          questionType: 'emoji_reaction',
          required: false,
        },
        {
          questionText: 'Was the pace appropriate?',
          questionType: 'likert',
          required: true,
          likertConfig: { min: 1, max: 5, minLabel: 'Too Slow', maxLabel: 'Too Fast' },
        },
        {
          questionText: 'What could be improved?',
          questionType: 'free_text',
          required: false,
        },
      ],
    },
    // Form 3: Course-specific form with rubric
    {
      title: 'DSA Course Detailed Evaluation',
      description: 'Detailed evaluation for Data Structures & Algorithms.',
      courseId: courses[0]._id,
      formType: 'macro',
      triggerType: 'instructor_prompt',
      createdBy: admin._id,
      isActive: true,
      questions: [
        {
          questionText: 'Rate the instructor on these criteria:',
          questionType: 'rubric',
          required: true,
          rubricCriteria: [
            {
              criterion: 'Clarity of Explanation',
              levels: [
                { label: 'Poor', score: 1, description: 'Hard to follow' },
                { label: 'Fair', score: 2, description: 'Somewhat clear' },
                { label: 'Good', score: 3, description: 'Generally clear' },
                { label: 'Excellent', score: 4, description: 'Very clear and engaging' },
              ],
            },
            {
              criterion: 'Use of Examples',
              levels: [
                { label: 'Poor', score: 1, description: 'No examples' },
                { label: 'Fair', score: 2, description: 'Few examples' },
                { label: 'Good', score: 3, description: 'Good examples' },
                { label: 'Excellent', score: 4, description: 'Rich, practical examples' },
              ],
            },
            {
              criterion: 'Responsiveness to Questions',
              levels: [
                { label: 'Poor', score: 1 },
                { label: 'Fair', score: 2 },
                { label: 'Good', score: 3 },
                { label: 'Excellent', score: 4 },
              ],
            },
          ],
        },
        {
          questionText: 'Overall recommendation?',
          questionType: 'nps',
          required: true,
        },
      ],
    },
    // Form 4: Exit intent form
    {
      title: 'Quick Exit Survey',
      description: 'We noticed you are leaving. Help us improve!',
      formType: 'macro',
      triggerType: 'exit_intent',
      createdBy: admin._id,
      isActive: true,
      questions: [
        {
          questionText: 'Why are you leaving?',
          questionType: 'multiple_choice',
          required: true,
          options: ['Finished studying', 'Content too difficult', 'Not relevant', 'Technical issues', 'Other'],
        },
        {
          questionText: 'Quick rating of your experience:',
          questionType: 'thumbs_up_down',
          required: false,
        },
      ],
    },
  ]);
  console.log(`📋 Feedback Forms created: ${forms.length}`);

  // ═══════════════════════════════════════════════════════════
  // 6. FEEDBACK RESPONSES (sample responses to dynamic forms)
  // ═══════════════════════════════════════════════════════════
  const responses = await FeedbackResponse.create([
    {
      formId: forms[0]._id,
      studentId: student1._id,
      courseId: courses[0]._id,
      identityMode: 'identified',
      triggerSource: 'manual',
      answers: [
        { questionIndex: 0, questionType: 'star_rating', answer: 5 },
        { questionIndex: 1, questionType: 'emoji_reaction', answer: 'love' },
        { questionIndex: 2, questionType: 'thumbs_up_down', answer: 'up' },
        { questionIndex: 3, questionType: 'nps', answer: 9 },
        { questionIndex: 4, questionType: 'numeric_slider', answer: 7 },
        { questionIndex: 5, questionType: 'multiple_choice', answer: 'Teaching quality' },
        { questionIndex: 7, questionType: 'likert', answer: 5 },
        { questionIndex: 8, questionType: 'ranking', answer: ['Clear explanations', 'Practical examples', 'Good pace', 'Helpful resources'] },
        { questionIndex: 9, questionType: 'free_text', answer: 'Loved every bit of this course!' },
      ],
    },
    {
      formId: forms[1]._id,
      studentId: student2._id,
      courseId: courses[0]._id,
      lessonId: lessons[0]._id,
      identityMode: 'pseudonymous',
      triggerSource: 'lesson_complete',
      answers: [
        { questionIndex: 0, questionType: 'star_rating', answer: 4 },
        { questionIndex: 1, questionType: 'emoji_reaction', answer: 'happy' },
        { questionIndex: 2, questionType: 'likert', answer: 3 },
        { questionIndex: 3, questionType: 'free_text', answer: 'More visualizations would help.' },
      ],
    },
  ]);
  console.log(`📝 Feedback Responses created: ${responses.length}`);

  // ═══════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(50));
  console.log('✅ DATABASE SEEDING COMPLETE!');
  console.log('═'.repeat(50));
  console.log('\n📊 Collections created:\n');
  console.log('  Collection            Count');
  console.log('  ─────────────────────────────');
  console.log(`  users                 3`);
  console.log(`  courses               ${courses.length}`);
  console.log(`  lessons               ${lessons.length}`);
  console.log(`  feedbacks             ${feedbacks.length}`);
  console.log(`  feedbackforms         ${forms.length}`);
  console.log(`  feedbackresponses     ${responses.length}`);
  console.log('\n📧 Login Credentials:\n');
  console.log('  Admin:   admin@college.edu / admin123');
  console.log('  Student: alice@college.edu / student123');
  console.log('  Student: bob@college.edu   / student123\n');

  process.exit(0);
};

seedData().catch((err) => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
