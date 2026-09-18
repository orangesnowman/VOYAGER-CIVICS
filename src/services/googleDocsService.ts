import { getAccessToken, googleSignIn } from './firebaseAuth';

export interface CreateDocResult {
  documentId: string;
  documentUrl: string;
  title: string;
}

/**
 * Creates a new Google Doc with the specified title and body text using Google Docs REST API.
 */
export async function createGoogleDoc(title: string, bodyText: string): Promise<CreateDocResult> {
  let token = await getAccessToken();

  if (!token) {
    const authResult = await googleSignIn();
    if (!authResult?.accessToken) {
      throw new Error('Authentication with Google required to export to Google Docs.');
    }
    token = authResult.accessToken;
  }

  // 1. Create document
  const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: title
    })
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    // If 401, attempt re-login once
    if (createRes.status === 401) {
      const authResult = await googleSignIn();
      if (authResult?.accessToken) {
        token = authResult.accessToken;
        const retryRes = await fetch('https://docs.googleapis.com/v1/documents', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ title: title })
        });
        if (!retryRes.ok) {
          throw new Error(`Failed to create Google Doc: ${await retryRes.text()}`);
        }
        const docData = await retryRes.json();
        return await insertContentAndReturn(docData.documentId, title, bodyText, token);
      }
    }
    throw new Error(`Failed to create Google Doc (${createRes.status}): ${errText}`);
  }

  const docData = await createRes.json();
  return await insertContentAndReturn(docData.documentId, title, bodyText, token);
}

async function insertContentAndReturn(
  documentId: string,
  title: string,
  bodyText: string,
  token: string
): Promise<CreateDocResult> {
  // 2. Insert text at index 1
  const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requests: [
        {
          insertText: {
            location: { index: 1 },
            text: bodyText
          }
        }
      ]
    })
  });

  if (!updateRes.ok) {
    console.warn('Document created, but failed to insert content:', await updateRes.text());
  }

  const documentUrl = `https://docs.google.com/document/d/${documentId}/edit`;
  return {
    documentId,
    documentUrl,
    title
  };
}
