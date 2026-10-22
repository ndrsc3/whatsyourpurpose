# 🏋️‍♂️ What's Your Purpose

A web application for finding your purpose utilizing vanilla JavaScript and AI integration.

![What's Your Purpose Screenshot](screenshot.png)

## 🌟 Features

- **Feature 1**: 
- **Feature 2**:


## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript, CSS3, HTML5
- **Backend**: Node.js
- **Deployment**: Vercel
- **Database**: Vercel KV Storage

## 🚀 Getting Started

### Prerequisites
1. [GitHub Account](https://github.com)
2. [Vercel Account](https://vercel.com)
3. [Node.js](https://nodejs.org) 24 (`.nvmrc`; production runs 24.x). Node 25 can't load `jsonwebtoken`, so auth fails locally on it.

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/ndrsc3/whatsyourpurpose.git
cd whatsyourpurpose
```

2. Install dependencies (also installs the pre-commit hook):
```bash
npm install
```

3. Link the Vercel project and pull its env into `.env.local` (keys listed in `.env.example`):
```bash
npx vercel link --yes --project app-whatsyourpurpose
npx vercel env pull .env.local
```

4. Start the development server (checks the setup first, then runs `vercel dev`):
```bash
npm run dev:full
```

5. Visit http://localhost:3000 in your browser

### Deploying to Vercel

1. **Prepare Your Repository**
   - Push your code to GitHub
   - Make sure your repository is public or you have a Vercel Pro account

2. **Set Up Vercel KV**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Create a new project
   - Go to Storage tab
   - Click "Create Database" and select KV
   - Follow the setup wizard
   - Copy the provided environment variables

3. **Deploy the Project**
   - Click "Import Project" in Vercel Dashboard
   - Select your GitHub repository
   - Configure project:
     - Framework Preset: Other
     - Build Command: `npm run build`
     - Output Directory: `public`
   - Add Environment Variables:
     - Copy all KV environment variables from step 2
   - Click "Deploy"

4. **Verify Deployment**
   - Wait for deployment to complete
   - Click on the deployment URL
   - Test the application functionality

## 🔍 Code Structure

```
├── api/                # Backend API endpoints
│   ├── check-username.js
│   └── ws.js          # WebSocket handler
├── app.js             # Main application logic
├── styles.css         # Global styles
└── index.html         # Entry point
```

## 🎯 Key Features Explained

### Streak Tracking
The app maintains streak counts for each user, encouraging consistent daily participation. A fire emoji (🔥) appears next to active streaks, adding a fun visual element.

### Offline Support
Built with offline-first functionality, the app stores squat records locally when offline and syncs them when connection is restored.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

Niko Millias
- Twitter: [@ndrsc3](https://twitter.com/ndrsc3)
- GitHub: [@ndrsc3](https://github.com/ndrsc3)

## 🙏 Acknowledgments

- Inspired by my friends
- Thanks to all contributors and early adopters
- Built during my journey to maintain a daily squat habit

## 📈 Future Plans

- [ ] User Account / Auth
- [ ] Implement incentivization (Smart Contract Integration)
- [ ] Add Share Button
- [ ] Custom URL

---
Made with ❤️ for the squat community