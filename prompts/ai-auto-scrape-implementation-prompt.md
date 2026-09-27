# AI Auto-Scrape Feature — Implementation Prompt

## Context

I have a **Property Collector** app used internally by admins to log property listing information. I want to add an "AI Auto-Scrape" feature that lets an admin paste a URL to a property listing (from any real-estate platform), automatically scrape the page, send the extracted content to a Google AI (Gemini) model, and have the AI return structured data that auto-populates the "Add Property" form.

Please implement the following end-to-end.

---

## 1. UI Changes — `/properties/new` page only

- **Remove** the existing **"Smart Fill"** button entirely, along with any handlers/logic used *only* by it. Do not touch shared logic/components reused elsewhere in the app.
- **Add** a new button labeled **"AI Auto-Scrape"** at the top of the form/page.
- Clicking it opens a **modal/popup** with:
  - A single text input for the property listing **URL** (with basic client-side URL format validation).
  - A **"Scrape"** button.
  - A **loading state** (spinner + disabled inputs) while the backend is fetching/processing — this may take several seconds, so show a friendly "Fetching and analyzing property data…" message.
  - An **error state**: inline message shown inside the modal (not a page-level crash) if scraping or AI processing fails, with the option to edit the URL and retry.
  - A **cancel/close** option that aborts the request if still in-flight.
- On success: close the modal, populate the form fields (see Section 4), and show a toast/notification like "Property details auto-filled. Please review before saving." Do **not** auto-submit the form — admin must review and manually save.

---

## 2. Backend Flow

Create a new endpoint, e.g. `POST /api/properties/auto-scrape`, accepting `{ url: string }`, that performs the following server-side (never client-side, to avoid CORS issues and keep API keys secure):

### Step A — Fetch the page
- Fetch the HTML server-side.
- Detect if the page is JS-rendered / returns insufficient content from a plain HTTP fetch (e.g., body text is too short or key content div is empty), and in that case fall back to a headless browser (e.g., Playwright) to render and extract the DOM.
- Strip `<script>`, `<style>`, navigation, footer, header, ads, and "similar/recommended properties" sections where identifiable by common patterns (class names like `related`, `recommended`, `similar-listings`, `you-may-also-like`, etc.) before sending content downstream.
- Extract the main content area (main listing details block) if identifiable, to reduce noise and token usage.
- Handle errors gracefully with specific messages: invalid URL, timeout, 403/blocked, non-property page, empty content — and return these as clear error responses the modal can display.
- Respect a reasonable timeout (e.g., 15–20s) and enforce a max content size sent downstream (truncate if huge).

### Step B — Send to Google AI (Gemini)
- Use the Google AI (Gemini) API via my existing Google AI Pro subscription/API key (stored in server-side env variable, e.g., `GOOGLE_AI_API_KEY` — never expose to client).
- Construct a system/instruction prompt that:
  1. Explains the extracted webpage content is a **real-estate/property listing page** that may contain **one primary property plus multiple unrelated "suggested," "similar," or "recommended" listings** elsewhere on the page.
  2. Instructs the model to **identify and extract data only for the single main/primary property** being viewed on that URL — explicitly ignore any suggested/recommended/similar-listing blocks, ads, or navigation content, even if they contain property-like data.
  3. Instructs the model to output data **strictly matching the current form schema** (see Section 4) — same field names, same data types, same enums/options as used in the app.
  4. Instructs the model to explicitly **exclude**:
     - Any image URLs / media (images will be added manually).
     - Any user/agent/owner/lister contact information (name, phone, email) — this will be entered manually.
  5. Instructs the model to return **only valid JSON** matching a defined schema — no prose, no markdown fences — so it can be parsed directly. Use Gemini's structured output / JSON mode (`responseMimeType: "application/json"` with a `responseSchema`, if using the `generateContent` API) to enforce this reliably rather than relying purely on prompt instructions.
  6. Instructs the model to leave a field `null`/empty (not guessed/fabricated) if the data isn't present on the page, rather than hallucinating values.
- Parse the JSON response server-side; validate it against the expected schema before returning it to the frontend (reject/flag malformed responses rather than silently passing through).

### Step C — Return to frontend
- Return the validated structured JSON to populate the form.
- Include a `warnings` array in the response for cases like: "Some required fields could not be found on the page and were left blank," so the frontend can surface this in the toast/modal.

---

## 3. Field Mapping — Adapt to Current Schema

**Important:** Before writing the AI prompt/schema, inspect the current `/properties/new` form and its underlying data model (whatever `Property` schema/model the app already uses — check the form component, its validation schema, and the DB/model definition). Build the AI's expected JSON output schema to **exactly match the existing field names, types, and enums** used in that model — don't invent new field names or restructure existing data. Examples of fields to map (adjust to whatever actually exists in the app):

- Title / listing name
- Property type (apartment, villa, plot, commercial, etc. — map to existing enum/dropdown values)
- Price / rent amount, currency
- Area / size (with unit — sqft/sqm — normalize to whatever unit the app uses)
- Number of bedrooms / bathrooms
- Address / locality / city / state / country (as separate fields if the form has separate fields)
- Furnishing status
- Amenities (see Section 5 — map to existing amenities list/taxonomy, adding any new custom ones per that fix)
- Description / about the property
- Any other structured fields already present in the form

Fields explicitly **excluded** from AI output/population:
- Images / photos / media URLs
- Owner/agent/lister name, phone, email, or any contact/user info

---

## 4. Amenities Bug Fix (Separate Fix, Same PR)

There's an existing bug: when an admin adds a **custom amenity** (i.e., not from the predefined list) while creating/editing a property, that custom amenity is saved but **not visible to users** viewing the property afterward.

Please:
- Investigate why custom amenities aren't rendered on the property detail/listing view for end users (likely the display component only renders amenities matching a predefined enum/list, silently dropping unrecognized/custom values).
- Fix so that **any amenity stored against a property — predefined or custom — is displayed** wherever amenities are shown to users.
- Ensure this fix doesn't break existing filtering/search functionality that may rely on a fixed amenities list (if filters use a controlled list, custom amenities should still just not appear as filter options, but should always appear on the property's own display).

---

## 5. Non-Functional Requirements

- **Security:** URL input must be validated/sanitized server-side to prevent SSRF (block internal/private IP ranges, localhost, link-local addresses, etc. — restrict outbound fetch to public HTTP/HTTPS URLs only).
- **Rate limiting:** Add basic rate limiting on the `/auto-scrape` endpoint to prevent abuse (this is admin-only, but still).
- **Logging:** Log scrape attempts (URL, success/failure, timestamp, admin user) for auditing, without logging full page content or API keys.
- **Config:** Google AI API key and model name should be configurable via environment variables, not hardcoded.
- **Graceful degradation:** If the Google AI API is down/rate-limited/errors out, show a clear error in the modal ("AI service unavailable, please try again or fill the form manually") rather than a generic failure.

---

## 6. Deliverables

1. Updated `/properties/new` page: button swap + modal component.
2. New backend endpoint for scrape + AI processing.
3. Scraper utility (with headless-browser fallback).
4. Gemini API integration module (prompt + schema + response validation).
5. Amenities display bug fix.
6. Brief README/notes on:
   - Required env vars (e.g., `GOOGLE_AI_API_KEY`, model name).
   - Any new dependencies added (e.g., Playwright, HTML parsing lib).
   - How to test the flow locally with a sample listing URL.

Please review the current codebase structure first (form components, property schema/model, existing "Smart Fill" implementation for reference on request/response patterns already in use) before implementing, so the new feature is consistent with existing conventions (naming, folder structure, error handling style, etc.).
