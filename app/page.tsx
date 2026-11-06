import React from 'react';
import {ProjectLinkProvider} from '@/lib/store';
import {MainMobileAppInterface} from '@/components/MainMobileAppInterface';

export default function HomePage() {
  return (
    <ProjectLinkProvider>
      <MainMobileAppInterface />
    </ProjectLinkProvider>
  );
}
