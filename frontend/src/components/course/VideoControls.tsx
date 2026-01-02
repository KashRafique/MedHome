import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated, PanResponder } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { VideoProgressSlider } from './VideoProgressSlider';

interface VideoControlsProps {
    // Playback state
    currentTime: number;
    duration: number;
    paused: boolean;

    // Actions
    onTogglePlay: () => void;
    onSeek: (time: number) => void;
    onSlidingStart: () => void;
    onSlidingComplete: (time: number) => void;
    onBack: () => void;

    // Metadata
    title?: string;

    // Volume
    volume: number;
    muted: boolean;
    onVolumeChange: (vol: number) => void;
    onToggleMute: () => void;

    // Quality
    selectedQuality: string;
    onOpenQualityMenu: () => void;

    // Styling
    opacity: Animated.Value;
}

export const VideoControls: React.FC<VideoControlsProps> = ({
    currentTime,
    duration,
    paused,
    onTogglePlay,
    onSeek,
    onSlidingStart,
    onSlidingComplete,
    onBack,
    title,
    volume,
    muted,
    onVolumeChange,
    onToggleMute,
    selectedQuality,
    onOpenQualityMenu,
    opacity,
}) => {
    const [showVolumeSlider, setShowVolumeSlider] = useState(false);

    const formatTime = (secs: number): string => {
        if (!isFinite(secs)) return '0:00';
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const volumePanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt) => {
                onSlidingStart(); // Reset hide timer
                const touchX = evt.nativeEvent.locationX;
                const percent = Math.max(0, Math.min(1, touchX / 100));
                onVolumeChange(percent);
            },
            onPanResponderMove: (evt, gestureState) => {
                const newX = evt.nativeEvent.locationX;
                const percent = Math.max(0, Math.min(1, newX / 100));
                onVolumeChange(percent);
            },
        })
    ).current;

    return (
        <Animated.View style={[styles.controlsOverlay, { opacity }]} pointerEvents="box-none">
            {/* Top Bar */}
            <View style={styles.topBar} pointerEvents="box-none">
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Icon name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
                {title && <Text style={styles.title} numberOfLines={1}>{title}</Text>}
                <TouchableOpacity onPress={onOpenQualityMenu} style={styles.qualityButton}>
                    <Text style={styles.qualityText}>{selectedQuality}</Text>
                    <Icon name="cog" size={16} color="#fff" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
            </View>

            {/* Center Play/Pause */}
            <View style={styles.centerPlay} pointerEvents="box-none">
                <TouchableOpacity onPress={onTogglePlay} style={styles.playPauseButton}>
                    <Icon name={paused ? 'play' : 'pause'} size={48} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Bottom Controls */}
            <View style={styles.bottomBar} pointerEvents="box-none">
                <VideoProgressSlider
                    currentTime={currentTime}
                    duration={duration}
                    onSeek={onSeek}
                    onSlidingStart={onSlidingStart}
                    onSlidingComplete={onSlidingComplete}
                />

                <View style={styles.timeRow}>
                    <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                    <Text style={styles.timeText}>{formatTime(duration)}</Text>
                </View>

                <View style={styles.controlsRow}>
                    {/* Volume Group */}
                    <View style={styles.volumeGroup}>
                        <TouchableOpacity onPress={onToggleMute} style={styles.volumeBtn}>
                            <Icon
                                name={muted || volume === 0 ? 'volume-off' : volume < 0.5 ? 'volume-down' : 'volume-up'}
                                size={20}
                                color="#fff"
                            />
                        </TouchableOpacity>
                        {showVolumeSlider && (
                            <View style={styles.volumeSliderBox} {...volumePanResponder.panHandlers}>
                                <View style={styles.volumeTrack} />
                                <View style={[styles.volumeFill, { width: `${volume * 100}%` }]} />
                                <View style={[styles.volumeThumb, { left: `${volume * 100}%` }]} />
                            </View>
                        )}
                        <TouchableOpacity onPress={() => setShowVolumeSlider(!showVolumeSlider)} style={styles.expandBtn}>
                            <Icon name={showVolumeSlider ? 'chevron-down' : 'chevron-up'} size={14} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    controlsOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 2 },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 12,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    backButton: { padding: 8 },
    title: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '600', marginHorizontal: 12 },
    qualityButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
    },
    qualityText: { color: '#fff', fontSize: 13, fontWeight: '700' },

    centerPlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    playPauseButton: {
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 40,
    },

    bottomBar: {
        paddingHorizontal: 16,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },

    timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    timeText: { color: '#fff', fontSize: 12, fontWeight: '500' },

    controlsRow: { flexDirection: 'row', alignItems: 'center' },
    volumeGroup: { flexDirection: 'row', alignItems: 'center' },
    volumeBtn: { padding: 8 },
    volumeSliderBox: { width: 100, height: 30, justifyContent: 'center', marginHorizontal: 8, position: 'relative' },
    volumeTrack: { height: 3, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 1.5, width: '100%', position: 'absolute' },
    volumeFill: { height: 3, backgroundColor: '#007AFF', borderRadius: 1.5, position: 'absolute' },
    volumeThumb: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#007AFF', position: 'absolute', marginLeft: -6, borderWidth: 2, borderColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 3 },
    expandBtn: { padding: 8 },
});
