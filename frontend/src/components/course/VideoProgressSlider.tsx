import React, { useRef, useState } from 'react';
import { View, StyleSheet, PanResponder } from 'react-native';

interface VideoProgressSliderProps {
    currentTime: number;
    duration: number;
    onSeek: (time: number) => void;
    onSlidingStart: () => void;
    onSlidingComplete: (time: number) => void;
    mainColor?: string;
    trackColor?: string;
}

export const VideoProgressSlider: React.FC<VideoProgressSliderProps> = ({
    currentTime,
    duration,
    onSeek,
    onSlidingStart,
    onSlidingComplete,
    mainColor = '#007AFF',
    trackColor = 'rgba(255,255,255,0.2)',
}) => {
    const [sliderWidth, setSliderWidth] = useState(0);
    const sliderWidthRef = useRef(0);
    const sliderViewRef = useRef<View>(null);
    const sliderPageX = useRef(0);

    const sliderPanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt, gestureState) => {
                onSlidingStart();

                // Robust calculation using screen coordinates
                const measuredPageX = sliderPageX.current;
                const x0 = gestureState.x0;
                const touchX = x0 - measuredPageX;

                console.log('Slider Grant:', { x0, measuredPageX, touchX, width: sliderWidthRef.current, duration });

                if (duration <= 0) {
                    console.warn('Slider used before duration available');
                    return;
                }

                const width = sliderWidthRef.current;
                if (width > 0) {
                    const percent = Math.max(0, Math.min(1, touchX / width));
                    const newTime = percent * duration;
                    onSeek(newTime);
                }
            },
            onPanResponderMove: (evt, gestureState) => {
                const width = sliderWidthRef.current;
                if (width > 0 && duration > 0) {
                    const currentX = gestureState.moveX - sliderPageX.current;
                    const percent = Math.max(0, Math.min(1, currentX / width));
                    const newTime = percent * duration;
                    onSeek(newTime);
                }
            },
            onPanResponderRelease: (evt, gestureState) => {
                const width = sliderWidthRef.current;
                if (width > 0 && duration > 0) {
                    const currentX = gestureState.moveX - sliderPageX.current;
                    const percent = Math.max(0, Math.min(1, currentX / width));
                    const newTime = percent * duration;
                    onSlidingComplete(newTime);
                }
            },
        })
    ).current;

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <View
            ref={sliderViewRef}
            style={styles.sliderContainer}
            onLayout={(e) => {
                const w = e.nativeEvent.layout.width;
                setSliderWidth(w);
                sliderWidthRef.current = w;
                sliderViewRef.current?.measure((x, y, width, height, pageX, pageY) => {
                    sliderPageX.current = pageX;
                });
            }}
            {...sliderPanResponder.panHandlers}
        >
            <View style={[styles.sliderTrack, { backgroundColor: trackColor }]} pointerEvents="none" />
            <View
                style={[styles.sliderFill, { width: `${progressPercent}%`, backgroundColor: mainColor }]}
                pointerEvents="none"
            />
            <View
                style={[
                    styles.sliderThumb,
                    { left: `${progressPercent}%`, backgroundColor: mainColor },
                ]}
                pointerEvents="none"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    sliderContainer: {
        width: '100%',
        height: 40,
        justifyContent: 'center',
        marginBottom: 4,
    },
    sliderTrack: {
        height: 4,
        borderRadius: 2,
        width: '100%',
        position: 'absolute',
    },
    sliderFill: {
        height: 4,
        borderRadius: 2,
        position: 'absolute',
    },
    sliderThumb: {
        width: 14,
        height: 14,
        borderRadius: 7,
        position: 'absolute',
        marginLeft: -7,
        borderWidth: 2,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 4,
    },
});
