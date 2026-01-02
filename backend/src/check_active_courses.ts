import mongoose from 'mongoose';
import { Course, CourseState } from './models/Course';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const checkCourses = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            console.error('MONGODB_URI not found in .env');
            process.exit(1);
        }
        console.log(`Connecting to MongoDB...`);
        await mongoose.connect(uri);
        console.log('MongoDB Connected');

        // Count all courses
        const totalCount = await Course.countDocuments();
        console.log(`Total courses in DB: ${totalCount}`);

        // Find active courses
        const activeCourses = await Course.find({ state: 'ACTIVE' }); // Using string literal matches enum value
        console.log(`Found ${activeCourses.length} active courses:`);

        if (activeCourses.length > 0) {
            activeCourses.forEach(c => {
                console.log(`- ID: ${c._id}`);
                console.log(`  Title: ${c.title}`);
                console.log(`  Price: ${c.price}`);
                console.log(`  Modules: ${c.modules.length}`);
                console.log('---');
            });
        } else {
            console.log('No active courses found.');

            // If no active, show what states exist
            const sample = await Course.find({}).limit(5);
            if (sample.length > 0) {
                console.log('Sample courses states:');
                sample.forEach(c => console.log(`- ${c.title}: ${c.state}`));
            }
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
};

checkCourses();
