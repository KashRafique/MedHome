import mongoose, { Document, Schema } from 'mongoose';

export interface ILessonProgress {
  lessonId: string;
  currentTime: number;
  duration: number;
  progressPercent: number;
  completed: boolean;
  lastUpdated: Date;
}

export interface ICourseProgress extends Document {
  student: Schema.Types.ObjectId;
  course: Schema.Types.ObjectId;
  completedLessons: string[];
  lessonProgress: ILessonProgress[];
  lastWatchedLesson?: string;
  startedAt: Date;
  lastActiveAt: Date;
}

const lessonProgressSchema = new Schema({
  lessonId: { type: String, required: true },
  currentTime: { type: Number, default: 0 },
  duration: { type: Number, default: 0 },
  progressPercent: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  lastUpdated: { type: Date, default: Date.now }
}, { _id: false });

const courseProgressSchema = new Schema<ICourseProgress>({
  student: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  completedLessons: [{
    type: String
  }],
  lessonProgress: [lessonProgressSchema],
  lastWatchedLesson: {
    type: String
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure unique progress record per student per course
courseProgressSchema.index({ student: 1, course: 1 }, { unique: true });

export const CourseProgress = mongoose.model<ICourseProgress>('CourseProgress', courseProgressSchema);
