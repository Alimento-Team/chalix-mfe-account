import 'core-js/stable';
import 'regenerator-runtime/runtime';

import 'formdata-polyfill';
import { AppProvider, ErrorPage } from '@edx/frontend-platform/react';
import {
  subscribe, initialize, APP_INIT_ERROR, APP_READY, mergeConfig,
} from '@edx/frontend-platform';
import React, { StrictMode } from 'react';
// eslint-disable-next-line import/no-unresolved
import { createRoot } from 'react-dom/client';
import { Route, Routes, Outlet } from 'react-router-dom';

import Header from '@edx/frontend-component-header';
import { FooterSlot } from '@edx/frontend-component-footer';
import { ChalixHeaderWithUserPopup } from '@chalix/frontend-component-header';
import { getConfig } from '@edx/frontend-platform';

import configureStore from './data/configureStore';
import AccountSettingsPage, { NotFoundPage } from './account-settings';
import IdVerificationPageSlot from './plugin-slots/IdVerificationPageSlot';
import messages from './i18n';

import './index.scss';
import Head from './head/Head';

const rootNode = createRoot(document.getElementById('root'));
subscribe(APP_READY, () => {
  // Handler for header navigation
  const handleHeaderNavigation = (tab) => {
    const config = getConfig();
    const lmsBaseUrl = config.LMS_BASE_URL || '';
    
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname.includes('local.openedx.io');
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    
    switch (tab) {
      case 'home':
        window.location.href = `${lmsBaseUrl}/`;
        break;
      case 'category':
        window.location.href = `${lmsBaseUrl}/courses`;
        break;
      case 'learning':
        if (isDevelopment) {
          window.location.href = `${protocol}//${hostname}:1996/learner-dashboard/`;
        } else {
          window.location.href = `${lmsBaseUrl}/dashboard`;
        }
        break;
      case 'personalize':
        if (isDevelopment) {
          window.location.href = `${protocol}//${hostname}:1996/learner-dashboard/?tab=personalized`;
        } else {
          window.location.href = `${lmsBaseUrl}/dashboard?tab=personalized`;
        }
        break;
      default:
        break;
    }
  };

  rootNode.render(
    <StrictMode>
      <AppProvider store={configureStore()}>
        <Head />
        <Routes>
          <Route element={(
            <div className="d-flex flex-column" style={{ minHeight: '100vh' }}>
              <ChalixHeaderWithUserPopup
                organizationTitle="PHẦN MỀM HỌC TẬP THÔNG MINH DÀNH CHO CÔNG CHỨC, VIÊN CHỨC"
                searchPlaceholder="Nhập từ khóa tìm kiếm"
                baseApiUrl={getConfig().LMS_BASE_URL || ''}
                logoutUrl="/logout"
                onNavigate={handleHeaderNavigation}
              />
              <main className="flex-grow-1" id="main">
                <Outlet />
              </main>
              <FooterSlot />
            </div>
        )}
          >
            <Route
              path="/id-verification/*"
              element={<IdVerificationPageSlot />}
            />
            <Route path="/" element={<AccountSettingsPage />} />
            <Route path="/notfound" element={<NotFoundPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AppProvider>
    </StrictMode>,
  );
});

subscribe(APP_INIT_ERROR, (error) => {
  rootNode.render(<ErrorPage message={error.message} />);
});

initialize({
  messages,
  requireAuthenticatedUser: true,
  hydrateAuthenticatedUser: true,
  handlers: {
    config: () => {
      mergeConfig({
        // Ensure platform PUBLIC_PATH is available to routing and link builders
        PUBLIC_PATH: process.env.PUBLIC_PATH || getConfig?.PUBLIC_PATH || '/account/',
        // Also populate common MFE URLs from env for header/footer components
        ACCOUNT_SETTINGS_URL: process.env.ACCOUNT_SETTINGS_URL,
        ACCOUNT_PROFILE_URL: process.env.ACCOUNT_PROFILE_URL,
        LMS_BASE_URL: process.env.LMS_BASE_URL,
        SUPPORT_URL: process.env.SUPPORT_URL,
        SHOW_PUSH_CHANNEL: process.env.SHOW_PUSH_CHANNEL === 'true',
        SHOW_EMAIL_CHANNEL: process.env.SHOW_EMAIL_CHANNEL || 'false',
        ENABLE_COPPA_COMPLIANCE: (process.env.ENABLE_COPPA_COMPLIANCE || false),
        ENABLE_ACCOUNT_DELETION: (process.env.ENABLE_ACCOUNT_DELETION !== 'false'),
        COUNTRIES_WITH_DELETE_ACCOUNT_DISABLED: JSON.parse(process.env.COUNTRIES_WITH_DELETE_ACCOUNT_DISABLED || '[]'),
        ENABLE_DOB_UPDATE: (process.env.ENABLE_DOB_UPDATE || false),
        MARKETING_EMAILS_OPT_IN: (process.env.MARKETING_EMAILS_OPT_IN || false),
        PASSWORD_RESET_SUPPORT_LINK: process.env.PASSWORD_RESET_SUPPORT_LINK,
        LEARNER_FEEDBACK_URL: process.env.LEARNER_FEEDBACK_URL,
        ENABLE_PREFERENCES_V2: process.env.ENABLE_PREFERENCES_V2 || false,
      }, 'App loadConfig override handler');
    },
  },
});
