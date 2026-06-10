import { createHash, randomBytes } from 'crypto';

/**
 * Utilidades para la generación y validación de códigos QR
 * usados en el control de acceso de gimnasios (attendance module).
 *
 * Flujo de check-in por QR:
 *   1. El gym genera un QR con generateGymQr(gymId, venueId)
 *   2. El QR se muestra en la entrada del gimnasio
 *   3. El miembro escanea el QR con la app
 *   4. La app envía el payload al backend
 *   5. El backend valida con validateGymQr() y registra la asistencia
 *
 * Flujo de QR personal (miembro):
 *   1. La app genera un QR con generateMemberQr(memberId, gymId)
 *   2. El QR caduca cada MEMBER_QR_TTL_SECONDS segundos (anti-fraude)
 *   3. El admin escanea el QR en recepción
 *   4. El backend valida con validateMemberQr()
 */

const GYM_QR_SECRET = process.env.QR_SECRET ?? 'mango-qr-secret';
const MEMBER_QR_TTL_SEC = 300; // 5 minutos — tiempo antes de que el QR expire

// ── QR estático del gimnasio ──────────────────────────────────────────────────

export interface GymQrPayload {
    type: 'gym_checkin';
    gymId: string;
    venueId: string;
    hash: string;
}

/**
 * Genera el payload para el QR estático de la entrada del gimnasio.
 * Este QR no caduca — el hash lo vincula al gym y sede específicos.
 */
export function generateGymQrPayload(
    gymId: string,
    venueId: string,
): GymQrPayload {
    const hash = createHash('sha256')
        .update(`${gymId}:${venueId}:${GYM_QR_SECRET}`)
        .digest('hex')
        .slice(0, 16);

    return { type: 'gym_checkin', gymId, venueId, hash };
}

/**
 * Valida que el payload del QR escaneado corresponde al gym y sede correctos.
 */
export function validateGymQrPayload(payload: GymQrPayload): boolean {
    const expected = createHash('sha256')
        .update(`${payload.gymId}:${payload.venueId}:${GYM_QR_SECRET}`)
        .digest('hex')
        .slice(0, 16);
    return payload.hash === expected;
}

// ── QR temporal del miembro ───────────────────────────────────────────────────

export interface MemberQrPayload {
    type: 'member_checkin';
    memberId: string;
    gymId: string;
    expiresAt: number;  // Unix timestamp en segundos
    nonce: string;  // Previene replay attacks
    hash: string;
}

/**
 * Genera un QR temporal para que el miembro haga check-in.
 * Caduca en MEMBER_QR_TTL_SEC segundos para evitar compartición del QR.
 */
export function generateMemberQrPayload(
    memberId: string,
    gymId: string,
): MemberQrPayload {
    const expiresAt = Math.floor(Date.now() / 1000) + MEMBER_QR_TTL_SEC;
    const nonce = randomBytes(8).toString('hex');
    const hash = createHash('sha256')
        .update(`${memberId}:${gymId}:${expiresAt}:${nonce}:${GYM_QR_SECRET}`)
        .digest('hex')
        .slice(0, 16);

    return { type: 'member_checkin', memberId, gymId, expiresAt, nonce, hash };
}

/**
 * Valida el QR del miembro: firma correcta y no expirado.
 */
export function validateMemberQrPayload(payload: MemberQrPayload): {
    valid: boolean;
    reason?: string;
} {
    const now = Math.floor(Date.now() / 1000);

    if (now > payload.expiresAt) {
        return { valid: false, reason: 'El código QR ha expirado' };
    }

    const expected = createHash('sha256')
        .update(
            `${payload.memberId}:${payload.gymId}:${payload.expiresAt}:${payload.nonce}:${GYM_QR_SECRET}`,
        )
        .digest('hex')
        .slice(0, 16);

    if (payload.hash !== expected) {
        return { valid: false, reason: 'Código QR inválido' };
    }

    return { valid: true };
}