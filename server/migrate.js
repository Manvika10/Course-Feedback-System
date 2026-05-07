/**
 * Database Migration Script
 * -------------------------
 * Run this ONCE after updating to the new feedback system.
 *
 * What it does:
 *   1. Drops the old compound index { studentId, courseId } on feedbacks
 *   2. Creates the new compound index { studentId, courseId, lessonId, feedbackType }
 *   3. Backfills existing feedback documents with new fields
 *   4. Verifies everything worked
 *
 * Usage:
 *   cd server
 *   node migrate.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/course_feedback_db';

async function migrate() {
  console.log('🚀 Starting database migration...\n');

  try {
    // --- Connect ---
    const conn = await mongoose.connect(MONGO_URI);
    console.log(`✅ Connected to: ${conn.connection.host}/${conn.connection.name}\n`);

    const db = conn.connection.db;
    const feedbackCol = db.collection('feedbacks');

    // --- Step 1: Drop old index ---
    console.log('📌 Step 1: Dropping old compound index...');
    try {
      const indexes = await feedbackCol.indexes();
      const oldIndex = indexes.find(
        (idx) =>
          idx.key &&
          idx.key.studentId === 1 &&
          idx.key.courseId === 1 &&
          !idx.key.lessonId &&
          !idx.key.feedbackType
      );

      if (oldIndex) {
        await feedbackCol.dropIndex(oldIndex.name);
        console.log(`   ✅ Dropped old index: "${oldIndex.name}"`);
      } else {
        console.log('   ℹ️  Old index not found (already dropped or never existed)');
      }
    } catch (err) {
      if (err.codeName === 'IndexNotFound') {
        console.log('   ℹ️  Old index already removed');
      } else {
        console.warn(`   ⚠️  Could not drop old index: ${err.message}`);
      }
    }

    // --- Step 2: Backfill existing documents ---
    console.log('\n📌 Step 2: Backfilling existing feedback documents...');
    const backfillResult = await feedbackCol.updateMany(
      {
        $or: [
          { feedbackType: { $exists: false } },
          { identityMode: { $exists: false } },
        ],
      },
      {
        $set: {
          feedbackType: 'macro',
          lessonId: null,
          identityMode: 'identified',
          pseudonym: null,
          emojiReaction: null,
          thumbsUpDown: null,
          npsScore: null,
          sliderRatings: {},
        },
      }
    );
    console.log(`   ✅ Updated ${backfillResult.modifiedCount} documents`);

    // Fix anonymous ones — set identityMode to 'anonymous' where anonymous=true
    const anonResult = await feedbackCol.updateMany(
      { anonymous: true, identityMode: 'identified' },
      { $set: { identityMode: 'anonymous' } }
    );
    console.log(`   ✅ Fixed ${anonResult.modifiedCount} anonymous feedback identity modes`);

    // --- Step 3: Create new compound index ---
    console.log('\n📌 Step 3: Creating new compound index...');
    try {
      await feedbackCol.createIndex(
        { studentId: 1, courseId: 1, lessonId: 1, feedbackType: 1 },
        { unique: true, name: 'student_course_lesson_type_unique' }
      );
      console.log('   ✅ New index created: student_course_lesson_type_unique');
    } catch (err) {
      if (err.code === 85 || err.code === 86) {
        console.log('   ℹ️  Index already exists');
      } else {
        throw err;
      }
    }

    // --- Step 4: Verify ---
    console.log('\n📌 Step 4: Verifying migration...');
    const totalFeedbacks = await feedbackCol.countDocuments();
    const withNewFields = await feedbackCol.countDocuments({
      feedbackType: { $exists: true },
      identityMode: { $exists: true },
    });
    const indexes = await feedbackCol.indexes();

    console.log(`   Total feedbacks: ${totalFeedbacks}`);
    console.log(`   With new fields: ${withNewFields}`);
    console.log(`   Indexes: ${indexes.map((i) => i.name).join(', ')}`);

    if (totalFeedbacks === withNewFields) {
      console.log('\n🎉 Migration completed successfully!\n');
    } else {
      console.warn(`\n⚠️  ${totalFeedbacks - withNewFields} documents may not have been updated. Please check manually.\n`);
    }
  } catch (error) {
    console.error(`\n❌ Migration failed: ${error.message}\n`);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed.');
    process.exit(0);
  }
}

migrate();
