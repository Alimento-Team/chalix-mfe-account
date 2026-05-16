import { getConfig } from '@edx/frontend-platform';
import { injectIntl, intlShape } from '@edx/frontend-platform/i18n';
import { breakpoints, useWindowSize } from '@openedx/paragon';
import classNames from 'classnames';
import React from 'react';
import { NavHashLink } from 'react-router-hash-link';
import Scrollspy from 'react-scrollspy';
import messages from './AccountSettingsPage.messages';

const JumpNav = ({
  intl,
}) => {
  const stickToTop = useWindowSize().width > breakpoints.small.minWidth;

  const handleMobileNavigation = (event) => {
    const sectionId = event.target.value;
    if (!sectionId) {
      return;
    }

    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.replaceState(null, '', `#${sectionId}`);
    }
  };

  return (
    <div className={classNames('jump-nav px-2.25', { 'jump-nav-sm position-sticky pt-3': stickToTop })}>
      <div className="jump-nav-mobile d-md-none mb-3">
        <select
          className="form-control jump-nav-mobile-select"
          defaultValue=""
          onChange={handleMobileNavigation}
          aria-label="Jump to section"
        >
          <option value="" disabled>Jump to section</option>
          <option value="basic-information">
            {intl.formatMessage(messages['account.settings.section.account.information'])}
          </option>
          <option value="profile-information">
            {intl.formatMessage(messages['account.settings.section.profile.information'])}
          </option>
          <option value="social-media">
            {intl.formatMessage(messages['account.settings.section.social.media'])}
          </option>
          <option value="notifications">
            {intl.formatMessage(messages['notification.preferences.notifications.label'])}
          </option>
          <option value="site-preferences">
            {intl.formatMessage(messages['account.settings.section.site.preferences'])}
          </option>
          <option value="linked-accounts">
            {intl.formatMessage(messages['account.settings.section.linked.accounts'])}
          </option>
          {getConfig().ENABLE_ACCOUNT_DELETION && (
            <option value="delete-account">
              {intl.formatMessage(messages['account.settings.jump.nav.delete.account'])}
            </option>
          )}
        </select>
      </div>
      <Scrollspy
        items={[
          'basic-information',
          'profile-information',
          'social-media',
          'notifications',
          'site-preferences',
          'linked-accounts',
          'delete-account',
        ]}
        className="jump-nav-list list-unstyled"
        currentClassName="font-weight-bold"
        offset={-64}
      >
        <li>
          <NavHashLink to="#basic-information">
            {intl.formatMessage(messages['account.settings.section.account.information'])}
          </NavHashLink>
        </li>
        <li>
          <NavHashLink to="#profile-information">
            {intl.formatMessage(messages['account.settings.section.profile.information'])}
          </NavHashLink>
        </li>
        <li>
          <NavHashLink to="#social-media">
            {intl.formatMessage(messages['account.settings.section.social.media'])}
          </NavHashLink>
        </li>
        <li>
          <NavHashLink to="#notifications">
            {intl.formatMessage(messages['notification.preferences.notifications.label'])}
          </NavHashLink>
        </li>
        <li>
          <NavHashLink to="#site-preferences">
            {intl.formatMessage(messages['account.settings.section.site.preferences'])}
          </NavHashLink>
        </li>
        <li>
          <NavHashLink to="#linked-accounts">
            {intl.formatMessage(messages['account.settings.section.linked.accounts'])}
          </NavHashLink>
        </li>
        {getConfig().ENABLE_ACCOUNT_DELETION
          && (
          <li>
            <NavHashLink to="#delete-account">
              {intl.formatMessage(messages['account.settings.jump.nav.delete.account'])}
            </NavHashLink>
          </li>
          )}
      </Scrollspy>
    </div>
  );
};

JumpNav.propTypes = {
  intl: intlShape.isRequired,
};

export default injectIntl(JumpNav);
