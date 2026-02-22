export const sendResetEmail = async (email: string, baseUrl: string) => {
    const response = await fetch(`${baseUrl}/api/accounts/forget_password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
    });

    return response;
};