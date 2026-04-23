import { HubConnection } from "@microsoft/signalr";
import { VideoQuality } from "../Hooks/UseGroupRtcConnection";

export interface GroupConf {
    id: string;
    conferenceName: string;
    groupConferenceType: number;
}
export interface GroupParticipant {
    id: string;
    nickname: string;
    avatar?: string;
    isOnline?: boolean;
}

export interface GroupVideoCallProps {
    roomId: string;
    participants: { id: string; nickname: string; avatar: string }[];
    localStream: MediaStream | null;
    remoteStreams: Map<string, MediaStream>;
    onEndCall: () => void;
    localUserName: string;
    localAvatarUrl: string;
    replaceVideoTrack: (track: MediaStreamTrack) => void;
    currentUserId: string;
    onVolumeChange: (volume: number) => void;
    onQualityChange: (quality: VideoQuality) => void;
    onAudioFiltersChange: (filters: { echoCancellation: boolean; noiseSuppression: boolean; autoGainControl: boolean }) => void;
    currentVolume: number;
    currentQuality: VideoQuality;
    currentFilters: {
        echoCancellation: boolean; noiseSuppression: boolean; autoGainControl: boolean
    }
}