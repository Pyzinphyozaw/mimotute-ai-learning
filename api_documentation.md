# Mimotute API Documentation

This document provides a comprehensive specification of the endpoints exposed by the Mimotute backend service.

---

## Base URL
```
http://localhost:5000/api
```

---

## Authentication Mechanism

All protected routes require authentication via a JSON Web Token (JWT) supplied in an HTTP-only cookie named `token` (or `jwt`). 

---

## 1. Authentication Routes (`/auth`)

### 1.1 Check Current User Session
* **Endpoint:** `GET /auth/me`
* **Access:** Public (Validates cookie session)
* **Headers:** `Cookie: token=<jwt_token>`
* **Responses:**
  * **200 OK:** Session valid.
  * **401 Unauthorized:** Invalid or missing token.
    ```json
    {
      "success": false,
      "message": "Unauthorized: No token provided"
    }
    ```

### 1.2 User Signup
* **Endpoint:** `POST /auth/signup`
* **Access:** Public
* **Request Body:**
  ```json
  {
    "fullname": "John Doe",
    "email": "johndoe@example.com",
    "password": "secretpassword"
  }
  ```
* **Responses:**
  * **201 Created:** Account successfully created. Returns user payload and sets authentication cookie.
    ```json
    {
      "message": "Account created successfully",
      "_id": "64f1ab2c89e1234567890abc",
      "fullname": "John Doe",
      "email": "johndoe@example.com",
      "profilePic": ""
    }
    ```
  * **400 Bad Request:** Missing fields, invalid email format, or user already exists.
    ```json
    {
      "message": "User already exists, Login instead"
    }
    ```

### 1.3 User Login
* **Endpoint:** `POST /auth/login`
* **Access:** Public
* **Request Body:**
  ```json
  {
    "email": "johndoe@example.com",
    "password": "secretpassword"
  }
  ```
* **Responses:**
  * **201 Created:** Authentication successful.
    ```json
    {
      "message": "Logged in successfully",
      "token": "<jwt_token>",
      "_id": "64f1ab2c89e1234567890abc",
      "fullname": "John Doe",
      "email": "johndoe@example.com",
      "profilePic": "https://res.cloudinary.com/..."
    }
    ```
  * **400 Bad Request:** Invalid credentials or missing parameters.

### 1.4 User Logout
* **Endpoint:** `POST /auth/logout`
* **Access:** Public
* **Responses:**
  * **200 OK:** Clears the authentication JWT cookie.
    ```json
    {
      "message": "Logged out."
    }
    ```

---

## 2. Book & Document RAG Routes (`/book`)

### 2.1 Upload PDF & Generate Interactive Course
* **Endpoint:** `POST /book/upload`
* **Access:** Protected
* **Content-Type:** `multipart/form-data`
* **Form Data Parameters:**
  * `pdfFile` (File, required): PDF document file.
* **Stream Response:** `text/event-stream` (Server-Sent Events)
* **Description:** Creates an isolated vector workspace, extracts 15 sequential learning chapters, generates long-form reading content, extracts code examples, produces Q&A pairs/quizzes, and persists data to MongoDB.

### 2.2 Stream Contextual Query / Chat on Book
* **Endpoint:** `POST /book/chat`
* **Access:** Protected
* **Stream Response:** `text/event-stream` (SSE)
* **Request Body:**
  ```json
  {
    "bookId": "64f1ab2c89e1234567890abc",
    "message": "Explain how chapter 3 handles thread synchronization.",
    "mode": "chat"
  }
  ```

### 2.3 Fetch Chat History for a Book
* **Endpoint:** `GET /book/chat/history/:bookId`
* **Access:** Protected
* **Path Parameters:**
  * `bookId` (string, required): Mongo object ID of the book.
* **Responses:**
  * **200 OK:**
    ```json
    [
      {
        "sender": "user",
        "text": "What is the primary topic of chapter 1?"
      },
      {
        "sender": "ai",
        "text": "Chapter 1 introduces basic programming syntax and variable declarations."
      }
    ]
    ```

### 2.4 Get Public Book Catalog (Distinct Titles)
* **Endpoint:** `GET /book/books`
* **Access:** Protected
* **Responses:**
  * **200 OK:** Returns deduplicated list of books sorted by creation date.

### 2.5 Get User's Personal Book Library
* **Endpoint:** `GET /book/userbooks`
* **Access:** Protected
* **Responses:**
  * **200 OK:** Returns array of books owned by the current authenticated user.

### 2.6 Fetch Chapters for User Book
* **Endpoint:** `GET /book/:bookId`
* **Access:** Protected
* **Path Parameters:**
  * `bookId` (string, required): Book identifier.
* **Responses:**
  * **200 OK:**
    ```json
    {
      "success": true,
      "chapters": [
        {
          "chapterTitle": "Part 1: Foundations",
          "comprehensiveReading": "...",
          "codeExamples": "...",
          "qa": [{ "question": "...", "answer": "..." }],
          "quiz": [{ "question": "...", "options": [], "correctAnswer": 0 }]
        }
      ]
    }
    ```

### 2.7 Copy Existing Book to Personal Library
* **Endpoint:** `POST /book/addtolib`
* **Access:** Protected
* **Request Body:**
  ```json
  {
    "bookId": "64f1ab2c89e1234567890abc"
  }
  ```
* **Responses:**
  * **201 Created:** Duplicates book metadata and associated chapters under the target user ID.

---

## 3. General Messaging Routes (`/message`)

### 3.1 Global AI Conversation Stream
* **Endpoint:** `POST /message/userchat`
* **Access:** Protected
* **Stream Response:** `text/event-stream` (SSE)
* **Request Body:**
  ```json
  {
    "message": "Can you summarize key strategies for study optimization?",
    "mode": "chat"
  }
  ```

---

## 4. Profile Management Routes (`/profile`)

### 4.1 Update Profile Picture
* **Endpoint:** `PUT /profile/changeprofile`
* **Access:** Protected
* **Content-Type:** `multipart/form-data`
* **Form Data Parameters:**
  * `profilePic` (File, required): Image file (PNG, JPG, etc.)
* **Responses:**
  * **200 OK:**
    ```json
    {
      "message": "Profile picture updated successfully.",
      "user": {
        "_id": "64f1ab2c89e1234567890abc",
        "fullname": "John Doe",
        "email": "johndoe@example.com",
        "profilePic": "https://res.cloudinary.com/..."
      }
    }
    ```

### 4.2 Get Profile & Library Details
* **Endpoint:** `GET /profile/details`
* **Access:** Protected
* **Responses:**
  * **200 OK:**
    ```json
    {
      "success": true,
      "profile": {
        "fullname": "John Doe",
        "profilePic": "https://res.cloudinary.com/...",
        "email": "johndoe@example.com",
        "memberSince": "2026-08-23T03:11:00.000Z",
        "totalBooks": 3,
        "books": []
      }
    }
    ```

---

## 5. Assessments & Quiz Routes (`/qandq`)

### 5.1 Aggregate User Q&A and Quizzes
* **Endpoint:** `POST /qandq/all`
* **Access:** Protected
* **Responses:**
  * **200 OK:** Re-aggregates all questions and quiz items across all stored chapters for the user into a single consolidated record.
    ```json
    {
      "message": "Successfully reset and populated Qandquiz records from chapter contents.",
      "data": {
        "_id": "64f1ab2c89e1234567890xyz",
        "userId": "64f1ab2c89e1234567890abc",
        "qanda": [],
        "quiz": []
      }
    }
    ```