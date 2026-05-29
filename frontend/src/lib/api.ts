// Thin API client for the Spring Boot backend. Requests go through the Vite
// dev proxy (/api -> http://localhost:8080), so paths stay relative.

const TOKEN_KEY = 'cv_token_v1'
const SESSION_KEY = 'cv_auth_v1'
// Shared with auth.ts so token and session changes notify the same listeners.
const AUTH_EVENT = 'cv:auth-change'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
  window.dispatchEvent(new Event(AUTH_EVENT))
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  window.dispatchEvent(new Event(AUTH_EVENT))
}

// Token rejected/expired: drop all auth state so RequireAuth bounces to /login.
function forceLogout(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(SESSION_KEY)
  window.dispatchEvent(new Event(AUTH_EVENT))
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`/api${path}`, { ...init, headers })

  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = await res.json()
      message = body.message || body.error || message
    } catch {
      /* non-JSON error body */
    }
    if (res.status === 401 || res.status === 403) {
      forceLogout()
      message = 'Your session expired. Please sign in again.'
    }
    throw new ApiError(res.status, message)
  }

  if (res.status === 204) return undefined as T
  const text = await res.text()
  return text ? (JSON.parse(text) as T) : (undefined as T)
}

// --- Auth ---

export type AuthResponse = { token: string }

export function apiLogin(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function apiRegister(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ firstName, lastName, email, password }),
  })
}

// --- Folders ---

export type FolderResponse = {
  id: number
  name: string
  createdAt: string
  parentId: number | null
  favorite: boolean
}

export function listFolders(parentId?: number | null): Promise<FolderResponse[]> {
  const q = parentId != null ? `?parentId=${parentId}` : ''
  return request<FolderResponse[]>(`/folders/list${q}`)
}

export function createFolder(name: string, parentId?: number | null): Promise<FolderResponse> {
  return request<FolderResponse>('/folders/create', {
    method: 'POST',
    body: JSON.stringify({ name, parentId: parentId ?? null }),
  })
}

export function getFolderPath(id: number): Promise<FolderResponse[]> {
  return request<FolderResponse[]>(`/folders/${id}/path`)
}

export function renameFolder(id: number, name: string): Promise<FolderResponse> {
  return request<FolderResponse>(`/folders/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  })
}

export function moveFolder(
  id: number,
  targetFolderId: number | null,
): Promise<FolderResponse> {
  return request<FolderResponse>(`/folders/${id}/move`, {
    method: 'PUT',
    body: JSON.stringify({ targetFolderId }),
  })
}

export function favoriteFolder(id: number, favorite: boolean): Promise<FolderResponse> {
  return request<FolderResponse>(`/folders/${id}/favorite`, {
    method: 'PUT',
    body: JSON.stringify({ favorite }),
  })
}

export function listFavoriteFolders(): Promise<FolderResponse[]> {
  return request<FolderResponse[]>('/folders/favorites')
}

export function deleteFolder(id: number): Promise<void> {
  return request<void>(`/folders/${id}`, { method: 'DELETE' })
}

// --- Files ---

export type FileResponse = {
  id: number
  name: string
  url: string
  type: string
  size: number
  folderId: number | null
  favorite: boolean
  uploadDate: string | null
  lastAccessedAt: string | null
}

// Fetches a file's bytes through the authenticated inline-view endpoint.
// Callers create an object URL from the blob for previewing/downloading.
export async function fetchFileBlob(id: number): Promise<Blob> {
  const token = getToken()
  const headers = new Headers()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const res = await fetch(`/api/files/view/${id}`, { headers })
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      forceLogout()
      throw new ApiError(res.status, 'Your session expired. Please sign in again.')
    }
    throw new ApiError(res.status, `Could not load file (${res.status})`)
  }
  return res.blob()
}

export function listFiles(folderId?: number | null): Promise<FileResponse[]> {
  const q = folderId != null ? `?folderId=${folderId}` : ''
  return request<FileResponse[]>(`/files/list${q}`)
}

export function getFile(id: number): Promise<FileResponse> {
  return request<FileResponse>(`/files/${id}`)
}

export function renameFile(id: number, name: string): Promise<FileResponse> {
  return request<FileResponse>(`/files/${id}/rename`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  })
}

export function moveFile(
  id: number,
  targetFolderId: number | null,
): Promise<FileResponse> {
  return request<FileResponse>(`/files/${id}/move`, {
    method: 'PUT',
    body: JSON.stringify({ targetFolderId }),
  })
}

export function favoriteFile(id: number, favorite: boolean): Promise<FileResponse> {
  return request<FileResponse>(`/files/${id}/favorite`, {
    method: 'PUT',
    body: JSON.stringify({ favorite }),
  })
}

export function deleteFile(id: number): Promise<void> {
  return request<void>(`/files/${id}`, { method: 'DELETE' })
}

export function listFavoriteFiles(): Promise<FileResponse[]> {
  return request<FileResponse[]>('/files/favorites')
}

export function listRecentFiles(limit = 50): Promise<FileResponse[]> {
  return request<FileResponse[]>(`/files/recents?limit=${limit}`)
}

// Multipart upload via XHR so we get real progress events. Backend binds the
// "file" part and an optional folderId query param.
export function uploadFile(
  file: File,
  folderId: number | null,
  onProgress?: (pct: number) => void,
): Promise<FileResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const q = folderId != null ? `?folderId=${folderId}` : ''
    xhr.open('POST', `/api/files/upload${q}`)
    const token = getToken()
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.responseText ? JSON.parse(xhr.responseText) : (undefined as never))
        return
      }
      if (xhr.status === 401 || xhr.status === 403) {
        forceLogout()
        reject(new ApiError(xhr.status, 'Your session expired. Please sign in again.'))
        return
      }
      let message = `Upload failed (${xhr.status})`
      try {
        const body = JSON.parse(xhr.responseText)
        message = body.message || body.error || message
      } catch {
        /* non-JSON error body */
      }
      reject(new ApiError(xhr.status, message))
    }
    xhr.onerror = () => reject(new ApiError(0, 'Network error during upload'))

    const form = new FormData()
    form.append('file', file)
    xhr.send(form)
  })
}
