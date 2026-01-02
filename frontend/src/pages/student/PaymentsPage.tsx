import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheckCircle, 
  faTimesCircle, 
  faSpinner,
  faEye,
  faDownload
} from '@fortawesome/free-solid-svg-icons';
import Modal from 'react-modal';
import { useAuth } from '../../contexts/AuthContext';
import { MainLayout } from '../../components/layout/MainLayout';
import api from '../../utils/axios';
import { EnrollmentStatus } from '../../types/enrollment';

// API path for uploads (using relative URL to work with both localhost and production domains)
const API_UPLOADS_URL = '/api/uploads'; // URL for accessing uploaded files

// Modal styles
const customModalStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    maxWidth: '800px',
    width: '90%',
    maxHeight: '90vh',
    padding: '2rem',
    borderRadius: '0.5rem',
    overflow: 'auto',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    overflow: 'auto',
    paddingTop: '2rem',
    paddingBottom: '2rem',
  },
};

interface Payment {
  _id: string;
  course: {
    _id: string;
    title: string;
    price: number;
  };
  status: EnrollmentStatus;
  enrollmentDate: string;
  paymentReceipt?: string;
  paymentMethod?: string;
  rejectionReason?: string;
}

export const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Fetch student's payments (enrollments)
  const { data: payments = [], isLoading, error } = useQuery<Payment[], Error>({
    queryKey: ['student-payments'],
    queryFn: async () => {
      const response = await api.get<Payment[]>('/enrollments/my-enrollments');
      return response.data;
    },
  });

  // Handle query errors
  React.useEffect(() => {
    if (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error fetching payments';
      toast.error(errorMessage);
    }
  }, [error]);

  const getStatusIcon = (status: EnrollmentStatus) => {
    switch (status) {
      case EnrollmentStatus.APPROVED:
        return <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />;
      case EnrollmentStatus.REJECTED:
        return <FontAwesomeIcon icon={faTimesCircle} className="text-red-500" />;
      case EnrollmentStatus.PENDING:
        return <FontAwesomeIcon icon={faSpinner} className="text-yellow-500 animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusClass = (status: EnrollmentStatus) => {
    switch (status) {
      case EnrollmentStatus.APPROVED:
        return 'bg-green-100 text-green-800';
      case EnrollmentStatus.REJECTED:
        return 'bg-red-100 text-red-800';
      case EnrollmentStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return '';
    }
  };

  const getReceiptUrl = (receiptPath?: string) => {
    if (!receiptPath) {
      console.error('Receipt path is empty');
      return '';
    }
    
    // If it's already a full URL, return it as is
    if (receiptPath.startsWith('http')) {
      return receiptPath;
    }
    
    // Normalize the path: convert backslashes to forward slashes and remove uploads prefix
    let path = receiptPath;
    
    // Convert Windows backslashes to forward slashes
    path = path.replace(/\\/g, '/');
    
    // Remove 'uploads/' or 'uploads\' prefix if present (handles both forward and backslashes)
    path = path.replace(/^uploads[/\\]/, '');
    
    // Ensure there's no leading slash when joining paths
    path = path.startsWith('/') ? path.substring(1) : path;
    
    // Use the correct API endpoint for accessing uploaded files with relative URL
    // This ensures it works with both localhost and production domains
    return `${API_UPLOADS_URL}/${path}`;
  };

  const handleViewReceipt = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsReceiptModalOpen(true);
  };

  const handleDownloadReceipt = async (payment: Payment) => {
    try {
      if (!payment.paymentReceipt) {
        toast.error('No receipt available for download');
        return;
      }
      
      const receiptUrl = getReceiptUrl(payment.paymentReceipt);
      console.log('Downloading receipt from URL:', receiptUrl);
      
      const response = await fetch(receiptUrl);
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const fileExtension = payment.paymentReceipt.split('.').pop() || 'pdf';
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt-${payment._id}.${fileExtension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Receipt downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Error downloading receipt: ${errorMessage}`);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">My Payments</h1>
          <div className="text-sm text-gray-600">
            {payments.length} payment{payments.length !== 1 ? 's' : ''}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No payment history found.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(payment.enrollmentDate), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {payment.course?.title || 'Course unavailable'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${payment.course?.price || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.paymentMethod === 'paypal' ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            Card Payment
                          </span>
                        ) : (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            Manual
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(payment.status)}`}>
                          {getStatusIcon(payment.status)}
                          <span className="ml-1">{payment.status}</span>
                        </span>
                        {payment.status === EnrollmentStatus.REJECTED && payment.rejectionReason && (
                          <p className="text-xs text-red-600 mt-1">{payment.rejectionReason}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => handleViewReceipt(payment)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          title="View Receipt"
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                        <button
                          onClick={() => handleDownloadReceipt(payment)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Download Receipt"
                        >
                          <FontAwesomeIcon icon={faDownload} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {payments.map((payment) => (
                <div key={payment._id} className="bg-white rounded-lg shadow-md p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
                        {payment.course?.title || 'Course unavailable'}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(payment.enrollmentDate), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className="flex items-center ml-3">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(payment.status)}`}>
                        {getStatusIcon(payment.status)}
                        <span className="ml-1">{payment.status}</span>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Amount</p>
                      <p className="font-semibold text-gray-900">${payment.course?.price || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Payment Method</p>
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        payment.paymentMethod === 'paypal' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {payment.paymentMethod === 'paypal' ? 'Card Payment' : 'Manual'}
                      </span>
                    </div>
                  </div>

                  {payment.status === EnrollmentStatus.REJECTED && payment.rejectionReason && (
                    <div className="mb-3 p-2 bg-red-50 rounded">
                      <p className="text-xs text-red-600">{payment.rejectionReason}</p>
                    </div>
                  )}

                  <div className="flex space-x-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleViewReceipt(payment)}
                      className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-600 rounded text-sm hover:bg-blue-100 transition-colors"
                    >
                      <FontAwesomeIcon icon={faEye} className="w-4 h-4 mr-2" />
                      View Receipt
                    </button>
                    <button
                      onClick={() => handleDownloadReceipt(payment)}
                      className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-50 text-gray-600 rounded text-sm hover:bg-gray-100 transition-colors"
                    >
                      <FontAwesomeIcon icon={faDownload} className="w-4 h-4 mr-2" />
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Receipt Viewer Modal */}
        <Modal
          isOpen={isReceiptModalOpen}
          onRequestClose={() => setIsReceiptModalOpen(false)}
          style={customModalStyles}
          contentLabel="View Receipt"
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Payment Receipt</h2>
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            {selectedPayment && (
              <div className="space-y-4">
                <div className="border rounded-lg p-4 space-y-2">
                  <p><strong>Course:</strong> {selectedPayment.course?.title || 'Course unavailable'}</p>
                  <p><strong>Amount:</strong> ${selectedPayment.course?.price || 0}</p>
                  <p><strong>Date:</strong> {format(new Date(selectedPayment.enrollmentDate), 'MMMM dd, yyyy')}</p>
                  <p><strong>Status:</strong> {selectedPayment.status}</p>
                  {selectedPayment.rejectionReason && (
                    <p><strong>Rejection Reason:</strong> {selectedPayment.rejectionReason}</p>
                  )}
                </div>
                
                <div className="mt-4">
                  {selectedPayment.paymentReceipt && selectedPayment.paymentReceipt.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                    <>
                      <div className="mb-4 p-2 bg-blue-50 text-blue-800 rounded">
                        <p><strong>Troubleshooting:</strong></p>
                        <p>If image doesn't appear, try opening this URL directly:</p>
                        <a 
                          href={getReceiptUrl(selectedPayment.paymentReceipt)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 underline break-all"
                        >
                          {getReceiptUrl(selectedPayment.paymentReceipt)}
                        </a>
                      </div>
                      <img
                        src={getReceiptUrl(selectedPayment.paymentReceipt)}
                        alt="Payment Receipt"
                        className="max-w-full h-auto rounded-lg border"
                        onError={(e) => {
                          console.error('Image failed to load:', getReceiptUrl(selectedPayment.paymentReceipt));
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = '/placeholder-receipt.png';
                        }}
                      />
                    </>
                  ) : (
                    <>
                      <div className="mb-4 p-2 bg-blue-50 text-blue-800 rounded">
                        <p><strong>Troubleshooting:</strong></p>
                        <p>If PDF doesn't appear, try opening this URL directly:</p>
                        <a 
                          href={getReceiptUrl(selectedPayment.paymentReceipt)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 underline break-all"
                        >
                          {getReceiptUrl(selectedPayment.paymentReceipt)}
                        </a>
                      </div>
                      <embed
                        src={getReceiptUrl(selectedPayment.paymentReceipt)}
                        type="application/pdf"
                        width="100%"
                        height="600px"
                        className="rounded-lg border"
                      />
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </MainLayout>
  );
};
