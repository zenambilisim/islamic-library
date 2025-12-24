# Islamic Library - Electronic Book Archive

A modern React + TypeScript electronic book library application for Islamic religious texts with multi-language support.

## 🌟 Features

- **Multi-language Support**: Turkish, English, Russian, Azerbaijani
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Live Search**: Real-time search functionality across books, authors, and categories
- **Multiple Formats**: EPUB, PDF, DOC download support
- **Online Reading**: In-browser book reader (coming soon)
- **Contact Form**: Email integration via EmailJS
- **Modern UI**: Clean, professional interface built with Tailwind CSS

## 🛠 Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Internationalization**: react-i18next
- **State Management**: React Context API

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd İslamicLibrary
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your configuration:
- Supabase credentials (for book data)
- EmailJS credentials (for contact form email) - See [EmailJS Setup Guide](docs/EMAILJS-SETUP.md)

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🏗 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── layout/         # Layout components (Header, Footer)
│   └── books/          # Book-related components
├── pages/              # Page components
├── types/              # TypeScript type definitions
├── data/               # Mock data and utilities
├── i18n/               # Internationalization
│   └── locales/        # Translation files
├── hooks/              # Custom React hooks
└── assets/             # Static assets
```

## 🌍 Multi-language Support

The application supports 4 languages:
- 🇹🇷 Turkish (default)
- 🇺🇸 English  
- 🇷🇺 Russian
- 🇦🇿 Azerbaijani

## 📚 Book Management

- Browse books by categories
- Search across titles, authors, and descriptions
- View detailed book information
- Download in multiple formats (EPUB, PDF, DOC)
- Online reading capability (planned)

## 🎨 Design System

Built with Tailwind CSS featuring:
- Responsive grid layouts
- Custom color palette
- Accessible design principles
- Modern typography (Inter font)
- Support for Arabic text (Noto Sans Arabic)

## 🔧 Development

### Contact Form Setup

The contact form uses EmailJS for email handling:

1. Follow the detailed guide in [docs/EMAILJS-SETUP.md](docs/EMAILJS-SETUP.md)
2. Get your credentials from [EmailJS Dashboard](https://dashboard.emailjs.com/)
3. Add them to your `.env` file
4. Test the contact form locally

### Adding New Books

Books are currently managed through mock data in `src/data/mockData.ts`. Each book requires:
- Multi-language titles and descriptions
- Author information
- Category classification
- Cover image
- Available formats
- Metadata (pages, file size, etc.)

### Adding Translations

1. Add new keys to translation files in `src/i18n/locales/`
2. Use the `useTranslation` hook in components
3. Reference keys with dot notation (e.g., `t('book.details')`)

## 🚀 Deployment

Build the project for production:

```bash
npm run build
```

The built files will be in the `dist/` directory, ready for deployment to any static hosting service.

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
