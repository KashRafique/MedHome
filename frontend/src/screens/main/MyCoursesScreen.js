import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    TouchableOpacity,
    Image,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { getMyEnrollments } from '../../services/enrollmentService';
import { getImageUrl } from '../../utils/imageUtils';

const MyCoursesScreen = ({ navigation }) => {
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchEnrollments();
    }, []);

    const fetchEnrollments = async () => {
        try {
            const data = await getMyEnrollments();
            setEnrollments(data);
        } catch (error) {
            console.error('Error fetching enrollments:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchEnrollments();
    };

    const renderItem = ({ item }) => {
        const course = item.course;
        const enrollmentStatus = item.status; // 'pending', 'approved', 'rejected'
        
        // Determine status display
        const getStatusConfig = (status) => {
            switch (status) {
                case 'approved':
                    return {
                        text: 'Active',
                        backgroundColor: COLORS.success + '20',
                        textColor: COLORS.success,
                    };
                case 'pending':
                    return {
                        text: 'Pending Approval',
                        backgroundColor: '#FFA500' + '20',
                        textColor: '#FFA500',
                    };
                case 'rejected':
                    return {
                        text: 'Rejected',
                        backgroundColor: (COLORS.error || '#EF4444') + '20',
                        textColor: COLORS.error || '#EF4444',
                    };
                default:
                    return {
                        text: 'Active',
                        backgroundColor: COLORS.success + '20',
                        textColor: COLORS.success,
                    };
            }
        };

        const statusConfig = getStatusConfig(enrollmentStatus);

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('CourseDetail', { 
                    course: { 
                        ...course, 
                        enrolled: true,
                        enrollmentStatus: enrollmentStatus 
                    } 
                })}
                activeOpacity={0.9}>
                {getImageUrl(course.thumbnail || course.image) ? (
                    <Image 
                        source={{ uri: getImageUrl(course.thumbnail || course.image) }} 
                        style={styles.thumbnail}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[styles.thumbnail, styles.placeholderThumbnail]}>
                        <Text style={styles.placeholderText}>📚</Text>
                    </View>
                )}
                <View style={styles.content}>
                    <Text style={styles.title} numberOfLines={2}>
                        {course.title}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusConfig.backgroundColor }]}>
                        <Text style={[styles.statusText, { color: statusConfig.textColor }]}>
                            {statusConfig.text}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuButton}>
                    <Text style={styles.menuIcon}>☰</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Courses</Text>
            </View>

            <FlatList
                data={enrollments}
                renderItem={renderItem}
                keyExtractor={item => item._id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>You haven't enrolled in any courses yet.</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: COLORS.primary,
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuButton: {
        marginRight: 16,
    },
    menuIcon: {
        fontSize: 24,
        color: COLORS.white,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    listContent: {
        padding: 16,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
        flexDirection: 'row',
    },
    thumbnail: {
        width: 100,
        height: 100,
        backgroundColor: COLORS.borderLight,
    },
    placeholderThumbnail: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.borderLight,
    },
    placeholderText: {
        fontSize: 32,
    },
    content: {
        flex: 1,
        padding: 12,
        justifyContent: 'center',
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 8,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
});

export default MyCoursesScreen;
