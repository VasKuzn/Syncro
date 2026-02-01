export const sendResetEmail = async (email: string) => {
    const response = await fetch(`http://localhost:5232/api/accounts/forget_password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
    });

    return response;
};