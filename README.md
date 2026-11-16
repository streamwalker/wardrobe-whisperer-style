# Drip Slayer

Wardrobe and outfit assistant with a shared React web app and bundled Capacitor iOS app. The interface uses full-screen locally bundled video, minimal navigation, and text overlays throughout. See [motion design notes](docs/MOTION-DESIGN.md) and [the recorded preview](artifacts/motion-walkthrough.mp4).

The iOS project is prepared for configuration and device testing; it is not signed or submitted. See [the submission handoff](docs/IOS-SUBMISSION.md) for Apple/RevenueCat setup, deployment gaps, listing copy, and required verification.

```sh
cp .env.example .env.local
# Populate the public Supabase values and RevenueCat Apple SDK key.
npm ci
npm run dev
```

```sh
npm run typecheck
npm test
npm run build
npm run ios:sync
npm run ios:open
```

Signing requires a Mac with Xcode and an Apple Developer account belonging to configured team `32N9W9HZ54`. Backend secrets belong in Supabase, never frontend environment variables. The website and new Edge Functions are live; authenticated deletion and Apple purchase testing still need completion before the iOS release.

Original project instructions follow.

---

# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
