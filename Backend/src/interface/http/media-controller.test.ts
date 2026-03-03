import { describe, expect, it } from "vitest";
import {
  handleListMediaRequest,
  handleUploadMediaRequest,
} from "./media-controller";

describe("media controller", () => {
  it("returns unauthorized when upload has no valid session", async () => {
    const response = await handleUploadMediaRequest(
      {
        headers: {},
      },
      {
        sessionService: {
          createSession: () => "session-user-1",
          getUserId: () => null,
          invalidateSession: () => {},
        },
        userRepository: {
          findByEmail: async () => null,
          findById: async () => null,
        },
        mediaRepository: {
          create: async () => {
            throw new Error("not used");
          },
          listLatest: async () => [],
        },
      },
    );

    expect(response).toEqual({
      status: 401,
      body: {
        error: {
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        },
      },
    });
  });

  it("returns validation error when media file is missing", async () => {
    const response = await handleUploadMediaRequest(
      {
        headers: {
          cookie: "sessionId=session-user-1",
        },
      },
      {
        sessionService: {
          createSession: () => "session-user-1",
          getUserId: () => "user-1",
          invalidateSession: () => {},
        },
        userRepository: {
          findByEmail: async () => null,
          findById: async () => ({
            id: "user-1",
            email: "alice@example.com",
            passwordHash: "hash",
          }),
        },
        mediaRepository: {
          create: async () => {
            throw new Error("not used");
          },
          listLatest: async () => [],
        },
      },
    );

    expect(response).toEqual({
      status: 400,
      body: {
        error: {
          code: "INVALID_MEDIA_INPUT",
          message: "Missing media file",
        },
      },
    });
  });

  it("uploads media for authenticated user", async () => {
    const response = await handleUploadMediaRequest(
      {
        headers: {
          cookie: "sessionId=session-user-1",
        },
        file: {
          originalname: "photo.jpg",
          mimetype: "image/jpeg",
          size: 1234,
          buffer: Buffer.from("abc"),
        },
      },
      {
        sessionService: {
          createSession: () => "session-user-1",
          getUserId: () => "user-1",
          invalidateSession: () => {},
        },
        userRepository: {
          findByEmail: async () => null,
          findById: async () => ({
            id: "user-1",
            email: "alice@example.com",
            passwordHash: "hash",
          }),
        },
        mediaRepository: {
          create: async (input) => ({
            ...input,
          }),
          listLatest: async () => [],
        },
      },
    );

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      data: {
        id: expect.stringMatching(/^media-/),
        filename: "photo.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 1234,
        url: expect.stringMatching(/^\/uploads\//),
      },
    });
  });

  it("rejects unknown media mime type", async () => {
    const response = await handleUploadMediaRequest(
      {
        headers: {
          cookie: "sessionId=session-user-1",
        },
        file: {
          originalname: "payload.exe",
          mimetype: "application/octet-stream",
          size: 123,
          buffer: Buffer.from("x"),
        },
      },
      {
        sessionService: {
          createSession: () => "session-user-1",
          getUserId: () => "user-1",
          invalidateSession: () => {},
        },
        userRepository: {
          findByEmail: async () => null,
          findById: async () => ({
            id: "user-1",
            email: "alice@example.com",
            passwordHash: "hash",
          }),
        },
        mediaRepository: {
          create: async () => {
            throw new Error("not used");
          },
          listLatest: async () => [],
        },
      },
    );

    expect(response).toEqual({
      status: 400,
      body: {
        error: {
          code: "INVALID_MEDIA_INPUT",
          message: "Unsupported media type",
        },
      },
    });
  });

  it("rejects invalid media size", async () => {
    const response = await handleUploadMediaRequest(
      {
        headers: {
          cookie: "sessionId=session-user-1",
        },
        file: {
          originalname: "photo.jpg",
          mimetype: "image/jpeg",
          size: 0,
          buffer: Buffer.from(""),
        },
      },
      {
        sessionService: {
          createSession: () => "session-user-1",
          getUserId: () => "user-1",
          invalidateSession: () => {},
        },
        userRepository: {
          findByEmail: async () => null,
          findById: async () => ({
            id: "user-1",
            email: "alice@example.com",
            passwordHash: "hash",
          }),
        },
        mediaRepository: {
          create: async () => {
            throw new Error("not used");
          },
          listLatest: async () => [],
        },
      },
    );

    expect(response).toEqual({
      status: 400,
      body: {
        error: {
          code: "INVALID_MEDIA_INPUT",
          message: "Invalid media size",
        },
      },
    });
  });

  it("lists media metadata for authenticated user", async () => {
    const response = await handleListMediaRequest(
      {
        headers: {
          cookie: "sessionId=session-user-1",
        },
      },
      {
        sessionService: {
          createSession: () => "session-user-1",
          getUserId: () => "user-1",
          invalidateSession: () => {},
        },
        userRepository: {
          findByEmail: async () => null,
          findById: async () => ({
            id: "user-1",
            email: "alice@example.com",
            passwordHash: "hash",
          }),
        },
        mediaRepository: {
          create: async () => {
            throw new Error("not used");
          },
          listLatest: async () => [
            {
              id: "media-1",
              filename: "hero.png",
              storedFilename: "media-1.png",
              mimeType: "image/png",
              sizeBytes: 321,
              createdBy: "user-1",
              createdAt: "2026-03-02T00:00:00.000Z",
            },
          ],
        },
      },
    );

    expect(response).toEqual({
      status: 200,
      body: {
        data: [
          {
            id: "media-1",
            filename: "hero.png",
            mimeType: "image/png",
            sizeBytes: 321,
            createdAt: "2026-03-02T00:00:00.000Z",
            url: "/uploads/media-1.png",
          },
        ],
      },
    });
  });

  it("returns unauthorized when listing media without valid session", async () => {
    const response = await handleListMediaRequest(
      {
        headers: {},
      },
      {
        sessionService: {
          createSession: () => "session-user-1",
          getUserId: () => null,
          invalidateSession: () => {},
        },
        userRepository: {
          findByEmail: async () => null,
          findById: async () => null,
        },
        mediaRepository: {
          create: async () => {
            throw new Error("not used");
          },
          listLatest: async () => [],
        },
      },
    );

    expect(response).toEqual({
      status: 401,
      body: {
        error: {
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        },
      },
    });
  });
});
