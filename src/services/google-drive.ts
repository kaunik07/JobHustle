
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
  console.error('[Google Drive Error] Missing required environment variables for Google Drive integration.');
  throw new Error('Google Drive credentials are not set in environment variables.');
}

const SCOPES = ['https://www.googleapis.com/auth/drive'];

function getDriveClient(): drive_v3.Drive {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      },
      scopes: SCOPES,
    });
    console.log('[Google Drive Log] Drive client initialized successfully.');
    return google.drive({ version: 'v3', auth });
  } catch (error: any) {
    console.error('[Google Drive Error] Failed to create GoogleAuth client:', error.message);
    throw new Error('Failed to initialize Google Drive client. Check your service account credentials.');
  }
}

export async function uploadResume(
  file: { name: string; type: string; content: string }, // content is base64
  user: User,
  companyName: string
): Promise<string> {
  console.log(`[Google Drive Log] Starting resume upload for ${user.firstName} at ${companyName}.`);
  const drive = getDriveClient();
  const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID!;
  console.log(`[Google Drive Log] Using Drive Folder ID: ${rootFolderId}`);

  // 1. Pre-flight check to ensure the root folder is accessible
  try {
    console.log('[Google Drive Log] Performing pre-flight check on folder access...');
    await drive.files.get({ fileId: rootFolderId, fields: 'id', supportsAllDrives: true });
    console.log('[Google Drive Log] Pre-flight check successful. Folder is accessible.');
  } catch(e: any) {
    console.error(`[Google Drive Error] Pre-flight check FAILED. Error Code: ${e.code}, Message: ${e.message}`);
    if (e.code === 404) {
        throw new Error(`Google Drive folder with ID '${rootFolderId}' not found. Please verify GOOGLE_DRIVE_FOLDER_ID in your .env file.`);
    }
    throw new Error(`Failed to access Google Drive folder with ID '${rootFolderId}'. Please verify it's shared with your service account email with 'Editor' permissions. Original error: ${e.message}`);
  }
  
  const userAndCompanyPrefix = `${user.firstName}-${user.lastName}_${companyName}`.replace(/[^a-zA-Z0-9-_]/g, '_');
  const uniqueFileName = `${userAndCompanyPrefix}_${file.name}`;
  console.log(`[Google Drive Log] Generated unique filename: ${uniqueFileName}`);

  const fileBuffer = Buffer.from(file.content, 'base64');
  const media = {
    mimeType: file.type,
    body: Readable.from(fileBuffer),
  };
  
  let uploadedFile: drive_v3.Schema$File | undefined;
  try {
    console.log('[Google Drive Log] Attempting to create file in Google Drive...');
    const response = await drive.files.create({
      media: media,
      requestBody: {
        name: uniqueFileName,
        parents: [rootFolderId],
      },
      fields: 'id,webViewLink',
      supportsAllDrives: true,
    });
    uploadedFile = response.data;
    console.log(`[Google Drive Log] File created successfully with ID: ${uploadedFile.id}`);
  } catch (error: any) {
      console.error(`[Google Drive Error] File creation failed. Error Code: ${error.code}, Message: ${error.message}`);
      throw new Error(`Failed to create file in Google Drive. Original error: ${error.message}`);
  }

  if (!uploadedFile?.id || !uploadedFile?.webViewLink) {
    console.error('[Google Drive Error] File upload succeeded but no webViewLink or id was returned.');
    throw new Error('File upload succeeded but no webViewLink or id was returned from Google Drive.');
  }

  // 2. Make the file publicly readable
  try {
    console.log(`[Google Drive Log] Setting public read permissions for file ID: ${uploadedFile.id}`);
    await drive.permissions.create({
      fileId: uploadedFile.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
      supportsAllDrives: true,
    });
    console.log('[Google Drive Log] Public permissions set successfully.');
  } catch (error: any) {
    console.error(`[Google Drive Error] Setting public permissions failed. Error Code: ${error.code}, Message: ${error.message}`);
    // If setting permissions fails, delete the file to avoid orphans
    try {
      console.log(`[Google Drive Log] Attempting to clean up orphaned file: ${uploadedFile.id}`);
      await drive.files.delete({ fileId: uploadedFile.id, supportsAllDrives: true });
      console.log('[Google Drive Log] Cleanup successful.');
    } catch (cleanupError) {
      console.error(`[Google Drive Error] FAILED to cleanup file '${uploadedFile.id}' after a permission error. Please delete it manually.`, cleanupError);
    }
    throw new Error(`File was uploaded but failed to be made public. Please ensure your service account has 'Editor' permissions on the folder. Original error: ${error.message}`);
  }

  console.log(`[Google Drive Log] Upload complete. View link: ${uploadedFile.webViewLink}`);
  return uploadedFile.webViewLink;
}

export async function deleteResumeByUrl(fileUrl: string): Promise<void> {
  console.log(`[Google Drive Log] Attempting to delete file from URL: ${fileUrl}`);
  const drive = getDriveClient();
  const fileIdMatch = fileUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);

  if (!fileIdMatch || !fileIdMatch[1]) {
    console.warn(`[Google Drive Warn] Could not extract file ID from URL for deletion: ${fileUrl}`);
    return;
  }
  const fileId = fileIdMatch[1];
  console.log(`[Google Drive Log] Extracted file ID for deletion: ${fileId}`);

  try {
    await drive.files.delete({ fileId, supportsAllDrives: true });
    console.log(`[Google Drive Log] Successfully deleted file: ${fileId}`);
  } catch (error: any) {
    if (error.code === 404) {
      console.log(`[Google Drive Log] File ID ${fileId} not found for deletion. Assuming it's already deleted.`);
    } else {
      console.error(`[Google Drive Error] Failed to delete file ${fileId}. Error Code: ${error.code}, Message: ${error.message}`);
      throw error;
    }
  }
}
