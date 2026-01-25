import { NetworkError } from "../Types/LoginTypes";

export const resetPassword = async (id:string, password:string) => {
    const passwordConfirm = password
    const credentials = {password, passwordConfirm}

    try {
        const response = await fetch(`http://localhost:5232/api/accounts/reset_password/${id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
            credentials: "include"
        });        
        return response;
    } catch (error) {
        throw new Error((error as NetworkError).message || "Ошибка сети")
    }
}