# MoviX Web API

## Overview
MoviX Web API is the backend service for the MoviX web application. It provides RESTful API endpoints for user authentication, profile management, and movie/TV show tracking functionality including favorites and watch later lists.

## Features
- **User Authentication**: Local and Google OAuth2 authentication
- **User Management**: Registration, profile editing, and account deletion
- **Profile Pictures**: Upload, update, and delete profile images via Supabase storage
- **Favorites System**: Add/remove movies and TV shows to/from favorites
- **Watch Later**: Save shows to watch later list
- **Session Management**: Secure session handling with PostgreSQL storage
- **CORS Support**: Cross-origin resource sharing for frontend integration

## Technologies Used
- **Node.js** with Express.js framework
- **PostgreSQL** database with Supabase
- **Passport.js** for authentication (Local & Google OAuth2)
- **bcrypt** for password hashing
- **express-session** with PostgreSQL session store
- **Supabase** for file storage and database hosting

## Database Schema
The API uses three main tables:
- **users**: User account information and profile data
- **fav_shows**: User's favorite movies and TV shows
- **later_shows**: User's watch later list

## API Endpoints

### Authentication
- `POST /api/newuser` - Register new user
- `POST /api/local/user` - Local login
- `GET /api/google/user` - Google OAuth login
- `GET /api/google/callback` - Google OAuth callback
- `GET /api/logout` - User logout

### User Management
- `GET /api/user` - Get user profile and shows (authenticated)
- `PATCH /api/edit/user` - Update user profile (authenticated)
- `PATCH /api/update/profile_pic` - Update profile picture (authenticated)
- `DELETE /api/delete/user` - Delete user account (authenticated)

### Shows Management
- `POST /api/fav` - Add show to favorites (authenticated)
- `POST /api/later` - Add show to watch later (authenticated)
- `DELETE /api/fav/:showId` - Remove from favorites (authenticated)
- `DELETE /api/later/:showId` - Remove from watch later (authenticated)

## Environment Variables
Create a `.env` file in the root directory with the following variables:

```env
SUPABASE_DB_URL=your_supabase_database_url
SUPABASE_PROJECT_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
SESSION_SECRET=your_session_secret
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
```

## Installation

```bash
# Clone the repository
git clone https://github.com/abdelrhman-sys/MoviX-API.git

# Navigate to the project directory
cd MoviX-API

# Install dependencies
npm install

# Set up environment variables
# Edit .env with your actual values

# Run the schema.sql file in your PostgreSQL database

# Start the server with nodemon
npm run dev
# Or start the server with node
node index.js
```

## Database Setup
1. Create a PostgreSQL database (recommended: Supabase)
2. Run the SQL commands from `schema.sql` to create the required tables
3. Ensure your database URL is correctly set in the `.env` file

## CORS Configuration
The API is configured to accept requests from:
- `https://movix-web-six.vercel.app/` (production frontend)


## Authentication Flow
1. **Local Authentication**: Email/password with bcrypt hashing
2. **Google OAuth2**: Integration with Google accounts
3. **Session Management**: Secure sessions stored in PostgreSQL
4. **Protected Routes**: Middleware authentication for user-specific endpoints

## File Storage
Profile pictures are stored using Supabase Storage with:
- Automatic signed URL generation for secure access
- Image deletion functionality
- 2-hour signed URL expiration for security

## Server Configuration
- **Port**: 3000 (default)
- **Session Duration**: 7 days
- **CORS**: Enabled with credentials support

## Security Features
- Password hashing with bcrypt
- Secure session management
- Authentication middleware for protected routes
- CORS configuration for frontend integration
- Environment variable protection for sensitive data

## License
This project is licensed under the ISC License.

## Related Projects
- [MoviX Web Frontend](https://github.com/abdelrhman-sys/MoviX-Web.git) - React.js frontend application