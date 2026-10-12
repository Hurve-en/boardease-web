# Sprint 1

**Dates:** October 4 – October 11, 2026
**Sprint Lead:** Hurveen Veloso
**Demo By:** Kendall Maputi

## Goal

A user can sign in, and the Admin and Tenant have different access based on their roles.

## Tasks

| Task                                  | Member         | Pull Request                                                                                  | Status       |
| ------------------------------------- | -------------- | --------------------------------------------------------------------------------------------- | ------------ |
| 1.1 Set Up Supabase Authentication    | Kendall Maputi | Web #1, #2, #3                                                                                | Done         |
| 1.2 Test Authentication Integration   | Kendall Maputi | Web #4, #5, #6, #9 · App #1, #2, #4                                                           | Done         |
| 1.3 Design Authentication UI in Figma | Elijah         | https://www.figma.com/design/vDSsrawTLaWHqM4UzWEeHc/BordEase?node-id=0-1&t=mwFAYLwu2SsHClzB-0 | Done         |
| 1.4 Build Admin Login (Web)           | Joachim        | Not yet merged                                                                                | In Progress  |
| 1.5 Build Tenant Login (App)          | Joachim        | App #3                                                                                        | Done         |
| 1.6 Implement Role-Based Access       | Hurveen        | Web #7                                                                                        | Done         |
| 1.7 Implement Logout (Web and App)    | Hurveen        | Web #8,  App #5,                                                     | Done |

## Demo

**Demo environment:** Browser (web) and phone (app)

1. Show the application running from `main`.
2. Sign in as the Admin and demonstrate the available Admin access.
3. Sign in as the Tenant and demonstrate the available Tenant access.
4. Demonstrate that the Tenant cannot access Admin-only features.
5. Demonstrate logout and verify that protected pages or screens cannot be accessed after signing out.

**Demo result:** Was able to successfully demonstrate sign in process and the the different access of the user depending on their roles (Admin/Tenant)

## Each Member

### Hurveen Veloso

- **Merged:** 1.6 Role-Based Access (Web #7). 1.7 Logout (Web #8, App #5, plus the fix PRs: TODO numbers).
- **Next:** 2.2 Connect Api to Supabase , 2.5 Test Api Endpoints
- **Blocked by:** None

### Kendall Maputi

- **Merged:** 1.1 Supabase Authentication (Web #1, #2, #3). 1.2 Authentication testing (Web #4, #5, #6, #9; App #1, #2, #4).
- **Next:** 2.1 Verify if Next.js layer is done setting up, 2.4 Implement Api Validation and Error Handling
- **Blocked by:** None

### Joachim Chiong

- **Merged:** 1.5 Tenant Login (App #3). 1.4 Admin Login: (not yet merged to main).
- **Next:** 2.6 Implement Tenant Registration Backend (APP)
- **Blocked by:** None

### Elijah Bes

- **Merged:** 1.3 Authentication UI design: https://www.figma.com/design/vDSsrawTLaWHqM4UzWEeHc/BordEase?node-id=0-1&t=mwFAYLwu2SsHClzB-0
- **Next:** 2.3 Test Api Authentication
- **Blocked by:** None

## Product Owner

- **Accepted:** All task made on sprint 1 is accepted
- **Sent Back:** None
- **Comments:** Expound Sprint 1 Documentation

## Sprint 2

**Proposed Goal:** Build the foundation of the BoardEase backend API and connect it to Supabase so the application can securely access and manage data.

### Proposed Tasks

| Task                                            | Member         | GitHub Issue |
| ----------------------------------------------- | -------------- | ------------ |
| 2.1 Verify if Next.js layer is done setting up  | Kendall Maputi | None         |
| 2.2 Connect Api to Supabase                     | Hurveen Veloso | None         |
| 2.3 Test Api Authentication                     | Elijah Bes     | None         |
| 2.4 Implement Api Validation and Error Handling | Kendall Maputi | None         |
| 2.5 Test Api Endpoints                          | Hurveen Veloso | None         |
| 2.6 Implement Tenant Registration Backend (APP) | Joachim Chiong | None         |

[Sprint 2 timeline](https://hurve-en.atlassian.net/jira/software/projects/BE/boards/3/timeline?rangeMode=WEEKS)
