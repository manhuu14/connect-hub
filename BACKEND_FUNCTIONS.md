# Backend Edge Functions Documentation

This document describes all available backend edge functions and how to use them.

## 1. notify-application

**Purpose**: Send notifications when a student applies to a job opportunity.

**Endpoint**: `/functions/v1/notify-application`

**Authentication**: Public (no JWT required)

**Request Body**:
```json
{
  "applicationId": "uuid-of-application"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Notification sent successfully",
  "data": {
    "studentName": "John Doe",
    "jobTitle": "Frontend Developer",
    "company": "TechCorp",
    "alumniName": "Jane Smith"
  }
}
```

**Usage Example**:
```typescript
const { data, error } = await supabase.functions.invoke('notify-application', {
  body: { applicationId: 'application-uuid' }
});
```

---

## 2. get-analytics

**Purpose**: Retrieve platform analytics including user counts, activity stats, and community metrics.

**Endpoint**: `/functions/v1/get-analytics`

**Authentication**: Required (JWT token)

**Request Body**: None

**Response**:
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 150,
      "totalCommunities": 9,
      "totalPosts": 342,
      "totalReferrals": 45,
      "totalApplications": 78
    },
    "roleDistribution": {
      "student": 120,
      "alumni": 28,
      "admin": 2
    },
    "recentActivity": {
      "postsLastWeek": 23,
      "applicationsLastWeek": 12
    },
    "topCommunities": [
      {
        "id": "uuid",
        "name": "Computer Science",
        "slug": "computer-science",
        "memberCount": 85
      }
    ],
    "isAdmin": false
  }
}
```

**Usage Example**:
```typescript
const { data, error } = await supabase.functions.invoke('get-analytics', {
  body: {}
});
```

---

## 3. manage-community

**Purpose**: Admin operations for creating, updating, deleting communities and getting community stats.

**Endpoint**: `/functions/v1/manage-community`

**Authentication**: Required (Admin only)

**Request Body**:
```json
{
  "action": "create|update|delete|get-stats",
  "communityData": {
    "name": "Community Name",
    "description": "Community description",
    "slug": "community-slug",
    "id": "uuid (for update/delete/stats)"
  }
}
```

**Actions**:

### Create Community
```typescript
const { data, error } = await supabase.functions.invoke('manage-community', {
  body: {
    action: 'create',
    communityData: {
      name: 'AI & Machine Learning',
      description: 'Discuss AI, ML, and deep learning topics',
      slug: 'ai-machine-learning'
    }
  }
});
```

### Update Community
```typescript
const { data, error } = await supabase.functions.invoke('manage-community', {
  body: {
    action: 'update',
    communityData: {
      id: 'community-uuid',
      name: 'Updated Name',
      description: 'Updated description',
      slug: 'updated-slug'
    }
  }
});
```

### Delete Community
```typescript
const { data, error } = await supabase.functions.invoke('manage-community', {
  body: {
    action: 'delete',
    communityData: {
      id: 'community-uuid'
    }
  }
});
```

### Get Community Stats
```typescript
const { data, error } = await supabase.functions.invoke('manage-community', {
  body: {
    action: 'get-stats',
    communityData: {
      id: 'community-uuid'
    }
  }
});
```

**Response**:
```json
{
  "success": true,
  "data": {
    "community": { /* community object */ },
    "stats": {
      "members": 85,
      "posts": 234
    }
  }
}
```

---

## 4. user-profile-management

**Purpose**: Comprehensive user profile operations including getting full profile data, updating profile, and managing skills.

**Endpoint**: `/functions/v1/user-profile-management`

**Authentication**: Required (JWT token)

**Request Body**:
```json
{
  "action": "get-full-profile|update-profile|add-skill|remove-skill",
  "userId": "uuid (optional, defaults to current user)",
  "profileData": { /* action-specific data */ }
}
```

**Actions**:

### Get Full Profile
```typescript
const { data, error } = await supabase.functions.invoke('user-profile-management', {
  body: {
    action: 'get-full-profile',
    userId: 'user-uuid' // optional
  }
});
```

**Response**:
```json
{
  "success": true,
  "data": {
    "profile": {
      "id": "uuid",
      "name": "John Doe",
      "bio": "Computer Science student",
      "title": "Software Developer",
      "profile_pic_url": "https://...",
      "github_url": "https://github.com/...",
      "linkedin_url": "https://linkedin.com/in/..."
    },
    "role": "student",
    "skills": [
      { "id": "uuid", "skill_name": "React" },
      { "id": "uuid", "skill_name": "TypeScript" }
    ],
    "communities": [
      {
        "community_id": "uuid",
        "joined_at": "2025-01-01",
        "communities": {
          "id": "uuid",
          "name": "Computer Science",
          "slug": "computer-science"
        }
      }
    ],
    "referrals": null, // Only for alumni
    "applications": [ /* Only for students */
      {
        "id": "uuid",
        "message": "I'm interested because...",
        "status": "pending",
        "created_at": "2025-01-15",
        "referral": {
          "job_title": "Frontend Developer",
          "company": "TechCorp",
          "location": "Remote"
        }
      }
    ]
  }
}
```

### Update Profile
```typescript
const { data, error } = await supabase.functions.invoke('user-profile-management', {
  body: {
    action: 'update-profile',
    profileData: {
      name: 'Updated Name',
      bio: 'Updated bio',
      title: 'Senior Developer',
      github_url: 'https://github.com/username',
      linkedin_url: 'https://linkedin.com/in/username'
    }
  }
});
```

### Add Skill
```typescript
const { data, error } = await supabase.functions.invoke('user-profile-management', {
  body: {
    action: 'add-skill',
    profileData: {
      skill_name: 'Python'
    }
  }
});
```

### Remove Skill
```typescript
const { data, error } = await supabase.functions.invoke('user-profile-management', {
  body: {
    action: 'remove-skill',
    profileData: {
      skill_id: 'skill-uuid'
    }
  }
});
```

---

## Error Handling

All functions return errors in this format:
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad request (invalid parameters)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)

---

## Integration Example

Here's a complete example of calling an edge function from your React component:

```typescript
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

async function fetchAnalytics() {
  try {
    const { data, error } = await supabase.functions.invoke('get-analytics', {
      body: {}
    });

    if (error) {
      throw error;
    }

    if (!data.success) {
      throw new Error(data.error);
    }

    console.log('Analytics:', data.data);
    return data.data;
  } catch (error) {
    console.error('Error fetching analytics:', error);
    toast.error('Failed to load analytics');
    return null;
  }
}
```

---

---

## 5. search-alumni

**Purpose**: Search for alumni profiles by name, title, bio, or skills.

**Endpoint**: `/functions/v1/search-alumni`

**Authentication**: Required (JWT token)

**Request Body**:
```json
{
  "searchQuery": "React"
}
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "bio": "Software Engineer",
      "title": "Senior Developer",
      "profile_pic_url": "https://...",
      "github_url": "https://github.com/...",
      "linkedin_url": "https://linkedin.com/in/...",
      "skills": ["React", "TypeScript", "Node.js"]
    }
  ]
}
```

**Usage Example**:
```typescript
const { data, error } = await supabase.functions.invoke('search-alumni', {
  body: { searchQuery: 'React' }
});
```

---

## 6. apply-for-referral

**Purpose**: Submit an application for a job referral (students only).

**Endpoint**: `/functions/v1/apply-for-referral`

**Authentication**: Required (Student role only)

**Request Body**:
```json
{
  "referralId": "uuid",
  "message": "I'm interested in this position because...",
  "resumeUrl": "https://..."
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "student_id": "uuid",
    "referral_id": "uuid",
    "message": "I'm interested...",
    "resume_url": "https://...",
    "status": "pending",
    "created_at": "2025-01-15"
  }
}
```

**Usage Example**:
```typescript
const { data, error } = await supabase.functions.invoke('apply-for-referral', {
  body: {
    referralId: 'referral-uuid',
    message: 'I would love to work here because...',
    resumeUrl: 'https://my-resume.pdf'
  }
});
```

---

## 7. update-application-status

**Purpose**: Update the status of a job application (alumni only - for their own referrals).

**Endpoint**: `/functions/v1/update-application-status`

**Authentication**: Required (Alumni who posted the referral)

**Request Body**:
```json
{
  "applicationId": "uuid",
  "status": "accepted"
}
```

**Valid Statuses**: `pending`, `accepted`, `rejected`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "accepted",
    "updated_at": "2025-01-15"
  }
}
```

**Usage Example**:
```typescript
const { data, error } = await supabase.functions.invoke('update-application-status', {
  body: {
    applicationId: 'application-uuid',
    status: 'accepted'
  }
});
```

---

## 8. get-community-feed

**Purpose**: Fetch posts from a specific community feed with likes/comments counts.

**Endpoint**: `/functions/v1/get-community-feed`

**Authentication**: Required (Community member only)

**Request Body**:
```json
{
  "communityId": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Post title",
      "content": "Post content",
      "type": "update",
      "media_url": "https://...",
      "created_at": "2025-01-15",
      "profiles": {
        "id": "uuid",
        "name": "John Doe",
        "profile_pic_url": "https://..."
      },
      "likes_count": 15,
      "comments_count": 8,
      "user_has_liked": true
    }
  ]
}
```

**Usage Example**:
```typescript
const { data, error } = await supabase.functions.invoke('get-community-feed', {
  body: { communityId: 'community-uuid' }
});
```

---

## 9. toggle-post-like

**Purpose**: Like or unlike a post.

**Endpoint**: `/functions/v1/toggle-post-like`

**Authentication**: Required (JWT token)

**Request Body**:
```json
{
  "postId": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "action": "liked",
  "liked": true
}
```

**Usage Example**:
```typescript
const { data, error } = await supabase.functions.invoke('toggle-post-like', {
  body: { postId: 'post-uuid' }
});
```

---

## 10. manage-user-role

**Purpose**: Change a user's role (admin only - uses `has_role` function for authorization).

**Endpoint**: `/functions/v1/manage-user-role`

**Authentication**: Required (Admin role only)

**Request Body**:
```json
{
  "targetUserId": "uuid",
  "newRole": "alumni"
}
```

**Valid Roles**: `student`, `alumni`, `admin`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "role": "alumni"
  }
}
```

**Usage Example**:
```typescript
const { data, error } = await supabase.functions.invoke('manage-user-role', {
  body: {
    targetUserId: 'user-uuid',
    newRole: 'alumni'
  }
});
```

---

---

## 11. get-user-profile

**Purpose**: Fetch a user's complete profile including role and skills.

**Endpoint**: `/functions/v1/get-user-profile`

**Authentication**: Required (JWT token)

**Request Body**:
```json
{
  "userId": "uuid (optional, defaults to current user)"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "bio": "Computer Science student",
    "title": "Software Developer",
    "profile_pic_url": "https://...",
    "github_url": "https://github.com/...",
    "linkedin_url": "https://linkedin.com/in/...",
    "role": "student",
    "skills": [
      {
        "id": "uuid",
        "skill_name": "React",
        "user_id": "uuid"
      }
    ]
  }
}
```

**Usage Example**:
```typescript
// Get current user's profile
const { data, error } = await supabase.functions.invoke('get-user-profile', {
  body: {}
});

// Get another user's profile
const { data, error } = await supabase.functions.invoke('get-user-profile', {
  body: { userId: 'target-user-uuid' }
});
```

---

## Deployment Status

All edge functions are deployed and ready to use:
✅ notify-application
✅ get-analytics  
✅ manage-community
✅ user-profile-management
✅ search-alumni
✅ apply-for-referral
✅ update-application-status
✅ get-community-feed
✅ toggle-post-like
✅ manage-user-role
✅ get-user-profile

## Notes

- All functions include proper CORS headers for web application access
- Authentication is handled via Supabase JWT tokens
- Admin-only functions use the `has_role` PostgreSQL function for secure role verification
- RLS policies are the primary access control mechanism
- All functions include comprehensive error handling and logging
