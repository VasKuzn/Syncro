let csrfToken: string | null = null;

export const setCsrfToken = (token: string | null) => {
    csrfToken = token;
};

export const getCsrfToken = () => csrfToken;