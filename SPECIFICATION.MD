from pathlib import Path

content = r"""# LUMEN - Full Technical Specification

## Executive Summary

Lumen is an AI-native CMS and cognitive reading platform that transforms long-form articles into swipeable AI-generated cognitive cards while preserving the original editorial content as the source of truth.

Core stack:
- Frontend: React 19, TanStack Start, TanStack Router, TanStack Query, TypeScript, Tailwind v4, shadcn/ui
- Backend: FastAPI
- Database: Supabase PostgreSQL
- Auth: Supabase Auth
- Storage: Supabase Storage
- Vector DB: pgvector
- AI: Groq
- Queue: Redis + Celery
- Deployment: Vercel + Railway/Fly.io

---

# Product Vision

Knowledge at the Speed of Thought.

The platform must feel:
- Premium
- Fast
- Cognitive
- Mobile-first
- AI-native

Users:
- Readers
- Editors
- Admins

---

# Core Features

## CMS
- Rich text editor
- Drafts
- Publishing
- Categories
- Tags
- Image uploads
- Autosave

## AI Cognitive Cards
- Generated from article
- Multiple cards per article
- Versioned generations
- Regeneration support

## RAG Chat
- Per-article chatbot
- Context-grounded answers
- Citations from article chunks

## Search
- Semantic search
- Vector retrieval
- Category filtering

## Analytics
- Views
- Swipes
- Completion rates
- Chat interactions

---

# High Level Architecture

Editor -> FastAPI -> Supabase
                  -> Groq
                  -> Redis Queue

Reader -> FastAPI -> pgvector -> Groq

---

# Multi-Agent Pipeline

1. Content Analyzer Agent
2. Semantic Chunker Agent
3. Card Generator Agent
4. Fact Validator Agent
5. UX Optimizer Agent
6. Embedding Agent
7. Publishing Agent

Rules:
- Deterministic pipeline
- No autonomous agent swarm
- No CrewAI dependency required

---

# Database Schema

## users
- id
- email
- role
- created_at

## profiles
- id
- user_id
- avatar_url
- bio

## articles
- id
- title
- slug
- excerpt
- content
- cover_image
- author_id
- category_id
- status
- published_at

## categories
- id
- name
- slug

## tags
- id
- name
- slug

## article_tags
- article_id
- tag_id

## ai_card_sets
- id
- article_id
- version
- model_used
- prompt_version

## ai_cards
- id
- article_id
- card_index
- title
- body
- takeaway

## article_chunks
- id
- article_id
- chunk_text
- embedding

## chat_sessions
- id
- article_id
- user_id

## chat_messages
- id
- session_id
- role
- content

## analytics_events
- id
- event_type
- user_id
- metadata

---

# Publishing Pipeline

Create Article
-> Save Draft
-> Publish
-> Queue Job
-> Generate Cards
-> Validate Cards
-> Store Cards
-> Generate Embeddings
-> Store Vectors
-> Make Public

---

# Card Generation Rules

- 20-40 words preferred
- 60 words max
- One concept per card
- Preserve facts
- No hallucinations
- Mobile readability first

---

# Reader Experience

Horizontal Swipe:
Card -> Card

Vertical Swipe:
Article -> Article

Modes:
- AI View (default)
- Original View

---

# RAG Architecture

Question
-> Embed Query
-> Similarity Search
-> Retrieve Top Chunks
-> Build Context
-> Groq
-> Answer + Citations

If answer not found:
"I could not find that information in this article."

---

# FastAPI Structure

backend/
  app/
    api/
    agents/
    rag/
    embeddings/
    services/
    workers/
    db/
    models/
    schemas/
    core/

---

# Frontend Structure

src/
  routes/
  features/
  components/
  services/
  hooks/
  lib/
  types/

---

# API Endpoints

POST /api/articles
GET /api/articles
GET /api/articles/{id}
PUT /api/articles/{id}
DELETE /api/articles/{id}

POST /api/articles/{id}/generate
GET /api/articles/{id}/cards

POST /api/articles/{id}/chat

GET /api/search

POST /api/events

---

# Authentication

Supabase Auth

Roles:
- Reader
- Editor
- Admin

JWT validation in FastAPI middleware.

---

# Redis

Responsibilities:
- Job queues
- Caching
- Rate limiting

---

# Analytics

Track:
- View
- Swipe
- Completion
- Bookmark
- Like
- Share
- Chat Started
- Chat Continued

---

# Design System

Theme:
Knowledge at the Speed of Thought

Colors:
Background: #09090B
Primary: #7C3AED
Text: #FFFFFF

Typography:
Inter

Style:
- Premium
- Dark
- Glassmorphism
- Minimal

---

# Performance Targets

Homepage < 1s
Card Load < 100ms
Vector Search < 300ms
Chat < 2s
Lighthouse > 95

---

# Security

- RLS
- JWT
- Rate limiting
- Prompt injection protection
- XSS protection
- Input validation

---

# Deployment

Frontend:
- Vercel

Backend:
- Railway or Fly.io

Database:
- Supabase

Cache:
- Redis

---

# Non-Negotiable Requirements

- Original article is source of truth.
- AI cards never replace original content.
- Every published article generates embeddings.
- Chatbot is RAG-only.
- All AI outputs versioned.
- Mobile-first experience.
- Dark mode default.
"""

path = "/mnt/data/LUMEN_SPECIFICATION.md"
Path(path).write_text(content, encoding="utf-8")
print(path)
