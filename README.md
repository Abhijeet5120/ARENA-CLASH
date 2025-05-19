# Firebase Studio

This is a NextJS starter in Firebase Studio.

## Getting Started

1.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

2.  **Set up Firebase Environment Variables:**
    Copy the `.env.local.example` file to a new file named `.env.local`:
    ```bash
    cp .env.local.example .env.local
    ```
    Open `.env.local` and fill in your Firebase project's configuration details. You can find these in your Firebase project settings:
    *   `NEXT_PUBLIC_FIREBASE_API_KEY`
    *   `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
    *   `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
    *   `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
    *   `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
    *   `NEXT_PUBLIC_FIREBASE_APP_ID`

    If you plan to use Genkit with Google AI Studio, also add your `GOOGLE_API_KEY`.

3.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.

To get started with customizing the application, take a look at `src/app/page.tsx`.

## Genkit (Optional)

If you are using Genkit for AI features:

*   Run the Genkit development server (in a separate terminal):
    ```bash
    npm run genkit:dev
    # or for watching changes
    npm run genkit:watch
    ```

This will start the Genkit development UI, typically on `http://localhost:4000`.
