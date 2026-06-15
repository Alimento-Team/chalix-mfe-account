import { profileDataManagerSelector, formValuesSelector } from './selectors';

const testValue = 'test VALUE';

describe('profileDataManagerSelector', () => {
  it('returns the profileDataManager from the state', () => {
    const state = {
      accountSettings: {
        profileDataManager: { testValue },
      },
    };
    const result = profileDataManagerSelector(state);

    expect(result).toEqual(state.accountSettings.profileDataManager);
  });

  it('should correctly select form values', () => {
    const state = {
      accountSettings: {
        values: {
          name: 'John Doe',
          age: 25,
        },
        drafts: {
          age: 26,

        },
        verifiedNameHistory: 'test',
        confirmationValues: {},
      },
    };

    const result = formValuesSelector(state);

    const expected = {
      name: 'John Doe',
      age: 26,
      verified_name: '',
      useVerifiedNameForCerts: false,
    };

    expect(result).toEqual(expected);
  });

  it('should correctly select form values with extended_profile', () => {
    // Mock data with extended_profile field in both values and drafts
    const state = {
      accountSettings: {
        values: {
          extended_profile: [
            { field_name: 'test_field', field_value: '5' },
          ],
        },
        drafts: { test_field: '6' },
        verifiedNameHistory: 'test',
        confirmationValues: {},
      },
    };

    const result = formValuesSelector(state);

    const expected = {
      verified_name: '',
      useVerifiedNameForCerts: false,
      extended_profile: [ // Draft value should override the committed value
        { field_name: 'test_field', field_value: '6' }, // Value from the committed values
      ],
      test_field: '6',
    };

    expect(result).toEqual(expected);
  });

  it('should merge multiple drafts into extended_profile values', () => {
    const state = {
      accountSettings: {
        values: {
          extended_profile: [
            { field_name: 'test_field', field_value: '5' },
            { field_name: 'job_title', field_value: 'Old title' },
          ],
        },
        drafts: {
          test_field: '6',
          job_title: 'New title',
        },
        verifiedNameHistory: 'test',
        confirmationValues: {},
      },
    };

    const result = formValuesSelector(state);

    expect(result).toEqual({
      verified_name: '',
      useVerifiedNameForCerts: false,
      extended_profile: [
        { field_name: 'test_field', field_value: '6' },
        { field_name: 'job_title', field_value: 'New title' },
      ],
      test_field: '6',
      job_title: 'New title',
    });
  });

  it('should expose extended_profile fields as top-level form values', () => {
    const state = {
      accountSettings: {
        values: {
          extended_profile: [
            { field_name: 'cccd', field_value: '0123456789' },
            { field_name: 'province', field_value: 'Ha Noi' },
          ],
        },
        drafts: {},
        verifiedNameHistory: 'test',
        confirmationValues: {},
      },
    };

    const result = formValuesSelector(state);

    expect(result.cccd).toEqual('0123456789');
    expect(result.province).toEqual('Ha Noi');
  });

  it('should add draft-only custom fields into extended_profile and top-level values', () => {
    const state = {
      accountSettings: {
        values: {
          extended_profile: [],
        },
        drafts: {
          cccd: '0999888777',
        },
        verifiedNameHistory: 'test',
        confirmationValues: {},
      },
    };

    const result = formValuesSelector(state);

    expect(result.cccd).toEqual('0999888777');
    expect(result.extended_profile).toContainEqual({ field_name: 'cccd', field_value: '0999888777' });
  });
});
