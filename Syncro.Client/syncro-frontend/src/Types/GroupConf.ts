import { HubConnection } from "@microsoft/signalr";

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
    groupId: string;
    participants: GroupParticipant[];
    localStream: MediaStream | null;
    remoteStreams: Map<string, MediaStream>;
    onEndCall: () => void;
    localUserName: string;
    localAvatarUrl: string;
    replaceVideoTrack: (track: MediaStreamTrack) => void;
    signalRConnection: HubConnection | null;
    currentUserId: string;
}