import { getToken } from "@/lib/auth/storage";
import type { ApiError } from "@/types/api";

function getApiUrl(): string {
  if (typeof window !== "undefined") {
    const port = process.env.NEXT_PUBLIC_API_PORT || "5001";
    return `http://${window.location.hostname}:${port}/api`;
  }
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
}

const API_URL = getApiUrl();

export class ApiClientError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  auth?: boolean;
}

/** Enveloppe standard du backend Express : { success, data } */
interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  code?: string;
}

function unwrapResponse<T>(json: unknown): T {
  if (
    json &&
    typeof json === "object" &&
    "success" in json &&
    "data" in json &&
    (json as ApiEnvelope<T>).success === true
  ) {
    return (json as ApiEnvelope<T>).data;
  }
  return json as T;
}

async function parseError(response: Response): Promise<ApiClientError> {
  try {
    const data = (await response.json()) as ApiError;
    return new ApiClientError(
      data.message ?? "Une erreur est survenue",
      response.status,
      data.code,
    );
  } catch {
    return new ApiClientError("Une erreur est survenue", response.status);
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, auth = false, headers, ...rest } = options;

  const requestHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (auth) {
    const token = getToken();
    if (token) {
      (requestHeaders as Record<string, string>).Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const json: unknown = await response.json();
  return unwrapResponse<T>(json);
}

export { API_URL };
