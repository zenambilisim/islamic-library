<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Islamic Library Project - Copilot Instructions

## Project Overview
This is a React + TypeScript electronic book library project for Islamic religious texts. The application provides a multi-language interface supporting Turkish, English, Russian, and Azerbaijani.

## Technical Stack
- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS with custom components
- **Internationalization**: react-i18next
- **Icons**: Lucide React
- **State Management**: React Context API (planned)
- **Routing**: React Router DOM (to be implemented)

## Project Structure
- `/src/components/` - Reusable UI components
- `/src/components/layout/` - Layout components (Header, Footer, etc.)
- `/src/components/books/` - Book-related components
- `/src/pages/` - Page components
- `/src/types/` - TypeScript type definitions
- `/src/data/` - Mock data and data utilities
- `/src/i18n/` - Internationalization configuration and translation files
- `/src/hooks/` - Custom React hooks

## Key Features to Implement
1. **Multi-language Support**: Turkish (default), English, Russian, Azerbaijani
2. **Book Management**: Display, search, filter books
3. **Multiple Formats**: EPUB, PDF, DOC download support
4. **Online Reading**: In-browser book reader
5. **Live Search**: Real-time search functionality
6. **Responsive Design**: Desktop and mobile friendly
7. **Kindle Compatibility**: Simple version for e-readers

## Code Style Guidelines
- Use TypeScript strict mode
- Prefer functional components with hooks
- Use Tailwind utility classes with custom CSS classes defined in index.css
- Follow React best practices for component composition
- Use type-only imports when importing types
- Implement proper error handling and loading states
- Use semantic HTML elements for accessibility

## Component Conventions
- Export components as default exports
- Use PascalCase for component names and files
- Define prop interfaces with descriptive names
- Use the `useTranslation` hook for internationalization
- Implement responsive design with Tailwind breakpoints

## Translation Guidelines
- All user-facing text should use i18next translation keys
- Translation keys should be descriptive and nested logically
- Support right-to-left text for Arabic content when applicable
- Maintain translation consistency across all supported languages

## Data Management
- Use mock data during development phase
- Structure book data with multi-language support
- Implement proper type safety for all data structures
- Plan for future API integration

## Performance Considerations
- Implement lazy loading for book images
- Use React.memo for expensive components
- Optimize bundle size with proper tree shaking
- Consider virtual scrolling for large book lists

When suggesting code changes or new features, please consider these guidelines and the multi-language nature of the application.
