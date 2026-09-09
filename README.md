# Property Collector Admin Portal

A mobile-first Next.js portal designed for field admins collecting property and owner details for **FlatNFlatmates**. All properties registered through this portal are directly saved into the platform's MongoDB database with default status **`paused`**.

---

## 🚀 Key Features

1. **Server-Side Authentication**:
   - Every page and API endpoint is protected via Next.js Edge Middleware and secure HTTP-Only session cookies.
   - Admin credentials (`ADMIN_USERNAME` & `ADMIN_PASSWORD`) are validated on the server side.

2. **Mobile-First Dashboard (`/`)**:
   - Overview metrics: Total properties, Paused (pending review), Added Today, and Added This Week.
   - Quick action shortcuts to register new properties or browse/filter.
   - Recent field submissions list with tap-to-view/edit.

3. **Multi-Tab Property Registration (`/properties/new`)**:
   - **Free Tab Switching**: Admins can freely click and switch across any tab at any time with no restrictions.
   - **Owner Selection / Creation**:
     - Live search & select existing owners from DB.
     - Add a new owner with verified status directly on registration (only **Phone Number** is mandatory).
   - **Schema-Level Validation**: Non-required fields are strictly optional. Only fields with `required: true` on the Mongoose model schema are validated on final submission.
   - **📍 Current GPS Location**: Instant one-tap button to fetch high-accuracy device GPS coordinates while visiting a property.
   - **Draft Auto-Save**: Automatically saves unsubmitted drafts in browser LocalStorage to prevent data loss on screen lock or refresh.
   - **Smart Content Generator**: Quick button to generate descriptive title & body text from selected specifications.

4. **Property Search, Filter & Management (`/properties`)**:
   - Live search by **Owner Phone Number** or Property Title.
   - Filter by **Date Added** (Today, Past 7 Days, Custom Date Range).
   - Filter by **Status** (Paused, Active, Draft, All).
   - Quick status toggle between `paused` and `active`.

5. **Property Details & Editing (`/properties/[id]` and `/properties/[id]/edit`)**:
   - Full property inspection view.
   - Comprehensive multi-tab edit form.

---

## 🛠️ Environment Configuration

Create a `.env.local` in `property_collector/`:

```env
# Database Configuration (same as code_v2)
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?appName=FlatNFlatmates
MONGODB_DB=flatnflatmates_dev

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=adminpassword123
SESSION_SECRET=fnf_prop_collector_super_secret_jwt_key_2026_secure

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3005
```

---

## 🏃 Running the Application

```bash
cd property_collector
npm run dev
```

Open [http://localhost:3005](http://localhost:3005) in your browser or mobile viewport.
