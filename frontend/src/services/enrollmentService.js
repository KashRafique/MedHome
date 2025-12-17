import api from './api';

export const enrollInCourse = async (courseId, paymentReceipt, voucherCode) => {
    try {
        const formData = new FormData();
        formData.append('paymentReceipt', {
            uri: paymentReceipt.uri,
            type: paymentReceipt.type,
            name: paymentReceipt.name,
        });
        if (voucherCode) {
            formData.append('voucherCode', voucherCode);
        }

        const response = await api.post(
            `/api/enrollments/courses/${courseId}/enroll`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            },
        );
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getMyEnrollments = async () => {
    try {
        const response = await api.get('/api/enrollments/my-enrollments');
        return response.data;
    } catch (error) {
        throw error;
    }
};

