# MicroMe API Documentation 📚

This document provides comprehensive API documentation for all MicroMe edge functions and endpoints.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Edge Functions](#edge-functions)
4. [Data Schemas](#data-schemas)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Examples](#examples)

## Overview

MicroMe's backend is built on **Supabase Edge Functions** - serverless TypeScript functions that provide AI-powered social media analytics capabilities. All functions are deployed at:

```
https://your-project-id.supabase.co/functions/v1/
```

### Key Features
- **Serverless Architecture**: Auto-scaling edge functions
- **TypeScript**: Full type safety and modern JavaScript features
- **JWT Authentication**: Secure user authentication via Supabase Auth
- **Real-time Updates**: WebSocket connections for live progress tracking
- **Error Handling**: Comprehensive error responses and logging

## Authentication

All API endpoints require authentication via **JWT tokens** provided by Supabase Auth.

### Headers Required

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
apikey: <supabase_anon_key>
```

### Getting JWT Token

```javascript
// Using Supabase client
const { data: { session } } = await supabase.auth.getSession()
const token = session?.access_token
```

## Edge Functions

### 1. Pipeline Orchestrator

**Endpoint**: `POST /functions/v1/pipeline-orchestrator`

**Description**: Main orchestrator that coordinates the entire AI pipeline for processing uploaded social media data.

**Request Body**:
```json
{
  "ingestionId": "uuid-string",
  "userId": "uuid-string",
  "action": "start_pipeline" | "check_status" | "restart"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "pipelineId": "uuid-string",
    "status": "started" | "processing" | "completed" | "failed",
    "currentStage": "ingestion" | "persona_analysis" | "strategy_planning" | "simulation",
    "progress": 25,
    "estimatedCompletion": "2025-01-15T10:30:00Z"
  }
}
```

**Pipeline Stages**:
1. **Data Ingestion** (20%) - Process and validate CSV data
2. **Persona Analysis** (40%) - Generate AI personality profile 
3. **Strategy Planning** (70%) - Create content recommendations
4. **Simulation** (100%) - Generate performance predictions

---

### 2. Ingestion Agent

**Endpoint**: `POST /functions/v1/ingestion-agent`

**Description**: Processes uploaded CSV files containing LinkedIn posts data and validates the structure.

**Request Body**:
```json
{
  "ingestionId": "uuid-string",
  "csvData": "base64-encoded-csv-content",
  "fileName": "linkedin_posts.csv"
}
```

**Expected CSV Format**:
```csv
content,engagement,date,hashtags,post_type
"My latest insights on AI...",25,"2025-01-10","#ai #tech #innovation","text"
"Excited to announce...",45,"2025-01-08","#announcement #career","image"
```

**Response**:
```json
{
  "success": true,
  "data": {
    "ingestionId": "uuid-string",
    "processedRows": 156,
    "validPosts": 152,
    "errors": [
      {
        "row": 12,
        "field": "date",
        "message": "Invalid date format"
      }
    ],
    "summary": {
      "totalEngagement": 2456,
      "avgEngagement": 16.2,
      "dateRange": {
        "start": "2024-01-01",
        "end": "2025-01-15"
      },
      "postTypes": {
        "text": 89,
        "image": 45,
        "video": 18
      }
    }
  }
}
```

---

### 3. Persona Analyst

**Endpoint**: `POST /functions/v1/persona-analyst`

**Description**: Generates comprehensive AI-powered personality analysis based on social media content patterns.

**Request Body**:
```json
{
  "ingestionId": "uuid-string",
  "userId": "uuid-string",
  "analysisDepth": "basic" | "detailed" | "comprehensive"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "personaId": "uuid-string",
    "profile": {
      "personality": {
        "traits": [
          {
            "name": "Thought Leadership",
            "score": 8.5,
            "confidence": 0.92,
            "description": "Strong tendency to share insights and industry knowledge"
          },
          {
            "name": "Authenticity",
            "score": 7.8,
            "confidence": 0.87,
            "description": "Genuine and personal communication style"
          }
        ],
        "communicationStyle": {
          "tone": "Professional yet approachable",
          "vocabulary": "Technical with accessible explanations",
          "sentiment": "Generally positive and optimistic",
          "formality": "Semi-formal"
        }
      },
      "contentPatterns": {
        "themes": [
          {"topic": "AI & Technology", "frequency": 35, "engagement": 24.5},
          {"topic": "Career Growth", "frequency": 28, "engagement": 19.2},
          {"topic": "Industry Insights", "frequency": 22, "engagement": 21.8}
        ],
        "postingFrequency": {
          "daily": 0.7,
          "weekly": 4.2,
          "monthly": 18.5
        },
        "optimalTimes": [
          {"day": "Tuesday", "hour": 9, "engagement": 28.5},
          {"day": "Wednesday", "hour": 14, "engagement": 26.2}
        ]
      },
      "audienceInsights": {
        "engagementTriggers": [
          "Industry insights and predictions",
          "Personal career stories",
          "Technical tutorials with examples"
        ],
        "preferredContentTypes": [
          {"type": "carousel", "engagement": 32.1},
          {"type": "text_with_image", "engagement": 28.5},
          {"type": "video", "engagement": 25.8}
        ]
      }
    },
    "confidence": 0.89,
    "lastUpdated": "2025-01-15T10:30:00Z"
  }
}
```

---

### 4. Strategy Planner

**Endpoint**: `POST /functions/v1/strategy-planner`

**Description**: Creates personalized content strategies based on persona analysis and engagement patterns.

**Request Body**:
```json
{
  "personaId": "uuid-string",
  "userId": "uuid-string",
  "timeframe": "1_week" | "1_month" | "3_months" | "6_months",
  "goals": ["engagement", "reach", "thought_leadership", "brand_awareness"]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "strategyId": "uuid-string",
    "strategy": {
      "overview": {
        "objective": "Increase thought leadership and engagement",
        "targetAudience": "Tech professionals, entrepreneurs, AI enthusiasts",
        "keyMessages": [
          "AI innovation in business",
          "Practical technology insights",
          "Career development in tech"
        ]
      },
      "contentPlan": {
        "weeklyPosts": 3,
        "contentMix": [
          {"type": "insight_posts", "percentage": 40, "frequency": "2x/week"},
          {"type": "personal_stories", "percentage": 30, "frequency": "1x/week"},
          {"type": "industry_analysis", "percentage": 20, "frequency": "1x/2weeks"},
          {"type": "tutorials", "percentage": 10, "frequency": "1x/month"}
        ]
      },
      "contentSuggestions": [
        {
          "title": "The Future of AI in Customer Service",
          "type": "insight_post",
          "content": "Here's what I'm seeing in AI customer service trends...",
          "hashtags": ["#AI", "#CustomerService", "#Innovation"],
          "expectedEngagement": 28.5,
          "confidence": 0.85,
          "reasoning": "Aligns with your tech expertise and audience interests"
        },
        {
          "title": "My Journey Learning Machine Learning",
          "type": "personal_story",
          "content": "Three years ago, I knew nothing about ML...",
          "hashtags": ["#MachineLearning", "#CareerGrowth", "#PersonalStory"],
          "expectedEngagement": 22.3,
          "confidence": 0.78,
          "reasoning": "Personal stories resonate well with your audience"
        }
      ],
      "postingSchedule": {
        "optimalDays": ["Tuesday", "Wednesday", "Thursday"],
        "optimalTimes": ["9:00 AM", "2:00 PM", "5:30 PM"],
        "timezone": "UTC-8"
      },
      "kpis": {
        "targetEngagementRate": 4.2,
        "targetReachGrowth": 15,
        "targetFollowerGrowth": 8
      }
    },
    "generatedAt": "2025-01-15T10:30:00Z",
    "validUntil": "2025-04-15T10:30:00Z"
  }
}
```

---

### 5. Simulation Agent

**Endpoint**: `POST /functions/v1/simulation-agent`

**Description**: Simulates potential performance of content ideas before publishing.

**Request Body**:
```json
{
  "strategyId": "uuid-string",
  "userId": "uuid-string",
  "simulations": [
    {
      "content": "Just finished reading about the latest AI developments...",
      "contentType": "text" | "image" | "video" | "carousel",
      "hashtags": ["#AI", "#Technology", "#Innovation"],
      "postingTime": "2025-01-16T14:00:00Z"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "simulationId": "uuid-string",
    "results": [
      {
        "content": "Just finished reading about the latest AI developments...",
        "predictions": {
          "engagement": {
            "likes": {"min": 15, "expected": 23, "max": 35},
            "comments": {"min": 2, "expected": 4, "max": 8},
            "shares": {"min": 1, "expected": 2, "max": 5},
            "total": {"min": 18, "expected": 29, "max": 48}
          },
          "reach": {
            "organic": {"min": 150, "expected": 280, "max": 450},
            "viral_potential": 0.15
          },
          "sentiment": {
            "positive": 0.78,
            "neutral": 0.18,
            "negative": 0.04
          }
        },
        "confidence": 0.82,
        "factors": {
          "positive": [
            "Content aligns with audience interests",
            "Optimal posting time",
            "Trending hashtags"
          ],
          "negative": [
            "Generic opening might reduce engagement",
            "Could benefit from more specific insights"
          ]
        },
        "recommendations": [
          "Add a specific insight or statistic",
          "Include a call-to-action question",
          "Consider adding an image or visual element"
        ],
        "alternatives": [
          {
            "version": "Here's a surprising stat about AI adoption I discovered today...",
            "expectedImprovement": 15,
            "reasoning": "Hooks readers with curiosity"
          }
        ]
      }
    ],
    "overallScore": 7.8,
    "simulatedAt": "2025-01-15T10:30:00Z"
  }
}
```

---

### 6. Ethics Guard

**Endpoint**: `POST /functions/v1/ethics-guard`

**Description**: Ensures ethical AI usage and provides transparency about algorithmic decisions.

**Request Body**:
```json
{
  "operation": "validate_content" | "explain_decision" | "audit_bias",
  "data": {
    "content": "string",
    "userId": "uuid-string",
    "context": "persona_analysis" | "strategy_planning" | "simulation"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "validation": {
      "isEthical": true,
      "confidenceScore": 0.94,
      "flags": [],
      "recommendations": [
        "Content meets ethical guidelines",
        "No bias detected in recommendations",
        "Transparency standards satisfied"
      ]
    },
    "transparency": {
      "decisionProcess": [
        "Analyzed content for potential bias",
        "Checked against ethical AI guidelines",
        "Verified user consent for data usage",
        "Applied fairness constraints to recommendations"
      ],
      "dataUsage": {
        "userDataAccessed": ["profile_info", "engagement_history"],
        "retentionPeriod": "30_days",
        "sharingPolicy": "no_third_party_sharing"
      },
      "algorithmicApproach": {
        "model": "Custom ensemble with bias detection",
        "trainingData": "Anonymized social media patterns",
        "biasDetection": "Active monitoring enabled"
      }
    },
    "userRights": {
      "dataPortability": true,
      "rightToExplanation": true,
      "optOut": true,
      "dataCorrection": true
    }
  }
}
```

---

### 7. Create Admin User

**Endpoint**: `POST /functions/v1/create-admin-user`

**Description**: Administrative function to create system admin users with elevated privileges.

**Request Body**:
```json
{
  "email": "admin@example.com",
  "password": "secure_password",
  "adminKey": "master_admin_key",
  "permissions": ["user_management", "system_monitoring", "data_export"]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "userId": "uuid-string",
    "email": "admin@example.com",
    "role": "admin",
    "permissions": ["user_management", "system_monitoring", "data_export"],
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

## Data Schemas

### User Profile Schema
```json
{
  "id": "uuid",
  "email": "string",
  "full_name": "string",
  "avatar_url": "string",
  "subscription_tier": "free" | "pro" | "enterprise",
  "preferences": {
    "theme": "light" | "dark" | "system",
    "notifications": boolean,
    "data_retention": "30_days" | "90_days" | "1_year"
  },
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### Data Ingestion Schema
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "file_name": "string",
  "file_size": "integer",
  "status": "uploaded" | "processing" | "completed" | "failed",
  "processed_rows": "integer",
  "valid_posts": "integer",
  "error_count": "integer",
  "metadata": {
    "date_range": {"start": "date", "end": "date"},
    "total_engagement": "integer",
    "avg_engagement": "float"
  },
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "specific_field_if_applicable",
      "value": "problematic_value",
      "expected": "expected_format_or_value"
    },
    "timestamp": "2025-01-15T10:30:00Z",
    "request_id": "uuid-string"
  }
}
```

### Common Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `AUTH_REQUIRED` | Authentication token missing or invalid | 401 |
| `PERMISSION_DENIED` | User lacks required permissions | 403 |
| `INVALID_INPUT` | Request validation failed | 400 |
| `RESOURCE_NOT_FOUND` | Requested resource doesn't exist | 404 |
| `RATE_LIMIT_EXCEEDED` | Too many requests in time window | 429 |
| `PROCESSING_ERROR` | Internal processing error | 500 |
| `SERVICE_UNAVAILABLE` | Temporary service disruption | 503 |

## Rate Limiting

### Limits by Endpoint

| Endpoint | Rate Limit | Window |
|----------|------------|--------|
| `pipeline-orchestrator` | 10 requests | 1 minute |
| `ingestion-agent` | 5 requests | 1 minute |
| `persona-analyst` | 3 requests | 5 minutes |
| `strategy-planner` | 3 requests | 5 minutes |
| `simulation-agent` | 10 requests | 1 minute |
| `ethics-guard` | 20 requests | 1 minute |
| `create-admin-user` | 1 request | 1 hour |

### Rate Limit Headers
```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1642586400
Retry-After: 60
```

## Examples

### Complete Pipeline Workflow

```javascript
// 1. Upload CSV and start ingestion
const ingestionResponse = await fetch('/functions/v1/ingestion-agent', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'apikey': supabaseAnonKey
  },
  body: JSON.stringify({
    csvData: base64CsvContent,
    fileName: 'linkedin_posts.csv'
  })
});

const { data: ingestionData } = await ingestionResponse.json();
const ingestionId = ingestionData.ingestionId;

// 2. Start the pipeline
const pipelineResponse = await fetch('/functions/v1/pipeline-orchestrator', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'apikey': supabaseAnonKey
  },
  body: JSON.stringify({
    ingestionId,
    userId: user.id,
    action: 'start_pipeline'
  })
});

// 3. Monitor pipeline progress
const checkProgress = async () => {
  const response = await fetch('/functions/v1/pipeline-orchestrator', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey
    },
    body: JSON.stringify({
      ingestionId,
      userId: user.id,
      action: 'check_status'
    })
  });
  
  const { data } = await response.json();
  return data.status === 'completed';
};

// Poll for completion
while (!await checkProgress()) {
  await new Promise(resolve => setTimeout(resolve, 5000));
}

console.log('Pipeline completed successfully!');
```

### Content Simulation Example

```javascript
// Simulate multiple content variations
const simulateContent = async (contentVariations) => {
  const response = await fetch('/functions/v1/simulation-agent', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey
    },
    body: JSON.stringify({
      strategyId: 'your-strategy-id',
      userId: user.id,
      simulations: contentVariations.map(content => ({
        content,
        contentType: 'text',
        hashtags: ['#AI', '#Technology'],
        postingTime: new Date().toISOString()
      }))
    })
  });
  
  const { data } = await response.json();
  
  // Find the best performing variation
  const bestContent = data.results.reduce((best, current) => 
    current.predictions.engagement.total.expected > 
    best.predictions.engagement.total.expected ? current : best
  );
  
  return bestContent;
};
```

---

## Support

For API support:
- **Documentation**: [GitHub Wiki](https://github.com/Sarobii/microme/wiki)
- **Issues**: [GitHub Issues](https://github.com/Sarobii/microme/issues)
- **Email**: api-support@microme.app

**API Version**: v1.0.0  
**Last Updated**: 2025-01-15  
**Status**: Production Ready 🚀