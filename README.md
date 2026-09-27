# Property Collector Admin Portal

A mobile-first Next.js portal designed for field admins collecting property and owner details for **FlatNFlatmates**. All properties registered through this portal are directly saved into the platform's MongoDB database with default status **`paused`**.

---

## 🚀 Key Features

1. **AI Auto-Scrape (`/properties/new`)**:
   - One-click extraction from any real-estate listing URL (MagicBricks, Housing, NoBroker, 99acres, etc.).
   - Server-side scraping with Cheerio and headless-browser fallback (Playwright).
   - SSRF protection (blocking internal IP ranges and private hostnames).
   - Powered by Google Gemini AI structured JSON output mapping directly to the FlatNFlatmates property schema.
   - Automatically matches extracted city/locality to existing database records.
   - Preserves manual review workflow before saving.

2. **Server-Side Authentication**:
   - Every page and API endpoint is protected via Next.js Edge Middleware and secure HTTP-Only session cookies.
   - Admin credentials (`ADMIN_USERNAME` & `ADMIN_PASSWORD`) are validated on the server side.

3. **Mobile-First Dashboard (`/`)**:
   - Overview metrics: Total properties, Paused (pending review), Added Today, and Added This Week.
   - Quick action shortcuts to register new properties or browse/filter.
   - Recent field submissions list with tap-to-view/edit.

4. **Multi-Tab Property Registration (`/properties/new`)**:
   - **Free Tab Switching**: Admins can freely click and switch across any tab at any time with no restrictions.
   - **Owner Selection / Creation**:
     - Live search & select existing owners from DB.
     - Add a new owner with verified status directly on registration (only **Phone Number** is mandatory).
   - **Schema-Level Validation**: Non-required fields are strictly optional. Only fields with `required: true` on the Mongoose model schema are validated on final submission.
   - **📍 Current GPS Location**: Instant one-tap button to fetch high-accuracy device GPS coordinates while visiting a property.
   - **Draft Auto-Save**: Automatically saves unsubmitted drafts in browser LocalStorage to prevent data loss on screen lock or refresh.
   - **Amenities & Custom Tags Display**: Complete visibility and management for both predefined and custom amenities, house rules, and safety features.

5. **Property Search, Filter & Management (`/properties`)**:
   - Live search by **Owner Phone Number** or Property Title.
   - Filter by **Date Added** (Today, Past 7 Days, Custom Date Range).
   - Filter by **Status** (Paused, Active, Draft, All).
   - Quick status toggle between `paused` and `active`.

6. **Property Details & Editing (`/properties/[id]` and `/properties/[id]/edit`)**:
   - Full property inspection view showing all amenities and specs.
   - Comprehensive multi-tab edit form.

---

## 🛠️ Environment Configuration

Create or update `.env.local` in `property_collector/`:

```env
# Database Configuration (connects to shared FlatNFlatmates MongoDB)
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?appName=FlatNFlatmates
MONGODB_DB=flatnflatmates_dev

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=adminpassword123
SESSION_SECRET=fnf_prop_collector_super_secret_jwt_key_2026_secure

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3005

# Google AI (Gemini) Auto-Scrape Configuration
GOOGLE_AI_API_KEY=your_google_ai_or_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

---

## 📦 New Dependencies

- **`@google/genai`**: Official Google GenAI SDK for structured JSON property extraction.
- **`cheerio`**: High-performance server-side HTML parser and cleaner (strips ads, recommendations, and noise).
- **`playwright`**: Headless browser engine fallback for client-side (SPA) rendered listing portals.

---

## 🧪 Testing the AI Auto-Scrape Flow

1. Start the development server:
   ```bash
   npm run dev
   ```
2. Log in at [http://localhost:3005/login](http://localhost:3005/login) with your admin credentials.
3. Navigate to **New Property** (`/properties/new`).
4. Click the **"AI Auto-Scrape"** button in the top header.
5. Paste any property listing URL (e.g. from Housing.com, Magicbricks, NoBroker, etc.) into the modal.
6. Click **"Scrape & Fill Form"**.
7. The listing data (title, specs, rent, deposit, furnishing status, amenities, locality, etc.) will be extracted and auto-populated into the respective form tabs.
8. Review the populated fields, select or add the owner, and click **Register**.

