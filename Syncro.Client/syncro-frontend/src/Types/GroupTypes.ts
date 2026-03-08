// Тип для группы
export interface GroupConference {
    id: string;
    conferenceName: string;
    conferenceAvatar?: string | null;
}

// Тип для создания группы
export interface CreateGroupData {
    name: string;
    participantIds: string[];
}