import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    createCipheriv,
    createDecipheriv,
    randomBytes,
    createHash,
    timingSafeEqual,
} from 'crypto';

@Injectable()
export class EncryptionService {
    private readonly logger = new Logger(EncryptionService.name);
    private readonly key: Buffer;
    private readonly previousKey: Buffer | null;
    private readonly ALGORITHM = 'aes-256-gcm';
    private readonly IV_LENGTH = 12;
    private readonly TAG_LENGTH = 16;

    constructor(private readonly config: ConfigService) {
        const keyHex = this.config.get<string>('ENCRYPTION_KEY');
        if (!keyHex || keyHex.length !== 64) {
            throw new Error(
                'ENCRYPTION_KEY debe ser un hex de 64 caracteres (32 bytes). '
            );
        }
        this.key = Buffer.from(keyHex, 'hex');

        // Clave anterior — solo durante rotación de claves
        const prevKeyHex = this.config.get<string>('ENCRYPTION_KEY_PREVIOUS');
        this.previousKey = prevKeyHex && prevKeyHex.length === 64
            ? Buffer.from(prevKeyHex, 'hex')
            : null;
    }

    /**
     * Cifra un valor string. Devuelve string base64 listo para guardar en BD.
     * Devuelve null si el input es null/undefined (campos opcionales).
     */
    encrypt(plaintext: string): string;
    encrypt(plaintext: string | null | undefined): string | null;
    encrypt(plaintext: string | null | undefined): string | null {
        if (plaintext === null || plaintext === undefined) return null;
        if (plaintext === '') return '';

        try {
            const iv = randomBytes(this.IV_LENGTH);
            const cipher = createCipheriv(this.ALGORITHM, this.key, iv, {
                authTagLength: this.TAG_LENGTH,
            });

            const encrypted = Buffer.concat([
                cipher.update(plaintext, 'utf8'),
                cipher.final(),
            ]);
            const authTag = cipher.getAuthTag();

            const combined = Buffer.concat([iv, authTag, encrypted]);
            return combined.toString('base64');
        } catch (err) {
            this.logger.error('Error al cifrar dato', err);
            throw new Error('Error de cifrado');
        }
    }

    /**
     * Descifra un valor previamente cifrado con encrypt().
     * Intenta con la clave actual; si falla y hay clave anterior, la usa.
     * Devuelve null si el input es null/undefined.
     */
    decrypt(ciphertext: string): string;
    decrypt(ciphertext: string | null | undefined): string | null;
    decrypt(ciphertext: string | null | undefined): string | null {
        if (ciphertext === null || ciphertext === undefined) return null;
        if (ciphertext === '') return '';

        // Intentar con clave actual
        try {
            return this.decryptWithKey(ciphertext, this.key);
        } catch {
            // Si hay clave anterior (rotación en curso), intentar con ella
            if (this.previousKey) {
                try {
                    const plaintext = this.decryptWithKey(ciphertext, this.previousKey);
                    this.logger.warn('Dato descifrado con clave anterior — re-cifrar con nueva clave');
                    return plaintext;
                } catch {
                    // ambas claves fallaron
                }
            }
            this.logger.error('Error al descifrar dato — posible corrupción o clave incorrecta');
            throw new Error('Error de descifrado');
        }
    }

    /**
     * Cifra un objeto completo, campo a campo.
     * Útil para cifrar varios campos de un DTO en una sola llamada.
     *
     * Uso:
     *   const encrypted = this.encryption.encryptFields(dto, ['phone', 'address']);
     */
    encryptFields<T extends Record<string, unknown>>(
        obj: T,
        fields: (keyof T)[],
    ): T {
        const result = { ...obj };
        for (const field of fields) {
            const value = result[field];
            if (typeof value === 'string' || value === null || value === undefined) {
                (result as Record<string, unknown>)[field as string] = this.encrypt(value as string | null | undefined);
            }
        }
        return result;
    }

    /**
     * Descifra un objeto completo, campo a campo.
     */
    decryptFields<T extends Record<string, unknown>>(
        obj: T,
        fields: (keyof T)[],
    ): T {
        const result = { ...obj };
        for (const field of fields) {
            const value = result[field];
            if (typeof value === 'string' || value === null || value === undefined) {
                (result as Record<string, unknown>)[field as string] = this.decrypt(value as string | null | undefined);
            }
        }
        return result;
    }

    /**
     * Hash unidireccional SHA-256 para campos de búsqueda (email, teléfono).
     * Permite buscar por valor exacto sin almacenar en claro.
     *
     * Uso en BD: guardar tanto el campo cifrado (para mostrar) como su hash (para buscar).
     *   email_encrypted = encrypt(email)
     *   email_hash = hashForSearch(email)
     *
     *   SELECT * FROM profiles WHERE email_hash = hashForSearch(inputEmail)
     */
    hashForSearch(value: string): string {
        const secret = this.config.get<string>('ENCRYPTION_KEY') ?? '';
        return createHash('sha256')
            .update(`${secret}:${value.toLowerCase().trim()}`)
            .digest('hex');
    }

    /**
     * Comparación segura contra timing attacks.
     * Usar al comparar tokens, hashes o valores sensibles.
     */
    secureCompare(a: string, b: string): boolean {
        if (a.length !== b.length) return false;
        return timingSafeEqual(Buffer.from(a), Buffer.from(b));
    }

    // ── Privado ───────────────────────────────────────────────────────────────

    private decryptWithKey(ciphertext: string, key: Buffer): string {
        const combined = Buffer.from(ciphertext, 'base64');

        if (combined.length < this.IV_LENGTH + this.TAG_LENGTH) {
            throw new Error('Ciphertext demasiado corto');
        }

        const iv = combined.subarray(0, this.IV_LENGTH);
        const authTag = combined.subarray(this.IV_LENGTH, this.IV_LENGTH + this.TAG_LENGTH);
        const encrypted = combined.subarray(this.IV_LENGTH + this.TAG_LENGTH);

        const decipher = createDecipheriv(this.ALGORITHM, key, iv, {
            authTagLength: this.TAG_LENGTH,
        });
        decipher.setAuthTag(authTag);

        return Buffer.concat([
            decipher.update(encrypted),
            decipher.final(),
        ]).toString('utf8');
    }
}