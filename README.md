# NovaGym Backend Setup

## Steps to get real Gmail confirmation emails working:

### 1. Install Node.js
Download from https://nodejs.org (LTS version)

### 2. Install dependencies
Open terminal in the Website folder and run:
```
npm install
```

### 3. Get a Gmail App Password
1. Go to your Google Account → Security
2. Enable **2-Step Verification** (required)
3. Go to Security → **App Passwords**
4. Select app: Mail, device: Windows → Generate
5. Copy the 16-character password

### 4. Update server.js
Open server.js and replace:
- `your_gmail@gmail.com` → your actual Gmail
- `your_app_password` → the 16-char App Password from step 3

### 5. Start the server
```
npm start
```
Server runs at http://localhost:3000
Open http://localhost:3000 in your browser to see the site.

### Done!
Now when someone fills the membership form, they get a confirmation email instantly.
