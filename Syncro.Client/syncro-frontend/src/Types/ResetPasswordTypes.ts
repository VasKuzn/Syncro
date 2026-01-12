export interface ResetPasswordFormData {
    newPassword: string;
    confirmPassword: string;
}

export interface ResetPasswordComponentProps {
    formData: ResetPasswordFormData;
    passwordVisible: {
        newPassword: boolean;
        confirmPassword: boolean;
    };
    isLoading: boolean;
    errors: {
        newPassword?: string;
        confirmPassword?: string;
    };
    successMessage?: string;
    onInputChange: (field: keyof ResetPasswordFormData, value: string) => void;
    onTogglePasswordVisibility: (field: keyof ResetPasswordFormData) => void;
    onSubmit: (e: React.FormEvent) => void;
}