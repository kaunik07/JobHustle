
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
  
  try {
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
  } catch (error) {
    throw new Error(`Failed to find or create folder '${name}' in Google Drive. Check permissions. Original error: ${error.message}`);
  }
}

export async function uploadResume(
  file: { name: string; type: string; content: string }, // content is base64
  user: User,
  companyName: string
): Promise<string> {
  const drive = getDriveClient();
  const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID!;

  // 1. Pre-flight check to ensure the root folder is accessible
  try {
    await drive.files.get({ fileId: rootFolderId, fields: 'id' });
  } catch(e) {
    if (e.code === 404) {
        throw new Error(`Google Drive folder with ID '${rootFolderId}' not found. Please verify GOOGLE_DRIVE_FOLDER_ID in your .env file.`);
    }
    throw new Error(`Failed to access Google Drive folder with ID '${rootFolderId}'. Please verify it's shared with your service account email with 'Editor' permissions. Original error: ${e.message}`);
  }

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

  if (!uploadedFile.id || !uploadedFile.webViewLink) {
    throw new Error('File upload succeeded but no webViewLink or id was returned from Google Drive.');
  }

  // 2. Make the file publicly readable and handle potential errors
  try {
    await drive.permissions.create({
      fileId: uploadedFile.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });
  } catch (error) {
    // If setting permissions fails, delete the file to avoid orphans
    try {
      await drive.files.delete({ fileId: uploadedFile.id });
    } catch (cleanupError) {
      console.error(`Failed to cleanup file '${uploadedFile.id}' after a permission error. Please delete it manually.`, cleanupError);
    }
    throw new Error(`File was uploaded but failed to be made public. Please ensure your service account has 'Editor' permissions on the folder. Original error: ${error.message}`);
  }

  return uploadedFile.webViewLink;
}

export async function deleteResumeByUrl(fileUrl: string): Promise<void> {
  const drive = getDriveClient();
  const fileIdMatch = fileUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);

  if (!fileIdMatch || !fileIdMatch[1]) {
    console.warn(`Could not extract file ID from URL for deletion: ${fileUrl}`);
    return;
  }
  const fileId = fileIdMatch[1];

  try {
    await drive.files.delete({ fileId });
  } catch (error: any) {
    // If the file is already deleted or not found, Google API returns a 404.
    // We can safely ignore this error.
    if (error.code !== 404) {
      console.error(`Failed to delete file from Google Drive: ${error.message}`);
      throw error;
    }
  }
}
