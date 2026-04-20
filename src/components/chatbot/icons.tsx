import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const SendIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 48 48" className={className}>
    <path
      fill="currentColor"
      d="M7.262 4.244c-1.787-.893-3.765.812-3.146 2.711L8.13 19.26a2 2 0 0 0 1.573 1.352l15.86 2.643c.835.14.835 1.34 0 1.48L9.704 27.378a2 2 0 0 0-1.573 1.352L4.116 41.042c-.62 1.9 1.359 3.605 3.146 2.712l35.494-17.742c1.659-.83 1.659-3.197 0-4.026z"
    />
  </svg>
);

export const ResetIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 21 21" className={className}>
    <g fill="none" fillRule="evenodd" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
      <path d="M3.578 6.487A8 8 0 1 1 2.5 10.5" />
      <path d="M7.5 6.5h-4v-4" />
    </g>
  </svg>
);

export const TrackIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M9 17H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v5m-8 6a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0m6-3v6m0 0l-2-2m2 2l2-2"
    />
  </svg>
);

export const PriceIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 48 48" className={className}>
    <circle cx="24" cy="24" r="19.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    <path
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M18.135 31.36a5.48 5.48 0 0 0 4.6 2.07h2.76a4.6 4.6 0 0 0 0-9.2h-2.99a4.6 4.6 0 1 1 0-9.2h2.76c2.07 0 3.45.46 4.6 2.07m-5.98-4.6v23"
    />
  </svg>
);

export const TimeIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 512 512" className={className}>
    <path fill="none" stroke="currentColor" strokeMiterlimit="10" strokeWidth="32" d="M256 64C150 64 64 150 64 256s86 192 192 192s192-86 192-192S362 64 256 64Z" />
    <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32" d="M256 128v144h96" />
  </svg>
);

export const ContactIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z"
    />
  </svg>
);

export const VoiceIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 16 16" className={className}>
    <path
      fill="currentColor"
      d="M8 2a2.5 2.5 0 0 0-2.5 2.5V8a2.5 2.5 0 0 0 5 0V4.5A2.5 2.5 0 0 0 8 2M4 7.5a.5.5 0 0 1 .5.5a3.5 3.5 0 1 0 7 0a.5.5 0 0 1 1 0a4.5 4.5 0 0 1-4 4.473V13.5a.5.5 0 0 1-1 0v-1.027A4.5 4.5 0 0 1 3.5 8a.5.5 0 0 1 .5-.5"
    />
  </svg>
);

export const ChatBotIcon: React.FC<IconProps> = ({ className = '', size = 48 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path
      fill="currentColor"
      d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10a9.954 9.954 0 0 1-4.644-1.141l-4.29 1.117a.85.85 0 0 1-1.037-1.036l1.116-4.289A9.955 9.955 0 0 1 2 12C2 6.477 6.477 2 12 2Zm-2 9a1 1 0 1 0 0 2a1 1 0 0 0 0-2Zm4 0a1 1 0 1 0 0 2a1 1 0 0 0 0-2Zm4 0a1 1 0 1 0 0 2a1 1 0 0 0 0-2Z"
    />
  </svg>
);

// Document icon — for document-related quick asks (import paperwork).
export const DocumentIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M14 3v4a1 1 0 0 0 1 1h4M5 8V5a2 2 0 0 1 2-2h8l4 4v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8zM9 12h6m-6 4h6"
    />
  </svg>
);

// Shield icon — for ACD compliance / SSMO regulatory quick asks.
export const ShieldIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M12 3l8 3v6c0 4.97-3.4 8.87-8 10c-4.6-1.13-8-5.03-8-10V6l8-3zm-3 9l2 2l4-4"
    />
  </svg>
);

// Calculator icon — for duty calculation and fee quick asks.
export const CalculatorIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" className={className}>
    <rect x="4" y="3" width="16" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" d="M8 7h8M8 11h2m3 0h3m-8 4h2m3 0h3m-8 3h2m3 0h3" />
  </svg>
);

export const VolumeIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M11 5L6 9H2v6h4l5 4zm4.54 3.46a5 5 0 0 1 0 7.08m2.83-9.9a9 9 0 0 1 0 12.72"
    />
  </svg>
);

export const VolumeOffIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M11 5L6 9H2v6h4l5 4zm12 4l-6 6m0-6l6 6"
    />
  </svg>
);

// Alias used by tracking/project quick asks for "info" style questions.
export const InfoIcon = ContactIcon;
export const ServicesIcon = DocumentIcon;
