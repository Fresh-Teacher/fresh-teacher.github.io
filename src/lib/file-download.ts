export function downloadFileName(fileUrl: string) {
  return decodeURIComponent(fileUrl.split('/').pop() ?? '') || 'document';
}

// Saves the whole file, not single pages. Returns false when the host blocks the fetch.
export async function downloadFile(fileUrl: string) {
  try {
    const response = await fetch(fileUrl);
    if (!response.ok) throw new Error('File unavailable');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = downloadFileName(fileUrl);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    return true;
  } catch {
    return false;
  }
}
