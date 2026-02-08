import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export async function saveFile(file: File): Promise<{ filePath: string; filename: string; originalName: string }> {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const originalName = file.name;
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    await fs.writeFile(filePath, buffer);

    return { filePath, filename, originalName };
}

export async function computeFileHash(filePath: string): Promise<string> {
    const fileBuffer = await fs.readFile(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
}
