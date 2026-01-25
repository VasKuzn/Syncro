import { NetworkError } from "../Types/LoginTypes";

const checkEmail = async (email:string) => {
    try {
        const response = await fetch(`http://localhost:5232/api/accounts/${email}/get`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return await response.json();
    } catch (error) {
        throw new Error((error as NetworkError).message || "Ошибка сети")
    }
}

export const sendEmail = async (email:string) => {
    const credentials = { email };
    
    if (await checkEmail(email)) {
        console.log("ok")
        try {
            const response = await fetch(`http://localhost:5232/api/accounts/forget_password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
                credentials: "include"
            });
            return await response.json();
        } catch (error) {
            throw new Error((error as NetworkError).message || "Ошибка сети")
        }
    }
}