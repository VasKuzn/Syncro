import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Friend } from '../Types/FriendType';

interface FriendsContextType {
    friends: Friend[];
    setFriends: React.Dispatch<React.SetStateAction<Friend[]>>;
    onFriendAdded: () => void;
}

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

export const FriendsProvider = ({ children }: { children: ReactNode }) => {
    const [friends, setFriends] = useState<Friend[]>([]);

    const onFriendAdded = () => {
        // Можно оставить пустым, т.к. setFriends уже обновляет список.
        // При необходимости добавьте перезагрузку друзей из API.
    };

    return (
        <FriendsContext.Provider value={{ friends, setFriends, onFriendAdded }}>
            {children}
        </FriendsContext.Provider>
    );
};

export const useFriends = () => {
    const context = useContext(FriendsContext);
    if (!context) throw new Error('useFriends must be used within FriendsProvider');
    return context;
};