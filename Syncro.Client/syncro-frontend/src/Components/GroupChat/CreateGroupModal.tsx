import React, { useState, useEffect } from 'react';
import { Friend } from '../../Types/FriendType';
import { createGroup, addGroupMember } from '../../Services/GroupService';

interface CreateGroupModalProps {
    isOpen: boolean;              // открыто или нет
    onClose: () => void;          // функция закрытия
    friends: Friend[];            // список друзей
    onGroupCreated: (groupId: string) => void; // что делать после создания
    currentUserId: string | null; // ID текущего пользователя
    baseUrl: string;
    csrfToken: string | null
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
    isOpen,
    onClose,
    friends,
    onGroupCreated,
    currentUserId,
    baseUrl,
    csrfToken
}) => {
    // Состояния компонента
    const [groupName, setGroupName] = useState('');           // название группы
    const [selectedFriends, setSelectedFriends] = useState<string[]>([]); // выбранные друзья
    const [searchQuery, setSearchQuery] = useState('');       // поиск по друзьям
    const [isCreating, setIsCreating] = useState(false);      // идет создание?

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    // Если модалка закрыта - не показываем ничего
    if (!isOpen) return null;

    // Если модалка закрыта - не показываем ничего
    if (!isOpen) return null;

    // Добавить/убрать друга из списка
    const toggleFriend = (friendId: string) => {
        setSelectedFriends(prev =>
            prev.includes(friendId)
                ? prev.filter(id => id !== friendId)  // убрать
                : [...prev, friendId]                  // добавить
        );
    };

    // Создать группу
    const handleCreate = async () => {

        if (!groupName.trim() || selectedFriends.length === 0 || !currentUserId) return;

        setIsCreating(true);
        try {
            // 1. Создаем группу
            const group = await createGroup({
                conferenceName: groupName,
                groupConferenceType: 0,
            }, baseUrl, csrfToken);


            // 2. СОЗДАЕМ РОЛИ ДЛЯ ЭТОЙ ГРУППЫ

            // Роль администратора
            const adminRole = {
                id: crypto.randomUUID(),
                conferenceId: group.id,
                rolePermissions: 127  // Administrator (все права)
            };

            const adminResponse = await fetch(`${baseUrl}/api/grouprole`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || ''
                },
                body: JSON.stringify(adminRole)
            });

            if (!adminResponse.ok) {
                throw new Error('Не удалось создать роль администратора');
            }

            const adminRoleData = await adminResponse.json();

            // Роль обычного участника
            const memberRole = {
                id: crypto.randomUUID(),
                conferenceId: group.id,
                rolePermissions: 112  // BasicMessaging (только сообщения)
            };

            const memberResponse = await fetch(`${baseUrl}/api/grouprole`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || ''
                },
                body: JSON.stringify(memberRole)
            });

            if (!memberResponse.ok) {
                throw new Error('Не удалось создать роль участника');
            }

            const memberRoleData = await memberResponse.json();

            // 3. ТЕПЕРЬ ДОБАВЛЯЕМ УЧАСТНИКОВ С РОЛЯМИ

            // Добавляем создателя (админ)
            const creatorMember = {
                id: crypto.randomUUID(),
                accountId: currentUserId,
                groupConferenceId: group.id,
                joiningDate: new Date().toISOString(),
                groupConferenceNickname: null,
                roleId: adminRoleData.id  // ID созданной админ-роли
            };

            await fetch(`${baseUrl}/api/groupconferencemember`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || ''
                },
                body: JSON.stringify(creatorMember)
            });

            // Добавляем друзей (обычные участники)
            for (const friendId of selectedFriends) {
                const friendMember = {
                    id: crypto.randomUUID(),
                    accountId: friendId,
                    groupConferenceId: group.id,
                    joiningDate: new Date().toISOString(),
                    groupConferenceNickname: null,
                    roleId: memberRoleData.id  // ID созданной роли участника
                };

                await fetch(`${baseUrl}/api/groupconferencemember`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken || ''
                    },
                    body: JSON.stringify(friendMember)
                });

            }

            // 4. Переходим в группу
            onGroupCreated(group.id);
            onClose();
            setGroupName('');
            setSelectedFriends([]);

        } catch (error) {
            console.error('ОШИБКА:', error);
            alert('Не удалось создать группу: ' + (error as Error).message);
        } finally {
            setIsCreating(false);
        }
    };
    // Фильтруем друзей по поиску
    const filteredFriends = friends.filter(friend =>
        friend.nickname?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="create-group-modal-overlay" onClick={onClose}>
            <div className="create-group-modal" onClick={e => e.stopPropagation()}>
                <h2>Создать групповой чат</h2>

                {/* Название группы */}
                <input
                    type="text"
                    className="group-name-input"
                    placeholder="Название группы"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    autoFocus
                />

                {/* Поиск друзей */}
                <div className="search-friends">
                    <input
                        type="text"
                        placeholder="Поиск друзей..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Список друзей */}
                <div className="friends-list">
                    {filteredFriends.map(friend => (
                        <div
                            key={friend.id}
                            className={`friend-item ${selectedFriends.includes(friend.id) ? 'selected' : ''}`}
                            onClick={() => toggleFriend(friend.id)}
                        >
                            <img src={friend.avatar || "logo.png"} alt={friend.nickname} />
                            <span>{friend.nickname}</span>
                            {selectedFriends.includes(friend.id) && <span>✓</span>}
                        </div>
                    ))}
                </div>

                {/* Кнопки */}
                <div className="modal-actions">
                    <button
                        className="cancel-btn"
                        onClick={onClose}
                        disabled={isCreating}
                    >
                        Отмена
                    </button>
                    <button
                        className="create-btn"
                        onClick={handleCreate}
                        disabled={!groupName.trim() || selectedFriends.length === 0 || isCreating}
                    >
                        {isCreating ? 'Создание...' : 'Создать чат'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateGroupModal;