import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import { AppContext } from '@edx/frontend-platform/react';
import {
  render, screen, fireEvent,
} from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { IntlProvider, injectIntl } from '@edx/frontend-platform/i18n';

import AccountSettingsPage from '../AccountSettingsPage';
import mockData from './mockData';

const SAVE_MULTIPLE_SETTINGS_ACTION_TYPE = 'ACCOUNT_SETTINGS__SAVE_MULTIPLE_SETTINGS';

const mockDispatch = jest.fn();
jest.mock('@edx/frontend-platform/analytics', () => ({
  sendTrackingLogEvent: jest.fn(),
  getCountryList: jest.fn(),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));

jest.mock('@edx/frontend-platform/auth');

const IntlAccountSettingsPage = injectIntl(AccountSettingsPage);

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

describe('AccountSettingsPage', () => {
  let props = {};
  let store = {};
  const appContext = { locale: 'en', authenticatedUser: { userId: 3, roles: [] } };
  const reduxWrapper = children => (
    <AppContext.Provider value={appContext}>
      <Router>
        <IntlProvider locale="en">
          <Provider store={store}>
            {children}
          </Provider>
        </IntlProvider>
      </Router>
    </AppContext.Provider>
  );

  beforeEach(() => {
    store = mockStore(mockData);
    props = {
      loaded: true,
      siteLanguage: {},
      formValues: {
        username: 'test_username',
        accomplishments_shared: false,
        name: 'test_name',
        email: 'test_email@test.com',
        id: 534,
        extended_profile: [
          {
            field_name: 'work_experience',
            field_value: '',
          },
        ],

      },
      fetchSettings: jest.fn(),
    };
  });

  afterEach(() => jest.clearAllMocks());

  beforeAll(() => {
    global.lightningjs = {
      require: jest.fn().mockImplementation((module, url) => ({ moduleName: module, url })),
    };
  });

  afterAll(() => {
    delete global.lightningjs;
  });

  it('renders AccountSettingsPage correctly with editing enabled', async () => {
    const { getByText, rerender, getByLabelText } = render(reduxWrapper(<IntlAccountSettingsPage {...props} />));

    const workExperienceText = getByText('Work Experience');
    const workExperienceEditButton = workExperienceText.parentElement.querySelector('button');

    expect(workExperienceEditButton).toBeInTheDocument();

    store = mockStore({
      ...mockData,
      accountSettings: {
        ...mockData.accountSettings,
        openFormId: 'work_experience',
      },
    });
    rerender(reduxWrapper(<IntlAccountSettingsPage {...props} />));

    const submitButton = screen.getByText('Save');
    expect(submitButton).toBeInTheDocument();

    const workExperienceSelect = getByLabelText('Work Experience');

    // Use fireEvent.change to simulate changing the selected value
    fireEvent.change(workExperienceSelect, { target: { value: '4' } });

    fireEvent.click(submitButton);
  });

  describe('buildSettingsArrayFromDrafts', () => {
    it('includes basic account fields in the settings array', () => {
      store = mockStore({
        ...mockData,
        accountSettings: {
          ...mockData.accountSettings,
          drafts: {
            email: 'new@test.com',
            name: 'New Name',
            phone_number: '0123456789',
          },
        },
      });

      const { getByText } = render(reduxWrapper(<IntlAccountSettingsPage {...props} />));
      fireEvent.click(getByText('Lưu thay đổi'));

      const actions = store.getActions();
      const saveMultipleAction = actions.find(a => a.type === SAVE_MULTIPLE_SETTINGS_ACTION_TYPE);

      expect(saveMultipleAction).toBeDefined();
      const { settingsArray } = saveMultipleAction.payload;

      expect(settingsArray.find(s => s.formId === 'email')).toEqual({ formId: 'email', commitValues: 'new@test.com' });
      expect(settingsArray.find(s => s.formId === 'name')).toEqual({ formId: 'name', commitValues: 'New Name' });
      expect(settingsArray.find(s => s.formId === 'phone_number')).toEqual({ formId: 'phone_number', commitValues: '0123456789' });
    });

    it('groups extended profile fields into a single extended_profile entry', () => {
      store = mockStore({
        ...mockData,
        accountSettings: {
          ...mockData.accountSettings,
          values: {
            ...mockData.accountSettings.values,
            extended_profile: [
              { field_name: 'province', field_value: 'Ha Noi' },
              { field_name: 'birth_date', field_value: '1984-01-01' },
            ],
          },
          drafts: {
            province: 'Ho Chi Minh',
            birth_date: '1990-05-15',
          },
        },
      });

      const { getByText } = render(reduxWrapper(<IntlAccountSettingsPage {...props} />));
      fireEvent.click(getByText('Lưu thay đổi'));

      const actions = store.getActions();
      const saveMultipleAction = actions.find(a => a.type === SAVE_MULTIPLE_SETTINGS_ACTION_TYPE);

      expect(saveMultipleAction).toBeDefined();
      const { settingsArray } = saveMultipleAction.payload;

      const extendedProfileEntry = settingsArray.find(s => s.formId === 'extended_profile');
      expect(extendedProfileEntry).toBeDefined();
      expect(extendedProfileEntry.commitValues).toContainEqual({ field_name: 'province', field_value: 'Ho Chi Minh' });
      expect(extendedProfileEntry.commitValues).toContainEqual({ field_name: 'birth_date', field_value: '1990-05-15' });

      // Extended profile fields should NOT appear as separate entries
      expect(settingsArray.find(s => s.formId === 'province')).toBeUndefined();
      expect(settingsArray.find(s => s.formId === 'birth_date')).toBeUndefined();
    });

    it('includes both basic and extended profile fields when mixed drafts are present', () => {
      store = mockStore({
        ...mockData,
        accountSettings: {
          ...mockData.accountSettings,
          values: {
            ...mockData.accountSettings.values,
            extended_profile: [
              { field_name: 'province', field_value: 'Ha Noi' },
            ],
          },
          drafts: {
            email: 'updated@test.com',
            name: 'Updated Name',
            province: 'Ho Chi Minh',
            birth_date: '1984-03-26',
          },
        },
      });

      const { getByText } = render(reduxWrapper(<IntlAccountSettingsPage {...props} />));
      fireEvent.click(getByText('Lưu thay đổi'));

      const actions = store.getActions();
      const saveMultipleAction = actions.find(a => a.type === SAVE_MULTIPLE_SETTINGS_ACTION_TYPE);

      expect(saveMultipleAction).toBeDefined();
      const { settingsArray } = saveMultipleAction.payload;

      // Basic fields are present
      expect(settingsArray.find(s => s.formId === 'email')).toEqual({ formId: 'email', commitValues: 'updated@test.com' });
      expect(settingsArray.find(s => s.formId === 'name')).toEqual({ formId: 'name', commitValues: 'Updated Name' });

      // Extended profile fields are grouped
      const extendedProfileEntry = settingsArray.find(s => s.formId === 'extended_profile');
      expect(extendedProfileEntry).toBeDefined();
      expect(extendedProfileEntry.commitValues).toContainEqual({ field_name: 'province', field_value: 'Ho Chi Minh' });
      expect(extendedProfileEntry.commitValues).toContainEqual({ field_name: 'birth_date', field_value: '1984-03-26' });
    });

    it('excludes password and confirm_password fields from the settings array', () => {
      store = mockStore({
        ...mockData,
        accountSettings: {
          ...mockData.accountSettings,
          drafts: {
            name: 'Test User',
            password: 'secret123',
            confirm_password: 'secret123',
          },
        },
      });

      const { getByText } = render(reduxWrapper(<IntlAccountSettingsPage {...props} />));
      fireEvent.click(getByText('Lưu thay đổi'));

      const actions = store.getActions();
      const saveMultipleAction = actions.find(a => a.type === SAVE_MULTIPLE_SETTINGS_ACTION_TYPE);

      expect(saveMultipleAction).toBeDefined();
      const { settingsArray } = saveMultipleAction.payload;

      expect(settingsArray.find(s => s.formId === 'password')).toBeUndefined();
      expect(settingsArray.find(s => s.formId === 'confirm_password')).toBeUndefined();
      expect(settingsArray.find(s => s.formId === 'name')).toEqual({ formId: 'name', commitValues: 'Test User' });
    });

    it('does not dispatch saveMultipleSettings when drafts are empty', () => {
      store = mockStore({
        ...mockData,
        accountSettings: {
          ...mockData.accountSettings,
          drafts: {},
        },
      });

      const { getByText } = render(reduxWrapper(<IntlAccountSettingsPage {...props} />));
      fireEvent.click(getByText('Lưu thay đổi'));

      const actions = store.getActions();
      const saveMultipleAction = actions.find(a => a.type === SAVE_MULTIPLE_SETTINGS_ACTION_TYPE);

      expect(saveMultipleAction).toBeUndefined();
    });
  });
});
