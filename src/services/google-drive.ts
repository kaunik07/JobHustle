
'use server';

import { google } from 'googleapis';
import type { drive_v3 } from 'googleapis';
import { Readable } from 'stream';
import type { User } from '@/lib/types';

// Ensure environment variables are set
if (
  !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
  !process.env.GOOGLE_PRIVATE_KEY ||
  !process.env.GOOGLE_DRIVE_FOLDER_ID
) {
  throw new Error('Google Drive credentials are not set in environment variables.');
}

const SCOPES = ['https://www.googleapis.com/auth/drive'];

function getDriveClient(): drive_v3.Drive {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: SCOPES,
  });

  return google.drive({ version: 'v3', auth });
}

async function findOrCreateFolder(drive: drive_v3.Drive, name: string, parentId: string): Promise<string> {
  const query = `mimeType='application/vnd.google-apps.folder' and name='${name}' and '${parentId}' in parents and trashed=false`;
  
  const { data } = await drive.files.list({ q: query, fields: 'files(id)' });

  if (data.files && data.files.length > 0) {
    return data.files[0].id!;
  }

  const { data: newFolder } = await drive.files.create({
    requestBody: {
      name: name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id',
  });

  return newFolder.id!;
}

export async function uploadResume(
  file: { name: string; type: string; content: string }, // content is base64
  user: User,
  companyName: string
): Promise<string> {
  const drive = getDriveClient();
  const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID!;

  const userFolderName = `${user.firstName}-${user.lastName}`.replace(/[^a-zA-Z0-9-]/g, '_');
  const userFolderId = await findOrCreateFolder(drive, userFolderName, rootFolderId);

  const companyFolderName = companyName.replace(/[^a-zA-Z0-9-]/g, '_');
  const companyFolderId = await findOrCreateFolder(drive, companyFolderName, userFolderId);

  const fileBuffer = Buffer.from(file.content, 'base64');
  const media = {
    mimeType: file.type,
    body: Readable.from(fileBuffer),
  };

  const { data: uploadedFile } = await drive.files.create({
    media: media,
    requestBody: {
      name: file.name,
      parents: [companyFolderId],
    },
    fields: 'id,webViewLink',
  });

  if (!uploadedFile.webViewLink) {
    throw new Error('File upload succeeded but no webViewLink was returned.');
  }

  return uploadedFile.webViewLink;
}

export async function deleteResumeByUrl(fileUrl: string): Promise<void> {
  const drive = getDriveClient();
  const fileIdMatch = fileUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);

  if (!fileIdMatch || !fileIdMatch[1]) {
    console.warn(`Could not extract file ID from URL: ${fileUrl}`);
    // If we can't parse the ID, we can't delete it.
    // This is better than throwing an error, as it allows the DB record to be cleared.
    return;
  }
  const fileId = fileIdMatch[1];

  try {
    await drive.files.delete({ fileId });
  } catch (error: any) {
    // If the file is already deleted or not found, Google API returns a 404.
    // We can safely ignore this error.
    if (error.code !== 404) {
      throw error;
    }
  }
}
