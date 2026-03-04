import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import { extname, resolve } from "node:path";
import type {
  SessionService,
  UserRepository,
} from "../../application/ports/auth";
import {
  createApiErrorResponse,
  createApiSuccessResponse,
} from "./api-response";
import { resolveUploadsDirectory } from "../../infrastructure/filesystem/resolve-uploads-directory";

const UPLOAD_DIRECTORY = resolveUploadsDirectory();

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;

type MediaRepository = {
  create(input: {
    id: string;
    filename: string;
    storedFilename: string;
    mimeType: string;
    sizeBytes: number;
    createdBy: string;
    createdAt: string;
  }): Promise<{
    id: string;
    filename: string;
    storedFilename: string;
    mimeType: string;
    sizeBytes: number;
    createdBy: string;
    createdAt: string;
  }>;
  listLatest(limit?: number): Promise<
    Array<{
      id: string;
      filename: string;
      storedFilename: string;
      mimeType: string;
      sizeBytes: number;
      createdBy: string;
      createdAt: string;
    }>
  >;
};

type UploadMediaDependencies = {
  sessionService: SessionService;
  userRepository: UserRepository;
  mediaRepository: MediaRepository;
};

type ListMediaDependencies = UploadMediaDependencies;

type UploadMediaRequest = {
  headers: {
    cookie?: string;
  };
  file?: {
    originalname: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
  };
};

type ListMediaRequest = {
  headers: {
    cookie?: string;
  };
};

function extractSessionId(cookieHeader?: string): string {
  if (!cookieHeader) {
    return "";
  }

  const entries = cookieHeader.split(";");

  for (const entry of entries) {
    const [name, value] = entry.trim().split("=");

    if (name === "sessionId" && value) {
      return value;
    }
  }

  return "";
}

async function requireAuthenticatedUser(
  request: { headers: { cookie?: string } },
  dependencies: UploadMediaDependencies,
): Promise<{ id: string } | null> {
  const sessionId = extractSessionId(request.headers.cookie);

  if (!sessionId) {
    return null;
  }

  const userId = dependencies.sessionService.getUserId(sessionId);

  if (!userId) {
    return null;
  }

  const user = await dependencies.userRepository.findById(userId);

  if (!user) {
    return null;
  }

  return { id: user.id };
}

function toPublicMediaDto(input: {
  id: string;
  filename: string;
  storedFilename: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}) {
  return {
    id: input.id,
    filename: input.filename,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    createdAt: input.createdAt,
    url: `/uploads/${input.storedFilename}`,
  };
}

export async function handleUploadMediaRequest(
  request: UploadMediaRequest,
  dependencies: UploadMediaDependencies,
) {
  const user = await requireAuthenticatedUser(request, dependencies);

  if (!user) {
    return createApiErrorResponse(401, "UNAUTHORIZED", "Unauthorized");
  }

  if (!request.file) {
    return createApiErrorResponse(
      400,
      "INVALID_MEDIA_INPUT",
      "Missing media file",
    );
  }

  if (!ALLOWED_MIME_TYPES.has(request.file.mimetype)) {
    return createApiErrorResponse(
      400,
      "INVALID_MEDIA_INPUT",
      "Unsupported media type",
    );
  }

  if (request.file.size <= 0 || request.file.size > MAX_FILE_SIZE_BYTES) {
    return createApiErrorResponse(
      400,
      "INVALID_MEDIA_INPUT",
      "Invalid media size",
    );
  }

  const mediaId = `media-${randomUUID()}`;
  const extension = extname(request.file.originalname).toLowerCase() || ".bin";
  const storedFilename = `${mediaId}${extension}`;

  await fs.mkdir(UPLOAD_DIRECTORY, { recursive: true });
  await fs.writeFile(
    resolve(UPLOAD_DIRECTORY, storedFilename),
    request.file.buffer,
  );

  const createdAt = new Date().toISOString();

  const media = await dependencies.mediaRepository.create({
    id: mediaId,
    filename: request.file.originalname,
    storedFilename,
    mimeType: request.file.mimetype,
    sizeBytes: request.file.size,
    createdBy: user.id,
    createdAt,
  });

  return createApiSuccessResponse(201, toPublicMediaDto(media));
}

export async function handleListMediaRequest(
  request: ListMediaRequest,
  dependencies: ListMediaDependencies,
) {
  const user = await requireAuthenticatedUser(request, dependencies);

  if (!user) {
    return createApiErrorResponse(401, "UNAUTHORIZED", "Unauthorized");
  }

  const media = await dependencies.mediaRepository.listLatest(100);

  return createApiSuccessResponse(
    200,
    media.map((entry) => toPublicMediaDto(entry)),
  );
}
