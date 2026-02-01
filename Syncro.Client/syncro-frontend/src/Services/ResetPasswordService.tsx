export const validateResetToken = async (token: string) => {
    const response = await fetch(`http://localhost:5232/api/accounts/validate_reset_token/${token}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    return response;
};

export const resetPassword = async (token: string, newPassword: string, confirmPassword: string) => {
    const response = await fetch(`http://localhost:5232/api/accounts/reset_password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            token,
            newPassword,
            confirmPassword
        }),
    });

    return response;
};