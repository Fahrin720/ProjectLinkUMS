import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ProjectLinkUMS — Cross-Faculty Project Discovery & Team Matching',
  description:
    'Student-to-student project discovery, explainable skill and schedule matching, and team collaboration platform for Universiti Malaysia Sabah (UMS).',
  openGraph: {
    title: 'ProjectLinkUMS — Cross-Faculty Project Discovery & Team Matching',
    description:
      'Student-to-student project discovery, explainable skill and schedule matching, and team collaboration platform for Universiti Malaysia Sabah (UMS).',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ProjectLinkUMS — Cross-Faculty Project Discovery & Team Matching',
    description:
      'Student-to-student project discovery, explainable skill and schedule matching, and team collaboration platform for Universiti Malaysia Sabah (UMS).',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className="bg-[#0d0118] text-white antialiased selection:bg-purple-600 selection:text-white font-sans"
      >
        {children}
      </body>
    </html>
  );
}
