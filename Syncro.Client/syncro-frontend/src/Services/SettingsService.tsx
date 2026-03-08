import { NetworkError } from "../Types/LoginTypes";

export const updateUserInfo = async (userId: string | null, userData: FormData, baseUrl: string, csrfToken: string | null) => {
    try {
        const response = await fetch(`${baseUrl}/api/accounts/full_account_info/${userId}`, {
            method: 'PUT',
            headers: {
                'X-CSRF-TOKEN': csrfToken || ''
            },
            body: userData,
            credentials: 'include'
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Ошибка при сохранении данных")
        }
    } catch (error) {
        throw new Error((error as NetworkError).message || "Ошибка сети")
    }
}
export const updateUserInfoPartial = async (
    userId: string | null,
    changedFields: Record<string, any>,
    avatarFile: File | null | undefined,
    baseUrl: string,
    csrfToken: string | null
) => {
    try {
        const formData = new FormData();

        (Object.entries(changedFields) as Array<[string, any]>).forEach(([key, value]) => {
            if (key === 'password') {
                return;
            }
            if (value !== null && value !== undefined && value !== '') {
                formData.append(key, String(value));
            }
        });

        if (avatarFile) {
            formData.append("AvatarFile", avatarFile, avatarFile.name);
        }

        const response = await fetch(`${baseUrl}/api/accounts/partial/${userId}`, {
            method: 'PATCH',
            headers: {
                'X-CSRF-TOKEN': csrfToken || ''
            },
            body: formData,
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Ошибка при сохранении данных");
        }

        return await response.json();
    } catch (error) {
        throw new Error((error as NetworkError).message || "Ошибка сети");
    }
}

export const changePass = async (
    userId: string | null,
    oldPass: string,
    newPass: string,
    baseUrl: string,
    csrfToken: string | null
) => {
    try {
        const url = `${baseUrl}/api/accounts/change_password/${userId}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken || ''
            },
            body: JSON.stringify({
                oldPassword: oldPass,
                newPassword: newPass
            }),
            credentials: 'include'
        });

        console.log('Password change response status:', response.status);

        if (!response.ok) {
            let errorMessage = `Ошибка ${response.status} при смене пароля`;
            try {
                const data = await response.json();
                if (data?.message) {
                    errorMessage = data.message;
                }
            } catch (parseError) {
                console.error('Failed to parse error response:', parseError);
            }
            throw new Error(errorMessage);
        }

        return await response.json();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Ошибка при смене пароля";
        console.error('Change password exception:', errorMessage, error);
        throw new Error(errorMessage);
    }
}