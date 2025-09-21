# Traceya App – Full Implementation Guide

## Project Goal

Build a traceable Ayurvedic herb collection and processing app with:

- Modern authentication
- Geo-tagging & collection event capture
- Live photo capture with GPS tagging
- Offline-first support with later blockchain anchoring
- QR code generation for product batches
- Farm-themed, mobile-first responsive UI

## 1. Authentication System

### Features Implemented

- **Tabbed Interface**: Login and Register tabs with smooth switching.
- **Login Options**: Farmer ID login, Phone OTP login, Google login.
- **OTP Authentication**: Secure login using one-time passwords.
- **Registration Form**: Fields for Full Name, Farmer ID, Phone Number, with offline support via localStorage.
- **Responsive Design**: Mobile-first, Tailwind CSS with breakpoints.
- **Farm-themed UI**: Leaf icon, green buttons, shadows, rounded corners.

### Technical Implementation

- State management for tab switching and form inputs.
- Offline registration stored in `lib/localRegistration.ts`.
- OTP generation and validation handled in `lib/otp.ts`.
- Accessibility enhanced with labels and focus states.

### Example Flow

```tsx
// app/login/page.tsx
'use client';
import { useState } from 'react';
import { sendOtp, validateOtp } from '../../lib/otp';
import { savePendingRegistration } from '../../lib/localRegistration';

export default function LoginPage() {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [farmerId, setFarmerId] = useState('');
  const [otp, setOtp] = useState('');

  const handleLogin = async () => {
    const valid = await validateOtp(farmerId, otp);
    if (valid) alert('Login successful');
    else alert('Invalid OTP');
  };

  const handleRegister = async (name: string, id: string, phone: string) => {
    await savePendingRegistration({ name, id, phone });
    alert('Registration saved offline');
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex justify-around mb-4">
        <button onClick={() => setTab('login')} className="tab-button">Login</button>
        <button onClick={() => setTab('register')} className="tab-button">Register</button>
      </div>
      {tab === 'login' ? (
        <div>
          <input value={farmerId} onChange={e => setFarmerId(e.target.value)} placeholder="Farmer ID" />
          <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="OTP" />
          <button onClick={handleLogin}>Login</button>
        </div>
      ) : (
        <div>
          <input placeholder="Full Name" />
          <input placeholder="Farmer ID" />
          <input placeholder="Phone Number" />
          <button onClick={() => handleRegister('John Doe', 'F123', '9876543210')}>Register</button>
        </div>
      )}
    </div>
  );
}
```

## 2. Geo-Tagging & Collection Event Capture

### Features Implemented

#### GPS Coordinate Capture

- `components/location-capture.tsx` allows automatic/manual GPS coordinate capture.
- Uses `lib/geolocation.ts` for device location.
- Error handling and fallbacks included.
- Shows accuracy indicators (green = excellent, yellow = good, red = poor).

#### Photo Capture

- `components/photo-capture.tsx` lets users take photos of herbs.
- Supports multiple photos (up to 3), preview, and delete functionality.
- Generates hashes for verification.

#### Metadata Input

- Species selection (Ayurvedic species dropdown)
- Moisture percentage with validation
- Notes/comments textarea

#### Offline Storage & Sync

- IndexedDB via Dexie.js (`lib/db.ts`)
- Multiple save options: "Save Offline," "Sync Now," "Send SMS"

#### User Interface

- Mobile-first, responsive design
- Farm-themed icons and colors
- Clear error messages and loading indicators

### Technical Implementation

- **Component Architecture**: Separate components for location and photo capture.
- **Error Handling**: Comprehensive handling for GPS and camera.
- **Offline-First Approach**: Store locally first, sync when online.
- **Responsive Design**: Adaptive spacing and font sizes.
- **User Feedback**: Loading indicators and error messages.

## 3. Live Geo-Tagged Photo Capture

```tsx
// components/photo-capture.tsx
'use client';
import { useState } from 'react';
import { Camera } from 'react-camera-pro';
import { getCurrentLocation } from '../lib/geolocation';
import { hashData } from '../lib/utils';
import { saveCollectionEventOffline } from '../lib/db';

interface PhotoData {
  photo: string;
  location: { latitude: number; longitude: number };
  timestamp: string;
  hash: string;
}

export const PhotoCapture = ({ onPhotoSaved }: { onPhotoSaved: (data: PhotoData) => void }) => {
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [loading, setLoading] = useState(false);

  const takePhoto = async () => {
    try {
      setLoading(true);
      const photo = await Camera.takePhoto();
      const location = await getCurrentLocation();
      const timestamp = new Date().toISOString();
      const photoHash = hashData({ photo, location, timestamp });

      const newPhoto: PhotoData = { photo, location, timestamp, hash: photoHash };
      await saveCollectionEventOffline({ photos: [newPhoto] });
      setPhotos([...photos, newPhoto]);
      onPhotoSaved(newPhoto);
    } catch (err: any) {
      alert('Error capturing photo or location: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const deletePhoto = (index: number) => {
    const updated = [...photos];
    updated.splice(index, 1);
    setPhotos(updated);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="camera-preview w-full max-w-md mb-4">
        <Camera className="w-full rounded-lg shadow-lg" />
      </div>
      <button onClick={takePhoto} disabled={loading} className="bg-green-600 text-white px-6 py-2 rounded-lg shadow hover:bg-green-700">
        {loading ? 'Capturing...' : 'Capture Herb'}
      </button>
      {photos.length > 0 && (
        <div className="mt-4 w-full max-w-md grid grid-cols-3 gap-2">
          {photos.map((p, idx) => (
            <div key={p.hash} className="relative">
              <img src={p.photo} alt={`Herb photo ${idx + 1}`} className="w-full h-24 object-cover rounded" />
              <button
                onClick={() => deletePhoto(idx)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
              >
                X
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

## 4. Planned Future Enhancements

### Blockchain Anchoring

- Hash collection events and store on-chain for immutable verification
- Implement Merkle tree for efficient batch verification
- Create blockchain explorer interface for traceability

### Lab/Processing Event Screen

- Quality test results upload
- Processing batch creation
- Chain-of-custody tracking

### QR Code Generation

- Generate QR codes for finished product batches
- Consumer-facing verification page
- Batch history visualization

## Technical Architecture

### Frontend

- Next.js with App Router
- React components with TypeScript
- Tailwind CSS for styling
- ShadcnUI component library

### Data Storage

- IndexedDB (Dexie.js) for offline storage
- REST API for online sync
- SMS fallback for low-connectivity areas

### Authentication

- JWT for session management
- OTP for phone verification
- OAuth for Google login

## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

- Build the application: `npm run build`
- Deploy to Vercel or similar platform
- Configure environment variables for API endpoints

## Contributing

- Follow the import standards in `docs/import-standards.md`
- Use the provided component library for UI consistency
- Ensure offline functionality works before submitting PRs