// Services/EncryptionService.ts
import { PersonalMessageData } from '../Types/ChatTypes';

interface DecryptionResult {
    success: boolean;
    plaintext: string;
    error?: string;
}

class EncryptionService {

    setCurrentUserId(_userId: string) {
        // No-op: kept for compatibility
    }

    async generateKeys(baseUrl: string, userId: string, csrfToken: string | null): Promise<boolean> {
        try {
            const response = await fetch(`${baseUrl}/api/encryption/keys/${userId}/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || ''
                },
                credentials: 'include'
            });
            return response.ok;
        } catch (error) {
            console.error('Error generating encryption keys:', error);
            return false;
        }
    }

    async getPublicKey(baseUrl: string, userId: string): Promise<string | null> {
        try {
            const response = await fetch(`${baseUrl}/api/encryption/keys/${userId}`);
            if (response.ok) {
                const data = await response.json();
                return data.publicKey;
            }
            return null;
        } catch (error) {
            console.error('Error getting public key:', error);
            return null;
        }
    }



    async initializeSession(baseUrl: string, userId: string, contactId: string, contactPublicKey: string, csrfToken: string | null): Promise<boolean> {
        try {
            const response = await fetch(`${baseUrl}/api/encryption/sessions/initialize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || ''
                },
                body: JSON.stringify({
                    userId,
                    contactId,
                    contactPublicKey
                }),
                credentials: 'include'
            });
            return response.ok;
        } catch (error) {
            console.error('Error initializing encryption session:', error);
            return false;
        }
    }

    async decryptMessage(
        baseUrl: string,
        encryptedBase64: string,
        metadataJson: string,
        senderId: string,
        csrfToken: string | null
    ): Promise<DecryptionResult | null> {
        try {
            const response = await fetch(`${baseUrl}/api/encryption/decrypt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || ''
                },
                body: JSON.stringify({
                    encryptedBase64,
                    metadataJson,
                    senderId: senderId
                }),
                credentials: "include",
            });

            if (response.ok) {
                const result = await response.json();
                return result;
            } else {
                const errorText = await response.text();
                console.error('Decrypt failed:', errorText);
                return {
                    success: false,
                    plaintext: '',
                    error: `Server error: ${response.status}`
                };
            }
        } catch (error) {
            console.error('Error decrypting message:', error);
            return {
                success: false,
                plaintext: '',
                error: error instanceof Error ? error.message : 'Network error'
            };
        }
    }

    async autoDecryptMessage(baseUrl: string, message: PersonalMessageData, senderId: string | null, csrfToken: string | null): Promise<PersonalMessageData> {
        if (!message.isEncrypted || !message.encryptionMetadata || !message.messageContent) {
            return message;
        }

        try {
            const isLikelyBase64 = this.isValidBase64(message.messageContent);
            if (!isLikelyBase64) {
                return {
                    ...message,
                    isEncrypted: false,
                    encryptionMetadata: undefined
                };
            }

            if (message.messageContent.length < 4) {
                return {
                    ...message,
                    isEncrypted: false,
                    encryptionMetadata: undefined
                };
            }

            const cleanBase64 = message.messageContent
                .replace(/\s/g, '')
                .replace(/\\u002B/g, '+')
                .trim();

            try {
                atob(cleanBase64);
            } catch {
                return {
                    ...message,
                    isEncrypted: false,
                    encryptionMetadata: undefined
                };
            }

            let metadataString: string;
            if (typeof message.encryptionMetadata === 'string') {
                metadataString = message.encryptionMetadata;
                try {
                    JSON.parse(metadataString);
                } catch {
                    throw new Error('Invalid metadata format');
                }
            } else if (typeof message.encryptionMetadata === 'object' && message.encryptionMetadata !== null) {
                try {
                    metadataString = JSON.stringify(message.encryptionMetadata);
                } catch {
                    throw new Error('Invalid metadata format');
                }
            } else {
                throw new Error('Invalid metadata type');
            }

            const decryptionResult = await this.decryptMessage(
                baseUrl,
                cleanBase64,
                metadataString,
                senderId || '',
                csrfToken
            );

            if (decryptionResult?.success) {
                return {
                    ...message,
                    messageContent: decryptionResult.plaintext,
                    isEncrypted: false,
                    encryptionMetadata: undefined
                };
            } else {
                console.warn('Decryption failed:', decryptionResult?.error);
                return {
                    ...message,
                    messageContent: decryptionResult?.error
                        ? `[Decryption error: ${decryptionResult.error}]`
                        : '[Encrypted message - decryption failed]'
                };
            }
        } catch (error) {
            console.error('Error in autoDecryptMessage:', error);
            throw error;
        }
    }

    async hasSession(baseUrl: string, userId: string, contactId: string): Promise<boolean> {
        try {
            const response = await fetch(`${baseUrl}/api/encryption/sessions/check/${userId}/${contactId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (response.ok) {
                return true;
            } else if (response.status === 500) {
                return false;
            } else {
                console.error(`Unexpected status: ${response.status}`);
                return false;
            }
        } catch (error) {
            console.error('Error checking session:', error);
            return false;
        }
    }

    private isValidBase64(str: string): boolean {
        if (!str || typeof str !== 'string') return false;

        const trimmed = str.replace(/\s/g, '');

        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
        if (!base64Regex.test(trimmed)) return false;

        if (trimmed.length < 16) return false;

        try {
            atob(trimmed);
            return true;
        } catch {
            return false;
        }
    }
}

export const encryptionService = new EncryptionService();