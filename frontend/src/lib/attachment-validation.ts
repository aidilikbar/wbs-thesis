const MAX_ATTACHMENT_FILES = 10;
const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;

const allowedExtensions = new Set([
  "pdf",
  "jpg",
  "jpeg",
  "png",
  "webp",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "csv",
  "txt",
  "zip",
]);

export const attachmentAccept =
  ".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.zip";

export function validateAttachmentSelection(files: File[]) {
  if (files.length > MAX_ATTACHMENT_FILES) {
    return `You can attach up to ${MAX_ATTACHMENT_FILES} files in a single submission.`;
  }

  for (const file of files) {
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

    if (!allowedExtensions.has(extension)) {
      return `${file.name} is not an accepted file type.`;
    }

    if (file.size > MAX_ATTACHMENT_BYTES) {
      return `${file.name} exceeds the 20 MB size limit.`;
    }
  }

  return null;
}
