import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, PanResponder, Animated, DimensionValue } from 'react-native';
import { COLORS } from '../../constants/colors';

interface CustomSliderProps {
    value: number;
    minimumValue: number;
    maximumValue: number;
    onValueChange?: (value: number) => void;
    onSlidingStart?: () => void;
    onSlidingComplete?: (value: number) => void;
    trackColor?: string;
    thumbColor?: string;
    thumbSize?: number;
    style?: any;
}

export const CustomSlider: React.FC<CustomSliderProps> = ({
    value,
    minimumValue = 0,
    maximumValue = 100,
    onValueChange,
    onSlidingStart,
    onSlidingComplete,
    trackColor = COLORS.primary || '#007AFF',
    thumbColor = COLORS.primary || '#007AFF',
    thumbSize = 14,
    style,
}) => {
    const [containerWidth, setContainerWidth] = useState(0);
    const isDragging = useRef(false);

    // Calculate percentage for position
    const getPercentage = (currentValue: number) => {
        const range = maximumValue - minimumValue;
        if (range === 0) return 0;
        return Math.max(0, Math.min(1, (currentValue - minimumValue) / range));
    };



    // We need a separate PanResponder implementation that works reliably with View's onLayout
    // The locationX in Grant is reliable. In Move, we use dx.

    // Let's refine the PanResponder logic to be stateless regarding value (controlled by parent)
    // But we need to emit changes.
    const startX = useRef(0);
    const startValue = useRef(0);

    const customPanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt) => {
                isDragging.current = true;
                onSlidingStart?.();

                const locationX = evt.nativeEvent.locationX;
                startX.current = locationX;

                // Calculate new value immediately on tap
                if (containerWidth > 0) {
                    const percentage = Math.max(0, Math.min(1, locationX / containerWidth));
                    const newValue = minimumValue + percentage * (maximumValue - minimumValue);
                    startValue.current = newValue; // Store where we started (in value units)
                    onValueChange?.(newValue);
                }
            },
            onPanResponderMove: (evt, gestureState) => {
                if (containerWidth > 0) {
                    // New position = Start Touch X + Drag Distance
                    const newX = startX.current + gestureState.dx;
                    const percentage = Math.max(0, Math.min(1, newX / containerWidth));
                    const newValue = minimumValue + percentage * (maximumValue - minimumValue);
                    onValueChange?.(newValue);
                }
            },
            onPanResponderRelease: (evt, gestureState) => {
                isDragging.current = false;
                if (containerWidth > 0) {
                    const newX = startX.current + gestureState.dx;
                    const percentage = Math.max(0, Math.min(1, newX / containerWidth));
                    const newValue = minimumValue + percentage * (maximumValue - minimumValue);
                    onSlidingComplete?.(newValue);
                }
            },
        })
    ).current;

    const percent = getPercentage(value);

    return (
        <View
            style={[styles.container, style]}
            onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
            {...customPanResponder.panHandlers}
        >
            {/* Background Track */}
            <View style={styles.trackBackground} />

            {/* Filled Track */}
            <View
                style={[
                    styles.trackFill,
                    {
                        width: `${percent * 100}%`,
                        backgroundColor: trackColor
                    }
                ]}
                pointerEvents="none"
            />

            {/* Thumb */}
            <View
                style={[
                    styles.thumb,
                    {
                        left: `${percent * 100}%`,
                        width: thumbSize,
                        height: thumbSize,
                        borderRadius: thumbSize / 2,
                        backgroundColor: thumbColor,
                        marginLeft: -thumbSize / 2, // Center the thumb
                        // transform: [{ scale: isDragging.current ? 1.2 : 1 }] // Optional pop effect
                    }
                ]}
                pointerEvents="none"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 40,
        justifyContent: 'center',
        width: '100%',
    },
    trackBackground: {
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 2,
        width: '100%',
        position: 'absolute',
    },
    trackFill: {
        height: 4,
        borderRadius: 2,
        position: 'absolute',
        left: 0,
    },
    thumb: {
        position: 'absolute',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    }
});
