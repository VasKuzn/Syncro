import { useState, useEffect, useCallback } from 'react';
import { Friend } from '../Types/FriendType';
import { ShortFriend } from '../Types/FriendType';
import { UserInfo } from '../Types/UserInfo';
import { fetchCurrentUser } from '../Services/MainFormService';
import { fetchUserById, initializeEncryptionWithFriend } from '../Services/ChatService'
import { getPersonalConferenceById } from '../Services/ChatService';
import { useLocation } from 'react-router-dom';
import { encryptionService } from '../Services/EncryptionService';

export const useChatInitialization = () => {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [personalConference, setPersonalConference] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [currentFriend, setCurrentFriend] = useState<ShortFriend | null>(null);
    const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
    const [encryptionSessionReady, setEncryptionSessionReady] = useState(false);
    const location = useLocation();

    const initializeUser = useCallback(async () => {
        const userId = await fetchCurrentUser();
        if (!userId) return;

        setCurrentUserId(userId);
        encryptionService.setCurrentUserId(userId);

        try {
            const publicKey = await encryptionService.getPublicKey(userId);
            if (!publicKey) {
                await encryptionService.generateKeys(userId);
            }
        } catch (error) {
            console.warn('Failed to initialize user encryption:', error);
        }
    }, []);

    useEffect(() => {
        initializeUser();

        if (location.state?.friends) {
            setFriends(location.state.friends);
        }
        if (location.state?.personalConferenceId) {
            setPersonalConference(location.state.personalConferenceId);
        }
    }, [initializeUser, location.state]);

    useEffect(() => {
        const fetchCurrentUserData = async () => {
            if (!currentUserId) return;
            try {
                const currentUserData = await fetchUserById(currentUserId);
                setCurrentUser(currentUserData);
            } catch (err) {
                console.error('Failed to load current user', err);
            }
        };
        fetchCurrentUserData();
    }, [currentUserId]);

    useEffect(() => {
        const fetchConferenceAndFriend = async () => {
            if (!personalConference || !currentUserId) return;
            try {
                const conf = await getPersonalConferenceById(personalConference);
                const friendId = String(conf.user1).toLowerCase() === String(currentUserId).toLowerCase()
                    ? conf.user2
                    : conf.user1;
                const friendData = await fetchUserById(friendId);
                setCurrentFriend(friendData);
            } catch (err) {
                console.error('Failed to load conference or friend', err);
            }
        };
        fetchConferenceAndFriend();
    }, [personalConference, currentUserId]);

    useEffect(() => {
        const initializeEncryption = async () => {
            if (currentFriend?.id && currentUserId) {
                try {
                    const success = await initializeEncryptionWithFriend(currentFriend.id, currentUserId);
                    setEncryptionSessionReady(success);
                } catch (error) {
                    console.error('Error initializing encryption with friend:', error);
                    setEncryptionSessionReady(false);
                }
            }
        };

        if (currentFriend && currentUserId) {
            initializeEncryption();
        }
    }, [currentFriend, currentUserId]);

    return {
        friends,
        setFriends,
        personalConference,
        currentUserId,
        currentFriend,
        currentUser,
        encryptionSessionReady,
        setEncryptionSessionReady
    };
};