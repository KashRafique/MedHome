import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';
import { Course } from './models/Course';
import { normalizeFilePath } from './utils/pathHelpers';

// Load environment variables
config({ path: path.join(__dirname, '../.env') });

const assignImagesToCourses = async () => {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('❌ MONGODB_URI not found in .env');
      process.exit(1);
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('✅ MongoDB Connected\n');

    // Get all images from course-images directory
    const imagesDir = path.join(__dirname, '../uploads/course-images');
    
    if (!fs.existsSync(imagesDir)) {
      console.error(`❌ Directory not found: ${imagesDir}`);
      await mongoose.disconnect();
      process.exit(1);
    }

    const imageFiles = fs.readdirSync(imagesDir)
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
      })
      .map(file => path.join('uploads/course-images', file));

    console.log(`📸 Found ${imageFiles.length} images:`);
    imageFiles.forEach((img, idx) => {
      console.log(`   ${idx + 1}. ${path.basename(img)}`);
    });
    console.log('');

    if (imageFiles.length === 0) {
      console.log('⚠️  No images found in course-images directory');
      await mongoose.disconnect();
      return;
    }

    // Get all courses from database
    const courses = await Course.find({});
    console.log(`📚 Found ${courses.length} courses in database\n`);

    if (courses.length === 0) {
      console.log('⚠️  No courses found in database');
      await mongoose.disconnect();
      return;
    }

    // Shuffle images array for random assignment
    const shuffledImages = [...imageFiles].sort(() => Math.random() - 0.5);

    // Assign images to courses (cycle through images if more courses than images)
    let assignments = 0;
    const updates = courses.map((course, index) => {
      const imagePath = shuffledImages[index % shuffledImages.length];
      const normalizedPath = normalizeFilePath(imagePath);
      
      return {
        courseId: course._id,
        courseTitle: course.title,
        imagePath: normalizedPath,
        originalImage: path.basename(imagePath)
      };
    });

    console.log('🔄 Assigning images to courses:\n');
    updates.forEach((update, idx) => {
      console.log(`${idx + 1}. "${update.courseTitle}"`);
      console.log(`   → ${update.imagePath}`);
      console.log(`   (from: ${update.originalImage})\n`);
    });

    // Update courses in database
    console.log('💾 Updating courses in database...\n');
    for (const update of updates) {
      await Course.findByIdAndUpdate(
        update.courseId,
        { thumbnail: update.imagePath },
        { new: true }
      );
      assignments++;
    }

    console.log(`✅ Successfully assigned ${assignments} images to courses!`);
    console.log(`\n📊 Summary:`);
    console.log(`   - Images available: ${imageFiles.length}`);
    console.log(`   - Courses updated: ${assignments}`);
    console.log(`   - Images reused: ${courses.length > imageFiles.length ? 'Yes (cycled)' : 'No'}`);

    await mongoose.disconnect();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Run the script
assignImagesToCourses();

