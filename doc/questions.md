## 1. Technical Questions
- **API Version**: Using `https://virlo.vercel.app` REST API as shown in paths.js
- **Language**: Using vanilla JavaScript without TypeScript as specified in project-doc.txt
- **External Libraries**:
  - Bootstrap 5
  - Font Awesome 6.7.2
  - JWT Decode 3.1.2
  - Google Maps API
  - SwiftSlider
- **Browser Compatibility**: Supporting Chrome, Firefox, Safari, Edge with minimum responsive width of 320px as per technical-requirements.md

## 2. Authentication Questions
- **Login Mechanism**: JWT token-based authentication implemented in `AuthService`
- **JWT Handling**: Tokens stored in localStorage with validation and automatic renewal
- **User Types**:visitor , Standard users  
- **Session Renewal**: Auto-refresh using token expiration checks

## 3. User Experience Questions
- **Minimum Screen Size**: 320px as defined in CSS variables
- **Dark Mode**: we don't need it
- **Languages**: Currently supporting LTR only english
- **Error Handling**: Centralized error handling through `ErrorHandler` with user-friendly toast notifications

## 4. Performance Questions
- **Image Size Limits**: 
- **CDN Usage**: 
- **Caching Strategy**: in the end of the project as we can develop easier
- **SEO**: Meta tags, sitemap.xml, and robots.txt implemented




## 5. Content Questions
- **Allowed File Types**: 
```javascript
const ALLOWED_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/webp'],
  documents: ['application/pdf']
};
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
```

- **Listing Restrictions**:
```javascript
const LISTING_CONSTRAINTS = {
  titleMinLength: 1,
  titleMaxLength: 22,
  descriptionMinLength: 1,
  descriptionMaxLength: 1000,
  maxImages: 10
};
```

## 6. Security Questions
- **Password Requirements**:
```javascript
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireNumbers: true,
  requireSpecialChars: true,
  requireUppercase: true
};
```

- **CORS Policy**: Defined in .htaccess:
```apache
Header set Access-Control-Allow-Origin "*"
Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header set Access-Control-Allow-Headers "Content-Type, Authorization"
```

## 7. Integration Questions
- **Map Services**: Using Google Maps API as shown in:
```javascript
const MAP_CONFIG = {
  provider: 'google',
  apiKey: AIzaSyDw6thoxZITqFU-HsZMnUu6p5hy3xc-gv0,
  defaultZoom: 13
};
```

- **Analytics Integration**:
```javascript
export class AnalyticsService {
  static providers = {
    google: true,
    facebook: true,
    x:true,
    instgram:true,
    customEvents: true
  };
}
```

## 8. Maintenance Questions
- **Documentation Requirements**: JSDoc comments required for all public methods
- **Error Tracking**: Using centralized error handling:
```javascript
export class ErrorMiddleware {
  static async handle(promise) {
    try {
      return await promise;
    } catch (error) {
      console.error('Operation failed:', error);
      // Send to error tracking service
      ErrorTrackingService.capture(error);
    }
  }
}
```

