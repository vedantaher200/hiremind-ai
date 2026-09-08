import { Job, Internship, Application, ResumeAnalysis, AdminStats, Company } from '../types';

const getApiBase = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }
  return '/api';
};

const API_BASE = getApiBase();

export const getToken = (): string | null => {
  return localStorage.getItem('hiremind_token');
};

export const setToken = (token: string): void => {
  localStorage.setItem('hiremind_token', token);
};

export const clearToken = (): void => {
  localStorage.removeItem('hiremind_token');
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error: any = new Error(data.error || `HTTP error ${res.status}`);
    error.status = res.status;
    error.code = data.code;
    error.rejectionReason = data.rejectionReason;
    throw error;
  }

  return data as T;
}

export const api = {
  auth: {
    registerCandidate: (data: { name: string; email: string; password: string }) =>
      request<{ message: string; token: string; user: any }>('/auth/register-candidate', {
        method: 'POST',
        body: JSON.stringify(data)
      }),

    registerRecruiter: (data: {
      name: string;
      email: string;
      password: string;
      companyName: string;
      companyWebsite: string;
      verificationDocuments?: any;
    }) =>
      request<{ message: string; status: string; companyId: string }>('/auth/register-recruiter', {
        method: 'POST',
        body: JSON.stringify(data)
      }),

    login: (email: string, password: string, expectedRole?: string) =>
      request<{ message: string; token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, expectedRole })
      }),

    google: (credential: string, role: string) =>
      request<{ message: string; token: string; user: any }>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential, role })
      }),

    me: () => request<any>('/auth/me'),

    updateProfile: (updates: any) =>
      request<{ message: string; user: any }>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
  },

  admin: {
    stats: () => request<AdminStats>('/admin/stats'),

    companies: (status?: string) =>
      request<Company[]>(`/admin/companies${status ? `?status=${status}` : ''}`),

    approveCompany: (companyId: string) =>
      request<{ message: string; company: Company }>(`/admin/companies/${companyId}/approve`, {
        method: 'POST'
      }),

    rejectCompany: (companyId: string, reason: string) =>
      request<{ message: string; company: Company }>(`/admin/companies/${companyId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      }),

    auditLogs: () => request<any[]>('/admin/audit-logs')
  },

  companies: {
    myCompany: () => request<Company>('/companies/my-company'),
    updateMyCompany: (data: Partial<Company>) =>
      request<{ message: string; company: Company }>('/companies/my-company', {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    getPublic: (id: string) => request<any>(`/companies/${id}`)
  },

  jobs: {
    list: (params?: { search?: string; department?: string; location?: string; type?: string; experienceLevel?: string }) => {
      const query = new URLSearchParams();
      if (params?.search) query.set('search', params.search);
      if (params?.department) query.set('department', params.department);
      if (params?.location) query.set('location', params.location);
      if (params?.type) query.set('type', params.type);
      if (params?.experienceLevel) query.set('experienceLevel', params.experienceLevel);
      return request<Job[]>(`/jobs${query.toString() ? `?${query.toString()}` : ''}`);
    },
    myJobs: () => request<Job[]>('/jobs/my-jobs'),
    get: (id: string) => request<Job>(`/jobs/${id}`),
    create: (data: Partial<Job>) =>
      request<{ message: string; job: Job }>('/jobs', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id: string, data: Partial<Job>) =>
      request<{ message: string; job: Job }>(`/jobs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    delete: (id: string) =>
      request<{ message: string }>(`/jobs/${id}`, {
        method: 'DELETE'
      })
  },

  internships: {
    list: (params?: { search?: string; location?: string; mode?: string; duration?: string }) => {
      const query = new URLSearchParams();
      if (params?.search) query.set('search', params.search);
      if (params?.location) query.set('location', params.location);
      if (params?.mode) query.set('mode', params.mode);
      if (params?.duration) query.set('duration', params.duration);
      return request<Internship[]>(`/internships${query.toString() ? `?${query.toString()}` : ''}`);
    },
    myInternships: () => request<Internship[]>('/internships/my-internships'),
    get: (id: string) => request<Internship>(`/internships/${id}`),
    create: (data: Partial<Internship>) =>
      request<{ message: string; internship: Internship }>('/internships', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id: string, data: Partial<Internship>) =>
      request<{ message: string; internship: Internship }>(`/internships/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    delete: (id: string) =>
      request<{ message: string }>(`/internships/${id}`, {
        method: 'DELETE'
      })
  },

  applications: {
    apply: (data: { jobId?: string; internshipId?: string; resumeId?: string; notes?: string }) =>
      request<{ message: string; application: Application }>('/applications', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    myApplications: () => request<any[]>('/applications/my-applications'),
    recruiterApplicants: (params?: { jobId?: string; internshipId?: string; status?: string; applicationType?: string }) => {
      const query = new URLSearchParams();
      if (params?.jobId) query.set('jobId', params.jobId);
      if (params?.internshipId) query.set('internshipId', params.internshipId);
      if (params?.status) query.set('status', params.status);
      if (params?.applicationType) query.set('applicationType', params.applicationType);
      return request<any[]>(`/applications/recruiter${query.toString() ? `?${query.toString()}` : ''}`);
    },
    updateStatus: (id: string, status: string, notes?: string) =>
      request<{ message: string; application: any }>(`/applications/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes })
      })
  },

  resumes: {
    upload: (file: File) => {
      const formData = new FormData();
      formData.append('resume', file);
      return request<{ message: string; resumeId: string; fileName: string; extractedText: string }>(
        '/resumes/upload',
        {
          method: 'POST',
          body: formData
        }
      );
    },
    analyze: (data: { resumeId?: string; resumeText?: string; targetRole?: string }) =>
      request<{ message: string; analysis: any }>('/resumes/analyze', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    latest: () => request<{ resume: any; analysis: any }>('/resumes/latest'),
    matchAll: () =>
      request<{ candidateSkills: string[]; totalPostingsEvaluated: number; matches: any[] }>(
        '/resumes/match-all'
      )
  },

  assessments: {
    list: () => request<any[]>('/assessments'),
    get: (id: string) => request<any>(`/assessments/${id}`),
    submit: (id: string, answers: Record<string, any>, timeSpentSeconds: number) =>
      request<{ message: string; attempt: any }>(`/assessments/${id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers, timeSpentSeconds })
      }),
    myAttempts: () => request<any[]>('/assessments/my-attempts')
  },

  interviews: {
    list: () => request<any[]>('/interviews'),
    schedule: (data: any) =>
      request<{ message: string; interview: any }>('/interviews', {
        method: 'POST',
        body: JSON.stringify(data)
      })
  },

  notifications: {
    list: () => request<any[]>('/notifications'),
    markAsRead: (id: string) => request<any>(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllAsRead: () => request<{ message: string }>('/notifications/read-all', { method: 'PATCH' })
  },

  feedback: {
    submit: (data: any) =>
      request<{ message: string; feedback: any }>('/feedback', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    forCompany: (companyId: string) => request<any[]>(`/feedback/company/${companyId}`)
  }
};
