import { cookies } from 'next/headers';
import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'super-secret-trusthire-key-changeme-in-prod'
);

export async function getUserFromCookies() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;

    try {
        const { payload } = await jose.jwtVerify(token, JWT_SECRET);
        return payload; // Returns { userId: string, role: string }
    } catch (err) {
        return null;
    }
}
