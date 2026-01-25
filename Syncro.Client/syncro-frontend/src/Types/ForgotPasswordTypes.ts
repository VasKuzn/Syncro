export interface ForgotPasswordFormData {
    email: string;
}

export interface ForgotPasswordComponentProps {
    formData: ForgotPasswordFormData;
    isLoading: boolean;
    errors: {
        email?: string;
    };
    successMessage?: string;
    onInputChange: (field: keyof ForgotPasswordFormData, value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
}