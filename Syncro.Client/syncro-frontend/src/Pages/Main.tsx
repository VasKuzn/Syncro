import { useState } from "react";
import MainComponent from "../Components/MainPage/MainComponents";
import "../Styles/MainPage.css";
import { Friend } from "../Types/FriendType";
import { FriendList } from "../Types/FriendListType";
import { NetworkError } from "../Types/LoginTypes";

function parseJwt(token: string) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                })
                .join('')
        );

        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('Invalid JWT token', e);
        return null;
    }
}

function getCookie(name: string) {
    let cookie = document.cookie.split('; ').find(row => row.startsWith(name + '='));
    return cookie ? cookie.split('=')[1] : null;
}

const Main = () => {
    const [friends, setFriends] = useState<Friend[]>([]);

    const getFriends = async (UserID: string) => {
        try {
            const response = await fetch(`http://localhost:5232/api/Friends/${UserID}/getfriends`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ошибка аутентификации');
            }

            const data: FriendList[] = await response.json();
            loadFriendInfo(data);
            await new Promise(resolve => setTimeout(resolve, 10000))
            return data;
        } catch (error) {
            throw new Error((error as NetworkError).message || 'Ошибка сети');
        }
    }

    const loadFriendInfo = async (list: FriendList[]) => {
        try {
            let loadedFriends: Friend[] = new Array();
            for (let i = 0; i < list.length; i++) {
                let friend = list[i];
                let f_id = "";
                if (friend.userWhoRecieved === payload["AccountId"]) {
                    f_id = friend.userWhoSent;
                } else {
                    f_id = friend.userWhoRecieved
                }

                const response = await fetch(`http://localhost:5232/api/accounts/${f_id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                });

                let f_toadd = await response.json();

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Ошибка аутентификации');
                }

                loadedFriends.push(f_toadd);
            }
            setFriends(loadedFriends);
            return loadedFriends;
        } catch (error) {
            throw new Error((error as NetworkError).message || 'Ошибка сети');
        }
    }

    let token = localStorage.getItem("authToken");
    const payload = parseJwt(token);
    localStorage.setItem("id", payload["AccountId"])
    getFriends(payload["AccountId"]);

    return (
        <div className="main-page">
            <MainComponent
                friends={friends}>
            </MainComponent>
        </div>
    );
}

export default Main;