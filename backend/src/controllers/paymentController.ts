import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { Payment, PaymentStatus } from '../models/Payment';
import { Enrollment, EnrollmentStatus } from '../models/Enrollment';
import { UserRole } from '../models/User';
import { Course, ICourseDocument } from '../models/Course';
import { sendNotification } from '../utils/notification';
import { Voucher } from '../models/Voucher';
import { VoucherUsage } from '../models/VoucherUsage';
import { normalizeFilePath } from '../utils/pathHelpers';
import fs from 'fs';
import path from 'path';

// Helper function to normalize payment receipt paths before sending to client
const normalizePaymentPaths = (payment: any) => {
  const paymentObj = payment.toObject ? payment.toObject() : payment;
  if (paymentObj.receiptPath) {
    paymentObj.receiptPath = normalizeFilePath(paymentObj.receiptPath);
  }
  return paymentObj;
};

// Create a new payment
export const createPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { enrollmentId } = req.params;
    const {
      amount,
      paymentDate,
      paymentMethod,
      bankName,
      accountHolderNumber,
      transactionId
    } = req.body;
    const file = req.file;

    if (!file) {
      res.status(400).json({ message: 'Payment receipt is required' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const enrollment = await Enrollment.findById(enrollmentId)
      .populate<{ course: ICourseDocument }>('course');

    if (!enrollment) {
      res.status(404).json({ message: 'Enrollment not found' });
      return;
    }

    if (enrollment.student.toString() !== req.user._id.toString()) {
      res.status(403).json({ message: 'Not authorized to make payment for this enrollment' });
      return;
    }

    if (!enrollment.course) {
      res.status(404).json({ message: 'Course not found for this enrollment' });
      return;
    }

    // Check if enrollment has a voucher code and get voucher details
    let voucherData = null;
    let finalAmount = amount;
    let originalAmount = amount;
    let discountAmount = 0;

    if (enrollment.voucherCode) {
      const voucher = await Voucher.findOne({ code: enrollment.voucherCode.toUpperCase() });
      if (voucher) {
        // Calculate discount based on course price
        const course = await Course.findById(enrollment.course._id);
        if (course) {
          originalAmount = course.price;
          discountAmount = (originalAmount * voucher.discountPercentage) / 100;
          finalAmount = originalAmount - discountAmount;
          voucherData = voucher;
        }
      }
    }

    const payment = new Payment({
      enrollment: enrollmentId,
      student: req.user._id,
      course: enrollment.course._id,
      amount: finalAmount,
      originalAmount: voucherData ? originalAmount : undefined,
      discountAmount: voucherData ? discountAmount : undefined,
      voucher: voucherData ? voucherData._id : undefined,
      paymentDate,
      paymentMethod,
      bankName,
      accountHolderNumber,
      transactionId,
      receiptPath: normalizeFilePath(file.path),
      statusHistory: [{
        status: PaymentStatus.PENDING,
        updatedBy: new Types.ObjectId(req.user._id),
        updatedAt: new Date()
      }]
    });

    await payment.save();

    // Create voucher usage record if voucher was applied
    if (voucherData && enrollment.voucherCode) {
      // Check if voucher usage already exists (shouldn't, but just in case)
      const existingUsage = await VoucherUsage.findOne({
        voucher: voucherData._id,
        student: req.user._id,
        enrollment: enrollmentId
      });

      if (!existingUsage) {
        const voucherUsage = new VoucherUsage({
          voucher: voucherData._id,
          student: req.user._id,
          course: enrollment.course._id,
          enrollment: enrollmentId,
          payment: payment._id,
          discountAmount: discountAmount,
          originalPrice: originalAmount,
          finalPrice: finalAmount,
          appliedBy: req.user._id
        });

        await voucherUsage.save();

        // Update voucher used count
        voucherData.usedCount += 1;
        await voucherData.save();
      }
    }

    // Notify createdBy about new payment
    const course = await Course.findById(enrollment.course._id)
      .populate('createdBy');
    
    if (course?.createdBy) {
      await sendNotification(
        course.createdBy._id.toString(),
        'New Payment Received',
        `A new payment has been submitted for course: ${course.title}`
      );
    }

    res.status(201).json(normalizePaymentPaths(payment));
  } catch (error) {
    res.status(500).json({ message: 'Error creating payment', error });
  }
};

// Update payment status
export const updatePaymentStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { paymentId } = req.params;
    const { status, reason } = req.body;

    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const payment = await Payment.findById(paymentId)
      .populate<{ course: ICourseDocument }>('course')
      .populate('enrollment');

    if (!payment) {
      res.status(404).json({ message: 'Payment not found' });
      return;
    }

    // Check authorization
    if (req.user.role !== UserRole.ADMIN) {
      const course = await Course.findById(payment.course);
      if (!course || course.createdBy.toString() !== req.user._id.toString()) {
        res.status(403).json({ message: 'Not authorized to update payment status' });
        return;
      }
    }

    // Update payment status
    payment.status = status;
    payment.statusHistory.push({
      status,
      updatedBy: new Types.ObjectId(req.user._id),
      updatedAt: new Date(),
      reason
    });

    // If payment is rejected, reject the enrollment
    if (status === PaymentStatus.REJECTED && payment.enrollment) {
      const enrollmentId = payment.enrollment instanceof Types.ObjectId 
        ? payment.enrollment 
        : payment.enrollment._id;
      
      await Enrollment.findByIdAndUpdate(enrollmentId, {
        status: EnrollmentStatus.REJECTED,
        rejectionReason: reason || 'Payment was rejected'
      });
    }

    await payment.save();

    // Notify student about payment status update
    await sendNotification(
      payment.student.toString(),
      'Payment Status Updated',
      `Your payment status has been updated to ${status}${reason ? ': ' + reason : ''}`
    );

    res.status(200).json(normalizePaymentPaths(payment));
  } catch (error) {
    res.status(500).json({ message: 'Error updating payment status', error });
  }
};

// Get payments (filtered by role)
export const getPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { status, courseId, startDate, endDate } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Build query based on role and filters
    const query: any = {};

    // Apply role-based filters
    if (req.user.role === UserRole.STUDENT) {
      query.student = req.user._id;
    } else if (req.user.role === UserRole.INSTRUCTOR) {
      const courses = await Course.find({ createdBy: req.user._id });
      query.course = { $in: courses.map(course => course._id) };
    }

    // Apply optional filters
    if (status) {
      query.status = status;
    }
    if (courseId) {
      query.course = new Types.ObjectId(courseId as string);
    }
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) {
        query.paymentDate.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.paymentDate.$lte = new Date(endDate as string);
      }
    }

    // Get total count for pagination
    const total = await Payment.countDocuments(query);

    // Execute query with pagination
    const payments = await Payment.find(query)
      .populate<{ course: ICourseDocument }>('course')
      .populate('student', 'firstName lastName email')
      .populate('enrollment')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Normalize file paths for all payments
    const normalizedPayments = payments.map(payment => normalizePaymentPaths(payment));

    res.status(200).json({
      payments: normalizedPayments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payments', error });
  }
};

// Get payment by ID
export const getPaymentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { paymentId } = req.params;

    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const payment = await Payment.findById(paymentId)
      .populate<{ course: ICourseDocument }>('course')
      .populate('student', 'firstName lastName email')
      .populate('enrollment');

    if (!payment) {
      res.status(404).json({ message: 'Payment not found' });
      return;
    }

    // Check authorization
    const populatedStudent = payment.student as any;
    if (req.user.role === UserRole.STUDENT && 
        populatedStudent._id.toString() !== req.user._id.toString()) {
      res.status(403).json({ message: 'Not authorized to view this payment' });
      return;
    } else if (req.user.role === UserRole.INSTRUCTOR) {
      const course = await Course.findById(payment.course);
      if (!course || course.createdBy.toString() !== req.user._id.toString()) {
        res.status(403).json({ message: 'Not authorized to view this payment' });
        return;
      }
    }

    res.status(200).json(normalizePaymentPaths(payment));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payment', error });
  }
};

// Reupload payment receipt
export const reuploadPaymentReceipt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { paymentId } = req.params;
    const file = req.file;

    if (!file) {
      res.status(400).json({ message: 'Payment receipt is required' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      res.status(404).json({ message: 'Payment not found' });
      return;
    }

    if (payment.student.toString() !== req.user._id.toString()) {
      res.status(403).json({ message: 'Not authorized to update this payment' });
      return;
    }

    if (payment.status !== PaymentStatus.REJECTED) {
      res.status(400).json({ message: 'Can only reupload receipt for rejected payments' });
      return;
    }

    payment.receiptPath = normalizeFilePath(file.path);
    payment.status = PaymentStatus.PENDING;
    payment.statusHistory.push({
      status: PaymentStatus.PENDING,
      updatedBy: new Types.ObjectId(req.user._id),
      updatedAt: new Date(),
      reason: 'Receipt reuploaded'
    });

    await payment.save();

    // Notify createdBy about reuploaded receipt
    const course = await Course.findById(payment.course)
      .populate('createdBy');
    
    if (course?.createdBy) {
      await sendNotification(
        course.createdBy._id.toString(),
        'Payment Receipt Reuploaded',
        `A payment receipt has been reuploaded for course: ${course.title}`
      );
    }

    res.status(200).json(normalizePaymentPaths(payment));
  } catch (error) {
    res.status(500).json({ message: 'Error reuploading payment receipt', error });
  }
};

// Get invoice PDF
export const getInvoicePDF = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { paymentId } = req.params;
    
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const payment = await Payment.findById(paymentId)
      .populate('student')
      .populate('course');
    
    if (!payment) {
      res.status(404).json({ message: 'Payment not found' });
      return;
    }
    
    // Check authorization
    if (req.user.role !== UserRole.ADMIN && 
        payment.student.toString() !== req.user._id.toString()) {
      res.status(403).json({ message: 'Not authorized to view this invoice' });
      return;
    }
    
    // Check if invoice file exists
    if (!payment.receiptPath || !fs.existsSync(payment.receiptPath)) {
      res.status(404).json({ message: 'Invoice not found' });
      return;
    }
    
    // Send PDF file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="invoice-${paymentId}.pdf"`);
    res.sendFile(path.resolve(payment.receiptPath));
    
  } catch (error) {
    console.error('Error serving invoice PDF:', error);
    res.status(500).json({ message: 'Error serving invoice' });
  }
};
